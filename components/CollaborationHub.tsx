'use client'

import { motion } from 'framer-motion'
import { Users, Globe, Brain, Zap, MessageCircle, Star } from 'lucide-react'

const activeRooms = [
  {
    id: 1,
    title: "AI Ethics Discussion",
    description: "Exploring ethical implications of advanced AI systems",
    participants: 12,
    category: "AI & Ethics",
    status: "active",
    avatar: "🤖",
    lastActivity: "2 min ago"
  },
  {
    id: 2,
    title: "Climate Solutions Research",
    description: "Collaborative research on carbon capture technologies",
    participants: 8,
    category: "Environment",
    status: "active",
    avatar: "🌱",
    lastActivity: "5 min ago"
  },
  {
    id: 3,
    title: "Quantum Computing Study Group",
    description: "Understanding quantum algorithms and applications",
    participants: 15,
    category: "Physics",
    status: "active",
    avatar: "⚛️",
    lastActivity: "1 min ago"
  },
  {
    id: 4,
    title: "Biotech Investment Analysis",
    description: "Analyzing emerging biotech companies and trends",
    participants: 6,
    category: "Finance",
    status: "active",
    avatar: "🧬",
    lastActivity: "8 min ago"
  }
]

const featuredExperts = [
  {
    name: "Dr. Sarah Chen",
    expertise: "AI & Machine Learning",
    institution: "Stanford AI Lab",
    avatar: "👩‍🔬",
    rating: 4.9,
    sessions: 234
  },
  {
    name: "Prof. Michael Torres",
    expertise: "Climate Science",
    institution: "MIT Climate Portal",
    avatar: "👨‍🏫",
    rating: 4.8,
    sessions: 189
  },
  {
    name: "Dr. Lisa Wang",
    expertise: "Quantum Physics",
    institution: "IBM Quantum",
    avatar: "👩‍💼",
    rating: 4.9,
    sessions: 156
  }
]

export default function CollaborationHub() {
  return (
    <section className="mt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-accent-600 mr-3" />
          <h2 className="text-3xl font-bold text-gray-900">Collaboration Hub</h2>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Join active research communities and learn from domain experts
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Active Research Rooms */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-green-600" />
            Active Research Rooms
          </h3>
          
          <div className="space-y-4">
            {activeRooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="research-card p-4 hover:shadow-lg cursor-pointer group"
              >
                <div className="flex items-start space-x-4">
                  <div className="text-2xl">{room.avatar}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 group-hover:text-accent-600 transition-colors">
                        {room.title}
                      </h4>
                      <div className="flex items-center text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-xs">Live</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {room.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {room.category}
                        </span>
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {room.participants} researchers
                        </div>
                      </div>
                      <span>{room.lastActivity}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button className="btn-primary">
              <Globe className="w-4 h-4 mr-2" />
              Browse All Rooms
            </button>
          </div>
        </div>

        {/* Featured Experts */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            Featured Experts
          </h3>
          
          <div className="space-y-4">
            {featuredExperts.map((expert, index) => (
              <motion.div
                key={expert.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="research-card p-4 hover:shadow-lg cursor-pointer group"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{expert.avatar}</div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 group-hover:text-accent-600 transition-colors">
                      {expert.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-1">{expert.expertise}</p>
                    <p className="text-xs text-gray-500 mb-2">{expert.institution}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Star className="w-3 h-3 text-yellow-400 mr-1" />
                          {expert.rating}
                        </div>
                        <span>{expert.sessions} sessions</span>
                      </div>
                      
                      <button className="text-xs bg-accent-100 text-accent-700 px-3 py-1 rounded-full hover:bg-accent-200 transition-colors">
                        Ask Expert
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <button className="w-full btn-secondary">
              <Brain className="w-4 h-4 mr-2" />
              Browse All Experts
            </button>
            <button className="w-full btn-primary">
              <Zap className="w-4 h-4 mr-2" />
              Become an Expert
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
