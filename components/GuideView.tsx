import React, { useState } from 'react';
import {
    ShieldIcon, ZapIcon, CodeIcon, GitPullRequestIcon,
    ServerIcon, AlertTriangleIcon, CheckCircleIcon, ChevronDownIcon,
} from './Icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Section {
    id: string;
    icon: React.ReactNode;
    title: string;
    badge?: string;
    badgeColor?: string;
    content: React.ReactNode;
}

// ─── Step component ───────────────────────────────────────────────────────────

const Step: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
    <div className="flex gap-4">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white mt-0.5">
            {n}
        </div>
        <div className="flex-1 pb-6 border-b border-gray-700/50 last:border-0">
            <p className="text-sm font-semibold text-white mb-1">{title}</p>
            <div className="text-sm text-gray-400 space-y-1">{children}</div>
        </div>
    </div>
);

// ─── Code block ───────────────────────────────────────────────────────────────

const Code: React.FC<{ children: string }> = ({ children }) => (
    <pre className="mt-2 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-xs font-mono text-green-300 overflow-x-auto whitespace-pre-wrap">
        {children}
    </pre>
);

// ─── Tip / Note callout ───────────────────────────────────────────────────────

const Tip: React.FC<{ variant?: 'tip' | 'warning' | 'info'; children: React.ReactNode }> = ({
    variant = 'info', children,
}) => {
    const styles = {
        tip:     'bg-green-500/10 border-green-500/30 text-green-300',
        warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
        info:    'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
    };
    const icons = {
        tip:     <CheckCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />,
        warning: <AlertTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />,
        info:    <ServerIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />,
    };
    return (
        <div className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs mt-3 ${styles[variant]}`}>
            {icons[variant]}
            <span>{children}</span>
        </div>
    );
};

// ─── Accordion item ───────────────────────────────────────────────────────────

const AccordionItem: React.FC<{
    open: boolean;
    section: Section;
    onToggle: () => void;
}> = ({ open, section, onToggle }) => (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden
        ${open ? 'border-indigo-500/40 bg-gray-800' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'}`}>
        <button
            id={`guide-section-${section.id}`}
            onClick={onToggle}
            className="w-full flex items-center gap-4 p-5 text-left"
            aria-expanded={open}
        >
            <div className={`p-2.5 rounded-lg transition-colors ${open ? 'bg-indigo-600/20 text-indigo-400' : 'bg-gray-700 text-gray-400'}`}>
                {section.icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{section.title}</span>
                    {section.badge && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${section.badgeColor ?? 'bg-indigo-500/20 text-indigo-300'}`}>
                            {section.badge}
                        </span>
                    )}
                </div>
            </div>
            <ChevronDownIcon className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
            <div className="px-5 pb-6 space-y-4 border-t border-gray-700/50 pt-4">
                {section.content}
            </div>
        )}
    </div>
);

// ─── Guide sections data ──────────────────────────────────────────────────────

const sections: Section[] = [
    {
        id: 'setup',
        icon: <ServerIcon className="h-5 w-5" />,
        title: 'Prerequisites & Setup',
        badge: 'Start here',
        badgeColor: 'bg-green-500/20 text-green-300',
        content: (
            <>
                <p className="text-sm text-gray-400">
                    Sentinel uses a <strong className="text-white">local Ollama instance</strong> for all AI features.
                    No data is sent to external servers.
                </p>

                <div className="space-y-4 mt-4">
                    <Step n={1} title="Install Ollama">
                        <p>Download Ollama from <span className="font-mono text-indigo-400">https://ollama.com/</span> and follow the installation steps for your OS.</p>
                    </Step>
                    <Step n={2} title="Pull a Model">
                        <p>Llama 3 is recommended for best JSON output quality:</p>
                        <Code>{`ollama pull llama3\n# or for a lighter model:\nollama pull llama2`}</Code>
                    </Step>
                    <Step n={3} title="Start the Ollama Service">
                        <Code>{`ollama serve\n# Runs on http://localhost:11434`}</Code>
                        <Tip variant="tip">Ollama often starts automatically after installation. Check if it's already running before running this command.</Tip>
                    </Step>
                    <Step n={4} title="Start Sentinel">
                        <Code>{`npm install\nnpm run dev\n# Open http://localhost:5173`}</Code>
                    </Step>
                </div>
            </>
        ),
    },
    {
        id: 'scan',
        icon: <ZapIcon className="h-5 w-5" />,
        title: 'Running Your First Scan',
        badge: 'Core feature',
        content: (
            <div className="space-y-4">
                <p className="text-sm text-gray-400">
                    Scans are powered by your local Ollama model. Each scan sends your target to the model and receives structured
                    vulnerability findings in return.
                </p>
                <Step n={1} title="Open the Scan Modal">
                    <p>Click the <strong className="text-white">New Scan</strong> button in the top header bar.</p>
                </Step>
                <Step n={2} title="Choose a Scan Source">
                    <p className="mb-2">Select between two modes:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                        <li><strong className="text-white">Remote URL</strong> — paste a live API base URL (e.g. <span className="font-mono text-indigo-400">https://api.example.com/v1</span>)</li>
                        <li><strong className="text-white">Local Folder</strong> — drag & drop or click to browse to a codebase directory</li>
                    </ul>
                    <Tip variant="info">The folder picker reads file metadata locally — no file contents are uploaded anywhere.</Tip>
                </Step>
                <Step n={3} title="Select an Ollama Model">
                    <p>The <strong className="text-white">AI Model</strong> row auto-detects all models installed in Ollama.
                    Select the one you want. A pulsing green dot confirms Ollama is online.</p>
                    <Tip variant="warning">If the dot is red, Ollama is not running. Run <span className="font-mono">ollama serve</span> first.</Tip>
                </Step>
                <Step n={4} title="Configure Advanced Options (optional)">
                    <p>Expand <strong className="text-white">Show Advanced Options</strong> to set:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2 mt-1">
                        <li>Scan Profile (Unauthenticated / Authenticated Deep Scan)</li>
                        <li>API Key for authenticated targets</li>
                        <li>Scan depth (Quick / Normal / Deep)</li>
                        <li>Include / Exclude endpoint regex patterns</li>
                        <li>Minimum severity to report</li>
                    </ul>
                </Step>
                <Step n={5} title="Start the Scan">
                    <p>
                        Click <strong className="text-white">Start Scan</strong>. Watch the live progress indicator:
                        <strong className="text-indigo-300"> Connect → AI Analysis → Parse.</strong>
                    </p>
                    <p className="mt-1">All findings are added to the <strong className="text-white">Vulnerabilities</strong> page automatically.</p>
                </Step>
            </div>
        ),
    },
    {
        id: 'vulns',
        icon: <ShieldIcon className="h-5 w-5" />,
        title: 'Managing Vulnerabilities',
        content: (
            <div className="space-y-4">
                <p className="text-sm text-gray-400">
                    The <strong className="text-white">Vulnerabilities</strong> page is your central workspace for reviewing and tracking every finding.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {[
                        { label: 'Search', desc: 'Full-text search across type, endpoint, and description fields.' },
                        { label: 'Filter by Severity', desc: 'Show only Critical, High, Medium, Low, or Info findings.' },
                        { label: 'Filter by Status', desc: 'View New, Acknowledged, or Fixed issues.' },
                        { label: 'Sort', desc: 'Sort by severity (highest first) or discovery date.' },
                    ].map(({ label, desc }) => (
                        <div key={label} className="bg-gray-700/40 rounded-lg border border-gray-600/50 px-3 py-2.5">
                            <p className="text-xs font-semibold text-white mb-0.5">{label}</p>
                            <p className="text-xs text-gray-400">{desc}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-2 space-y-3">
                    <p className="text-sm font-semibold text-white">Working with the Detail Pane</p>
                    <p className="text-sm text-gray-400">Click any row to open its detail pane on the right. From there you can:</p>
                    <ul className="text-sm text-gray-400 list-disc list-inside space-y-1 pl-2">
                        <li>Change <strong className="text-white">Status</strong> — New → Acknowledged → Fixed</li>
                        <li><strong className="text-white">Assign</strong> to a team member</li>
                        <li>View the full <strong className="text-white">status timeline</strong></li>
                        <li>Click <strong className="text-white">Get Code-Level Fix</strong> for AI-generated remediation</li>
                        <li>Click <strong className="text-white">Search for CVEs</strong> to find related public CVE IDs</li>
                        <li>Click any <strong className="text-white">CVE ID</strong> to load CVSS score, vector, and affected software</li>
                    </ul>
                </div>
            </div>
        ),
    },
    {
        id: 'ai',
        icon: <CodeIcon className="h-5 w-5" />,
        title: 'AI-Powered Features (Ollama)',
        badge: 'Requires Ollama',
        badgeColor: 'bg-purple-500/20 text-purple-300',
        content: (
            <div className="space-y-5 text-sm text-gray-400">
                <p>All AI features call your <span className="font-mono text-indigo-400">localhost:11434</span> Ollama instance. Nothing is sent externally.</p>

                <div className="space-y-4">
                    <div className="border-l-2 border-indigo-500 pl-4">
                        <p className="text-white font-semibold mb-1">🔍 Scan for Vulnerabilities</p>
                        <p>The model analyses your target and returns 2–6 structured findings mapped to OWASP API Security Top 10 categories.</p>
                        <Tip variant="tip">Use <span className="font-mono">llama3</span> for more consistent JSON output. Smaller models may return malformed data.</Tip>
                    </div>
                    <div className="border-l-2 border-green-500 pl-4">
                        <p className="text-white font-semibold mb-1">🛠️ Code-Level Remediation</p>
                        <p>Generates Before/After code examples in the most relevant backend language (Node.js/Express, Python/Flask, or Java/Spring Boot) for each vulnerability.</p>
                    </div>
                    <div className="border-l-2 border-yellow-500 pl-4">
                        <p className="text-white font-semibold mb-1">📋 CVE Intelligence</p>
                        <p>Uses the model's pre-trained knowledge to identify related CVE IDs. Click any CVE to get its CVSS score, vector string, and affected software list.</p>
                        <Tip variant="warning">CVE data is based on the model's training cut-off. Always verify against the official NVD database for production decisions.</Tip>
                    </div>
                </div>
            </div>
        ),
    },
    {
        id: 'integrations',
        icon: <GitPullRequestIcon className="h-5 w-5" />,
        title: 'SCM Integrations (GitHub · GitLab · Bitbucket)',
        content: (
            <div className="space-y-4 text-sm text-gray-400">
                <p>Connect your source code repositories to enable automated scanning in CI/CD pipelines.</p>

                <Step n={1} title="Open Integrations Page">
                    <p>Go to <strong className="text-white">Integrations</strong> in the sidebar and click <strong className="text-white">Connect</strong> on any provider.</p>
                </Step>
                <Step n={2} title="Choose Token Type">
                    <p>Select <strong className="text-white">Classic</strong> or <strong className="text-white">Fine-grained</strong> (recommended for restricted-scope access).</p>
                </Step>
                <Step n={3} title="Generate a Token">
                    <p>Click the provider link (e.g. <span className="font-mono text-indigo-400">Generate on GitHub →</span>) to open the token creation page. Required scopes are listed on screen.</p>
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
                <Step n={4} title="Paste & Verify">
                    <p>Paste the token in Step 2 of the wizard. The format is validated live (correct prefix + minimum length).</p>
                    <p className="mt-1">Click <strong className="text-white">Verify & Connect</strong> — Step 3 animates through each required scope and confirms the connection.</p>
                    <Tip variant="info">Tokens are only stored in browser session memory — they are never sent to any external server.</Tip>
                </Step>
            </div>
        ),
    },
    {
        id: 'cicd',
        icon: <GitPullRequestIcon className="h-5 w-5" />,
        title: 'CI/CD Pipeline Integration',
        content: (
            <div className="space-y-4 text-sm text-gray-400">
                <p>Add Sentinel scans directly to your build pipeline so every pull request is checked automatically.</p>

                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">GitHub Actions</p>
                    <Code>{`- name: Sentinel API Scan
  uses: sentinel-security/scan-action@v1
  with:
    target-url: \${{ env.API_BASE_URL }}
    sentinel-token: \${{ secrets.SENTINEL_TOKEN }}
    fail-on-severity: High`}</Code>
                </div>

                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">GitLab CI</p>
                    <Code>{`sentinel-scan:
  stage: test
  image: sentinel-security/scanner:latest
  script:
    - sentinel scan --url $API_BASE_URL --fail-on High
  only:
    - merge_requests`}</Code>
                </div>

                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bitbucket Pipelines</p>
                    <Code>{`- step:
    name: Sentinel API Scan
    script:
      - pipe: sentinel-security/sentinel-scan:1.0.0
        variables:
          TARGET_URL: $API_BASE_URL
          FAIL_ON_SEVERITY: "High"`}</Code>
                </div>

                <Tip variant="warning">The CI/CD examples above are illustrative. Wire them to your real Sentinel backend or self-hosted runner once a server-side component is available.</Tip>
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
                    {
                        problem: 'Scan shows "Ollama is not running"',
                        fix: 'Run `ollama serve` in a terminal and make sure port 11434 is accessible.',
                    },
                    {
                        problem: 'No models in the dropdown',
                        fix: 'Run `ollama pull llama3` to download a model, then re-open the scan modal.',
                    },
                    {
                        problem: '"No findings returned" after scan',
                        fix: 'Switch to llama3 — it generates more consistent structured JSON than llama2.',
                    },
                    {
                        problem: 'Folder picker does nothing',
                        fix: 'Use Chrome or Edge. Firefox has limited support for the webkitdirectory attribute.',
                    },
                    {
                        problem: 'Build error: Syntax error with backticks',
                        fix: 'Check services/ollamaService.ts for escaped backticks (\\`) — replace with real backticks.',
                    },
                    {
                        problem: 'Token rejected in wizard Step 2',
                        fix: 'Ensure the token starts with the correct prefix (ghp_ for GitHub Classic, github_pat_ for Fine-grained) and is at least 20 characters.',
                    },
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
            {/* Page header */}
            <div>
                <h1 className="text-3xl font-bold text-white">User Guide</h1>
                <p className="text-gray-400 mt-1">
                    Everything you need to know about setting up and using Sentinel.
                </p>
            </div>

            {/* Quick-start callout */}
            <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-5 flex gap-4">
                <div className="p-2.5 bg-indigo-600/20 rounded-lg h-fit">
                    <ZapIcon className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-white mb-1">Quick Start</p>
                    <ol className="text-sm text-gray-400 space-y-0.5 list-decimal list-inside">
                        <li>Install Ollama and pull a model: <span className="font-mono text-indigo-400">ollama pull llama3</span></li>
                        <li>Run: <span className="font-mono text-indigo-400">ollama serve</span></li>
                        <li>Click <strong className="text-white">New Scan</strong> in the header and follow the wizard</li>
                    </ol>
                </div>
            </div>

            {/* Accordion sections */}
            <div className="space-y-3">
                {sections.map(section => (
                    <AccordionItem
                        key={section.id}
                        section={section}
                        open={openId === section.id}
                        onToggle={() => toggle(section.id)}
                    />
                ))}
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-gray-600">
                Sentinel API Security Scanner · All AI powered by local Ollama · No data leaves your machine
            </p>
        </div>
    );
};
