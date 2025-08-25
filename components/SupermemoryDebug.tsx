'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

export default function SupermemoryDebug() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'rate-limited' | 'error'>('idle');
  const [lastError, setLastError] = useState<string>('');

  const checkSupermemoryStatus = async () => {
    setStatus('checking');
    try {
      // First check if backend is accessible
      const healthResponse = await fetch('http://localhost:8000/health');
      if (!healthResponse.ok) {
        setStatus('error');
        setLastError('Backend server not accessible. Make sure it\'s running on port 8000.');
        return;
      }

      const response = await fetch('http://localhost:8000/supermemory/connect/notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      
      if (response.status === 429) {
        setStatus('rate-limited');
        setLastError('Rate limited - too many requests. Please wait and try again later.');
      } else if (response.ok) {
        const data = await response.json();
        setStatus('success');
        console.log('Supermemory response:', data);
      } else {
        const errorData = await response.json();
        setStatus('error');
        setLastError(errorData.detail || 'Unknown error');
      }
    } catch (error) {
      setStatus('error');
      setLastError(`Network error: ${error}`);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'rate-limited':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'checking':
        return 'Checking Supermemory API status...';
      case 'success':
        return 'Supermemory API is working correctly!';
      case 'rate-limited':
        return 'Rate limited: Too many connection attempts. Please wait 10-15 minutes before trying again.';
      case 'error':
        return lastError;
      default:
        return 'Click to check Supermemory API status';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-[#2a2a2a] border-2 border-yellow-400 rounded-lg p-4 max-w-sm shadow-lg z-50">
      <h3 className="font-medium text-yellow-400 mb-2">🔧 Supermemory Debug</h3>
      
      <div className="flex items-start gap-3 mb-3">
        {getStatusIcon()}
        <div className="text-sm text-gray-300">
          {getStatusMessage()}
        </div>
      </div>

      {status === 'rate-limited' && (
        <div className="text-xs text-yellow-300 bg-yellow-900/20 p-2 rounded mb-3">
          <strong>Solution:</strong> Supermemory has rate limits. Wait 10-15 minutes, then try connecting again. 
          The "Invalid token response from Notion" error happens because of this rate limit.
        </div>
      )}

      <button
        onClick={checkSupermemoryStatus}
        disabled={status === 'checking'}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm py-2 px-3 rounded transition-colors"
      >
        {status === 'checking' ? 'Checking...' : 'Check Status'}
      </button>
    </div>
  );
}
