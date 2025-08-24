'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, Mic, Camera, Sparkles } from 'lucide-react'

interface SearchInterfaceProps {
  onSearch: (query: string) => void
}

export default function SearchInterface({ onSearch }: SearchInterfaceProps) {
  const [query, setQuery] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const searchSuggestions = [
    "What are the latest developments in quantum computing?",
    "Analyze the impact of AI on the job market",
    "Compare renewable energy sources efficiency",
    "Explain blockchain technology applications",
    "Research climate change mitigation strategies",
    "Investigate cryptocurrency market trends",
    "Study the effects of remote work on productivity",
    "Explore gene therapy breakthrough treatments"
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    
    if (value.length > 2) {
      const filtered = searchSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 5))
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    onSearch(suggestion)
  }

  const handleVoiceSearch = () => {
    setIsListening(true)
    // Voice recognition will be implemented later
    setTimeout(() => setIsListening(false), 2000)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative max-w-4xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Ask anything... What would you like to research?"
            className="w-full pl-16 pr-32 py-6 text-lg border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none shadow-lg hover:shadow-xl transition-all duration-200 bg-white"
            autoComplete="off"
          />
          
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center space-x-2">
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`p-3 rounded-xl transition-all duration-200 ${
                isListening 
                  ? 'bg-red-100 text-red-600 animate-pulse' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
            
            <button
              type="button"
              className="p-3 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl transition-all duration-200"
            >
              <Camera className="w-5 h-5" />
            </button>
            
            <button
              type="submit"
              disabled={!query.trim()}
              className="p-3 bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 min-w-[48px]"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="search-suggestions"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="suggestion-item"
              >
                <div className="flex items-center">
                  <Search className="w-4 h-4 text-gray-400 mr-3" />
                  <span>{suggestion}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </form>

      {/* Quick Search Examples */}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {[
          "Latest AI breakthroughs",
          "Climate change solutions",
          "Cryptocurrency trends",
          "Space exploration news"
        ].map((example, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(example)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors duration-200"
          >
            {example}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
