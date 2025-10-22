import React, { useState, useCallback, useEffect } from 'react';
import { Severity, Vulnerability, VulnerabilityStatus } from '../types';
import { getRemediation, getRelatedCVEs, CveInfo, getCveDetails, CveDetails } from '../services/geminiService';
import { severityConfig, severityDotColor, statusConfig, statusTimelineDotColor } from '../constants';
import { ChevronRightIcon, ChevronDownIcon, ExternalLinkIcon } from './Icons';

const VulnerabilityListItem: React.FC<{
    vulnerability: Vulnerability;
    onSelect: () => void;
    isSelected: boolean;
    onStatusChange: (newStatus: VulnerabilityStatus) => void;
}> = ({ vulnerability, onSelect, isSelected, onStatusChange }) => {
    
    const handleActionClick = (e: React.MouseEvent, newStatus: VulnerabilityStatus) => {
        e.stopPropagation();
        onStatusChange(newStatus);
    };

    return (
        <li
            onClick={onSelect}
            className={`p-4 rounded-lg cursor-pointer transition-colors duration-200 ${isSelected ? 'bg-indigo-600/20 border-indigo-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700/50'} border`}
        >
            <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                        <span className={`h-2.5 w-2.5 rounded-full mr-2 flex-shrink-0 ${severityDotColor[vulnerability.severity]}`} aria-label={`${vulnerability.severity} severity`}></span>
                        <h3 className="font-semibold text-white truncate pr-2" title={vulnerability.type}>{vulnerability.type}</h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-mono">{vulnerability.owaspId}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${severityConfig[vulnerability.severity].bg} ${severityConfig[vulnerability.severity].color} flex-shrink-0`}>
                    {vulnerability.severity}
                </span>
            </div>
            <p className="text-sm text-gray-400 font-mono mt-2">
                <span className={`font-bold mr-2 ${vulnerability.endpoint.method === 'POST' ? 'text-green-400' : 'text-blue-400'}`}>{vulnerability.endpoint.method}</span>
                {vulnerability.endpoint.path}
            </p>
            <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-gray-500">Discovered: {new Date(vulnerability.discoveredAt).toLocaleDateString()}</span>

                {vulnerability.status === VulnerabilityStatus.New ? (
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={(e) => handleActionClick(e, VulnerabilityStatus.Acknowledged)} 
                            className="px-2 py-1 font-semibold text-yellow-300 bg-yellow-900/50 hover:bg-yellow-800/70 rounded transition-colors"
                            aria-label={`Acknowledge ${vulnerability.type}`}
                        >
                            Acknowledge
                        </button>
                        <button 
                            onClick={(e) => handleActionClick(e, VulnerabilityStatus.Fixed)} 
                            className="px-2 py-1 font-semibold text-green-300 bg-green-900/50 hover:bg-green-800/70 rounded transition-colors"
                            aria-label={`Mark ${vulnerability.type} as fixed`}
                        >
                            Fix
                        </button>
                    </div>
                ) : (
                    <span className={`px-2 py-1 font-bold rounded-full ${statusConfig[vulnerability.status].bg} ${statusConfig[vulnerability.status].color}`}>
                        {vulnerability.status}
                    </span>
                )}
            </div>
        </li>
    );
};

