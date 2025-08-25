'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function SupermemoryCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams?.get('code');
        const state = searchParams?.get('state');
        const error = searchParams?.get('error');

        if (error) {
          setStatus('error');
          const errorDescription = searchParams?.get('error_description') || '';
          setMessage(`Connection failed: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
          return;
        }

        if (!code || !state) {
          setStatus('error');
          setMessage('Missing required parameters from Notion');
          return;
        }

        // The connection should be automatically completed by Supermemory
        // We just need to verify it was successful
        setStatus('success');
        setMessage('Successfully connected your Notion workspace!');

        // Redirect back to main app after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);

      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during connection');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white flex items-center justify-center">
      <div className="bg-[#2a2a2a] rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-400" />
              <h1 className="text-xl font-semibold mb-2">Connecting Notion...</h1>
              <p className="text-gray-400">Please wait while we complete the connection.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <h1 className="text-xl font-semibold mb-2 text-green-400">Connection Successful!</h1>
              <p className="text-gray-400 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to main app...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <h1 className="text-xl font-semibold mb-2 text-red-400">Connection Failed</h1>
              <p className="text-gray-400 mb-4">{message}</p>
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Return to App
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
