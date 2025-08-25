'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowUpQuestionsProps {
  lastQuery: string;
  lastResponse: string;
  onQuestionSelect: (question: string) => void;
  className?: string;
}

export default function FollowUpQuestions({
  lastQuery,
  lastResponse,
  onQuestionSelect,
  className
}: FollowUpQuestionsProps) {
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);

  useEffect(() => {
    generateFollowUpQuestions();
  }, [lastQuery, lastResponse]);

  const generateFollowUpQuestions = () => {
    // Simple heuristic-based follow-up question generation
    // In a production app, you might use LLM to generate these
    const questions: string[] = [];
    
    // Question patterns based on common follow-up types
    const patterns = [
      `What are the implications of ${extractKeyTopic(lastQuery)}?`,
      `How does ${extractKeyTopic(lastQuery)} compare to alternatives?`,
      `What are the latest developments in ${extractKeyTopic(lastQuery)}?`,
      `What are the challenges with ${extractKeyTopic(lastQuery)}?`,
      `Can you provide more specific examples?`,
      `What do experts say about this topic?`
    ];

    // Add contextual questions based on response content
    if (lastResponse.toLowerCase().includes('benefit')) {
      questions.push('What are the potential drawbacks or risks?');
    }
    if (lastResponse.toLowerCase().includes('study') || lastResponse.toLowerCase().includes('research')) {
      questions.push('Are there any conflicting studies on this topic?');
    }
    if (lastResponse.toLowerCase().includes('future') || lastResponse.toLowerCase().includes('prediction')) {
      questions.push('What factors could change these predictions?');
    }

    // Select 3-4 most relevant questions
    const selectedQuestions = patterns.slice(0, 3).concat(questions.slice(0, 1));
    setFollowUpQuestions(selectedQuestions.filter(Boolean));
  };

  const extractKeyTopic = (query: string): string => {
    // Simple extraction - in production, use more sophisticated NLP
    const words = query.toLowerCase().split(' ');
    const stopWords = ['what', 'how', 'why', 'when', 'where', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but'];
    const contentWords = words.filter(word => !stopWords.includes(word) && word.length > 2);
    return contentWords.slice(0, 2).join(' ') || 'this topic';
  };

  if (followUpQuestions.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-forest-700 font-semibold text-sm flex items-center gap-2">
        <HelpCircle className="w-4 h-4" />
        Follow-up Questions
      </h3>
      
      <div className="space-y-2">
        {followUpQuestions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionSelect(question)}
            className={cn(
              "w-full p-3 text-left rounded-xl",
              "bg-gradient-to-r from-forest-50 to-forest-100",
              "border border-forest-200 hover:border-forest-300",
              "transition-all duration-200",
              "group cursor-pointer",
              "shadow-sm hover:shadow-md"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-forest-700 text-sm">
                {question}
              </span>
              <ArrowRight className="w-4 h-4 text-forest-500 group-hover:text-forest-600 group-hover:translate-x-1 transition-all duration-200" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
