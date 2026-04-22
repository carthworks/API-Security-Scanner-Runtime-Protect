import React, { useState } from 'react';
import {
    ShieldIcon, ZapIcon, CodeIcon, GitPullRequestIcon,
    ServerIcon, AlertTriangleIcon, CheckCircleIcon, ChevronDownIcon,
    GaugeIcon, FileTextIcon, SettingsIcon,
} from './Icons';

// ─── Sub-components ───────────────────────────────────────────────────────────

const Step: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
    <div className="flex gap-4">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white mt-0.5">{n}</div>
        <div className="flex-1 pb-6 border-b border-gray-700/50 last:border-0">
            <p className="text-sm font-semibold text-white mb-1">{title}</p>
            <div className="text-sm text-gray-400 space-y-1">{children}</div>
        </div>
    </div>
);

const Code: React.FC<{ children: string }> = ({ children }) => (
    <pre className="mt-2 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-xs font-mono text-green-300 overflow-x-auto whitespace-pre-wrap">{children}</pre>
);

const Tip: React.FC<{ variant?: 'tip' | 'warning' | 'info'; children: React.ReactNode }> = ({ variant = 'info', children }) => {
    const styles = { tip: 'bg-green-500/10 border-green-500/30 text-green-300', warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300', info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' };
    const icons = { tip: <CheckCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />, warning: <AlertTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />, info: <ServerIcon className="h-4 w-4 flex-shrink-0 mt-0.5" /> };
    return (
        <div className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs mt-3 ${styles[variant]}`}>
            {icons[variant]}<span>{children}</span>
        </div>
    );
};

interface Section { id: string; icon: React.ReactNode; title: string; badge?: string; badgeColor?: string; content: React.ReactNode; }

const AccordionItem: React.FC<{ open: boolean; section: Section; onToggle: () => void }> = ({ open, section, onToggle }) => (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${open ? 'border-indigo-500/40 bg-gray-800' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'}`}>
        <button id={`guide-section-${section.id}`} onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left" aria-expanded={open}>
            <div className={`p-2.5 rounded-lg transition-colors ${open ? 'bg-indigo-600/20 text-indigo-400' : 'bg-gray-700 text-gray-400'}`}>{section.icon}</div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{section.title}</span>
                    {section.badge && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${section.badgeColor ?? 'bg-indigo-500/20 text-indigo-300'}`}>{section.badge}</span>}
                </div>
            </div>
            <ChevronDownIcon className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && <div className="px-5 pb-6 space-y-4 border-t border-gray-700/50 pt-4">{section.content}</div>}
    </div>
);

// ─── Sections ─────────────────────────────────────────────────────────────────

const sections: Section[] = [
    {
        id: 'setup',
        icon: <ServerIcon className="h-5 w-5" />,
        title: 'Prerequisites & Setup',
        badge: 'Start here',
        badgeColor: 'bg-green-500/20 text-green-300',
        content: (
            <>
                <p className="text-sm text-gray-400">Sentinel requires both a <strong className="text-white">Node.js frontend</strong> and a <strong className="text-white">FastAPI Python backend</strong>. Both must be running simultaneously.</p>
                <div className="space-y-4 mt-4">
                    <Step n={1} title="Install the Frontend">
                        <Code>{`cd api_scanner\nnpm install`}</Code>
                    </Step>
                    <Step n={2} title="Set Up the Backend">
                        <p>Navigate to the <span className="font-mono text-indigo-400">backend/</span> directory and create a virtual environment:</p>
                        <Code>{`cd backend\nuv venv .venv\nuv pip install -r requirements.txt\ncopy .env.example .env`}</Code>
                        <Tip variant="tip">No uv? Use standard pip: <span className="font-mono">pip install -r requirements.txt</span></Tip>
                    </Step>
                    <Step n={3} title="Start the Backend">
                        <Code>{`uv run uvicorn main:app --reload --port 8000\n# or: python -m uvicorn main:app --reload --port 8000\n# Docs at: http://localhost:8000/docs`}</Code>
                        <Tip variant="info">Keep this terminal open. The backend must be running for scans, load tests, and AI features to work.</Tip>
                    </Step>
                    <Step n={4} title="Start the Frontend">
                        <Code>{`npm run dev\n# Open http://localhost:5173`}</Code>
                    </Step>
                    <Step n={5} title="(Optional) Set Up Ollama for Local AI">
                        <p>Download from <span className="font-mono text-indigo-400">https://ollama.com</span> then:</p>
                        <Code>{`ollama pull llama3    # recommended\nollama serve          # usually starts automatically`}</Code>
                    </Step>
                </div>
            </>
        ),
    },
    {
        id: 'ai-config',
        icon: <SettingsIcon className="h-5 w-5" />,
        title: 'Configuring the AI Provider',
        badge: 'Multi-model',
        badgeColor: 'bg-purple-500/20 text-purple-300',
        content: (
            <div className="space-y-4 text-sm text-gray-400">
                <p>Sentinel supports <strong className="text-white">three AI providers</strong> — switch at any time via <strong className="text-white">Settings → AI Provider</strong>.</p>
                <div className="grid grid-cols-1 gap-3">
                    {[
                        { name: 'Ollama (Local)', desc: 'No API key needed. Set Base URL to http://localhost:11434. Best for privacy — no data leaves your machine.', color: 'border-green-500/40' },
                        { name: 'Google Gemini (Cloud)', desc: 'Paste your Gemini API key. Uses gemini-2.5-flash by default. Best quality for report generation.', color: 'border-indigo-500/40' },
                        { name: 'Custom OpenAI-Compatible', desc: 'Point to any OpenAI-compatible endpoint (LM Studio, vLLM, Together AI, etc.) with optional API key.', color: 'border-yellow-500/40' },
                    ].map(p => (
                        <div key={p.name} className={`bg-gray-900/50 border ${p.color} rounded-lg px-4 py-3`}>
                            <p className="text-white font-semibold text-xs mb-1">{p.name}</p>
                            <p className="text-gray-400 text-xs">{p.desc}</p>
                        </div>
                    ))}
                </div>
                <Tip variant="info">The AI provider selection in Settings applies globally to scans, remediation, CVE lookup, and report generation.</Tip>
            </div>
        ),
    },
    {
        id: 'scan',
        icon: <ZapIcon className="h-5 w-5" />,
        title: 'Running a VAPT Scan',
        badge: 'Core feature',
        content: (
            <div className="space-y-4">
                <p className="text-sm text-gray-400">Scans perform <strong className="text-white">real HTTP probes</strong> against your target API, then optionally augment findings using AI.</p>
                <Step n={1} title="Open the Scan Modal">
                    <p>Click <strong className="text-white">New Scan</strong> in the top header bar.</p>
                </Step>
                <Step n={2} title="Enter Target Details">
                    <p>Set a scan name, paste the API base URL (e.g. <span className="font-mono text-indigo-400">https://api.example.com</span>), and optionally add a Bearer token for authenticated scans.</p>
                </Step>
                <Step n={3} title="Select OWASP Categories & Depth">
                    <p>Choose which OWASP API Top 10 categories to test (API1–API10). Pick scan depth:</p>
                    <ul className="list-disc list-inside pl-2 mt-1">
                        <li><strong className="text-white">Quick</strong> — passive checks only (headers, CORS)</li>
                        <li><strong className="text-white">Normal</strong> — includes injection probes and BOLA checks</li>
                        <li><strong className="text-white">Deep</strong> — full probe suite + AI augmentation</li>
                    </ul>
                </Step>
                <Step n={4} title="Monitor Live Progress">
                    <p>Progress streams via SSE: <strong className="text-indigo-300">Connect → Probe → AI Analysis → Complete</strong>. Each check updates in real time.</p>
                </Step>
                <Step n={5} title="Review Findings">
                    <p>All findings land in <strong className="text-white">Vulnerabilities</strong> automatically with CVSS v3.1 scores, OWASP mapping, and evidence.</p>
                </Step>
                <Tip variant="warning">Only scan APIs you own or have explicit written authorisation to test.</Tip>
            </div>
        ),
    },
    {
        id: 'vulns',
        icon: <ShieldIcon className="h-5 w-5" />,
        title: 'Managing Vulnerabilities',
        content: (
            <div className="space-y-4">
                <p className="text-sm text-gray-400">The <strong className="text-white">Vulnerabilities</strong> page is your central VAPT workspace.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {[
                        { label: 'Search', desc: 'Full-text search across type, endpoint, and description.' },
                        { label: 'Filter by Severity', desc: 'Critical / High / Medium / Low / Info.' },
                        { label: 'Filter by Status', desc: 'New / Acknowledged / Fixed.' },
                        { label: 'Sort', desc: 'By severity (highest first) or discovery date.' },
                    ].map(({ label, desc }) => (
                        <div key={label} className="bg-gray-700/40 rounded-lg border border-gray-600/50 px-3 py-2.5">
                            <p className="text-xs font-semibold text-white mb-0.5">{label}</p>
                            <p className="text-xs text-gray-400">{desc}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-2 space-y-2">
                    <p className="text-sm font-semibold text-white">In the Detail Pane</p>
                    <ul className="text-sm text-gray-400 list-disc list-inside space-y-1 pl-2">
                        <li>Change <strong className="text-white">Status</strong> — New → Acknowledged → Fixed</li>
                        <li><strong className="text-white">Assign</strong> to a team member</li>
                        <li>View CVSS v3.1 score and vector string</li>
                        <li>Click <strong className="text-white">Get Code-Level Fix</strong> for AI remediation (Before/After code)</li>
                        <li>Click <strong className="text-white">Search for CVEs</strong> to find related public CVE IDs</li>
                        <li>Click any <strong className="text-white">CVE ID</strong> to load CVSS score, vector, and affected software</li>
                    </ul>
                </div>
            </div>
        ),
    },
    {
        id: 'loadtest',
        icon: <GaugeIcon className="h-5 w-5" />,
        title: 'Load Testing',
        badge: 'Real HTTP',
        badgeColor: 'bg-orange-500/20 text-orange-300',
        content: (
            <div className="space-y-4 text-sm text-gray-400">
                <p>The Load Testing page sends <strong className="text-white">real concurrent HTTP requests</strong> to your API from the backend and streams live metrics to the browser.</p>
                <Step n={1} title="Configure the Test">
                    <ul className="list-disc list-inside pl-2 space-y-1">
                        <li><strong className="text-white">Target Base URL</strong> — API root to test</li>
                        <li><strong className="text-white">Endpoint</strong> — method + path (e.g. GET /api/v1/users)</li>
                        <li><strong className="text-white">Concurrent Users</strong> — 1 to 1000 (slider)</li>
                        <li><strong className="text-white">Duration</strong> — 30s / 1m / 5m / 15m</li>
                        <li><strong className="text-white">Ramp-up</strong> — seconds to reach full concurrency</li>
                        <li><strong className="text-white">Auth Header</strong> — optional header name + value</li>
                    </ul>
                </Step>
                <Step n={2} title="Start & Monitor">
                    <p>Click <strong className="text-white">Start Load Test</strong>. Two live Recharts update every second:</p>
                    <ul className="list-disc list-inside pl-2 mt-1 space-y-1">
                        <li>Throughput chart — Requests Per Second</li>
                        <li>Latency chart — p50, p95, p99 response times + error rate %</li>
                    </ul>
                </Step>
                <Step n={3} title="Read the Summary">
                    <p>After completion, the summary shows: total requests, failures, avg/peak RPS, p50/p95/p99, max response time, error rate, and status code distribution.</p>
                    <p className="mt-1">A <strong className="text-white">Stability Rating</strong> (Stable / Degraded / Unstable / Critical) and <strong className="text-white">SLA Breach</strong> flag (p95 &gt; 200ms) are highlighted.</p>
                </Step>
                <Tip variant="warning">Only load test systems you own or have explicit permission to test. Aggressive load testing can affect system availability.</Tip>
            </div>
        ),
    },
    {
        id: 'reports',
        icon: <FileTextIcon className="h-5 w-5" />,
        title: 'Generating Reports',
        badge: 'PDF Export',
        badgeColor: 'bg-blue-500/20 text-blue-300',
        content: (
            <div className="space-y-4 text-sm text-gray-400">
                <p>Sentinel generates <strong className="text-white">4 professional PDF reports</strong> aligned with the SOW deliverables.</p>
                <div className="grid grid-cols-1 gap-2">
                    {[
                        { name: 'VAPT Report', desc: 'Full findings: CVSS scores, endpoint, evidence, PoC, remediation, OWASP mapping.' },
                        { name: 'Executive Summary', desc: '1-page risk overview: severity counts, overall posture, key observations.' },
                        { name: 'Load Test Report', desc: 'Test configuration, per-second metrics table, performance recommendations.' },
                        { name: 'Attestation Certificate', desc: 'Formal completion certificate for stakeholders, partners, and investors.' },
                    ].map(r => (
                        <div key={r.name} className="flex gap-3 bg-gray-700/30 border border-gray-700 rounded-lg px-4 py-3">
                            <div className="text-indigo-400 flex-shrink-0 mt-0.5">📄</div>
                            <div>
                                <p className="text-white font-semibold text-xs">{r.name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <Tip variant="info">Report generation calls <span className="font-mono">POST /api/report/pdf</span> on the backend. The backend must be running on port 8000.</Tip>
            </div>
        ),
    },
    {
        id: 'integrations',
        icon: <GitPullRequestIcon className="h-5 w-5" />,
        title: 'SCM Integrations (GitHub · GitLab · Bitbucket)',
        content: (
            <div className="space-y-4 text-sm text-gray-400">
                <p>Connect source code repositories to enable CI/CD pipeline scanning.</p>
                <Step n={1} title="Open Integrations Page">
                    <p>Go to <strong className="text-white">Integrations</strong> in the sidebar and click <strong className="text-white">Connect</strong> on any provider.</p>
                </Step>
                <Step n={2} title="Choose Token Type">
                    <p>Select <strong className="text-white">Classic</strong> or <strong className="text-white">Fine-grained</strong> (recommended for restricted-scope access).</p>
                </Step>
                <Step n={3} title="Generate & Paste Token">
                    <p>Click the provider link to open the token creation page. Required scopes are listed on screen.</p>
                    <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
                        {[
                            { p: 'GitHub Classic', s: 'repo, read:org, read:user' },
                            { p: 'GitLab', s: 'read_api, read_repository' },
                            { p: 'Bitbucket', s: 'repository:read, pullrequest:read' },
                        ].map(({ p, s }) => (
                            <div key={p} className="flex justify-between bg-gray-700/40 rounded px-2 py-1">
                                <span className="text-gray-300 font-medium">{p}</span>
                                <span className="font-mono text-indigo-400">{s}</span>
                            </div>
                        ))}
                    </div>
                </Step>
                <Step n={4} title="Verify & Connect">
                    <p>Paste the token — the format is validated live. Click <strong className="text-white">Verify & Connect</strong> to confirm all required scopes.</p>
                    <Tip variant="info">Tokens are stored only in browser session memory — never sent to any external server.</Tip>
                </Step>
            </div>
        ),
    },
    {
        id: 'ai',
        icon: <CodeIcon className="h-5 w-5" />,
        title: 'AI Features Deep Dive',
        badge: 'Multi-provider',
        badgeColor: 'bg-purple-500/20 text-purple-300',
        content: (
            <div className="space-y-5 text-sm text-gray-400">
                <p>All AI calls route through the backend at <span className="font-mono text-indigo-400">localhost:8000/api/ai/query</span> — the provider set in Settings is used for every feature.</p>
                <div className="space-y-4">
                    {[
                        { color: 'border-indigo-500', title: '🔍 VAPT Scan Augmentation', desc: 'After HTTP probes complete, the AI analyses the target and adds findings not caught by static checks — business logic flaws, context-specific issues.' },
                        { color: 'border-green-500', title: '🛠️ Code-Level Remediation', desc: 'Generates Before/After code examples in the most relevant backend language (Node.js/Express, Python/Flask, Java/Spring Boot) for each vulnerability.' },
                        { color: 'border-yellow-500', title: '📋 CVE Intelligence', desc: 'Identifies related CVE IDs using the model\'s knowledge (Ollama) or web search (Gemini with grounding). Click any CVE to get CVSS score, vector, and affected software.' },
                        { color: 'border-red-500', title: '📄 Report Narratives', desc: 'AI generates the executive narrative section for Executive Summary and Attestation Certificate reports.' },
                    ].map(f => (
                        <div key={f.title} className={`border-l-2 ${f.color} pl-4`}>
                            <p className="text-white font-semibold mb-1">{f.title}</p>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
                <Tip variant="warning">CVE data accuracy depends on the model's training cut-off. Always verify against the official NVD database for production security decisions.</Tip>
            </div>
        ),
    },
    {
        id: 'troubleshoot',
        icon: <AlertTriangleIcon className="h-5 w-5" />,
        title: 'Troubleshooting',
        content: (
            <div className="space-y-3 text-sm">
                {[
                    { problem: 'Backend ModuleNotFoundError', fix: 'Run: cd backend && uv pip install -r requirements.txt' },
                    { problem: 'Backend not starting', fix: 'Ensure you are inside backend/ and run: uv run uvicorn main:app --reload --port 8000' },
                    { problem: 'Scan returns "Target unreachable"', fix: 'Check the target URL is accessible from your machine. Try curl <url> in a terminal.' },
                    { problem: 'Scan returns no findings', fix: 'Verify the backend is running at localhost:8000. Check /docs for health status.' },
                    { problem: 'Load test fails immediately', fix: 'Ensure target URL is reachable from the backend machine. Check auth headers if required.' },
                    { problem: 'AI features return 502', fix: 'Check Settings → AI Provider — verify model name, API key, and base URL are correct.' },
                    { problem: 'Gemini returns 401', fix: 'Add a valid GEMINI_API_KEY to backend/.env or paste it directly in Settings.' },
                    { problem: 'Ollama not reachable', fix: 'Run: ollama serve — it must be running on http://localhost:11434' },
                    { problem: 'No Ollama models available', fix: 'Run: ollama pull llama3 then retry in the app.' },
                    { problem: 'PDF download fails', fix: 'Backend must be running. Open http://localhost:8000/docs to confirm.' },
                    { problem: 'CORS errors in browser', fix: 'Ensure CORS_ORIGINS in backend/.env includes the frontend port (default: http://localhost:5173).' },
                    { problem: 'Token rejected in wizard', fix: 'GitHub Classic: starts with ghp_. Fine-grained: starts with github_pat_. Min 20 characters.' },
                ].map(({ problem, fix }) => (
                    <div key={problem} className="bg-gray-700/30 rounded-lg border border-gray-700 px-4 py-3">
                        <p className="text-white font-semibold text-xs mb-1">⚠ {problem}</p>
                        <p className="text-gray-400 text-xs">{fix}</p>
                    </div>
                ))}
            </div>
        ),
    },
];

// ─── Main component ───────────────────────────────────────────────────────────

export const GuideView: React.FC = () => {
    const [openId, setOpenId] = useState<string>('setup');
    const toggle = (id: string) => setOpenId(prev => (prev === id ? '' : id));

    return (
        <div className="space-y-8 max-w-3xl mx-auto pb-12">
            <div>
                <h1 className="text-3xl font-bold text-white">User Guide</h1>
                <p className="text-gray-400 mt-1">Everything you need to set up and use Sentinel's VAPT and Load Testing platform.</p>
            </div>

            {/* Quick-start callout */}
            <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-5 flex gap-4">
                <div className="p-2.5 bg-indigo-600/20 rounded-lg h-fit">
                    <ZapIcon className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-white mb-2">Quick Start (both services)</p>
                    <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                        <li>Frontend: <span className="font-mono text-indigo-400">npm install && npm run dev</span></li>
                        <li>Backend: <span className="font-mono text-indigo-400">cd backend && uv pip install -r requirements.txt && uv run uvicorn main:app --reload --port 8000</span></li>
                        <li>Open <span className="font-mono text-indigo-400">http://localhost:5173</span> and log in</li>
                        <li>Configure AI provider in <strong className="text-white">Settings → AI Provider</strong></li>
                        <li>Click <strong className="text-white">New Scan</strong> to run your first VAPT assessment</li>
                    </ol>
                </div>
            </div>

            <div className="space-y-3">
                {sections.map(section => (
                    <AccordionItem key={section.id} section={section} open={openId === section.id} onToggle={() => toggle(section.id)} />
                ))}
            </div>

            <p className="text-center text-xs text-gray-600">
                Sentinel API Security Platform · VAPT + Load Testing · OWASP · CERT-In · CVSS v3.1
            </p>
        </div>
    );
};
