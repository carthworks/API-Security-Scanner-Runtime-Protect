import React, { useState, useRef, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { AIConfig, LoadTestMetric, LoadTestSummary } from '../types';
import { BACKEND_URL } from '../services/aiService';

interface LoadTestingViewProps { aiConfig: AIConfig; }

interface ChartPoint {
  t: string; rps: number; p50: number; p95: number; p99: number; err: number;
}

const DURATION_OPTIONS = [
  { label: '30 sec', value: 30 }, { label: '1 min', value: 60 },
  { label: '5 min', value: 300 }, { label: '15 min', value: 900 },
];

const USERS_OPTIONS = [10, 50, 100, 250, 500, 1000];

const StatBadge: React.FC<{ label: string; value: string | number; sub?: string; color?: string }> = 
  ({ label, value, sub, color = 'text-white' }) => (
  <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4 flex flex-col">
    <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
    <span className={`text-2xl font-bold mt-1 ${color}`}>{value}</span>
    {sub && <span className="text-xs text-gray-500 mt-1">{sub}</span>}
  </div>
);

const stabilityColor = (r?: string) => {
  if (!r) return 'text-gray-400';
  return { Stable: 'text-green-400', Degraded: 'text-yellow-400', Unstable: 'text-orange-400', Critical: 'text-red-400' }[r] ?? 'text-gray-400';
};

export const LoadTestingView: React.FC<LoadTestingViewProps> = ({ aiConfig }) => {
  // Config state
  const [targetUrl, setTargetUrl] = useState('https://api.example.com');
  const [endpointPath, setEndpointPath] = useState('/api/v1/users');
  const [endpointMethod, setEndpointMethod] = useState('GET');
  const [concurrentUsers, setConcurrentUsers] = useState(50);
  const [duration, setDuration] = useState(60);
  const [rampUp, setRampUp] = useState(10);
  const [authHeader, setAuthHeader] = useState('');
  const [authValue, setAuthValue] = useState('');

  // Run state
  const [status, setStatus] = useState<'idle' | 'running' | 'complete' | 'failed'>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [summary, setSummary] = useState<LoadTestSummary | null>(null);
  const [liveMetric, setLiveMetric] = useState<LoadTestMetric | null>(null);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const handleStart = useCallback(async () => {
    setStatus('running');
    setChartData([]);
    setSummary(null);
    setError(null);
    setLiveMetric(null);

    const body = {
      target_base_url: targetUrl,
      endpoints: [{ method: endpointMethod, path: endpointPath }],
      concurrent_users: concurrentUsers,
      duration_seconds: duration,
      ramp_up_seconds: rampUp,
      auth_headers: authHeader ? { [authHeader]: authValue } : {},
      request_timeout: 10,
      verify_ssl: false,
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/load-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? 'Failed to start');
      const { job_id } = await res.json();
      setJobId(job_id);

      const es = new EventSource(`${BACKEND_URL}/api/load-test/${job_id}/stream`);
      esRef.current = es;

      es.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'metric') {
          const m: LoadTestMetric = {
            timestamp: msg.data.timestamp,
            elapsedSeconds: msg.data.elapsed_seconds,
            rps: msg.data.rps,
            p50Ms: msg.data.p50_ms,
            p95Ms: msg.data.p95_ms,
            p99Ms: msg.data.p99_ms,
            minMs: msg.data.min_ms,
            maxMs: msg.data.max_ms,
            errorRate: msg.data.error_rate,
            totalRequests: msg.data.total_requests,
            failedRequests: msg.data.failed_requests,
            activeUsers: msg.data.active_users,
            statusCodes: msg.data.status_codes ?? {},
          };
          setLiveMetric(m);
          setChartData(prev => [...prev.slice(-59), {
            t: `${m.elapsedSeconds}s`,
            rps: m.rps, p50: m.p50Ms, p95: m.p95Ms, p99: m.p99Ms, err: m.errorRate,
          }]);
        } else if (msg.type === 'complete') {
          es.close();
          const s = msg.job?.summary;
          if (s) setSummary({
            totalRequests: s.total_requests, totalFailures: s.total_failures,
            avgRps: s.avg_rps, peakRps: s.peak_rps,
            avgResponseMs: s.avg_response_ms, p50Ms: s.p50_ms,
            p95Ms: s.p95_ms, p99Ms: s.p99_ms, maxResponseMs: s.max_response_ms,
            overallErrorRate: s.overall_error_rate,
            statusCodeDistribution: s.status_code_distribution ?? {},
            stabilityRating: s.stability_rating,
            slaBreach: s.sla_breach, durationSeconds: s.duration_seconds,
          });
          setStatus('complete');
        }
      };
      es.onerror = () => { es.close(); setStatus('failed'); setError('Stream disconnected.'); };
    } catch (err: any) {
      setStatus('failed');
      setError(err.message);
    }
  }, [targetUrl, endpointPath, endpointMethod, concurrentUsers, duration, rampUp, authHeader, authValue]);

  const handleStop = () => {
    esRef.current?.close();
    setStatus('idle');
  };

  const isRunning = status === 'running';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Load Testing</h1>
        <p className="text-gray-400 mt-1">Real concurrent HTTP load testing with live metrics streaming.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Config Panel ──────────────────────────────────────────────── */}
        <div className="xl:col-span-1 bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white border-b border-gray-700 pb-3">Test Configuration</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Target Base URL</label>
            <input
              value={targetUrl} onChange={e => setTargetUrl(e.target.value)} disabled={isRunning}
              className="w-full rounded-lg bg-gray-900 border border-gray-600 text-white p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
              placeholder="https://api.example.com"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">Method</label>
              <select
                value={endpointMethod} onChange={e => setEndpointMethod(e.target.value)} disabled={isRunning}
                className="w-full rounded-lg bg-gray-900 border border-gray-600 text-white p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
              >
                {['GET','POST','PUT','DELETE','PATCH'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Endpoint Path</label>
              <input
                value={endpointPath} onChange={e => setEndpointPath(e.target.value)} disabled={isRunning}
                className="w-full rounded-lg bg-gray-900 border border-gray-600 text-white p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                placeholder="/api/v1/endpoint"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Concurrent Users: <span className="text-indigo-400 font-bold">{concurrentUsers}</span>
            </label>
            <input
              type="range" min={1} max={1000} step={1} value={concurrentUsers}
              onChange={e => setConcurrentUsers(+e.target.value)} disabled={isRunning}
              className="w-full accent-indigo-500 disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              {USERS_OPTIONS.map(u => <span key={u}>{u}</span>)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Duration</label>
            <div className="grid grid-cols-4 gap-1">
              {DURATION_OPTIONS.map(o => (
                <button key={o.value} disabled={isRunning}
                  onClick={() => setDuration(o.value)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${duration === o.value ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >{o.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Ramp-up: <span className="text-indigo-400">{rampUp}s</span>
            </label>
            <input
              type="range" min={0} max={60} step={5} value={rampUp}
              onChange={e => setRampUp(+e.target.value)} disabled={isRunning}
              className="w-full accent-indigo-500 disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Auth Header (optional)</label>
            <input
              value={authHeader} onChange={e => setAuthHeader(e.target.value)} disabled={isRunning}
              className="w-full rounded-lg bg-gray-900 border border-gray-600 text-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              placeholder="Authorization"
            />
            <input
              value={authValue} onChange={e => setAuthValue(e.target.value)} disabled={isRunning}
              className="w-full rounded-lg bg-gray-900 border border-gray-600 text-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              placeholder="Bearer token..."
            />
          </div>

          {isRunning ? (
            <button onClick={handleStop}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-colors flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              Stop Test
            </button>
          ) : (
            <button onClick={handleStart}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors">
              ▶  Start Load Test
            </button>
          )}

          {error && (
            <div className="text-sm text-red-400 bg-red-900/30 border border-red-700/50 rounded-lg p-3">{error}</div>
          )}
        </div>

        {/* ── Results Panel ─────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">
          {/* Live counters */}
          {(isRunning || status === 'complete') && liveMetric && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBadge label="Current RPS" value={liveMetric.rps.toFixed(1)} color="text-indigo-400" />
              <StatBadge label="p95 Response" value={`${liveMetric.p95Ms.toFixed(0)}ms`}
                color={liveMetric.p95Ms > 200 ? 'text-red-400' : 'text-green-400'} />
              <StatBadge label="Error Rate" value={`${liveMetric.errorRate.toFixed(1)}%`}
                color={liveMetric.errorRate > 5 ? 'text-red-400' : 'text-green-400'} />
              <StatBadge label="Total Requests" value={liveMetric.totalRequests.toLocaleString()} color="text-white" />
            </div>
          )}

          {/* RPS Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Throughput — Requests / Second</h3>
            {chartData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-500 text-sm">
                {isRunning ? 'Waiting for first metric…' : 'Start a test to see live data'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="t" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="rps" stroke="#818cf8" strokeWidth={2} dot={false} name="RPS" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Response Time Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Response Time (ms) — p50 / p95 / p99</h3>
            {chartData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-500 text-sm">
                {isRunning ? 'Waiting for first metric…' : 'No data yet'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="t" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="p50" stroke="#34d399" strokeWidth={2} dot={false} name="p50" />
                  <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} dot={false} name="p95" />
                  <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} dot={false} name="p99" />
                  <Line type="monotone" dataKey="err" stroke="#f43f5e" strokeWidth={1} dot={false} name="Err%" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Final Summary */}
          {status === 'complete' && summary && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Test Complete — Summary</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  summary.stabilityRating === 'Stable' ? 'bg-green-900/50 text-green-400' :
                  summary.stabilityRating === 'Degraded' ? 'bg-yellow-900/50 text-yellow-400' :
                  summary.stabilityRating === 'Unstable' ? 'bg-orange-900/50 text-orange-400' :
                  'bg-red-900/50 text-red-400'
                }`}>{summary.stabilityRating}</span>
              </div>
              {summary.slaBreach && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 border border-red-700/40 rounded-lg p-3">
                  ⚠ SLA Breach — p95 ({summary.p95Ms.toFixed(0)}ms) exceeds 200ms threshold
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatBadge label="Total Requests" value={summary.totalRequests.toLocaleString()} />
                <StatBadge label="Total Failures" value={summary.totalFailures} color={summary.totalFailures > 0 ? 'text-red-400' : 'text-green-400'} />
                <StatBadge label="Avg RPS" value={summary.avgRps.toFixed(1)} color="text-indigo-400" />
                <StatBadge label="Peak RPS" value={summary.peakRps.toFixed(1)} color="text-indigo-300" />
                <StatBadge label="p50 (ms)" value={summary.p50Ms.toFixed(1)} color="text-green-400" />
                <StatBadge label="p95 (ms)" value={summary.p95Ms.toFixed(1)} color={summary.slaBreach ? 'text-red-400' : 'text-green-400'} />
                <StatBadge label="p99 (ms)" value={summary.p99Ms.toFixed(1)} />
                <StatBadge label="Max (ms)" value={summary.maxResponseMs.toFixed(1)} />
                <StatBadge label="Error Rate" value={`${summary.overallErrorRate.toFixed(2)}%`} color={summary.overallErrorRate > 1 ? 'text-red-400' : 'text-green-400'} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Status Code Distribution</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(summary.statusCodeDistribution).map(([code, count]) => (
                    <span key={code} className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                      code.startsWith('2') ? 'bg-green-900/50 text-green-400' :
                      code.startsWith('4') ? 'bg-yellow-900/50 text-yellow-400' :
                      code.startsWith('5') ? 'bg-red-900/50 text-red-400' : 'bg-gray-700 text-gray-300'
                    }`}>
                      {code}: {count}
                    </span>
                  ))}
                  {Object.keys(summary.statusCodeDistribution).length === 0 && (
                    <span className="text-xs text-gray-500">No successful responses recorded</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Idle placeholder */}
          {status === 'idle' && (
            <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-xl h-64 flex flex-col items-center justify-center gap-3 text-gray-500">
              <svg className="h-12 w-12 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm font-medium">Configure and start a load test to see live metrics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
