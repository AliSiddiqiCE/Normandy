import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brand, TikTokPost } from '../../types';
import { useSocialData } from '../../context/SocialDataContext';
import * as AiIcons from 'react-icons/ai';
import * as BiIcons from 'react-icons/bi';
import * as FaIcons from 'react-icons/fa';
import { format } from 'date-fns';
import { formatNumber, formatPercentage } from '../../utils/chartUtils';
import SentimentComparisonModal from './SentimentComparisonModal';

interface TikTokTopPostsSectionProps {
  selectedBrands: Brand[];
  posts: Record<Brand, TikTokPost[]>;
}

type TabType = 'liked' | 'commented' | 'shared' | 'viewed' | 'engaging';
type BrandTabType = Brand | 'all';

const TikTokTopPostsSection: React.FC<TikTokTopPostsSectionProps> = ({ 
  selectedBrands,
  posts 
}) => {
  const [isSentimentModalOpen, setIsSentimentModalOpen] = useState(false);
  const [selectedPostForModal, setSelectedPostForModal] = useState<(TikTokPost & { brandName?: Brand; engagementRate?: number }) | null>(null);
  const [nordstromTop5ForModal, setNordstromTop5ForModal] = useState<(TikTokPost & { brandName?: Brand; engagementRate?: number })[]>([]);
  const { darkMode } = useSocialData();
  const [activeTab, setActiveTab] = useState<TabType>('liked');
  const [activeBrandTab, setActiveBrandTab] = useState<BrandTabType>('all');

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  // Calculate engagement rate for TikTok posts
  const calculateEngagementRate = (post: TikTokPost): number => {
    if (post.playCount && post.playCount > 0) {
      // Engagement Rate = ((diggCount + commentCount + shareCount + collectCount) / playCount) * 100
      return ((post.diggCount || 0) + (post.commentCount || 0) + 
              (post.shareCount || 0) + (post.collectCount || 0)) / post.playCount * 100;
    }
    return 0; // Return 0 if playCount is not available or is 0
  };

  // Combine all posts from all selected brands
  const allPosts = useMemo(() => {
    let combinedPosts: (TikTokPost & { brandName?: Brand, engagementRate?: number })[] = [];
    selectedBrands.forEach(brand => {
      if (posts[brand] && Array.isArray(posts[brand])) {
        // Add brand information and calculate engagement rate for each post
        const postsWithBrand = posts[brand].map(post => ({
          ...post,
          brandName: brand, // Adding brandName to differentiate from any potential 'brand' field
          engagementRate: calculateEngagementRate(post) // Calculate and add engagement rate
        }));
        combinedPosts = [...combinedPosts, ...postsWithBrand];
      }
    });
    return combinedPosts;
  }, [selectedBrands, posts]);
  
  // Filter posts by selected brand
  const filteredPosts = useMemo(() => {
    if (activeBrandTab === 'all') {
      return allPosts;
    }
    return allPosts.filter(post => post.brandName === activeBrandTab);
  }, [allPosts, activeBrandTab]);

  // Compute top posts for each category
  const topLikedPosts = useMemo(() => {
    return [...filteredPosts]
      .sort((a, b) => (b.diggCount || 0) - (a.diggCount || 0))
      .slice(0, 5);
  }, [filteredPosts]);

  const topCommentedPosts = useMemo(() => {
    return [...filteredPosts]
      .sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0))
      .slice(0, 5);
  }, [filteredPosts]);

  const topSharedPosts = useMemo(() => {
    return [...filteredPosts]
      .sort((a, b) => (b.shareCount || 0) - (a.shareCount || 0))
      .slice(0, 5);
  }, [filteredPosts]);

  const topEngagingPosts = useMemo(() => {
    return [...filteredPosts]
      .sort((a, b) => (b.engagementRate || 0) - (a.engagementRate || 0))
      .slice(0, 5);
  }, [filteredPosts]);

  const topViewedPosts = useMemo(() => {
    return [...filteredPosts]
      .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
      .slice(0, 5);
  }, [filteredPosts]);

  // Get current posts based on active tab
  const currentPosts = useMemo(() => {
    switch (activeTab) {
      case 'liked':
        return topLikedPosts;
      case 'commented':
        return topCommentedPosts;
      case 'shared':
        return topSharedPosts;
      case 'viewed':
        return topViewedPosts;
      case 'engaging':
        return topEngagingPosts;
      default:
        return topLikedPosts;
    }
  }, [activeTab, topLikedPosts, topCommentedPosts, topSharedPosts, topViewedPosts, topEngagingPosts]);

  // Function to get the date in readable format
  const formatPostDate = (timestamp: string | null): string => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Function to truncate text
  const handleOpenSentimentModal = (post: TikTokPost & { brandName?: Brand; engagementRate?: number }) => {
    setSelectedPostForModal(post);
    const nordstromOnlyPosts = allPosts.filter(p => p.brandName === 'Nordstrom');
    const top5 = [...nordstromOnlyPosts]
      .sort((a, b) => (b.engagementRate || 0) - (a.engagementRate || 0))
      .slice(0, 5);
    setNordstromTop5ForModal(top5);
    setIsSentimentModalOpen(true);
  };

  const handleCloseSentimentModal = () => {
    setIsSentimentModalOpen(false);
    setSelectedPostForModal(null);
    setNordstromTop5ForModal([]);
  };

  const truncateText = (text: string, maxLength: number = 50): string => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="w-full">
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        TikTok Top Posts
      </h3>

      {/* Brand Tabs */}
      <div className="flex overflow-x-auto whitespace-nowrap mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`py-2 px-4 text-sm font-medium ${activeBrandTab === 'all' 
            ? `border-b-2 border-nordstrom-orange text-nordstrom-orange dark:text-nordstrom-orange-light` 
            : `text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white`}`}
          onClick={() => setActiveBrandTab('all')}
        >
          All Brands
        </button>
        {selectedBrands.map(brand => (
          <button
            key={brand}
            className={`py-2 px-4 text-sm font-medium ${activeBrandTab === brand 
              ? `border-b-2 border-nordstrom-orange text-nordstrom-orange dark:text-nordstrom-orange-light` 
              : `text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white`}`}
            onClick={() => setActiveBrandTab(brand)}
          >
            {brand}
          </button>
        ))}
      </div>

      {/* Metric Tabs */}
      <div className="flex flex-wrap mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`py-2 px-4 text-sm font-medium ${activeTab === 'liked' 
            ? `border-b-2 border-nordstrom-orange text-nordstrom-orange dark:text-nordstrom-orange-light` 
            : `text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white`}`}
          onClick={() => setActiveTab('liked')}
        >
          <AiIcons.AiFillHeart className="inline mr-1" /> Most Liked
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${activeTab === 'commented' 
            ? `border-b-2 border-nordstrom-orange text-nordstrom-orange dark:text-nordstrom-orange-light` 
            : `text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white`}`}
          onClick={() => setActiveTab('commented')}
        >
          <FaIcons.FaComment className="inline mr-1" /> Most Commented
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${activeTab === 'shared' 
            ? `border-b-2 border-nordstrom-orange text-nordstrom-orange dark:text-nordstrom-orange-light` 
            : `text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white`}`}
          onClick={() => setActiveTab('shared')}
        >
          <FaIcons.FaShare className="inline mr-1" /> Most Shared
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${activeTab === 'engaging' 
            ? `border-b-2 border-nordstrom-orange text-nordstrom-orange dark:text-nordstrom-orange-light` 
            : `text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white`}`}
          onClick={() => setActiveTab('engaging')}
        >
          <BiIcons.BiTrendingUp className="inline mr-1" /> Highest Engagement
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${activeTab === 'viewed' 
            ? `border-b-2 border-nordstrom-orange text-nordstrom-orange dark:text-nordstrom-orange-light` 
            : `text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white`}`}
          onClick={() => setActiveTab('viewed')}
        >
          <FaIcons.FaPlay className="inline mr-1" /> Most Viewed
        </button>
      </div>

      {/* Posts Table */}
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y divide-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Brand</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Post</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                {activeTab === 'liked' && <><AiIcons.AiFillHeart className="inline mr-1" /> Likes</>}
                {activeTab === 'commented' && <><FaIcons.FaComment className="inline mr-1" /> Comments</>}
                {activeTab === 'shared' && <><FaIcons.FaShare className="inline mr-1" /> Shares</>}
                {activeTab === 'viewed' && <><FaIcons.FaPlay className="inline mr-1" /> Views</>}
                {activeTab === 'engaging' && <><BiIcons.BiTrendingUp className="inline mr-1" /> Engagement Rate</>}
              </th>
              <th className="p-2 border-b text-left">Sentiment Analysis</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-gray-600' : 'divide-gray-200'}`}>
            {currentPosts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">No data available</td>
              </tr>
            ) : (
              currentPosts.map((post, index) => (
                <motion.tr
                  key={post.id || index}
                  className={index % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-white') : (darkMode ? 'bg-gray-700' : 'bg-gray-50')}
                  variants={itemVariants}
                >
                  <td className={`px-6 py-4 whitespace-nowrap ${post.brandName === 'Nordstrom' ? 'font-bold' : ''}`}>
                    <span className={post.brandName === 'Nordstrom' ? 'text-blue-600 dark:text-blue-400' : ''}>
                      {post.brandName || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`${post.brandName === 'Nordstrom' ? 'bg-blue-50 dark:bg-blue-900/20 p-2 rounded border-l-4 border-blue-500' : ''}`}>
                      {truncateText(post.text || '', 60)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatPostDate(post.createTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      {activeTab === 'liked' && (
                        <><AiIcons.AiFillHeart className="mr-1 text-red-500" /> {formatNumber(post.diggCount || 0)}</>
                      )}
                      {activeTab === 'commented' && (
                        <><FaIcons.FaComment className="mr-1 text-nordstrom-orange" /> {formatNumber(post.commentCount || 0)}</>
                      )}
                      {activeTab === 'shared' && (
                        <><FaIcons.FaShare className="mr-1 text-green-500" /> {formatNumber(post.shareCount || 0)}</>
                      )}
                      {activeTab === 'viewed' && (
                        <><FaIcons.FaPlay className="mr-1 text-purple-500" /> {formatNumber(post.playCount || 0)}</>
                      )}
                      {activeTab === 'engaging' && (
                        <><FaIcons.FaChartLine className="mr-1 text-nordstrom-orange" /> {formatPercentage(post.engagementRate || 0)}%</>
                      )}
                    </div>
                  </td>
                  <td className="p-2 border-b">
                    <button 
                      onClick={() => handleOpenSentimentModal(post)}
                      className="px-3 py-1 rounded text-xs text-white transition-colors hover:opacity-90" 
                      style={{ backgroundColor: '#ff4c0c' }}
                    >
                      Analyze Sentiment
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <SentimentComparisonModal
        isOpen={isSentimentModalOpen}
        onClose={handleCloseSentimentModal}
        selectedPost={selectedPostForModal}
        nordstromTopPosts={nordstromTop5ForModal}
      />
    </div>
  );
};

export default TikTokTopPostsSection;
