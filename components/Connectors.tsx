'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Cloud, 
  FileText, 
  HardDrive, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Plus,
  Settings
} from 'lucide-react'
import toast from 'react-hot-toast'
import { ConnectorProvider, Connection, ConnectorAuth } from '@/lib/types'
import { apiClient } from '@/lib/api'

const CONNECTOR_PROVIDERS: ConnectorProvider[] = [
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Sync documents, presentations, and spreadsheets from your Google Drive',
    icon: '📁',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Import pages, databases, and workspaces from your Notion account',
    icon: '📝',
    color: 'from-gray-700 to-gray-800'
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    description: 'Access files and documents from your Microsoft OneDrive',
    icon: '☁️',
    color: 'from-blue-600 to-indigo-600'
  }
]

export default function Connectors() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null)
  const [syncingConnection, setSyncingConnection] = useState<string | null>(null)

  // Mock user ID - in production, get from auth context
  const userId = 'demo-user'

  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getUserConnections(userId)
      setConnections(response.connections)
    } catch (error) {
      console.error('Failed to load connections:', error)
      toast.error('Failed to load connections')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async (provider: ConnectorProvider) => {
    try {
      setConnectingProvider(provider.id)
      
      // Create connector and get auth link
      const authResponse: ConnectorAuth = await apiClient.createConnector(provider.id, userId)
      
      console.log('Auth response:', authResponse)
      
      if (!authResponse.auth_link || !authResponse.auth_link.startsWith('http')) {
        throw new Error(`Invalid auth link received: ${authResponse.auth_link}`)
      }
      
      // Open auth window for real OAuth flow
      const authWindow = window.open(
        authResponse.auth_link,
        'connector-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )
      
      if (!authWindow) {
        throw new Error('Failed to open auth window. Please allow popups for this site.')
      }

      // Listen for auth completion
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed)
          setConnectingProvider(null)
          
          // Reload connections after a short delay
          setTimeout(() => {
            loadConnections()
            toast.success(`${provider.name} connected successfully!`)
          }, 1000)
        }
      }, 1000)

    } catch (error) {
      console.error('Failed to connect:', error)
      toast.error(`Failed to connect to ${provider.name}`)
      setConnectingProvider(null)
    }
  }

  const handleSync = async (connection: Connection) => {
    try {
      setSyncingConnection(connection.id)
      
      const syncResult = await apiClient.syncConnection(connection.provider, connection.id)
      
      if (syncResult.success) {
        toast.success(`Synced ${syncResult.documentsSynced} documents from ${connection.provider}`)
        loadConnections() // Reload to get updated sync time
      } else {
        toast.error(`Sync failed: ${syncResult.errors.join(', ')}`)
      }
      
    } catch (error) {
      console.error('Failed to sync:', error)
      toast.error('Failed to sync connection')
    } finally {
      setSyncingConnection(null)
    }
  }

  const handleDisconnect = async (connection: Connection) => {
    if (!confirm(`Are you sure you want to disconnect from ${connection.provider}?`)) {
      return
    }

    try {
      await apiClient.deleteConnection(connection.id)
      toast.success(`Disconnected from ${connection.provider}`)
      loadConnections()
    } catch (error) {
      console.error('Failed to disconnect:', error)
      toast.error('Failed to disconnect')
    }
  }

  const getProviderInfo = (providerId: string) => {
    return CONNECTOR_PROVIDERS.find(p => p.id === providerId)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'syncing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return 'Never synced'
    
    const date = new Date(lastSync)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hours ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Loading your connections...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">


      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Connect Your Knowledge
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Sync your documents from Google Drive, Notion, and OneDrive to enhance your research with your existing knowledge base.
        </p>
      </div>

      {/* Available Providers */}
      <div className="grid md:grid-cols-3 gap-6">
        {CONNECTOR_PROVIDERS.map((provider) => {
          const isConnected = connections.some(conn => conn.provider === provider.id)
          const isConnecting = connectingProvider === provider.id
          
          return (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="research-card p-6 text-center group hover:shadow-xl"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${provider.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <span className="text-2xl">{provider.icon}</span>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {provider.name}
              </h3>
              
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                {provider.description}
              </p>
              
              <button
                onClick={() => handleConnect(provider)}
                disabled={isConnected || isConnecting}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  isConnected
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : isConnecting
                    ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                    Connecting...
                  </>
                ) : isConnected ? (
                  <>
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Connected
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 inline mr-2" />
                    Connect
                  </>
                )}
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Connected Services */}
      {connections.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Your Connected Services
          </h3>
          
          <div className="space-y-4">
            {connections.map((connection) => {
              const provider = getProviderInfo(connection.provider)
              if (!provider) return null
              
              const isSyncing = syncingConnection === connection.id
              
              return (
                <motion.div
                  key={connection.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="research-card p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${provider.color} rounded-lg flex items-center justify-center`}>
                        <span className="text-xl">{provider.icon}</span>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900">{provider.name}</h4>
                          {getStatusIcon(connection.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-x-4">
                          <span>Last sync: {formatLastSync(connection.lastSync)}</span>
                          {connection.documentsCount && (
                            <span>• {connection.documentsCount} documents</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSync(connection)}
                        disabled={isSyncing}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Sync now"
                      >
                        <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                      </button>
                      
                      <button
                        onClick={() => handleDisconnect(connection)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Disconnect"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Cloud className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">How it works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Connect your accounts using secure OAuth authentication</li>
              <li>• Documents are synced automatically every 4 hours or on demand</li>
              <li>• Your files are indexed and made searchable within ResearchHub</li>
              <li>• Content remains in your original accounts - we only access and index</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
