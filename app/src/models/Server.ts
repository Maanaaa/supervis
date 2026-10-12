import { Schema, model, models, Model, Document, Types } from 'mongoose';
import { IServer, ServerStatus } from '@/types/server';

export interface IServerDocument extends Omit<IServer, '_id'>, Document {
  _id: Types.ObjectId;
}

const ServerSchema = new Schema<IServerDocument>(
  {
    name: {
      type: String,
      required: [true, 'Le nom du serveur est obligatoire.'],
      trim: true,
    },
    host: {
      type: String,
      required: [true, "L'hôte ou IP du serveur est obligatoire."],
      trim: true,
    },
    port: {
      type: Number,
      required: [true, 'Le port est obligatoire.'],
      default: 80,
    },
    healthUrl: {
      type: String,
      trim: true,
      default: '/health',
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['UP', 'DOWN', 'UNKNOWN'] as ServerStatus[],
        message: 'Le statut `{VALUE}` est invalide.',
      },
      default: 'UNKNOWN',
      index: true,
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    lastCheckAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index composé pour requêter rapidement les serveurs à sonder par date
ServerSchema.index({ status: 1, lastCheckAt: 1 });

export const Server: Model<IServerDocument> =
  models.Server || model<IServerDocument>('Server', ServerSchema);

export default Server;
