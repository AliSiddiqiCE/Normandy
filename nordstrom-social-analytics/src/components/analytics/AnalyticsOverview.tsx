import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bar, Line } from 'react-chartjs-2';
import { useSocialData } from '../../context/SocialDataContext';
import { generateInstagramEngagementChart, generateTikTokEngagementRateChart, formatNumber } from '../../utils/chartUtils';

const AnalyticsOverview: React.FC = () => {
  const { socialData, isLoading, selectedBrands, darkMode, refreshData } = useSocialData();

  // Refresh data when component mounts
  useEffect(() => {
    refreshData();
  }, []);

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

  // Chart options with dark mode support
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? 'white' : 'black',
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        titleColor: darkMode ? 'white' : 'black',
        bodyColor: darkMode ? 'white' : 'black',
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        ticks: {
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  // Calculate brand engagement metrics
  const calculateBrandEngagement = () => {
    const brandMetrics: Record<string, {
      instagramLikes: number,
      instagramComments: number,
      instagramPosts: number,
      tiktokViews: number,
      tiktokLikes: number,
      tiktokShares: number,
      tiktokCollects: number,
      tiktokPosts: number,
      engagementScore: number
    }> = {};

    selectedBrands.forEach(brand => {
      // Initialize brand metrics
      brandMetrics[brand] = {
        instagramLikes: 0,
        instagramComments: 0,
        instagramPosts: 0,
        tiktokViews: 0,
        tiktokLikes: 0,
        tiktokShares: 0,
        tiktokCollects: 0,
        tiktokPosts: 0,
        engagementScore: 0
      };

      // Instagram metrics
      const instagramData = socialData.instagram[brand];
      if (instagramData) {
        instagramData.posts.forEach(post => {
          brandMetrics[brand].instagramLikes += post.likesCount;
          brandMetrics[brand].instagramComments += post.commentsCount;
        });
        brandMetrics[brand].instagramPosts = instagramData.posts.length;
      }

      // TikTok metrics
      const tiktokData = socialData.tiktok[brand];
      if (tiktokData) {
        tiktokData.posts.forEach(post => {
          brandMetrics[brand].tiktokViews += post.playCount;
          brandMetrics[brand].tiktokLikes += post.diggCount;
          brandMetrics[brand].tiktokShares += post.shareCount;
          brandMetrics[brand].tiktokCollects += post.collectCount || 0;
        });
        brandMetrics[brand].tiktokPosts = tiktokData.posts.length;
      }

      // Calculate engagement score (simplified formula)
      const igEngagement = brandMetrics[brand].instagramPosts > 0 ?
        (brandMetrics[brand].instagramLikes + brandMetrics[brand].instagramComments) / brandMetrics[brand].instagramPosts : 0;
      
      const ttEngagement = brandMetrics[brand].tiktokPosts > 0 ?
        (brandMetrics[brand].tiktokLikes + brandMetrics[brand].tiktokShares + brandMetrics[brand].tiktokCollects) / brandMetrics[brand].tiktokPosts : 0;
      
      brandMetrics[brand].engagementScore = (igEngagement + ttEngagement) / 2;
    });

    return brandMetrics;
  };

  // Generate engagement comparison chart
  const generateEngagementComparisonChart = () => {
    const brandMetrics = calculateBrandEngagement();
    
    const labels = Object.keys(brandMetrics);
    const instagramData = labels.map(brand => {
      const posts = brandMetrics[brand].instagramPosts;
      return posts > 0 ? 
        (brandMetrics[brand].instagramLikes + brandMetrics[brand].instagramComments) / posts : 0;
    });
    
    const tiktokData = labels.map(brand => {
      const posts = brandMetrics[brand].tiktokPosts;
      return posts > 0 ? 
        (brandMetrics[brand].tiktokLikes + brandMetrics[brand].tiktokShares) / posts : 0;
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Instagram Engagement',
          data: instagramData,
          backgroundColor: 'rgba(138, 58, 185, 0.7)',
          borderColor: 'rgba(138, 58, 185, 1)',
          borderWidth: 1
        },
        {
          label: 'TikTok Engagement',
          data: tiktokData,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderColor: 'rgba(0, 0, 0, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  // Generate monthly trend chart
  const generateMonthlyTrendChart = () => {
    // This would be more sophisticated with real month-by-month data
    // For now, we'll create a simplified version
    const months = ['February', 'March', 'April', 'May'];
    const brandData: Record<string, number[]> = {};
    
    selectedBrands.forEach(brand => {
      // Create some random but consistent data for each brand
      // In a real implementation, this would aggregate actual monthly data
      const brandSeed = brand.charCodeAt(0) + brand.length;
      brandData[brand] = months.map((_, index) => {
        return Math.floor(Math.sin(brandSeed + index) * 2000 + 5000);
      });
    });
    
    return {
      labels: months,
      datasets: selectedBrands.map((brand, index) => ({
        label: brand,
        data: brandData[brand],
        borderColor: getColorForIndex(index),
        backgroundColor: getColorForIndex(index, 0.1),
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }))
    };
  };

  // Helper function to get colors for charts
  const getColorForIndex = (index: number, alpha: number = 1) => {
    const colors = [
      `rgba(255, 99, 132, ${alpha})`,
      `rgba(54, 162, 235, ${alpha})`,
      `rgba(255, 206, 86, ${alpha})`,
      `rgba(75, 192, 192, ${alpha})`,
      `rgba(153, 102, 255, ${alpha})`,
      `rgba(255, 159, 64, ${alpha})`,
      `rgba(199, 199, 199, ${alpha})`,
      `rgba(83, 102, 255, ${alpha})`,
      `rgba(78, 121, 54, ${alpha})`,
      `rgba(235, 112, 159, ${alpha})`,
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Get Instagram and TikTok engagement charts
  const instagramEngagementChart = generateInstagramEngagementChart(socialData.instagram, selectedBrands);
  const tiktokEngagementChart = generateTikTokEngagementRateChart(socialData.tiktok, selectedBrands);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center space-x-2">
        <span className="text-2xl mr-2">ud83dudcc8</span>
        <h2 className="text-2xl font-bold">Advanced Analytics</h2>
      </div>

      {/* Cross-Platform Comparison */}
      <motion.div
        variants={itemVariants}
        className={`p-5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
      >
        <h3 className="text-lg font-semibold mb-4">Cross-Platform Engagement Comparison</h3>
        <div className="h-80">
          <Bar data={generateEngagementComparisonChart()} options={chartOptions} />
        </div>
      </motion.div>

      {/* Monthly Trends */}
      <motion.div
        variants={itemVariants}
        className={`p-5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
      >
        <h3 className="text-lg font-semibold mb-4">Monthly Engagement Trends</h3>
        <div className="h-80">
          <Line data={generateMonthlyTrendChart()} options={chartOptions} />
        </div>
      </motion.div>

      {/* Brand Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instagram Engagement Rate by Brand */}
        <motion.div
          variants={itemVariants}
          className={`p-5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <h3 className="text-lg font-semibold mb-4">Instagram Engagement by Brand</h3>
          <div className="h-80">
            <Bar data={instagramEngagementChart} options={chartOptions} />
          </div>
        </motion.div>

        {/* TikTok Engagement Rate by Brand */}
        <motion.div
          variants={itemVariants}
          className={`p-5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <h3 className="text-lg font-semibold mb-4">TikTok Engagement by Brand</h3>
          <div className="h-80">
            <Bar data={tiktokEngagementChart} options={chartOptions} />
          </div>
        </motion.div>
      </div>

      {/* Insights Table */}
      <motion.div
        variants={itemVariants}
        className={`p-5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
      >
        <h3 className="text-lg font-semibold mb-4">Brand Performance Insights</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="pb-3">Brand</th>
                <th className="pb-3">IG Posts</th>
                <th className="pb-3">IG Engagement</th>
                <th className="pb-3">TikTok Posts</th>
                <th className="pb-3">TikTok Engagement</th>
                <th className="pb-3">Overall Score</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(calculateBrandEngagement()).map(([brand, metrics]) => (
                <tr key={brand} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="py-3 font-medium">{brand}</td>
                  <td className="py-3">{metrics.instagramPosts}</td>
                  <td className="py-3">
                    {metrics.instagramPosts > 0 ? 
                      formatNumber((metrics.instagramLikes + metrics.instagramComments) / metrics.instagramPosts) : 0}
                  </td>
                  <td className="py-3">{metrics.tiktokPosts}</td>
                  <td className="py-3">
                    {metrics.tiktokPosts > 0 ? 
                      formatNumber((metrics.tiktokLikes + metrics.tiktokShares) / metrics.tiktokPosts) : 0}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      metrics.engagementScore > 1000 ? 'bg-green-100 text-green-800' : 
                      metrics.engagementScore > 500 ? 'bg-blue-100 text-blue-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {formatNumber(metrics.engagementScore)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsOverview;
