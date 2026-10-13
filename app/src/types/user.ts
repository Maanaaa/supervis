export type UserRole = 'ASTREINTE' | 'ADMIN';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: UserRole;
  isOnDuty: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISessionPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  isOnDuty: boolean;
}
