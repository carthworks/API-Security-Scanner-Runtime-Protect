import React from 'react';
import { ShieldIcon } from './Icons';

interface LoginProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <div className="text-center">
            <div className="flex justify-center mx-auto mb-4">
                 <ShieldIcon className="h-12 w-12 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Sign in to Sentinel</h1>
            <p className="mt-2 text-sm text-gray-400">Enter your credentials to access your dashboard.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input id="email-address" name="email" type="email" autoComplete="email" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Email address" defaultValue="dev@sentinel.io" />
            </div>
            <div>
              <label htmlFor="password-login" className="sr-only">Password</label>
              <input id="password-login" name="password" type="password" autoComplete="current-password" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Password" defaultValue="password" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-500 bg-gray-700 rounded" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400"> Remember me </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300"> Forgot your password? </a>
            </div>
          </div>

          <div>
            <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500">
              Sign in
            </button>
          </div>
        </form>
         <p className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <button onClick={onSwitchToRegister} className="font-medium text-indigo-400 hover:text-indigo-300 focus:outline-none">
                Sign up
            </button>
        </p>
      </div>
    </div>
  );
};
