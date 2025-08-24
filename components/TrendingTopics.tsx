'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Clock, Users, Eye } from 'lucide-react'

interface TrendingTopicsProps {
  onSelectTopic: (query: string) => void
}

const trendingTopics = [
  {
    id: 1,
    title: "GPT-4 Vision Capabilities",
    description: "Exploring the multimodal AI breakthrough and its applications",
    category: "AI & Technology",
    researchers: 234,
    views: "12.5K",
    timeAgo: "2 hours ago",
    trend: "+15%"
  },
  {
    id: 2,
    title: "Quantum Computing Advances",
    description: "Latest developments in quantum supremacy and error correction",
    category: "Science",
    researchers: 189,
    views: "8.7K",
    timeAgo: "4 hours ago",
    trend: "+23%"
  },
  {
    id: 3,
    title: "Climate Tech Innovations",
    description: "Breakthrough technologies for carbon capture and renewable energy",
    category: "Environment",
    researchers: 156,
    views: "6.2K",
    timeAgo: "6 hours ago",
    trend: "+8%"
  },
  {
    id: 4,
    title: "Web3 Infrastructure",
    description: "Decentralized web technologies and blockchain scalability",
    category: "Blockchain",
    researchers: 143,
    views: "5.9K",
    timeAgo: "8 hours ago",
    trend: "+12%"
  },
  {
    id: 5,
    title: "Gene Therapy Breakthroughs",
    description: "Recent advances in CRISPR and personalized medicine",
    category: "Biotechnology",
    researchers: 98,
    views: "4.1K",
    timeAgo: "10 hours ago",
    trend: "+31%"
  },
  {
    id: 6,
    title: "Space Tourism Economics",
    description: "Market analysis of commercial space travel and accessibility",
    category: "Space & Business",
    researchers: 87,
    views: "3.8K",
    timeAgo: "12 hours ago",
    trend: "+6%"
  }
]

const categories = [
  { name: "AI & Technology", color: "bg-blue-100 text-blue-700" },
  { name: "Science", color: "bg-green-100 text-green-700" },
  { name: "Environment", color: "bg-emerald-100 text-emerald-700" },
  { name: "Blockchain", color: "bg-purple-100 text-purple-700" },
  { name: "Biotechnology", color: "bg-pink-100 text-pink-700" },
  { name: "Space & Business", color: "bg-orange-100 text-orange-700" }
]

export default function TrendingTopics({ onSelectTopic }: TrendingTopicsProps) {
  const getCategoryColor = (category: string) => {
    const found = categories.find(cat => cat.name === category)
    return found ? found.color : "bg-gray-100 text-gray-700"
  }

  const handleTopicClick = (topic: typeof trendingTopics[0]) => {
    onSelectTopic(`Research ${topic.title}: ${topic.description}`)
  }

  return (
    <section className="mt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-accent-600 mr-3" />
          <h2 className="text-3xl font-bold text-gray-900">Trending Research</h2>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover what researchers worldwide are exploring right now
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trendingTopics.map((topic, index) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 * index }}
            onClick={() => handleTopicClick(topic)}
            className="research-card p-6 cursor-pointer hover:shadow-xl group"
          >
            <div className="flex items-start justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(topic.category)}`}>
                {topic.category}
              </span>
              <div className="flex items-center text-green-600 text-sm font-medium">
                <TrendingUp className="w-4 h-4 mr-1" />
                {topic.trend}
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-accent-600 transition-colors line-clamp-2">
              {topic.title}
            </h3>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {topic.description}
            </p>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {topic.researchers}
                </div>
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {topic.views}
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {topic.timeAgo}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-8">
        <button className="btn-secondary">
          View All Trending Topics
        </button>
      </div>
    </section>
  )
}
