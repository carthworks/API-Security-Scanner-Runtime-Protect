# SOW-Aligned Full-Stack Implementation Plan

## Decisions Confirmed
- **AI:** Multi-model — configurable across Gemini API, Ollama, or any OpenAI-compatible endpoint
- **Reports:** Downloadable PDF via `jspdf` + `jspdf-autotable`
- **Load Testing:** Real HTTP load testing via **FastAPI + Locust/httpx** backend
- **Mock data:** Zero — all data from real scans or real API calls

---

## Architecture Overview

```
┌─────────────────────────────────────┐     ┌──────────────────────────────────┐
│         Frontend (Vite + React)      │────▶│     Backend (FastAPI / Python)   │
│  localhost:5173                      │◀────│     localhost:8000               │
│                                      │     │                                  │
│  services/aiService.ts (unified)     │     │  /api/scan          (VAPT)       │
│    ├─ Gemini API (cloud)             │     │  /api/load-test     (Load test)  │
│    ├─ Ollama  (local)               │     │  /api/report/pdf    (PDF gen)    │
│    └─ Custom OpenAI-compat endpoint  │     │  /api/models        (AI models)  │
│                                      │     │  /api/parse-spec    (OpenAPI)    │
└─────────────────────────────────────┘     └──────────────────────────────────┘
```

---

## Proposed Changes

---

### Phase 1 — Backend: FastAPI Service

#### [NEW] `backend/` directory

```
backend/
├── main.py              # FastAPI app + CORS
├── routers/
│   ├── scan.py          # VAPT scanning endpoints
│   ├── load_test.py     # Real HTTP load testing with httpx + asyncio
│   ├── reports.py       # PDF report generation
│   ├── ai.py            # Unified AI proxy (Gemini / Ollama / custom)
│   └── spec_parser.py   # Swagger/OpenAPI/Postman spec parsing
├── models/
│   ├── scan_models.py   # Pydantic request/response models
│   ├── load_models.py   # Load test config + result models
│   └── report_models.py # Report data models
├── services/
│   ├── scanner.py       # VAPT logic: sends probes, checks OWASP categories
│   ├── load_runner.py   # Async concurrent HTTP runner with metrics collection
│   ├── ai_service.py    # AI router: dispatches to Gemini/Ollama/custom
│   └── pdf_service.py   # ReportLab/FPDF2 PDF report builder
├── requirements.txt
└── .env.example
```

**Key backend routes:**

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/scan` | Run VAPT scan on target URL, returns structured findings |
| `GET` | `/api/scan/{job_id}` | Stream scan progress via SSE |
| `POST` | `/api/load-test` | Start a load test job |
| `GET` | `/api/load-test/{job_id}/stream` | Stream live load test metrics (SSE) |
| `GET` | `/api/load-test/{job_id}/results` | Fetch final load test results |
| `POST` | `/api/report/pdf` | Generate and return PDF binary for given report type |
| `POST` | `/api/ai/query` | Unified AI proxy — accepts `{provider, model, prompt}` |
| `GET` | `/api/ai/models` | List available models for all configured providers |
| `POST` | `/api/spec/parse` | Parse OpenAPI/Swagger/Postman JSON or YAML, return endpoint list |

**Dependencies (`requirements.txt`):**
```
fastapi>=0.115
uvicorn[standard]>=0.29
httpx>=0.27
pydantic>=2.7
python-dotenv>=1.0
google-generativeai>=0.8
fpdf2>=2.8          # PDF generation
pyyaml>=6.0         # YAML spec parsing
python-multipart>=0.0.9
```

**Load Testing approach:**
- Uses `httpx.AsyncClient` with a configurable concurrency pool
- Spawns `concurrent_users` async tasks, each sending requests at configured RPS
- Collects: response times (p50/p95/p99), error rates, status code distribution, throughput
- Streams metrics every second via Server-Sent Events to frontend
- Respects `ramp_up` duration before hitting full concurrency

---

### Phase 2 — Frontend: Unified AI Service

#### [NEW] `services/aiService.ts`

Replaces the separate `geminiService.ts` + `ollamaService.ts` for all AI operations. Routes to backend `/api/ai/query`:

```typescript
export type AIProvider = 'gemini' | 'ollama' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string;       // for Gemini
  baseUrl?: string;      // for Ollama / custom OpenAI-compat
}

