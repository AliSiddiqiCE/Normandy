import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import * as BsIcons from 'react-icons/bs';
import * as BiIcons from 'react-icons/bi';
import InstagramEngagementCard from './InstagramEngagementCard';
import TikTokEngagementCard from './TikTokEngagementCard';
import * as MdIcons from 'react-icons/md';
import { useSocialData } from '../../context/SocialDataContext';
import { 
  formatNumber,
  generateInstagramEngagementChart,
  generateTikTokEngagementChart,
  generateInstagramEngagementTimeChart,
  generateTikTokEngagementRateChart,
  generateUnifiedHashtagChart,
  generateTikTokFollowersChart,
  generateEngagementRateChart
} from '../../utils/chartUtils';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import Sentiment from 'sentiment';
import SentimentAnalysis from './SentimentAnalysis';
import EngagementSection from './EngagementSection';
import HashtagSection from './HashtagSection';
import TikTokTopPostsSection from './TikTokTopPostsSection';
import InstagramTopPostsSection from './InstagramTopPostsSection';
import { Brand, InstagramPost, TikTokPost } from '../../types';
import { ToggleButton, ToggleButtonGroup, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  RadialLinearScale
} from 'chart.js';

// Initialize sentiment analyzer
const sentimentAnalyzer = new Sentiment();

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  RadialLinearScale
);

