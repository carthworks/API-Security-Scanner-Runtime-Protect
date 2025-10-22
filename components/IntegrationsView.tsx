import React, { useState, useRef, useEffect } from 'react';
import { GithubIcon, GitlabIcon, BitbucketIcon, MoreVerticalIcon, XIcon } from './Icons';

interface Integration {
    name: 'GitHub' | 'GitLab' | 'Bitbucket';
    description: string;
    icon: React.ReactNode;
    isConnected: boolean;
}

const initialIntegrations: Integration[] = [
    {
        name: "GitHub",
        description: "Scan your public and private repositories.",
        icon: <GithubIcon className="h-8 w-8 text-white" />,
        isConnected: true
    },
    {
        name: "GitLab",
        description: "Integrate with your GitLab CI/CD pipelines.",
        icon: <GitlabIcon className="h-8 w-8 text-orange-500" />,
        isConnected: true
    },
    {
        name: "Bitbucket",
        description: "Connect to your Bitbucket Cloud repositories.",
        icon: <BitbucketIcon className="h-8 w-8 text-blue-500" />,
        isConnected: false
    }
];

const useOutsideClick = (ref: React.RefObject<HTMLDivElement>, callback: () => void) => {
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref, callback]);
};

const IntegrationCard: React.FC<{
    integration: Integration;
    onConnect: (integration: Integration) => void;
    onDisconnect: (name: Integration['name']) => void;
}> = ({ integration, onConnect, onDisconnect }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useOutsideClick(menuRef, () => setIsMenuOpen(false));

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex items-center justify-between transition-shadow hover:shadow-lg hover:shadow-indigo-600/10">
            <div className="flex items-center">
                <div className="bg-gray-700 p-3 rounded-lg">
                    {integration.icon}
                </div>
                <div className="ml-4">
                    <h3 className="text-lg font-semibold text-white">{integration.name}</h3>
                    <p className="text-sm text-gray-400">{integration.description}</p>
                </div>
            </div>
            {integration.isConnected ? (
                 <div className="flex items-center space-x-2">
                    <div className="bg-green-500/10 text-green-400 font-semibold py-2 px-3 rounded-lg text-sm flex items-center">
                        <span className="h-2 w-2 bg-green-400 rounded-full mr-2"></span>
                        Connected
                    </div>
                    <div ref={menuRef} className="relative">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-400 hover:bg-gray-700 rounded-full">
                           <MoreVerticalIcon className="h-5 w-5" />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10 border border-gray-600">
                                <ul className="py-1">
                                    <li><a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">Manage Settings</a></li>
                                    <li><a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">Sync Repositories</a></li>
                                    <li><button onClick={() => { onDisconnect(integration.name); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600">Disconnect</button></li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                 <button onClick={() => onConnect(integration)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm">
                    Connect
                </button>
            )}
        </div>
    );
};


const IntegrationConnectModal: React.FC<{
    integration: Integration;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ integration, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-700">
                <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center">
                            <div className="bg-gray-700 p-3 rounded-lg mr-4">{integration.icon}</div>
                            <div>
                                <h3 className="text-lg font-semibold leading-6 text-white" id="modal-title">Connect to {integration.name}</h3>
                                <p className="text-sm text-gray-400 mt-1">Provide an API token to grant access.</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white"><XIcon className="h-6 w-6" /></button>
                    </div>
                    <div className="mt-6">
                        <label htmlFor="api-token" className="block text-sm font-medium text-gray-300">Personal Access Token</label>
                        <input
                            type="password"
                            id="api-token"
                            placeholder="*************"
                            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                        />
                         <p className="text-xs text-gray-500 mt-2">Your token will be stored securely and is only used to access repository data for scanning.</p>
                    </div>
                </div>
                <div className="bg-gray-800 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-700">
                    <button onClick={onConfirm} type="button" className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto">
                        Connect
                    </button>
                    <button onClick={onClose} type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-200 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-600 sm:mt-0 sm:w-auto">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};


export const IntegrationsView: React.FC = () => {
    const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
    const [modalIntegration, setModalIntegration] = useState<Integration | null>(null);

    const handleConnect = (integration: Integration) => {
        setModalIntegration(integration);
    };

    const handleDisconnect = (name: Integration['name']) => {
        setIntegrations(prev =>
            prev.map(int => (int.name === name ? { ...int, isConnected: false } : int))
        );
    };

    const handleConfirmConnect = () => {
        if (modalIntegration) {
             setIntegrations(prev =>
                prev.map(int => (int.name === modalIntegration.name ? { ...int, isConnected: true } : int))
            );
            setModalIntegration(null);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Integrations</h1>
            <p className="text-gray-400 mb-8">Connect your source code repositories to enable automated scanning in your CI/CD pipelines.</p>
            
            <div className="space-y-6">
                {integrations.map(int => (
                    <IntegrationCard 
                        key={int.name}
                        integration={int}
                        onConnect={handleConnect}
                        onDisconnect={handleDisconnect}
                    />
                ))}
            </div>
            
            {modalIntegration && (
                <IntegrationConnectModal 
                    integration={modalIntegration}
                    onClose={() => setModalIntegration(null)}
                    onConfirm={handleConfirmConnect}
                />
            )}
        </div>
    );
};