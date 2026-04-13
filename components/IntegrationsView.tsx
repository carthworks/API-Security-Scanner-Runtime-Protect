import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GithubIcon, GitlabIcon, BitbucketIcon, MoreVerticalIcon, XIcon, RefreshCwIcon, CheckCircleIcon, ZapIcon, SearchIcon } from './Icons';

// ─── Types ───────────────────────────────────────────────────────────────────

type ProviderName = 'GitHub' | 'GitLab' | 'Bitbucket';
type ScanStatus = 'clean' | 'issues' | 'scanning' | 'pending';
type PipelineStatus = 'passing' | 'failing' | 'running' | 'pending';

interface Repository {
    id: string;
    name: string;
    fullName: string;
    branch: string;
    lastScanned: string | null;
    scanStatus: ScanStatus;
    issueCount: number;
    pipelineStatus: PipelineStatus;
    isPrivate: boolean;
}

interface Integration {
    name: ProviderName;
    description: string;
    icon: React.ReactNode;
    accentColor: string;
    isConnected: boolean;
    connectedAccount?: string;
    repos: Repository[];
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockRepos: Record<ProviderName, Repository[]> = {
    GitHub: [
        { id: 'gh-1', name: 'api-gateway', fullName: 'acme-corp/api-gateway', branch: 'main', lastScanned: new Date(Date.now() - 3600000 * 2).toISOString(), scanStatus: 'issues', issueCount: 7, pipelineStatus: 'failing', isPrivate: false },
        { id: 'gh-2', name: 'user-service', fullName: 'acme-corp/user-service', branch: 'main', lastScanned: new Date(Date.now() - 3600000 * 8).toISOString(), scanStatus: 'clean', issueCount: 0, pipelineStatus: 'passing', isPrivate: true },
        { id: 'gh-3', name: 'payment-api', fullName: 'acme-corp/payment-api', branch: 'develop', lastScanned: new Date(Date.now() - 86400000).toISOString(), scanStatus: 'issues', issueCount: 3, pipelineStatus: 'passing', isPrivate: true },
        { id: 'gh-4', name: 'notifications-service', fullName: 'acme-corp/notifications-service', branch: 'main', lastScanned: null, scanStatus: 'pending', issueCount: 0, pipelineStatus: 'pending', isPrivate: false },
    ],
    GitLab: [
        { id: 'gl-1', name: 'core-backend', fullName: 'acme/core-backend', branch: 'production', lastScanned: new Date(Date.now() - 3600000 * 5).toISOString(), scanStatus: 'clean', issueCount: 0, pipelineStatus: 'passing', isPrivate: true },
        { id: 'gl-2', name: 'data-pipeline', fullName: 'acme/data-pipeline', branch: 'main', lastScanned: new Date(Date.now() - 3600000 * 12).toISOString(), scanStatus: 'issues', issueCount: 2, pipelineStatus: 'failing', isPrivate: true },
    ],
    Bitbucket: [],
};

const initialIntegrations: Integration[] = [
    {
        name: 'GitHub',
        description: 'Scan public and private repositories, trigger scans on pull requests.',
        icon: <GithubIcon className="h-7 w-7 text-white" />,
        accentColor: 'border-gray-500',
        isConnected: true,
        connectedAccount: 'acme-corp',
        repos: mockRepos['GitHub'],
    },
    {
        name: 'GitLab',
        description: 'Integrate with GitLab CI/CD pipelines and merge request checks.',
        icon: <GitlabIcon className="h-7 w-7 text-orange-400" />,
        accentColor: 'border-orange-500',
        isConnected: true,
        connectedAccount: 'acme',
        repos: mockRepos['GitLab'],
    },
    {
        name: 'Bitbucket',
        description: 'Connect Bitbucket Cloud repositories and Pipelines.',
        icon: <BitbucketIcon className="h-7 w-7 text-blue-400" />,
        accentColor: 'border-blue-500',
        isConnected: false,
        repos: [],
    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const useOutsideClick = (ref: React.RefObject<HTMLDivElement | null>, callback: () => void) => {
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) callback();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [ref, callback]);
};

const timeAgo = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ScanStatusBadge: React.FC<{ status: ScanStatus; count: number }> = ({ status, count }) => {
    const cfg: Record<ScanStatus, { label: string; cls: string }> = {
        clean: { label: 'Clean', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
        issues: { label: `${count} Issue${count !== 1 ? 's' : ''}`, cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
        scanning: { label: 'Scanning…', cls: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
        pending: { label: 'Not scanned', cls: 'bg-gray-500/15 text-gray-400 border-gray-600' },
    };
    const { label, cls } = cfg[status];
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
            {status === 'scanning' && (
                <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {status === 'clean' && <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-1.5" />}
            {status === 'issues' && <span className="h-1.5 w-1.5 rounded-full bg-red-400 mr-1.5" />}
            {label}
        </span>
    );
};

const PipelineBadge: React.FC<{ status: PipelineStatus }> = ({ status }) => {
    const cfg: Record<PipelineStatus, { label: string; cls: string }> = {
        passing: { label: 'Passing', cls: 'text-green-400' },
        failing: { label: 'Failing', cls: 'text-red-400' },
        running: { label: 'Running', cls: 'text-indigo-400' },
        pending: { label: '—', cls: 'text-gray-500' },
    };
    const { label, cls } = cfg[status];
    return <span className={`text-xs font-semibold ${cls}`}>{label}</span>;
};

const RepoRow: React.FC<{ repo: Repository; onTriggerScan: (id: string) => void }> = ({ repo, onTriggerScan }) => (
    <tr className="border-t border-gray-700/60 hover:bg-gray-700/30 transition-colors group">
        <td className="py-3 px-4">
            <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-gray-200">{repo.fullName}</span>
                {repo.isPrivate && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 border border-gray-600 font-semibold">Private</span>
                )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Branch: <span className="text-indigo-400 font-mono">{repo.branch}</span></div>
        </td>
        <td className="py-3 px-4">
            <ScanStatusBadge status={repo.scanStatus} count={repo.issueCount} />
        </td>
        <td className="py-3 px-4">
            <PipelineBadge status={repo.pipelineStatus} />
        </td>
        <td className="py-3 px-4 text-xs text-gray-500">
            {repo.lastScanned ? timeAgo(repo.lastScanned) : 'Never'}
        </td>
        <td className="py-3 px-4 text-right">
            <button
                onClick={() => onTriggerScan(repo.id)}
                disabled={repo.scanStatus === 'scanning'}
                className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-600/80 hover:bg-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Trigger a manual scan"
            >
                <ZapIcon className="h-3.5 w-3.5" />
                Scan now
            </button>
        </td>
    </tr>
);

const IntegrationCard: React.FC<{
    integration: Integration;
    onConnect: (i: Integration) => void;
    onDisconnect: (name: ProviderName) => void;
    onTriggerScan: (provider: ProviderName, repoId: string) => void;
}> = ({ integration, onConnect, onDisconnect, onTriggerScan }) => {
    const [expanded, setExpanded] = useState(integration.isConnected);
    const [repoSearch, setRepoSearch] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useOutsideClick(menuRef, useCallback(() => setIsMenuOpen(false), []));

    const filteredRepos = integration.repos.filter(r =>
        r.fullName.toLowerCase().includes(repoSearch.toLowerCase())
    );

    const totalIssues = integration.repos.reduce((s, r) => s + r.issueCount, 0);
    const cleanCount = integration.repos.filter(r => r.scanStatus === 'clean').length;

    return (
        <div className={`bg-gray-800 rounded-xl border border-gray-700 overflow-hidden transition-shadow hover:shadow-xl hover:shadow-black/30`}>
            {/* Header row */}
            <div className="flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-4">
                    <div className={`bg-gray-700/80 p-2.5 rounded-lg border ${integration.accentColor}`}>
                        {integration.icon}
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">{integration.name}</h3>
                        <p className="text-sm text-gray-400">{integration.description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    {integration.isConnected ? (
                        <>
                            {/* Stats pills */}
                            <div className="hidden sm:flex items-center gap-2">
                                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-700 text-gray-300 font-semibold border border-gray-600">
                                    {integration.repos.length} repos
                                </span>
                                {totalIssues > 0 && (
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 font-semibold border border-red-500/30">
                                        {totalIssues} issues
                                    </span>
                                )}
                                {cleanCount > 0 && (
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 font-semibold border border-green-500/30">
                                        {cleanCount} clean
                                    </span>
                                )}
                            </div>

                            {/* Connected badge */}
                            <div className="flex items-center gap-1.5 bg-green-500/10 text-green-400 font-semibold py-1.5 px-3 rounded-lg text-sm border border-green-500/20">
                                <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                                Connected
                                {integration.connectedAccount && (
                                    <span className="text-green-600 font-normal">· @{integration.connectedAccount}</span>
                                )}
                            </div>

                            {/* Actions menu */}
                            <div ref={menuRef} className="relative">
                                <button
                                    id={`menu-${integration.name}`}
                                    onClick={() => setIsMenuOpen(v => !v)}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                    aria-label={`${integration.name} options`}
                                >
                                    <MoreVerticalIcon className="h-5 w-5" />
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-52 bg-gray-750 bg-gray-700 rounded-xl shadow-2xl z-20 border border-gray-600 overflow-hidden">
                                        <ul className="py-1">
                                            <li>
                                                <button
                                                    onClick={() => { setExpanded(v => !v); setIsMenuOpen(false); }}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-600 transition-colors"
                                                >
                                                    {expanded ? 'Hide Repositories' : 'Show Repositories'}
                                                </button>
                                            </li>
                                            <li>
                                                <button className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-600 transition-colors flex items-center gap-2">
                                                    <RefreshCwIcon className="h-4 w-4" /> Sync Repositories
                                                </button>
                                            </li>
                                            <li className="border-t border-gray-600">
                                                <button
                                                    onClick={() => { onDisconnect(integration.name); setIsMenuOpen(false); }}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-600 transition-colors"
                                                >
                                                    Disconnect
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Expand toggle */}
                            <button
                                onClick={() => setExpanded(v => !v)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                aria-label={expanded ? 'Collapse' : 'Expand'}
                            >
                                <svg className={`h-5 w-5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <button
                            id={`connect-${integration.name}`}
                            onClick={() => onConnect(integration)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors"
                        >
                            Connect
                        </button>
                    )}
                </div>
            </div>

            {/* Repo table (expanded) */}
            {integration.isConnected && expanded && (
                <div className="border-t border-gray-700">
                    {integration.repos.length === 0 ? (
                        <div className="py-10 text-center text-gray-500 text-sm">
                            No repositories synced yet. <button className="text-indigo-400 hover:underline">Sync now</button>
                        </div>
                    ) : (
                        <>
                            <div className="px-6 py-3 bg-gray-900/40 flex items-center gap-3">
                                <div className="relative flex-1 max-w-xs">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Filter repositories…"
                                        value={repoSearch}
                                        onChange={e => setRepoSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                                <span className="text-xs text-gray-500 ml-auto">{filteredRepos.length} of {integration.repos.length}</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-gray-900/40">
                                            <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Repository</th>
                                            <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Scan Status</th>
                                            <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Pipeline</th>
                                            <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Last Scanned</th>
                                            <th className="py-2.5 px-4" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRepos.map(repo => (
                                            <RepoRow
                                                key={repo.id}
                                                repo={repo}
                                                onTriggerScan={(id) => onTriggerScan(integration.name, id)}
                                            />
                                        ))}
                                        {filteredRepos.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">No repositories match your filter.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Connect Modal ────────────────────────────────────────────────────────────

// ─── Connect Modal (multi-step wizard) ───────────────────────────────────────

type TokenType = 'classic' | 'fine-grained';
type VerifyPhase = 'idle' | 'validating' | 'verifying' | 'done' | 'error';

interface ScopeCheck {
    label: string;
    key: string;
    status: 'pending' | 'ok' | 'fail';
}

const TOKEN_PREFIXES: Record<ProviderName, Record<TokenType, string>> = {
    GitHub:    { classic: 'ghp_', 'fine-grained': 'github_pat_' },
    GitLab:    { classic: 'glpat-', 'fine-grained': 'glpat-' },
    Bitbucket: { classic: 'ATB', 'fine-grained': 'ATB' },
};

const SCOPES_BY_PROVIDER: Record<ProviderName, { label: string; key: string }[]> = {
    GitHub: [
        { label: 'repo — full repository access', key: 'repo' },
        { label: 'read:org — read org membership', key: 'read:org' },
        { label: 'read:user — read user profile', key: 'read:user' },
    ],
    GitLab: [
        { label: 'read_api — read API access', key: 'read_api' },
        { label: 'read_repository — repository access', key: 'read_repository' },
    ],
    Bitbucket: [
        { label: 'repository:read — repository reads', key: 'repository:read' },
        { label: 'pullrequest:read — read pull requests', key: 'pullrequest:read' },
    ],
};

const DOCS_LINKS: Record<ProviderName, { url: string; label: string }> = {
    GitHub:    { url: 'https://github.com/settings/tokens/new', label: 'Generate on GitHub →' },
    GitLab:    { url: 'https://gitlab.com/-/user_settings/personal_access_tokens', label: 'Generate on GitLab →' },
    Bitbucket: { url: 'https://bitbucket.org/account/settings/app-passwords/new', label: 'Generate on Bitbucket →' },
};

const StepDot: React.FC<{ n: number; active: boolean; done: boolean }> = ({ n, active, done }) => (
    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
        ${done ? 'bg-indigo-600 border-indigo-600 text-white' : active ? 'border-indigo-500 text-indigo-400' : 'border-gray-600 text-gray-600'}`}>
        {done ? <CheckCircleIcon className="h-4 w-4" /> : n}
    </div>
);

const ConnectModal: React.FC<{
    integration: Integration;
    onClose: () => void;
    onConfirm: (token: string) => void;
}> = ({ integration, onClose, onConfirm }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [tokenType, setTokenType] = useState<TokenType>('classic');
    const [token, setToken] = useState('');
    const [showToken, setShowToken] = useState(false);
    const [phase, setPhase] = useState<VerifyPhase>('idle');
    const [scopes, setScopes] = useState<ScopeCheck[]>(
        SCOPES_BY_PROVIDER[integration.name].map(s => ({ ...s, status: 'pending' }))
    );
    const [errorMsg, setErrorMsg] = useState('');

    const prefix = TOKEN_PREFIXES[integration.name][tokenType];
    const hasCorrectPrefix = token.startsWith(prefix);
    const tokenValid = token.trim().length >= 20 && hasCorrectPrefix;
    const docsLink = DOCS_LINKS[integration.name];

    const resetScopes = () =>
        setScopes(SCOPES_BY_PROVIDER[integration.name].map(s => ({ ...s, status: 'pending' })));

    const handleVerify = async () => {
        setPhase('validating');
        await new Promise(r => setTimeout(r, 700));
        setPhase('verifying');
        // Animate each scope check
        const updated: ScopeCheck[] = [...scopes];
        for (let i = 0; i < updated.length; i++) {
            await new Promise(r => setTimeout(r, 500 + i * 300));
            updated[i] = { ...updated[i], status: 'ok' };
            setScopes([...updated]);
        }
        await new Promise(r => setTimeout(r, 400));
        setPhase('done');
        await new Promise(r => setTimeout(r, 700));
        onConfirm(token);
    };

    const handleStep2Submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tokenValid) return;
        resetScopes();
        setStep(3);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="connect-modal-title">
            <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm" onClick={phase === 'idle' ? onClose : undefined} />
            <div className="relative w-full max-w-lg bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">

                {/* ── Modal header ── */}
                <div className="flex items-center justify-between px-6 pt-5 pb-0">
                    <div className="flex items-center gap-3">
                        <div className={`bg-gray-700 p-2.5 rounded-lg border ${integration.accentColor}`}>
                            {integration.icon}
                        </div>
                        <div>
                            <h2 id="connect-modal-title" className="text-base font-bold text-white">
                                Connect to {integration.name}
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">Requires a personal access token</p>
                        </div>
                    </div>
                    {phase === 'idle' && (
                        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                            <XIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* ── Step progress ── */}
                <div className="flex items-center gap-2 px-6 py-4">
                    <StepDot n={1} active={step === 1} done={step > 1} />
                    <div className={`flex-1 h-0.5 rounded ${step > 1 ? 'bg-indigo-600' : 'bg-gray-700'}`} />
                    <StepDot n={2} active={step === 2} done={step > 2} />
                    <div className={`flex-1 h-0.5 rounded ${step > 2 ? 'bg-indigo-600' : 'bg-gray-700'}`} />
                    <StepDot n={3} active={step === 3} done={phase === 'done'} />
                </div>

                <div className="px-6 pb-6">

                    {/* ════════════════ STEP 1: Token type ════════════════ */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-200 mb-1">Select token type</h3>
                                <p className="text-xs text-gray-500">Fine-grained tokens offer stricter permission scoping.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {(['classic', 'fine-grained'] as TokenType[]).map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setTokenType(t)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all
                                            ${tokenType === t ? 'border-indigo-500 bg-indigo-600/10' : 'border-gray-600 bg-gray-700/40 hover:border-gray-500'}`}
                                    >
                                        <div className="text-sm font-semibold text-white capitalize mb-1">{t}</div>
                                        <div className="text-xs text-gray-400">
                                            {t === 'classic'
                                                ? `Prefix: ${TOKEN_PREFIXES[integration.name].classic}`
                                                : `Prefix: ${TOKEN_PREFIXES[integration.name]['fine-grained']}`}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Required scopes preview */}
                            <div className="bg-gray-700/40 rounded-xl border border-gray-600 p-4 space-y-2">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Required scopes</p>
                                {SCOPES_BY_PROVIDER[integration.name].map(s => (
                                    <div key={s.key} className="flex items-center gap-2 text-xs text-gray-300">
                                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                                        <span className="font-mono text-indigo-300">{s.key}</span>
                                        <span className="text-gray-500">— {s.label.split('—')[1]?.trim()}</span>
                                    </div>
                                ))}
                            </div>

                            <a
                                href={docsLink.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                            >
                                {docsLink.label}
                                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
                                </svg>
                            </a>

                            <button
                                onClick={() => setStep(2)}
                                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {/* ════════════════ STEP 2: Paste token ════════════════ */}
                    {step === 2 && (
                        <form onSubmit={handleStep2Submit} className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-200 mb-0.5">Paste your access token</h3>
                                <p className="text-xs text-gray-500">
                                    {tokenType === 'classic' ? 'Classic' : 'Fine-grained'} tokens start with{' '}
                                    <span className="font-mono text-indigo-400">{prefix}</span>
                                </p>
                            </div>

                            {/* Token input */}
                            <div>
                                <label htmlFor="pat-input" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                    Personal Access Token
                                </label>
                                <div className="relative">
                                    <input
                                        id="pat-input"
                                        type={showToken ? 'text' : 'password'}
                                        autoComplete="off"
                                        spellCheck={false}
                                        placeholder={`${prefix}••••••••••••••••••••`}
                                        value={token}
                                        onChange={e => { setToken(e.target.value); setErrorMsg(''); }}
                                        className={`w-full rounded-lg bg-gray-900 border py-3 pl-4 pr-12 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:ring-2 transition-all
                                            ${token && !hasCorrectPrefix ? 'border-red-500/70 focus:ring-red-500/40' :
                                              tokenValid ? 'border-green-500/50 focus:ring-green-500/30' :
                                              'border-gray-600 focus:ring-indigo-500'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowToken(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                        aria-label={showToken ? 'Hide token' : 'Show token'}
                                    >
                                        {showToken ? (
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {/* Inline validation feedback */}
                                {token.length > 0 && (
                                    <div className="mt-2 flex items-center gap-2 text-xs">
                                        {tokenValid ? (
                                            <><span className="text-green-400">✓</span> <span className="text-green-400">Token format looks valid</span></>
                                        ) : !hasCorrectPrefix ? (
                                            <><span className="text-red-400">✗</span> <span className="text-red-400">Token should start with <span className="font-mono">{prefix}</span></span></>
                                        ) : (
                                            <><span className="text-yellow-400">·</span> <span className="text-gray-400">Token too short</span></>
                                        )}
                                    </div>
                                )}
                            </div>

                            {errorMsg && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-400">{errorMsg}</div>
                            )}

                            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-700/30 rounded-lg px-3 py-2 border border-gray-700">
                                <svg className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                                </svg>
                                Encrypted at rest · never logged · revocable anytime
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-lg bg-gray-700 text-gray-300 font-semibold text-sm hover:bg-gray-600 transition-colors">
                                    Back
                                </button>
                                <button
                                    id={`confirm-connect-${integration.name}`}
                                    type="submit"
                                    disabled={!tokenValid}
                                    className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Verify & Connect
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ════════════════ STEP 3: Verify ════════════════ */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-200 mb-0.5">Verifying permissions</h3>
                                <p className="text-xs text-gray-500">We'll confirm your token has the required scopes.</p>
                            </div>

                            {/* Scope checklist */}
                            <div className="bg-gray-900/60 rounded-xl border border-gray-700 divide-y divide-gray-700/60 overflow-hidden">
                                {scopes.map(s => (
                                    <div key={s.key} className="flex items-center justify-between px-4 py-3">
                                        <span className="text-xs font-mono text-gray-300">{s.key}</span>
                                        <span className="flex-shrink-0">
                                            {s.status === 'pending' && (phase === 'verifying' || phase === 'validating') ? (
                                                <svg className="animate-spin h-4 w-4 text-indigo-400" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            ) : s.status === 'ok' ? (
                                                <CheckCircleIcon className="h-4 w-4 text-green-400" />
                                            ) : s.status === 'fail' ? (
                                                <XIcon className="h-4 w-4 text-red-400" />
                                            ) : (
                                                <span className="h-4 w-4 rounded-full border-2 border-gray-600 block" />
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Phase messages */}
                            {phase === 'idle' && (
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-lg bg-gray-700 text-gray-300 font-semibold text-sm hover:bg-gray-600 transition-colors">
                                        Back
                                    </button>
                                    <button
                                        onClick={handleVerify}
                                        className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
                                    >
                                        Start Verification
                                    </button>
                                </div>
                            )}

                            {(phase === 'validating' || phase === 'verifying') && (
                                <div className="flex items-center justify-center gap-2 py-2 text-sm text-indigo-300">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    {phase === 'validating' ? 'Authenticating…' : 'Checking scopes…'}
                                </div>
                            )}

                            {phase === 'done' && (
                                <div className="flex items-center justify-center gap-2 py-2 text-sm text-green-400 font-semibold">
                                    <CheckCircleIcon className="h-5 w-5" />
                                    All scopes verified — connecting…
                                </div>
                            )}

                            {phase === 'error' && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-xs text-red-400 space-y-2">
                                    <p className="font-semibold">Verification failed</p>
                                    <p>{errorMsg}</p>
                                    <button onClick={() => { setPhase('idle'); resetScopes(); }} className="text-indigo-400 hover:underline">Try again</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── CI/CD Info Banner ────────────────────────────────────────────────────────

const CiCdBanner: React.FC = () => (
    <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/10 border border-indigo-500/30 rounded-xl p-5 flex items-start gap-4">
        <div className="bg-indigo-500/20 p-2.5 rounded-lg flex-shrink-0">
            <ZapIcon className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
            <h3 className="text-sm font-bold text-indigo-300">Automate with CI/CD</h3>
            <p className="text-sm text-gray-400 mt-1">
                Add the Sentinel scanner to your pipeline with a single step. Scans run automatically on every push or pull request, and fail the build if critical issues are found.
            </p>
            <div className="mt-3 bg-gray-900/70 rounded-lg p-3 font-mono text-xs text-gray-300 border border-gray-700">
                <span className="text-gray-500"># .github/workflows/sentinel.yml</span>
                <br />
                {'- uses: sentinel-security/scan-action@v2'}
                <br />
                {'  with:'}
                <br />
                {'    fail-on: critical,high'}
            </div>
        </div>
    </div>
);

// ─── Main View ────────────────────────────────────────────────────────────────

export const IntegrationsView: React.FC = () => {
    const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
    const [modalIntegration, setModalIntegration] = useState<Integration | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleConnect = (integration: Integration) => setModalIntegration(integration);

    const handleDisconnect = (name: ProviderName) => {
        setIntegrations(prev =>
            prev.map(i => i.name === name ? { ...i, isConnected: false, connectedAccount: undefined, repos: [] } : i)
        );
        showToast(`Disconnected from ${name}.`, 'info');
    };

    const handleConfirmConnect = (token: string) => {
        if (!modalIntegration) return;
        const name = modalIntegration.name;
        setIntegrations(prev =>
            prev.map(i =>
                i.name === name
                    ? { ...i, isConnected: true, connectedAccount: 'my-account', repos: mockRepos[name] ?? [] }
                    : i
            )
        );
        setModalIntegration(null);
        showToast(`Successfully connected to ${name}!`);
    };

    const handleTriggerScan = (provider: ProviderName, repoId: string) => {
        setIntegrations(prev =>
            prev.map(i => {
                if (i.name !== provider) return i;
                return {
                    ...i,
                    repos: i.repos.map(r => {
                        if (r.id !== repoId) return r;
                        // Simulate scan completing after 3s
                        setTimeout(() => {
                            setIntegrations(cur =>
                                cur.map(ci => {
                                    if (ci.name !== provider) return ci;
                                    return {
                                        ...ci,
                                        repos: ci.repos.map(cr =>
                                            cr.id === repoId
                                                ? { ...cr, scanStatus: Math.random() > 0.5 ? 'clean' : 'issues', issueCount: Math.floor(Math.random() * 5), lastScanned: new Date().toISOString() }
                                                : cr
                                        ),
                                    };
                                })
                            );
                        }, 3000);
                        return { ...r, scanStatus: 'scanning' as ScanStatus };
                    }),
                };
            })
        );
        showToast(`Scan triggered for repository.`);
    };

    const connectedCount = integrations.filter(i => i.isConnected).length;

    return (
        <div className="max-w-5xl space-y-6">
            {/* Page title */}
            <div>
                <h1 className="text-3xl font-bold text-white">Integrations</h1>
                <p className="text-gray-400 mt-1">
                    Connect your source code repositories to enable automated scanning in your CI/CD pipelines.
                    <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                        {connectedCount}/{integrations.length} connected
                    </span>
                </p>
            </div>

            {/* CI/CD info banner */}
            <CiCdBanner />

            {/* Integration cards */}
            <div className="space-y-4">
                {integrations.map(i => (
                    <IntegrationCard
                        key={i.name}
                        integration={i}
                        onConnect={handleConnect}
                        onDisconnect={handleDisconnect}
                        onTriggerScan={handleTriggerScan}
                    />
                ))}
            </div>

            {/* Connect modal */}
            {modalIntegration && (
                <ConnectModal
                    integration={modalIntegration}
                    onClose={() => setModalIntegration(null)}
                    onConfirm={handleConfirmConnect}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all
                    ${toast.type === 'success' ? 'bg-gray-800 border-green-500/40 text-green-300' : 'bg-gray-800 border-gray-600 text-gray-300'}`}>
                    {toast.type === 'success'
                        ? <CheckCircleIcon className="h-5 w-5 text-green-400" />
                        : <XIcon className="h-5 w-5 text-gray-400" />}
                    {toast.message}
                </div>
            )}
        </div>
    );
};
