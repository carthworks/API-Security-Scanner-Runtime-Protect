import { Severity, Vulnerability, VulnerabilityStatus } from './types';

// --- Helper Functions for Data Generation ---
const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomDate = (start: Date, end: Date): Date => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// --- Data Pools for Realistic Generation ---
const vulnerabilityTemplates = [
  { type: 'Broken Object Level Authorization', owaspId: 'API1:2023', description: 'API does not properly validate that the user is authorized to access the requested object.' },
  { type: 'Broken Authentication', owaspId: 'API2:2023', description: 'Authentication mechanisms are implemented incorrectly, allowing attackers to compromise authentication tokens or exploit implementation flaws.' },
  { type: 'SQL Injection', owaspId: 'API3:2023', description: 'User-provided data is not validated, filtered, or sanitized by the application.' },
  { type: 'Broken Function Level Authorization', owaspId: 'API5:2023', description: 'Policies and roles are not properly aligned with the business functions of the API.' },
  { type: 'Security Misconfiguration', owaspId: 'API8:2023', description: 'Missing security hardening across any part of the application stack or improperly configured permissions.' },
  { type: 'Improper Inventory Management', owaspId: 'API9:2023', description: 'The API hosts outdated versions or exposes debug endpoints that should not be public.' },
  { type: 'Server Side Request Forgery', owaspId: 'API10:2023', description: 'A vulnerability that allows an attacker to induce the server-side application to make requests to an unintended location.' },
  { type: 'Cross-Site Scripting (XSS)', owaspId: 'A03:2021', description: 'Untrusted data is sent to a web browser without proper validation and escaping.' },
];

const apiEndpoints = [
  { method: 'GET', path: '/api/v1/users/{userId}/orders' },
  { method: 'POST', path: '/api/v2/payments/transaction' },
  { method: 'GET', path: '/api/v1/products/search' },
  { method: 'DELETE', path: '/api/v1/admin/users/{id}' },
  { method: 'PATCH', path: '/api/v2/profiles/me' },
  { method: 'POST', path: '/auth/v1/login' },
  { method: 'GET', path: '/api/v1/inventory/{itemId}' },
];

export const teamMembers = ['Alice', 'Bob', 'Charlie', 'Dana', 'Eve'];

/**
 * Generates a specified number of mock vulnerability entries.
 * @param count The number of vulnerabilities to generate.
 * @returns An array of mock Vulnerability objects.
 */
export const generateMockVulnerabilities = (count: number): Vulnerability[] => {
  const vulnerabilities: Vulnerability[] = [];
  const severities = Object.values(Severity);
  const statuses = Object.values(VulnerabilityStatus);

  for (let i = 0; i < count; i++) {
    const template = getRandomElement(vulnerabilityTemplates);
    const severity = getRandomElement(severities);
    const status = getRandomElement(statuses);
    const endpoint = getRandomElement(apiEndpoints);
    const discoveredAt = getRandomDate(new Date(2024, 0, 1), new Date());
    
    // Build a realistic status history
    const statusHistory: { status: VulnerabilityStatus; timestamp: string }[] = [
      { status: VulnerabilityStatus.New, timestamp: discoveredAt.toISOString() }
    ];

    if (status === VulnerabilityStatus.Acknowledged || status === VulnerabilityStatus.Fixed) {
        const acknowledgedAt = new Date(discoveredAt.getTime() + 86400000 * (Math.random() * 5)); // 1-5 days later
        statusHistory.push({ status: VulnerabilityStatus.Acknowledged, timestamp: acknowledgedAt.toISOString() });
        
        if (status === VulnerabilityStatus.Fixed) {
            const fixedAt = new Date(acknowledgedAt.getTime() + 86400000 * (Math.random() * 10)); // 1-10 days later
            statusHistory.push({ status: VulnerabilityStatus.Fixed, timestamp: fixedAt.toISOString() });
        }
    }

    const assignee = Math.random() > 0.4 ? getRandomElement(teamMembers) : undefined;

    const vulnerability: Vulnerability = {
      id: `vuln-gen-${Date.now()}-${i}`,
      type: template.type,
      owaspId: template.owaspId,
      description: template.description,
      details: `A potential ${template.type} issue was detected on the ${endpoint.path} endpoint. Further investigation is required. This is a mock entry generated for demonstration purposes.`,
      severity,
      status,
      statusHistory,
      endpoint: endpoint as Vulnerability['endpoint'],
      discoveredAt: discoveredAt.toISOString(),
      assignee,
    };
    vulnerabilities.push(vulnerability);
  }

  // Sort by discovery date, newest first
  return vulnerabilities.sort((a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime());
};

// Generate 50 mock vulnerabilities for the application to use
export const VULNERABILITIES: Vulnerability[] = generateMockVulnerabilities(50);

export const NEW_SCAN_FINDING: Omit<Vulnerability, 'id' | 'endpoint' | 'discoveredAt' | 'statusHistory'> = {
  type: 'SQL Injection',
  owaspId: 'API3:2023',
  description: 'User-provided input is not properly sanitized, allowing an attacker to execute arbitrary SQL queries.',
  severity: Severity.Critical,
  status: VulnerabilityStatus.New,
  details: 'The `q` query parameter in the specified search endpoint is directly concatenated into a SQL query. An attacker can provide a payload like `\' OR 1=1; --` to extract sensitive data.',
  assignee: undefined,
};

export const severityConfig: { [key in Severity]: { color: string; bg: string } } = {
  [Severity.Critical]: { color: 'text-red-400', bg: 'bg-red-900/50' },
  [Severity.High]: { color: 'text-orange-400', bg: 'bg-orange-900/50' },
  [Severity.Medium]: { color: 'text-yellow-400', bg: 'bg-yellow-900/50' },
  [Severity.Low]: { color: 'text-blue-400', bg: 'bg-blue-900/50' },
  [Severity.Info]: { color: 'text-purple-400', bg: 'bg-purple-900/50' },
};

export const severityDotColor: { [key in Severity]: string } = {
    [Severity.Critical]: 'bg-red-500',
    [Severity.High]: 'bg-orange-500',
    [Severity.Medium]: 'bg-yellow-500',
    [Severity.Low]: 'bg-blue-400',
    [Severity.Info]: 'bg-purple-400',
};

export const statusConfig: { [key in VulnerabilityStatus]: { color: string; bg: string } } = {
    [VulnerabilityStatus.New]: { color: 'text-blue-400', bg: 'bg-blue-900/50' },
    [VulnerabilityStatus.Acknowledged]: { color: 'text-yellow-400', bg: 'bg-yellow-900/50' },
    [VulnerabilityStatus.Fixed]: { color: 'text-green-400', bg: 'bg-green-900/50' },
};

export const statusTimelineDotColor: { [key in VulnerabilityStatus]: string } = {
    [VulnerabilityStatus.New]: 'bg-blue-500 ring-4 ring-gray-800',
    [VulnerabilityStatus.Acknowledged]: 'bg-yellow-500 ring-4 ring-gray-800',
    [VulnerabilityStatus.Fixed]: 'bg-green-500 ring-4 ring-gray-800',
};