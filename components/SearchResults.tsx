'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Clock, Globe, Users, Share, BookmarkPlus, ThumbsUp, MessageSquare } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SearchResult } from '@/lib/types'
import { apiClient } from '@/lib/api'

interface SearchResultsProps {
  query: string
  onNewSearch: (query: string) => void
}

export default function SearchResults({ query, onNewSearch }: SearchResultsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [sources, setSources] = useState<SearchResult[]>([])
  const [answer, setAnswer] = useState('')
  const [relatedQueries, setRelatedQueries] = useState<string[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentChunk, setCurrentChunk] = useState('')

  useEffect(() => {
    if (query) {
      performSearch()
    }
  }, [query])

  const performSearch = async () => {
    setIsLoading(true)
    setIsStreaming(true)
    setSources([])
    setAnswer('')
    setRelatedQueries([])
    setCurrentChunk('')

    try {
      await apiClient.searchStream(
        query,
        (response) => {
          switch (response.type) {
            case 'sources':
              setSources(response.data)
              setIsLoading(false)
              break
            case 'content':
              setCurrentChunk(response.data)
              setAnswer(prev => prev + response.data)
              break
            case 'complete':
              setRelatedQueries(response.data.related_queries || [])
              setIsStreaming(false)
              setCurrentChunk('')
              break
            case 'error':
              console.error('Search error:', response.data)
              setIsStreaming(false)
              break
          }
        },
        { maxResults: 8, includeImages: true }
      )
    } catch (error) {
      console.error('Search failed:', error)
      setIsLoading(false)
      setIsStreaming(false)
      
      // Fallback to mock data for demo
      setSources([
        {
          id: '1',
          title: `Research Results for "${query}"`,
          url: 'https://example.com/research',
          snippet: 'This is a comprehensive analysis of the requested topic with detailed insights and expert perspectives.',
          publishedDate: '2024-01-15',
          relevanceScore: 0.95
        }
      ])
      setAnswer(`Based on my research about "${query}", here are the key findings and insights...`)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-200 border-t-accent-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Searching the web...</h3>
          <p className="text-gray-600">Finding the most relevant and up-to-date information</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Sources Section */}
      {sources.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-accent-600" />
            Sources ({sources.length})
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {sources.map((source, index) => (
              <motion.div
                key={source.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="research-card p-4 hover:shadow-lg group cursor-pointer"
                onClick={() => window.open(source.url, '_blank')}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-gray-900 group-hover:text-accent-600 transition-colors line-clamp-2 flex-1 mr-2">
                    {source.title}
                  </h3>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-accent-600 transition-colors flex-shrink-0" />
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {source.snippet}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className="truncate max-w-32">
                      {new URL(source.url).hostname}
                    </span>
                    {source.publishedDate && (
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(source.publishedDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {source.relevanceScore && (
                    <div className="text-green-600 font-medium">
                      {Math.round(source.relevanceScore * 100)}% match
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Answer Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="ai-message message-bubble"
      >
        <div className="flex items-start space-x-4">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom link component with citations
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="citation"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {answer}
              </ReactMarkdown>
              
              {isStreaming && currentChunk && (
                <span className="typing-indicator">
                  <span className="typing-dot" style={{ '--delay': '0ms' } as any}></span>
                  <span className="typing-dot" style={{ '--delay': '150ms' } as any}></span>
                  <span className="typing-dot" style={{ '--delay': '300ms' } as any}></span>
                </span>
              )}
            </div>
            
            {/* Action buttons */}
            {!isStreaming && answer && (
              <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-gray-100">
                <button className="flex items-center text-sm text-gray-600 hover:text-accent-600 transition-colors">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Helpful
                </button>
                <button className="flex items-center text-sm text-gray-600 hover:text-accent-600 transition-colors">
                  <BookmarkPlus className="w-4 h-4 mr-1" />
                  Save
                </button>
                <button className="flex items-center text-sm text-gray-600 hover:text-accent-600 transition-colors">
                  <Share className="w-4 h-4 mr-1" />
                  Share
                </button>
                <button className="flex items-center text-sm text-gray-600 hover:text-accent-600 transition-colors">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Follow up
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Related Queries */}
      {relatedQueries.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900">Related Research</h3>
          
          <div className="grid md:grid-cols-2 gap-3">
            {relatedQueries.map((relatedQuery, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => onNewSearch(relatedQuery)}
                className="text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 hover:border-accent-300 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 group-hover:text-accent-600 transition-colors">
                    {relatedQuery}
                  </span>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-accent-600 transition-colors" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      {/* Collaboration Features */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-r from-accent-50 to-blue-50 rounded-xl p-6 border border-accent-100"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Enhance your research</h3>
            <p className="text-sm text-gray-600">
              Collaborate with experts, join research rooms, or explore knowledge graphs
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="btn-secondary text-sm">
              <Users className="w-4 h-4 mr-2" />
              Collaborate
            </button>
            <button className="btn-primary text-sm">
              Expert Mode
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
