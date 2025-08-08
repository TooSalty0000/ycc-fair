'use client';

import { useState } from 'react';
import { User, LogIn } from 'lucide-react';
import { useGame } from '../contexts/GameContext';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading: contextLoading } = useGame();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      setIsLoading(false);
      return;
    }

    try {
      const success = await login(username, password);
      if (!success) {
        setError('Authentication failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('An error occurred. Please try again.');
    }
    
    setIsLoading(false);
  };

  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
            <User className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">YCC Fair Hunt</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the photo scavenger hunt adventure!
          </p>
        </div>
        
        <form className="bg-white p-6 rounded-xl shadow-lg space-y-4" onSubmit={handleSubmit}>
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <LogIn className="h-5 w-5 mr-2" />
                Join Game
              </>
            )}
          </button>

          {/* Password Recovery Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-amber-800">
                  Important: Password Recovery
                </h3>
                <p className="text-xs text-amber-700 mt-1">
                  ⚠️ <strong>You will NOT be able to recover your account if you forget your password.</strong> This is a local system without password recovery options. Please choose a memorable password!
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              New users: Your account will be created automatically. Returning users: Just enter your credentials!
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}