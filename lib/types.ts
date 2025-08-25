// Core application types

export interface SearchResult {
  id: string
  title: string
  url: string
  snippet: string
  publishedDate?: string
  relevanceScore?: number
  domain?: string
  favicon?: string
}

export interface ResearchResponse {
  query: string
  sources: SearchResult[]
  answer: string
  expertInsights?: string[]
  relatedQueries?: string[]
  timestamp: Date
  responseTime?: number
}

export interface ThreadMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  sources?: SearchResult[]
  metadata?: {
    expertMode?: string
    searchTime?: number
    tokenCount?: number
  }
}

export interface ResearchThread {
  id: string
  title: string
  messages: ThreadMessage[]
  createdAt: Date
  updatedAt: Date
  isCollaborative?: boolean
  participants?: User[]
  tags?: string[]
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  expertise?: string[]
  institution?: string
  isExpert?: boolean
  rating?: number
}

export interface ExpertModeConfig {
  name: string
  description: string
  sources: string[]
  prompts: string[]
  icon: string
  color: string
}

export interface KnowledgeNode {
  id: string
  label: string
  type: 'concept' | 'source' | 'person' | 'organization'
  description?: string
  url?: string
  relevance: number
  connections: string[]
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[]
  edges: Array<{
    source: string
    target: string
    relationship: string
    strength: number
  }>
}

export interface ResearchTemplate {
  id: string
  title: string
  description: string
  category: string
  prompts: string[]
  icon: string
  color: string
  expertMode?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface TrendingTopic {
  id: string
  title: string
  description: string
  category: string
  researchers: number
  views: string
  timeAgo: string
  trend: string
  tags?: string[]
}

export interface CollaborationRoom {
  id: string
  title: string
  description: string
  participants: number
  category: string
  status: 'active' | 'inactive'
  avatar: string
  lastActivity: string
  isPrivate?: boolean
  moderators?: User[]
}

export interface Expert {
  id: string
  name: string
  expertise: string
  institution: string
  avatar: string
  rating: number
  sessions: number
  bio?: string
  publications?: string[]
  specializations?: string[]
  availability?: 'available' | 'busy' | 'offline'
}

export interface StreamingResponse {
  type: 'sources' | 'content' | 'complete' | 'error'
  data: any
}

export interface SearchFilters {
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all'
  sources?: string[]
  language?: string
  region?: string
  expertMode?: string
  includeImages?: boolean
  includePapers?: boolean
}

export interface Citation {
  id: string
  title: string
  url: string
  authors?: string[]
  publishedDate?: string
  journal?: string
  citationStyle?: 'apa' | 'mla' | 'chicago'
}

// Supermemory Connector Types
export interface ConnectorProvider {
  id: 'google-drive' | 'notion' | 'onedrive'
  name: string
  description: string
  icon: string
  color: string
}

export interface ConnectorAuth {
  auth_link: string
  connection_id: string
  provider: string
  redirect_url: string
}

export interface Connection {
  id: string
  provider: string
  status: 'connected' | 'error' | 'syncing'
  lastSync?: string
  documentsCount?: number
  createdAt?: string
}

export interface SyncResult {
  success: boolean
  documentsSynced: number
  errors: string[]
  syncTime: string
}

export interface ConnectedDocument {
  id: string
  title: string
  content: string
  source: string
  provider: string
  lastModified: string
  url?: string
}
