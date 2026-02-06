'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, LoginPage as LoginForm } from '../providers';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [bypassing, setBypassing] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleDevBypass = async () => {
    setBypassing(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dev_bypass: 'true' }),
      });

      if (response.ok) {
        window.location.href = '/';
      } else {
        alert('Dev bypass failed');
      }
    } catch (error) {
      console.error('Dev bypass error:', error);
      alert('Dev bypass error');
    } finally {
      setBypassing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-dark-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="relative">
      <LoginForm />
      
      {/* Dev bypass button - visible in bottom left */}
      <button
        onClick={handleDevBypass}
        disabled={bypassing}
        className="absolute bottom-4 left-4 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-600 dark:text-yellow-400 text-xs rounded transition-colors disabled:opacity-50"
        style={{ zIndex: 9999 }}
      >
        {bypassing ? '⏳ Bypassing...' : '🔧 Dev Login'}
      </button>
    </div>
  );
}
