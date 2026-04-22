# Sentinel — API Security Assessment Platform (VAPT + Load Testing)

<img width="1467" height="973" alt="Sentinel Dashboard" src="https://github.com/user-attachments/assets/70453d27-a7d3-4c35-b172-6be212605d7b" />

Sentinel is a **professional-grade VAPT and Load Testing platform** aligned with the [CERT-In Guidelines](https://www.cert-in.org.in/), OWASP API Security Top 10, ISO/IEC 27001:2022, and NIST SP 800-115. It combines a **React + TypeScript frontend** with a **FastAPI Python backend** to deliver real HTTP security scanning, concurrent load testing, CVSS v3.1 scoring, and downloadable PDF compliance reports — with full AI flexibility across Gemini, Ollama, and any OpenAI-compatible model.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Real VAPT Scanning** | Active HTTP probes: security headers, CORS, rate limiting, injection, BOLA/IDOR, sensitive data exposure, legacy API versions |
| **OWASP API Top 10** | Structured findings mapped to API1–API10 (2023) with CVSS v3.1 scores |
| **Live Load Testing** | Real concurrent HTTP load via async httpx workers — streams RPS, p50/p95/p99, error rate live to browser charts |
| **AI-Powered Analysis** | Remediation advice, CVE intelligence, and CVSS scoring via Gemini, Ollama, or any custom model |
| **Multi-Model AI** | Configure any provider from Settings: Google Gemini (cloud), Ollama (local), or custom OpenAI-compatible endpoint |
| **PDF Reports** | 4 SOW-aligned downloadable PDFs: VAPT Report, Executive Summary, Load Test Report, Attestation Certificate |
| **Vulnerability Management** | Search, filter, sort, assign, CVSS score, re-validation workflow, status timeline |
| **CVE Intelligence** | Find related CVE IDs and load full CVSS score / vector / affected software for any finding |
| **SCM Integrations** | Connect GitHub, GitLab, Bitbucket via 3-step token wizard with live format validation |
| **Team Management** | Add, edit, assign vulnerabilities to team members |
| **Auth & Session Lock** | Login / Register flow with screen-lock mode |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────┐   ┌──────────────────────────────────────┐
│   Frontend  (Vite + React + TypeScript)   │──▶│   Backend  (FastAPI / Python 3.12+)  │
│   http://localhost:5173                   │◀──│   http://localhost:8000              │
│                                           │   │                                      │
│  services/aiService.ts   (unified)        │   │  POST /api/scan         VAPT scan    │
│    ├─ Gemini API         (cloud)          │   │  GET  /api/scan/{id}/stream   SSE    │
│    ├─ Ollama             (local)          │   │  POST /api/load-test    Load test    │
│    └─ Custom OpenAI-compat endpoint       │   │  GET  /api/load-test/{id}/stream SSE │
│                                           │   │  POST /api/report/pdf   PDF binary   │
│  pages: Dashboard, Vulnerabilities,       │   │  POST /api/ai/query     AI proxy     │
│         LoadTesting, Reports, Engagement, │   │  GET  /api/ai/models    Model list   │
│         Integrations, Guide, Settings     │   │  POST /api/spec/parse   OpenAPI/YAML │
└──────────────────────────────────────────┘   └──────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Backend | FastAPI + Uvicorn |
| HTTP Load Testing | httpx + asyncio (real concurrent requests) |
| PDF Generation | fpdf2 |
| AI (cloud) | Google Gemini API |
| AI (local) | Ollama (any model) |
| AI (custom) | Any OpenAI-compatible endpoint |
| Package Manager | uv (backend) / npm (frontend) |

---

## 📂 Project Structure

```
api_scanner/
├── App.tsx                     # Root: global state, routing, auth, AIConfig
├── types.ts                    # Shared TS types: Vulnerability, CvssScore, LoadTestJob, AIConfig…
├── constants.ts                # Severity/status colour config
├── components/
│   ├── Dashboard.tsx           # Overview: stat cards, live traffic charts, recent findings
│   ├── VulnerabilitiesView.tsx # Full VAPT list, CVSS detail pane, AI remediation, CVE lookup
│   ├── LoadTestingView.tsx     # Real HTTP load testing with live SSE-streamed charts
│   ├── IntegrationsView.tsx    # SCM connect wizard, CI/CD docs
│   ├── SettingsView.tsx        # Team management + AI provider configuration
│   ├── GuideView.tsx           # In-app step-by-step user guide
│   ├── NewScanModal.tsx        # Multi-step scan config
│   ├── Sidebar.tsx             # Navigation sidebar
│   ├── Header.tsx              # Top bar with New Scan button
│   ├── Login.tsx / Register.tsx / ScreenLock.tsx
│   ├── LiveTrafficChart.tsx    # Animated live traffic visualisation
│   └── Icons.tsx               # SVG icon components
└── services/
    ├── aiService.ts            # Unified AI client — routes via backend /api/ai/query
    ├── geminiService.ts        # Legacy (retained for compatibility)
    └── ollamaService.ts        # Legacy (retained for compatibility)

backend/
├── main.py                     # FastAPI app entry point + CORS
├── requirements.txt
├── .env.example                # Environment variable template
├── models/
│   ├── scan_models.py          # ScanRequest, ScanFinding, CvssScore, ScanJob
│   ├── load_models.py          # LoadTestConfig, LoadTestMetric, LoadTestSummary
│   └── report_models.py        # VaptReportRequest, ReportType, EngagementMeta
├── services/
│   ├── ai_service.py           # Gemini / Ollama / custom AI dispatcher
│   ├── scanner.py              # Real HTTP VAPT checks (OWASP API Top 10)
│   ├── load_runner.py          # Async concurrent HTTP load runner + metrics
│   └── pdf_service.py          # fpdf2 PDF builder — 4 report types
└── routers/
    ├── scan.py                 # POST /api/scan | GET /api/scan/{id}/stream
    ├── load_test.py            # POST /api/load-test | GET /api/load-test/{id}/stream
    ├── reports.py              # POST /api/report/pdf
    ├── ai.py                   # GET /api/ai/models | POST /api/ai/query
    └── spec_parser.py          # POST /api/spec/parse
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.12
- **[uv](https://docs.astral.sh/uv/)** (recommended) or standard pip
- **[Ollama](https://ollama.com/)** (optional — for local AI)

---

### 1. Clone & Install Frontend

```bash
cd api_scanner
npm install
```

---

### 2. Set Up & Start the Backend

```bash
cd backend

# Create virtual environment and install dependencies
uv venv .venv
uv pip install -r requirements.txt

# Copy environment config
copy .env.example .env    # Windows
cp .env.example .env      # macOS/Linux

# Start the backend (with auto-reload)
uv run uvicorn main:app --reload --port 8000
```

The backend will be available at **http://localhost:8000**  
Interactive API docs (Swagger UI): **http://localhost:8000/docs**

---

### 3. Configure AI Provider

Edit `backend/.env` to add your preferred AI configuration:

```env
# Option A: Google Gemini (cloud)
GEMINI_API_KEY=AIza...

# Option B: Ollama (local) — default, no key needed
OLLAMA_BASE_URL=http://localhost:11434

# Option C: Custom OpenAI-compatible endpoint
CUSTOM_AI_BASE_URL=http://localhost:1234
CUSTOM_AI_API_KEY=your-key-here
```

Or configure directly from the app: **Settings → AI Provider**

---

### 4. (Optional) Set Up Ollama

```bash
# Install from https://ollama.com, then pull a model
ollama pull llama3        # recommended
ollama pull llama2        # lighter alternative

# Start Ollama (often starts automatically)
ollama serve
```

---

### 5. Start the Frontend

```bash
npm run dev
# Open http://localhost:5173
```

---

## 📖 How to Use

### Running a VAPT Scan

1. Click **New Scan** in the header.
2. Enter a scan name and target URL.
3. Set scan depth (Quick / Normal / Deep) and OWASP categories to test.
4. Optionally add an auth token for authenticated scanning.
5. Click **Start Scan** — watch real-time SSE progress: `Connect → Probe → AI Analysis → Complete`.
6. Findings appear in **Vulnerabilities** with CVSS v3.1 scores automatically.

### Running a Load Test

1. Go to **Load Testing** in the sidebar.
2. Enter the target base URL and endpoint path.
3. Set concurrent users (1–1000), duration, and ramp-up period.
4. Click **Start Load Test** — live charts stream RPS, p50/p95/p99, error rate.
5. Final summary shows stability rating (Stable / Degraded / Unstable / Critical) and SLA breach status.

### Managing Vulnerabilities

- Search, filter by severity/status, sort findings.
- Open the detail pane to change status (`New → Acknowledged → Fixed`) and assign to team members.
- Click **Get Code-Level Fix** for AI-generated remediation with Before/After code.
- Click **Search for CVEs** to find related public CVE IDs and load full CVSS details.

### Generating Reports

Navigate to **Reports** (coming in next phase) to generate and download:
- **VAPT Report** — full findings with CVSS, PoC, remediation
- **Executive Summary** — 1-page risk overview
- **Load Test Report** — performance metrics and recommendations
- **Attestation Certificate** — formal engagement completion certificate

### Configuring AI

Go to **Settings → AI Provider**:
- **Provider**: Gemini / Ollama / Custom
- **Model**: any model name (auto-suggested per provider)
- **API Key**: for Gemini or custom endpoints
- **Base URL**: for Ollama or custom OpenAI-compatible servers

---

## 🔒 Compliance & Standards

This platform aligns with:

| Standard | Coverage |
|---|---|
| OWASP API Security Top 10 (2023) | API1–API10 scanner checks |
| CERT-In Security Auditing Guidelines | Scan methodology and reporting |
| ISO/IEC 27001:2022 | Control mapping in compliance checklist |
| NIST SP 800-115 | Testing methodology phases |
| CVSS v3.1 | All vulnerability severity scoring |

---

## 🐛 Troubleshooting

| Symptom | Fix |
|---|---|
| Backend `ModuleNotFoundError` | Run `uv pip install -r requirements.txt` inside `backend/` |
| Backend not starting | Ensure you are inside `backend/` and using `uv run uvicorn main:app --reload --port 8000` |
| Scan returns no findings | Check backend is running at `localhost:8000`; verify target URL is reachable |
| Load test fails immediately | Ensure target URL is reachable from the machine running the backend |
| AI features return error | Check **Settings → AI Provider** — verify model name and API key/base URL |
| Gemini errors | Add `GEMINI_API_KEY` to `backend/.env` or paste it in Settings |
| Ollama not reachable | Run `ollama serve` — it listens on `http://localhost:11434` |
| No Ollama models | Run `ollama pull llama3` then retry |
| PDF download fails | Backend must be running; check `http://localhost:8000/docs` is accessible |
| CORS errors in browser | Frontend port must be in `CORS_ORIGINS` in `backend/.env` |
