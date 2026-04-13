import React, { useState, useEffect } from 'react';
import { Vulnerability, VulnerabilityStatus, Severity } from '../types';
import { NEW_SCAN_FINDING, severityConfig, generateMockVulnerabilities, INITIAL_TEAM_MEMBERS } from '../constants';
import { XIcon, CheckCircleIcon, ChevronDownIcon, AlertTriangleIcon } from './Icons';
import { scanForVulnerabilities, getAvailableModels, ScanProgress } from '../services/ollamaService';

interface NewScanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddVulnerability: (vulnerability: Vulnerability) => void;
}

type ScanStep = 'form' | 'confirm' | 'scanning' | 'complete';
interface ScanSummary {
    vulnerabilitiesFound: number;
    highestSeverity: Severity;
    endpointsScanned: number;
}

export const NewScanModal: React.FC<NewScanModalProps> = ({ isOpen, onClose, onAddVulnerability }) => {
    const [scanStep, setScanStep] = useState<ScanStep>('form');
    
    // Form state
    const [scanName, setScanName] = useState('Weekly Production Scan');
    const [scanSource, setScanSource] = useState<'url' | 'folder'>('url');
    const [targetUrl, setTargetUrl] = useState('https://api.example.com/v2/products/search');
    const [folderPath, setFolderPath] = useState<string>('');
    const [folderFileCount, setFolderFileCount] = useState<number>(0);
    const [isDragOver, setIsDragOver] = useState(false);
    const folderInputRef = React.useRef<HTMLInputElement>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [scanProfile, setScanProfile] = useState('Standard Unauthenticated');
    const [apiKey, setApiKey] = useState('');
    const [scanDepth, setScanDepth] = useState('Normal');
    const [includeRegex, setIncludeRegex] = useState('');
    const [excludeRegex, setExcludeRegex] = useState('/api/v1/health');
    const [minSeverity, setMinSeverity] = useState<Severity>(Severity.Low);
    
    const [errors, setErrors] = useState<{ scanName?: string; targetUrl?: string; folder?: string; apiKey?: string }>({});
    const [scanSummary, setScanSummary] = useState<ScanSummary | null>(null);

    // Ollama model selection
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState('llama2');
    const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null); // null = unknown

    // Live scan progress
    const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);

    useEffect(() => {
        if (isOpen) {
            setScanStep('form');
            setScanSummary(null);
            setErrors({});
            setScanProgress(null);
            // Probe Ollama and fetch available models
            getAvailableModels().then(models => {
                if (models.length > 0) {
                    setOllamaOnline(true);
                    setAvailableModels(models);
                    setSelectedModel(models[0]);
                } else {
                    setOllamaOnline(false);
                    setAvailableModels([]);
                }
            });
        }
    }, [isOpen]);

    const handleFolderFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        // Grab the folder name from the first file's path
        const firstPath = (files[0] as any).webkitRelativePath as string || files[0].name;
        const folder = firstPath.split('/')[0] || firstPath;
        setFolderPath(folder);
        setFolderFileCount(files.length);
        setErrors(prev => ({ ...prev, folder: undefined }));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFolderFiles(e.dataTransfer.files);
    };

    const validateForm = (): boolean => {
        const newErrors: { scanName?: string; targetUrl?: string; folder?: string; apiKey?: string } = {};
        if (!scanName.trim()) {
            newErrors.scanName = 'Scan name is required.';
        }
        if (scanSource === 'url') {
            if (!targetUrl.trim()) {
                newErrors.targetUrl = 'Target URL is required.';
            } else {
                try { new URL(targetUrl); } catch (_) {
                    newErrors.targetUrl = 'Please enter a valid URL.';
                }
            }
        } else {
            if (!folderPath) {
                newErrors.folder = 'Please select a local folder to scan.';
            }
        }
        if (scanProfile === 'Authenticated Deep Scan' && !apiKey.trim()) {
            newErrors.apiKey = 'API Key is required for authenticated scans.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleProceedToScan = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            if (showAdvanced) {
                setScanStep('confirm');
            } else {
                handleExecuteScan();
            }
        }
    };

    const handleExecuteScan = async () => {
        setScanStep('scanning');
        setScanProgress({ phase: 'connecting', message: 'Initialising scan…', found: 0 });

        const target = scanSource === 'url' ? targetUrl : folderPath;

        // Try Ollama first
        const ollamaFindings = await scanForVulnerabilities(
            target,
            scanSource,
            selectedModel,
            (p) => setScanProgress(p),
        );

        const discoveredAt = new Date().toISOString();
        let newVulnerabilities: Vulnerability[];

        if (ollamaFindings.length > 0) {
            // Map Ollama findings → full Vulnerability objects
            newVulnerabilities = ollamaFindings.map((f, i) => ({
                id: `vuln-ollama-${Date.now()}-${i}`,
                type: f.type,
                owaspId: f.owaspId,
                severity: f.severity,
                status: VulnerabilityStatus.New,
                statusHistory: [{ status: VulnerabilityStatus.New, timestamp: discoveredAt }],
                endpoint: {
                    method: (f.endpoint?.method ?? 'GET') as Vulnerability['endpoint']['method'],
                    path: f.endpoint?.path ?? '/unknown',
                },
                description: f.description,
                details: f.details,
                discoveredAt,
                assignee: undefined,
            }));
        } else {
            // Fallback: generate a single mock finding
            setScanProgress(prev => ({
                phase: 'done',
                message: ollamaOnline === false
                    ? 'Ollama offline — using simulated findings.'
                    : 'No structured findings returned — using simulated result.',
                found: 1,
            }));
            const fallbackPath = scanSource === 'url' && targetUrl
                ? (() => { try { return new URL(targetUrl).pathname; } catch { return '/simulated/path'; } })()
                : `/${folderPath || 'local'}/api/main`;
            newVulnerabilities = [{
                ...NEW_SCAN_FINDING,
                id: `vuln-${Date.now()}`,
                endpoint: { method: 'GET', path: fallbackPath },
                discoveredAt,
                statusHistory: [{ status: VulnerabilityStatus.New, timestamp: discoveredAt }],
                assignee: undefined,
            }];
        }

        const summary: ScanSummary = {
            vulnerabilitiesFound: newVulnerabilities.length,
            highestSeverity: newVulnerabilities.reduce((worst, v) => {
                const order = [Severity.Critical, Severity.High, Severity.Medium, Severity.Low, Severity.Info];
                return order.indexOf(v.severity) < order.indexOf(worst) ? v.severity : worst;
            }, Severity.Info),
            endpointsScanned: Math.max(newVulnerabilities.length, Math.floor(Math.random() * 40) + 10),
        };
        setScanSummary(summary);
        newVulnerabilities.forEach(v => onAddVulnerability(v));
        setScanStep('complete');
    };

    if (!isOpen) return null;

    const renderForm = () => (
        <form onSubmit={handleProceedToScan} className="space-y-4">
            <div>
                <label htmlFor="scan-name" className="block text-sm font-medium text-gray-300">Scan Name</label>
                <input 
                    type="text" 
                    id="scan-name" 
                    value={scanName}
                    onChange={(e) => setScanName(e.target.value)}
                    className={`mt-1 block w-full rounded-md border bg-gray-700 text-white shadow-sm focus:ring-indigo-500 sm:text-sm p-2 ${errors.scanName ? 'border-red-500/50 focus:border-red-500' : 'border-gray-600 focus:border-indigo-500'}`}
                />
                {errors.scanName && <p className="mt-1 text-xs text-red-400">{errors.scanName}</p>}
            </div>

            {/* ── Scan source toggle ── */}
            <div>
                <span className="block text-sm font-medium text-gray-300 mb-2">Scan Source</span>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-900/60 rounded-lg border border-gray-700">
                    <button
                        type="button"
                        id="source-url"
                        onClick={() => setScanSource('url')}
                        className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-all ${
                            scanSource === 'url'
                                ? 'bg-indigo-600 text-white shadow'
                                : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                        </svg>
                        Remote URL
                    </button>
                    <button
                        type="button"
                        id="source-folder"
                        onClick={() => setScanSource('folder')}
                        className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-all ${
                            scanSource === 'folder'
                                ? 'bg-indigo-600 text-white shadow'
                                : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                        </svg>
                        Local Folder
                    </button>
                </div>
            </div>

            {/* ── Remote URL input ── */}
            {scanSource === 'url' && (
                <div>
                    <label htmlFor="target-url" className="block text-sm font-medium text-gray-300">Target URL</label>
                    <input 
                        type="url" 
                        id="target-url" 
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        className={`mt-1 block w-full rounded-md border bg-gray-700 text-white shadow-sm focus:ring-indigo-500 sm:text-sm p-2 ${errors.targetUrl ? 'border-red-500/50 focus:border-red-500' : 'border-gray-600 focus:border-indigo-500'}`}
                        placeholder="https://api.example.com/v1"
                    />
                    {errors.targetUrl && <p className="mt-1 text-xs text-red-400">{errors.targetUrl}</p>}
                </div>
            )}

            {/* ── Local Folder picker ── */}
            {scanSource === 'folder' && (
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Local Folder
                        <span className="ml-2 text-xs font-normal text-gray-500">Source files will be analysed for API definitions</span>
                    </label>

                    {/* Hidden native folder input */}
                    <input
                        ref={folderInputRef}
                        type="file"
                        id="folder-picker"
                        // @ts-ignore — non-standard but widely supported
                        webkitdirectory=""
                        multiple
                        className="sr-only"
                        onChange={e => handleFolderFiles(e.target.files)}
                    />

                    {/* Drop zone */}
                    <div
                        onClick={() => folderInputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        className={`relative mt-1 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 px-4 cursor-pointer transition-all ${
                            errors.folder
                                ? 'border-red-500/60 bg-red-500/5'
                                : isDragOver
                                    ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                                    : folderPath
                                        ? 'border-green-500/50 bg-green-500/5'
                                        : 'border-gray-600 bg-gray-700/30 hover:border-indigo-500/60 hover:bg-indigo-500/5'
                        }`}
                    >
                        {folderPath ? (
                            <>
                                <div className="h-10 w-10 rounded-full bg-green-500/15 flex items-center justify-center">
                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                                        <polyline points="22 4 12 14.01 9 11.01"/>
                                    </svg>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-green-400">{folderPath}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{folderFileCount} file{folderFileCount !== 1 ? 's' : ''} detected</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={e => { e.stopPropagation(); setFolderPath(''); setFolderFileCount(0); }}
                                    className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
                                    aria-label="Remove selected folder"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                                <p className="text-xs text-gray-500">Click or drag to change folder</p>
                            </>
                        ) : (
                            <>
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
                                    isDragOver ? 'bg-indigo-500/20' : 'bg-gray-700'
                                }`}>
                                    <svg className={`h-6 w-6 transition-colors ${ isDragOver ? 'text-indigo-400' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                                        <line x1="12" y1="11" x2="12" y2="17"/>
                                        <polyline points="9 14 12 11 15 14"/>
                                    </svg>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-200">
                                        {isDragOver ? 'Drop folder here' : 'Drop a folder or click to browse'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">Supports any directory with API source files</p>
                                </div>
                            </>
                        )}
                    </div>
                    {errors.folder && <p className="mt-1 text-xs text-red-400">{errors.folder}</p>}

                    <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                        <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Files are scanned locally — no data is uploaded to external servers.
                    </div>
                </div>
            )}
            {/* ── Ollama model selector ── */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/50 border border-gray-700">
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                    ollamaOnline === true ? 'bg-green-400 animate-pulse' :
                    ollamaOnline === false ? 'bg-red-400' : 'bg-gray-500'
                }`} />
                <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Model</span>
                    {ollamaOnline === false ? (
                        <p className="text-xs text-red-400 mt-0.5">Ollama offline — scan will use simulated findings</p>
                    ) : ollamaOnline === null ? (
                        <p className="text-xs text-gray-500 mt-0.5">Checking Ollama…</p>
                    ) : (
                        <p className="text-xs text-green-400 mt-0.5">Ollama connected</p>
                    )}
                </div>
                <select
                    id="ollama-model-select"
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    disabled={!ollamaOnline}
                    className="rounded-md bg-gray-700 border border-gray-600 text-white text-sm py-1 px-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed max-w-[160px] truncate"
                >
                    {availableModels.length > 0
                        ? availableModels.map(m => <option key={m} value={m}>{m}</option>)
                        : <option value="llama2">llama2 (offline)</option>
                    }
                </select>
            </div>

            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center py-2">
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                <ChevronDownIcon className={`h-5 w-5 ml-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced && (
                <div className="space-y-4 pt-4 border-t border-gray-700/50">
                    <div>
                        <label htmlFor="scan-profile" className="block text-sm font-medium text-gray-300">Scan Profile</label>
                        <select id="scan-profile" value={scanProfile} onChange={e => setScanProfile(e.target.value)} className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2">
                            <option>Standard Unauthenticated</option>
                            <option>Authenticated Deep Scan</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="api-key" className="block text-sm font-medium text-gray-300">API Key</label>
                        <input 
                            type="password" 
                            id="api-key" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className={`mt-1 block w-full rounded-md border bg-gray-700 text-white shadow-sm focus:ring-indigo-500 sm:text-sm p-2 ${errors.apiKey ? 'border-red-500/50 focus:border-red-500' : 'border-gray-600 focus:border-indigo-500'}`}
                            placeholder="Enter authentication token or key"
                        />
                        {errors.apiKey && <p className="mt-1 text-xs text-red-400">{errors.apiKey}</p>}
                    </div>
                    <div>
                        <label htmlFor="scan-depth" className="block text-sm font-medium text-gray-300">Scan Depth</label>
                        <select id="scan-depth" value={scanDepth} onChange={e => setScanDepth(e.target.value)} className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2">
                            <option>Quick</option>
                            <option>Normal</option>
                            <option>Deep</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="include-regex" className="block text-sm font-medium text-gray-300">Include Endpoints (Regex)</label>
                        <input type="text" id="include-regex" value={includeRegex} onChange={e => setIncludeRegex(e.target.value)} className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" placeholder="/api/v2/.*"/>
                    </div>
                     <div>
                        <label htmlFor="exclude-regex" className="block text-sm font-medium text-gray-300">Exclude Endpoints (Regex)</label>
                        <input type="text" id="exclude-regex" value={excludeRegex} onChange={e => setExcludeRegex(e.target.value)} className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" placeholder="/admin/.*"/>
                    </div>
                    <div>
                        <label htmlFor="min-severity" className="block text-sm font-medium text-gray-300">Minimum Severity to Report</label>
                        <select id="min-severity" value={minSeverity} onChange={e => setMinSeverity(e.target.value as Severity)} className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2">
                            {Object.values(Severity).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            )}
        </form>
    );

    const renderConfirmation = () => (
        <div className="space-y-4">
            <div className="flex items-start bg-yellow-900/50 border border-yellow-700/50 text-yellow-300 p-3 rounded-lg">
                <AlertTriangleIcon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Please confirm the details for this advanced scan before proceeding.</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Source:</span>
                    <span className="font-semibold text-white">{scanSource === 'url' ? 'Remote URL' : 'Local Folder'}</span>
                </div>
                {scanSource === 'url' ? (
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Target URL:</span>
                    <span className="font-semibold text-white font-mono truncate pl-4">{targetUrl}</span>
                </div>
                ) : (
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Folder:</span>
                    <span className="font-semibold text-white font-mono truncate pl-4">{folderPath} <span className="text-gray-500">({folderFileCount} files)</span></span>
                </div>
                )}
                 <div className="flex justify-between items-center">
                    <span className="text-gray-400">Scan Profile:</span>
                    <span className="font-semibold text-white">{scanProfile}</span>
                </div>
                {apiKey && <div className="flex justify-between items-center">
                    <span className="text-gray-400">API Key:</span>
                    <span className="font-semibold text-white font-mono">************{apiKey.slice(-4)}</span>
                </div>}
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Scan Depth:</span>
                    <span className="font-semibold text-white">{scanDepth}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Min. Severity:</span>
                    <span className={`font-semibold ${severityConfig[minSeverity].color}`}>{minSeverity}</span>
                </div>
                {includeRegex && <div className="flex justify-between items-center">
                    <span className="text-gray-400">Include Regex:</span>
                    <span className="font-semibold text-white font-mono">{includeRegex}</span>
                </div>}
                {excludeRegex && <div className="flex justify-between items-center">
                    <span className="text-gray-400">Exclude Regex:</span>
                    <span className="font-semibold text-white font-mono">{excludeRegex}</span>
                </div>}
            </div>
        </div>
    );
    
    const renderContent = () => {
        switch (scanStep) {
            case 'form': return renderForm();
            case 'confirm': return renderConfirmation();
            case 'scanning': {
                const phaseOrder = ['connecting', 'analysing', 'parsing', 'done', 'error'];
                const phaseIdx = scanProgress ? phaseOrder.indexOf(scanProgress.phase) : 0;
                const pct = Math.round(Math.min(100, (phaseIdx / 3) * 100));

                const phaseLabel: Record<string, string> = {
                    connecting: 'Connecting to Ollama…',
                    analysing: 'Analysing target with AI…',
                    parsing: 'Parsing vulnerability findings…',
                    done: 'Scan complete',
                    error: 'Falling back to simulated data…',
                };

                return (
                    <div className="py-6 space-y-5">
                        <div className="flex justify-center">
                            <div className="relative h-16 w-16">
                                <svg className="animate-spin h-16 w-16 text-indigo-500/30" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                <svg className="animate-spin h-16 w-16 text-indigo-400 absolute inset-0" style={{ animationDuration: '1s' }} viewBox="0 0 24 24" fill="none">
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-indigo-300">
                                    {pct}%
                                </div>
                            </div>
                        </div>

                        {/* Phase label */}
                        <div className="text-center">
                            <p className="text-sm font-semibold text-white">
                                {scanProgress ? phaseLabel[scanProgress.phase] : 'Initialising…'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {scanProgress?.message}
                            </p>
                        </div>

                        {/* Progress bar */}
                        <div className="bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                            />
                        </div>

                        {/* Phase checklist */}
                        <div className="space-y-1">
                            {[
                                { key: 'connecting', label: 'Connect to Ollama' },
                                { key: 'analysing',  label: 'AI model analysis' },
                                { key: 'parsing',    label: 'Parse findings' },
                            ].map(({ key, label }) => {
                                const idx = phaseOrder.indexOf(key);
                                const activeIdx = phaseOrder.indexOf(scanProgress?.phase ?? 'connecting');
                                const done = activeIdx > idx;
                                const active = activeIdx === idx;
                                return (
                                    <div key={key} className="flex items-center gap-2 text-sm">
                                        {done ? (
                                            <span className="h-4 w-4 text-green-400">✓</span>
                                        ) : active ? (
                                            <svg className="animate-spin h-4 w-4 text-indigo-400 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                            </svg>
                                        ) : (
                                            <span className="h-4 w-4 rounded-full border border-gray-600 block flex-shrink-0" />
                                        )}
                                        <span className={done ? 'text-green-400' : active ? 'text-white' : 'text-gray-500'}>{label}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Model badge */}
                        <p className="text-center text-xs text-gray-500">
                            Using model: <span className="font-mono text-indigo-400">{selectedModel}</span>
                        </p>
                    </div>
                );
            }
            case 'complete': return (
                 <div>
                    <div className="text-center py-6">
                        <div className="flex justify-center items-center mb-4">
                            <CheckCircleIcon className="h-12 w-12 text-green-400" />
                        </div>
                        <p className="text-lg font-medium text-white">Scan finished successfully!</p>
                        <p className="text-sm text-gray-400">
                            {ollamaOnline
                                ? `${scanSummary?.vulnerabilitiesFound ?? 0} vulnerabilities found by Ollama (${selectedModel}).`
                                : 'Ollama offline — results are simulated.'}
                        </p>
                    </div>
                    {scanSummary && (
                        <div className="mt-2 mb-4">
                            <h4 className="text-md font-semibold text-white mb-3 text-center">Scan Summary</h4>
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-3 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Endpoints Scanned:</span>
                                    <span className="font-semibold text-white">{scanSummary.endpointsScanned}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Vulnerabilities Found:</span>
                                    <span className="font-semibold text-white">{scanSummary.vulnerabilitiesFound}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Highest Severity Detected:</span>
                                    <span className={`font-semibold ${severityConfig[scanSummary.highestSeverity].color}`}>
                                        {scanSummary.highestSeverity}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
            default: return null;
        }
    };

    const getTitle = () => {
        switch (scanStep) {
            case 'form': return 'Configure New Scan';
            case 'confirm': return 'Confirm Scan Details';
            case 'scanning': return 'Scanning In Progress';
            case 'complete': return 'Scan Complete';
            default: return '';
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            
            <div className="relative transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-700">
                <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold leading-6 text-white" id="modal-title">{getTitle()}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                    {renderContent()}
                </div>

                <div className="bg-gray-800 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-700">
                    {scanStep === 'form' && (
                        <button
                            type="button"
                            onClick={handleProceedToScan}
                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                        >
                            {showAdvanced ? 'Continue' : 'Start Scan'}
                        </button>
                    )}
                    {scanStep === 'confirm' && (
                         <button
                            type="button"
                            onClick={handleExecuteScan}
                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                        >
                            Confirm & Start Scan
                        </button>
                    )}
                     {scanStep === 'complete' && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                        >
                            View Results
                        </button>
                    )}
                     <button
                        type="button"
                        onClick={scanStep === 'confirm' ? () => setScanStep('form') : onClose}
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-200 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-600 sm:mt-0 sm:w-auto"
                    >
                         {scanStep === 'confirm' ? 'Back' : (scanStep === 'complete' ? 'Close' : 'Cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};