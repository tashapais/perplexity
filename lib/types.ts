export interface SearchResult {
  title: string;
  url: string;
  content: string;
  snippet: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  sources?: SearchResult[];
}

export interface Thread {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface StreamingResponse {
  content: string;
  finished: boolean;
  full_content?: string;
}

export interface SearchResponse {
  thread_id: string;
  message_id: string;
  sources: SearchResult[];
  user_message_id: string;
}
