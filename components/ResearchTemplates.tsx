'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Briefcase, Beaker, Heart, Globe, Zap, BookOpen, Shield } from 'lucide-react'

interface ResearchTemplatesProps {
  onSelectTemplate: (query: string) => void
}

const templates = [
  {
    id: 'market-analysis',
    title: 'Market Analysis',
    description: 'Deep dive into market trends, competitor analysis, and industry insights',
    icon: TrendingUp,
    color: 'from-blue-500 to-cyan-500',
    prompts: [
      'Analyze the current market trends in [industry]',
      'Compare top competitors in [market segment]',
      'Evaluate market opportunities for [product/service]',
      'Research consumer behavior patterns in [demographic]'
    ]
  },
  {
    id: 'business-research',
    title: 'Business Intelligence',
    description: 'Strategic research for business decisions and growth opportunities',
    icon: Briefcase,
    color: 'from-purple-500 to-pink-500',
    prompts: [
      'Research potential business partnerships in [industry]',
      'Analyze regulatory changes affecting [business sector]',
      'Study successful business models in [field]',
      'Investigate emerging technologies for [business application]'
    ]
  },
  {
    id: 'scientific-research',
    title: 'Scientific Research',
    description: 'Evidence-based research with peer-reviewed sources and expert insights',
    icon: Beaker,
    color: 'from-green-500 to-emerald-500',
    prompts: [
      'Review recent studies on [scientific topic]',
      'Analyze research methodologies in [field]',
      'Compare different scientific theories about [phenomenon]',
      'Investigate breakthrough discoveries in [discipline]'
    ]
  },
  {
    id: 'health-wellness',
    title: 'Health & Wellness',
    description: 'Medical research with verified health information and expert sources',
    icon: Heart,
    color: 'from-red-500 to-rose-500',
    prompts: [
      'Research evidence-based treatments for [condition]',
      'Analyze nutrition studies on [dietary topic]',
      'Compare exercise regimens for [fitness goal]',
      'Study preventive measures for [health issue]'
    ]
  },
  {
    id: 'technology-trends',
    title: 'Technology Trends',
    description: 'Latest tech developments, innovation patterns, and future predictions',
    icon: Zap,
    color: 'from-orange-500 to-yellow-500',
    prompts: [
      'Explore emerging trends in [technology field]',
      'Analyze the impact of [technology] on [industry]',
      'Compare different [tech solutions] for [use case]',
      'Research future applications of [emerging technology]'
    ]
  },
  {
    id: 'policy-research',
    title: 'Policy & Governance',
    description: 'Government policies, regulations, and their societal impact analysis',
    icon: Shield,
    color: 'from-indigo-500 to-blue-500',
    prompts: [
      'Analyze policy implications of [legislation]',
      'Research regulatory frameworks in [sector]',
      'Compare governance models across [regions]',
      'Study policy effectiveness in [area]'
    ]
  },
  {
    id: 'academic-research',
    title: 'Academic Research',
    description: 'Scholarly research with citations, literature reviews, and academic sources',
    icon: BookOpen,
    color: 'from-teal-500 to-green-500',
    prompts: [
      'Conduct literature review on [academic topic]',
      'Analyze theoretical frameworks in [field]',
      'Compare research methodologies for [study type]',
      'Explore academic debates about [topic]'
    ]
  },
  {
    id: 'global-insights',
    title: 'Global Insights',
    description: 'International perspectives, cultural analysis, and global trend research',
    icon: Globe,
    color: 'from-violet-500 to-purple-500',
    prompts: [
      'Compare global approaches to [issue]',
      'Analyze cultural differences in [practice]',
      'Research international trends in [field]',
      'Study cross-cultural impacts of [phenomenon]'
    ]
  }
]

export default function ResearchTemplates({ onSelectTemplate }: ResearchTemplatesProps) {
  const handleTemplateSelect = (template: typeof templates[0]) => {
    // For demo, we'll use the first prompt with a placeholder
    const query = template.prompts[0].replace('[', 'artificial intelligence').replace(']', '')
    onSelectTemplate(query)
  }

  return (
    <section className="mt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Research Templates</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Get started quickly with our curated research frameworks designed by domain experts
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map((template, index) => {
          const Icon = template.icon
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              onClick={() => handleTemplateSelect(template)}
              className="research-template group cursor-pointer"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${template.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-accent-600 transition-colors">
                {template.title}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {template.description}
              </p>
              
              <div className="space-y-2">
                {template.prompts.slice(0, 2).map((prompt, idx) => (
                  <div key={idx} className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                    {prompt}
                  </div>
                ))}
                {template.prompts.length > 2 && (
                  <div className="text-xs text-accent-600 font-medium">
                    +{template.prompts.length - 2} more prompts
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
