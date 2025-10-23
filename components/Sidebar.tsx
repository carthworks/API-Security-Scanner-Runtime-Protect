import React from 'react';
import type { Page } from '../App';
import { DashboardIcon, ShieldIcon, GitPullRequestIcon, SettingsIcon, ChevronLeftIcon, LockIcon, LogOutIcon } from './Icons';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  onNavigateToVulnerabilities: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onLock: () => void;
  onLogout: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: Page;
  isActive: boolean;
  onClick: () => void;
  isOpen: boolean;
}> = ({ icon, label, isActive, onClick, isOpen }) => (
  <li>
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
        isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      } ${!isOpen ? 'justify-center' : ''}`}
      title={!isOpen ? label : undefined}
    >
      {icon}
      <span className={`ml-3 font-medium whitespace-nowrap ${!isOpen ? 'lg:hidden' : ''}`}>{label}</span>
    </a>
  </li>
);

const ActionItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isOpen: boolean;
}> = ({ icon, label, onClick, isOpen }) => (
  <li>
    <button
      onClick={onClick}
      className={`flex w-full items-center p-3 my-1 rounded-lg transition-colors duration-200 text-gray-400 hover:bg-gray-700 hover:text-white ${!isOpen ? 'justify-center' : ''}`}
      title={!isOpen ? label : undefined}
    >
      {icon}
      <span className={`ml-3 font-medium whitespace-nowrap ${!isOpen ? 'lg:hidden' : ''}`}>{label}</span>
    </button>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, onNavigateToVulnerabilities, isOpen, setIsOpen, onLock, onLogout }) => {
  const handleNavClick = (page: Page) => {
    if (page === 'Vulnerabilities') {
        onNavigateToVulnerabilities();
    } else {
        setActivePage(page);
    }
    // Close sidebar on navigation in mobile view
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-all duration-300 ease-in-out bg-gray-800 border-r border-gray-700 flex flex-col ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className={`h-16 flex items-center border-b border-gray-700 shrink-0 overflow-hidden ${isOpen ? 'px-4' : 'justify-center'}`}>
        <ShieldIcon className="h-8 w-8 text-indigo-400 shrink-0" />
        <h1 className={`text-xl font-bold ml-2 text-white whitespace-nowrap ${!isOpen ? 'hidden' : ''}`}>Sentinel</h1>
      </div>
      <nav className="flex-1 px-2 py-4 flex flex-col">
        <ul className="flex-grow">
          <NavItem
            icon={<DashboardIcon className="h-6 w-6 shrink-0" />}
            label="Dashboard"
            isActive={activePage === 'Dashboard'}
            onClick={() => handleNavClick('Dashboard')}
            isOpen={isOpen}
          />
          <NavItem
            icon={<ShieldIcon className="h-6 w-6 shrink-0" />}
            label="Vulnerabilities"
            isActive={activePage === 'Vulnerabilities'}
            onClick={() => handleNavClick('Vulnerabilities')}
            isOpen={isOpen}
          />
          <NavItem
            icon={<GitPullRequestIcon className="h-6 w-6 shrink-0" />}
            label="Integrations"
            isActive={activePage === 'Integrations'}
            onClick={() => handleNavClick('Integrations')}
            isOpen={isOpen}
          />
          <NavItem
            icon={<SettingsIcon className="h-6 w-6 shrink-0" />}
            label="Settings"
            isActive={activePage === 'Settings'}
            onClick={() => handleNavClick('Settings')}
            isOpen={isOpen}
          />
        </ul>
        <ul>
            <ActionItem
                icon={<LockIcon className="h-6 w-6 shrink-0" />}
                label="Lock Screen"
                onClick={onLock}
                isOpen={isOpen}
            />
        </ul>
      </nav>
      <div className={`px-4 py-4 border-t border-gray-700 overflow-hidden ${!isOpen && 'lg:px-2'}`}>
        <div className={`flex items-center ${!isOpen && 'lg:justify-center'}`}>
            <img className="h-10 w-10 rounded-full shrink-0" src="https://picsum.photos/100" alt="User avatar" />
            <div className={`ml-3 ${!isOpen && 'lg:hidden'}`}>
                <p className="text-sm font-medium text-white whitespace-nowrap">Dev Team</p>
                <p className="text-xs text-gray-400 whitespace-nowrap">Pro Plan</p>
            </div>
             <button onClick={onLogout} title="Logout" className={`ml-auto p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors ${!isOpen && 'lg:hidden'}`}>
                <LogOutIcon className="h-5 w-5"/>
            </button>
        </div>
      </div>
       <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="h-12 border-t border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white items-center justify-center hidden lg:flex"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <ChevronLeftIcon className={`h-6 w-6 transition-transform duration-300 ${!isOpen && 'rotate-180'}`} />
      </button>
    </aside>
  );
};