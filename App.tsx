import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { VulnerabilitiesView } from './components/VulnerabilitiesView';
import { IntegrationsView } from './components/IntegrationsView';
import { SettingsView } from './components/SettingsView';
import { NewScanModal } from './components/NewScanModal';
import { GuideView } from './components/GuideView';
import { LoadTestingView } from './components/LoadTestingView';
import { EngagementView } from './components/EngagementView';
import { ReportsView } from './components/ReportsView';

import type { Vulnerability, Severity, AIConfig } from './types';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ScreenLock } from './components/ScreenLock';

export type Page = 'Dashboard' | 'Vulnerabilities' | 'Engagement' | 'LoadTesting' | 'Reports' | 'Integrations' | 'Settings' | 'Guide';

const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'ollama',
  model: 'llama2',
  baseUrl: 'http://localhost:11434',
};

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vulnerabilityFilter, setVulnerabilityFilter] = useState<Severity | null>(null);
  const [authState, setAuthState] = useState<'unauthenticated' | 'authenticated' | 'locked'>('unauthenticated');
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [aiConfig, setAiConfig] = useState<AIConfig>(DEFAULT_AI_CONFIG);

  const handleLogin = () => { setAuthState('authenticated'); setActivePage('Dashboard'); };
  const handleLogout = () => { setAuthState('unauthenticated'); setAuthView('login'); };
  const handleLock = () => setAuthState('locked');
  const handleUnlock = () => setAuthState('authenticated');
  const handleRegister = () => setAuthView('login');

  const handleAddVulnerability = (newVulnerability: Vulnerability) => {
    setVulnerabilities(prev => [newVulnerability, ...prev]);
    setActivePage('Vulnerabilities');
    setIsScanModalOpen(false);
  };

  const handleNavigateToVulnerabilities = () => {
    setVulnerabilityFilter(null);
    setActivePage('Vulnerabilities');
  };

  const handleFilterVulnerabilities = (severity: Severity) => {
    setVulnerabilityFilter(severity);
    setActivePage('Vulnerabilities');
  };

  const renderContent = () => {
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard onFilterVulnerabilities={handleFilterVulnerabilities} vulnerabilities={vulnerabilities} />;
      case 'Vulnerabilities':
        return (
          <VulnerabilitiesView
            vulnerabilities={vulnerabilities}
            setVulnerabilities={setVulnerabilities}
            filter={vulnerabilityFilter}
            setFilter={setVulnerabilityFilter}
            teamMembers={teamMembers}
            aiConfig={aiConfig}
          />
        );
      case 'Integrations':
        return <IntegrationsView />;
      case 'Settings':
        return (
          <SettingsView
            teamMembers={teamMembers}
            setTeamMembers={setTeamMembers}
            aiConfig={aiConfig}
            setAiConfig={setAiConfig}
          />
        );
      case 'Guide':
        return <GuideView />;
      case 'LoadTesting':
        return <LoadTestingView aiConfig={aiConfig} />;
      case 'Engagement':
        return <EngagementView vulnerabilities={vulnerabilities} />;
      case 'Reports':
        return <ReportsView vulnerabilities={vulnerabilities} />;
      default:
        return <Dashboard onFilterVulnerabilities={handleFilterVulnerabilities} vulnerabilities={vulnerabilities} />;
    }
  };

  if (authState === 'locked') return <ScreenLock onUnlock={handleUnlock} onLogout={handleLogout} />;

  if (authState === 'unauthenticated') {
    return authView === 'login'
      ? <Login onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} />
      : <Register onRegister={handleRegister} onSwitchToLogin={() => setAuthView('login')} />;
  }

  return (
    <div className="flex h-screen bg-gray-900 font-sans text-gray-200">
      <div
        onClick={() => setIsSidebarOpen(false)}
        className={`fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
      />
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onNavigateToVulnerabilities={handleNavigateToVulnerabilities}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onLock={handleLock}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onNewScanClick={() => setIsScanModalOpen(true)} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-6 md:p-8">
          {renderContent()}
        </main>
      </div>
      <NewScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onAddVulnerability={handleAddVulnerability}
        aiConfig={aiConfig}
      />
    </div>
  );
};

export default App;