// Unified interface for all AI calls
export const queryAI = async (config: AIConfig, prompt: string): Promise<string>
export const getRemediation = async (config: AIConfig, vuln: Vulnerability): Promise<string>
export const getRelatedCVEs = async (config: AIConfig, vuln: Vulnerability): Promise<CveInfo>
export const getCveDetails = async (config: AIConfig, cveId: string): Promise<CveDetails>
export const scanForVulnerabilities = async (config: AIConfig, target: string, ...): Promise<ScannedVulnerability[]>
```

**`ollamaService.ts` and `geminiService.ts`** — kept as thin wrappers or removed (backend handles dispatch).

---

### Phase 3 — Types: `types.ts`

#### [MODIFY] [types.ts](file:///c:/Users/tkart/Dev/products/api_scanner/types.ts)

Add:
```typescript
// CVSS v3.1
export interface CvssMetrics {
  AV: 'N'|'A'|'L'|'P'; AC: 'L'|'H'; PR: 'N'|'L'|'H';
  UI: 'N'|'R'; S: 'U'|'C'; C: 'N'|'L'|'H'; I: 'N'|'L'|'H'; A: 'N'|'L'|'H';
}
export interface CvssScore { score: number; vector: string; metrics: CvssMetrics; }

// Re-validation
export enum RevalidationStatus { Pending='Pending', InProgress='InProgress', Verified='Verified', Failed='Failed' }
export interface Revalidation { status: RevalidationStatus; notes: string; date?: string; }

// Add to Vulnerability:
//   cvss?: CvssScore
//   revalidation?: Revalidation

// Load Testing
export interface LoadTestConfig {
  targetUrl: string; concurrentUsers: number; durationSeconds: number;
  rampUpSeconds: number; endpoints: {method:string; path:string}[];
}
export interface LoadTestMetric { timestamp: number; rps: number; p50ms: number; p95ms: number; p99ms: number; errorRate: number; }
export interface LoadTestResult {
  id: string; config: LoadTestConfig; status: 'running'|'complete'|'failed';
  metrics: LoadTestMetric[]; summary?: LoadTestSummary;
}

// Engagement / Scope
export interface ScopeEndpoint {
  id: string; method: string; path: string; category: string;
  owaspCategory: string; tested: boolean; riskLevel: string; notes: string;
}
export interface Engagement {
  id: string; name: string; targetBase: string;
  endpoints: ScopeEndpoint[]; startDate: string; status: string;
}

