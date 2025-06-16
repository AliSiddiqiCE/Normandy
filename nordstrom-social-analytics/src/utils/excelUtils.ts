import * as XLSX from 'xlsx';
import { Brand, InstagramData, TikTokData } from '../types';
import { convertInstagramRawData, convertTiktokRawData } from './dataConverters';

// Map brand names to file names for Instagram
const INSTAGRAM_FILE_NAMES: Partial<Record<Brand, string>> = {
  'Amazon Beauty': 'Insta_new_amazonbeauty.xlsx',
  'American Eagle': 'Insta_new_americaneagle.xlsx',
  'Aritzia': 'Insta_new_aritzia.xlsx',
  'Bloomingdales': 'Insta_new_bloomingdales.xlsx',
  'Macys': 'Insta_new_macys.xlsx',
  'Nordstrom': 'Insta_new_nordstrom.xlsx',
  'Saks': 'Insta_new_saks.xlsx',  // Updated from 'Sakes' to 'Saks'
  'Sephora': 'Insta_new_sephora.xlsx',
  'Tjmaxx': 'Insta_new_tjmaxx.xlsx',
  'Walmart': 'Insta_new_walmart.xlsx',
  'Ulta': 'Insta_new_ulta.xlsx',
  'Revolve': 'Insta_new_revolve.xlsx',
  // Note: File mappings for Ulta and Revolve added. Ensure corresponding Excel files exist in public/Data/Instagram/.
};

// Map brand names to file names for TikTok
const TIKTOK_FILE_NAMES: Partial<Record<Brand, string>> = {
  'Amazon Beauty': 'Tiktok_new_amazonbeauty.xlsx',
  'American Eagle': 'Tiktok_new_americaneagle.xlsx',
  'Aritzia': 'Tiktok_new_aritzia.xlsx',
  // Note: We don't have a file for Bloomingdales in the TikTok folder
  'Macys': 'Tiktok_new_macys.xlsx',
  'Nordstrom': 'Tiktok_new_nordstrom.xlsx',
  'Revolve': 'Tiktok_new_revolve.xlsx',
  'Saks': 'Tiktok_new_saks.xlsx',  // Fixed brand name from 'Sakes' to 'Saks'
  'Sephora': 'Tiktok_new_sephora.xlsx',
  'Tjmaxx': 'Tiktok_new_tjmaxx.xlsx',
  'Ulta': 'Tiktok_new_ultabeauty.xlsx',  // Note the different filename pattern
  'Walmart': 'Tiktok_new_walmart.xlsx'
};

/**
 * Reads data from an Excel file and returns it as an array of objects
 * @param filePath Path to the Excel file
 * @returns Array of objects where each object represents a row in the Excel file
 */
export const readExcelFile = async (filePath: string): Promise<any[]> => {
  try {
    // In a browser environment, we need to use fetch to get the file
    const response = await fetch(filePath);
    
    if (!response.ok) {
      // Fetch error occurred
      throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    // Read the Excel file from the array buffer
    // Parse the Excel file
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert the worksheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    return jsonData;
  } catch (error) {
    // Error reading Excel file
    console.error(`[DEBUG] Error reading Excel file ${filePath}:`, error);
    return [];
  }
};

/**
 * Fetches Instagram data for a specific brand from local Excel file
 * @param brand Brand to fetch data for
 * @returns Processed Instagram data
 */
export const fetchInstagramDataFromFile = async (brand: Brand): Promise<InstagramData> => {
  if (brand === 'Ulta' || brand === 'Revolve') {
    console.log(`[DEBUG] fetchInstagramDataFromFile called for brand: ${brand}`);
  }
  const fileName = INSTAGRAM_FILE_NAMES[brand];
  if (!fileName) {
    // No Instagram file name defined for brand
    return { brand, posts: [] };
  }
  
  // For React apps in development, we need to use the correct path format
  // Files in the public folder are served at the root path
  const filePath = `/Data/Instagram/${fileName}`;

  if (brand === 'Ulta' || brand === 'Revolve') {
    console.log(`[DEBUG] ${brand} - FilePath: ${filePath}`);
  }
  
  try {
    const rawData = await readExcelFile(filePath);

    if (brand === 'Ulta' || brand === 'Revolve') {
      console.log(`[DEBUG] ${brand} - Raw data length: ${rawData.length}`);
      if (rawData.length > 0) {
        console.log(`[DEBUG] ${brand} - Raw data sample (first row): `, rawData[0]);
      }
    }
    
    // Convert raw data to the format expected by the application
    const posts = convertInstagramRawData(rawData, brand);

    if (brand === 'Ulta' || brand === 'Revolve') {
      console.log(`[DEBUG] ${brand} - Posts length: ${posts.length}`);
      if (posts.length > 0) {
        console.log(`[DEBUG] ${brand} - Posts sample (first post): `, posts[0]);
      }
    }
    
    return {
      brand,
      posts
    };
  } catch (error) {
    if (brand === 'Ulta' || brand === 'Revolve') {
      console.error(`[DEBUG] ${brand} - Error in fetchInstagramDataFromFile: `, error);
    }
    // Error processing Instagram data
    return { brand, posts: [] };
  }
};

/**
 * Fetches TikTok data for a specific brand from local Excel file
 * @param brand Brand to fetch data for
 * @returns Processed TikTok data
 */
export const fetchTikTokDataFromFile = async (brand: Brand): Promise<TikTokData> => {
  const fileName = TIKTOK_FILE_NAMES[brand];
  if (!fileName) {
    // No TikTok file name defined for brand
    return { brand, posts: [] };
  }
  
  // For React apps in development, we need to use the correct path format
  // Files in the public folder are served at the root path
  const filePath = `/Data/TikTok/${fileName}`;

  
  try {
    const rawData = await readExcelFile(filePath);
    
    // Convert raw data to the format expected by the application
    const posts = convertTiktokRawData(rawData, brand);
    console.log('[CHECK] TikTok Excel data for', brand, ':', posts);
    
    return {
      brand,
      posts
    };
  } catch (error) {
    // Error processing TikTok data
    return { brand, posts: [] };
  }
};