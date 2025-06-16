import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SocialData, Brand, Platform, FilterOptions, InstagramData, TikTokData, InstagramPost, TikTokPost } from '../types';
import { fetchInstagramDataFromFile, fetchTikTokDataFromFile } from '../utils/excelUtils';
import { recalculateAllSentiment } from '../utils/recalculateSentiment';

// Define all available brands
const ALL_BRANDS: Brand[] = [
  'Nordstrom',
  'Macys',
  'Saks',  // Updated from 'Sakes' to 'Saks'
  'Bloomingdales',
  'Tjmaxx',
  'Sephora',
  'Ulta',
  'Aritzia',
  'American Eagle',
  'Walmart',
  'Amazon Beauty',
  'Revolve'
];

interface SocialDataContextType {
  socialData: SocialData;
  isLoading: boolean;
  error: Error | null;
  filterOptions: FilterOptions;
  setFilterOptions: (options: FilterOptions) => void;
  refreshData: (platform?: Platform, brand?: Brand) => Promise<void>;
  selectedBrands: Brand[];
  setSelectedBrands: (brands: Brand[]) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const SocialDataContext = createContext<SocialDataContextType | undefined>(undefined);

// Initial state for social data
const initialSocialData: SocialData = {
  instagram: {} as Record<Brand, InstagramData | null>,
  tiktok: {} as Record<Brand, TikTokData | null>,
  lastFetched: {
    Instagram: {} as Record<Brand, Date | null>,
    TikTok: {} as Record<Brand, Date | null>
  }
};

// Initialize the social data object with all brands
ALL_BRANDS.forEach(brand => {
  initialSocialData.instagram[brand] = null;
  initialSocialData.tiktok[brand] = null;
  initialSocialData.lastFetched.Instagram[brand] = null;
  initialSocialData.lastFetched.TikTok[brand] = null;
});

// Available months for filtering
export const AVAILABLE_MONTHS = ['February', 'March', 'April', 'May', 'All (Feb-May)'];

// Initial filter options
export const initialFilterOptions: FilterOptions = {
  platform: 'Instagram', // Set Instagram as default platform
  brands: ALL_BRANDS,
  dateRange: {
    start: new Date(new Date().setMonth(new Date().getMonth() - 3)), // Last 3 months
    end: new Date()
  },
  selectedMonth: 'All (Feb-May)' // Default to show all months
};

// Provider component that wraps your app and makes auth object available to any
// child component that calls useAuth().
export const SocialDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for social data
  const [socialData, setSocialData] = useState<SocialData>(initialSocialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(initialFilterOptions);
  const [selectedBrands, setSelectedBrands] = useState<Brand[]>(ALL_BRANDS);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === 'true');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);

  // Apply dark mode class to document element whenever darkMode state changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Calculate engagement rate for Instagram posts based on the new formula
  const calculateInstagramEngagementRate = (post: InstagramPost): number => {
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
  
  // Calculate engagement rate for TikTok posts based on the new formula
  const calculateTikTokEngagementRate = (post: TikTokPost): number => {
    if (post.playCount && post.playCount > 0) {
      // Engagement Rate = ((diggCount + commentCount + shareCount + collectCount) / playCount) * 100
      return ((post.diggCount || 0) + (post.commentCount || 0) + (post.shareCount || 0) + (post.collectCount || 0)) / post.playCount * 100;
    }
    return 0; // Return 0 if playCount is not available or is 0
  };
  
  // Utility function to filter data based on filter options
  const filterData = () => {

    
    // Create a deep copy of the original data (un-filtered)
    const loadedData: SocialData = JSON.parse(JSON.stringify(socialData));
    
    // Create a new filtered dataset
    const filteredData: SocialData = {
      instagram: {} as Record<Brand, InstagramData | null>,
      tiktok: {} as Record<Brand, TikTokData | null>,
      lastFetched: { ...loadedData.lastFetched }
    };
    
    // Always populate both platforms for selected brands initially
    // The actual display in components will then use filterOptions.platform to show relevant data.
    filterOptions.brands.forEach(brand => {
      if (loadedData.instagram[brand]) {
        filteredData.instagram[brand] = JSON.parse(JSON.stringify(loadedData.instagram[brand]));
      } else {
        filteredData.instagram[brand] = null;
      }
      if (loadedData.tiktok[brand]) {
        filteredData.tiktok[brand] = JSON.parse(JSON.stringify(loadedData.tiktok[brand]));
      } else {
        filteredData.tiktok[brand] = null;
      }
    });

    // Now filter by months for each platform
    const monthMap: Record<string, number> = {
      'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
      'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
    };
    
    // Filter Instagram posts by month
    for (const brand of filterOptions.brands) {
      const brandData = filteredData.instagram[brand];
      if (brandData && brandData.posts && brandData.posts.length > 0) {
        // Filter posts by selected months and date range
        const filteredPosts = brandData.posts.filter((post: InstagramPost) => {
          if (!post.timestamp) return false;
          
          try {
            const date = new Date(post.timestamp);
            if (isNaN(date.getTime())) return false;
            
            // Check if the post date is within the date range
            const isInDateRange = (!filterOptions.dateRange.start || date >= filterOptions.dateRange.start) && 
                                (!filterOptions.dateRange.end || date <= filterOptions.dateRange.end);
            
            // Check if the post month matches the selected month or is part of "All (Feb-May)"
            const monthNum = date.getMonth();
            const monthName = Object.keys(monthMap).find(m => monthMap[m] === monthNum);
            
            // If "All (Feb-May)" is selected, include all posts from Feb-May
            const isSelectedMonth = filterOptions.selectedMonth === 'All (Feb-May)' ? 
              (monthNum >= 1 && monthNum <= 4) : // Feb (1) to May (4)
              monthName === filterOptions.selectedMonth;
            
            // Post must be both in date range AND match the month filter
            return isInDateRange && isSelectedMonth;
          } catch (error) {
            return false;
          }
        });
        
        // Update the filtered data
        filteredData.instagram[brand] = {
          ...brandData,
          posts: filteredPosts.map(post => ({
            ...post,
            // Add calculated engagement rate to each post
            engagementRate: calculateInstagramEngagementRate(post)
          }))
        };
      }
    }
    
    // Filter TikTok posts by month
    for (const brand of filterOptions.brands) {
      const brandData = filteredData.tiktok[brand]; // Data for the current brand before date/month filtering

      if (brandData && brandData.posts && brandData.posts.length > 0) {
        // Diagnostic Log 1: Before date/month filtering
        console.log(
          `[DEBUG TIKTOK PRE-FILTER - ${brand}]`,
          {
            platformFilter: filterOptions.platform,
            monthFilter: filterOptions.selectedMonth,
            dateRangeFilter: filterOptions.dateRange,
            numPostsBeforeDateFilter: brandData.posts.length,
            sampleCreateTimes: brandData.posts.slice(0, 3).map(p => p.createTime)
          }
        );

        const filteredPosts = brandData.posts.filter((post: TikTokPost) => {
          if (!post.createTime) return false;
          
          try {
            const date = new Date(post.createTime);
            if (isNaN(date.getTime())) return false;
            
            // Check if the post date is within the date range
            const isInDateRange = (!filterOptions.dateRange.start || date >= filterOptions.dateRange.start) && 
                                (!filterOptions.dateRange.end || date <= filterOptions.dateRange.end);
            
            // Check if the post month matches the selected month or is part of "All (Feb-May)"
            const monthNum = date.getMonth();
            const monthName = Object.keys(monthMap).find(m => monthMap[m] === monthNum);
            
            // If "All (Feb-May)" is selected, include all posts from Feb-May
            const isSelectedMonth = filterOptions.selectedMonth === 'All (Feb-May)' ? 
              (monthNum >= 1 && monthNum <= 4) : // Feb (1) to May (4)
              monthName === filterOptions.selectedMonth;
            
            // Post must be both in date range AND match the month filter
            return isInDateRange && isSelectedMonth;
          } catch (error) {
            return false;
          }
        });

        // Diagnostic Log 2: After date/month filtering
        console.log(
          `[DEBUG TIKTOK POST-FILTER - ${brand}]`,
          {
            numPostsAfterDateFilter: filteredPosts.length
          }
        );
        
        // Update the filtered data
        filteredData.tiktok[brand] = {
          ...brandData,
          posts: filteredPosts.map(post => ({
            ...post,
            // Add calculated engagement rate to each post
            engagementRate: calculateTikTokEngagementRate(post)
          }))
        };
      } else {
        // Diagnostic Log 3: No TikTok data for brand before date/month filter
        console.log(`[DEBUG TIKTOK PRE-FILTER - ${brand}] No posts found for this brand initially.`);
      }
    }
    
    return filteredData;
  };
  
  // Function to sync date range with selected month
  const syncDateRangeWithMonth = (month: string) => {
    const currentYear = new Date().getFullYear();
    let start: Date, end: Date;
    
    if (month === 'All (Feb-May)') {
      // Set date range to Feb 1 - May 31
      start = new Date(currentYear, 1, 1); // Feb 1
      end = new Date(currentYear, 4, 31); // May 31
    } else {
      // Set date range to the specific month
      const monthMap: Record<string, number> = {
        'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
        'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
      };
      
      const monthNum = monthMap[month];
      if (monthNum !== undefined) {
        start = new Date(currentYear, monthNum, 1); // First day of month
        end = new Date(currentYear, monthNum + 1, 0); // Last day of month
      } else {
        // Default to last 3 months if month is not recognized
        start = new Date(new Date().setMonth(new Date().getMonth() - 3));
        end = new Date();
      }
    }
    
    // Update filter options with new date range
    setFilterOptions(prev => {
      // Only update if the date range is actually different
      if (
        prev.dateRange &&
        prev.dateRange.start &&
        prev.dateRange.end &&
        prev.dateRange.start.getTime() === start.getTime() &&
        prev.dateRange.end.getTime() === end.getTime()
      ) {
        return prev;
      }
      return {
        ...prev,
        dateRange: { start, end }
      };
    });
  };
  
  // Function to refresh data for specified platform and brand
  const refreshData = async (platform?: Platform, brand?: Brand) => {
    // Refreshing data for platform and brand
    setIsLoading(true);
    setError(null);
    
    try {
      // Determine which brands to refresh
      const brandsToRefresh = brand ? [brand] : selectedBrands;

      
      // Determine which platforms to refresh
      const refreshInstagram = !platform || platform === 'Instagram' || platform === 'All' as Platform;
      const refreshTikTok = !platform || platform === 'TikTok' || platform === 'All' as Platform;
      
      // Create copies of the current data to update
      const updatedInstagram = { ...socialData.instagram };
      const updatedTiktok = { ...socialData.tiktok };
      const updatedInstagramLastFetched = { ...socialData.lastFetched.Instagram };
      const updatedTiktokLastFetched = { ...socialData.lastFetched.TikTok };
      
      // Fetch Instagram data for all brands if needed
      if (refreshInstagram) {
        const instagramPromises = brandsToRefresh.map(async (brand) => {
          try {

            return await fetchInstagramDataFromFile(brand);
          } catch (error) {
            // Error refreshing Instagram data
            return { brand, posts: [] };
          }
        });
        const instagramResults = await Promise.all(instagramPromises);

        instagramResults.forEach((data: InstagramData, index: number) => {
          const brand = brandsToRefresh[index];

          updatedInstagram[brand] = data;
          updatedInstagramLastFetched[brand] = new Date();
        });
      }

      // Fetch TikTok data for all brands if needed
      if (refreshTikTok) {
        const tiktokPromises = brandsToRefresh.map(async (brand) => {
          try {

            return await fetchTikTokDataFromFile(brand);
          } catch (error) {
            // Error refreshing TikTok data
            return { brand, posts: [] };
          }
        });
        const tiktokResults = await Promise.all(tiktokPromises);

        tiktokResults.forEach((data: TikTokData, index: number) => {
          const brand = brandsToRefresh[index];

          updatedTiktok[brand] = data;
          updatedTiktokLastFetched[brand] = new Date();
        });
      }
      
      // Recalculate sentiment scores using -5 to +5 scale
      const dataToUpdate = {
        instagram: updatedInstagram,
        tiktok: updatedTiktok,
        lastFetched: {
          Instagram: updatedInstagramLastFetched,
          TikTok: updatedTiktokLastFetched
        }
      };
      
      // Apply sentiment recalculation with -5 to +5 scale
      recalculateAllSentiment(dataToUpdate.instagram, dataToUpdate.tiktok);
      console.log('Sentiment scores recalculated with -5 to +5 scale');
      
      // Update the social data state with the refreshed data and recalculated sentiment
      setSocialData(dataToUpdate);
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error refreshing data'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a filtered version of the social data based on current filter options
  const [filteredSocialData, setFilteredSocialData] = useState<SocialData>(initialSocialData);
  
  // Initial data load when component mounts
  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
        // Create promises for all brands using local Excel files
        // Since fetchInstagramDataFromFile and fetchTikTokDataFromFile are now async functions
        // we need to call them with await or use Promise.all
        const instagramPromises = selectedBrands.map(async (brand) => {
          try {
            return await fetchInstagramDataFromFile(brand);
          } catch (error) {
            return { brand, posts: [] };
          }
        });
        
        const tiktokPromises = selectedBrands.map(async (brand) => {
          try {
            return await fetchTikTokDataFromFile(brand);
          } catch (error) {
            return { brand, posts: [] };
          }
        });
        
        // Execute all promises in parallel
        const [instagramResults, tiktokResults] = await Promise.all([
          Promise.all(instagramPromises),
          Promise.all(tiktokPromises)
        ]);
        
        // Update the social data with the results
        const updatedInstagram: Record<Brand, InstagramData | null> = {} as Record<Brand, InstagramData | null>;
        const updatedTiktok: Record<Brand, TikTokData | null> = {} as Record<Brand, TikTokData | null>;
        const updatedInstagramLastFetched: Record<Brand, Date | null> = {} as Record<Brand, Date | null>;
        const updatedTiktokLastFetched: Record<Brand, Date | null> = {} as Record<Brand, Date | null>;
        
        // Process Instagram results
        instagramResults.forEach((data, index) => {
          const brand = selectedBrands[index];
          updatedInstagram[brand] = data;
          updatedInstagramLastFetched[brand] = new Date();
        });
        
        // Process TikTok results
        tiktokResults.forEach((data, index) => {
          const brand = selectedBrands[index];
          updatedTiktok[brand] = data;
          updatedTiktokLastFetched[brand] = new Date();
        });
        
        // Update the social data state
        const newSocialData = {
          instagram: updatedInstagram,
          tiktok: updatedTiktok,
          lastFetched: {
            Instagram: updatedInstagramLastFetched,
            TikTok: updatedTiktokLastFetched
          }
        };
        
        setSocialData(newSocialData);
    } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error loading initial data'));
    } finally {
        setIsLoading(false);
    }
  };
  
  // Remove this effect as it's causing data to be overwritten

  // Load initial data for selected brands
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // Effect to sync date range when selected month changes
  useEffect(() => {
    if (!isLoading && !error && filterOptions.selectedMonth) {
      syncDateRangeWithMonth(filterOptions.selectedMonth);
    }
  }, [filterOptions.selectedMonth, isLoading, error, syncDateRangeWithMonth, setFilterOptions]);
  
  // Effect to apply filters when relevant dependencies change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isLoading || error) return;
    
    const filtered = filterData();
    setFilteredSocialData(filtered);
  }, [
    filterOptions.platform, 
    filterOptions.brands, 
    filterOptions.dateRange,
    filterOptions.selectedMonth, // Added selectedMonth
    socialData, 
    isLoading, 
    error
  ]);

  // Provide the context value with filtered data
  const value = {
    socialData: filteredSocialData, // Use filtered data here instead of raw data
    isLoading,
    error,
    filterOptions,
    setFilterOptions,
    refreshData,
    selectedBrands,
    setSelectedBrands,
    darkMode,
    toggleDarkMode
  };

  return <SocialDataContext.Provider value={value}>{children}</SocialDataContext.Provider>;
}

// Hook to use the social data context
export const useSocialData = () => {
  const context = useContext(SocialDataContext);
  if (context === undefined) {
    throw new Error('useSocialData must be used within a SocialDataProvider');
  }
  return context;
};