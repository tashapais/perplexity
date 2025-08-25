'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Sparkles, Users, Brain, TrendingUp, BookOpen, Globe, Zap } from 'lucide-react'
import SearchInterface from '@/components/SearchInterface'
import SearchResults from '@/components/SearchResults'
import ResearchTemplates from '@/components/ResearchTemplates'
import CollaborationHub from '@/components/CollaborationHub'
import TrendingTopics from '@/components/TrendingTopics'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    setIsSearching(true)
    setShowResults(true)
    // Search logic will be implemented when backend is ready
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">ResearchHub</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <button className="text-gray-600 hover:text-gray-900 font-medium">
                Templates
              </button>
              <button className="text-gray-600 hover:text-gray-900 font-medium">
                Collaborate
              </button>
              <a 
                href="/connectors"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Connectors
              </a>
              <button className="text-gray-600 hover:text-gray-900 font-medium">
                History
              </button>
              <button className="btn-primary">
                <Users className="w-4 h-4 mr-2" />
                Join Research
              </button>
            </div>
          </div>
        </div>
      </nav>

      {!showResults ? (
        /* Landing Page */
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-6xl font-bold text-gray-900 mb-6">
              Research Anything,
              <span className="gradient-text block">Together</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              The next-generation research platform with real-time collaboration, 
              expert-curated sources, and interactive knowledge graphs. 
              Transform how you discover, analyze, and share knowledge.
            </p>

            {/* Search Interface */}
            <SearchInterface onSearch={handleSearch} />

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8 mt-20">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="research-card p-8 text-center group hover:shadow-xl"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-accent-100 to-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-accent-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Collaboration</h3>
                <p className="text-gray-600">
                  Research with your team in real-time. Share insights, build knowledge together, 
                  and see everyone's contributions live.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="research-card p-8 text-center group hover:shadow-xl"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Expert Mode</h3>
                <p className="text-gray-600">
                  Access curated sources from domain experts in Finance, Technology, 
                  Science, and more for authoritative research.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="research-card p-8 text-center group hover:shadow-xl"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Globe className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Knowledge Graphs</h3>
                <p className="text-gray-600">
                  Visualize connections between concepts, sources, and ideas with 
                  interactive knowledge graphs.
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Research Templates */}
          <ResearchTemplates onSelectTemplate={handleSearch} />

          {/* Trending Topics */}
          <TrendingTopics onSelectTopic={handleSearch} />

          {/* Collaboration Hub */}
          <CollaborationHub />
        </div>
      ) : (
        /* Search Results Page */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with new search */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => setShowResults(false)}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                ← Back to Home
              </button>
              
              <div className="flex items-center space-x-4">
                <button className="btn-secondary">
                  <Zap className="w-4 h-4 mr-2" />
                  Expert Mode
                </button>
                <button className="btn-secondary">
                  <Users className="w-4 h-4 mr-2" />
                  Collaborate
                </button>
              </div>
            </div>
            
            {/* Compact search bar */}
            <div className="max-w-3xl mx-auto">
              <SearchInterface onSearch={handleSearch} />
            </div>
          </div>

          {/* Search Results */}
          <SearchResults 
            query={searchQuery} 
            onNewSearch={(newQuery) => {
              setSearchQuery(newQuery)
            }} 
          />
        </div>
      )}
    </div>
  )
}
