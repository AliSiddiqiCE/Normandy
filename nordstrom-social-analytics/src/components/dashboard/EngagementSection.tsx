import React, { useMemo } from 'react'; // Removed useState
import { Bar, Line } from 'react-chartjs-2'; // Removed Pie
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, // Added for Line chart
  LineElement,  // Added for Line chart
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  Filler, // Added for Line chart fill
  ChartOptions,
  ChartData
} from 'chart.js';
import { Brand, InstagramPost, TikTokPost, SocialPlatform } from '../../types';
import EmptyChartFallback from '../common/EmptyChartFallback';
// FormControl, InputLabel, MenuItem, Select removed as competitor selection is removed
import { useSocialData } from '../../context/SocialDataContext';
import { getColorByBrand, generateColors } from '../../utils/chartUtils';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement, // Added for Line chart
  LineElement,  // Added for Line chart
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler // Added for Line chart fill
);

type EngagementSectionProps = {
  platform: SocialPlatform;
  selectedBrands: Brand[];
  posts: Record<Brand, (InstagramPost | TikTokPost)[]>;
};

const EngagementSection: React.FC<EngagementSectionProps> = ({ 
  platform, 
  selectedBrands, 
  posts 
}) => {
  // Get dark mode and filter methods from context
  const { 
    darkMode = false, 
    getLocalFilterOptions,
    setLocalFilterOptions 
  } = useSocialData() || {};
  
  // Get local filter options for this component
  const componentId = `engagement-section-${platform.toLowerCase()}`;
  const filterOptions = getLocalFilterOptions(componentId);
  
  // Initialize platform filter if not set
  React.useEffect(() => {
    if (!filterOptions.platform) {
      setLocalFilterOptions(componentId, { platform });
    }
  }, [componentId, platform]);
  
  // Use generateColors for consistent coloring
  const brandColors = useMemo(() => {
    return generateColors(selectedBrands);
  }, [selectedBrands]);

  // --- FILTER POSTS BY SELECTED MONTH ---
  // Helper to check if a post matches the selectedMonth
  const isInSelectedMonth = (post: InstagramPost | TikTokPost) => {
    const { selectedMonth } = filterOptions;
    if (!selectedMonth || selectedMonth.toLowerCase().includes('all')) return true;
    // Instagram: timestamp, TikTok: createTime
    let dateStr = (platform === 'Instagram') ? (post as InstagramPost).timestamp : (post as TikTokPost).createTime;
    if (!dateStr) return false;
    const date = new Date(dateStr);
    // selectedMonth is like 'February', 'March', etc.
    const monthName = date.toLocaleString('default', { month: 'long' });
    return monthName === selectedMonth;
  };

  // Filtered posts per brand
  const filteredPosts: Record<Brand, (InstagramPost | TikTokPost)[]> = useMemo(() => {
    const out: Record<Brand, (InstagramPost | TikTokPost)[]> = {
      Nordstrom: [],
      Macys: [],
      Saks: [],
      Bloomingdales: [],
      Tjmaxx: [],
      Sephora: [],
      Ulta: [],
      Aritzia: [],
      "American Eagle": [],
      Walmart: [],
      "Amazon Beauty": [],
      Revolve: [],
    };

    selectedBrands.forEach(brand => {
      out[brand] = (posts[brand] || []).filter(isInSelectedMonth);
    });
    return out;
  }, [posts, selectedBrands, filterOptions.selectedMonth, platform]);

  const hasData = useMemo(() => {
    return selectedBrands.some(brand => (filteredPosts[brand]?.length || 0) > 0);
  }, [selectedBrands, filteredPosts]);

  // Removed handleCompetitorChange

  // Instagram Image Engagement Data - now a Line chart processing all selectedBrands
  const instagramImageEngagementData = useMemo(() => {
    if (platform !== 'Instagram' || !hasData) {
      return { labels: [], datasets: [] };
    }

    const processedBrandData = selectedBrands.map(brand => {
      const brandPosts = posts[brand] || [];
      const imagePosts = brandPosts.filter(post => {
        const instagramPost = post as InstagramPost;
        return instagramPost.mediaType === 'Image' || instagramPost.mediaType === 'Sidecar';
      });
      const totalLikes = imagePosts.reduce((sum, post) => sum + ((post as InstagramPost).likesCount || 0), 0);
      const totalComments = imagePosts.reduce((sum, post) => sum + ((post as InstagramPost).commentsCount || 0), 0);
      return {
        brandName: brand,
        engagementValue: totalLikes + totalComments,
        postCount: imagePosts.length
      };
    }).filter(data => data.postCount > 0);

    return {
      labels: processedBrandData.map(data => data.brandName),
      datasets: [
        {
          label: 'Image Engagement (Likes + Comments)',
          data: processedBrandData.map(data => data.engagementValue),
          borderColor: '#004170', // Nordstrom Blue
          backgroundColor: 'rgba(0, 65, 112, 0.1)', // Light Nordstrom Blue fill
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [platform, selectedBrands, posts, hasData]);

  // Define types for processed data
  type InstagramBrandData = {
    brandName: Brand;
    engagementRate: number;
    postCount: number;
  };

  type TikTokBrandData = {
    brandName: Brand;
    avgEngagementRate?: number; // For Bar chart (All Months)
    engagementRatesOverTime?: { date: string; rate: number }[]; // For Line chart (Single Month)
    postCount: number;
  };

  // Video Engagement Data (Instagram: Line chart, TikTok: Bar or Line chart)
  const videoEngagementData = useMemo(() => {
    if (!hasData) {
      return { labels: [], datasets: [] };
    }

    if (platform === 'Instagram') {
      const processedBrandData = selectedBrands.map(brand => {
        const brandPosts = (posts[brand] || []) as InstagramPost[];
        const videoPosts = brandPosts.filter(post => post.mediaType === 'Video');

        if (videoPosts.length === 0) return null;

        const totalLikes = videoPosts.reduce((sum, post) => sum + (post.likesCount || 0), 0);
        const totalComments = videoPosts.reduce((sum, post) => sum + (post.commentsCount || 0), 0);
        const totalViews = videoPosts.reduce((sum, post) => sum + (post.videoViewCount || 0), 0);
        const rate = totalViews > 0 ? parseFloat((((totalLikes + totalComments) / totalViews) * 100).toFixed(1)) : 0;
        return { brandName: brand, engagementRate: rate, postCount: videoPosts.length };
      }).filter(Boolean) as InstagramBrandData[];
      
      return {
        labels: processedBrandData.map(data => data.brandName),
        datasets: [
          {
            label: 'Video Engagement Rate (%)',
            data: processedBrandData.map(data => data.engagementRate),
            borderColor: '#004170',
            backgroundColor: 'rgba(0, 65, 112, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      };
    } else { // TikTok
      if (filterOptions && filterOptions.selectedMonth && filterOptions.selectedMonth.toLowerCase().includes('all')) {
        // "All Months" View: Bar Chart of Aggregate Engagement Rate per Brand for the entire period
        const totalPeriodAggregatedER = selectedBrands.map(brand => {
          const brandTikTokPosts = (posts[brand] || []) as TikTokPost[];
          if (brandTikTokPosts.length === 0) {
            return { brandName: brand, engagementRate: 0 };
          }

          let totalDiggCount = 0;
          let totalCommentCount = 0;
          let totalShareCount = 0;
          let totalCollectCount = 0;
          let totalPlayCount = 0;

          brandTikTokPosts.forEach(post => { // These posts are for the entire "All (Feb-May)" period
            totalDiggCount += Number(post.diggCount || 0);
            totalCommentCount += Number(post.commentCount || 0);
            totalShareCount += Number(post.shareCount || 0);
            totalCollectCount += Number(post.collectCount || 0);
            totalPlayCount += Number(post.playCount || 0);
          });

          const totalEngagementRate = totalPlayCount > 0
            ? ((totalDiggCount + totalCommentCount + totalShareCount + totalCollectCount) / totalPlayCount) * 100
            : 0;

          return {
            brandName: brand,
            engagementRate: parseFloat(totalEngagementRate.toFixed(2)),
          };
        });

        return {
          labels: totalPeriodAggregatedER.map(data => data.brandName),
          datasets: [
            {
              label: 'Overall Engagement Rate (%)',
              data: totalPeriodAggregatedER.map(data => data.engagementRate),
              backgroundColor: 'rgba(255, 140, 0, 0.8)',
              borderColor: 'rgba(255, 140, 0, 1)',
              borderWidth: 1,
            },
          ],
        };
      } else {
        // Single Month View: Bar Chart of Aggregate Engagement Rate per Brand for that Month
        const monthlyAggregatedER = selectedBrands.map(brand => {
          const brandTikTokPosts = (posts[brand] || []) as TikTokPost[];
          if (brandTikTokPosts.length === 0) {
            return { brandName: brand, engagementRate: 0 };
          }

          let totalDiggCount = 0;
          let totalCommentCount = 0;
          let totalShareCount = 0;
          let totalCollectCount = 0;
          let totalPlayCount = 0;

          brandTikTokPosts.forEach(post => {
            totalDiggCount += Number(post.diggCount || 0);
            totalCommentCount += Number(post.commentCount || 0);
            totalShareCount += Number(post.shareCount || 0);
            totalCollectCount += Number(post.collectCount || 0);
            totalPlayCount += Number(post.playCount || 0);
          });

          const monthlyEngagementRate = totalPlayCount > 0
            ? ((totalDiggCount + totalCommentCount + totalShareCount + totalCollectCount) / totalPlayCount) * 100
            : 0;

          return {
            brandName: brand,
            engagementRate: parseFloat(monthlyEngagementRate.toFixed(2)),
          };
        });

        return {
          labels: monthlyAggregatedER.map(data => data.brandName),
          datasets: [
            {
              label: `Engagement Rate (%) - ${filterOptions?.selectedMonth || ''}`,
              data: monthlyAggregatedER.map(data => data.engagementRate),
              backgroundColor: 'rgba(255, 140, 0, 0.8)',
              borderColor: 'rgba(255, 140, 0, 1)',
              borderWidth: 1,
            },
          ],
        };
      }
    }
  }, [platform, selectedBrands, posts, hasData, filterOptions]);

  // Removed engagementDistributionData useMemo hook

  // Chart options (can be common for Line and Bar, or split if needed)
  const commonChartOptions = useMemo(() => {
    const options: ChartOptions<'bar' | 'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: darkMode ? 'rgba(255, 255, 255, 0.8)' : undefined
          }
        },
        title: {
          display: false
        },
        tooltip: {
          titleColor: darkMode ? 'rgba(255, 255, 255, 0.9)' : undefined,
          bodyColor: darkMode ? 'rgba(255, 255, 255, 0.9)' : undefined,
          backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : undefined,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(2) + '%';
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : undefined
          },
          ticks: {
            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : undefined
          },
          ticks: {
            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined,
            callback: function(value) {
              return value + '%';
            }
          }
        }
      }
    };
    return options;
  }, [darkMode]);

  const pieOptions = useMemo(() => {
    const options: ChartOptions<'pie'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right' as const,
          labels: {
            color: darkMode ? 'rgba(255, 255, 255, 0.8)' : undefined
          }
        },
        tooltip: {
          titleColor: darkMode ? 'rgba(255, 255, 255, 0.9)' : undefined,
          bodyColor: darkMode ? 'rgba(255, 255, 255, 0.9)' : undefined,
          backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : undefined
        }
      }
    };
    return options;
  }, [darkMode]);

  // For TikTok, both "All Months" and "Single Month" views will now use a Bar chart.
  // The distinction is in the data aggregation (average of daily/post ERs vs. aggregate ER for the month).
  const TikTokChartComponent = Bar;

  return (
    // Removed p-4 from root, padding is handled by parent card in DashboardOverview
    <div>
      {/* Engagement analytics bubble and label removed. Keeping only the charts and their containers. */}

      {platform === 'Instagram' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {/* Instagram Image Engagement Chart */}
          <div className={`p-4 rounded-lg shadow border-2 border-red-500 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} w-full`}>
            <h3 className={`text-md font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Instagram Image Engagement Rate
            </h3>
            <div className="h-80">
              {!hasData || instagramImageEngagementData.labels.length === 0 ? (
                <EmptyChartFallback message="No image post data available" />
              ) : (
                <Bar 
                  data={{
                    ...instagramImageEngagementData,
                    datasets: instagramImageEngagementData.datasets.map(ds => ({
                      ...ds,
                      backgroundColor: 'rgba(255, 140, 0, 0.85)'
                    }))
                  }}
                  options={commonChartOptions as ChartOptions<'bar'>}
                />
              )}
            </div>
          </div>
          {/* Instagram Video Engagement Chart */}
          <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} w-full`}>
            <h3 className={`text-md font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Instagram Video Engagement Rate
            </h3>
            <div className="h-80">
              {!hasData || videoEngagementData.labels.length === 0 ? (
                <EmptyChartFallback message="No video post data available" />
              ) : (
                <Bar 
                  data={{
                    ...videoEngagementData,
                    datasets: videoEngagementData.datasets.map(ds => ({
                      ...ds,
                      backgroundColor: 'rgba(255, 140, 0, 0.85)'
                    }))
                  }}
                  options={commonChartOptions as ChartOptions<'bar'>}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        // TikTok: single column layout
        <div className="grid grid-cols-1 gap-6">
          <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} w-full`}>
            <h3 className={`text-md font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              {(filterOptions && filterOptions.selectedMonth && filterOptions.selectedMonth.toLowerCase().includes('all'))
                ? 'TikTok Overall Engagement Rate by Brand'
                : `TikTok Engagement Rate by Brand - ${filterOptions?.selectedMonth || ''}`}
            </h3>
            <div className="h-80">
              {!hasData || videoEngagementData.labels.length === 0 ? (
                <EmptyChartFallback message="No TikTok data available" />
              ) : (
                <Bar data={videoEngagementData as ChartData<'bar'>} options={commonChartOptions as ChartOptions<'bar'>} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngagementSection;
