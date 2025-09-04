'use client';

import { SearchResult } from '@/lib/types';
import { ExternalLink, Globe, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SourceGroup {
  title: string;
  description: string;
  results: SearchResult[];
  count: number;
}

interface GroupedSearchResultsProps {
  sourceGroups: {
    notion?: SourceGroup;
    web?: SourceGroup;
  };
  className?: string;
}

interface SearchResultCardProps {
  result: SearchResult;
  index: number;
  isNotion?: boolean;
}

function SearchResultCard({ result, index, isNotion = false }: SearchResultCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <a
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
      <div className="space-y-3">
        {/* Header with favicon/icon and source number */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isNotion ? (
              <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
            ) : result.favicon_url && !imageError ? (
              <img
                src={result.favicon_url}
                alt=""
                className="w-4 h-4 flex-shrink-0"
                onError={() => setImageError(true)}
              />
            ) : (
              <Globe className="w-4 h-4 text-forest-500 flex-shrink-0" />
            )}
            <span className="text-xs font-medium text-forest-500 bg-forest-100 px-2 py-1 rounded">
              [{index + 1}]
            </span>
          </div>
          <ExternalLink className="w-4 h-4 text-forest-400 group-hover:text-forest-600 flex-shrink-0" />
        </div>

        {/* Image if available */}
        {result.image_url && !isNotion && (
          <div className="relative">
            {!imageLoaded && (
              <div className="w-full h-32 bg-forest-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-forest-400" />
              </div>
            )}
            <img
              src={result.image_url}
              alt={result.title}
              className={cn(
                "w-full h-32 object-cover rounded-lg transition-opacity duration-200",
                imageLoaded ? "opacity-100" : "opacity-0 absolute inset-0"
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </div>
        )}

        {/* Content */}
        <div className="space-y-2">
          <h4 className="font-medium text-forest-800 text-sm line-clamp-2 group-hover:text-forest-600">
            {result.title?.replace('📄 ', '') || 'Untitled'}
          </h4>
          <p className="text-forest-600 text-xs line-clamp-3">
            {result.snippet || result.content}
          </p>
          <p className="text-forest-500 text-xs truncate">
            {isNotion ? 'notion.so' : new URL(result.url).hostname}
          </p>
        </div>
      </div>
    </a>
  );
}

export default function GroupedSearchResults({ sourceGroups, className }: GroupedSearchResultsProps) {
  if (!sourceGroups || (!sourceGroups.notion?.results?.length && !sourceGroups.web?.results?.length)) {
    return null;
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* Notion Results Group */}
      {sourceGroups.notion && sourceGroups.notion.results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-forest-700 font-semibold text-lg">
                {sourceGroups.notion.title}
              </h3>
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {sourceGroups.notion.count} pages
            </span>
          </div>
          <p className="text-forest-600 text-sm">{sourceGroups.notion.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sourceGroups.notion.results.map((result, index) => (
              <SearchResultCard
                key={`notion-${index}`}
                result={result}
                index={index}
                isNotion={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Web Results Group */}
      {sourceGroups.web && sourceGroups.web.results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-green-600" />
              <h3 className="text-forest-700 font-semibold text-lg">
                {sourceGroups.web.title}
              </h3>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              {sourceGroups.web.count} results
            </span>
          </div>
          <p className="text-forest-600 text-sm">{sourceGroups.web.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sourceGroups.web.results.map((result, index) => (
              <SearchResultCard
                key={`web-${index}`}
                result={result}
                index={sourceGroups.notion?.results?.length ? sourceGroups.notion.results.length + index : index}
                isNotion={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
