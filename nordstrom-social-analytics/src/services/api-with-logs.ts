import axios from 'axios';
import { Brand, Platform, InstagramData, TikTokData } from '../types';

console.log("api.ts loaded");

// Google Sheet ID
const SHEET_ID = '1iz9ew2n6cTRv-LSy432okxa6XZYBsVHdzM10_gLlWCA';

// API base URL
const BASE_URL = `https://opensheet.elk.sh/${SHEET_ID}`;

// Sheet name mapping
const SHEET_NAMES: Record<Platform, Record<Brand, string>> = {
  Instagram: {
    'Nordstrom': 'Instagram - Nordstrom',
    'Macys': 'Instagram - Macys',
    'Saks': 'Instagram - Saks',  // Updated from 'Sakes' to 'Saks'
    'Bloomingdales': 'Instagram - Bloomingdales',
    'Tjmaxx': 'Instagram - Tjmaxx',
    'Sephora': 'Instagram - Sephora',
    'Ulta': 'Instagram - Ulta',
    'Aritzia': 'Instagram - Aritzia',
    'American Eagle': 'Instagram - American Eagle',
    'Walmart': 'Instagram - Walmart',
    'Amazon Beauty': 'Instagram - Amazon Beauty',
    'Revolve': 'Instagram - Revolve'
  },
  TikTok: {
    'Nordstrom': 'TikTok - Nordstrom',
    'Macys': 'TikTok - Macys',
    'Saks': 'TikTok - Saks',  // Updated from 'Sakes' to 'Saks'
    'Bloomingdales': 'TikTok - Bloomingdales',
    'Tjmaxx': 'TikTok - Tjmaxx',
    'Sephora': 'TikTok - Sephora',
    'Ulta': 'TikTok - Ulta',
    'Aritzia': 'TikTok - Aritzia',
    'American Eagle': 'TikTok - American Eagle',
    'Walmart': 'TikTok - Walmart',
    'Amazon Beauty': 'TikTok - Amazon Beauty',
    'Revolve': 'TikTok - Revolve'
  }
};

