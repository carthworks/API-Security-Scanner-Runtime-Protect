import React from 'react';
import { LockIcon } from './Icons';

interface ScreenLockProps {
  onUnlock: () => void;
  onLogout: () => void;
}

export const ScreenLock: React.FC<ScreenLockProps> = ({ onUnlock, onLogout }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUnlock();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 bg-cover bg-center" style={{backgroundImage: 'url(https://source.unsplash.com/random/1600x900/?abstract,dark)'}}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      <div className="relative w-full max-w-sm p-8 space-y-8 bg-gray-800/80 rounded-lg shadow-2xl border border-gray-700 text-center">
        <img className="h-24 w-24 rounded-full mx-auto ring-4 ring-indigo-500/50" src="https://picsum.photos/100" alt="User avatar" />
        <h1 className="text-xl font-bold text-white">Dev Team</h1>
        <p className="text-sm text-gray-400">Enter your password to unlock</p>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="password-unlock" className="sr-only">Password</label>
              <input 
                id="password-unlock" 
                name="password" 
                type="password" 
                autoComplete="current-password" 
                required 
                className="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                placeholder="Password"
                autoFocus
              />
            </div>
          </div>
          
          <div>
            <button type="submit" className="group relative w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500">
                <LockIcon className="h-5 w-5 mr-2" />
                Unlock
            </button>
          </div>
        </form>
         <p className="mt-6 text-center text-sm">
            <button onClick={onLogout} className="font-medium text-gray-400 hover:text-white focus:outline-none">
                Not you? Sign in as a different user
            </button>
        </p>
      </div>
    </div>
  );
};
