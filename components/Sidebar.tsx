
import React from 'react';
import type { Page } from '../App';
import { DashboardIcon, ShieldIcon, GitPullRequestIcon, SettingsIcon } from './Icons';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: Page;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li>
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
        isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      <span className="ml-3 font-medium">{label}</span>
    </a>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  return (
    <aside className="w-64 flex-shrink-0 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="h-16 flex items-center justify-center px-4 border-b border-gray-700">
        <ShieldIcon className="h-8 w-8 text-indigo-400" />
        <h1 className="text-xl font-bold ml-2 text-white">Sentinel</h1>
      </div>
      <nav className="flex-1 px-4 py-4">
        <ul>
          <NavItem
            icon={<DashboardIcon className="h-6 w-6" />}
            label="Dashboard"
            isActive={activePage === 'Dashboard'}
            onClick={() => setActivePage('Dashboard')}
          />
          <NavItem
            icon={<ShieldIcon className="h-6 w-6" />}
            label="Vulnerabilities"
            isActive={activePage === 'Vulnerabilities'}
            onClick={() => setActivePage('Vulnerabilities')}
          />
          <NavItem
            icon={<GitPullRequestIcon className="h-6 w-6" />}
            label="Integrations"
            isActive={activePage === 'Integrations'}
            onClick={() => setActivePage('Integrations')}
          />
          <NavItem
            icon={<SettingsIcon className="h-6 w-6" />}
            label="Settings"
            isActive={activePage === 'Settings'}
            onClick={() => setActivePage('Settings')}
          />
        </ul>
      </nav>
      <div className="px-4 py-4 border-t border-gray-700">
        <div className="flex items-center">
            <img className="h-10 w-10 rounded-full" src="https://picsum.photos/100" alt="User avatar" />
            <div className="ml-3">
                <p className="text-sm font-medium text-white">Dev Team</p>
                <p className="text-xs text-gray-400">Pro Plan</p>
            </div>
        </div>
      </div>
    </aside>
  );
};
