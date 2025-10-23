import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Dot } from 'recharts';
import { ZapIcon } from './Icons';

interface TrafficDataPoint {
  time: string;
  rps: number; // requests per second
  latency: number; // in ms
  isAnomaly?: boolean;
}

const MAX_DATA_POINTS = 450; // 15 minutes of data at 2s intervals
const NORMAL_RPS = { min: 50, max: 150 };
const NORMAL_LATENCY = { min: 80, max: 200 };


const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-gray-700 text-white rounded-md border border-gray-600 shadow-lg">
        <p className="font-bold">{label}</p>
        <p style={{ color: '#8884d8' }}>{`RPS: ${payload[0].value}`}</p>
        <p style={{ color: '#82ca9d' }}>{`Latency: ${payload[1].value} ms`}</p>
      </div>
    );
  }
  return null;
};

const AnomalyDot: React.FC<any> = (props) => {
    const { cx, cy, payload } = props;
    if (payload.isAnomaly) {
        return <Dot cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#fecaca" strokeWidth={2} />;
    }
    return null;
};

const generateInitialData = (): TrafficDataPoint[] => {
    const data: TrafficDataPoint[] = [];
    const now = new Date();
    for (let i = MAX_DATA_POINTS - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 2000);
        data.push({
            time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            rps: Math.floor(Math.random() * (NORMAL_RPS.max - NORMAL_RPS.min + 1) + NORMAL_RPS.min),
            latency: Math.floor(Math.random() * (NORMAL_LATENCY.max - NORMAL_LATENCY.min + 1) + NORMAL_LATENCY.min),
        });
    }
    return data;
};

export const LiveTrafficChart: React.FC = () => {
    const [data, setData] = useState<TrafficDataPoint[]>(generateInitialData);
    const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m'>('1m');

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const isAnomaly = Math.random() < 0.05; // 5% chance of anomaly
            const newPoint: TrafficDataPoint = {
                time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                 rps: isAnomaly
                    ? Math.floor(Math.random() * (70 - 20 + 1) + 20) // Drop RPS
                    : Math.floor(Math.random() * (NORMAL_RPS.max - NORMAL_RPS.min + 1) + NORMAL_RPS.min),
                latency: isAnomaly
                    ? Math.floor(Math.random() * (450 - 300 + 1) + 300) // Spike latency
                    : Math.floor(Math.random() * (NORMAL_LATENCY.max - NORMAL_LATENCY.min + 1) + NORMAL_LATENCY.min),
                isAnomaly,
            };
            
            setData(currentData => [...currentData, newPoint].slice(-MAX_DATA_POINTS));
        }, 2000); // Update every 2 seconds

        return () => clearInterval(interval);
    }, []);
    
    const visibleData = useMemo(() => {
        const pointsPerTimeframe = { '1m': 30, '5m': 150, '15m': 450 };
        return data.slice(-pointsPerTimeframe[timeframe]);
    }, [data, timeframe]);

    const trafficHealth = useMemo(() => {
        if (data.length === 0) return { index: 0, color: 'text-gray-400', label: 'No Data' };
        const latest = data[data.length - 1];

        // Normalize RPS (higher is better)
        const rpsScore = Math.max(0, Math.min(1, (latest.rps - NORMAL_RPS.min) / (NORMAL_RPS.max - NORMAL_RPS.min)));
        // Normalize Latency (lower is better)
        const latencyScore = 1 - Math.max(0, Math.min(1, (latest.latency - NORMAL_LATENCY.min) / (NORMAL_LATENCY.max - NORMAL_LATENCY.min)));
        const index = Math.round((rpsScore * 0.6 + latencyScore * 0.4) * 100);

        let color = 'text-green-400';
        let label = 'Healthy';
        if (index < 75) { color = 'text-yellow-400'; label = 'Degraded'; }
        if (index < 50) { color = 'text-red-400'; label = 'Unhealthy'; }
        if (latest.isAnomaly) { label = 'Anomaly Detected!'; color = 'text-red-400'; }

        return { index, color, label };
    }, [data]);
    
    const currentMetrics = useMemo(() => data[data.length - 1] || { rps: 0, latency: 0 }, [data]);

    const timeframeButtons = [
        { label: '1m', value: '1m' },
        { label: '5m', value: '5m' },
        { label: '15m', value: '15m' },
    ] as const;

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 h-96 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">Live API Performance</h3>
                    <p className="text-sm text-gray-400">Real-time requests and latency metrics.</p>
                </div>
                 <div className="flex items-center space-x-2 mt-2 sm:mt-0 p-1 bg-gray-900/50 rounded-md">
                    {timeframeButtons.map(btn => (
                        <button 
                            key={btn.value}
                            onClick={() => setTimeframe(btn.value)}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                timeframe === btn.value ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'
                            }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-900/50 p-3 rounded-md">
                    <div className="text-xs text-gray-400 uppercase font-semibold">Current RPS</div>
                    <div className="text-2xl font-bold text-indigo-400">{currentMetrics.rps}</div>
                </div>
                 <div className="bg-gray-900/50 p-3 rounded-md">
                    <div className="text-xs text-gray-400 uppercase font-semibold">Avg Latency</div>
                    <div className="text-2xl font-bold text-teal-400">{currentMetrics.latency} <span className="text-lg">ms</span></div>
                </div>
                 <div className="bg-gray-900/50 p-3 rounded-md">
                    <div className="flex justify-between items-center text-xs text-gray-400 uppercase font-semibold">
                        <span>Traffic Health</span>
                        <span className={`font-bold ${trafficHealth.color}`}>{trafficHealth.label}</span>
                    </div>
                    <div className={`text-2xl font-bold ${trafficHealth.color}`}>{trafficHealth.index} <span className="text-lg">/ 100</span></div>
                </div>
            </div>

            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={visibleData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                        <XAxis dataKey="time" stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" stroke="#8884d8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="rps" name="Requests/sec" stroke="#8884d8" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line yAxisId="right" type="monotone" dataKey="latency" name="Latency (ms)" stroke="#82ca9d" strokeWidth={2} dot={<AnomalyDot />} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};