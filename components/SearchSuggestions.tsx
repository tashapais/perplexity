'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Clock, Lightbulb, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchSuggestionsProps {
  className?: string;
  onSuggestionSelect: (suggestion: string) => void;
}

export default function SearchSuggestions({ 
  className, 
  onSuggestionSelect 
}: SearchSuggestionsProps) {
  const [currentTime] = useState(new Date());
  
  // Trending topics that update based on time of day/season
  const getTrendingTopics = () => {
    const hour = currentTime.getHours();
    const month = currentTime.getMonth();
    
    let topics = [];
    
    // Time-based suggestions
    if (hour >= 6 && hour < 12) {
      topics.push("Morning productivity techniques");
      topics.push("Healthy breakfast ideas for energy");
    } else if (hour >= 12 && hour < 17) {
      topics.push("Effective time management strategies");
      topics.push("Remote work best practices");
    } else {
      topics.push("Evening wind-down routines");
      topics.push("Sleep optimization techniques");
    }
    
    // Season-based suggestions
    if (month >= 2 && month <= 4) { // Spring
      topics.push("Spring cleaning organization tips");
      topics.push("Seasonal allergy management");
    } else if (month >= 5 && month <= 7) { // Summer
      topics.push("Summer travel destinations 2024");
      topics.push("Heat wave safety measures");
    } else if (month >= 8 && month <= 10) { // Fall
      topics.push("Back to school study strategies");
      topics.push("Fall home maintenance checklist");
    } else { // Winter
      topics.push("Winter wellness strategies");
      topics.push("Holiday stress management");
    }
    
    return topics.slice(0, 4);
  };

  const researchTemplates = [
    {
      icon: '🔬',
      title: 'Scientific Research',
      query: 'What are the latest peer-reviewed studies on',
      placeholder: 'topic of interest'
    },
    {
      icon: '📊',
      title: 'Market Analysis', 
      query: 'Analyze the current market trends and future outlook for',
      placeholder: 'industry or product'
    },
    {
      icon: '🎓',
      title: 'Educational Deep Dive',
      query: 'Explain the fundamentals and advanced concepts of',
      placeholder: 'subject or skill'
    },
    {
      icon: '⚖️',
      title: 'Comparative Analysis',
      query: 'Compare and contrast the pros and cons of',
      placeholder: 'options to compare'
    }
  ];

  const quickFacts = [
    "Did you know? AI can now process images faster than the human eye can perceive them",
    "Fun fact: The average person makes about 35,000 decisions per day",
    "Research shows: Taking breaks every 90 minutes can boost productivity by 23%",
    "Interesting: The word 'serendipity' was coined by writer Horace Walpole in 1754"
  ];

  const [currentFact] = useState(quickFacts[Math.floor(Math.random() * quickFacts.length)]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Trending Topics */}
      <div>
        <h3 className="text-forest-700 font-semibold text-sm flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4" />
          Trending Now
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {getTrendingTopics().map((topic, index) => (
            <button
              key={index}
              onClick={() => onSuggestionSelect(topic)}
              className={cn(
                "p-3 text-left rounded-lg",
                "bg-gradient-to-r from-forest-50 to-forest-100",
                "border border-forest-200 hover:border-forest-300",
                "transition-all duration-200",
                "text-forest-700 text-sm",
                "shadow-sm hover:shadow-md"
              )}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Research Templates */}
      <div>
        <h3 className="text-forest-700 font-semibold text-sm flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4" />
          Research Templates
        </h3>
        <div className="space-y-2">
          {researchTemplates.map((template, index) => (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg",
                "bg-white/70 backdrop-blur-sm border border-forest-200",
                "hover:bg-white/90 hover:border-forest-300",
                "transition-all duration-200",
                "group"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{template.icon}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-forest-800 text-sm mb-1">
                    {template.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-forest-600">
                      "{template.query}{' '}
                      <span className="italic text-forest-500">
                        {template.placeholder}
                      </span>
                      "
                    </span>
                    <button
                      onClick={() => onSuggestionSelect(`${template.query} `)}
                      className="ml-auto p-1 rounded hover:bg-forest-100 text-forest-500 hover:text-forest-600"
                    >
                      <Search className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Fact */}
      <div className={cn(
        "p-4 rounded-lg",
        "bg-gradient-to-r from-forest-600 to-forest-700",
        "text-white"
      )}>
        <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4" />
          Today's Research Tip
        </h3>
        <p className="text-forest-100 text-sm">
          {currentFact}
        </p>
      </div>
    </div>
  );
}
