/**
 * Unified AI service — all AI calls route through the FastAPI backend.
 * Supports Gemini, Ollama, and any OpenAI-compatible endpoint.
 */
import type { AIConfig, Vulnerability } from '../types';

export const BACKEND_URL = 'http://localhost:8000';

// ─── Re-export types used by consumers ───────────────────────────────────────

export interface CveInfo {
  summary: string;
  sources: { uri: string; title: string }[];
  cveIds: string[];
}

export interface CveDetails {
  description: string;
  cvss: { score: number; vector: string };
  affected: string;
  references: string[];
}

export interface ScannedVulnerability {
  type: string;
  owaspId: string;
  severity: string;
  endpoint: { method: string; path: string };
  description: string;
  details: string;
  cvss?: { score: number; vector: string; metrics: Record<string, string> };
  evidence?: string;
}

export interface ScanProgress {
  phase: string;
  message: string;
  percent: number;
  found: number;
  currentCheck?: string;
}

// ─── Core AI query ────────────────────────────────────────────────────────────

async function _queryAI(
  config: AIConfig,
  prompt: string,
  jsonMode = false,
): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/ai/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: config.provider,
      model: config.model,
      prompt,
      api_key: config.apiKey,
      base_url: config.baseUrl ?? 'http://localhost:11434',
      json_mode: jsonMode,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `AI query failed (${res.status})`);
  }
  const data = await res.json();
  return typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
}

// ─── Model listing ────────────────────────────────────────────────────────────

export async function getAvailableModels(
  provider: string,
  baseUrl = 'http://localhost:11434',
  apiKey?: string,
): Promise<{ models: string[]; online: boolean }> {
  try {
    const params = new URLSearchParams({ provider, base_url: baseUrl });
    if (apiKey) params.set('api_key', apiKey);
    const res = await fetch(`${BACKEND_URL}/api/ai/models?${params}`);
    if (!res.ok) return { models: [], online: false };
    return res.json();
  } catch {
    return { models: [], online: false };
  }
}

// ─── Remediation ─────────────────────────────────────────────────────────────

export async function getRemediation(
  vuln: Vulnerability,
  config: AIConfig,
): Promise<string> {
  const prompt = `You are an expert API security engineer.

Vulnerability: ${vuln.type} (${vuln.owaspId})
Endpoint: ${vuln.endpoint.method} ${vuln.endpoint.path}
Description: ${vuln.description}
Details: ${vuln.details}

Provide actionable, code-level remediation advice. Include:
1. Risk explanation
2. Recommended fix approach
3. Before/after code snippets (Node.js/Python/Java — pick most relevant)
Format with markdown.`;

  return _queryAI(config, prompt);
}

// ─── Related CVEs ─────────────────────────────────────────────────────────────

export async function getRelatedCVEs(
  vuln: Vulnerability,
  config: AIConfig,
): Promise<CveInfo> {
  const prompt = `You are a security intelligence analyst.

Vulnerability Type: "${vuln.type}"
OWASP Category: "${vuln.owaspId}"
Description: "${vuln.description}"

Find relevant publicly known CVEs or exploits. Include CVE IDs (e.g. CVE-2023-12345).
Format as markdown.`;

  const summary = await _queryAI(config, prompt);
  const cveRegex = /(CVE-\d{4}-\d{4,})/g;
  const foundCves: string[] = summary.match(cveRegex) || [];
  return { summary, sources: [], cveIds: [...new Set(foundCves)] };
}

// ─── CVE details ──────────────────────────────────────────────────────────────

export async function getCveDetails(
  cveId: string,
  config: AIConfig,
): Promise<CveDetails> {
  const prompt = `Provide a detailed breakdown for ${cveId}.
Respond ONLY with valid JSON matching this schema exactly:
{"description":"string","cvss":{"score":0.0,"vector":"string"},"affected":"string","references":["url"]}`;

  const raw = await _queryAI(config, prompt, true);
  try {
    return JSON.parse(raw) as CveDetails;
  } catch {
    return {
      description: raw,
      cvss: { score: 0, vector: 'N/A' },
      affected: 'Unknown',
      references: [],
    };
  }
}

// ─── VAPT Scan (via backend) ──────────────────────────────────────────────────

export interface StartScanParams {
  name: string;
  targetUrl: string;
  sourceType?: 'url' | 'spec';
  endpoints?: { method: string; path: string }[];
  owaspCategories?: string[];
  scanDepth?: string;
  authToken?: string;
  config: AIConfig;
}

export async function startScan(
  params: StartScanParams,
): Promise<{ jobId: string }> {
  const res = await fetch(`${BACKEND_URL}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: params.name,
      target_url: params.targetUrl,
      source_type: params.sourceType ?? 'url',
      endpoints: params.endpoints,
      owasp_categories: params.owaspCategories,
      scan_depth: params.scanDepth ?? 'Normal',
      auth_token: params.authToken,
      ai_provider: params.config.provider,
      ai_model: params.config.model,
      ai_api_key: params.config.apiKey,
      ai_base_url: params.config.baseUrl ?? 'http://localhost:11434',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Failed to start scan');
  }
  const data = await res.json();
  return { jobId: data.job_id };
}

export function streamScan(
  jobId: string,
  onProgress: (p: ScanProgress) => void,
  onComplete: (findings: ScannedVulnerability[]) => void,
  onError: (e: string) => void,
): EventSource {
  const es = new EventSource(`${BACKEND_URL}/api/scan/${jobId}/stream`);
  es.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.final) {
      es.close();
      onComplete(data.job?.findings ?? []);
    } else {
      onProgress(data.progress as ScanProgress);
    }
  };
  es.onerror = () => {
    es.close();
    onError('Connection to scan stream lost');
  };
  return es;
}

// ─── Parse spec file ──────────────────────────────────────────────────────────

export async function parseSpecFile(
  file: File,
): Promise<{ method: string; path: string; description?: string }[]> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BACKEND_URL}/api/spec/parse`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Spec parse failed');
  }
  return res.json();
}
