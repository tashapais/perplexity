'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, History, Sun, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  sources?: any[];
}

export default function FarfalleSearch() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'fast' | 'expert'>('fast');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const searchSuggestions = [
    "what is farfalle?",
    "openai scarlett johansson?", 
    "what is grok?",
    "what happened to ilya?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSearch = async (searchQuery?: string) => {
    const queryToSearch = searchQuery || query;
    if (!queryToSearch.trim() || isLoading) return;

    setIsLoading(true);
    setStreamingContent('');
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: queryToSearch,
      role: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setQuery('');

    try {
      // Start search
      const searchResponse = await api.search(queryToSearch);
      
      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: searchResponse.message_id,
        content: '',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        sources: searchResponse.sources
      };

      // Set up WebSocket for streaming
      const ws = api.createWebSocket(searchResponse.thread_id, searchResponse.message_id);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.finished) {
          setMessages(prev => [...prev, {
            ...assistantMessage,
            content: data.full_content || streamingContent
          }]);
          setStreamingContent('');
          setIsLoading(false);
          ws.close();
        } else {
          setStreamingContent(data.full_content || '');
        }
      };

      ws.onerror = () => {
        setIsLoading(false);
        setStreamingContent('');
      };

    } catch (error) {
      console.error('Search failed:', error);
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion);
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="text-xl font-semibold">coolperplexity</div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <History className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-400">History</span>
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors ml-4">
            <Sun className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-2xl">
              <h1 className="text-4xl font-normal text-center mb-12">
                Ask anything
              </h1>

              <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="mb-8">
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask anything..."
                    disabled={isLoading}
                    className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-700 rounded disabled:opacity-50"
                  >
                    <Search className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </form>

              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="flex bg-[#2a2a2a] rounded-lg p-1">
                  <button
                    onClick={() => setMode('fast')}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      mode === 'fast'
                        ? "bg-primary-500 text-white"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    🔍 Fast
                  </button>
                  <button
                    onClick={() => setMode('expert')}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      mode === 'expert'
                        ? "bg-primary-500 text-white"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    Expert
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isLoading}
                    className="w-full text-left p-3 bg-[#2a2a2a] hover:bg-[#353535] rounded-lg transition-colors text-gray-300 hover:text-white flex items-center gap-2 disabled:opacity-50"
                  >
                    <span className="text-gray-500">↗</span>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Chat Interface */
          <div className="flex-1 overflow-auto p-4">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="space-y-4">
                  {message.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="bg-primary-500 text-white px-4 py-2 rounded-lg max-w-3xl">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      
                      {message.sources && message.sources.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {message.sources.slice(0, 4).map((source, index) => (
                            <a
                              key={index}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-3 bg-[#2a2a2a] hover:bg-[#353535] rounded-lg transition-colors"
                            >
                              <div className="font-medium text-sm mb-1 text-white line-clamp-2">
                                {source.title}
                              </div>
                              <div className="text-xs text-gray-400 line-clamp-2">
                                {source.snippet}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new URL(source.url).hostname}
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Streaming Message */}
              {streamingContent && (
                <div className="space-y-4">
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamingContent}
                    </ReactMarkdown>
                    <span className="inline-block w-2 h-5 bg-primary-500 animate-pulse ml-1" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Bottom Input */}
        {messages.length > 0 && (
          <div className="border-t border-gray-800 p-4">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a follow-up question..."
                  disabled={isLoading}
                  className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-700 rounded disabled:opacity-50"
                >
                  <ArrowUp className="w-5 h-5 text-gray-400" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
