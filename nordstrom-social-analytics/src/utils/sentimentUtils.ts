import Sentiment from 'sentiment';
import { TikTokPost, InstagramPost, Brand } from '../types';

// Initialize the sentiment analyzer instance that will be used by analyzeTextSentiment
const sentimentAnalyzerForDetails = new Sentiment();

export interface DetailedSentimentAnalysis {
  score: number;
  // Using capitalized labels to match potential UI requirements, adjust if needed
  label: 'Positive' | 'Neutral' | 'Negative'; 
  positiveWords: string[];
  negativeWords: string[];
  // Comparative score might also be useful if the library provides it directly
  // comparative: number; 
}

export const analyzeTextSentiment = (text: string | null | undefined): DetailedSentimentAnalysis => {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return {
      score: 0,
      label: 'Neutral',
      positiveWords: [],
      negativeWords: [],
      // comparative: 0,
    };
  }
  // Use the dedicated analyzer instance
  const result = sentimentAnalyzerForDetails.analyze(text);
  
  // Normalize the score to -5 to +5 range
  // The sentiment library typically returns scores in a wider range
  // We'll use a sigmoid-like normalization and then scale to our desired range
  const normalizedScore = Math.max(-5, Math.min(5, result.score / 2));
  
  let label: 'Positive' | 'Neutral' | 'Negative';

  // Determine label based on normalized score
  if (normalizedScore > 0) {
    label = 'Positive';
  } else if (normalizedScore < 0) {
    label = 'Negative';
  } else {
    label = 'Neutral';
  }

  return {
    score: Number(normalizedScore.toFixed(2)), // Round to 2 decimal places
    label,
    positiveWords: result.positive || [], // Words that contributed to positive score
    negativeWords: result.negative || [], // Words that contributed to negative score
    // comparative: result.comparative, // The comparative score per word
  };
};

// Initialize sentiment analyzer
const sentiment = new Sentiment();

// Sentiment score ranges (using -5 to +5 scale)
export const SENTIMENT_THRESHOLDS = {
  POSITIVE: 1.5,  // Scores above this are positive
  NEGATIVE: -1.5, // Scores below this are negative
  // Between these thresholds is considered neutral
  MAX_SCALE: 5,   // Maximum value in our -5 to +5 scale
};

// Sentiment label type
export type SentimentLabel = 'positive' | 'neutral' | 'negative';

// Function to analyze text and return sentiment score and label
export const analyzeSentiment = (text: string): { score: number; label: SentimentLabel } => {
  if (!text) {
    return { score: 0, label: 'neutral' };
  }
  
  // Analyze text using sentiment library
  const result = sentiment.analyze(text);
  
  // Scale score to range between -5 and 5
  // The sentiment library typically returns scores in a smaller range
  // We'll scale it to our desired -5 to +5 range
  const scaleFactor = SENTIMENT_THRESHOLDS.MAX_SCALE;
  const scaledScore = Math.max(-scaleFactor, Math.min(scaleFactor, result.score * (scaleFactor / 5)));
  
  // Determine sentiment label based on score
  let label: SentimentLabel;
  if (scaledScore >= SENTIMENT_THRESHOLDS.POSITIVE) {
    label = 'positive';
  } else if (scaledScore <= SENTIMENT_THRESHOLDS.NEGATIVE) {
    label = 'negative';
  } else {
    label = 'neutral';
  }
  
  return {
    score: scaledScore,
    label
  };
};

// Function to get color for sentiment label
export const getSentimentColor = (label: SentimentLabel): string => {
  switch (label) {
    case 'positive':
      return '#4CAF50'; // Green
    case 'negative':
      return '#F44336'; // Red
    case 'neutral':
    default:
      return '#9E9E9E'; // Gray
  }
};

// Function to get sentiment distribution from posts
export const getSentimentDistribution = (
  posts: Array<any>
): { positive: number; neutral: number; negative: number } => {
  const distribution = {
    positive: 0,
    neutral: 0,
    negative: 0
  };
  
  if (!posts || !Array.isArray(posts)) {
    return distribution;
  }
  
  posts.forEach(post => {
    if (post.sentimentLabel) {
      const label = post.sentimentLabel as keyof typeof distribution;
      if (label === 'positive' || label === 'neutral' || label === 'negative') {
        distribution[label]++;
      }
    }
  });
  
  return distribution;
};

// Function to get average sentiment score by date
export const getAverageSentimentByDate = (
  posts: Array<any>
): Array<{ date: string; score: number }> => {
  if (!posts || !Array.isArray(posts)) {
    return [];
  }
  
  const scoresByDate: Record<string, { total: number; count: number }> = {};
  
  posts.forEach(post => {
    if (post.timestamp && typeof post.sentimentScore === 'number') {
      try {
        const date = new Date(post.timestamp);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        if (!scoresByDate[dateStr]) {
          scoresByDate[dateStr] = { total: 0, count: 0 };
        }
        
        scoresByDate[dateStr].total += post.sentimentScore;
        scoresByDate[dateStr].count++;
      } catch (e) {
        console.error('Error processing date for sentiment analysis:', e);
      }
    }
  });
  
  // Convert to array and calculate averages
  return Object.entries(scoresByDate)
    .map(([date, { total, count }]) => ({
      date,
      score: count > 0 ? total / count : 0
    }))
    .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date
};

// Function to get sentiment counts over time (for stacked area chart)
export const getSentimentOverTime = (
  posts: Array<any>
): Array<{ date: string; positive: number; neutral: number; negative: number }> => {
  if (!posts || !Array.isArray(posts)) {
    return [];
  }
  
  const countsByDate: Record<string, { positive: number; neutral: number; negative: number }> = {};
  
  posts.forEach(post => {
    if (post.timestamp && post.sentimentLabel && 
        (post.sentimentLabel === 'positive' || post.sentimentLabel === 'neutral' || post.sentimentLabel === 'negative')) {
      try {
        const date = new Date(post.timestamp);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        if (!countsByDate[dateStr]) {
          countsByDate[dateStr] = { positive: 0, neutral: 0, negative: 0 };
        }
        
        const label = post.sentimentLabel as keyof typeof countsByDate[typeof dateStr];
        countsByDate[dateStr][label]++;
      } catch (e) {
        console.error('Error processing date for sentiment analysis:', e);
      }
    }
  });
  
  // Convert to array
  return Object.entries(countsByDate)
    .map(([date, counts]) => ({
      date,
      ...counts
    }))
    .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date
};
