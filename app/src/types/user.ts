export type UserRole = 'ASTREINTE' | 'ADMIN';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isOnDuty: boolean;
  createdAt: Date;
  updatedAt: Date;
}