// AI Config
export type AIProvider = 'gemini' | 'ollama' | 'custom';
export interface AIConfig { provider: AIProvider; model: string; apiKey?: string; baseUrl?: string; }
```

---

### Phase 4 — New Component: `CvssCalculator.tsx`

#### [NEW] `components/CvssCalculator.tsx`

- Interactive CVSS v3.1 base metric dropdowns
- Auto-calculates numeric score and severity rating
- Displays vector string `CVSS:3.1/AV:N/...`
- "Save to Vulnerability" button persists score
- Used inside `VulnerabilityDetail` panel

---

### Phase 5 — New Page: `LoadTestingView.tsx`

#### [NEW] `components/LoadTestingView.tsx`

Full new page with 2 panels:

**Left — Config Panel:**
- Target base URL
- Endpoint selection (from scope or manual add)
- Concurrent users slider: 10–1000
- Duration: 30s / 1m / 5m / 15m / 30m
- Ramp-up period
- Auth headers (optional)
- "Start Load Test" button → calls `POST /api/load-test`

**Right — Live Results Panel (streams from SSE):**
- Real-time recharts LineChart: RPS, p50/p95/p99 response time, error rate
- Live counters: Total requests, errors, current RPS
- System stability indicator
- Post-test: Summary table + "Export Load Test Report PDF" button

---

### Phase 6 — New Page: `ReportsView.tsx`

#### [NEW] `components/ReportsView.tsx`

4 report cards, each with "Generate" and "Download PDF":

1. **Detailed VAPT Report** — full findings, CVSS scores, PoC, remediation, OWASP mapping
2. **Executive Summary** — 1-page: scope, dates, severity counts, overall posture
3. **Load Testing Report** — config, charts summary, metrics table, recommendations
4. **Attestation Certificate** — formal 1-page certificate (professional design, suitable for sharing)

PDF generation: calls `POST /api/report/pdf` with report type + current vulnerability/load test data. Returns blob → triggers browser download.

Frontend also uses `jspdf` + `jspdf-autotable` for client-side fallback.

---

### Phase 7 — New Page: `EngagementView.tsx`

#### [NEW] `components/EngagementView.tsx`

Tracks the 25-endpoint assessment scope per SOW:

- **Endpoint Registry table**: method, path, OWASP category, risk level, tested ✓, notes
- **Import** from Swagger/OpenAPI/Postman via `POST /api/spec/parse`
- **Progress bar**: "18 / 25 endpoints assessed"
- **Re-validation queue**: vulnerabilities marked Fixed → awaiting re-test
- **Compliance checklist**: CERT-In / OWASP API Top 10 / ISO 27001 controls / NIST SP 800-115
- **Client Responsibilities checklist**: API docs, test credentials, test data ✓/✗

---

### Phase 8 — Enhanced Scan Modal

#### [MODIFY] [NewScanModal.tsx](file:///c:/Users/tkart/Dev/products/api_scanner/components/NewScanModal.tsx)

- Add **3rd source: OpenAPI/Swagger/Postman** file upload → calls `/api/spec/parse`
- Add **OWASP category selector** (API1–API10 checkboxes to include in scan)
- Add **methodology phase tracker** in scanning step (7-phase SOW methodology)
- Replace Ollama-only scan call with backend `/api/scan` (SSE streaming)
- Scan results include `cvss` score populated by backend AI
- Remove all fallback mock logic

---

### Phase 9 — Enhanced Existing Views

#### [MODIFY] [VulnerabilitiesView.tsx](file:///c:/Users/tkart/Dev/products/api_scanner/components/VulnerabilitiesView.tsx)

- Add CVSS score badge in list items
- Embed `CvssCalculator` in detail panel
- Add re-validation status + notes section
- Add "Mark for Re-validation" action
- OWASP category filter (API1–API10)
- AI model selector now uses unified `aiService.ts`

#### [MODIFY] [Dashboard.tsx](file:///c:/Users/tkart/Dev/products/api_scanner/components/Dashboard.tsx)

- Add "Engagement Progress" stat card (X/25 endpoints)
- Add "CVSS Score Distribution" bar chart
- Add "Re-validation Queue" count
- Add "Compliance Coverage" gauge

#### [MODIFY] [Sidebar.tsx](file:///c:/Users/tkart/Dev/products/api_scanner/components/Sidebar.tsx)

Add nav items: `LoadTesting`, `Reports`, `Engagement`

#### [MODIFY] [App.tsx](file:///c:/Users/tkart/Dev/products/api_scanner/App.tsx)

- Add new page types and routing
- Thread `AIConfig` state (provider, model, apiKey, baseUrl) globally — from Settings

#### [MODIFY] [SettingsView.tsx](file:///c:/Users/tkart/Dev/products/api_scanner/components/SettingsView.tsx)

- Add **AI Provider configuration** section:
  - Provider selector: Gemini / Ollama / Custom
  - Model field (or dropdown fetched from `/api/ai/models`)
  - API key / base URL inputs
  - "Test Connection" button

---

## Frontend Dependency Additions

```json
"jspdf": "^2.5.2",
"jspdf-autotable": "^3.8.4",
"@google/genai": "^1.x"  // already present
```

---

## Implementation Order

```
1. Backend bootstrap     → backend/main.py, requirements.txt
2. Backend models        → models/*.py
3. Backend services      → services/scanner.py, load_runner.py, ai_service.py, pdf_service.py
4. Backend routers       → routers/*.py (all 5)
5. types.ts              → add all new interfaces
6. services/aiService.ts → unified AI layer
7. Icons.tsx             → add new icons
8. CvssCalculator.tsx    → new component
9. LoadTestingView.tsx   → new page
10. EngagementView.tsx   → new page
11. ReportsView.tsx      → new page
12. NewScanModal.tsx     → enhanced
13. VulnerabilitiesView  → CVSS + re-validation
14. Dashboard.tsx        → new stats
15. SettingsView.tsx     → AI config section
16. Sidebar.tsx + App.tsx → routing
17. Install deps, test build
```

---

## Verification Plan

### Backend
```bash
cd backend && uvicorn main:app --reload --port 8000
# Test each endpoint via Swagger UI at http://localhost:8000/docs
```

### Frontend
```bash
npm run dev
# Navigate all 6 pages, verify no mock data anywhere
# Run a real scan → check findings land in Vulnerabilities
# Run a load test → check SSE stream updates live charts
# Generate each of the 4 reports → verify PDF downloads
# Import a Swagger file → verify endpoints populate Engagement view
# Change AI provider in Settings → verify AI features respect selection
```
