// Brand type
export type Brand = 
  | 'Nordstrom'
  | 'Macys'
  | 'Saks'  // Fixed from 'Sakes' to match actual file names
  | 'Bloomingdales'
  | 'Tjmaxx'
  | 'Sephora'
  | 'Ulta'
  | 'Aritzia'
  | 'American Eagle'
  | 'Walmart'
  | 'Amazon Beauty'
  | 'Revolve';

// Platform type
export type Platform = 'Instagram' | 'TikTok';

// Social platform type (alias for Platform for component usage)
export type SocialPlatform = Platform;

// Sentiment type
export type SentimentLabel = 'positive' | 'neutral' | 'negative';

// Instagram data types
export interface InstagramPost {
  id: string;
  timestamp: string;
  shortcode: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  locationName?: string;
  isSponsored: boolean;
  mediaType: string;
  mediaUrl: string;
  mentions: string[];
  hashtags: string[];
  thumbnailUrl: string;
  type: string;
  videoPlayCount?: number;
  videoViewCount?: number; // Added for engagement rate calculation
  // Reach metrics
  reach?: number;
  impressions?: number;
  // Sentiment analysis fields
  sentimentScore: number;
  sentimentLabel: SentimentLabel;
}

export interface InstagramData {
  brand: Brand;
  posts: InstagramPost[];
}

// TikTok data types
export interface TikTokPost {
  id: string;
  text: string;
  createTime: string;
  authorMeta: {
    id: string;
    name: string;
    fans: number;
    following?: number;
    heart?: number;
    verified?: boolean;
    privateAccount?: boolean;
    digg?: number;
    region?: string;
    friends?: number;
    originalAvatarUrl?: string;
  };
  musicMeta: {
    musicId: string;
    musicName: string;
  };
  playCount: number;
  diggCount: number; // likes
  shareCount: number;
  commentCount: number;
  collectCount?: number; // Optional as it may not be present in all posts
  // Reach metrics
  views?: number;
  reach?: number;
  hashtags: {
    id: string;
    name: string;
  }[];
  // Sentiment analysis fields
  sentimentScore: number;
  sentimentLabel: SentimentLabel;
  // Location metadata
  locationMeta?: {
    city?: string;
    cityCode?: string;
    address?: string;
    locationName?: string;
    countryCode?: string;
  };
  // Effect stickers
  effectStickers?: {
    ID?: string;
    name?: string;
    stickerType?: string;
    stickerText?: string;
    stickerStats?: {
      useCount: number;
    };
  }[];
  // Additional metadata
  textLanguage?: string;
  fromProfileSection?: boolean;
  isSponsored?: boolean;
  mentions?: string[];
  videoUrl: string;
  coverUrl: string;
  engagementRate?: number;
}

export interface TikTokData {
  brand: Brand;
  posts: TikTokPost[];
}

// Data for Dashboard
export interface SocialData {
  instagram: Record<Brand, InstagramData | null>;
  tiktok: Record<Brand, TikTokData | null>;
  lastFetched: Record<Platform, Record<Brand, Date | null>>;
}

// Filter options
export interface FilterOptions {
  platform: Platform | 'All';
  brands: Brand[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  selectedMonth: string; // Single selected month or 'All (Feb-May)'
}

// Chart data types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}