import React from 'react';
import { ShieldIcon } from './Icons';

interface RegisterProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onRegister, onSwitchToLogin }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would handle registration logic here.
    // For this prototype, we'll just switch to the login view upon "success".
    onRegister();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <div className="text-center">
            <div className="flex justify-center mx-auto mb-4">
                 <ShieldIcon className="h-12 w-12 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Create your Sentinel account</h1>
            <p className="mt-2 text-sm text-gray-400">Start securing your APIs today.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
             <div>
              <label htmlFor="full-name" className="sr-only">Full Name</label>
              <input id="full-name" name="name" type="text" autoComplete="name" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Full Name" />
            </div>
            <div>
              <label htmlFor="email-address-register" className="sr-only">Email address</label>
              <input id="email-address-register" name="email" type="email" autoComplete="email" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Email address" />
            </div>
            <div>
              <label htmlFor="password-register" className="sr-only">Password</label>
              <input id="password-register" name="password" type="password" autoComplete="new-password" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Password" />
            </div>
          </div>

          <div>
            <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500">
              Create account
            </button>
          </div>
        </form>
         <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="font-medium text-indigo-400 hover:text-indigo-300 focus:outline-none">
                Sign in
            </button>
        </p>
      </div>
    </div>
  );
};
