'use client';

import { useState, useEffect } from 'react';
import { Brain, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchResult } from '@/lib/types';

interface SmartSummaryProps {
  query: string;
  sources: SearchResult[];
  response: string;
  className?: string;
}

interface SummaryInsights {
  keyPoints: string[];
  confidence: 'high' | 'medium' | 'low';
  sourceQuality: 'high' | 'medium' | 'low';
  recency: 'recent' | 'moderate' | 'outdated';
  consensus: 'strong' | 'mixed' | 'weak';
}

export default function SmartSummary({
  query,
  sources,
  response,
  className
}: SmartSummaryProps) {
  const [insights, setInsights] = useState<SummaryInsights | null>(null);

  useEffect(() => {
    generateInsights();
  }, [query, sources, response]);

  const generateInsights = () => {
    // Analyze sources and response to generate insights
    const keyPoints = extractKeyPoints(response);
    const confidence = assessConfidence(sources, response);
    const sourceQuality = assessSourceQuality(sources);
    const recency = assessRecency(sources);
    const consensus = assessConsensus(sources, response);

    setInsights({
      keyPoints,
      confidence,
      sourceQuality,
      recency,
      consensus
    });
  };

  const extractKeyPoints = (text: string): string[] => {
    // Simple key point extraction - in production, use more sophisticated NLP
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).map(s => s.trim());
  };

  const assessConfidence = (sources: SearchResult[], response: string): 'high' | 'medium' | 'low' => {
    if (sources.length >= 5 && !response.toLowerCase().includes('may') && !response.toLowerCase().includes('might')) {
      return 'high';
    }
    if (sources.length >= 3) {
      return 'medium';
    }
    return 'low';
  };

  const assessSourceQuality = (sources: SearchResult[]): 'high' | 'medium' | 'low' => {
    const domains = sources.map(s => new URL(s.url).hostname.toLowerCase());
    const highQualityDomains = [
      'wikipedia.org', 'nature.com', 'science.org', 'pubmed.ncbi.nlm.nih.gov',
      'gov', 'edu', 'reuters.com', 'bbc.com', 'nytimes.com'
    ];
    
    const highQualityCount = domains.filter(domain => 
      highQualityDomains.some(hq => domain.includes(hq))
    ).length;
    
    const ratio = highQualityCount / sources.length;
    if (ratio >= 0.6) return 'high';
    if (ratio >= 0.3) return 'medium';
    return 'low';
  };

  const assessRecency = (sources: SearchResult[]): 'recent' | 'moderate' | 'outdated' => {
    // Simple heuristic - in production, would parse dates from sources
    const hasRecentKeywords = sources.some(s => 
      s.content.toLowerCase().includes('2024') || 
      s.content.toLowerCase().includes('2023') ||
      s.content.toLowerCase().includes('recent')
    );
    
    return hasRecentKeywords ? 'recent' : 'moderate';
  };

  const assessConsensus = (sources: SearchResult[], response: string): 'strong' | 'mixed' | 'weak' => {
    const hasConflictingWords = response.toLowerCase().includes('however') || 
                               response.toLowerCase().includes('but') ||
                               response.toLowerCase().includes('controversy');
    
    if (sources.length >= 4 && !hasConflictingWords) return 'strong';
    if (sources.length >= 2) return 'mixed';
    return 'weak';
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'high': return '🟢';
      case 'medium': return '🟡';
      case 'low': return '🔴';
      default: return '⚪';
    }
  };

  if (!insights) return null;

  return (
    <div className={cn(
      "bg-gradient-to-r from-forest-50 to-forest-100",
      "border border-forest-200 rounded-xl p-4 space-y-4",
      className
    )}>
      <h3 className="text-forest-700 font-semibold text-sm flex items-center gap-2">
        <Brain className="w-4 h-4" />
        Research Insights
      </h3>

      {/* Key Points */}
      <div className="space-y-2">
        <h4 className="text-forest-600 font-medium text-xs flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          Key Points
        </h4>
        <ul className="space-y-1">
          {insights.keyPoints.map((point, index) => (
            <li key={index} className="text-forest-700 text-xs flex items-start gap-2">
              <span className="text-forest-400 mt-1">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Quality Indicators */}
      <div className="grid grid-cols-2 gap-3">
        <div className={cn(
          "p-2 rounded-lg border text-center",
          getConfidenceColor(insights.confidence)
        )}>
          <div className="text-xs font-medium">Confidence</div>
          <div className="text-xs flex items-center justify-center gap-1">
            {getIcon(insights.confidence)} {insights.confidence}
          </div>
        </div>

        <div className={cn(
          "p-2 rounded-lg border text-center",
          getConfidenceColor(insights.sourceQuality)
        )}>
          <div className="text-xs font-medium">Source Quality</div>
          <div className="text-xs flex items-center justify-center gap-1">
            {getIcon(insights.sourceQuality)} {insights.sourceQuality}
          </div>
        </div>

        <div className={cn(
          "p-2 rounded-lg border text-center",
          getConfidenceColor(insights.recency)
        )}>
          <div className="text-xs font-medium">Recency</div>
          <div className="text-xs flex items-center justify-center gap-1">
            {getIcon(insights.recency)} {insights.recency}
          </div>
        </div>

        <div className={cn(
          "p-2 rounded-lg border text-center",
          getConfidenceColor(insights.consensus)
        )}>
          <div className="text-xs font-medium">Consensus</div>
          <div className="text-xs flex items-center justify-center gap-1">
            {getIcon(insights.consensus)} {insights.consensus}
          </div>
        </div>
      </div>

      {/* Reliability Note */}
      {insights.confidence === 'low' && (
        <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-700 text-xs">
            Limited sources available. Consider additional research for important decisions.
          </p>
        </div>
      )}
    </div>
  );
}
