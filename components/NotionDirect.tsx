'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Link, RefreshCw, AlertCircle, BookOpen, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotionConnection {
  connected: boolean;
  workspace_name?: string;
  user_name?: string;
  error?: string;
}

interface NotionDirectProps {
  onClose: () => void;
}

export default function NotionDirect({ onClose }: NotionDirectProps) {
  const [connection, setConnection] = useState<NotionConnection>({ connected: false });
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadConnection();
  }, []);

  const loadConnection = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('http://localhost:8000/notion/status');
      if (response.ok) {
        const data = await response.json();
        setConnection(data);
      } else {
        setError('Failed to check connection status');
      }
    } catch (error) {
      console.error('Failed to load connection:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const connectNotion = async () => {
    try {
      setIsConnecting(true);
      setError('');
      const response = await fetch('http://localhost:8000/notion/connect', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        // Redirect to the auth URL in the same window for proper OAuth flow
        window.location.href = data.authUrl;
      } else {
        const errorData = await response.json();
        if (errorData.detail?.includes('credentials not configured')) {
          setError('Notion integration not configured. Please set up your Notion app credentials.');
        } else {
          setError('Failed to start Notion connection. Please try again.');
        }
        setIsConnecting(false);
      }
    } catch (error) {
      console.error('Failed to connect Notion:', error);
      setError('Network error. Please check your connection and try again.');
      setIsConnecting(false);
    }
  };

  const disconnectNotion = async () => {
    try {
      const response = await fetch('http://localhost:8000/notion/disconnect', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setConnection({ connected: false });
        setError('');
      } else {
        setError('Failed to disconnect Notion');
      }
    } catch (error) {
      console.error('Failed to disconnect Notion:', error);
      setError('Failed to disconnect Notion');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Direct Notion Integration
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Connect your Notion workspace directly to get personalized answers based on your personal notes and knowledge.
          </p>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-600 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-4">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-400 mt-2">Checking connection...</p>
            </div>
          ) : !connection.connected ? (
            <div className="space-y-4">
              <div className="p-4 border border-gray-600 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                    <span className="text-black font-bold text-sm">N</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Notion</h3>
                    <p className="text-xs text-gray-400">Connect your Notion workspace directly</p>
                  </div>
                </div>
                
                <button
                  onClick={connectNotion}
                  disabled={isConnecting}
                  className={cn(
                    "w-full p-2 rounded-lg font-medium transition-colors",
                    isConnecting
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  )}
                >
                  {isConnecting ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Connecting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Link className="w-4 h-4" />
                      Connect Notion
                    </div>
                  )}
                </button>
              </div>

              <div className="p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
                <h4 className="text-blue-400 font-medium text-sm mb-1">Setup Required</h4>
                <p className="text-blue-300 text-xs">
                  To use direct Notion integration, you need to set up:
                </p>
                <ul className="text-blue-300 text-xs mt-1 ml-4 list-disc">
                  <li>NOTION_CLIENT_ID environment variable</li>
                  <li>NOTION_CLIENT_SECRET environment variable</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 border border-green-600 rounded-lg bg-green-900/20">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div className="flex-1">
                    <h3 className="font-medium text-white">Notion Connected</h3>
                    <p className="text-xs text-gray-400">
                      Workspace: {connection.workspace_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400">
                      User: {connection.user_name || 'Unknown'}
                    </p>
                  </div>
                  <button
                    onClick={disconnectNotion}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    title="Disconnect"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="text-xs text-green-400">
                  ✓ Ready to search your Notion content
                </div>
              </div>

              <div className="p-3 bg-gray-800 rounded-lg">
                <h4 className="text-white font-medium text-sm mb-1">Features Available</h4>
                <ul className="text-gray-400 text-xs space-y-1">
                  <li>• Search your Notion pages and databases</li>
                  <li>• Get AI answers based on your content</li>
                  <li>• Direct API access (no third-party dependencies)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
