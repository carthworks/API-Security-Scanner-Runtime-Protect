import React, { useState, useEffect } from 'react';
import { Vulnerability, VulnerabilityStatus, Severity } from '../types';
import { NEW_SCAN_FINDING, severityConfig } from '../constants';
import { XIcon, CheckCircleIcon, ChevronDownIcon, AlertTriangleIcon } from './Icons';

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
    const [targetUrl, setTargetUrl] = useState('https://api.example.com/v2/products/search');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [scanProfile, setScanProfile] = useState('Standard Unauthenticated');
    const [apiKey, setApiKey] = useState('');
    const [scanDepth, setScanDepth] = useState('Normal');
    const [includeRegex, setIncludeRegex] = useState('');
    const [excludeRegex, setExcludeRegex] = useState('/api/v1/health');
    const [minSeverity, setMinSeverity] = useState<Severity>(Severity.Low);
    
    const [errors, setErrors] = useState<{ scanName?: string; targetUrl?: string; apiKey?: string }>({});
    const [scanSummary, setScanSummary] = useState<ScanSummary | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal is opened, but keep form values for convenience
            setScanStep('form');
            setScanSummary(null);
            setErrors({});
        }
    }, [isOpen]);

    const validateForm = (): boolean => {
        const newErrors: { scanName?: string; targetUrl?: string; apiKey?: string } = {};
        if (!scanName.trim()) {
            newErrors.scanName = 'Scan name is required.';
        }
        if (!targetUrl.trim()) {
            newErrors.targetUrl = 'Target URL is required.';
        } else {
            try {
                new URL(targetUrl); // Basic URL validation
            } catch (_) {
                newErrors.targetUrl = 'Please enter a valid URL.';
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

    const handleExecuteScan = () => {
        setScanStep('scanning');
        
        // Simulate a scan that takes 3 seconds
        setTimeout(() => {
            const discoveredAt = new Date().toISOString();
            const newVulnerability: Vulnerability = {
                ...NEW_SCAN_FINDING,
                id: `vuln-${Date.now()}`,
                endpoint: {
                    method: 'GET',
                    path: targetUrl ? new URL(targetUrl).pathname : '/simulated/path',
                },
                discoveredAt,
                statusHistory: [
                    { status: VulnerabilityStatus.New, timestamp: discoveredAt }
                ],
                assignee: undefined,
            };

            const summary = {
                vulnerabilitiesFound: 1,
                highestSeverity: NEW_SCAN_FINDING.severity,
                endpointsScanned: Math.floor(Math.random() * 50) + 10,
            };
            setScanSummary(summary);
            
            onAddVulnerability(newVulnerability);
            setScanStep('complete');
        }, 3000);
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
                    <span className="text-gray-400">Target URL:</span>
                    <span className="font-semibold text-white font-mono truncate pl-4">{targetUrl}</span>
                </div>
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
            case 'scanning': return (
                <div className="text-center py-8">
                    <div className="flex justify-center items-center mb-4">
                       <svg className="animate-spin h-10 w-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <p className="text-white">Scanning {targetUrl}...</p>
                    <p className="text-sm text-gray-400">This will take a moment.</p>
                </div>
            );
            case 'complete': return (
                 <div>
                    <div className="text-center py-8">
                        <div className="flex justify-center items-center mb-4">
                            <CheckCircleIcon className="h-12 w-12 text-green-400" />
                        </div>
                        <p className="text-lg font-medium text-white">Scan finished successfully!</p>
                        <p className="text-sm text-gray-400">The results have been added to the main list.</p>
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