const DashboardOverview: React.FC = () => {
  // ...existing hooks
  const [activeTopPostsPlatform, setActiveTopPostsPlatform] = useState<'Instagram' | 'TikTok'>('Instagram');
  const { 
    socialData, 
    isLoading, 
    error, 
    selectedBrands, 
    getLocalFilterOptions, 
    setLocalFilterOptions,
    darkMode 
  } = useSocialData();
  
  // Get local filter options for this component
  const componentId = 'dashboard-overview';
  const filterOptions = getLocalFilterOptions(componentId);
  
  // Define state hooks at the top level of the component (before any conditionals)
  const [activeSentimentBrand, setActiveSentimentBrand] = useState<Brand>('Nordstrom');
  const [activeTab, setActiveTab] = useState<'overview' | 'sentiment'>('overview');
  
  // Initialize activePlatform from filterOptions.platform or default to 'Instagram'
  const [activePlatform, setActivePlatform] = useState<'Instagram' | 'TikTok'>(
    (filterOptions.platform as 'Instagram' | 'TikTok' || 'Instagram')
  );
  
  // Set default platform if not already set
  useEffect(() => {
    if (!filterOptions.platform) {
      setLocalFilterOptions(componentId, { platform: 'All' });
    }
  }, []);
  
  const [selectedCompetitor, setSelectedCompetitor] = useState<Brand>('Macys');
  const [selectedMonth, setSelectedMonth] = useState<string>('All (Feb-May)');
  
  // Update local filters when selections change
  useEffect(() => {
    setLocalFilterOptions(componentId, { 
      platform: activePlatform,
      selectedMonth: selectedMonth === 'All (Feb-May)' ? undefined : selectedMonth
    });
  }, [activePlatform, selectedMonth]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading dashboard data...</h2>
          <p className="text-gray-500 mt-2">Please wait while we load data from Excel files</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center bg-red-50 p-6 rounded-lg max-w-md">
          <BiIcons.BiErrorCircle className="text-red-500 text-5xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700">Error Loading Data</h2>
          <p className="text-gray-700 mt-2">{error.message || 'There was an error loading the dashboard data from Excel files'}</p>
          <p className="text-gray-500 mt-4 text-sm">Please check that all Excel files are correctly placed in the public/Data folder</p>
        </div>
      </div>
    );
  }
  // Define Word type for word cloud data
  interface Word {
    text: string;
    value: number;
  }

  // Card variants for animation
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
  };

  // Calculate total metrics
  const calculateTotalMetrics = () => {
    // Nordstrom metrics
    let totalInstagramLikes = 0;
    let totalInstagramComments = 0;
    let totalInstagramPosts = 0;
    let totalTikTokViews = 0;
    let totalTikTokLikes = 0;
    let totalTikTokShares = 0;
    let totalTikTokComments = 0;
    let totalTikTokPosts = 0;
    
    // Competitor metrics
    let competitorInstagramLikes = 0;
    let competitorInstagramComments = 0;
    let competitorInstagramPosts = 0;
    let competitorTikTokViews = 0;
    let competitorTikTokLikes = 0;
    let competitorTikTokShares = 0;
    let competitorTikTokComments = 0;
    let competitorTikTokPosts = 0;
    
    // Track engagement by month for trend analysis
    const monthlyEngagement: Record<string, { instagram: number, tiktok: number }> = {};
    
    // For calculating averages - Nordstrom
    let avgInstagramLikes = 0;
    let avgInstagramComments = 0;
    let instagramEngagementRate = 0;
    let avgTikTokViews = 0;
    let avgTikTokLikes = 0;
    let avgTikTokShares = 0;
    let avgTikTokComments = 0;
    let tikTokEngagementRate = 0;
    
    // For calculating averages - Competitor
    let competitorAvgInstagramLikes = 0;
    let competitorAvgInstagramComments = 0;
    let competitorInstagramEngagementRate = 0;
    let competitorAvgTikTokViews = 0;
    let competitorAvgTikTokLikes = 0;
    let competitorAvgTikTokShares = 0;
    let competitorAvgTikTokComments = 0;
    let competitorTikTokEngagementRate = 0;

    try {
      selectedBrands.forEach(brand => {
        // Instagram metrics
        const instagramData = socialData.instagram[brand];
        if (instagramData && instagramData.posts && Array.isArray(instagramData.posts)) {
          // Separate Nordstrom and competitor data
          if (brand === 'Nordstrom') {
            instagramData.posts.forEach(post => {
              if (post && post.timestamp) {
                const date = new Date(post.timestamp);
                const month = date.toLocaleString('default', { month: 'long' });
                const monthMatches = selectedMonth === 'All (Feb-May)' || month === selectedMonth;
                if (monthMatches) {
                  // Add basic metrics for Nordstrom
                  totalInstagramLikes += post.likesCount || 0;
                  totalInstagramComments += post.commentsCount || 0;
                  totalInstagramPosts++;
                }
                // Track monthly engagement (for trend analysis, always track)
                try {
                  if (!monthlyEngagement[month]) {
                    monthlyEngagement[month] = { instagram: 0, tiktok: 0 };
                  }
                  monthlyEngagement[month].instagram += (post.likesCount || 0) + (post.commentsCount || 0);
                } catch (e) {
                  console.error('Error processing Instagram post date:', e);
                }
              }
            });
          } else if (brand === selectedCompetitor) {
            // Add metrics for the selected competitor
            instagramData.posts.forEach(post => {
              if (post && post.timestamp) {
                const date = new Date(post.timestamp);
                const month = date.toLocaleString('default', { month: 'long' });
                const monthMatches = selectedMonth === 'All (Feb-May)' || month === selectedMonth;
                if (monthMatches) {
                  competitorInstagramLikes += post.likesCount || 0;
                  competitorInstagramComments += post.commentsCount || 0;
                  competitorInstagramPosts++;
                }
              }
            });
          }
        }

        // TikTok metrics
        const tiktokData = socialData.tiktok[brand];
        if (tiktokData && tiktokData.posts && Array.isArray(tiktokData.posts)) {
          // Separate Nordstrom and competitor data
          if (brand === 'Nordstrom') {
            tiktokData.posts.forEach(post => {
              if (post && post.createTime) {
                let date: Date;
                if (typeof post.createTime === 'string') {
                  date = new Date(post.createTime);
                } else if (typeof post.createTime === 'number') {
                  date = new Date(post.createTime * 1000);
                } else {
                  return;
                }
                const month = date.toLocaleString('default', { month: 'long' });
                const monthMatches = selectedMonth === 'All (Feb-May)' || month === selectedMonth;
                if (monthMatches) {
                  totalTikTokViews += post.playCount || 0;
                  totalTikTokLikes += post.diggCount || 0;
                  totalTikTokShares += post.shareCount || 0;
                  totalTikTokComments += post.commentCount || 0;
                  totalTikTokPosts++;
                }
                // Track monthly engagement (for trend analysis, always track)
                try {
                  if (!monthlyEngagement[month]) {
                    monthlyEngagement[month] = { instagram: 0, tiktok: 0 };
                  }
                  monthlyEngagement[month].tiktok += (post.diggCount || 0) + (post.commentCount || 0) + (post.shareCount || 0);
                } catch (e) {
                  console.error('Error processing TikTok post date:', e);
                }
              }
            });
          } else if (brand === selectedCompetitor) {
            // Add metrics for the selected competitor
            tiktokData.posts.forEach(post => {
              if (post && post.createTime) {
                let date: Date;
                if (typeof post.createTime === 'string') {
                  date = new Date(post.createTime);
                } else if (typeof post.createTime === 'number') {
                  date = new Date(post.createTime * 1000);
                } else {
                  return;
                }
                const month = date.toLocaleString('default', { month: 'long' });
                const monthMatches = selectedMonth === 'All (Feb-May)' || month === selectedMonth;
                if (monthMatches) {
                  competitorTikTokViews += post.playCount || 0;
                  competitorTikTokLikes += post.diggCount || 0;
                  competitorTikTokShares += post.shareCount || 0;
                  competitorTikTokComments += post.commentCount || 0;
                  competitorTikTokPosts++;
                }
              }
            });
          }
        }
      });
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }

    // Calculate averages and rates for Nordstrom
    // General averages for all Instagram posts
    if (totalInstagramPosts > 0) {
      avgInstagramLikes = totalInstagramLikes / totalInstagramPosts; // Remains average for all posts
      avgInstagramComments = parseFloat((totalInstagramComments / totalInstagramPosts).toFixed(1)); // Remains average for all posts
    } else {
      avgInstagramLikes = 0;
      avgInstagramComments = 0.0;
    }

    // Instagram Video Engagement Rate for Nordstrom
    const nordstromInstagramVideoPosts = socialData.instagram['Nordstrom']?.posts.filter(p => (p as InstagramPost).mediaType === 'Video') as InstagramPost[] || [];
    let nordstromVideoLikes = 0;
    let nordstromVideoComments = 0;
    let nordstromVideoViews = 0;
    if (nordstromInstagramVideoPosts.length > 0) {
      nordstromVideoLikes = nordstromInstagramVideoPosts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
      nordstromVideoComments = nordstromInstagramVideoPosts.reduce((sum, p) => sum + (p.commentsCount || 0), 0);
      nordstromVideoViews = nordstromInstagramVideoPosts.reduce((sum, p) => sum + (p.videoViewCount || 0), 0);
    }
    const rawNordstromVideoER = nordstromVideoViews > 0 ? ((nordstromVideoLikes + nordstromVideoComments) / nordstromVideoViews) * 100 : 0;
    instagramEngagementRate = parseFloat(rawNordstromVideoER.toFixed(1));
    
    if (totalTikTokPosts > 0) {
      avgTikTokViews = totalTikTokPosts > 0 ? totalTikTokViews / totalTikTokPosts : 0;
      avgTikTokLikes = totalTikTokPosts > 0 ? totalTikTokLikes / totalTikTokPosts : 0;
      avgTikTokShares = totalTikTokPosts > 0 ? totalTikTokShares / totalTikTokPosts : 0;
      avgTikTokComments = totalTikTokPosts > 0 ? totalTikTokComments / totalTikTokPosts : 0;
      tikTokEngagementRate = totalTikTokPosts > 0 && totalTikTokViews > 0 ? ((totalTikTokLikes + totalTikTokComments + totalTikTokShares) / totalTikTokViews) * 100 : 0;
    }
    
    // Calculate averages and rates for competitor
    // General averages for all Instagram posts for competitor
    if (competitorInstagramPosts > 0) {
      competitorAvgInstagramLikes = competitorInstagramLikes / competitorInstagramPosts; // Remains average for all posts
      competitorAvgInstagramComments = parseFloat((competitorInstagramComments / competitorInstagramPosts).toFixed(1)); // Remains average for all posts
    } else {
      competitorAvgInstagramLikes = 0;
      competitorAvgInstagramComments = 0.0;
    }

    // Instagram Video Engagement Rate for Competitor
    const competitorInstagramVideoPosts = socialData.instagram[selectedCompetitor]?.posts.filter(p => (p as InstagramPost).mediaType === 'Video') as InstagramPost[] || [];
    let competitorVideoLikes = 0;
    let competitorVideoComments = 0;
    let competitorVideoViews = 0;
    if (competitorInstagramVideoPosts.length > 0) {
      competitorVideoLikes = competitorInstagramVideoPosts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
      competitorVideoComments = competitorInstagramVideoPosts.reduce((sum, p) => sum + (p.commentsCount || 0), 0);
      competitorVideoViews = competitorInstagramVideoPosts.reduce((sum, p) => sum + (p.videoViewCount || 0), 0);
    }
    const rawCompetitorVideoER = competitorVideoViews > 0 ? ((competitorVideoLikes + competitorVideoComments) / competitorVideoViews) * 100 : 0;
    competitorInstagramEngagementRate = parseFloat(rawCompetitorVideoER.toFixed(1));
    
    if (competitorTikTokPosts > 0) {
      competitorAvgTikTokViews = competitorTikTokPosts > 0 ? competitorTikTokViews / competitorTikTokPosts : 0;
      competitorAvgTikTokLikes = competitorTikTokPosts > 0 ? competitorTikTokLikes / competitorTikTokPosts : 0;
      competitorAvgTikTokShares = competitorTikTokPosts > 0 ? competitorTikTokShares / competitorTikTokPosts : 0;
      competitorAvgTikTokComments = competitorTikTokPosts > 0 ? competitorTikTokComments / competitorTikTokPosts : 0;
      competitorTikTokEngagementRate = competitorTikTokPosts > 0 && competitorTikTokViews > 0 ? ((competitorTikTokLikes + competitorTikTokComments + competitorTikTokShares) / competitorTikTokViews) * 100 : 0;
    }
    
    return {
      // Nordstrom metrics
      totalInstagramLikes,
      totalInstagramComments,
      totalInstagramPosts,
      totalTikTokViews,
      totalTikTokLikes,
      totalTikTokShares,
      totalTikTokComments,
      totalTikTokPosts,
      avgInstagramLikes,
      avgInstagramComments,
      instagramEngagementRate,
      avgTikTokViews,
      avgTikTokLikes,
      avgTikTokShares,
      avgTikTokComments,
      tikTokEngagementRate,
      
      // Competitor metrics
      competitorInstagramLikes,
      competitorInstagramComments,
      competitorInstagramPosts,
      competitorTikTokViews,
      competitorTikTokLikes,
      competitorTikTokShares,
      competitorTikTokComments,
      competitorTikTokPosts,
      competitorAvgInstagramLikes,
      competitorAvgInstagramComments,
      competitorInstagramEngagementRate,
      competitorAvgTikTokViews,
      competitorAvgTikTokLikes,
      competitorAvgTikTokShares,
      competitorAvgTikTokComments,
      competitorTikTokEngagementRate,
      
      // Other metrics
      monthlyEngagement,
      selectedCompetitor,
      
      // Calculate which platform has better engagement
      bestPlatform: totalInstagramPosts && totalTikTokPosts ? 
        instagramEngagementRate > tikTokEngagementRate ? 'Instagram' : 'TikTok' : 'Unknown',
    };
  };

  const metrics = calculateTotalMetrics();



  // Prepare chart data
  const instagramEngagementChart = generateInstagramEngagementChart(socialData.instagram, selectedBrands);
  const tiktokEngagementChart = generateTikTokEngagementChart(socialData.tiktok, selectedBrands);
  
  // Function to check if chart data is empty
  const isChartDataEmpty = (chartData: any) => {
    if (!chartData || !chartData.datasets || chartData.datasets.length === 0) return true;
    
    // Check if all datasets have empty or zero data
    return chartData.datasets.every((dataset: any) => {
      if (!dataset.data || dataset.data.length === 0) return true;
      return dataset.data.every((value: any) => value === 0 || value === null || value === undefined);
    });
  };
  
  // Fallback UI component for empty charts
  const EmptyChartFallback = ({ message = 'No data available for the selected brands' }: { message?: string }) => (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
      <BiIcons.BiBarChartAlt2 className="text-gray-400 text-5xl mb-3" />
      <p className="text-gray-500 text-center px-4">{message}</p>
      <p className="text-gray-400 text-sm mt-2">Try selecting different brands or check that Excel files exist</p>
    </div>
  );
  
  // Prepare engagement rate chart data based on active platform
  const engagementRateChart = generateEngagementRateChart(
    socialData.instagram, 
    socialData.tiktok, 
    selectedBrands,
    activePlatform,
    filterOptions.selectedMonth
  );

  // Function to calculate sentiment scores for brand posts
  const calculateSentiment = (brand: Brand) => {
    try {
      const instagramData = socialData.instagram[brand];
      const tiktokData = socialData.tiktok[brand];
      
      let totalScore = 0;
      let totalPosts = 0;
      let positiveCount = 0;
      let negativeCount = 0;
      let neutralCount = 0;
      let topPositivePost = { text: '', score: 0, platform: '' };
      let topNegativePost = { text: '', score: 0, platform: '' };
      
      // Track sentiment by month for trend analysis
      const monthlySentiment: Record<string, { score: number, count: number }> = {};
      
      // Calculate Instagram sentiment
      if (instagramData && instagramData.posts && Array.isArray(instagramData.posts)) {
        instagramData.posts.forEach(post => {
          if (post && post.caption) {
            const result = sentimentAnalyzer.analyze(post.caption);
            totalScore += result.score;
            totalPosts++;
            
            // Count sentiment categories
            if (result.score > 0) positiveCount++;
            else if (result.score < 0) negativeCount++;
            else neutralCount++;
            
            // Track top posts
            if (result.score > topPositivePost.score) {
              topPositivePost = { text: post.caption, score: result.score, platform: 'Instagram' };
            }
            if (result.score < topNegativePost.score) {
              topNegativePost = { text: post.caption, score: result.score, platform: 'Instagram' };
            }
            
            // Track monthly sentiment
            if (post.timestamp) {
              try {
                const date = new Date(post.timestamp);
                const month = date.toLocaleString('default', { month: 'long' });
                
                if (!monthlySentiment[month]) {
                  monthlySentiment[month] = { score: 0, count: 0 };
                }
                
                monthlySentiment[month].score += result.score;
                monthlySentiment[month].count++;
              } catch (e) {
                console.error('Error processing Instagram post date for sentiment:', e);
              }
            }
          }
        });
      }
      
      // Calculate TikTok sentiment
      if (tiktokData && tiktokData.posts && Array.isArray(tiktokData.posts)) {
        tiktokData.posts.forEach(post => {
          if (post && post.text) {
            const result = sentimentAnalyzer.analyze(post.text);
            totalScore += result.score;
            totalPosts++;
            
            // Count sentiment categories
            if (result.score > 0) positiveCount++;
            else if (result.score < 0) negativeCount++;
            else neutralCount++;
            
            // Track top posts
            if (result.score > topPositivePost.score) {
              topPositivePost = { text: post.text, score: result.score, platform: 'TikTok' };
            }
            if (result.score < topNegativePost.score) {
              topNegativePost = { text: post.text, score: result.score, platform: 'TikTok' };
            }
            
            // Track monthly sentiment
            if (post.createTime) {
              try {
                let date: Date;
                if (!isNaN(parseFloat(post.createTime))) {
                  date = new Date(parseFloat(post.createTime) * 1000);
                } else {
                  date = new Date(post.createTime);
                }
                
                if (!isNaN(date.getTime())) {
                  const month = date.toLocaleString('default', { month: 'long' });
                  
                  if (!monthlySentiment[month]) {
                    monthlySentiment[month] = { score: 0, count: 0 };
                  }
                  
                  monthlySentiment[month].score += result.score;
                  monthlySentiment[month].count++;
                }
              } catch (e) {
                console.error('Error processing TikTok post date for sentiment:', e);
              }
            }
          }
        });
      }
      
      // Calculate average sentiment by month
      const monthlyAverageSentiment: Record<string, number> = {};
      Object.keys(monthlySentiment).forEach(month => {
        const { score, count } = monthlySentiment[month];
        monthlyAverageSentiment[month] = count > 0 ? score / count : 0;
      });
      
      // Determine sentiment trend (improving, declining, stable)
      const months = Object.keys(monthlyAverageSentiment).sort((a, b) => {
        const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return monthOrder.indexOf(a) - monthOrder.indexOf(b);
      });
      
      let trend = 'stable';
      if (months.length >= 2) {
        const firstMonth = months[0];
        const lastMonth = months[months.length - 1];
        const difference = monthlyAverageSentiment[lastMonth] - monthlyAverageSentiment[firstMonth];
        
        if (difference > 1) trend = 'improving';
        else if (difference < -1) trend = 'declining';
      }
      
      const averageSentiment = totalPosts > 0 ? totalScore / totalPosts : 0;
      
      return totalPosts > 0 ? {
        average: averageSentiment,
        status: averageSentiment > 0 ? 'Positive' : averageSentiment < 0 ? 'Negative' : 'Neutral',
        positiveCount,
        negativeCount,
        neutralCount,
        topPositivePost: topPositivePost.score > 0 ? topPositivePost : null,
        topNegativePost: topNegativePost.score < 0 ? topNegativePost : null,
        monthlySentiment: monthlyAverageSentiment,
        trend,
        totalPosts
      } : { 
        average: 0, 
        status: 'Neutral', 
        positiveCount: 0, 
        negativeCount: 0, 
        neutralCount: 0,
        topPositivePost: null,
        topNegativePost: null,
        monthlySentiment: {},
        trend: 'stable',
        totalPosts: 0
      };
    } catch (error) {
      console.error('Error calculating sentiment:', error);
      return { 
        average: 0, 
        status: 'Neutral', 
        positiveCount: 0, 
        negativeCount: 0, 
        neutralCount: 0,
        topPositivePost: null,
        topNegativePost: null,
        monthlySentiment: {},
        trend: 'stable',
        totalPosts: 0
      };
    }
  };

  // Function to analyze brand hashtags
  const analyzeHashtags = (brand: Brand) => {
    const instagramData = socialData.instagram[brand];
    const tiktokData = socialData.tiktok[brand];
    
    const hashtagCounts: Record<string, number> = {};
    
    // Process Instagram hashtags
    if (instagramData && instagramData.posts.length) {
      instagramData.posts.forEach(post => {
        if (post.hashtags && post.hashtags.length) {
          post.hashtags.forEach(tag => {
            if (tag) {
              hashtagCounts[tag.toLowerCase()] = (hashtagCounts[tag.toLowerCase()] || 0) + 1;
            }
          });
        }
      });
    }
    
    // Process TikTok hashtags
    if (tiktokData && tiktokData.posts.length) {
      tiktokData.posts.forEach(post => {
        if (post.hashtags && post.hashtags.length) {
          post.hashtags.forEach(tag => {
            if (tag.name) {
              hashtagCounts[tag.name.toLowerCase()] = (hashtagCounts[tag.name.toLowerCase()] || 0) + 1;
            }
          });
        }
      });
    }
    
    // Sort hashtags by count
    return Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Return top 10 hashtags
  };

  // Engagement rate chart data is now generated above

  // Function to generate hashtag chart data (not using useMemo directly)
  const generateHashtagChartData = () => {
    // Always return a valid chart data object, even if data is missing
    return (!socialData || !selectedBrands) 
      ? { labels: [], datasets: [] }
      : generateUnifiedHashtagChart(
          socialData.instagram || {},
          socialData.tiktok || {},
          selectedBrands,
          activePlatform
        );
  };
  
  // Generate unified hashtag chart data
  const unifiedHashtagChartData = generateHashtagChartData();

  // Format chart options with dark mode support
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? 'rgba(255, 255, 255, 0.85)' : '#191919', // nordstrom-black for light
          font: {
            size: 12,
            family: 'Inter',
          }
        },
      },
      title: {
        display: false, // Keep title display off by default, can be overridden per chart
      },
      tooltip: {
        backgroundColor: darkMode ? '#051424' : '#FFFFFF', // nordstrom-navy-dark for dark, white for light
        titleColor: darkMode ? 'rgba(255, 255, 255, 0.9)' : '#191919',
        bodyColor: darkMode ? 'rgba(255, 255, 255, 0.8)' : '#191919',
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
        titleFont: {
          family: 'Inter',
        },
        bodyFont: {
          family: 'Inter',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(55, 65, 81, 0.9)', // gray-700 for light
          font: {
            family: 'Inter',
          },
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          drawBorder: false,
        },
        title: { // Added for completeness, though not displayed by default
          font: {
            family: 'Inter',
          }
        }
      },
      y: {
        ticks: {
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(55, 65, 81, 0.9)', // gray-700 for light
          font: {
            family: 'Inter',
          },
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          drawBorder: false,
        },
        title: { // Added for completeness
          font: {
            family: 'Inter',
          }
        }
      },
    },
    elements: {
      bar: {
        borderRadius: 6,
      },
      line: {
        tension: 0.4,
      },
    },
    // animation: { duration: 1000, easing: 'easeInOutQuart' } // Default animations are usually good
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900' : 'bg-red-100'} text-center`}>
          <h3 className="text-xl font-bold mb-2">Error Loading Data</h3>
          <p>{'message' in (error as any) ? String((error as any).message) : 'Failed to load data'}</p>
          <button
            className={`mt-4 px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Platform selection toggle
  const handlePlatformChange = (event: React.MouseEvent<HTMLElement>, newPlatform: 'Instagram' | 'TikTok') => {
    if (newPlatform !== null) {
      setActivePlatform(newPlatform);
      // Update local filter options
      setLocalFilterOptions(componentId, { platform: newPlatform });
    }
  };

  // Error handling in render method
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900' : 'bg-red-100'} text-center`}>
          <h3 className="text-xl font-bold mb-2">Error Loading Data</h3>
          <p>{'message' in (error as any) ? String((error as any).message) : 'Failed to load data'}</p>
          <button
            className={`mt-4 px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="dashboard-content-to-export" className="space-y-4">
          {/* KPI Cards Section */}
          <div className="mt-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg p-6`} /* Updated styling */
            >
              <div className="flex justify-between items-center mb-4"> {/* mb-4 can be adjusted if p-6 provides enough space */}
                <h2 className="text-xl font-semibold text-nordstrom-blue"> {/* Updated styling */}
                  <BiIcons.BiStats className="inline-block mr-2 text-nordstrom-blue" /> {/* Updated styling */}
                  Key Performance Indicators
                </h2>
                         <div className="flex gap-3">
              {/* Platform Selector */}
              

              {/* Month Selector */}
              <FormControl variant="outlined" size="small" className="min-w-[150px]" sx={{
                '& .MuiInputLabel-root': {
                  color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined
                },
                '& .MuiOutlinedInput-root': {
                  color: darkMode ? 'white' : undefined,
                  '& fieldset': {
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.23)' : undefined
                  },
                  '&:hover fieldset': {
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.5)' : undefined
                  }
                },
                '& .MuiSelect-icon': {
                  color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined
                }
              }}>
                <InputLabel>Date</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value as string)}
                  label="Date"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: darkMode ? 'rgb(45, 45, 45)' : undefined,
                        color: darkMode ? 'white' : undefined,
                        '& .MuiMenuItem-root:hover': {
                          bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="All (Feb-May)">All Months</MenuItem>
                  <MenuItem value="February">February</MenuItem>
                  <MenuItem value="March">March</MenuItem>
                  <MenuItem value="April">April</MenuItem>
                  <MenuItem value="May">May</MenuItem>
                </Select>
              </FormControl>

              {/* Competitor Selector */}
              <FormControl variant="outlined" size="small" className="min-w-[150px]" sx={{
                '& .MuiInputLabel-root': {
                  color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined
                },
                '& .MuiOutlinedInput-root': {
                  color: darkMode ? 'white' : undefined,
                  '& fieldset': {
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.23)' : undefined
                  },
                  '&:hover fieldset': {
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.5)' : undefined
                  }
                },
                '& .MuiSelect-icon': {
                  color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined
                }
              }}>
                <InputLabel>Brand</InputLabel>
                <Select
                  value={selectedCompetitor}
                  onChange={(e) => setSelectedCompetitor(e.target.value as Brand)}
                  label="Brand"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: darkMode ? 'rgb(45, 45, 45)' : undefined,
                        color: darkMode ? 'white' : undefined,
                        '& .MuiMenuItem-root:hover': {
                          bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined
                        }
                      }
                    }
                  }}
                >
                  {selectedBrands.filter(brand => brand !== 'Nordstrom').map((brand) => (
                    <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <ToggleButtonGroup
  value={activePlatform}
  exclusive
  onChange={(_, newPlatform) => {
    if (newPlatform) setActivePlatform(newPlatform);
  }}
  size="small"
  aria-label="Platform"
  sx={{
    backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    borderRadius: 2,
    '& .MuiToggleButton-root': {
      color: darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(55,65,81,1)',
      fontWeight: 600,
      fontSize: '0.95rem',
      px: 2.5,
      py: 1,
      '&.Mui-selected': {
        backgroundColor: darkMode ? 'rgba(0, 120, 212, 0.3)' : 'rgba(0, 120, 212, 0.12)',
        color: darkMode ? '#fff' : '#00539b',
      },
    },
  }}
>
  <ToggleButton value="Instagram" aria-label="Instagram">Instagram</ToggleButton>
  <ToggleButton value="TikTok" aria-label="TikTok">TikTok</ToggleButton>
</ToggleButtonGroup>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Instagram KPIs */}
            {(filterOptions.platform === 'Instagram' || filterOptions.platform === 'All') && (
              <>
                {/* Total Posts */}
                <motion.div
                  custom={0}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Posts</p>
                      <h3 className="text-3xl font-bold text-nordstrom-blue mt-1">{formatNumber(metrics.totalInstagramPosts)}</h3>
                    </div>
                    <FaIcons.FaInstagram className="text-3xl text-nordstrom-blue/70 dark:text-nordstrom-blue/60" />
                  </div>
                  
                  {/* Posts Comparison Chart */}
                  <div className="mt-4 h-64 w-full flex items-center justify-center">
                    <Bar
                      data={{
                        labels: ['Nordstrom', metrics.selectedCompetitor],
                        datasets: [{
                          label: 'Posts',
                          data: [metrics.totalInstagramPosts, metrics.competitorInstagramPosts],
                          backgroundColor: [
                            'rgba(255, 140, 0, 0.85)',
                            'rgba(156, 163, 175, 0.7)'
                          ]
                        }]
                      }}
                      options={{
                        plugins: { legend: { display: false } },
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: { ticks: { color: darkMode ? 'white' : 'black' } },
                          y: { beginAtZero: true, ticks: { color: darkMode ? 'white' : 'black' } }
                        }
                      }}
                      height={180}
                    />
                  </div>
                </motion.div>
                
                {/* Total Likes */}
                <motion.div
                  custom={1}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Likes</p>
                      <h3 className="text-3xl font-bold text-nordstrom-blue mt-1">{formatNumber(metrics.totalInstagramLikes)}</h3>
                    </div>
                    <AiIcons.AiFillHeart className="text-3xl text-nordstrom-blue/70 dark:text-nordstrom-blue/60" />
                  </div>
                  
                  {/* Likes Comparison Chart */}
                  <div className="mt-4 h-64 w-full flex items-center justify-center">
                    <Bar
                      data={{
                        labels: ['Nordstrom', metrics.selectedCompetitor],
                        datasets: [{
                          label: 'Likes',
                          data: [metrics.totalInstagramLikes, metrics.competitorInstagramLikes],
                          backgroundColor: [
                            'rgba(255, 140, 0, 0.85)',
                            'rgba(156, 163, 175, 0.7)'
                          ]
                        }]
                      }}
                      options={{
                        plugins: { legend: { display: false } },
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: { ticks: { color: darkMode ? 'white' : 'black' } },
                          y: { beginAtZero: true, ticks: { color: darkMode ? 'white' : 'black' } }
                        }
                      }}
                      height={180}
                    />
                  </div>
                </motion.div>
                
                {/* Total Comments */}
                <motion.div
                  custom={2}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Comments</p>
                      <h3 className="text-3xl font-bold text-nordstrom-blue mt-1">{formatNumber(metrics.totalInstagramComments)}</h3>
                    </div>
                    <FaIcons.FaComments className="text-3xl text-nordstrom-blue/70 dark:text-nordstrom-blue/60" />
                  </div>
                  
                  {/* Comments Comparison Chart */}
                  <div className="mt-4 h-64 w-full flex items-center justify-center">
                    <Bar
                      data={{
                        labels: ['Nordstrom', metrics.selectedCompetitor],
                        datasets: [{
                          label: 'Comments',
                          data: [metrics.totalInstagramComments, metrics.competitorInstagramComments],
                          backgroundColor: [
                            'rgba(255, 140, 0, 0.85)',
                            'rgba(156, 163, 175, 0.7)'
                          ]
                        }]
                      }}
                      options={{
                        plugins: { legend: { display: false } },
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: { ticks: { color: darkMode ? 'white' : 'black' } },
                          y: { beginAtZero: true, ticks: { color: darkMode ? 'white' : 'black' } }
                        }
                      }}
                      height={180}
                    />
                  </div>
                </motion.div>
                
                {/* Engagement Rate */}
                <motion.div
                  custom={3}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Engagement Rate</p>
                      <h3 className="text-3xl font-bold text-nordstrom-blue mt-1">{metrics.instagramEngagementRate?.toFixed(2)}%</h3>
                    </div>
                    <AiIcons.AiOutlineInteraction className="text-3xl text-nordstrom-blue/70 dark:text-nordstrom-blue/60" />
                  </div>
                  
                  {/* Engagement Rate Comparison Chart */}
                  <div className="mt-4 h-64 w-full flex items-center justify-center">
                    <Bar
                      data={{
                        labels: ['Nordstrom', metrics.selectedCompetitor],
                        datasets: [{
                          label: 'Engagement Rate',
                          data: [metrics.instagramEngagementRate, metrics.competitorInstagramEngagementRate],
                          backgroundColor: [
                            'rgba(255, 140, 0, 0.85)',
                            'rgba(156, 163, 175, 0.7)'
                          ]
                        }]
                      }}
                      options={{
                        plugins: { legend: { display: false } },
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: { ticks: { color: darkMode ? 'white' : 'black' } },
                          y: { beginAtZero: true, ticks: { color: darkMode ? 'white' : 'black' } }
                        }
                      }}
                      height={180}
                    />
                  </div>
                </motion.div>
                <motion.div
                  custom={3}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 col-span-1 md:col-span-4"
                >
                  {filterOptions.platform === 'Instagram' && (
                  <EngagementSection 
                    platform="Instagram" 
                    selectedBrands={selectedBrands} 
                    posts={selectedBrands.reduce((acc, brand) => {
                      acc[brand] = socialData.instagram[brand]?.posts || [];
                      return acc;
                    }, {} as Record<Brand, InstagramPost[] | TikTokPost[]>)}
                  />
                )}
                </motion.div>
              
              </>
            )}



            {/* TikTok KPIs */}
            {(filterOptions.platform === 'TikTok' || filterOptions.platform === 'All') && (
              <>
                {/* Total Posts */}
                <motion.div
                  custom={4}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Posts</p>
                      <h3 className="text-3xl font-bold text-nordstrom-blue mt-1">{formatNumber(metrics.totalTikTokPosts)}</h3>
                    </div>
                    <FaIcons.FaTiktok className="text-3xl text-nordstrom-blue/70 dark:text-nordstrom-blue/60" />
                  </div>
                  
                  {/* Posts Comparison Chart */}
                  <div className="mt-4 h-64 w-full flex items-center justify-center">
                    <Bar
                      data={{
                        labels: ['Nordstrom', metrics.selectedCompetitor],
                        datasets: [{
                          label: 'Posts',
                          data: [metrics.totalTikTokPosts, metrics.competitorTikTokPosts],
                          backgroundColor: [
                            'rgba(255, 140, 0, 0.85)',
                            'rgba(156, 163, 175, 0.7)'
                          ]
                        }]
                      }}
                      options={{
                        plugins: { legend: { display: false } },
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: { ticks: { color: darkMode ? 'white' : 'black' } },
                          y: { beginAtZero: true, ticks: { color: darkMode ? 'white' : 'black' } }
                        }
                      }}
                      height={180}
                    />
                  </div>
                </motion.div>
                
                {/* Total Likes */}
                <motion.div
                  custom={5}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Likes</p>
                      <h3 className="text-3xl font-bold text-nordstrom-blue mt-1">{formatNumber(metrics.totalTikTokLikes)}</h3>
                    </div>
                    <AiIcons.AiFillHeart className="text-3xl text-nordstrom-blue/70 dark:text-nordstrom-blue/60" />
                  </div>
                  
                  {/* Likes Comparison Chart */}
                  <div className="mt-4 h-64 w-full flex items-center justify-center">
                    <Bar
                      data={{
                        labels: ['Nordstrom', metrics.selectedCompetitor],
                        datasets: [{
                          label: 'Likes',
                          data: [metrics.totalTikTokLikes, metrics.competitorTikTokLikes],
                          backgroundColor: [
                            'rgba(255, 140, 0, 0.85)',
                            'rgba(156, 163, 175, 0.7)'
                          ]
                        }]
                      }}
                      options={{
                        plugins: { legend: { display: false } },
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: { ticks: { color: darkMode ? 'white' : 'black' } },
                          y: { beginAtZero: true, ticks: { color: darkMode ? 'white' : 'black' } }
                        }
                      }}
                      height={180}
                    />
                  </div>
                </motion.div>

                {/* Total Comments */}
                <motion.div
                  custom={6}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Comments</p>
                      <h3 className="text-3xl font-bold text-nordstrom-blue mt-1">{formatNumber(metrics.totalTikTokComments)}</h3>
                    </div>
                    <FaIcons.FaComments className="text-3xl text-nordstrom-blue/70 dark:text-nordstrom-blue/60" />
                  </div>
                  
                  {/* Comments Comparison Chart */}
                  <div className="mt-4 h-64 w-full flex items-center justify-center">
                    <Bar
                      data={{
                        labels: ['Nordstrom', metrics.selectedCompetitor],
                        datasets: [{
                          label: 'Comments',
                          data: [metrics.totalTikTokComments, metrics.competitorTikTokComments],
                          backgroundColor: [
                            'rgba(255, 140, 0, 0.85)',
                            'rgba(156, 163, 175, 0.7)'
                          ]
                        }]
                      }}
                      options={{
                        plugins: { legend: { display: false } },
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: { ticks: { color: darkMode ? 'white' : 'black' } },
                          y: { beginAtZero: true, ticks: { color: darkMode ? 'white' : 'black' } }
                        }
                      }}
                      height={180}
                    />
                  </div>
                </motion.div>
                
                {/* Total Shares */}
                <motion.div
                  custom={6}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Shares</p>
                      <h3 className="text-3xl font-bold text-nordstrom-blue mt-1">{formatNumber(metrics.totalTikTokShares)}</h3>
                    </div>
                    <FaIcons.FaShareSquare className="text-3xl text-nordstrom-blue/70 dark:text-nordstrom-blue/60" />
                  </div>
                  
                  {/* Shares Comparison Chart */}
                  <div className="mt-4 h-64 w-full flex items-center justify-center">
                    <Bar
                      data={{
                        labels: ['Nordstrom', metrics.selectedCompetitor],
                        datasets: [{
                          label: 'Shares',
                          data: [metrics.totalTikTokShares, metrics.competitorTikTokShares],
                          backgroundColor: [
                            'rgba(255, 140, 0, 0.85)',
                            'rgba(156, 163, 175, 0.7)'
                          ]
                        }]
                      }}
                      options={{
                        plugins: { legend: { display: false } },
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: { ticks: { color: darkMode ? 'white' : 'black' } },
                          y: { beginAtZero: true, ticks: { color: darkMode ? 'white' : 'black' } }
                        }
                      }}
                      height={180}
                    />
                  </div>
                </motion.div>
                
                {/* Engagement Rate */}
                <motion.div
                  custom={7}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Engagement Rate</p>
                      <h3 className="text-3xl font-bold text-nordstrom-blue mt-1">{metrics.tikTokEngagementRate?.toFixed(2)}%</h3>
                    </div>
                    <AiIcons.AiOutlineInteraction className="text-3xl text-nordstrom-blue/70 dark:text-nordstrom-blue/60" />
                  </div>
                  
                  {/* Engagement Rate Comparison Chart */}
                  <div className="mt-4 h-64 w-full flex items-center justify-center">
                    <Bar
                      data={{
                        labels: ['Nordstrom', metrics.selectedCompetitor],
                        datasets: [{
                          label: 'Engagement Rate',
                          data: [metrics.tikTokEngagementRate, metrics.competitorTikTokEngagementRate],
                          backgroundColor: [
                            'rgba(255, 140, 0, 0.85)',
                            'rgba(156, 163, 175, 0.7)'
                          ]
                        }]
                      }}
                      options={{
                        plugins: { legend: { display: false } },
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: { ticks: { color: darkMode ? 'white' : 'black' } },
                          y: { beginAtZero: true, ticks: { color: darkMode ? 'white' : 'black' } }
                        }
                      }}
                      height={180}
                    />
                  </div>
                </motion.div>
                 {/* Engagement Rate */}
                 <motion.div
                  custom={7}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 col-span-1 md:col-span-2"
                >
                  
                  
                  {/* TikTok Engagement Analytics */}
          {filterOptions.platform === 'TikTok' && (
            <EngagementSection 
              platform="TikTok" 
              selectedBrands={selectedBrands} 
              posts={selectedBrands.reduce((acc, brand) => {
                acc[brand] = socialData.tiktok[brand]?.posts || [];
                return acc;
              }, {} as Record<Brand, InstagramPost[] | TikTokPost[]>)}
            />
          )}
                </motion.div>
                
              </>
            )}
          </div>
        </motion.div>
      </div>

     
      
      {/* Sentiment Analysis Section */}
      <div className="mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg p-6`} /* Updated styling */
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-nordstrom-blue">
              <FaIcons.FaChartPie className="inline-block mr-2 text-nordstrom-blue" />
              Sentiment Analysis
            </h2>
          </div>
          
          {/* Sentiment Analysis with Platform and Month Filters */}
          <SentimentAnalysis
            selectedBrands={selectedBrands}
            posts={selectedBrands.reduce((acc, brand) => {
              // Always pass both Instagram and TikTok posts for all brands
              const igPosts = socialData.instagram[brand]?.posts || [];
              const tkPosts = socialData.tiktok[brand]?.posts || [];
              acc[brand] = [...igPosts, ...tkPosts];
              return acc;
            }, {} as Record<Brand, (InstagramPost | TikTokPost)[]>)}
          />
        </motion.div>
      </div>
      
      
      {/* Hashtag Section */}
      <div className="mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg p-6`} /* Updated styling */
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-nordstrom-blue">
              <FaIcons.FaHashtag className="inline-block mr-2 text-nordstrom-blue" />
              Hashtag Analytics
            </h2>
          </div>
          
          {/* Hashtag Analytics (per platform) */}
          {/* Hashtag Analytics (per platform) */}
          {(filterOptions.platform === 'Instagram' || filterOptions.platform === 'TikTok') && (
            <HashtagSection
              platform={filterOptions.platform as 'Instagram' | 'TikTok'}
              selectedBrands={selectedBrands}
              posts={selectedBrands.reduce((acc, brand) => {
                if (filterOptions.platform === 'Instagram') {
                  acc[brand] = socialData.instagram[brand]?.posts || [];
                } else {
                  acc[brand] = socialData.tiktok[brand]?.posts || [];
                }
                return acc;
              }, {} as Record<Brand, InstagramPost[] | TikTokPost[]>)}
            />
          )}
        </motion.div>
      </div>

      {/* Unified Top Posts Section with Local Platform Toggle */}
      <motion.div 
        className={`rounded-lg p-6 mt-6 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Local platform toggle for Top Posts */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Top Posts</h3>
          <ToggleButtonGroup
            value={activeTopPostsPlatform}
            exclusive
            onChange={(_, newPlatform) => {
              if (newPlatform) setActiveTopPostsPlatform(newPlatform);
            }}
            size="small"
            aria-label="Platform"
            sx={{
              backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
              borderRadius: 2,
              '& .MuiToggleButton-root': {
                color: darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(55,65,81,1)',
                fontWeight: 600,
                fontSize: '0.95rem',
                px: 2.5,
                py: 1,
                '&.Mui-selected': {
                  backgroundColor: darkMode ? 'rgba(0, 120, 212, 0.3)' : 'rgba(0, 120, 212, 0.12)',
                  color: darkMode ? '#fff' : '#00539b',
                },
              },
            }}
          >
            <ToggleButton value="Instagram" aria-label="Instagram">
              Instagram
            </ToggleButton>
            <ToggleButton value="TikTok" aria-label="TikTok">
              TikTok
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
        {activeTopPostsPlatform === 'Instagram' ? (
          <InstagramTopPostsSection
            selectedBrands={selectedBrands}
            posts={selectedBrands.reduce((acc, brand) => {
              acc[brand] = socialData.instagram[brand]?.posts || [];
              return acc;
            }, {} as Record<Brand, InstagramPost[]>)}
          />
        ) : (
          <TikTokTopPostsSection
            selectedBrands={selectedBrands}
            posts={selectedBrands.reduce((acc, brand) => {
              acc[brand] = socialData.tiktok[brand]?.posts || [];
              return acc;
            }, {} as Record<Brand, TikTokPost[]>)}
          />
        )}
      </motion.div>
    </div>
  );
}

export default DashboardOverview;