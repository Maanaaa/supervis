export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACK' | 'RESOLVED';

export interface IAlert {
  _id: string;
  serverId?: string;
  serverName: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  assignedTo?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  resolutionComment?: string;
  transferredFrom?: string[];
  createdAt: Date;
  updatedAt: Date;
}
