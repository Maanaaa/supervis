import { Schema, model, models, Model, Document, Types } from 'mongoose';
import { IAlert, AlertSeverity, AlertStatus } from '@/types/alert';

export interface IAlertDocument extends Omit<IAlert, '_id' | 'serverId'>, Document {
  _id: Types.ObjectId;
  serverId?: Types.ObjectId;
}

const AlertSchema = new Schema<IAlertDocument>(
  {
    serverId: {
      type: Schema.Types.ObjectId,
      ref: 'Server',
      index: true,
    },
    serverName: {
      type: String,
      required: [true, 'Le nom du serveur source est obligatoire.'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Le titre de l'alerte est obligatoire."],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Le message descriptif de l'alerte est obligatoire."],
      trim: true,
    },
    severity: {
      type: String,
      enum: {
        values: ['INFO', 'WARNING', 'CRITICAL'] as AlertSeverity[],
        message: 'La sévérité `{VALUE}` est invalide.',
      },
      default: 'WARNING',
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['OPEN', 'ACK', 'RESOLVED'] as AlertStatus[],
        message: 'Le statut `{VALUE}` est invalide.',
      },
      default: 'OPEN',
      index: true,
    },
    assignedTo: {
      type: String,
      trim: true,
    },
    acknowledgedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    resolutionComment: {
      type: String,
      trim: true,
    },
    transferredFrom: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index composés pour requêtes rapides du dashboard et de l'historique
AlertSchema.index({ status: 1, createdAt: -1 });
AlertSchema.index({ serverId: 1, createdAt: -1 });

export const Alert: Model<IAlertDocument> =
  models.Alert || model<IAlertDocument>('Alert', AlertSchema);

export default Alert;