// List of all brands
export const ALL_BRANDS: Brand[] = [
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

// Combined sheet name format for fetching all data at once
const getCombinedSheetNames = (brand: Brand): string[] => {
  return [SHEET_NAMES.Instagram[brand], SHEET_NAMES.TikTok[brand]];
};

// Combined cache key generator
const getCombinedCacheKey = (brand: Brand): string => {
  return `combined-data-${brand}`;
};

// Function to get combined data from cache
const getCombinedDataFromCache = (brand: Brand): { instagram: InstagramData | null, tiktok: TikTokData | null } | null => {
  try {
    const cacheKey = getCombinedCacheKey(brand);
    const cachedDataString = localStorage.getItem(cacheKey);
    
    if (cachedDataString) {
      const cachedData = JSON.parse(cachedDataString);
      const cacheTimestamp = new Date(cachedData.timestamp);
      const now = new Date();
      
      // Check if cache is valid (less than 1 hour old)
      if (now.getTime() - cacheTimestamp.getTime() < 3600000) {
        console.log(`[API] Valid combined cache found for ${brand}`);
        return cachedData.data;
      }
      
      console.log(`[API] Expired combined cache for ${brand}`);
    }
  } catch (error) {
    console.error(`[API] Error reading combined cache for ${brand}:`, error);
  }
  
  return null;
};

// Function to save combined data to cache
const saveCombinedDataToCache = (brand: Brand, data: { instagram: InstagramData, tiktok: TikTokData }): void => {
  try {
    const cacheKey = getCombinedCacheKey(brand);
    const cacheData = {
      timestamp: new Date().toISOString(),
      data
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`[API] Combined data saved to cache for ${brand}`);
  } catch (error) {
    console.error(`[API] Error saving combined data to cache for ${brand}:`, error);
  }
};

// Function to fetch data from a specific sheet
const fetchSheetData = async (sheetName: string) => {
  console.log(`[API] Fetching data from sheet: ${sheetName}`);
  try {
    const response = await axios.get(`${BASE_URL}/${encodeURIComponent(sheetName)}`);
    console.log(`[API] Sheet ${sheetName} response status:`, response.status);
    return response.data;
  } catch (error) {
    console.error(`[API] Error fetching data from sheet ${sheetName}:`, error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
};

// Function to fetch both Instagram and TikTok data for a brand in parallel
const fetchCombinedData = async (brand: Brand): Promise<{ instagram: InstagramData, tiktok: TikTokData }> => {
  console.log(`[API] Fetching combined data for brand: ${brand}`);
  
  try {
    // Use existing functions in parallel
    const [instagramData, tiktokData] = await Promise.all([
      fetchInstagramData(brand),
      fetchTikTokData(brand)
    ]);
    
    console.log(`[API] Combined data fetched successfully for ${brand}`, {
      instagramPostCount: instagramData.posts.length,
      tiktokPostCount: tiktokData.posts.length
    });
    
    return {
      instagram: instagramData,
      tiktok: tiktokData
    };
  } catch (error) {
    console.error(`[API] Error fetching combined data for ${brand}:`, error);
    // Return empty data
    return {
      instagram: { brand, posts: [] },
      tiktok: { brand, posts: [] }
    };
  }
};

// Function to fetch Instagram data for a specific brand
export const fetchInstagramData = async (brand: Brand): Promise<InstagramData> => {
  console.log(`[API] fetchInstagramData called for brand: ${brand}`);
  const sheetName = SHEET_NAMES.Instagram[brand];
  const data = await fetchSheetData(sheetName);
  console.log(`[API] Raw Instagram data for ${brand}:`, { count: data.length, sample: data[0] });
  
  // Log the raw data structure for debugging
  if (data.length > 0) {
    console.log(`[API] Instagram raw data sample for ${brand}:`, {
      rawColumns: Object.keys(data[0]),
      rawFirstItem: data[0]
    });
  }
  
  // Log all available columns for debugging
  if (data.length > 0) {
    console.log(`[API] Instagram data columns for ${brand}:`, Object.keys(data[0]));
  }
  
  // Process and transform the data according to our InstagramData type
  const posts = data.map((post: any) => {
    // Extract hashtags from any column that contains 'hashtags' in the name
    const hashtags: string[] = [];
    
    // First check if there's a single hashtags field
    if (post.hashtags && typeof post.hashtags === 'string') {
      post.hashtags.split(',').forEach((tag: string) => {
        if (tag.trim()) hashtags.push(tag.trim());
      });
    } else {
      // Look for any column that contains 'hashtags' in the name
      Object.keys(post).forEach(key => {
        if (key.includes('hashtags') && post[key] && typeof post[key] === 'string' && post[key].trim() !== '') {
          hashtags.push(post[key].trim());
        }
      });
    }
    
    // Extract mentions from any column that contains 'mentions' in the name
    const mentions: string[] = [];
    
    // First check if there's a single mentions field
    if (post.mentions && typeof post.mentions === 'string') {
      post.mentions.split(',').forEach((mention: string) => {
        if (mention.trim()) mentions.push(mention.trim());
      });
    } else {
      // Look for any column that contains 'mentions' in the name
      Object.keys(post).forEach(key => {
        if (key.includes('mentions') && post[key] && typeof post[key] === 'string' && post[key].trim() !== '') {
          mentions.push(post[key].trim());
        }
      });
    }
    
    console.log(`[API] Extracted for post: hashtags=${hashtags.length}, mentions=${mentions.length}`);
    
    // Ensure timestamp is valid - if not provided or invalid, use current date
    let timestamp = post.timestamp;
    if (!timestamp || !Date.parse(timestamp)) {
      // Try to find any field that might be a date
      const possibleDateFields = ['createTime', 'createTimeISO', 'date', 'createdAt'];
      for (const field of possibleDateFields) {
        if (post[field] && Date.parse(post[field])) {
          timestamp = post[field];
          console.log(`[API] Using alternative date field '${field}' for Instagram post:`, post[field]);
          break;
        }
      }
      
      // If still no valid date, use current date
      if (!timestamp || !Date.parse(timestamp)) {
        timestamp = new Date().toISOString();
        console.log(`[API] No valid date field found for Instagram post, using current date:`, post);
      }
    }
    
    // Log the timestamp for debugging
    console.log(`[API] Using timestamp for Instagram post:`, {
      original: post.timestamp,
      parsed: timestamp,
      date: new Date(timestamp).toISOString()
    });
    
    // Determine if this is a video post based on available fields
    const isVideo = 
      (post.videoViewCount && parseFloat(post.videoViewCount) > 0) || 
      (post.videoPlayCount && parseFloat(post.videoPlayCount) > 0) || 
      post.type === 'video' || 
      post.mediaType === 'video';
    
    console.log(`[API] Post is ${isVideo ? 'video' : 'image'} type:`, {
      videoViewCount: post.videoViewCount,
      videoPlayCount: post.videoPlayCount,
      type: post.type,
      mediaType: post.mediaType
    });
    
    const transformedPost = {
      id: `${brand}-ig-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      shortcode: post.url || post.shortcode || '',
      caption: post.caption || '',
      likesCount: parseFloat(post.likesCount || '0'),
      commentsCount: parseFloat(post.commentsCount || '0'),
      locationName: post.locationName || undefined,
      isSponsored: post.isSponsored === 'TRUE' || post.isSponsored === true,
      mediaType: post.mediaType || (isVideo ? 'video' : 'image'),
      mediaUrl: post.url || post.mediaUrl || '',
      mentions,
      hashtags,
      thumbnailUrl: post.url || post.thumbnailUrl || '',
      type: isVideo ? 'video' : 'image',
      videoViewCount: isVideo ? parseFloat(post.videoViewCount || '0') : undefined,
      videoPlayCount: isVideo ? parseFloat(post.videoPlayCount || '0') : undefined
    };
    
    return transformedPost;
  });

  const result = {
    brand,
    posts
  };
  console.log(`[API] Processed Instagram data for ${brand}:`, { postCount: posts.length });
  return result;
};

// Function to fetch TikTok data for a specific brand
export const fetchTikTokData = async (brand: Brand): Promise<TikTokData> => {
  console.log(`[API] fetchTikTokData called for brand: ${brand}`);
  const sheetName = SHEET_NAMES.TikTok[brand];
  const data = await fetchSheetData(sheetName);
  console.log(`[API] Raw TikTok data for ${brand}:`, { count: data.length, sample: data[0] });
  
  // Log the raw data structure for debugging
  if (data.length > 0) {
    console.log(`[API] TikTok raw data sample for ${brand}:`, {
      rawColumns: Object.keys(data[0]),
      rawFirstItem: data[0]
    });
  }
  
  // Define interface for hashtag structure
  interface TikTokHashtag {
    id: string;
    name: string;
  }
  
  // Process and transform the data according to our TikTokData type
  const posts = data.map((post: any) => {
    // Extract hashtags - they can come in different formats depending on the data source
    const hashtags: TikTokHashtag[] = [];
    
    // Check if hashtags are in a direct field as an array or object
    if (post.hashtags) {
      if (typeof post.hashtags === 'string') {
        // Handle comma-separated string format
        post.hashtags.split(',').forEach((tag: string) => {
          if (tag.trim()) {
            hashtags.push({
              id: `hashtag-${Math.random().toString(36).substr(2, 9)}`,
              name: tag.trim()
            });
          }
        });
      } else {
        // Try to extract from nested objects if it's already an array
        try {
          const parsedHashtags = typeof post.hashtags === 'string' ? JSON.parse(post.hashtags) : post.hashtags;
          if (Array.isArray(parsedHashtags)) {
            parsedHashtags.forEach((tag: any) => {
              if (typeof tag === 'string') {
                hashtags.push({
                  id: `hashtag-${Math.random().toString(36).substr(2, 9)}`,
                  name: tag
                });
              } else if (tag && tag.name) {
                hashtags.push({
                  id: tag.id || `hashtag-${Math.random().toString(36).substr(2, 9)}`,
                  name: tag.name
                });
              }
            });
          }
        } catch (error) {
          console.log(`[API] Error parsing hashtags for TikTok post:`, error);
        }
      }
    } else {
      // Look for any column that contains 'hashtags' in the name
      Object.keys(post).forEach(key => {
        if (key.includes('hashtags')) {
          // Check if it's a hashtag name field (e.g., hashtags/0/name)
          if (key.includes('/name') && post[key] && typeof post[key] === 'string' && post[key].trim() !== '') {
            hashtags.push({
              id: `hashtag-${Math.random().toString(36).substr(2, 9)}`,
              name: post[key].trim()
            });
          } 
          // Check if it's a direct hashtag field (e.g., hashtags/0)
          else if (!key.includes('/') && post[key] && typeof post[key] === 'string' && post[key].trim() !== '') {
            hashtags.push({
              id: `hashtag-${Math.random().toString(36).substr(2, 9)}`,
              name: post[key].trim()
            });
          }
        }
      });
    }
    
    console.log(`[API] Extracted ${hashtags.length} hashtags for TikTok post`);
    
    // Handle dates - try multiple possible date fields
    let createTime = null;
    
    // Check for createTime in scientific notation (e.g., 1.75E+09) or as a number
    if (post.createTime && !isNaN(parseFloat(post.createTime))) {
      try {
        // Handle scientific notation (e.g., 1.74E+09) or regular number
        const timestamp = parseFloat(post.createTime);
        // Check if the timestamp is in seconds (typical Unix timestamp) or milliseconds
        // If it's less than 20 billion, it's likely in seconds and needs conversion to ms
        const timestampMs = timestamp < 20000000000 ? timestamp * 1000 : timestamp;
        createTime = new Date(timestampMs).toISOString();
        console.log(`[API] Converted TikTok timestamp from ${post.createTimeISO} to ${createTime}`);
      } catch (error) {
        console.error(`[API] Error converting TikTok timestamp from createTimeISO:`, error);
      }
    } 
    // Check for ISO format date
    else if (post.createTimeISO && typeof post.createTimeISO === 'string') {
      try {
        const date = new Date(post.createTimeISO);
        if (!isNaN(date.getTime())) {
          createTime = post.createTimeISO;
          console.log(`[API] Using createTimeISO for TikTok post:`, createTime);
        }
      } catch (error) {
        console.error(`[API] Error parsing createTimeISO:`, error);
      }
    }
    
    // If still no valid date, try other possible date fields
    if (!createTime) {
      const possibleDateFields = ['timestamp', 'date', 'createdAt', 'publishedAt'];
      for (const field of possibleDateFields) {
        if (post[field] && typeof post[field] === 'string') {
          try {
            const date = new Date(post[field]);
            if (!isNaN(date.getTime())) {
              createTime = post[field];
              console.log(`[API] Using alternative date field '${field}' for TikTok post:`, createTime);
              break;
            }
          } catch (error) {
            console.error(`[API] Error parsing date from ${field}:`, error);
          }
        }
      }
    }
    
    // If still no valid date, use current date as fallback
    if (!createTime) {
      createTime = new Date().toISOString();
      console.log(`[API] No valid date found for TikTok post, using current date`);
    }
    
    // Log the date for debugging
    console.log(`[API] Final TikTok date:`, {
      createTime,
      date: new Date(createTime).toISOString(),
      month: new Date(createTime).getMonth() + 1 // +1 because getMonth() is 0-indexed
    });
    
    // Handle authorMeta - can be nested or flat
    let authorName = '';
    let authorId = '';
    let fans = 0;
    
    if (post.authorMeta) {
      // It's already in the expected format
      if (typeof post.authorMeta === 'object') {
        authorName = post.authorMeta.name || '';
        authorId = post.authorMeta.id || '';
        fans = parseInt(post.authorMeta.fans || '0', 10);
      } else if (typeof post.authorMeta === 'string') {
        // If it's a string, try to parse it as JSON
        try {
          const parsed = JSON.parse(post.authorMeta);
          authorName = parsed.name || '';
          authorId = parsed.id || '';
          fans = parseInt(parsed.fans || '0', 10);
        } catch (e) {
          authorName = post.authorMeta; // Use as is if can't parse
        }
      }
    } else {
      // Check for flat fields or old format
      authorName = post['authorMeta/name'] || post.authorName || '';
      authorId = post['authorMeta/id'] || post.authorId || post.input || '';
      fans = parseInt(post['authorMeta/fans'] || post.fans || '0', 10);
    }
    
    // Extract relevant values with fallbacks
    const transformedPost = {
      id: `${brand}-tt-${Math.random().toString(36).substr(2, 9)}`,
      text: post.text || '',
      createTime,
      authorMeta: {
        id: authorId,
        name: authorName,
        fans: fans
      },
      musicMeta: {
        musicId: post.musicId || '', 
        musicName: post.musicName || ''
      },
      playCount: parseFloat(post.playCount || '0'),
      diggCount: parseFloat(post.diggCount || '0'),
      shareCount: parseFloat(post.shareCount || '0'),
      commentCount: parseFloat(post.commentCount || '0'),
      collectCount: parseFloat(
        post.collectCount ??
        post['collect_count'] ??
        post['stats/collectCount'] ??
        post['engagement/collectCount'] ??
        '0'
      ),
      hashtags,
      locationMeta: {
        city: post.city || post['locationMeta/city'] || '',
        countryCode: post.countryCode || post['locationMeta/countryCode'] || ''
      },
      videoUrl: post.videoUrl || '',
      coverUrl: post.coverUrl || ''
    };
    
    return transformedPost;
  });

  const result = {
    brand,
    posts
  };
  console.log(`[API] motorola Processed TikTok data for ${brand}:`, { postCount: posts.length });
  return result;
};

// Function to check if data is cached in localStorage
export const getDataFromCache = (platform: Platform, brand: Brand) => {
  const cacheKey = `${platform.toLowerCase()}-${brand.toLowerCase().replace(' ', '-')}`;
  console.log(`[API] Checking cache for ${platform} data for ${brand}, key: ${cacheKey}`);
  const cachedData = localStorage.getItem(cacheKey);
  
  if (cachedData) {
    try {
      const { data, timestamp } = JSON.parse(cachedData);
      // Check if data is stale (older than 24 hours)
      const isStale = new Date().getTime() - timestamp > 24 * 60 * 60 * 1000;
      
      if (!isStale) {
        console.log(`[API] Cache hit for ${platform} data for ${brand}, data is fresh`);
        return data;
      }
      console.log(`[API] Cache hit for ${platform} data for ${brand}, but data is stale`);
    } catch (error) {
      console.error('[API] Error parsing cached data:', error);
    }
  } else {
    console.log(`[API] Cache miss for ${platform} data for ${brand}`);
  }
  
  return null;
};

// Function to save data to localStorage cache
export const saveDataToCache = (platform: Platform, brand: Brand, data: any) => {
  const cacheKey = `${platform.toLowerCase()}-${brand.toLowerCase().replace(' ', '-')}`;
  const cacheData = {
    data,
    timestamp: new Date().getTime()
  };
  
  console.log(`[API] Saving ${platform} data for ${brand} to cache, key: ${cacheKey}`);
  try {
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`[API] Successfully saved ${platform} data for ${brand} to cache`);
  } catch (error) {
    console.error('[API] Error saving data to cache:', error);
  }
};

// Function to fetch Instagram data with caching
export async function fetchInstagramDataWithCache(brand: Brand): Promise<any> {
  console.log("[API] fetchInstagramDataWithCache called for brand:", brand);
  console.log("[API] Instagram fetch timestamp:", new Date().toISOString());
  const cachedData = getDataFromCache('Instagram', brand);
  
  if (cachedData) {
    console.log('[API] Using cached Instagram data for', brand);
    return cachedData;
  }
  
  console.log('[API] No cache or stale cache for Instagram data, fetching fresh data for', brand);
  const data = await fetchInstagramData(brand);
  console.log('[API] Instagram data fetched for', brand, { postCount: data.posts.length });
  saveDataToCache('Instagram', brand, data);
  
  return data;
};

// Function to fetch TikTok data with caching
export const fetchTikTokDataWithCache = async (brand: Brand): Promise<TikTokData> => {
  console.log("[API] fetchTikTokDataWithCache called for brand:", brand);
  console.log("[API] TikTok fetch timestamp:", new Date().toISOString());
  const cachedData = getDataFromCache('TikTok', brand);
  
  if (cachedData) {
    console.log('[API] Using cached TikTok data for', brand);
    return cachedData;
  }
  
  console.log('[API] No cache or stale cache for TikTok data, fetching fresh data for', brand);
  const data = await fetchTikTokData(brand);
  console.log('[API] TikTok data fetched for', brand, { postCount: data.posts.length });
  saveDataToCache('TikTok', brand, data);
  
  return data;
};

// Function to fetch both Instagram and TikTok data with caching in a single operation
export const fetchCombinedDataWithCache = async (brand: Brand): Promise<{ instagram: InstagramData; tiktok: TikTokData }> => {
  console.log("[API] fetchCombinedDataWithCache called for brand:", brand);
  console.log("[API] Combined fetch timestamp:", new Date().toISOString());
  
  // Check cache first
  const cachedData = getCombinedDataFromCache(brand);
  if (cachedData && cachedData.instagram && cachedData.tiktok) {
    console.log('[API] Using cached combined data for', brand);
    return {
      instagram: cachedData.instagram,
      tiktok: cachedData.tiktok
    };
  }
  
  console.log('[API] No cache or stale cache for combined data, fetching fresh data for', brand);
  const data = await fetchCombinedData(brand);
  
  // Log data info including the actual months present
  if (data.instagram && data.instagram.posts && data.instagram.posts.length > 0) {
    const monthsPresent = new Set();
    data.instagram.posts.forEach(post => {
      if (post.timestamp) {
        try {
          const date = new Date(post.timestamp);
          if (!isNaN(date.getTime())) {
            monthsPresent.add(date.toLocaleString('default', { month: 'long' }));
          }
        } catch (e) {}
      }
    });
    console.log(`[API] Instagram months present for ${brand}:`, Array.from(monthsPresent));
  }
  
  if (data.tiktok && data.tiktok.posts && data.tiktok.posts.length > 0) {
    const monthsPresent = new Set();
    data.tiktok.posts.forEach(post => {
      if (post.createTime) {
        try {
          let date;
          if (!isNaN(parseFloat(post.createTime))) {
            date = new Date(parseFloat(post.createTime) * 1000);
          } else {
            date = new Date(post.createTime);
          }
          
          if (!isNaN(date.getTime())) {
            monthsPresent.add(date.toLocaleString('default', { month: 'long' }));
          }
        } catch (e) {}
      }
    });
    console.log(`[API] TikTok months present for ${brand}:`, Array.from(monthsPresent));
  }
  
  // Save to cache
  saveCombinedDataToCache(brand, data);
  
  return data;
};
