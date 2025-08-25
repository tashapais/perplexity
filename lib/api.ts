import { Thread, SearchResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = {
  async search(query: string, threadId?: string): Promise<SearchResponse> {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        thread_id: threadId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    return response.json();
  },

  async getThreads(): Promise<Thread[]> {
    const response = await fetch(`${API_BASE_URL}/threads`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch threads: ${response.statusText}`);
    }

    return response.json();
  },

  async getThread(threadId: string): Promise<Thread> {
    const response = await fetch(`${API_BASE_URL}/threads/${threadId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch thread: ${response.statusText}`);
    }

    return response.json();
  },

  async deleteThread(threadId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/threads/${threadId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete thread: ${response.statusText}`);
    }
  },

  createWebSocket(threadId: string, messageId: string): WebSocket {
    const wsUrl = API_BASE_URL.replace('http', 'ws');
    return new WebSocket(`${wsUrl}/ws/stream/${threadId}/${messageId}`);
  },
};
