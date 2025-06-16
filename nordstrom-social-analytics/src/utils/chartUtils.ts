import { InstagramData, TikTokData, Brand, ChartData } from '../types';
import { format } from 'date-fns';
import Sentiment from 'sentiment';

// Color palette for charts (brand-specific colors)
// Updated with a more diverse palette
export const BRAND_COLORS: Record<Brand, string> = {
  'Nordstrom': '#ff4c0c',      // nordstrom-orange (primary brand color)
  'Macys': '#E60000',          // Macy's Red
  'Saks': '#000000',           // Saks Black
  'Bloomingdales': '#FDBB30',  // Bloomingdale's Yellow
  'Tjmaxx': '#0071CE',         // TJMaxx Blue
  'Sephora': '#D9298A',        // Sephora Pink
  'Ulta': '#FF69B4',           // Ulta Pink
  'Aritzia': '#A9A9A9',        // Aritzia Gray
  'American Eagle': '#0073CF', // AE Blue
  'Walmart': '#0071CE',        // Walmart Blue
  'Amazon Beauty': '#FF9900',  // Amazon Orange
  'Revolve': '#CC0000',        // Revolve Red
};

// Generate colors for multiple datasets
export const generateColors = (brands: Brand[]): string[] => {
  const defaultColor = '#888888'; // Default gray for brands not in BRAND_COLORS
  const vibrantFallbacks = [ // Fallback colors that complement the nordstrom-orange brand color
    'rgba(255, 76, 12, 0.9)',    // nordstrom-orange (primary)
    'rgba(255, 76, 12, 0.7)',    // nordstrom-orange (lighter)
    'rgba(255, 76, 12, 0.5)',    // nordstrom-orange (even lighter)
    'rgba(204, 61, 9, 0.8)',     // darker orange
    'rgba(255, 122, 80, 0.8)',   // lighter orange
    'rgba(255, 168, 140, 0.8)',  // pale orange
    'rgba(51, 51, 51, 0.8)',     // dark gray (complementary)
    'rgba(102, 102, 102, 0.8)',  // medium gray (complementary)
    'rgba(153, 153, 153, 0.8)',  // light gray (complementary)
    'rgba(204, 204, 204, 0.8)',  // very light gray (complementary)
  ];
  return brands.map((brand, index) => BRAND_COLORS[brand] || vibrantFallbacks[index % vibrantFallbacks.length] || defaultColor);
};

// Get color for a specific brand
export const getColorByBrand = (brand: Brand, index?: number): string => {
  const defaultColor = '#888888';
   const vibrantFallbacks = [
    'rgba(255, 76, 12, 0.9)', 'rgba(255, 76, 12, 0.7)', 'rgba(255, 76, 12, 0.5)',
    'rgba(204, 61, 9, 0.8)', 'rgba(255, 122, 80, 0.8)', 'rgba(255, 168, 140, 0.8)',
    'rgba(51, 51, 51, 0.8)', 'rgba(102, 102, 102, 0.8)', 'rgba(153, 153, 153, 0.8)',
    'rgba(204, 204, 204, 0.8)',
  ];
  if (BRAND_COLORS[brand]) {
    return BRAND_COLORS[brand];
  }
  if (index !== undefined) {
    return vibrantFallbacks[index % vibrantFallbacks.length];
  }
  return defaultColor;
};

