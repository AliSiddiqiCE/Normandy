import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Brand, InstagramPost, TikTokPost, SocialPlatform } from '../../types';
import EmptyChartFallback from '../common/EmptyChartFallback';
import { FormControl, InputLabel, MenuItem, Select, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useSocialData } from '../../context/SocialDataContext';
import * as FaIcons from 'react-icons/fa';

const HashtagSection: React.FC<{ selectedBrands: Brand[] }> = ({ selectedBrands }) => {
  const { darkMode, socialData } = useSocialData();
  
  // Local platform state for this component
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('Instagram');
  
  // State for competitor brand selection
  const [selectedCompetitor, setSelectedCompetitor] = useState<Brand>('Macys');
  
  // Nordstrom is our main brand
  const mainBrand: Brand = 'Nordstrom';

  // Filter posts based on selected platform
  const posts = useMemo(() => {
    return selectedBrands.reduce((acc, brand) => {
      if (selectedPlatform === 'Instagram') {
        acc[brand] = socialData.instagram[brand]?.posts || [];
      } else {
        acc[brand] = socialData.tiktok[brand]?.posts || [];
      }
      return acc;
    }, {} as Record<Brand, (InstagramPost | TikTokPost)[]>);
  }, [selectedBrands, selectedPlatform, socialData]);
  
  // Handle platform change
  const handlePlatformChange = (
    event: React.MouseEvent<HTMLElement>,
    newPlatform: SocialPlatform | null,
  ) => {
    if (newPlatform !== null) {
      setSelectedPlatform(newPlatform);
    }
  };

  // Extract hashtags for a specific brand
  const extractHashtags = (brand: Brand) => {
    const brandPosts = posts[brand] || [];
    const hashtagCounts: Record<string, number> = {};
    
    brandPosts.forEach(post => {
      if (selectedPlatform === 'Instagram') {
        const instagramPost = post as InstagramPost;
        if (instagramPost.hashtags?.length) {
          instagramPost.hashtags.forEach(tag => {
            if (tag) {
              const tagName = tag.startsWith('#') ? tag.slice(1) : tag;
              const lowerTag = tagName.toLowerCase().trim();
              if (lowerTag) {
                hashtagCounts[lowerTag] = (hashtagCounts[lowerTag] || 0) + 1;
              }
            }
          });
        }
      } else {
        const tiktokPost = post as TikTokPost;
        if (tiktokPost.hashtags?.length) {
          tiktokPost.hashtags.forEach(tag => {
            if (tag?.name) {
              const tagName = tag.name.startsWith('#') ? tag.name.slice(1) : tag.name;
              const lowerTag = tagName.toLowerCase().trim();
              if (lowerTag) {
                hashtagCounts[lowerTag] = (hashtagCounts[lowerTag] || 0) + 1;
              }
            }
          });
        }
      }
    });
    
    // Sort hashtags by count (descending) and get top 5
    return Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  // Check if we have data
  const hasData = useMemo(() => {
    return selectedBrands.some(brand => (posts[brand]?.length || 0) > 0);
  }, [selectedBrands, posts]);

  // Get top hashtags for Nordstrom and selected competitor
  const nordstromHashtags = extractHashtags(mainBrand);
  const competitorHashtags = extractHashtags(selectedCompetitor);

  // Handle competitor brand change
  const handleCompetitorChange = (event: any) => {
    setSelectedCompetitor(event.target.value as Brand);
  };

  // Calculate total mentions for a brand
  const calculateTotalMentions = (brand: Brand) => {
    const brandPosts = posts[brand] || [];
    let total = 0;
    
    brandPosts.forEach(post => {
      if (selectedPlatform === 'Instagram') {
        const instagramPost = post as InstagramPost;
        if (instagramPost.hashtags?.length) {
          total += instagramPost.hashtags.filter(tag => tag).length;
        }
      } else {
        const tiktokPost = post as TikTokPost;
        if (tiktokPost.hashtags?.length) {
          total += tiktokPost.hashtags.filter(tag => tag?.name).length;
        }
      }
    });
    
    return total;
  };

  return (
    <div className={darkMode ? 'text-white' : ''}>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2 md:gap-0">
        <h2 className="text-lg font-semibold">Hashtag Analytics</h2>
        <div className="flex items-center gap-4">
          <ToggleButtonGroup
            value={selectedPlatform}
            exclusive
            onChange={handlePlatformChange}
            size="small"
            aria-label="Platform"
            sx={{
              backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
              borderRadius: 2,
              '& .MuiToggleButton-root': {
                color: darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(55,65,81,1)',
                fontWeight: 600,
                fontSize: '0.95rem',
                px: 2.5,
                py: 1,
                '&.Mui-selected': {
                  backgroundColor: darkMode ? 'rgba(0, 120, 212, 0.3)' : 'rgba(0, 120, 212, 0.12)',
                  color: darkMode ? '#fff' : '#00539b',
                },
              },
            }}
          >
            <ToggleButton value="Instagram" aria-label="Instagram" sx={{ textTransform: 'none' }}>
              <FaIcons.FaInstagram className="mr-2" />
              Instagram
            </ToggleButton>
            <ToggleButton value="TikTok" aria-label="TikTok" sx={{ textTransform: 'none' }}>
              <FaIcons.FaTiktok className="mr-2" />
              TikTok
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>
      
      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
        Top 5 hashtags used by brands on {selectedPlatform}.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nordstrom Top Hashtags */}
        <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800/50' : 'bg-white'}`} style={{ marginTop: '1rem' }}>
          <h3 className={`text-md font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Nordstrom Top Hashtags
          </h3>
          <div className="h-80 overflow-auto">
            {!hasData || nordstromHashtags.length === 0 ? (
              <EmptyChartFallback message="No hashtag data available" />
            ) : (
              <TableContainer component={Paper} sx={{ bgcolor: darkMode ? 'rgb(31, 41, 55)' : 'white' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: darkMode ? 'white' : 'black', fontWeight: 600 }}>Hashtag</TableCell>
                      <TableCell sx={{ color: darkMode ? 'white' : 'black', fontWeight: 600 }}>Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow sx={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                      <TableCell sx={{ color: darkMode ? 'white' : 'black' }}>Total Mentions</TableCell>
                      <TableCell sx={{ color: darkMode ? 'white' : 'black' }}>
                        {calculateTotalMentions(mainBrand)}
                      </TableCell>
                    </TableRow>
                    {nordstromHashtags.map(([tag, count]) => (
                      <TableRow key={tag}>
                        <TableCell sx={{ color: darkMode ? 'white' : 'black' }}>#{tag}</TableCell>
                        <TableCell sx={{ color: darkMode ? 'white' : 'black' }}>{count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        </div>

        {/* Competitor Top Hashtags */}
        <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800/50' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className={`text-md font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Competitor Top Hashtags
            </h3>
            <FormControl 
              size="small" 
              style={{ minWidth: 120 }} 
              sx={{
                '& .MuiInputLabel-root': {
                  color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined,
                },
                '& .MuiOutlinedInput-root': {
                  color: darkMode ? 'white' : undefined,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.23)' : undefined,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.5)' : undefined,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.5)' : undefined,
                  },
                  '& .MuiSvgIcon-root': {
                    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined,
                  },
                },
              }}
            >
              <InputLabel id="competitor-select-label" sx={{color: darkMode ? 'rgba(255,255,255,0.7)' : undefined}}>
                Competitor
              </InputLabel>
              <Select
                labelId="competitor-select-label"
                id="competitor-select"
                value={selectedCompetitor}
                label="Competitor"
                onChange={handleCompetitorChange}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: darkMode ? 'rgb(45, 45, 45)' : undefined,
                      color: darkMode ? 'white' : undefined,
                      '& .MuiMenuItem-root:hover': {
                        bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined
                      }
                    }
                  }
                }}
              >
                {selectedBrands
                  .filter(brand => brand !== mainBrand)
                  .map((brand) => (
                    <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                  ))}
              </Select>
            </FormControl>
          </div>
          <div className="h-80 overflow-auto">
            {!hasData || competitorHashtags.length === 0 ? (
              <EmptyChartFallback message="No hashtag data available" />
            ) : (
              <TableContainer component={Paper} sx={{ bgcolor: darkMode ? 'rgb(31, 41, 55)' : 'white' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: darkMode ? 'white' : 'black', fontWeight: 600 }}>Hashtag</TableCell>
                      <TableCell sx={{ color: darkMode ? 'white' : 'black', fontWeight: 600 }}>Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow sx={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                      <TableCell sx={{ color: darkMode ? 'white' : 'black' }}>Total Mentions</TableCell>
                      <TableCell sx={{ color: darkMode ? 'white' : 'black' }}>
                        {calculateTotalMentions(selectedCompetitor)}
                      </TableCell>
                    </TableRow>
                    {competitorHashtags.map(([tag, count]) => (
                      <TableRow key={tag}>
                        <TableCell sx={{ color: darkMode ? 'white' : 'black' }}>#{tag}</TableCell>
                        <TableCell sx={{ color: darkMode ? 'white' : 'black' }}>{count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HashtagSection;