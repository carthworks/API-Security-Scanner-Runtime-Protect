import React, { useState } from 'react';

// A simple toggle switch component for settings
const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; label: string }> = ({ enabled, onChange, label }) => (
  <label htmlFor={label} className="flex items-center cursor-pointer">
    <div className="relative">
      <input id={label} type="checkbox" className="sr-only" checked={enabled} onChange={() => onChange(!enabled)} />
      <div className={`block w-14 h-8 rounded-full transition-colors ${enabled ? 'bg-indigo-600' : 'bg-gray-600'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${enabled ? 'transform translate-x-6' : ''}`}></div>
    </div>
    <div className="ml-3 text-gray-300 font-medium">
      {label}
    </div>
  </label>
);

const SettingsSection: React.FC<{ title: string; description: string; children: React.ReactNode; }> = ({ title, description, children }) => (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <div className="border-b border-gray-700 pb-4 mb-6">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <p className="mt-1 text-sm text-gray-400">{description}</p>
        </div>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

const InputRow: React.FC<{ label: string; id: string; type: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ label, id, type, value, onChange }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300">{label}</label>
        <input
            type={type}
            id={id}
            value={value}
            onChange={onChange}
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 max-w-md"
        />
    </div>
);


export const SettingsView: React.FC = () => {
    const [teamName, setTeamName] = useState('Dev Team');
    const [contactEmail, setContactEmail] = useState('dev@sentinel.io');

    const [emailOnNewVulnerability, setEmailOnNewVulnerability] = useState(true);
    const [emailOnScanComplete, setEmailOnScanComplete] = useState(false);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
      
      {/* Profile Settings */}
      <SettingsSection title="Profile" description="Manage your team's information.">
        <InputRow 
            label="Team Name"
            id="team-name"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
        />
         <InputRow 
            label="Contact Email"
            id="contact-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
        />
        <div className="pt-2">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                Save Changes
            </button>
        </div>
      </SettingsSection>

      {/* Notifications Settings */}
      <SettingsSection title="Notifications" description="Control how you receive alerts and updates.">
        <ToggleSwitch 
            label="Email on New Vulnerability"
            enabled={emailOnNewVulnerability}
            onChange={setEmailOnNewVulnerability}
        />
        <ToggleSwitch 
            label="Email on Scan Completion"
            enabled={emailOnScanComplete}
            onChange={setEmailOnScanComplete}
        />
         <div className="pt-2">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                Save Notification Settings
            </button>
        </div>
      </SettingsSection>

      {/* Plan & Billing */}
      <SettingsSection title="Plan & Billing" description="View your current plan and manage billing details.">
        <div className="flex items-center justify-between bg-gray-900/50 p-4 rounded-md">
            <div>
                <p className="text-gray-300">Your current plan is <span className="font-bold text-indigo-400">Pro</span>.</p>
            </div>
             <button className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                Manage Billing
            </button>
        </div>
      </SettingsSection>

       {/* Security Settings */}
      <SettingsSection title="Security" description="Manage your account's security settings.">
          <div className="flex items-center justify-between">
            <p className="text-gray-300">Change your account password.</p>
            <button className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                Change Password
            </button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-300">Add an additional layer of security to your account.</p>
            <button className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                Enable 2FA
            </button>
          </div>
      </SettingsSection>

    </div>
  );
};
