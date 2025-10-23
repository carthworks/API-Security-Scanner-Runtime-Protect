

export enum Severity {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
  Info = 'Info',
}

export enum VulnerabilityStatus {
    New = 'New',
    Acknowledged = 'Acknowledged',
    Fixed = 'Fixed',
}

export interface StatusChange {
  status: VulnerabilityStatus;
  timestamp: string; // ISO string
}

export interface Vulnerability {
  id: string;
  type: string;
  owaspId: string;
  description: string;
  severity: Severity;
  status: VulnerabilityStatus;
  statusHistory: StatusChange[];
  endpoint: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
  };
  details: string;
  discoveredAt: string;
  assignee?: string;
  remediation?: string; // Cache for AI-generated advice
}