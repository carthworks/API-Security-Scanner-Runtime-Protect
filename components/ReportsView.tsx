import React, { useState } from 'react';
import type { Vulnerability } from '../types';
import { BACKEND_URL } from '../services/aiService';
import { FileTextIcon, ShieldIcon, ServerIcon, CheckCircleIcon, ArrowDownRightIcon, AlertTriangleIcon } from './Icons';

interface ReportsViewProps {
  vulnerabilities: Vulnerability[];
}

type ReportType = 'vapt' | 'executive_summary' | 'load_test' | 'attestation';

const REPORT_CARDS = [
  {
    id: 'vapt' as ReportType,
    title: 'VAPT Detailed Report',
    description: 'Comprehensive technical report with CVSS scores, evidence, OWASP mappings, and AI-generated remediation advice.',
    icon: <ShieldIcon className="h-8 w-8 text-indigo-400" />,
    color: 'border-indigo-500/50',
    bg: 'bg-indigo-500/10'
  },
  {
    id: 'executive_summary' as ReportType,
    title: 'Executive Summary',
    description: '1-page high-level risk overview for management. Highlights key findings and overall security posture without technical jargon.',
    icon: <FileTextIcon className="h-8 w-8 text-blue-400" />,
    color: 'border-blue-500/50',
    bg: 'bg-blue-500/10'
  },
  {
    id: 'load_test' as ReportType,
    title: 'Load Test Report',
    description: 'Performance metrics including concurrent users, throughput (RPS), latencies (p95, p99), error rates, and stability rating.',
    icon: <ServerIcon className="h-8 w-8 text-orange-400" />,
    color: 'border-orange-500/50',
    bg: 'bg-orange-500/10'
  },
  {
    id: 'attestation' as ReportType,
    title: 'Attestation Certificate',
    description: 'Formal, signed certificate of engagement completion. Used for compliance, partners, and stakeholders.',
    icon: <CheckCircleIcon className="h-8 w-8 text-green-400" />,
    color: 'border-green-500/50',
    bg: 'bg-green-500/10'
  }
];

export const ReportsView: React.FC<ReportsViewProps> = ({ vulnerabilities }) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('vapt');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsGenerating(true);
    setError(null);

    // Mock data for the backend payload
    const payload = {
      report_type: selectedReport,
      engagement_meta: {
        client_name: "Acme Corp",
        project_name: "Q3 API Security Assessment",
        target_urls: ["https://api.internal.acme.com"],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
      },
      // Backend expects backend models, but mapping is similar enough.
      // We pass the frontend vulnerabilities directly. The backend parses what it needs.
      findings: vulnerabilities.map(v => ({
        id: v.id,
        title: v.type,
        description: v.description,
        severity: v.severity,
        cvss_score: v.cvss?.score ?? 0,
        cvss_vector: v.cvss?.vector ?? "",
        owasp_category: v.owaspId,
        endpoint: `${v.endpoint.method} ${v.endpoint.path}`,
        remediation: v.remediation ?? "No AI remediation generated.",
        evidence: v.evidence ?? "No evidence provided."
      })),
      load_test_summary: {
        total_requests: 15420,
        total_failures: 12,
        avg_rps: 257.0,
        peak_rps: 310.5,
        avg_response_ms: 85.4,
        p50_ms: 70.0,
        p95_ms: 145.0,
        p99_ms: 210.0,
        max_response_ms: 450.0,
        overall_error_rate: 0.08,
        status_code_distribution: { "200": 15000, "201": 408, "500": 12 },
        stability_rating: "Stable",
        sla_breach: false,
        duration_seconds: 60
      }
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/report/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${await response.text()}`);
      }

      // Trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Sentinel_${selectedReport}_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate PDF report.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Generate Reports</h1>
        <p className="text-gray-400 mt-1">Export professional, SOW-aligned PDF deliverables for stakeholders and compliance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORT_CARDS.map(card => (
          <button
            key={card.id}
            onClick={() => setSelectedReport(card.id)}
            className={`text-left p-6 rounded-xl border-2 transition-all duration-200 ${
              selectedReport === card.id 
                ? `${card.color} bg-gray-800 shadow-lg shadow-indigo-900/20` 
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${selectedReport === card.id ? card.bg : 'bg-gray-700'}`}>
                {card.icon}
              </div>
              <div>
                <h3 className={`text-lg font-bold ${selectedReport === card.id ? 'text-white' : 'text-gray-300'}`}>
                  {card.title}
                </h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
            {selectedReport === card.id && (
              <div className="mt-4 flex items-center text-sm font-semibold text-indigo-400">
                <CheckCircleIcon className="h-4 w-4 mr-1" /> Selected
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Export Settings</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
             <label className="block text-sm font-medium text-gray-300 mb-1">Client Name</label>
             <input type="text" defaultValue="Acme Corp" className="w-full rounded-md bg-gray-900 border-gray-600 text-white p-2 text-sm" />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-300 mb-1">Project Name</label>
             <input type="text" defaultValue="Q3 API Security Assessment" className="w-full rounded-md bg-gray-900 border-gray-600 text-white p-2 text-sm" />
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-500/50 text-red-400 text-sm p-4 rounded-lg flex items-start gap-3">
             <AlertTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
             <p>{error}</p>
          </div>
        )}

        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-indigo-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              Generating PDF...
            </>
          ) : (
            <>
              <ArrowDownRightIcon className="h-5 w-5" />
              Download {REPORT_CARDS.find(c => c.id === selectedReport)?.title}
            </>
          )}
        </button>
      </div>

    </div>
  );
};
