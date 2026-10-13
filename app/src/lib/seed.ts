import { connectDB } from './db';
import { User } from '@/models/User';
import { hashPassword } from './auth';

export const DEFAULT_OPERATORS = [
  {
    name: 'Théo',
    email: 'theo@supervis.local',
    phone: '+33 6 00 00 00 01',
    role: 'ADMIN' as const,
    isOnDuty: true,
    defaultPassword: 'admin',
  },
  {
    name: 'Sarah',
    email: 'sarah@supervis.local',
    phone: '+33 6 00 00 00 02',
    role: 'ASTREINTE' as const,
    isOnDuty: true,
    defaultPassword: 'admin',
  },
];

/**
 * Initialise ou met à jour les 2 opérateurs par défaut de manière idempotente.
 */
export async function seedDefaultOperators(): Promise<void> {
  try {
    await connectDB();

    for (const op of DEFAULT_OPERATORS) {
      const existingUser = await User.findOne({ email: op.email }).select('+password');

      if (!existingUser) {
        await User.create({
          name: op.name,
          email: op.email,
          phone: op.phone,
          role: op.role,
          isOnDuty: op.isOnDuty,
          password: hashPassword(op.defaultPassword),
        });
        console.log(`[Seed] Opérateur créé avec succès : ${op.name} (${op.email})`);
      } else if (!existingUser.password) {
        // Si l'utilisateur existait déjà (créé avant l'ADR-0008 sans mot de passe)
        existingUser.password = hashPassword(op.defaultPassword);
        existingUser.name = op.name;
        existingUser.role = op.role;
        existingUser.isOnDuty = op.isOnDuty;
        await existingUser.save();
        console.log(`[Seed] Mot de passe initialisé pour l'opérateur : ${op.name}`);
      }
    }
  } catch (error) {
    console.error('[Seed] Erreur lors de l’amorçage des opérateurs par défaut :', error);
  }
}
