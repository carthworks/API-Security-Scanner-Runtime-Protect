import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { VulnerabilitiesView } from './components/VulnerabilitiesView';
import { IntegrationsView } from './components/IntegrationsView';
import { SettingsView } from './components/SettingsView';
import { NewScanModal } from './components/NewScanModal';
import { VULNERABILITIES } from './constants';
import type { Vulnerability } from './types';

export type Page = 'Dashboard' | 'Vulnerabilities' | 'Integrations' | 'Settings';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>(VULNERABILITIES);

  const handleAddVulnerability = (newVulnerability: Vulnerability) => {
    setVulnerabilities(prev => [newVulnerability, ...prev]);
    setActivePage('Vulnerabilities');
    setIsScanModalOpen(false);
  };

  const renderContent = () => {
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard setActivePage={setActivePage} vulnerabilities={vulnerabilities} />;
      case 'Vulnerabilities':
        return <VulnerabilitiesView vulnerabilities={vulnerabilities} setVulnerabilities={setVulnerabilities} />;
      case 'Integrations':
        return <IntegrationsView />;
      case 'Settings':
        return <SettingsView />;
      default:
        return <Dashboard setActivePage={setActivePage} vulnerabilities={vulnerabilities}/>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 font-sans">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onNewScanClick={() => setIsScanModalOpen(true)} />
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