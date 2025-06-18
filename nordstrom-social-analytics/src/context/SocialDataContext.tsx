import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  // Global filters (with aliases for backward compatibility)
  globalFilterOptions: FilterOptions;
  filterOptions: FilterOptions; // Alias for globalFilterOptions
  setGlobalFilterOptions: (options: FilterOptions) => void;
  setFilterOptions: (options: FilterOptions) => void; // Alias for setGlobalFilterOptions
  // Local filters
  getLocalFilterOptions: (componentId: string) => FilterOptions;
  setLocalFilterOptions: (componentId: string, options: Partial<FilterOptions>) => void;
  // Data methods
  refreshData: (platform?: Platform, brand?: Brand) => Promise<void>;
  selectedBrands: Brand[];
  setSelectedBrands: (brands: Brand[]) => void;
  // UI state
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
  
  // Global filter state
  const [globalFilterOptions, setGlobalFilterOptions] = useState<FilterOptions>(initialFilterOptions);
  
  // Local filter states - stores overrides for specific components
  const [localFilterOverrides, setLocalFilterOverrides] = useState<Record<string, Partial<FilterOptions>>>({});
  
  const [selectedBrands, setSelectedBrands] = useState<Brand[]>(ALL_BRANDS);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  // Get filter options for a specific component, falling back to global options
  const getLocalFilterOptions = (componentId: string): FilterOptions => ({
    ...globalFilterOptions,
    ...(localFilterOverrides[componentId] || {})
  });
  
  // Update local filter options for a specific component
  const setLocalFilterOptions = (componentId: string, options: Partial<FilterOptions>) => {
    setLocalFilterOverrides(prev => ({
      ...prev,
      [componentId]: {
        ...(prev[componentId] || {}),
        ...options
      }
    }));
  };

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
  const filterData = (options: FilterOptions) => {
    // Create a deep copy of the original data (un-filtered)
    const loadedData: SocialData = JSON.parse(JSON.stringify(socialData));
    
    // Create a new filtered dataset
    const filteredData: SocialData = {
      instagram: {} as Record<Brand, InstagramData | null>,
      tiktok: {} as Record<Brand, TikTokData | null>,
      lastFetched: { ...loadedData.lastFetched }
    };
    
    // Always populate both platforms for selected brands initially
    // Filter out brands that don't have any posts for the selected platform
    if (options.platform === 'Instagram' || options.platform === 'All') {
      Object.keys(filteredData.instagram).forEach((brand: string) => {
        const brandKey = brand as Brand;
        if (!filteredData.instagram[brandKey]?.posts?.length) {
          delete filteredData.instagram[brandKey];
        }
      });
    }
    
    if (options.platform === 'TikTok' || options.platform === 'All') {
      Object.keys(filteredData.tiktok).forEach((brand: string) => {
        const brandKey = brand as Brand;
        if (!filteredData.tiktok[brandKey]?.posts?.length) {
          delete filteredData.tiktok[brandKey];
        }
      });
    }

    // Now filter by months for each platform
    const monthMap: Record<string, number> = {
      'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
      'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
    };
    
    // Filter Instagram posts by month
    for (const brand of options.brands) {
      const brandData = filteredData.instagram[brand];
      if (brandData?.posts?.length) {
        // Filter posts by selected months and date range
        const filteredPosts = brandData.posts.filter((post: InstagramPost) => {
          if (!post.timestamp) return false;
          
          try {
            if (!post.timestamp) return false;
            const date = new Date(post.timestamp);
            if (isNaN(date.getTime())) return false;
            
            // Check if the post date is within the date range
            const isInDateRange = (!options.dateRange.start || date >= options.dateRange.start) && 
                                (!options.dateRange.end || date <= options.dateRange.end);
            
            // Check if the post month matches the selected month or is part of "All (Feb-May)"
            const monthNum = date.getMonth();
            const monthName = Object.keys(monthMap).find(m => monthMap[m] === monthNum);
            
            // If "All (Feb-May)" is selected, include all posts from Feb-May
            const isSelectedMonth = options.selectedMonth === 'All (Feb-May)' ? 
              (monthNum >= 1 && monthNum <= 4) : // Feb (1) to May (4)
              monthName === options.selectedMonth;
            
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
    for (const brand of options.brands) {
      const brandData = filteredData.tiktok[brand];
      if (brandData?.posts?.length) {
        // Filter posts by selected months and date range
        const filteredPosts = brandData.posts.filter((post: TikTokPost) => {
          if (!post.createTime) return false;
          
          try {
            const date = new Date(post.createTime);
            if (isNaN(date.getTime())) return false;
            
            // Check if the post date is within the date range
            const isInDateRange = (!options.dateRange.start || date >= options.dateRange.start) && 
                                (!options.dateRange.end || date <= options.dateRange.end);
            
            // Check if the post month matches the selected month or is part of "All (Feb-May)"
            const monthNum = date.getMonth();
            const monthName = Object.keys(monthMap).find(m => monthMap[m] === monthNum);
            
            // If "All (Feb-May)" is selected, include all posts from Feb-May
            const isSelectedMonth = options.selectedMonth === 'All (Feb-May)' ? 
              (monthNum >= 1 && monthNum <= 4) : // Feb (1) to May (4)
              monthName === options.selectedMonth;
            
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
  
  // Sync date range when selected month changes
  const syncDateRangeWithMonth = useCallback((month: string) => {
    const updateDateRange = (startDate: Date, endDate: Date) => {
      setGlobalFilterOptions((prev: FilterOptions) => ({
        ...prev,
        dateRange: {
          start: startDate,
          end: endDate
        },
        selectedMonth: month
      }));
    };

    if (month === 'All (Feb-May)') {
      updateDateRange(new Date('2023-02-01'), new Date('2023-05-31'));
      return;
    }
    
    const monthMap: Record<string, number> = {
      'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
      'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
    };
    
    const monthNum = monthMap[month];
    if (monthNum === undefined) return;
    
    const year = 2023; // Assuming 2023 data
    const start = new Date(year, monthNum, 1);
    const end = new Date(year, monthNum + 1, 0);
    
    updateDateRange(start, end);
  }, [setGlobalFilterOptions]);
  
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
    if (!isLoading && !error && globalFilterOptions.selectedMonth) {
      syncDateRangeWithMonth(globalFilterOptions.selectedMonth);
    }
  }, [globalFilterOptions.selectedMonth, isLoading, error, syncDateRangeWithMonth]);
  
  // Effect to apply filters when relevant dependencies change
  useEffect(() => {
    if (isLoading || error) return;
    
    const filtered = filterData(globalFilterOptions);
    setFilteredSocialData(filtered);
  }, [
    globalFilterOptions.platform, 
    globalFilterOptions.brands, 
    globalFilterOptions.dateRange,
    globalFilterOptions.selectedMonth,
    socialData, 
    isLoading, 
    error
  ]);

  // Provide the context value with filtered data
  const value = {
    socialData,
    isLoading,
    error,
    // Global filters
    globalFilterOptions,
    filterOptions: globalFilterOptions, // Alias for backward compatibility
    setGlobalFilterOptions,
    setFilterOptions: setGlobalFilterOptions, // Alias for backward compatibility
    // Local filters
    getLocalFilterOptions,
    setLocalFilterOptions,
    // Data methods
    refreshData,
    selectedBrands,
    setSelectedBrands,
    // UI state
    darkMode,
    toggleDarkMode,
  };

  return <SocialDataContext.Provider value={value}>{children}</SocialDataContext.Provider>;
}

export const useSocialData = () => {
  const context = useContext(SocialDataContext);
  if (context === undefined) {
    throw new Error('useSocialData must be used within a SocialDataProvider');
  }
  return context;
};