import React, { useMemo, useState, useEffect } from 'react';
import { XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
// FIX: Import Severity as a value for enum usage, and Vulnerability as a type.
import { Severity, type Vulnerability } from '../types';
import { ChevronRightIcon, ServerIcon, ShieldIcon, AlertTriangleIcon, ZapIcon, ArrowUpRightIcon, ArrowDownRightIcon, GitPullRequestIcon, CodeIcon } from './Icons';
import { severityDotColor } from '../constants';
import { LiveTrafficChart } from './LiveTrafficChart';

interface DashboardProps {
  onFilterVulnerabilities: (severity: Severity) => void;
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

const StatCard: React.FC<{
    title: string; 
    value: string | number; 
    icon: React.ReactNode; 
    colorClass: string;
    trend: number;
}> = ({title, value, icon, colorClass, trend}) => {
    const isPositive = trend >= 0;
    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col justify-between transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-600/10">
            <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full bg-gray-900/50 ${colorClass}`}>
                    {icon}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">{title}</h3>
                  <p className="mt-1 text-3xl font-semibold text-white">{value}</p>
                </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
                <span className={`flex items-center font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? <ArrowUpRightIcon className="h-4 w-4 mr-1" /> : <ArrowDownRightIcon className="h-4 w-4 mr-1" />}
                    {Math.abs(trend)}%
                </span>
                <span className="ml-2 text-gray-500">vs last week</span>
            </div>
        </div>
    );
};

const keyFeatures = [
    {
        icon: <GitPullRequestIcon className="h-6 w-6 text-indigo-400" />,
        text: 'Scans APIs during build/deploy stages (GitHub/GitLab/Bitbucket integration).',
    },
    {
        icon: <ShieldIcon className="h-6 w-6 text-indigo-400" />,
        text: 'Detects vulnerabilities mapped to OWASP API Top 10.',
    },
    {
        icon: <ZapIcon className="h-6 w-6 text-indigo-400" />,
        text: 'Deploys a lightweight runtime agent that observes live traffic for anomalies, authentication flaws, and injection attempts.',
    },
    {
        icon: <CodeIcon className="h-6 w-6 text-indigo-400" />,
        text: 'Provides actionable fixes with code-level remediation suggestions.',
    },
];

const LiveMetricCard: React.FC<{
    title: string;
    initialValue: number;
    range: [number, number];
    isAnomaly?: boolean;
    dataColor: string;
}> = ({ title, initialValue, range, isAnomaly = false, dataColor }) => {
    const [currentValue, setCurrentValue] = useState(initialValue);
    const [data, setData] = useState(() => Array(20).fill({ value: initialValue }));

    useEffect(() => {
        const interval = setInterval(() => {
            let newValue;
            if (isAnomaly) {
                // Skew towards zero for anomalies
                newValue = Math.random() < 0.8 ? 0 : Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
            } else {
                newValue = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
            }
            setCurrentValue(newValue);
            setData(prevData => [...prevData.slice(1), { value: newValue }]);
        }, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    }, [range, isAnomaly]);

    const getStatus = () => {
        if (!isAnomaly) return null;
        if (currentValue === 0) return { text: "Normal", color: "text-green-400" };
        if (currentValue > 0 && currentValue <= 3) return { text: "Warning", color: "text-yellow-400" };
        return { text: "Critical", color: "text-red-400" };
    };

    const status = getStatus();

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-400">{title}</h3>
                {status && <span className={`text-sm font-bold ${status.color}`}>{status.text}</span>}
            </div>
            <p className="text-4xl font-semibold text-white mt-2">{currentValue.toLocaleString()}</p>
            <div className="flex-grow mt-4 h-20">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <Line type="monotone" dataKey="value" stroke={dataColor} strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


export const Dashboard: React.FC<DashboardProps> = ({ onFilterVulnerabilities, vulnerabilities }) => {
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

  const handlePieClick = (data: any) => {
    onFilterVulnerabilities(data.name);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-gray-400 mt-1">Real-time insights into your API security posture.</p>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="APIs Monitored" value="12" icon={<ServerIcon className="h-6 w-6" />} colorClass="text-blue-400" trend={0} />
        <StatCard title="Total Vulnerabilities" value={totalVulnerabilities} icon={<ShieldIcon className="h-6 w-6" />} colorClass="text-purple-400" trend={-10} />
        <StatCard title="Critical & High" value={highSeverityCount} icon={<AlertTriangleIcon className="h-6 w-6" />} colorClass="text-red-400" trend={15} />
        <StatCard title="Runtime Alerts (24h)" value="8" icon={<ZapIcon className="h-6 w-6" />} colorClass="text-yellow-400" trend={-5} />
      </div>

      {/* Live Traffic Monitoring */}
      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Live Traffic Monitoring</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LiveMetricCard title="Requests per Minute" initialValue={2150} range={[1800, 2500]} dataColor="#8884d8" />
              <LiveMetricCard title="Anomalies Detected" initialValue={0} range={[0, 5]} dataColor="#ef4444" isAnomaly />
          </div>
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
                onClick={handlePieClick}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={severityColors[entry.name]} stroke={severityColors[entry.name]} className="cursor-pointer transition-opacity hover:opacity-80" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Runtime Traffic */}
        <div className="lg:col-span-2">
            <LiveTrafficChart />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Vulnerabilities */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Recent Vulnerabilities</h3>
                <button onClick={() => onFilterVulnerabilities(null as any)} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center">
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
        {/* Key Features */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-4">Key Features</h3>
            <ul className="mt-4 space-y-4">
                {keyFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <div className="flex-shrink-0 mt-1">{feature.icon}</div>
                        <p className="ml-4 text-sm text-gray-300">{feature.text}</p>
                    </li>
                ))}
            </ul>
        </div>
      </div>
    </div>
  );
};