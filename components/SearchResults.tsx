'use client';

import { SearchResult } from '@/lib/types';
import { ExternalLink, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResultsProps {
  results: SearchResult[];
  className?: string;
}

export default function SearchResults({ results, className }: SearchResultsProps) {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-forest-700 font-semibold text-lg flex items-center gap-2">
        <Globe className="w-5 h-5" />
        Sources
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((result, index) => (
          <a
            key={index}
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "block p-4 rounded-xl",
              "bg-white/70 backdrop-blur-sm border border-forest-200",
              "hover:bg-white/90 hover:border-forest-300",
              "transition-all duration-200",
              "group cursor-pointer",
              "shadow-sm hover:shadow-md"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-forest-800 text-sm mb-2 line-clamp-2 group-hover:text-forest-600">
                  {result.title}
                </h4>
                <p className="text-forest-600 text-xs line-clamp-3 mb-2">
                  {result.snippet}
                </p>
                <p className="text-forest-500 text-xs truncate">
                  {new URL(result.url).hostname}
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-forest-400 group-hover:text-forest-600 flex-shrink-0 mt-1" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
