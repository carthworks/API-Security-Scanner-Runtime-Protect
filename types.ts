// ─── Existing enums ───────────────────────────────────────────────────────────

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

// ─── Re-validation ────────────────────────────────────────────────────────────

export enum RevalidationStatus {
  Pending = 'Pending',
  InProgress = 'InProgress',
  Verified = 'Verified',
  Failed = 'Failed',
}

export interface Revalidation {
  status: RevalidationStatus;
  notes: string;
  date?: string; // ISO string
}

// ─── CVSS v3.1 ────────────────────────────────────────────────────────────────

export interface CvssMetrics {
  AV: 'N' | 'A' | 'L' | 'P';  // Attack Vector
  AC: 'L' | 'H';               // Attack Complexity
  PR: 'N' | 'L' | 'H';        // Privileges Required
  UI: 'N' | 'R';               // User Interaction
  S:  'U' | 'C';               // Scope
  C:  'N' | 'L' | 'H';        // Confidentiality
  I:  'N' | 'L' | 'H';        // Integrity
  A:  'N' | 'L' | 'H';        // Availability
}

export interface CvssScore {
  score: number;  // 0.0 – 10.0
  vector: string; // e.g. CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H
  metrics: CvssMetrics;
}

// ─── Status history ───────────────────────────────────────────────────────────

export interface StatusChange {
  status: VulnerabilityStatus;
  timestamp: string; // ISO string
}

// ─── Core vulnerability ───────────────────────────────────────────────────────

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
  evidence?: string;
  poc?: string;
  discoveredAt: string;
  assignee?: string;
  remediation?: string;         // AI-generated advice (cached)
  cvss?: CvssScore;             // CVSS v3.1 score
  revalidation?: Revalidation;  // Re-validation tracking
}

// ─── AI configuration ─────────────────────────────────────────────────────────

export type AIProvider = 'gemini' | 'ollama' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string;   // for Gemini
  baseUrl?: string;  // for Ollama / custom  (default: http://localhost:11434)
}

// ─── Load testing ─────────────────────────────────────────────────────────────

export interface LoadTestEndpoint {
  method: string;
  path: string;
  body?: Record<string, unknown>;
  expectedStatus?: number;
}

export interface LoadTestConfig {
  targetBaseUrl: string;
  endpoints: LoadTestEndpoint[];
  concurrentUsers: number;
  durationSeconds: number;
  rampUpSeconds: number;
  authHeaders?: Record<string, string>;
  requestTimeout?: number;
  verifySsl?: boolean;
}

export interface LoadTestMetric {
  timestamp: number;
  elapsedSeconds: number;
  rps: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  minMs: number;
  maxMs: number;
  errorRate: number;
  totalRequests: number;
  failedRequests: number;
  activeUsers: number;
  statusCodes: Record<string, number>;
}

export interface LoadTestSummary {
  totalRequests: number;
  totalFailures: number;
  avgRps: number;
  peakRps: number;
  avgResponseMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxResponseMs: number;
  overallErrorRate: number;
  statusCodeDistribution: Record<string, number>;
  stabilityRating: 'Stable' | 'Degraded' | 'Unstable' | 'Critical';
  slaBreach: boolean;
  durationSeconds: number;
}

export interface LoadTestJob {
  jobId: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  config: LoadTestConfig;
  metrics: LoadTestMetric[];
  summary?: LoadTestSummary;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

// ─── Engagement / Scope tracking ─────────────────────────────────────────────

export interface ScopeEndpoint {
  id: string;
  method: string;
  path: string;
  description?: string;
  owaspCategory: string;   // e.g. "API2:2023"
  riskLevel: string;       // Critical | High | Medium | Low
  tested: boolean;
  vulnerabilityIds: string[];
  notes: string;
}

export interface ComplianceItem {
  id: string;
  standard: string;        // e.g. "OWASP API Top 10"
  control: string;         // e.g. "API1:2023 - BOLA"
  status: 'Pass' | 'Fail' | 'Partial' | 'N/A';
  notes?: string;
}

export interface Engagement {
  id: string;
  name: string;
  targetBase: string;
  environment: string;
  startDate: string;
  status: 'Active' | 'Complete' | 'Paused';
  endpoints: ScopeEndpoint[];
  complianceItems: ComplianceItem[];
}

// ─── Scan job (mirrors backend) ───────────────────────────────────────────────

export interface ScanProgress {
  phase: 'connecting' | 'probing' | 'analysing' | 'ai_analysis' | 'complete' | 'failed';
  message: string;
  percent: number;
  found: number;
  currentCheck?: string;
}

export interface ScanJob {
  jobId: string;
  name: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  progress: ScanProgress;
  findings: Vulnerability[];
  endpointsTested: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}