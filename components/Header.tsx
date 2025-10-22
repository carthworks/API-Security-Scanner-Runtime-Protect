import React from 'react';
import { MenuIcon } from './Icons';

interface HeaderProps {
    onNewScanClick: () => void;
    onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewScanClick, onMenuClick }) => {
  return (
    <header className="h-16 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 flex-shrink-0">
      <div className="flex items-center justify-between lg:justify-end h-full px-6">
         <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-400 hover:text-white"
          aria-label="Open sidebar"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <div className="flex items-center space-x-4">
            <button className="relative text-gray-400 hover:text-white focus:outline-none">
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-0 right-0 h-2 w-2 mt-1 mr-1 bg-red-500 rounded-full"></span>
            </button>
            <button onClick={onNewScanClick} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                New Scan
            </button>
        </div>
      </div>
    </header>
  );
};