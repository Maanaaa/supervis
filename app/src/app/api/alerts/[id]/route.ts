import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Alert } from '@/models/Alert';
import { emitSocket } from '@/lib/socket';

interface PatchAlertBody {
  action?: 'ACK' | 'TRANSFER' | 'RESOLVE';
  operator?: string;
  currentOperator?: string;
  targetOperator?: string;
  resolutionComment?: string;
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Identifiant d’alerte invalide.' },
        { status: 400 }
      );
    }

    const alert = await Alert.findById(id);
    if (!alert) {
      return NextResponse.json({ success: false, error: 'Alerte introuvable.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, alert });
  } catch (error: unknown) {
    console.error('[API Alert [id] GET] Erreur :', error);
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Identifiant d’alerte invalide.' },
        { status: 400 }
      );
    }

    let body: PatchAlertBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Corps de requête JSON invalide.' },
        { status: 400 }
      );
    }

    const { action } = body;

    // 1. ACTION ACK : Prise en charge avec verrouillage atomique conditionnel
    if (action === 'ACK') {
      const { operator } = body;
      if (!operator || typeof operator !== 'string' || operator.trim() === '') {
        return NextResponse.json(
          {
            success: false,
            error: 'Le champ operator est requis pour prendre en charge une alerte.',
          },
          { status: 400 }
        );
      }

      const assignedTo = operator.trim();

      // Opération atomique MongoDB : condition stricte sur status: 'OPEN'
      const updatedAlert = await Alert.findOneAndUpdate(
        { _id: id, status: 'OPEN' },
        {
          $set: {
            status: 'ACK',
            assignedTo,
            acknowledgedAt: new Date(),
          },
        },
        { new: true }
      );

      if (!updatedAlert) {
        // Détection de collision ou d'alerte déjà traitée
        const existingAlert = await Alert.findById(id);
        if (!existingAlert) {
          return NextResponse.json(
            { success: false, error: 'Alerte introuvable.' },
            { status: 404 }
          );
        }

        // 409 Conflict : Alerte déjà prise par un collègue ou résolue
        return NextResponse.json(
          {
            success: false,
            error: `Cette alerte n'est plus disponible (déjà prise en charge par ${existingAlert.assignedTo || 'un autre opérateur'}).`,
            currentStatus: existingAlert.status,
            assignedTo: existingAlert.assignedTo,
          },
          { status: 409 }
        );
      }

      // Diffusion instantanée à tous les techniciens connectés
      emitSocket('alert:updated', updatedAlert.toJSON());

      return NextResponse.json({
        success: true,
        alert: updatedAlert,
      });
    }

    // 2. ACTION TRANSFER : Délégation d'un ticket (réservée au titulaire actuel)
    if (action === 'TRANSFER') {
      const { currentOperator, targetOperator } = body;

      if (
        !currentOperator ||
        typeof currentOperator !== 'string' ||
        currentOperator.trim() === ''
      ) {
        return NextResponse.json(
          { success: false, error: 'Le champ currentOperator est requis pour un transfert.' },
          { status: 400 }
        );
      }

      if (!targetOperator || typeof targetOperator !== 'string' || targetOperator.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Le champ targetOperator est requis pour un transfert.' },
          { status: 400 }
        );
      }

      if (currentOperator.trim() === targetOperator.trim()) {
        return NextResponse.json(
          { success: false, error: 'L’opérateur cible doit être différent de l’opérateur actuel.' },
          { status: 400 }
        );
      }

      // Condition stricte : seul le technicien assigné peut transférer
      const updatedAlert = await Alert.findOneAndUpdate(
        {
          _id: id,
          status: 'ACK',
          assignedTo: currentOperator.trim(),
        },
        {
          $set: {
            assignedTo: targetOperator.trim(),
          },
          $push: {
            transferredFrom: currentOperator.trim(),
          },
        },
        { new: true }
      );

      if (!updatedAlert) {
        const existingAlert = await Alert.findById(id);
        if (!existingAlert) {
          return NextResponse.json(
            { success: false, error: 'Alerte introuvable.' },
            { status: 404 }
          );
        }

        if (existingAlert.status !== 'ACK') {
          return NextResponse.json(
            {
              success: false,
              error: 'Seule une alerte en cours de prise en charge (ACK) peut être transférée.',
            },
            { status: 409 }
          );
        }

        // Tentative d'appropriation ou de transfert non autorisé
        return NextResponse.json(
          {
            success: false,
            error: `Seul le titulaire actuel (${existingAlert.assignedTo}) est autorisé à transférer ce ticket.`,
          },
          { status: 403 }
        );
      }

      emitSocket('alert:updated', updatedAlert.toJSON());

      return NextResponse.json({
        success: true,
        alert: updatedAlert,
      });
    }

    // 3. ACTION RESOLVE : Clôture de l'alerte
    if (action === 'RESOLVE') {
      const { resolutionComment } = body;

      const updatedAlert = await Alert.findOneAndUpdate(
        {
          _id: id,
          status: { $in: ['OPEN', 'ACK'] },
        },
        {
          $set: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
            resolutionComment: resolutionComment?.trim() || undefined,
          },
        },
        { new: true }
      );

      if (!updatedAlert) {
        const existingAlert = await Alert.findById(id);
        if (!existingAlert) {
          return NextResponse.json(
            { success: false, error: 'Alerte introuvable.' },
            { status: 404 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            error: 'Cette alerte a déjà été résolue.',
            currentStatus: existingAlert.status,
          },
          { status: 409 }
        );
      }

      emitSocket('alert:updated', updatedAlert.toJSON());

      return NextResponse.json({
        success: true,
        alert: updatedAlert,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Action non reconnue. Les actions valides sont : 'ACK', 'TRANSFER', 'RESOLVE'.",
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error('[API Alert [id] PATCH] Erreur :', error);
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
