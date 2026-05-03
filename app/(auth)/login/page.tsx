'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

const isE2E = process.env.NEXT_PUBLIC_E2E_TESTING === 'true';

export default function LoginPage() {
  const [e2eEmail, setE2eEmail] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Insight Studio</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>
        <div className="space-y-4">
          {isE2E && (
            <form
              data-testid="e2e-login-form"
              onSubmit={(e) => {
                e.preventDefault();
                signIn('e2e-credentials', { email: e2eEmail, callbackUrl: '/dashboard' });
              }}
              className="space-y-3 p-4 border-2 border-dashed border-yellow-400 rounded-md bg-yellow-50 dark:bg-yellow-900/20"
            >
              <p className="text-xs font-mono text-yellow-700 dark:text-yellow-400">E2E Test Login</p>
              <input
                data-testid="e2e-email-input"
                type="email"
                name="email"
                placeholder="Test user email"
                value={e2eEmail}
                onChange={(e) => setE2eEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                required
              />
              <button
                data-testid="e2e-login-button"
                type="submit"
                className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-md text-sm transition-colors"
              >
                E2E Sign In
              </button>
            </form>
          )}
          <button
            onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23" fill="currentColor">
              <path d="M0 0v23h23V0H0zm12.18 6.19v2.93h3.97v.61h-3.97v3.45h4.28v.61H9.9V5.58h5.56v.61h-3.28z"/>
            </svg>
            Sign in with Microsoft
          </button>
          <button
            onClick={() => signIn('okta', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 8.599c-.145.658-.537 1.204-1.121 1.579-.584.375-1.235.463-1.887.314l-3.162-.694a3.002 3.002 0 0 1-2.294-3.636l1.97-8.599c.145-.658.537-1.204 1.121-1.579.584-.375 1.235-.463 1.887-.314l3.162.694a3.003 3.003 0 0 1 2.294 3.636z"/>
            </svg>
            Sign in with Okta
          </button>
        </div>
      </div>
    </div>
  );
}

