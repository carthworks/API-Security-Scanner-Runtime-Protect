import React, { useMemo } from 'react';
import type { Engagement, ScopeEndpoint, ComplianceItem, Vulnerability } from '../types';
import { ShieldIcon, ServerIcon, CheckCircleIcon, XCircleIcon, AlertTriangleIcon, ClipboardListIcon } from './Icons';

interface EngagementViewProps {
  vulnerabilities: Vulnerability[];
}

const initialCompliance: ComplianceItem[] = [
  { id: 'c1', standard: 'OWASP API Top 10 (2023)', control: 'API1: Broken Object Level Authorization', status: 'Fail', notes: 'Found 3 IDOR vulnerabilities in user resource.' },
  { id: 'c2', standard: 'OWASP API Top 10 (2023)', control: 'API2: Broken Authentication', status: 'Pass', notes: 'JWT implementation is robust.' },
  { id: 'c3', standard: 'OWASP API Top 10 (2023)', control: 'API3: Broken Object Property Level Auth', status: 'Pass', notes: 'Mass assignment protections in place.' },
  { id: 'c4', standard: 'OWASP API Top 10 (2023)', control: 'API4: Unrestricted Resource Consumption', status: 'Partial', notes: 'Rate limiting implemented, but pagination lacks strict bounds.' },
  { id: 'c5', standard: 'CERT-In', control: 'Secure Data Transmission (TLS)', status: 'Pass', notes: 'TLS 1.3 enforced across all endpoints.' },
  { id: 'c6', standard: 'ISO/IEC 27001:2022', control: 'A.8.31 Separation of development, test and production', status: 'Pass', notes: 'Verified logical separation.' },
];

export const EngagementView: React.FC<EngagementViewProps> = ({ vulnerabilities }) => {
  const endpoints = useMemo(() => {
    const unique = new Map<string, ScopeEndpoint>();
    
    vulnerabilities.forEach((v, i) => {
      const key = `${v.endpoint.method}-${v.endpoint.path}`;
      if (!unique.has(key)) {
        unique.set(key, {
          id: `ep-${i}`,
          method: v.endpoint.method,
          path: v.endpoint.path,
          description: `Discovered endpoint ${v.endpoint.path}`,
          owaspCategory: v.owaspId,
          riskLevel: v.severity,
          tested: true,
          vulnerabilityIds: [v.id],
        });
      } else {
        const existing = unique.get(key)!;
        existing.vulnerabilityIds.push(v.id);
        // Elevate risk if this vuln is higher
        const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1, Info: 0 };
        if (severityOrder[v.severity] > severityOrder[existing.riskLevel]) {
          existing.riskLevel = v.severity;
        }
      }
    });

    return Array.from(unique.values());
  }, [vulnerabilities]);

  const engagement: Engagement = {
    id: 'eng-1',
    name: 'Dynamic API Security Audit',
    targetBase: 'https://api.internal.example.com',
    environment: 'Staging',
    startDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    endpoints: endpoints,
    complianceItems: initialCompliance,
  };

  const testedCount = engagement.endpoints.filter(e => e.tested).length;
  const totalCount = engagement.endpoints.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Engagement Scope</h1>
        <p className="text-gray-400 mt-1">Track testing progress across the discovered {totalCount} endpoints and compliance controls.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">Target Environment</p>
            <p className="text-xl font-bold text-white mt-1">{engagement.environment}</p>
            <p className="text-xs text-indigo-400 mt-1 font-mono">{engagement.targetBase}</p>
          </div>
          <ServerIcon className="h-10 w-10 text-gray-600" />
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">Testing Progress</p>
            <p className="text-xl font-bold text-white mt-1">{testedCount} / {totalCount} Endpoints</p>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(testedCount / totalCount) * 100}%` }}></div>
            </div>
          </div>
          <ClipboardListIcon className="h-10 w-10 text-gray-600 ml-4" />
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">Compliance Status</p>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded">
                {engagement.complianceItems.filter(c => c.status === 'Pass').length} Pass
              </span>
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded">
                {engagement.complianceItems.filter(c => c.status === 'Fail').length} Fail
              </span>
            </div>
          </div>
          <ShieldIcon className="h-10 w-10 text-gray-600" />
        </div>
      </div>

      {/* Two columns: Endpoints and Compliance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Endpoint Tracking */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col h-[600px]">
          <div className="p-5 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Endpoint Inventory (SOW requirement)</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-800 text-xs text-gray-400 uppercase z-10 shadow-sm">
                <tr>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Endpoint</th>
                  <th className="py-3 px-4 font-semibold">Risk / Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {engagement.endpoints.map(ep => (
                  <tr key={ep.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 px-4">
                      {ep.tested ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-600 border-dashed"></div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                          ep.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                          ep.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                          ep.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>{ep.method}</span>
                        <span className="text-sm text-gray-300 font-mono truncate max-w-[180px]" title={ep.path}>{ep.path}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs w-fit px-2 rounded ${
                          ep.riskLevel === 'Critical' ? 'bg-red-500/20 text-red-400' :
                          ep.riskLevel === 'High' ? 'bg-orange-500/20 text-orange-400' :
                          ep.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>{ep.riskLevel}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{ep.owaspCategory}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compliance Checklist */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col h-[600px]">
          <div className="p-5 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Compliance & Controls Checklist</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {engagement.complianceItems.map(item => (
              <div key={item.id} className="p-4 rounded-lg bg-gray-900/50 border border-gray-700/50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {item.status === 'Pass' && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                    {item.status === 'Fail' && <XCircleIcon className="h-5 w-5 text-red-500" />}
                    {item.status === 'Partial' && <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />}
                    {item.status === 'N/A' && <div className="h-5 w-5 rounded-full bg-gray-600"></div>}
                    <span className="text-sm font-semibold text-white">{item.control}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold bg-gray-800 px-2 py-0.5 rounded">
                    {item.standard}
                  </span>
                </div>
                {item.notes && <p className="text-sm text-gray-400 ml-7 bg-gray-800/50 p-2 rounded">{item.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
