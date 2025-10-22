import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import type { Page } from '../App';
import { Severity, Vulnerability } from '../types';
import { ChevronRightIcon, ServerIcon, ShieldIcon, AlertTriangleIcon, ZapIcon } from './Icons';
import { severityDotColor } from '../constants';

interface DashboardProps {
  setActivePage: (page: Page) => void;
  vulnerabilities: Vulnerability[];
}

const severityColors: { [key in Severity]: string } = {
  [Severity.Critical]: '#ef4444',
  [Severity.High]: '#f97316',
  [Severity.Medium]: '#eab308',
  [Severity.Low]: '#3b82f6',
  [Severity.Info]: '#8b5cf6',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-gray-700 text-white rounded-md border border-gray-600 shadow-lg">
        <p className="font-bold">{label}</p>
        {payload.map((pld: any) => (
             <p key={pld.dataKey} style={{ color: pld.color }}>{`${pld.name}: ${pld.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

const trafficData = [
    { name: '1m ago', traffic: 4000, anomalies: 2 },
    { name: '50s ago', traffic: 3000, anomalies: 1 },
    { name: '40s ago', traffic: 2000, anomalies: 0 },
    { name: '30s ago', traffic: 2780, anomalies: 5 },
    { name: '20s ago', traffic: 1890, anomalies: 0 },
    { name: '10s ago', traffic: 2390, anomalies: 0 },
    { name: 'now', traffic: 3490, anomalies: 1 },
];

const StatCard: React.FC<{title: string, value: string | number, icon: React.ReactNode, colorClass: string}> = ({title, value, icon, colorClass}) => (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex items-center space-x-4 transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-600/10">
        <div className={`p-3 rounded-full bg-gray-900/50 ${colorClass}`}>
            {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-400">{title}</h3>
          <p className="mt-1 text-3xl font-semibold text-white">{value}</p>
        </div>
    </div>
);


export const Dashboard: React.FC<DashboardProps> = ({ setActivePage, vulnerabilities }) => {
  const vulnerabilityCounts = useMemo(() => {
    return vulnerabilities.reduce((acc, vuln) => {
      acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
      return acc;
    }, {} as { [key in Severity]: number });
  }, [vulnerabilities]);
  
  const pieData = Object.entries(vulnerabilityCounts).map(([name, value]) => ({
      name: name as Severity,
      value,
  })).sort((a, b) => Object.keys(severityColors).indexOf(b.name) - Object.keys(severityColors).indexOf(a.name));

  const totalVulnerabilities = vulnerabilities.length;
  const highSeverityCount = (vulnerabilityCounts[Severity.Critical] || 0) + (vulnerabilityCounts[Severity.High] || 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-gray-400 mt-1">Real-time insights into your API security posture.</p>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="APIs Monitored" value="12" icon={<ServerIcon className="h-6 w-6" />} colorClass="text-blue-400" />
        <StatCard title="Total Vulnerabilities" value={totalVulnerabilities} icon={<ShieldIcon className="h-6 w-6" />} colorClass="text-purple-400" />
        <StatCard title="Critical & High" value={highSeverityCount} icon={<AlertTriangleIcon className="h-6 w-6" />} colorClass="text-red-400" />
        <StatCard title="Runtime Alerts (24h)" value="8" icon={<ZapIcon className="h-6 w-6" />} colorClass="text-yellow-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vulnerability Breakdown */}
        <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg border border-gray-700 h-96 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4">Vulnerability Breakdown</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={60}
                outerRadius={90}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={severityColors[entry.name]} stroke={severityColors[entry.name]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Runtime Traffic */}
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg border border-gray-700 h-96 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">Live API Traffic</h3>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                     <defs>
                        <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAnomalies" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f56565" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f56565" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                    <XAxis dataKey="name" stroke="#a0aec0" />
                    <YAxis stroke="#a0aec0" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="traffic" stroke="#8884d8" strokeWidth={2} fillOpacity={1} fill="url(#colorTraffic)" />
                    <Area type="monotone" dataKey="anomalies" stroke="#f56565" strokeWidth={2} fillOpacity={1} fill="url(#colorAnomalies)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Recent Vulnerabilities</h3>
              <button onClick={() => setActivePage('Vulnerabilities')} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center">
                  View All <ChevronRightIcon className="h-4 w-4 ml-1" />
              </button>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="text-xs text-gray-400 uppercase">
                      <tr>
                          <th className="py-3 px-6">Severity</th>
                          <th className="py-3 px-6">Type</th>
                          <th className="py-3 px-6">Endpoint</th>
                          <th className="py-3 px-6">Discovered</th>
                      </tr>
                  </thead>
                  <tbody>
                      {vulnerabilities.slice(0, 4).map(vuln => (
                          <tr key={vuln.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                              <td className="py-4 px-6">
                                <div className="flex items-center">
                                    <span className={`h-2.5 w-2.5 rounded-full mr-2 ${severityDotColor[vuln.severity]}`}></span>
                                    <span style={{color: severityColors[vuln.severity]}} className="font-semibold">{vuln.severity}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 font-medium text-white">{vuln.type}</td>
                              <td className="py-4 px-6 text-gray-300 font-mono text-sm">
                                  <span className={`font-bold text-xs mr-2 ${vuln.endpoint.method === 'POST' ? 'text-green-400' : 'text-blue-400'}`}>{vuln.endpoint.method}</span>
                                  {vuln.endpoint.path}
                              </td>
                              <td className="py-4 px-6 text-gray-400">{new Date(vuln.discoveredAt).toLocaleDateString()}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};