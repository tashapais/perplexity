'use client';

import { Message } from '@/lib/types';
import { User, Bot, Clock } from 'lucide-react';
import { cn, formatTimeAgo } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import GroupedSearchResults from './GroupedSearchResults';
import FollowUpQuestions from './FollowUpQuestions';
import SmartSummary from './SmartSummary';

interface EnhancedMessageDisplayProps {
  message: Message;
  isStreaming?: boolean;
  className?: string;
  onFollowUpQuestion?: (question: string) => void;
  previousUserMessage?: string;
  sourceGroups?: any; // The new grouped source structure from backend
}

export default function EnhancedMessageDisplay({ 
  message, 
  isStreaming = false,
  className,
  onFollowUpQuestion,
  previousUserMessage,
  sourceGroups
}: EnhancedMessageDisplayProps) {
  const isUser = message.role === 'user';
  
  // Process content to make citations clickable
  const processContent = (content: string) => {
    if (!sourceGroups) return content;
    
    // Create source mapping for hyperlinks
    const sourceMapping: Record<number, string> = {};
    let sourceIndex = 1;
    
    // Map Notion sources
    if (sourceGroups.notion?.results) {
      sourceGroups.notion.results.forEach((result: any) => {
        sourceMapping[sourceIndex] = result.url;
        sourceIndex++;
      });
    }
    
    // Map web sources
    if (sourceGroups.web?.results) {
      sourceGroups.web.results.forEach((result: any) => {
        sourceMapping[sourceIndex] = result.url;
        sourceIndex++;
      });
    }
    
    // Replace [[1]](URL) format with proper markdown links using our mapping
    return content.replace(/\[\[(\d+)\]\]\([^)]*\)/g, (match, number) => {
      const sourceNumber = parseInt(number);
      const url = sourceMapping[sourceNumber];
      return url ? `[[${number}]](${url})` : match;
    });
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn(
        "flex gap-4",
        isUser ? "justify-end" : "justify-start"
      )}>
        <div className={cn(
          "flex gap-3 max-w-4xl",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            isUser 
              ? "bg-forest-500 text-white" 
              : "bg-white border-2 border-forest-200"
          )}>
            {isUser ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4 text-forest-600" />
            )}
          </div>
          
          <div className={cn(
            "flex-1 space-y-3",
            isUser ? "text-right" : "text-left"
          )}>
            <div className={cn(
              "inline-block p-4 rounded-2xl max-w-full",
              isUser 
                ? "bg-forest-500 text-white ml-auto" 
                : "text-forest-900"
            )}>
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="prose prose-forest max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 text-forest-800">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-forest-900">{children}</strong>,
                      em: ({ children }) => <em className="italic text-forest-700">{children}</em>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="text-forest-800">{children}</li>,
                      code: ({ children }) => (
                        <code className="px-2 py-1 bg-forest-100 text-forest-800 rounded text-sm">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-forest-100 p-3 rounded-lg text-sm overflow-x-auto">
                          {children}
                        </pre>
                      ),
                      // Enhanced link handling for citations
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium underline decoration-blue-600/30 hover:decoration-blue-800/50 transition-colors"
                        >
                          {children}
                        </a>
                      ),
                      // Enhanced image handling for inline images
                      img: ({ src, alt }) => (
                        <img
                          src={src}
                          alt={alt}
                          className="max-w-full h-auto rounded-lg my-2 border border-forest-200"
                        />
                      ),
                    }}
                  >
                    {processContent(message.content)}
                  </ReactMarkdown>
                  {isStreaming && (
                    <span className="inline-block w-2 h-5 bg-forest-500 animate-pulse ml-1" />
                  )}
                </div>
              )}
            </div>
            
            <div className={cn(
              "flex items-center gap-2 text-xs text-forest-500",
              isUser ? "justify-end" : "justify-start"
            )}>
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(message.timestamp)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced grouped search results */}
      {!isUser && sourceGroups && (
        <div className="ml-11 space-y-6">
          <GroupedSearchResults sourceGroups={sourceGroups} />
          
          {/* Smart Summary */}
          {!isStreaming && previousUserMessage && message.sources && (
            <SmartSummary
              query={previousUserMessage}
              sources={message.sources}
              response={message.content}
            />
          )}
          
          {/* Follow-up Questions */}
          {!isStreaming && onFollowUpQuestion && previousUserMessage && (
            <FollowUpQuestions
              lastQuery={previousUserMessage}
              lastResponse={message.content}
              onQuestionSelect={onFollowUpQuestion}
            />
          )}
        </div>
      )}
    </div>
  );
}