const VulnerabilityDetail: React.FC<{ vulnerability: Vulnerability; onStatusChange: (id: string, newStatus: VulnerabilityStatus) => void; }> = ({ vulnerability, onStatusChange }) => {
    const [remediation, setRemediation] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [cveInfo, setCveInfo] = useState<CveInfo | null>(null);
    const [isCveLoading, setIsCveLoading] = useState(false);
    const [cveError, setCveError] = useState<string | null>(null);

    const [selectedCveId, setSelectedCveId] = useState<string | null>(null);
    const [cveDetails, setCveDetails] = useState<CveDetails | null>(null);
    const [isCveDetailsLoading, setIsCveDetailsLoading] = useState(false);
    const [cveDetailsError, setCveDetailsError] = useState<string | null>(null);

    useEffect(() => {
        setRemediation(null);
        setError(null);
        setCveInfo(null);
        setCveError(null);
        setSelectedCveId(null);
        setCveDetails(null);
        setCveDetailsError(null);
    }, [vulnerability.id]);

    const handleGetRemediation = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setRemediation(null);
        try {
            const result = await getRemediation(vulnerability);
            setRemediation(result);
        } catch (err) {
            setError('Failed to get remediation advice. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [vulnerability]);

     const handleGetCves = useCallback(async () => {
        setIsCveLoading(true);
        setCveError(null);
        setCveInfo(null);
        try {
            const result = await getRelatedCVEs(vulnerability);
            setCveInfo(result);
        } catch (err) {
            setCveError('Failed to get CVE information. Please try again.');
            console.error(err);
        } finally {
            setIsCveLoading(false);
        }
    }, [vulnerability]);

    const handleGetCveDetails = useCallback(async (cveId: string) => {
        if (selectedCveId === cveId) {
            setSelectedCveId(null);
            setCveDetails(null);
            return;
        }

        setSelectedCveId(cveId);
        setIsCveDetailsLoading(true);
        setCveDetailsError(null);
        setCveDetails(null);

        try {
            const result = await getCveDetails(cveId);
            setCveDetails(result);
        } catch (err) {
            setCveDetailsError(`Failed to fetch details for ${cveId}.`);
            console.error(err);
        } finally {
            setIsCveDetailsLoading(false);
        }
    }, [selectedCveId]);

    return (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 h-full overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-white flex-1 pr-4">{vulnerability.type}</h2>
                <div className="relative">
                    <select
                        value={vulnerability.status}
                        onChange={(e) => onStatusChange(vulnerability.id, e.target.value as VulnerabilityStatus)}
                        className={`appearance-none w-full pl-3 pr-8 py-1 text-sm font-bold rounded-full border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors ${statusConfig[vulnerability.status].bg} ${statusConfig[vulnerability.status].color}`}
                        aria-label="Change vulnerability status"
                    >
                        {Object.values(VulnerabilityStatus).map(status => (
                            <option key={status} value={status} className="bg-gray-900 text-white font-bold">
                                {status}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div className="bg-gray-900/50 p-3 rounded-md">
                    <div className="text-gray-400 font-semibold">Severity</div>
                    <div className={`font-bold ${severityConfig[vulnerability.severity].color}`}>{vulnerability.severity}</div>
                </div>
                 <div className="bg-gray-900/50 p-3 rounded-md">
                    <div className="text-gray-400 font-semibold">OWASP Top 10</div>
                    <div className="font-bold text-gray-200">{vulnerability.owaspId}</div>
                </div>
            </div>
            
            <div className="space-y-6">
                <div>
                    <h4 className="font-semibold text-gray-300 mb-1">Description</h4>
                    <p className="text-gray-400 text-sm">{vulnerability.description}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-gray-300 mb-1">Endpoint</h4>
                    <p className="text-gray-400 text-sm font-mono bg-gray-900/50 p-2 rounded-md">{vulnerability.endpoint.method} {vulnerability.endpoint.path}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-gray-300 mb-1">Details</h4>
                    <p className="text-gray-400 text-sm bg-gray-900/50 p-3 rounded-md whitespace-pre-wrap font-mono">{vulnerability.details}</p>
                </div>

                 <div>
                    <h4 className="font-semibold text-gray-300 mb-3">Activity Timeline</h4>
                    <ul className="space-y-4">
                        {vulnerability.statusHistory.slice().reverse().map((entry, index, arr) => (
                           <li key={entry.timestamp} className="relative pl-8">
                                <div className={`absolute -left-[calc(0.375rem)] top-1 h-3 w-3 rounded-full ${statusTimelineDotColor[entry.status]}`}></div>
                                {index < arr.length - 1 && <div className="absolute -left-1 top-4 h-full w-0.5 bg-gray-700"></div>}
                                <p className="font-semibold text-gray-200 text-sm">{entry.status}</p>
                                <p className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="border-t border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Remediation</h3>
                    <button 
                        onClick={handleGetRemediation}
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                            </>
                        ) : 'Get Code-Level Fix'}
                    </button>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    {remediation && (
                        <div className="mt-4 bg-gray-900 p-4 rounded-lg border border-gray-600">
                             <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">{remediation}</pre>
                        </div>
                    )}
                </div>

                 <div className="border-t border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Related CVEs & Exploits</h3>
                    <p className="text-sm text-gray-400 mb-3">Use Google Search to find relevant, publicly disclosed vulnerabilities.</p>
                    <button 
                        onClick={handleGetCves}
                        disabled={isCveLoading}
                        className="w-full bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                    >
                        {isCveLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Searching...
                            </>
                        ) : 'Search for CVEs'}
                    </button>
                    {cveError && <p className="text-red-500 text-sm mt-2">{cveError}</p>}
                    {cveInfo && (
                        <div className="mt-4 bg-gray-900 p-4 rounded-lg border border-gray-600">
                             <div className="text-sm text-gray-300 whitespace-pre-wrap font-sans">{cveInfo.summary}</div>
                             
                             {cveInfo.cveIds.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-gray-700">
                                    <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Relevant CVEs Found</h5>
                                    <div className="space-y-2">
                                        {cveInfo.cveIds.map(cveId => (
                                            <div key={cveId}>
                                                <button onClick={() => handleGetCveDetails(cveId)} className="flex items-center text-indigo-400 font-mono text-sm hover:text-indigo-300 group">
                                                    {selectedCveId === cveId ? <ChevronDownIcon className="h-5 w-5 mr-1"/> : <ChevronRightIcon className="h-5 w-5 mr-1"/>}
                                                    <span className="group-hover:underline">{cveId}</span>
                                                </button>
                                                {selectedCveId === cveId && (
                                                    <div className="pl-6 mt-2 ml-2 border-l-2 border-indigo-500/50">
                                                        {isCveDetailsLoading && <p className="text-sm text-gray-400">Loading details...</p>}
                                                        {cveDetailsError && <p className="text-sm text-red-500">{cveDetailsError}</p>}
                                                        {cveDetails && (
                                                            <div className="space-y-3 text-sm text-gray-300">
                                                                <div>
                                                                    <strong className="text-gray-200">CVSS Score:</strong> 
                                                                    <span className="font-bold text-yellow-400 ml-2">{cveDetails.cvss.score}</span>
                                                                    <span className="text-gray-500 ml-2 font-mono text-xs">{cveDetails.cvss.vector}</span>
                                                                </div>
                                                                <div>
                                                                    <strong className="text-gray-200">Description:</strong>
                                                                    <p className="text-gray-400 mt-1">{cveDetails.description}</p>
                                                                </div>
                                                                <div>
                                                                    <strong className="text-gray-200">Affected Software:</strong>
                                                                    <p className="text-gray-400 mt-1">{cveDetails.affected}</p>
                                                                </div>
                                                                {cveDetails.references?.length > 0 && (
                                                                    <div>
                                                                        <strong className="text-gray-200">References:</strong>
                                                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                                                            {cveDetails.references.map((ref, i) => (
                                                                                <li key={i}><a href={ref} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline truncate block">{ref}</a></li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             )}

                             {cveInfo.sources.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-gray-700">
                                    <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Sources</h5>
                                    <ul className="space-y-1">
                                        {cveInfo.sources.map((source, index) => (
                                            <li key={index}>
                                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm truncate flex items-center group">
                                                    <span className="group-hover:underline flex-1 truncate">{source.title || source.uri}</span>
                                                    <ExternalLinkIcon className="h-4 w-4 ml-2 flex-shrink-0 text-gray-500 group-hover:text-indigo-400" />
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                             )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface VulnerabilitiesViewProps {
    vulnerabilities: Vulnerability[];
    setVulnerabilities: React.Dispatch<React.SetStateAction<Vulnerability[]>>;
}

export const VulnerabilitiesView: React.FC<VulnerabilitiesViewProps> = ({ vulnerabilities, setVulnerabilities }) => {
  const [selectedVulnerabilityId, setSelectedVulnerabilityId] = useState<string | null>(vulnerabilities[0]?.id || null);

  useEffect(() => {
    if (!selectedVulnerabilityId && vulnerabilities.length > 0) {
        setSelectedVulnerabilityId(vulnerabilities[0].id);
    }
  }, [vulnerabilities, selectedVulnerabilityId]);

  const selectedVulnerability = vulnerabilities.find(v => v.id === selectedVulnerabilityId);

  const handleStatusChange = (vulnerabilityId: string, newStatus: VulnerabilityStatus) => {
    setVulnerabilities(currentVulnerabilities => 
        currentVulnerabilities.map(v => {
            if (v.id === vulnerabilityId) {
                if (v.status === newStatus) return v; // Avoid duplicate history entries
                
                const newHistoryEntry = {
                    status: newStatus,
                    timestamp: new Date().toISOString(),
                };
                return {
                    ...v,
                    status: newStatus,
                    statusHistory: [...v.statusHistory, newHistoryEntry],
                };
            }
            return v;
        })
    );
  };

  return (
    <div className="flex flex-col h-full">
        <h1 className="text-3xl font-bold text-white mb-6">Vulnerabilities</h1>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
            <div className="lg:col-span-1 h-full overflow-y-auto pr-2">
                <ul className="space-y-3">
                    {vulnerabilities.map(v => (
                        <VulnerabilityListItem 
                            key={v.id}
                            vulnerability={v}
                            isSelected={v.id === selectedVulnerabilityId}
                            onSelect={() => setSelectedVulnerabilityId(v.id)}
                            onStatusChange={(newStatus) => handleStatusChange(v.id, newStatus)}
                        />
                    ))}
                </ul>
            </div>
            <div className="lg:col-span-2 h-full overflow-hidden">
                {selectedVulnerability ? (
                    <VulnerabilityDetail 
                        vulnerability={selectedVulnerability} 
                        onStatusChange={handleStatusChange} 
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-800 rounded-lg text-gray-500">
                        {vulnerabilities.length > 0 ? 'Select a vulnerability to see details.' : 'No vulnerabilities found. Run a new scan to get started.'}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};