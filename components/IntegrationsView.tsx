
import React from 'react';
import { GithubIcon, GitlabIcon, BitbucketIcon } from './Icons';

interface IntegrationCardProps {
    name: string;
    description: string;
    icon: React.ReactNode;
    isConnected: boolean;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ name, description, icon, isConnected }) => {
    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex items-center justify-between transition-shadow hover:shadow-lg hover:shadow-indigo-600/10">
            <div className="flex items-center">
                <div className="bg-gray-700 p-3 rounded-lg">
                    {icon}
                </div>
                <div className="ml-4">
                    <h3 className="text-lg font-semibold text-white">{name}</h3>
                    <p className="text-sm text-gray-400">{description}</p>
                </div>
            </div>
            {isConnected ? (
                 <button className="bg-green-500/10 text-green-400 font-semibold py-2 px-4 rounded-lg text-sm flex items-center">
                    <span className="h-2 w-2 bg-green-400 rounded-full mr-2"></span>
                    Connected
                </button>
            ) : (
                 <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm">
                    Connect
                </button>
            )}
        </div>
    )
}

export const IntegrationsView: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Integrations</h1>
      <p className="text-gray-400 mb-8">Connect your source code repositories to enable automated scanning in your CI/CD pipelines.</p>
      
      <div className="space-y-6">
        <IntegrationCard 
            name="GitHub"
            description="Scan your public and private repositories."
            icon={<GithubIcon className="h-8 w-8 text-white" />}
            isConnected={true}
        />
        <IntegrationCard 
            name="GitLab"
            description="Integrate with your GitLab CI/CD pipelines."
            icon={<GitlabIcon className="h-8 w-8 text-orange-500" />}
            isConnected={true}
        />
        <IntegrationCard 
            name="Bitbucket"
            description="Connect to your Bitbucket Cloud repositories."
            icon={<BitbucketIcon className="h-8 w-8 text-blue-500" />}
            isConnected={false}
        />
      </div>
    </div>
  );
};
