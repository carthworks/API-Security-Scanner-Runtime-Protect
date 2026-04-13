import { Severity, VulnerabilityStatus } from './types';

export const severityConfig: { [key in Severity]: { color: string; bg: string } } = {
  [Severity.Critical]: { color: 'text-red-400', bg: 'bg-red-900/50' },
  [Severity.High]: { color: 'text-orange-400', bg: 'bg-orange-900/50' },
  [Severity.Medium]: { color: 'text-yellow-400', bg: 'bg-yellow-900/50' },
  [Severity.Low]: { color: 'text-blue-400', bg: 'bg-blue-900/50' },
  [Severity.Info]: { color: 'text-purple-400', bg: 'bg-purple-900/50' },
};

export const severityDotColor: { [key in Severity]: string } = {
    [Severity.Critical]: 'bg-red-500',
    [Severity.High]: 'bg-orange-500',
    [Severity.Medium]: 'bg-yellow-500',
    [Severity.Low]: 'bg-blue-400',
    [Severity.Info]: 'bg-purple-400',
};

export const statusConfig: { [key in VulnerabilityStatus]: { color: string; bg: string } } = {
    [VulnerabilityStatus.New]: { color: 'text-blue-400', bg: 'bg-blue-900/50' },
    [VulnerabilityStatus.Acknowledged]: { color: 'text-yellow-400', bg: 'bg-yellow-900/50' },
    [VulnerabilityStatus.Fixed]: { color: 'text-green-400', bg: 'bg-green-900/50' },
};

export const statusTimelineDotColor: { [key in VulnerabilityStatus]: string } = {
    [VulnerabilityStatus.New]: 'bg-blue-500 ring-4 ring-gray-800',
    [VulnerabilityStatus.Acknowledged]: 'bg-yellow-500 ring-4 ring-gray-800',
    [VulnerabilityStatus.Fixed]: 'bg-green-500 ring-4 ring-gray-800',
};