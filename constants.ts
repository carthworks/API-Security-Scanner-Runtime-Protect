import { Severity, Vulnerability, VulnerabilityStatus } from './types';

export const VULNERABILITIES: Vulnerability[] = [
  {
    id: 'vuln-001',
    type: 'Broken Object Level Authorization',
    owaspId: 'API1:2023',
    description: 'An attacker is able to access user data belonging to another user by manipulating the object ID in the API request.',
    severity: Severity.Critical,
    status: VulnerabilityStatus.New,
    statusHistory: [
      { status: VulnerabilityStatus.New, timestamp: '2024-07-20T10:30:00Z' },
    ],
    endpoint: {
      method: 'GET',
      path: '/api/v1/users/{userId}/profile',
    },
    details: 'User with ID 123 was able to access the profile of user 456 by sending a GET request to /api/v1/users/456/profile. The API did not validate that the authenticated user (123) was authorized to view the requested profile (456).',
    discoveredAt: '2024-07-20T10:30:00Z',
  },
  {
    id: 'vuln-002',
    type: 'Broken Authentication',
    owaspId: 'API2:2023',
    description: 'The password reset functionality is vulnerable to brute-force attacks due to lack of rate limiting.',
    severity: Severity.High,
    status: VulnerabilityStatus.New,
    statusHistory: [
      { status: VulnerabilityStatus.New, timestamp: '2024-07-19T14:00:00Z' },
    ],
    endpoint: {
      method: 'POST',
      path: '/api/v1/auth/reset-password',
    },
    details: 'The /api/v1/auth/reset-password endpoint does not implement rate limiting, allowing an attacker to make thousands of attempts to guess a reset token without being blocked.',
    discoveredAt: '2024-07-19T14:00:00Z',
  },
  {
    id: 'vuln-003',
    type: 'Security Misconfiguration',
    owaspId: 'API8:2023',
    description: 'Verbose error messages reveal sensitive information about the underlying system architecture.',
    severity: Severity.Medium,
    status: VulnerabilityStatus.Acknowledged,
    statusHistory: [
      { status: VulnerabilityStatus.New, timestamp: '2024-07-18T09:15:00Z' },
      { status: VulnerabilityStatus.Acknowledged, timestamp: '2024-07-19T11:00:00Z' },
    ],
    endpoint: {
      method: 'POST',
      path: '/api/v2/orders',
    },
    details: 'When submitting a malformed JSON payload to /api/v2/orders, the API returns a full stack trace, including framework versions, library names, and internal file paths. This information could be used by an attacker to identify other vulnerabilities.',
    discoveredAt: '2024-07-18T09:15:00Z',
  },
  {
    id: 'vuln-004',
    type: 'Improper Inventory Management',
    owaspId: 'API9:2023',
    description: 'An outdated and vulnerable version of an API endpoint is still exposed to the public.',
    severity: Severity.High,
    status: VulnerabilityStatus.New,
    statusHistory: [
        { status: VulnerabilityStatus.New, timestamp: '2024-07-17T11:45:00Z' },
    ],
    endpoint: {
      method: 'GET',
      path: '/api/v1/products',
    },
    details: 'The endpoint /api/v1/products is still active, despite being replaced by /api/v2/products. The v1 endpoint uses a vulnerable dependency (log4j v2.14.0) that is no longer patched.',
    discoveredAt: '2024-07-17T11:45:00Z',
  },
  {
    id: 'vuln-005',
    type: 'Server Side Request Forgery',
    owaspId: 'API10:2023',
    description: 'The API endpoint for importing data from a URL can be manipulated to make requests to internal services.',
    severity: Severity.Critical,
    status: VulnerabilityStatus.Fixed,
    statusHistory: [
        { status: VulnerabilityStatus.New, timestamp: '2024-07-16T18:00:00Z' },
        { status: VulnerabilityStatus.Fixed, timestamp: '2024-07-17T09:30:00Z' },
    ],
    endpoint: {
      method: 'POST',
      path: '/api/v1/data/import',
    },
    details: 'The `source_url` parameter in the /api/v1/data/import request can be set to internal IP addresses (e.g., http://169.254.169.254/latest/meta-data), allowing an attacker to scan the internal network and access cloud provider metadata.',
    discoveredAt: '2024-07-16T18:00:00Z',
  },
    {
    id: 'vuln-006',
    type: 'Broken Function Level Authorization',
    owaspId: 'API5:2023',
    description: 'Regular users can access admin-only functionality by directly calling the API endpoint.',
    severity: Severity.High,
    status: VulnerabilityStatus.New,
    statusHistory: [
        { status: VulnerabilityStatus.New, timestamp: '2024-07-21T08:00:00Z' },
    ],
    endpoint: {
      method: 'POST',
      path: '/api/v1/admin/users/create',
    },
    details: 'A non-admin user was able to successfully create a new user by sending a POST request to the /api/v1/admin/users/create endpoint. This endpoint should be restricted to users with the "admin" role.',
    discoveredAt: '2024-07-21T08:00:00Z',
  },
];

export const NEW_SCAN_FINDING: Omit<Vulnerability, 'id' | 'endpoint' | 'discoveredAt' | 'statusHistory'> = {
  type: 'SQL Injection',
  owaspId: 'API3:2023',
  description: 'User-provided input is not properly sanitized, allowing an attacker to execute arbitrary SQL queries.',
  severity: Severity.Critical,
  status: VulnerabilityStatus.New,
  details: 'The `q` query parameter in the specified search endpoint is directly concatenated into a SQL query. An attacker can provide a payload like `\' OR 1=1; --` to extract sensitive data.',
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