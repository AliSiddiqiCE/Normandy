import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brand, InstagramPost } from '../../types';
import { useSocialData } from '../../context/SocialDataContext';
import * as AiIcons from 'react-icons/ai';
import * as BiIcons from 'react-icons/bi';
import * as FaIcons from 'react-icons/fa';
import { format } from 'date-fns';
import { formatNumber, formatPercentage } from '../../utils/chartUtils';
import SentimentComparisonModal from './SentimentComparisonModal';

// Define a type for social media posts with the properties needed for sentiment analysis
type SocialMediaPost = {
  brandName?: Brand;
  engagementRate?: number;
  caption?: string; // For Instagram
};

interface InstagramTopPostsSectionProps {
  selectedBrands: Brand[];
  posts: Record<Brand, InstagramPost[]>;
}

type TabType = 'liked' | 'commented' | 'engaging';
type BrandTabType = Brand | 'all';

const InstagramTopPostsSection: React.FC<InstagramTopPostsSectionProps> = ({ 
  selectedBrands,
  posts 
}) => {
  const { darkMode } = useSocialData();
  const [activeTab, setActiveTab] = useState<TabType>('liked');
  const [activeBrandTab, setActiveBrandTab] = useState<BrandTabType>('all');
  const [isSentimentModalOpen, setIsSentimentModalOpen] = useState(false);
  const [selectedPostForModal, setSelectedPostForModal] = useState<(InstagramPost & SocialMediaPost) | null>(null);
  const [nordstromTop5ForModal, setNordstromTop5ForModal] = useState<(InstagramPost & SocialMediaPost)[]>([]);

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

  // Calculate engagement rate for Instagram posts
  const calculateEngagementRate = (post: InstagramPost): number => {
    // Check if it's a video (based on mediaType)
    const isVideo = post.mediaType === 'video';
    
    if (isVideo && post.videoViewCount && post.videoViewCount > 0) {
      // For videos: Engagement Rate = ((likesCount + commentsCount) / videoViewCount) * 100
      return ((post.likesCount || 0) + (post.commentsCount || 0)) / post.videoViewCount * 100;
    } else {
      // For images or sidecar: Engagement Rate = likesCount + commentsCount
      return (post.likesCount || 0) + (post.commentsCount || 0);
    }
  };

  // Combine all posts from all selected brands
  const allPosts = useMemo(() => {
    let combinedPosts: (InstagramPost & { brandName?: Brand, engagementRate?: number })[] = [];
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

  // This duplicate declaration has been removed as we're using the one defined above

  // Compute top posts for each category
  const topLikedPosts = useMemo(() => {
    return [...filteredPosts]
      .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
      .slice(0, 5);
  }, [filteredPosts]);

  const topCommentedPosts = useMemo(() => {
    return [...filteredPosts]
      .sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0))
      .slice(0, 5);
  }, [filteredPosts]);

  

  const topEngagingPosts = useMemo(() => {
    return [...filteredPosts]
      .sort((a, b) => calculateEngagementRate(b) - calculateEngagementRate(a))
      .slice(0, 5);
  }, [filteredPosts]);

  // Get current posts based on active tab
  const currentPosts = useMemo(() => {
    switch (activeTab) {
      case 'liked':
        return topLikedPosts;
      case 'commented':
        return topCommentedPosts;

      case 'engaging':
        return topEngagingPosts;
      default:
        return topLikedPosts;
    }
  }, [activeTab, topLikedPosts, topCommentedPosts, topEngagingPosts]);

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
  const truncateText = (text: string, maxLength: number = 50): string => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Function to handle opening the sentiment modal
  const handleOpenSentimentModal = (post: InstagramPost & SocialMediaPost) => {
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

  return (
    <div className="w-full">
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Instagram Top Posts
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
          className={`py-2 px-4 text-sm font-medium ${activeTab === 'engaging' 
            ? `border-b-2 border-nordstrom-orange text-nordstrom-orange dark:text-nordstrom-orange-light` 
            : `text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white`}`}
          onClick={() => setActiveTab('engaging')}
        >
          <BiIcons.BiTrendingUp className="inline mr-1" /> Most Engaging
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
                
                {activeTab === 'engaging' && <><BiIcons.BiTrendingUp className="inline mr-1" /> Engagement Rate</>}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Sentiment Analysis</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Link</th>
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
                    <span className={post.brandName === 'Nordstrom' ? 'text-nordstrom-orange dark:text-nordstrom-orange-light' : ''}>
                      {post.brandName || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`${post.brandName === 'Nordstrom' ? 'bg-nordstrom-orange-50 dark:bg-nordstrom-orange-900/20 p-2 rounded border-l-4 border-nordstrom-orange' : ''}`}>
                      {truncateText(post.caption || '', 60)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatPostDate(post.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      {activeTab === 'liked' && (
                        <>
                          <AiIcons.AiFillHeart className="mr-1 text-red-500" /> {formatNumber(post.likesCount || 0)}
                          {post.mediaType === 'video' && (
                            <span className="ml-3 text-nordstrom-orange">ER: {formatPercentage(post.engagementRate || 0)}%</span>
                          )}
                        </>
                      )}
                      {activeTab === 'commented' && (
                        <>
                          <FaIcons.FaComment className="mr-1 text-nordstrom-orange" /> {formatNumber(post.commentsCount || 0)}
                          {post.mediaType === 'video' && (
                            <span className="ml-3 text-nordstrom-orange">ER: {formatPercentage(post.engagementRate || 0)}%</span>
                          )}
                        </>
                      )}
                      
                      {activeTab === 'engaging' && (
  <>
    <FaIcons.FaChartLine className="mr-1 text-nordstrom-orange" />
    {post.mediaType === 'video'
      ? `${formatPercentage(post.engagementRate || 0)}%`
      : formatNumber(post.engagementRate || 0)
    }
  </>
)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleOpenSentimentModal(post)}
                      className="px-3 py-1 rounded text-xs text-white transition-colors hover:opacity-90" 
                      style={{ backgroundColor: '#ff4c0c' }}
                    >
                      Analyze Sentiment
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a 
                      href={`https://www.instagram.com/p/${post.shortcode}/`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-nordstrom-orange hover:text-nordstrom-orange-dark dark:text-nordstrom-orange-light dark:hover:text-nordstrom-orange transition-colors duration-200"
                    >
                      <FaIcons.FaExternalLinkAlt className="inline mr-1" /> View Post
                    </a>
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

export default InstagramTopPostsSection;
