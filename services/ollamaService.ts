import type { Vulnerability, Severity, VulnerabilityStatus } from '../types';

export const OLLAMA_URL = 'http://localhost:11434';

// ─── Scan result types ────────────────────────────────────────────────────────

export interface ScanProgress {
    phase: 'connecting' | 'analysing' | 'parsing' | 'done' | 'error';
    message: string;
    /** Partial results as they accumulate */
    found: number;
}

export interface ScannedVulnerability {
    type: string;
    owaspId: string;
    severity: Severity;
    endpoint: { method: string; path: string };
    description: string;
    details: string;
}

// ─── Core scan function ───────────────────────────────────────────────────────

/**
 * Ask a local Ollama model to analyse an API target and return structured
 * vulnerability findings.  Calls onProgress with live phase updates.
 * Returns an empty array (not throws) on Ollama errors so callers can
 * fall back to mock data.
 */
export const scanForVulnerabilities = async (
    target: string,
    sourceType: 'url' | 'folder',
    model: string = 'llama2',
    onProgress?: (p: ScanProgress) => void,
): Promise<ScannedVulnerability[]> => {

    const emit = (phase: ScanProgress['phase'], message: string, found = 0) =>
        onProgress?.({ phase, message, found });

    emit('connecting', `Connecting to Ollama (${model})…`);

    const prompt = `You are an expert API security scanner. Analyse the following ${sourceType === 'url' ? 'API endpoint' : 'local codebase folder'} for security vulnerabilities:

Target: ${target}

Your task is to identify realistic API security vulnerabilities that could exist at this target. Consider OWASP API Security Top 10 (2023), common injection flaws, authentication issues, authorisation bypasses, and misconfigurations.

Respond ONLY with a valid JSON array (no markdown fences, no extra text) of vulnerability objects matching this EXACT schema:

[
  {
    "type": "Short vulnerability name",
    "owaspId": "API1:2023",
    "severity": "Critical|High|Medium|Low|Info",
    "endpoint": { "method": "GET|POST|PUT|DELETE|PATCH", "path": "/api/v1/example" },
    "description": "One sentence description of the issue.",
    "details": "Detailed technical description of how this vulnerability manifests and what an attacker could do."
  }
]

Return between 2 and 6 findings. Make paths realistic for the target. Do NOT wrap in markdown.`;

    try {
        emit('connecting', 'Sending scan request to Ollama…');

        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt,
                stream: false,
                format: 'json',
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama responded ${response.status}: ${response.statusText}`);
        }

        emit('analysing', `Model ${model} is analysing the target…`);

        const data = await response.json();
        const raw: string = data.response?.trim() ?? '';

        emit('parsing', 'Parsing vulnerability findings…');

        // Strip accidental markdown fences
        const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();

        let parsed: ScannedVulnerability[] = [];

        try {
            const result = JSON.parse(cleaned);
            parsed = Array.isArray(result) ? result : (result.vulnerabilities ?? []);
        } catch {
            // Try to extract a JSON array embedded in the text
            const match = cleaned.match(/\[[\s\S]*\]/);
            if (match) {
                parsed = JSON.parse(match[0]);
            }
        }

        emit('done', `Found ${parsed.length} vulnerability${parsed.length !== 1 ? 'ies' : 'y'}.`, parsed.length);
        return parsed;

    } catch (err) {
        console.error('scanForVulnerabilities error:', err);
        emit('error', err instanceof Error ? err.message : 'Ollama scan failed.');
        return []; // Caller should fall back to mock data
    }
};

export interface CveInfo {
    summary: string;
    sources: { uri: string; title: string }[];
    cveIds: string[];
}

export interface CveDetails {
    description: string;
    cvss: {
        score: number;
        vector: string;
    };
    affected: string;
    references: string[];
}

export const getAvailableModels = async (): Promise<string[]> => {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/tags`);
        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.statusText}`);
        }
        const data = await response.json();
        return data.models.map((m: any) => m.name);
    } catch (error) {
        console.error("Error fetching Ollama models:", error);
        return [];
    }
};

export const getRemediation = async (vulnerability: Vulnerability, model: string = 'llama2'): Promise<string> => {
    const prompt = `
