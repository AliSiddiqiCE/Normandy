import { InstagramData, TikTokData, Brand, SentimentLabel } from '../types';
import Sentiment from 'sentiment';

// Sentiment score ranges (using -5 to +5 scale)
const SENTIMENT_THRESHOLDS = {
  POSITIVE: 1.5,  // Scores above this are positive
  NEGATIVE: -1.5, // Scores below this are negative
  // Between these thresholds is considered neutral
  MAX_SCALE: 5,   // Maximum value in our -5 to +5 scale
};

/**
 * Recalculates sentiment scores and labels for all posts across all brands
 * using a -5 to +5 scale instead of the default sentiment library scale
 */
export const recalculateAllSentiment = (
  instagramData: Record<Brand, InstagramData | null>,
  tiktokData: Record<Brand, TikTokData | null>,
): void => {
  // Initialize sentiment analyzer
  const sentimentAnalyzer = new Sentiment();
  
  // Process Instagram data
  Object.keys(instagramData).forEach(brandKey => {
    const brand = brandKey as Brand;
    const data = instagramData[brand];
    
    if (data && data.posts && Array.isArray(data.posts)) {
      data.posts.forEach(post => {
        if (post && post.caption) {
          // Analyze text using sentiment library
          const result = sentimentAnalyzer.analyze(post.caption);
          
          // Scale score to range between -5 and 5
          const scaledScore = Math.max(-SENTIMENT_THRESHOLDS.MAX_SCALE, 
            Math.min(SENTIMENT_THRESHOLDS.MAX_SCALE, result.score * (SENTIMENT_THRESHOLDS.MAX_SCALE / 5)));
          
          // Determine sentiment label based on scaled score
          let label: SentimentLabel;
          if (scaledScore >= SENTIMENT_THRESHOLDS.POSITIVE) {
            label = 'positive';
          } else if (scaledScore <= SENTIMENT_THRESHOLDS.NEGATIVE) {
            label = 'negative';
          } else {
            label = 'neutral';
          }
          
          // Update post with new sentiment data
          post.sentimentScore = scaledScore;
          post.sentimentLabel = label;
        }
      });
    }
  });
  
  // Process TikTok data
  Object.keys(tiktokData).forEach(brandKey => {
    const brand = brandKey as Brand;
    const data = tiktokData[brand];
    
    if (data && data.posts && Array.isArray(data.posts)) {
      data.posts.forEach(post => {
        if (post && post.text) {
          // Analyze text using sentiment library
          const result = sentimentAnalyzer.analyze(post.text);
          
          // Scale score to range between -5 and 5
          const scaledScore = Math.max(-SENTIMENT_THRESHOLDS.MAX_SCALE, 
            Math.min(SENTIMENT_THRESHOLDS.MAX_SCALE, result.score * (SENTIMENT_THRESHOLDS.MAX_SCALE / 5)));
          
          // Determine sentiment label based on scaled score
          let label: SentimentLabel;
          if (scaledScore >= SENTIMENT_THRESHOLDS.POSITIVE) {
            label = 'positive';
          } else if (scaledScore <= SENTIMENT_THRESHOLDS.NEGATIVE) {
            label = 'negative';
          } else {
            label = 'neutral';
          }
          
          // Update post with new sentiment data
          post.sentimentScore = scaledScore;
          post.sentimentLabel = label;
        }
      });
    }
  });
  
  console.log('Sentiment recalculation complete using -5 to +5 scale');
};
