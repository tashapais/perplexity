'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Link, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Connection {
  id: string;
  provider: string;
  status: string;
  lastSync: string;
  documentsCount: number;
}

interface NotionConnectProps {
  onClose: () => void;
}

export default function NotionConnect({ onClose }: NotionConnectProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/supermemory/connections');
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectNotion = async () => {
    try {
      setIsConnecting(true);
      const response = await fetch('http://localhost:8000/supermemory/connect/notion', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        // Open the auth link in a new window
        window.open(data.authLink, '_blank', 'width=600,height=700');
        
        // Poll for connection completion
        const pollInterval = setInterval(async () => {
          await loadConnections();
          const notionConnection = connections.find(c => c.provider === 'notion');
          if (notionConnection) {
            clearInterval(pollInterval);
            setIsConnecting(false);
          }
        }, 2000);
        
        // Stop polling after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsConnecting(false);
        }, 300000);
      }
    } catch (error) {
      console.error('Failed to connect Notion:', error);
      setIsConnecting(false);
    }
  };

  const syncConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/supermemory/connections/${connectionId}/sync`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Show success message and reload connections
        await loadConnections();
      }
    } catch (error) {
      console.error('Failed to sync connection:', error);
    }
  };

  const notionConnection = connections.find(c => c.provider === 'notion');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Personal Knowledge
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
            Connect your Notion workspace to get personalized answers based on your personal notes and knowledge.
          </p>

          {!notionConnection ? (
            <div className="space-y-4">
              <div className="p-4 border border-gray-600 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                    <span className="text-black font-bold text-sm">N</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Notion</h3>
                    <p className="text-xs text-gray-400">Connect your Notion workspace</p>
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
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 border border-green-600 rounded-lg bg-green-900/20">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <h3 className="font-medium text-white">Notion Connected</h3>
                    <p className="text-xs text-gray-400">
                      {notionConnection.documentsCount || 0} documents synced
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs text-gray-400">
                    Last sync: {new Date(notionConnection.lastSync).toLocaleDateString()}
                  </div>
                  
                  <button
                    onClick={() => syncConnection(notionConnection.id)}
                    className="w-full p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Sync Now
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-300">
                    Your personal Notion content will now be included in search results to provide more personalized answers.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