// Generate Instagram likes vs comments chart data
export const generateInstagramEngagementChart = (
  brandsData: Record<Brand, InstagramData | null>,
  selectedBrands: Brand[]
): ChartData => {
  const filteredBrands = selectedBrands.filter(brand => brandsData[brand] !== null);
  
  const labels = filteredBrands;
  const likesData = filteredBrands.map(brand => {
    const data = brandsData[brand];
    if (!data) return 0;
    
    // Calculate average likes per post - using filtered posts
    const totalLikes = data.posts.reduce((sum, post) => sum + post.likesCount, 0);

    return data.posts.length ? Math.round(totalLikes / data.posts.length) : 0;
  });
  
  const commentsData = filteredBrands.map(brand => {
    const data = brandsData[brand];
    if (!data) return 0;
    
    // Calculate average comments per post
    const totalComments = data.posts.reduce((sum, post) => sum + post.commentsCount, 0);
    return data.posts.length ? Math.round(totalComments / data.posts.length) : 0;
  });
  
  return {
    labels,
    datasets: [
      {
        label: 'Avg. Likes',
        data: likesData,
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      },
      {
        label: 'Avg. Comments',
        data: commentsData,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };
};

// Generate TikTok engagement chart data (views, shares, likes)
export const generateTikTokEngagementChart = (
  brandsData: Record<Brand, TikTokData | null>,
  selectedBrands: Brand[]
): ChartData => {
  const filteredBrands = selectedBrands.filter(brand => brandsData[brand] !== null);
  
  const labels = filteredBrands;
  const viewsData = filteredBrands.map(brand => {
    const data = brandsData[brand];
    if (!data) return 0;
    
    // Calculate average views per post
    const totalViews = data.posts.reduce((sum, post) => sum + post.playCount, 0);
    return data.posts.length ? Math.round(totalViews / data.posts.length) : 0;
  });
  
  const likesData = filteredBrands.map(brand => {
    const data = brandsData[brand];
    if (!data) return 0;
    
    // Calculate average likes per post
    const totalLikes = data.posts.reduce((sum, post) => sum + post.diggCount, 0);
    return data.posts.length ? Math.round(totalLikes / data.posts.length) : 0;
  });
  
  const sharesData = filteredBrands.map(brand => {
    const data = brandsData[brand];
    if (!data) return 0;
    
    // Calculate average shares per post
    const totalShares = data.posts.reduce((sum, post) => sum + post.shareCount, 0);
    return data.posts.length ? Math.round(totalShares / data.posts.length) : 0;
  });
  
  return {
    labels,
    datasets: [
      {
        label: 'Avg. Views',
        data: viewsData,
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      },
      {
        label: 'Avg. Likes',
        data: likesData,
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      },
      {
        label: 'Avg. Shares',
        data: sharesData,
        backgroundColor: 'rgba(255, 206, 86, 0.7)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1
      }
    ]
  };
};

// Generate Instagram engagement over time chart
export const generateInstagramEngagementTimeChart = (
  brandsData: Record<Brand, InstagramData | null>,
  selectedBrands: Brand[]
): ChartData => {
  // Filter brands with data
  const filteredBrands = selectedBrands.filter(brand => brandsData[brand] !== null);
  
  // Get all unique dates across all posts
  const allDates = new Set<string>();
  filteredBrands.forEach(brand => {
    const data = brandsData[brand];
    if (data) {
      data.posts.forEach(post => {
        const date = format(new Date(post.timestamp), 'yyyy-MM-dd');
        allDates.add(date);
      });
    }
  });
  
  // Sort dates
  const sortedDates = Array.from(allDates).sort();
  
  // Create datasets for each brand
  const datasets = filteredBrands.map(brand => {
    const data = brandsData[brand];
    const engagementByDate: Record<string, number> = {};
    
    if (data) {
      // Calculate total engagement (likes + comments) per date
      data.posts.forEach(post => {
        const date = format(new Date(post.timestamp), 'yyyy-MM-dd');
        engagementByDate[date] = (engagementByDate[date] || 0) + post.likesCount + post.commentsCount;
      });
    }
    
    // Create data array aligned with sortedDates
    const dataPoints = sortedDates.map(date => Number(engagementByDate[date] || 0));
    
    return {
      label: brand,
      data: dataPoints,
      backgroundColor: BRAND_COLORS[brand],
      borderColor: BRAND_COLORS[brand],
      borderWidth: 2
    };
  });
  
  return {
    labels: sortedDates.map(date => format(new Date(date), 'MMM dd')),
    datasets
  };
};

// Generate TikTok engagement rate chart
export const generateTikTokEngagementRateChart = (
  brandsData: Record<Brand, TikTokData | null>,
  selectedBrands: Brand[]
): ChartData => {
  const filteredBrands = selectedBrands.filter(brand => brandsData[brand] !== null);
  
  const labels = filteredBrands;
  const engagementRates = filteredBrands.map(brand => {
    const data = brandsData[brand];
    if (!data || !data.posts.length) return 0;
    
    // Engagement Rate = (likes + comments + shares + collect) / views
    const totalEngagementRate = data.posts.reduce((sum, post) => {
      const collectCount = post.collectCount || 0;
      const engagementRate = post.playCount > 0 ? 
        ((post.diggCount + post.commentCount + post.shareCount + collectCount) / post.playCount) * 100 : 0;
      return sum + engagementRate;
    }, 0);
    
    return data.posts.length ? Number((totalEngagementRate / data.posts.length).toFixed(2)) : 0;
  });
  
  return {
    labels,
    datasets: [
      {
        label: 'Engagement Rate (%)',
        data: engagementRates,
        backgroundColor: generateColors(filteredBrands),
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1
      }
    ]
  };
};

// Extract and count hashtags from Instagram posts
export const extractInstagramHashtags = (
  brandsData: Record<Brand, InstagramData | null>,
  selectedBrands: Brand[]
): Record<string, number> => {
  const hashtagCounts: Record<string, number> = {};
  
  selectedBrands.forEach(brand => {
    const data = brandsData[brand];
    if (!data) return;
    
    data.posts.forEach(post => {
      post.hashtags.forEach(hashtag => {
        const tag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    });
  });
  
  return hashtagCounts;
};

// Extract and count hashtags from TikTok posts
export const extractTikTokHashtags = (
  brandsData: Record<Brand, TikTokData | null>,
  selectedBrands: Brand[]
): Record<string, number> => {
  const hashtagCounts: Record<string, number> = {};
  
  selectedBrands.forEach(brand => {
    const data = brandsData[brand];
    if (!data) return;
    
    data.posts.forEach(post => {
      post.hashtags.forEach(hashtag => {
        const tag = `#${hashtag.name}`;
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    });
  });
  
  return hashtagCounts;
};

// Calculate sponsored post ratio for Instagram
export const calculateSponsoredPostRatio = (
  brandsData: Record<Brand, InstagramData | null>,
  selectedBrands: Brand[]
): ChartData => {
  const labels = selectedBrands.filter(brand => brandsData[brand] !== null);
  
  const sponsoredRatios = labels.map(brand => {
    const data = brandsData[brand];
    if (!data || !data.posts.length) return 0;
    
    const sponsoredCount = data.posts.filter(post => post.isSponsored).length;
    return parseFloat(((sponsoredCount / data.posts.length) * 100).toFixed(1));
  });
  
  return {
    labels,
    datasets: [
      {
        label: 'Sponsored Posts (%)',
        data: sponsoredRatios,
        backgroundColor: generateColors(labels),
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1
      }
    ]
  };
};

// Format numbers for better readability
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  } else if (Number.isInteger(num)) {
    return num.toString();
  } else {
    return num.toFixed(2);
  }
};

// Format percentage values
export const formatPercentage = (num: number): string => {
  return num.toFixed(2);
};

// Generate combined hashtag analysis for a specific brand
export const generateCombinedHashtagAnalysis = (
  instagramData: Record<Brand, InstagramData | null>,
  tiktokData: Record<Brand, TikTokData | null>,
  brand: Brand
): ChartData => {
  const hashtagCounts: Record<string, number> = {};
  
  // Process Instagram hashtags
  const igData = instagramData[brand];
  if (igData !== null && igData !== undefined && igData.posts.length > 0) {
    const posts = igData.posts;
    posts.forEach(post => {
      if (post.hashtags && post.hashtags.length) {
        post.hashtags.forEach(tag => {
          if (tag) {
            const cleanTag = tag.toLowerCase().replace('#', '');
            hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
          }
        });
      }
    });
  }
  
  // Process TikTok hashtags
  const ttData = tiktokData[brand];
  if (ttData !== null && ttData !== undefined && ttData.posts.length > 0) {
    const posts = ttData.posts;
    posts.forEach(post => {
      if (post.hashtags && post.hashtags.length) {
        post.hashtags.forEach(tag => {
          if (tag.name) {
            const cleanTag = tag.name.toLowerCase();
            hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
          }
        });
      }
    });
  }
  
  // Sort hashtags by count and get top 5
  const topHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  const labels = topHashtags.map(([tag]) => `#${tag}`);
  const data = topHashtags.map(([, count]) => count);
  
  return {
    labels,
    datasets: [
      {
        label: `${brand} Top Hashtags`,
        data,
        backgroundColor: '#ff4c0c', // nordstrom-orange (primary brand color)
        borderColor: '#ff4c0c', // nordstrom-orange (primary brand color)
        borderWidth: 1
      }
    ]
  };
};

// Helper function to check if a post's month matches the selected month
const isPostInSelectedMonth = (postDate: Date, selectedMonth: string): boolean => {
  // Skip filtering if 'All' is selected
  if (!selectedMonth || selectedMonth.toLowerCase().includes('all')) {
    return true;
  }
  
  const postMonth = postDate.toLocaleString('default', { month: 'long' });
  // Normalize both strings for comparison (lowercase and trim)
  return postMonth.toLowerCase().trim() === selectedMonth.toLowerCase().trim();
};

// Generate engagement rate chart data for different brands
export const generateEngagementRateChart = (
  instagramData: Record<Brand, InstagramData | null>,
  tiktokData: Record<Brand, TikTokData | null>,
  selectedBrands: Brand[],
  platform: 'Instagram' | 'TikTok',
  selectedMonth?: string
): ChartData => {

  // Filter brands that have data
  const filteredBrands = selectedBrands.filter(brand => {
    if (platform === 'Instagram') {
      const igData = instagramData[brand];
      const hasData = igData !== null && igData !== undefined && igData.posts.length > 0;
      return hasData;
    } else {
      const ttData = tiktokData[brand];
      const hasData = ttData !== null && ttData !== undefined && ttData.posts.length > 0;
      return hasData;
    }
  });
  
  const labels = filteredBrands;
  let datasets = [];
  
  if (platform === 'Instagram') {
    // Generate Instagram metrics - separate for image and video posts
    const instagramImageEngagementRates = filteredBrands.map(brand => {
      const data = instagramData[brand];

      if (!data || !data.posts.length) return 0;
      
      // Filter posts by month if selected
      let filteredPosts = data.posts;
      if (selectedMonth) {

        filteredPosts = data.posts.filter(post => {
          const postDate = new Date(post.timestamp);
          return isPostInSelectedMonth(postDate, selectedMonth);
        });

      }
      
      // Filter only image posts - try both mediaType and type properties
      const imagePosts = filteredPosts.filter(post => {
        // Check if either mediaType or type indicates it's not a video
        return post.type !== 'video';
      });
      
      if (imagePosts.length === 0) return 0;
      
      // Calculate combined engagement metrics for all Instagram image posts
      let totalLikesCount = 0;
      let totalCommentsCount = 0;
      let totalFollowersCount = 0;
      
      // Sum up all engagement metrics across all posts
      imagePosts.forEach(post => {
        totalLikesCount += Number(post.likesCount) || 0;
        totalCommentsCount += Number(post.commentsCount) || 0;
      });
      
      // Calculate the overall engagement rate using the combined metrics
      const result = Math.round(totalLikesCount + totalCommentsCount);
      return result;
    });
    
    const instagramVideoEngagementRates = filteredBrands.map(brand => {
      const data = instagramData[brand];
      if (!data || !data.posts.length) return 0;
      
      // Filter posts by month if selected
      let filteredPosts = data.posts;
      if (selectedMonth) {

        filteredPosts = data.posts.filter(post => {
          const postDate = new Date(post.timestamp);
          return isPostInSelectedMonth(postDate, selectedMonth);
        });

      }
      
      // Filter only video posts with valid view counts
      const videoPosts = filteredPosts.filter(post => {
        // Check if either mediaType or type indicates it's a video
        const isVideo = post.type === 'video';
        // Check if it has valid view count - convert to Number to handle string values
        const hasValidViewCount = (post.videoViewCount && Number(post.videoViewCount) > 0) || 
                               (post.videoPlayCount && Number(post.videoPlayCount) > 0);
        return isVideo && hasValidViewCount;
      });
      
      if (videoPosts.length > 0) {
      }
      
      if (videoPosts.length === 0) return 0;
      
      // Calculate combined engagement metrics for all Instagram video posts
      let totalLikesCount = 0;
      let totalCommentsCount = 0;
      let totalViewCount = 0;
      
      // Sum up all engagement metrics across all posts
      videoPosts.forEach(post => {
        totalLikesCount += Number(post.likesCount) || 0;
        totalCommentsCount += Number(post.commentsCount) || 0;
        
        // Use either videoViewCount or videoPlayCount, whichever is available
        const viewCount = Number(post.videoViewCount) || Number(post.videoPlayCount) || 0;
        totalViewCount += viewCount;
      });
      
      // Calculate the overall engagement rate using the combined metrics
      const result = totalViewCount > 0 ? 
        Math.round(((totalLikesCount + totalCommentsCount) / totalViewCount) * 100) : 0;
      return result;
    });
    
    // Add datasets for Instagram
    datasets = [
      {
        label: 'Instagram Image Posts',
        data: instagramImageEngagementRates,
        backgroundColor: 'rgba(131, 58, 180, 0.2)',
        borderColor: 'rgba(131, 58, 180, 1)',
        borderWidth: 2
      },
      {
        label: 'Instagram Video Posts',
        data: instagramVideoEngagementRates,
        backgroundColor: 'rgba(193, 53, 132, 0.2)',
        borderColor: 'rgba(193, 53, 132, 1)',
        borderWidth: 2
      }
    ];
  } else {
    // Generate TikTok metrics
    const tiktokEngagementRates = filteredBrands.map(brand => {
      const data = tiktokData[brand];
      if (!data || !data.posts.length) return 0;
      
      // Filter posts by month if selected
      let filteredPosts = data.posts;
      if (selectedMonth) {

        filteredPosts = data.posts.filter(post => {
          let postDate: Date;
          if (!isNaN(parseFloat(post.createTime))) {
            postDate = new Date(parseFloat(post.createTime) * 1000);
          } else {
            postDate = new Date(post.createTime);
          }
          return isPostInSelectedMonth(postDate, selectedMonth);
        });

      }
      
      // Filter only posts with valid play counts - convert to Number to handle string values
      const validPosts = filteredPosts.filter(post => Number(post.playCount) > 0);
      
      if (validPosts.length > 0) {
      }
      
      if (validPosts.length === 0) return 0;
      
      // Calculate combined engagement metrics for all TikTok posts
      let totalDiggCount = 0;
      let totalCommentCount = 0;
      let totalShareCount = 0;
      let totalCollectCount = 0;
      let totalPlayCount = 0;

      validPosts.forEach(post => {
        totalDiggCount += Number(post.diggCount) || 0;
        totalCommentCount += Number(post.commentCount) || 0;
        totalShareCount += Number(post.shareCount) || 0;
        // Handle case where collectCount might be missing or undefined
        const collectCount = post.collectCount !== undefined ? Number(post.collectCount) : 0;
        totalCollectCount += collectCount;
        totalPlayCount += Number(post.playCount) || 0;
      });
      
      // Calculate the overall engagement rate using the combined metrics
      const result = totalPlayCount > 0 ? 
        Math.round(((totalDiggCount + totalCommentCount + totalShareCount + totalCollectCount) / totalPlayCount) * 100) : 0;
      return result;
    });
    
    // Add dataset for TikTok
    datasets = [
      {
        label: 'TikTok Engagement Rate',
        data: tiktokEngagementRates,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 2
      }
    ];
  }
  
  return {
    labels,
    datasets
  };
};

// Generate unified hashtag chart for all selected brands
export const generateUnifiedHashtagChart = (
  instagramData: Record<Brand, InstagramData | null>,
  tiktokData: Record<Brand, TikTokData | null>,
  selectedBrands: Brand[],
  platform: 'Instagram' | 'TikTok' = 'Instagram'
): ChartData => {
  // Store hashtag counts for each brand
  const brandHashtags: Record<string, Record<string, number>> = {};
  
  // Process hashtags for each brand
  selectedBrands.forEach(brand => {
    const hashtagCounts: Record<string, number> = {};
    
    // Process Instagram hashtags if platform is Instagram
    if (platform === 'Instagram') {
      const igData = instagramData[brand];
      if (igData !== null && igData !== undefined && igData.posts.length > 0) {
        const posts = igData.posts;
        posts.forEach(post => {
          if (post.hashtags && post.hashtags.length) {
            post.hashtags.forEach(tag => {
              if (tag) {
                hashtagCounts[tag.toLowerCase()] = (hashtagCounts[tag.toLowerCase()] || 0) + 1;
              }
            });
          }
        });
      }
    }
    
    // Process TikTok hashtags if platform is TikTok
    if (platform === 'TikTok') {
      const ttData = tiktokData[brand];
      if (ttData !== null && ttData !== undefined && ttData.posts.length > 0) {
        const posts = ttData.posts;
        posts.forEach(post => {
          if (post.hashtags && post.hashtags.length) {
            post.hashtags.forEach(tag => {
              if (tag.name) {
                hashtagCounts[tag.name.toLowerCase()] = (hashtagCounts[tag.name.toLowerCase()] || 0) + 1;
              }
            });
          }
        });
      }
    }
    
    // Store hashtags for this brand
    brandHashtags[brand] = hashtagCounts;
  });
  
  // Find the top 5 hashtags across all brands
  const allHashtags = new Set<string>();
  selectedBrands.forEach(brand => {
    const hashtags = Object.keys(brandHashtags[brand] || {});
    hashtags.forEach(tag => allHashtags.add(tag));
  });
  
  // Sort hashtags by total usage across all brands
  const topHashtags = Array.from(allHashtags)
    .map(tag => {
      let total = 0;
      selectedBrands.forEach(brand => {
        total += brandHashtags[brand]?.[tag] || 0;
      });
      return { tag, total };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(item => item.tag);
  
  // Create datasets for each brand
  const datasets = selectedBrands.map((brand, index) => {
    const brandColor = BRAND_COLORS[brand] || `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.7)`;
    return {
      label: brand,
      data: topHashtags.map(tag => brandHashtags[brand]?.[tag] || 0),
      backgroundColor: brandColor,
      borderColor: brandColor.replace('0.7', '1'),
      borderWidth: 1,
    };
  });
  
  return {
    labels: topHashtags.map(tag => `#${tag}`),
    datasets,
  };
};

// Generate TikTok followers chart data
export const generateTikTokFollowersChart = (
  tiktokData: Record<Brand, TikTokData | null>,
  selectedBrands: Brand[]
): ChartData => {
  const filteredBrands = selectedBrands.filter(brand => tiktokData[brand] !== null);
  
  const labels = filteredBrands;
  const followersData = filteredBrands.map(brand => {
    const data = tiktokData[brand];
    if (!data || !data.posts.length) return 0;
    
    // Get the latest post to get the most recent followers count
    // Sort posts by createTime in descending order
    const sortedPosts = [...data.posts].sort((a, b) => {
      const timeA = new Date(a.createTime).getTime();
      const timeB = new Date(b.createTime).getTime();
      return timeB - timeA;
    });
    
    // Return the followers count from the most recent post
    return sortedPosts[0]?.authorMeta?.fans || 0;
  });
  
  return {
    labels,
    datasets: [
      {
        label: 'TikTok Followers',
        data: followersData,
        backgroundColor: 'rgba(238, 29, 82, 0.7)',
        borderColor: 'rgba(238, 29, 82, 1)',
        borderWidth: 1
      }
    ]
  };
};

// Analyze sentiment in posts and extract word frequency data
// Using a -5 to +5 scale for sentiment scores
export const analyzeSentiment = (
  instagramData: Record<Brand, InstagramData | null>,
  tiktokData: Record<Brand, TikTokData | null>,
  brand: Brand,
  platform: 'Instagram' | 'TikTok' = 'Instagram'
) => {
  // Initialize sentiment counters
  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;
  const positiveWords: Record<string, number> = {};
  const negativeWords: Record<string, number> = {};
  const sentimentScores: number[] = [];
  
  // Define stopwords to exclude from word clouds
  const stopwords = ['the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'like', 'as', 'of', 'from', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'but', 'or', 'so', 'not', 'no', 'it', 'its', 'my', 'his', 'her', 'their', 'our', 'your', 'i', 'you', 'he', 'she', 'we', 'they'];
  
  // Sentiment analyzer with scale factor to convert to -5 to +5 range
  const sentimentAnalyzer = new Sentiment();
  const MAX_SCALE = 5; // Maximum value in our -5 to +5 scale
  
  // Process posts based on selected platform
  if (platform === 'Instagram') {
    const data = instagramData[brand];
    if (data && data.posts && Array.isArray(data.posts)) {
      data.posts.forEach(post => {
        if (post && post.caption) {
          const result = sentimentAnalyzer.analyze(post.caption);
          // Scale the sentiment score to -5 to +5 range
          const scaledScore = Math.max(-MAX_SCALE, Math.min(MAX_SCALE, result.score * (MAX_SCALE / 5)));
          sentimentScores.push(scaledScore);
          
          if (result.score > 0) {
            positiveCount++;
            result.positive.forEach((word: string) => {
              if (!stopwords.includes(word.toLowerCase())) {
                positiveWords[word] = (positiveWords[word] || 0) + 1;
              }
            });
          } else if (result.score < 0) {
            negativeCount++;
            result.negative.forEach((word: string) => {
              if (!stopwords.includes(word.toLowerCase())) {
                negativeWords[word] = (negativeWords[word] || 0) + 1;
              }
            });
          } else {
            neutralCount++;
          }
        }
      });
    }
  } else if (platform === 'TikTok') {
    const data = tiktokData[brand];
    if (data && data.posts && Array.isArray(data.posts)) {
      data.posts.forEach(post => {
        if (post && post.text) {
          const result = sentimentAnalyzer.analyze(post.text);
          // Scale the sentiment score to -5 to +5 range
          const scaledScore = Math.max(-MAX_SCALE, Math.min(MAX_SCALE, result.score * (MAX_SCALE / 5)));
          sentimentScores.push(scaledScore);
          
          if (result.score > 0) {
            positiveCount++;
            result.positive.forEach((word: string) => {
              if (!stopwords.includes(word.toLowerCase())) {
                positiveWords[word] = (positiveWords[word] || 0) + 1;
              }
            });
          } else if (result.score < 0) {
            negativeCount++;
            result.negative.forEach((word: string) => {
              if (!stopwords.includes(word.toLowerCase())) {
                negativeWords[word] = (negativeWords[word] || 0) + 1;
              }
            });
          } else {
            neutralCount++;
          }
        }
      });
    }
  }
  
  // Calculate average sentiment score
  const averageSentiment = sentimentScores.length > 0 
    ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length 
    : 0;
  
  // Convert word frequency to word cloud format
  const positiveWordCloud = Object.keys(positiveWords).map(word => ({
    text: word,
    value: positiveWords[word],
  }));
  
  const negativeWordCloud = Object.keys(negativeWords).map(word => ({
    text: word,
    value: negativeWords[word],
  }));
  
  return {
    sentiment: {
      positive: positiveCount,
      neutral: neutralCount,
      negative: negativeCount,
      total: positiveCount + neutralCount + negativeCount,
      averageScore: averageSentiment,
      // Updated thresholds for sentiment labels using -5 to +5 scale
      sentimentLabel: averageSentiment > 1.5 ? 'Positive' : averageSentiment < -1.5 ? 'Negative' : 'Neutral',
    },
    wordClouds: {
      positive: positiveWordCloud,
      negative: negativeWordCloud,
    },
  };
}