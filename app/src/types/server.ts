export type ServerStatus = 'UP' | 'DOWN' | 'UNKNOWN';

export interface IServer {
  _id: string;
  name: string;
  host: string;
  port: number;
  healthUrl?: string;
  description?: string;
  status: ServerStatus;
  latencyMs?: number;
  lastCheckAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
