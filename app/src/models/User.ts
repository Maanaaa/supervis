import { Schema, model, models, Model, Document, Types } from 'mongoose';
import type { IUser, UserRole } from '@/types/user';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  _id: Types.ObjectId;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Le nom de l'opérateur est obligatoire."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: ['ASTREINTE', 'ADMIN'] as UserRole[],
        message: 'Le rôle `{VALUE}` est invalide.',
      },
      default: 'ASTREINTE',
    },
    isOnDuty: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUserDocument> = models.User || model<IUserDocument>('User', UserSchema);

export default User;
