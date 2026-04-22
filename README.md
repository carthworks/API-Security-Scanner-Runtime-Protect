# Sentinel — API Security Scanner & Runtime Protect

<<<<<<< HEAD
Sentinel is a developer-centric security platform that **automatically scans APIs for vulnerabilities**, monitors live traffic, and uses a **local Ollama LLM** to generate AI-powered remediation advice — all with zero data leaving your machine.
=======
Sentinel is a developer-centric SaaS platform designed to provide comprehensive API security. It automatically scans APIs during development, detects a wide range of vulnerabilities, monitors live traffic for anomalies, and leverages the power of AI to provide actionable, code-level remediation suggestions.

This application is a feature-rich frontend prototype built with React, TypeScript, and the Google Gemini API to demonstrate the core functionalities of such a platform.

![Sentinel Screenshot]
<img width="1467" height="973" alt="image" src="https://github.com/user-attachments/assets/70453d27-a7d3-4c35-b172-6be212605d7b" />

>>>>>>> 82d0fd0c95bba9ff093d2b25c9ba28629a9815d3

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **AI-Powered Scanning** | Uses a local Ollama model to analyse API targets and return real, structured vulnerability findings (OWASP API Top 10). |
| **Remote URL & Local Folder Scans** | Scan a live API endpoint or a local codebase directory via a drag-and-drop folder picker. |
| **Live Scan Progress** | Real-time phase indicators — Connect → Analyse → Parse → Complete — with per-scope verification. |
| **Vulnerability Management** | Search, sort, filter, assign, and track status (`New → Acknowledged → Fixed`) for every finding. |
| **AI Remediation** | Generate code-level fix suggestions (Before / After code) via Ollama for any vulnerability. |
| **CVE Intelligence** | Find related public CVEs and fetch full CVSS details using the local LLM's knowledge. |
| **SCM Integrations** | Connect GitHub, GitLab, and Bitbucket via a 3-step token wizard (type selection → format validation → scope verification). |
| **CI/CD Guidance** | Inline YAML examples for GitHub Actions, GitLab CI, and Bitbucket Pipelines. |
| **Live Traffic Monitoring** | Real-time charts for requests/min and anomalies detected on the Dashboard. |
| **Team Management** | Add, edit, and remove team members. Assign vulnerabilities to individuals. |
| **Auth & Session Lock** | Login / Register flow with a screen-lock mode. |

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Build Tool | Vite |
| AI / LLM | [Ollama](https://ollama.com/) (local, no cloud) |
| Data Viz | Recharts |

---

## 📂 Project Structure

```
api_scanner/
├── App.tsx                     # Root: global state, routing, auth
├── types.ts                    # Shared TypeScript interfaces & enums
├── constants.ts                # UI style config (severity/status colours)
├── components/
│   ├── Dashboard.tsx           # Overview: stat cards, charts, recent vulns
│   ├── VulnerabilitiesView.tsx # Full vuln list, detail pane, AI tools
│   ├── IntegrationsView.tsx    # SCM connect wizard, repo list, CI/CD docs
│   ├── GuideView.tsx           # In-app step-by-step user guide
│   ├── SettingsView.tsx        # Team management, model preferences
│   ├── NewScanModal.tsx        # Multi-step scan config (URL / folder / Ollama)
│   ├── Sidebar.tsx             # Navigation sidebar
│   ├── Header.tsx              # Top bar with New Scan button
│   ├── Login.tsx               # Auth — login
│   ├── Register.tsx            # Auth — registration
│   ├── ScreenLock.tsx          # Session lock screen
│   ├── LiveTrafficChart.tsx    # Animated live traffic visualization
│   └── Icons.tsx               # SVG icon components
└── services/
    └── ollamaService.ts        # All Ollama API calls:
                                #   scanForVulnerabilities()
                                #   getRemediation()
                                #   getRelatedCVEs()
                                #   getCveDetails()
                                #   getAvailableModels()
```

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js** ≥ 18
- **[Ollama](https://ollama.com/)** installed and running

### 2. Pull a Model

Sentinel works with any Ollama chat/instruct model. `llama3` is recommended for better JSON fidelity:

```bash
ollama pull llama3
# or
ollama pull llama2
```

### 3. Start Ollama

```bash
ollama serve
# Ollama listens on http://localhost:11434
```

### 4. Install & Run the App

```bash
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

> **Note**: If Ollama is not running when you open the scan modal, you will see a "Ollama is not running" error with setup instructions. No fake/simulated data is injected — all findings are real.

---

## 📖 How to Use

### Running a Scan

1. Click **New Scan** in the top header.
2. Enter a **Scan Name**.
3. Choose the scan source:
   - **Remote URL** — paste an API base URL (e.g. `https://api.example.com/v2`)
   - **Local Folder** — drag and drop or browse to a directory containing API source code
4. Select the **Ollama model** from the dropdown (auto-detected from your local Ollama).
5. Optionally expand **Advanced Options** for scan profile, API key, depth, and regex filters.
6. Click **Start Scan**. Watch real-time phase progress (Connect → AI Analysis → Parse).
7. Findings appear in the **Vulnerabilities** page automatically.

### Managing Vulnerabilities

- Use the **search**, **severity filter**, **status filter**, and **sort** controls to find issues.
- Click a row to open the **detail pane** on the right.
- Change **status** (`New → Acknowledged → Fixed`) and **assign** to a team member.
- Click **Get Code-Level Fix** to generate AI remediation with Before/After code examples.
- Click **Search for CVEs** to retrieve related CVE IDs from local LLM knowledge.
- Click any **CVE ID** to load full details (CVSS score, vector, affected software).

### Connecting a Repository

1. Go to **Integrations** in the sidebar.
2. Click **Connect** on GitHub, GitLab, or Bitbucket.
3. Complete the **3-step wizard**:
   - **Step 1**: Choose token type (Classic or Fine-grained)
   - **Step 2**: Paste your PAT — live format validation checks the prefix
   - **Step 3**: Per-scope verification animation confirms the token has the required scopes

### CI/CD Integration

The Integrations page includes a **pipeline setup banner** with copy-ready YAML for:
- **GitHub Actions** (`.github/workflows/sentinel-scan.yml`)
- **GitLab CI** (`.gitlab-ci.yml`)
- **Bitbucket Pipelines** (`bitbucket-pipelines.yml`)

---

## 🔒 Privacy & Security

- **No data leaves your machine.** All AI calls go to `http://localhost:11434` (your local Ollama).
- Tokens entered in the Integrations wizard are stored only in React component state (session memory) — never sent to any remote server.
- The app has no backend; it is a pure frontend prototype.

---

## 🐛 Troubleshooting

| Symptom | Fix |
|---|---|
| Scan returns "Ollama is not running" | Run `ollama serve` and make sure it is reachable at `localhost:11434` |
| No models in the dropdown | Run `ollama pull llama3` to download a model |
| "No findings returned" | Try `llama3` — it handles JSON output more reliably than `llama2` |
| Build errors (esbuild / template literals) | Check `services/ollamaService.ts` for escaped backticks; use real backticks |
| Folder picker not working | Chrome/Edge support `webkitdirectory`. Firefox has limited support. |
