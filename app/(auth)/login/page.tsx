'use client';

import { signIn } from 'next-auth/react';
import { useEffect } from 'react';

export default function LoginPage() {
  useEffect(() => {
    // Auto-redirect to Azure AD login
    signIn('azure-ad', { callbackUrl: '/dashboard' });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Insight Studio</h2>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Redirecting to sign in...</p>
        </div>
      </div>
    </div>
  );
}

