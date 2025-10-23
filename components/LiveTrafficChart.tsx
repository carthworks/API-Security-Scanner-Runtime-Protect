import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrafficDataPoint {
  time: string;
  rps: number; // requests per second
  latency: number; // in ms
}

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

const generateInitialData = (): TrafficDataPoint[] => {
    const data: TrafficDataPoint[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 2000);
        data.push({
            time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            rps: Math.floor(Math.random() * (150 - 50 + 1) + 50),
            latency: Math.floor(Math.random() * (200 - 80 + 1) + 80),
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
            const newPoint: TrafficDataPoint = {
                time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                rps: Math.floor(Math.random() * (150 - 50 + 1) + 50), // Simulate RPS between 50 and 150
                latency: Math.floor(Math.random() * (200 - 80 + 1) + 80), // Simulate latency between 80ms and 200ms
            };
            
            setData(currentData => [...currentData.slice(1), newPoint]);
        }, 2000); // Update every 2 seconds

        return () => clearInterval(interval);
    }, []);
    
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

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-900/50 p-3 rounded-md">
                    <div className="text-xs text-gray-400 uppercase font-semibold">Current RPS</div>
                    <div className="text-2xl font-bold text-indigo-400">{currentMetrics.rps}</div>
                </div>
                 <div className="bg-gray-900/50 p-3 rounded-md">
                    <div className="text-xs text-gray-400 uppercase font-semibold">Avg Latency</div>
                    <div className="text-2xl font-bold text-teal-400">{currentMetrics.latency} <span className="text-lg">ms</span></div>
                </div>
            </div>

            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                        <XAxis dataKey="time" stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" stroke="#8884d8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="rps" name="Requests/sec" stroke="#8884d8" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line yAxisId="right" type="monotone" dataKey="latency" name="Latency (ms)" stroke="#82ca9d" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
