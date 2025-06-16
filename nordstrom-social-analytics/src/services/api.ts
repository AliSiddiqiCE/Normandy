import axios from 'axios';
import { Brand, Platform, InstagramData, TikTokData } from '../types';

// Single console.log to show data from API will be added to fetchSheetData function

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

// Function to fetch data from a specific sheet
const fetchSheetData = async (sheetName: string) => {
  try {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    
    // Configure request with cache-busting headers and parameters
    const response = await axios.get(`${BASE_URL}/${encodeURIComponent(sheetName)}`, {
      params: {
        _t: timestamp // Add timestamp as query parameter
      },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    console.log(`API Data from ${sheetName} at ${timestamp}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${sheetName}:`, error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
};

// Function to fetch Instagram data for a specific brand
export const fetchInstagramData = async (brand: Brand): Promise<InstagramData> => {
  const sheetName = SHEET_NAMES.Instagram[brand];
  const data = await fetchSheetData(sheetName);
  
  // Process and transform the data according to our InstagramData type
  const posts = data.map((post: any) => {
    // Extract hashtags from multiple columns
    const hashtags = [];
    for (let i = 0; i <= 18; i++) {
      if (post[`hashtags/${i}`] && post[`hashtags/${i}`].trim() !== '') {
        hashtags.push(post[`hashtags/${i}`]);
      }
    }
    
    // Extract mentions from multiple columns
    const mentions = [];
    for (let i = 0; i <= 11; i++) {
      if (post[`mentions/${i}`] && post[`mentions/${i}`].trim() !== '') {
        mentions.push(post[`mentions/${i}`]);
      }
    }
    
    // Determine if this is a video post based on available fields
    const isVideo = post.videoViewCount > 0 || post.videoPlayCount > 0 || post.type === 'video' || post.mediaType === 'video';
    
    return {
      id: `${brand}-ig-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: post.timestamp || new Date().toISOString(),
      shortcode: post.url || '',
      caption: post.caption || '',
      likesCount: parseInt(post.likesCount || '0', 10),
      commentsCount: parseInt(post.commentsCount || '0', 10),
      locationName: post.locationName || undefined,
      isSponsored: post.isSponsored === 'TRUE' || post.isSponsored === true,
      mediaType: post.mediaType || (isVideo ? 'video' : 'image'),
      mediaUrl: post.url || '',
      mentions,
      hashtags,
      thumbnailUrl: post.url || '',
      type: isVideo ? 'video' : 'image',
      videoViewCount: isVideo ? parseInt(post.videoViewCount || '0', 10) : undefined,
      videoPlayCount: isVideo ? parseInt(post.videoPlayCount || '0', 10) : undefined
    };
  });

  return {
    brand,
    posts
  };
};

// Function to fetch TikTok data for a specific brand
export const fetchTikTokData = async (brand: Brand): Promise<TikTokData> => {
  const sheetName = SHEET_NAMES.TikTok[brand];
  const data = await fetchSheetData(sheetName);
  
  // Process and transform the data according to our TikTokData type
  const posts = data.map((post: any) => {
    // Extract hashtags from multiple columns
    const hashtags = [];
    for (let i = 0; i <= 27; i++) {
      if (post[`hashtags/${i}/name`] && post[`hashtags/${i}/name`].trim() !== '') {
        hashtags.push({
          id: `hashtag-${Math.random().toString(36).substr(2, 9)}`,
          name: post[`hashtags/${i}/name`]
        });
      }
    }
    
    // Extract mentions
    const mentions = [];
    for (let i = 0; i <= 6; i++) {
      if (post[`mentions/${i}`] && post[`mentions/${i}`].trim() !== '') {
        mentions.push(post[`mentions/${i}`]);
      }
    }
    
    // Extract detailed mentions
    const detailedMentions = [];
    for (let i = 0; i <= 6; i++) {
      if (post[`detailedMentions/${i}/name`] && post[`detailedMentions/${i}/name`].trim() !== '') {
        detailedMentions.push(post[`detailedMentions/${i}/name`]);
      }
    }
    
    // Extract effect stickers
    const effectStickers = [];
    if (post[`effectStickers/0/name`] && post[`effectStickers/0/ID`]) {
      effectStickers.push({
        stickerType: 'effect',
        stickerText: post[`effectStickers/0/name`],
        stickerStats: {
          useCount: parseInt(post[`effectStickers/0/stickerStats/useCount`] || '0', 10)
        }
      });
    }
    
    return {
      id: `${brand}-tt-${Math.random().toString(36).substr(2, 9)}`,
      text: post.text || '',
      createTime: post.createTime || post.createTimeISO || new Date().toISOString(),
      authorMeta: {
        id: post.input || '',
        name: post[`authorMeta/name`] || '',
        fans: parseInt(post[`authorMeta/fans`] || '0', 10)
      },
      musicMeta: {
        musicId: '', // Not available in the new data structure
        musicName: ''
      },
      playCount: parseInt(post.playCount || '0', 10),
      diggCount: parseInt(post.diggCount || '0', 10),
      shareCount: parseInt(post.shareCount || '0', 10),
      commentCount: parseInt(post.commentCount || '0', 10),
      collectCount: parseInt(post.collectCount || '0', 10),
      hashtags,
      effectStickers,
      locationMeta: {
        city: post[`locationMeta/city`] || '',
        countryCode: post[`locationMeta/countryCode`] || ''
      },
      videoUrl: '', // Not available in the new data structure
      coverUrl: ''
    };
  });

  return {
    brand,
    posts
  };
};

// Function to check if data is cached in localStorage
export const getDataFromCache = (platform: Platform, brand: Brand) => {
  const cacheKey = `${platform.toLowerCase()}-${brand.toLowerCase().replace(' ', '-')}`;
  const cachedData = localStorage.getItem(cacheKey);
  
  if (cachedData) {
    try {
      const { data, timestamp } = JSON.parse(cachedData);
      // Check if data is stale (older than 24 hours)
      const isStale = new Date().getTime() - timestamp > 24 * 60 * 60 * 1000;
      
      if (!isStale) {
        return data;
      }
    } catch (error) {
      console.error('Error parsing cached data:', error);
    }
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
  
  try {
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
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
    return cachedData;
  }
  
  const data = await fetchInstagramData(brand);
  console.log('[API] Instagram data for', brand, data);
  saveDataToCache('Instagram', brand, data);
  
  return data;
};

// Function to fetch TikTok data with caching
export const fetchTikTokDataWithCache = async (brand: Brand): Promise<TikTokData> => {
  // Check if data is in cache
  const cachedData = getDataFromCache('TikTok', brand);
  if (cachedData) {
    console.log(`Using cached TikTok data for ${brand}`);
    return cachedData;
  }
  
  // If not in cache, fetch from API
  console.log(`Fetching fresh TikTok data for ${brand}`);
  const data = await fetchTikTokData(brand);
  
  // Save to cache
  saveDataToCache('TikTok', brand, data);
  
  return data;
};

// Combined data type for fetching both Instagram and TikTok data
interface CombinedData {
  instagram: InstagramData;
  tiktok: TikTokData;
}

// Function to fetch both Instagram and TikTok data with caching
export const fetchCombinedDataWithCache = async (brand: Brand): Promise<CombinedData> => {
  console.log(`Fetching combined data for ${brand}`);
  
  // Fetch both data types in parallel
  const [instagram, tiktok] = await Promise.all([
    fetchInstagramDataWithCache(brand),
    fetchTikTokDataWithCache(brand)
  ]);
  
  return { instagram, tiktok };
};