You are an expert API security engineer providing remediation advice for a vulnerability detected by a security scanner.

**Vulnerability Details:**
- **Type:** ${vulnerability.type} (${vulnerability.owaspId})
- **Endpoint:** ${vulnerability.endpoint.method} ${vulnerability.endpoint.path}
- **Description:** ${vulnerability.description}
- **Specifics:** ${vulnerability.details}

**Your Task:**
Provide a clear, actionable, and code-level remediation suggestion to fix this vulnerability.
1.  **Explain the Risk:** Briefly explain the security risk in simple terms.
2.  **Provide a Solution:** Describe the recommended approach to fix the issue.
3.  **Show Code Examples:** Provide "Before" (vulnerable) and "After" (fixed) code snippets. Assume a common backend framework like Node.js with Express, Python with Flask/Django, or Java with Spring Boot. Choose the most appropriate one for the vulnerability type. Make the code examples clear and easy to understand.
4.  **Format the output:** Use markdown for formatting, especially for code blocks.
`;

    try {
        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama generation failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error("Error generating remediation with Ollama:", error);
        throw new Error("Failed to communicate with local Ollama service.");
    }
};

export const getRelatedCVEs = async (vulnerability: Vulnerability, model: string = 'llama2'): Promise<CveInfo> => {
    const prompt = `
You are a security intelligence analyst. Your task is to find publicly known CVEs (Common Vulnerabilities and Exposures) or exploits related to the following API vulnerability. Rely on your pre-trained knowledge.

**Vulnerability Type:** "${vulnerability.type}"
**OWASP Category:** "${vulnerability.owaspId}"
**Description:** "${vulnerability.description}"

**Your Response should include:**
1.  A brief summary of any highly relevant CVEs. For each CVE, include its ID (e.g., CVE-2023-12345) and a short description of its impact.
2.  Mention if there are well-known public exploits or attack patterns associated with this type of vulnerability.
3.  If no specific CVEs directly match, explain the general class of CVEs that this vulnerability falls under.

Keep the response concise and focused on actionable intelligence for a developer. Format the output as markdown.
`;

    try {
        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama generation failed: ${response.statusText}`);
        }

        const data = await response.json();
        const summary = data.response;
        
        const cveRegex = /(CVE-\d{4}-\d{4,})/g;
        const foundCves: string[] = summary.match(cveRegex) || [];
        const uniqueCves = [...new Set(foundCves)];

        return {
            summary: summary,
            sources: [], // Ollama doesn't provide live sources
            cveIds: uniqueCves
        };
    } catch (error) {
        console.error("Error fetching CVEs with Ollama:", error);
        throw new Error("Failed to communicate with local Ollama service. Make sure it's running.");
    }
};

export const getCveDetails = async (cveId: string, model: string = 'llama2'): Promise<CveDetails> => {
    const prompt = `
Provide a detailed breakdown for the following CVE: ${cveId}. Use your pre-trained knowledge.
Respond ONLY with a valid JSON object matching this schema exactly. Provide NO OTHER TEXT outside the JSON object.

Schema:
{
  "description": "A detailed summary of the vulnerability.",
  "cvss": {
    "score": 9.8,
    "vector": "CVSS vector string"
  },
  "affected": "A summary of affected software and versions.",
  "references": ["url1", "url2"]
}
`;

    try {
        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false,
                format: "json"
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama generation failed: ${response.statusText}`);
        }

        const data = await response.json();
        return JSON.parse(data.response.trim());
    } catch (error) {
        console.error(`Error fetching CVE details for ${cveId} with Ollama:`, error);
        throw new Error(`Failed to fetch details for ${cveId} via Ollama.`);
    }
};
