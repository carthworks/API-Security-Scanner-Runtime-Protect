import { GoogleGenAI, Type } from "@google/genai";
import type { Vulnerability } from '../types';

const getApiKey = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        // In a real app, you'd want to handle this more gracefully.
        // For this example, we'll throw an error to make it clear.
        throw new Error("API_KEY environment variable not set.");
    }
    return apiKey;
};

export const getRemediation = async (vulnerability: Vulnerability): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });

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

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });
        
        return response.text;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to communicate with the AI service.");
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


export const getRelatedCVEs = async (vulnerability: Vulnerability): Promise<CveInfo> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });

        const prompt = `
You are a security intelligence analyst. Your task is to find publicly known CVEs (Common Vulnerabilities and Exposures) or exploits related to the following API vulnerability.

**Vulnerability Type:** "${vulnerability.type}"
**OWASP Category:** "${vulnerability.owaspId}"
**Description:** "${vulnerability.description}"

Use your knowledge and Google Search to find relevant information.

**Your Response should include:**
1.  A brief summary of any highly relevant CVEs. For each CVE, include its ID (e.g., CVE-2023-12345) and a short description of its impact.
2.  Mention if there are well-known public exploits or attack patterns associated with this type of vulnerability.
3.  If no specific CVEs directly match, explain the general class of CVEs that this vulnerability falls under.

Keep the response concise and focused on actionable intelligence for a developer. Format the output as markdown.
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        
        const summary = response.text;
        
        const cveRegex = /(CVE-\d{4}-\d{4,})/g;
        const foundCves = summary.match(cveRegex) || [];
        const uniqueCves = [...new Set(foundCves)];
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        const sources = groundingChunks
            .map(chunk => chunk.web)
            .filter((web): web is { uri: string; title: string } => Boolean(web && web.uri && web.title));

        const uniqueSourcesMap = new Map<string, { uri: string; title: string }>();
        for (const source of sources) {
            uniqueSourcesMap.set(source.uri, source);
        }
        const uniqueSources = Array.from(uniqueSourcesMap.values());

        return {
            summary: summary,
            sources: uniqueSources,
            cveIds: uniqueCves
        };

    } catch (error) {
        console.error("Error calling Gemini API for CVEs:", error);
        throw new Error("Failed to communicate with the AI service for CVE information.");
    }
};

export const getCveDetails = async (cveId: string): Promise<CveDetails> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });

        const prompt = `Provide a detailed breakdown for the following CVE: ${cveId}. Use your search capabilities to find accurate information.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING, description: "A detailed summary of the vulnerability." },
                        cvss: {
                            type: Type.OBJECT,
                            description: "CVSS scoring information.",
                            properties: {
                                score: { type: Type.NUMBER, description: "The base CVSS score, e.g., 9.8" },
                                vector: { type: Type.STRING, description: "The CVSS vector string, e.g., CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" }
                            },
                            // FIX: Added `required` to the nested cvss object schema to ensure its properties are always included.
                            required: ["score", "vector"],
                        },
                        affected: { type: Type.STRING, description: "A summary of affected software and versions." },
                        references: {
                            type: Type.ARRAY,
                            description: "An array of official source URLs (e.g., from NIST, MITRE).",
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["description", "cvss", "affected", "references"]
                }
            },
        });

        // Cast the parsed JSON to the CveDetails type. This resolves an error
        // where the `references` property, inferred as `unknown[]` from JSON.parse,
        // was not assignable to the expected `string[]` type in CveDetails.
        return JSON.parse(response.text) as CveDetails;

    } catch (error) {
        console.error(`Error calling Gemini API for CVE details (${cveId}):`, error);
        throw new Error(`Failed to communicate with the AI service for details on ${cveId}.`);
    }
};
