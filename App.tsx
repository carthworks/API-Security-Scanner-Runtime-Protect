import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { VulnerabilitiesView } from './components/VulnerabilitiesView';
import { IntegrationsView } from './components/IntegrationsView';
import { SettingsView } from './components/SettingsView';
import { NewScanModal } from './components/NewScanModal';
import { generateMockVulnerabilities, INITIAL_TEAM_MEMBERS } from './constants';
import type { Vulnerability, Severity } from './types';

export type Page = 'Dashboard' | 'Vulnerabilities' | 'Integrations' | 'Settings';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<string[]>(INITIAL_TEAM_MEMBERS);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>(() => generateMockVulnerabilities(50, teamMembers));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vulnerabilityFilter, setVulnerabilityFilter] = useState<Severity | null>(null);

  const handleAddVulnerability = (newVulnerability: Vulnerability) => {
    setVulnerabilities(prev => [newVulnerability, ...prev]);
    setActivePage('Vulnerabilities');
    setIsScanModalOpen(false);
  };

  const handleNavigateToVulnerabilities = () => {
    setVulnerabilityFilter(null); // Clear any filters when navigating directly
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
        return <VulnerabilitiesView 
                  vulnerabilities={vulnerabilities} 
                  setVulnerabilities={setVulnerabilities}
                  filter={vulnerabilityFilter}
                  setFilter={setVulnerabilityFilter}
                  teamMembers={teamMembers}
                />;
      case 'Integrations':
        return <IntegrationsView />;
      case 'Settings':
        return <SettingsView teamMembers={teamMembers} setTeamMembers={setTeamMembers} />;
      default:
        return <Dashboard onFilterVulnerabilities={handleFilterVulnerabilities} vulnerabilities={vulnerabilities}/>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 font-sans text-gray-200">
       <div
          onClick={() => setIsSidebarOpen(false)}
          className={`fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity duration-300 ${
              isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden="true"
      ></div>

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onNavigateToVulnerabilities={handleNavigateToVulnerabilities}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onNewScanClick={() => setIsScanModalOpen(true)}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-6 md:p-8">
          {renderContent()}
        </main>
      </div>
      <NewScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onAddVulnerability={handleAddVulnerability}
      />
    </div>
  );
};

export default App;