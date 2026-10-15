import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import { Alert } from '@/models/Alert';
import { emitSocket } from '@/lib/socket';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/session';

interface PatchAlertBody {
  action?: 'ACK' | 'TRANSFER' | 'RESOLVE';
  operator?: string;
  currentOperator?: string;
  targetOperator?: string;
  resolutionComment?: string;
}

async function getAuthenticatedOperator(request: Request): Promise<string | null> {
  let token: string | undefined;

  try {
    const cookieStore = cookies();
    token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  } catch {
    // Hors contexte de requête App Router direct (ex: tests Jest)
  }

  if (!token) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }
  }

  if (!token) return null;

  const session = await verifySessionToken(token);
  return session ? session.name : null;
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
    const authenticatedOperator = await getAuthenticatedOperator(request);

    // 1. ACTION ACK : Prise en charge avec verrouillage atomique conditionnel
    if (action === 'ACK') {
      const { operator } = body;
      const requestedOperator = operator?.trim();

      // Sécurité anti-usurpation : si une session est active, interdire de prendre le ticket sous un autre nom
      if (
        authenticatedOperator &&
        requestedOperator &&
        requestedOperator !== authenticatedOperator
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Action non autorisée : tentative d'usurpation d'identité. Vous êtes authentifié en tant que "${authenticatedOperator}" et ne pouvez pas prendre de ticket sous l'identité de "${requestedOperator}".`,
          },
          { status: 403 }
        );
      }

      const assignedTo = authenticatedOperator || requestedOperator;
      if (!assignedTo) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Le champ operator ou une session authentifiée est requis pour prendre en charge une alerte.',
          },
          { status: 400 }
        );
      }

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

      // Sécurité anti-usurpation : si une session est active, vérifier que currentOperator correspond
      if (
        authenticatedOperator &&
        currentOperator &&
        currentOperator.trim() !== authenticatedOperator
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Action non autorisée : vous êtes authentifié en tant que "${authenticatedOperator}" et ne pouvez pas initier de transfert au nom de "${currentOperator}".`,
          },
          { status: 403 }
        );
      }

      const effectiveCurrentOperator = authenticatedOperator || currentOperator?.trim();

      if (!effectiveCurrentOperator) {
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

      if (effectiveCurrentOperator === targetOperator.trim()) {
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
          assignedTo: effectiveCurrentOperator,
        },
        {
          $set: {
            assignedTo: targetOperator.trim(),
          },
          $push: {
            transferredFrom: effectiveCurrentOperator,
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
