import { SearchResult, ResearchResponse, ResearchThread, StreamingResponse } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Search endpoints
  async search(query: string, options: {
    expertMode?: string
    maxResults?: number
    includeImages?: boolean
  } = {}): Promise<ResearchResponse> {
    return this.request<ResearchResponse>('/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        expert_mode: options.expertMode,
        max_results: options.maxResults || 10,
        include_images: options.includeImages || true,
      }),
    })
  }

  async searchStream(
    query: string,
    onUpdate: (response: StreamingResponse) => void,
    options: {
      expertMode?: string
      maxResults?: number
      includeImages?: boolean
    } = {}
  ): Promise<void> {
    const response = await fetch(`${this.baseURL}/search/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        expert_mode: options.expertMode,
        max_results: options.maxResults || 10,
        include_images: options.includeImages || true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Stream Error: ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body reader available')
    }

    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              onUpdate(data)
            } catch (error) {
              console.warn('Failed to parse streaming data:', error)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  // Thread management
  async getThreads(): Promise<ResearchThread[]> {
    return this.request<ResearchThread[]>('/threads')
  }

  async getThread(threadId: string): Promise<ResearchThread> {
    return this.request<ResearchThread>(`/threads/${threadId}`)
  }

  async createThread(title: string, initialMessage?: string): Promise<ResearchThread> {
    return this.request<ResearchThread>('/threads', {
      method: 'POST',
      body: JSON.stringify({ title, initial_message: initialMessage }),
    })
  }

  async updateThread(threadId: string, updates: Partial<ResearchThread>): Promise<ResearchThread> {
    return this.request<ResearchThread>(`/threads/${threadId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteThread(threadId: string): Promise<void> {
    await this.request(`/threads/${threadId}`, {
      method: 'DELETE',
    })
  }

  // Trending and discovery
  async getTrendingTopics(): Promise<any> {
    return this.request('/trending')
  }

  async getExperts(): Promise<any> {
    return this.request('/experts')
  }

  async getResearchTemplates(): Promise<any> {
    return this.request('/templates')
  }

  // Collaboration features
  async joinCollaborationRoom(roomId: string): Promise<any> {
    return this.request(`/collaboration/rooms/${roomId}/join`, {
      method: 'POST',
    })
  }

  async leaveCollaborationRoom(roomId: string): Promise<any> {
    return this.request(`/collaboration/rooms/${roomId}/leave`, {
      method: 'POST',
    })
  }

  async getActiveRooms(): Promise<any> {
    return this.request('/collaboration/rooms')
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health')
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export individual functions for convenience
export const {
  search,
  searchStream,
  getThreads,
  getThread,
  createThread,
  updateThread,
  deleteThread,
  getTrendingTopics,
  getExperts,
  getResearchTemplates,
  joinCollaborationRoom,
  leaveCollaborationRoom,
  getActiveRooms,
  healthCheck,
} = apiClient

export default apiClient
