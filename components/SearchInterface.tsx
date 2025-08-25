'use client';

import { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInterfaceProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export default function SearchInterface({ 
  onSearch, 
  isLoading = false, 
  placeholder = "Ask anything..." 
}: SearchInterfaceProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  const exampleQueries = [
    "What are the latest developments in AI?",
    "How does climate change affect ocean currents?",
    "Explain quantum computing in simple terms",
    "What are the benefits of renewable energy?"
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-forest-500 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className={cn(
              "w-full pl-12 pr-4 py-4 text-lg rounded-2xl",
              "bg-white/80 backdrop-blur-sm border-2 border-forest-200",
              "focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20",
              "placeholder-forest-400 text-forest-900",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-lg hover:shadow-xl"
            )}
          />
          {isLoading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <Sparkles className="w-5 h-5 text-forest-500 animate-pulse" />
            </div>
          )}
        </div>
      </form>

      {!query && (
        <div className="space-y-4">
          <p className="text-forest-600 text-center text-sm font-medium">
            Try asking about:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                onClick={() => setQuery(example)}
                className={cn(
                  "p-4 text-left rounded-xl",
                  "bg-white/60 backdrop-blur-sm border border-forest-200",
                  "hover:bg-white/80 hover:border-forest-300",
                  "transition-all duration-200",
                  "text-forest-700 text-sm",
                  "shadow-sm hover:shadow-md"
                )}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
