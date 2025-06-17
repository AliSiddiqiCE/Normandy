import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ChartOptions
} from 'chart.js';
import { Brand, InstagramPost, TikTokPost, SocialPlatform } from '../../types';
import EmptyChartFallback from '../common/EmptyChartFallback';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useSocialData } from '../../context/SocialDataContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type HashtagSectionProps = {
  platform: SocialPlatform;
  selectedBrands: Brand[];
  posts: Record<Brand, (InstagramPost | TikTokPost)[]>;
};

const HashtagSection: React.FC<HashtagSectionProps> = ({ 
  platform, 
  selectedBrands, 
  posts 
}) => {
  // Get dark mode from context
  const { darkMode } = useSocialData();
  // Warm color palette that matches the website's aesthetic
  const vibrantColors = [
    'rgba(194, 124, 14, 0.8)',   // Warm Gold
    'rgba(214, 69, 65, 0.8)',    // Warm Red
    'rgba(233, 168, 38, 0.8)',   // Amber Gold
    'rgba(210, 95, 45, 0.8)',    // Burnt Orange
    'rgba(169, 81, 45, 0.8)',    // Terracotta
    'rgba(147, 51, 51, 0.8)',    // Burgundy
    'rgba(224, 142, 121, 0.8)',  // Coral
    'rgba(191, 129, 45, 0.8)',   // Bronze
    'rgba(178, 80, 104, 0.8)',   // Raspberry
    'rgba(156, 93, 82, 0.8)',    // Cinnamon
    'rgba(133, 87, 35, 0.8)',    // Amber Brown
    'rgba(179, 107, 0, 0.8)',    // Ochre
  ];

  // Nordstrom is our main brand
  const mainBrand: Brand = 'Nordstrom';
  
  // State for competitor brand selection
  const [selectedCompetitor, setSelectedCompetitor] = useState<Brand>('Macys');

  // Check if we have data
  const hasData = useMemo(() => {
    return selectedBrands.some(brand => (posts[brand]?.length || 0) > 0);
  }, [selectedBrands, posts]);

  // Extract hashtags for a specific brand
  const extractHashtags = (brand: Brand) => {
    const brandPosts = posts[brand] || [];
    const hashtagCounts: Record<string, number> = {};
    
    brandPosts.forEach(post => {
      if (platform === 'Instagram') {
        const instagramPost = post as InstagramPost;
        if (instagramPost.hashtags && instagramPost.hashtags.length) {
          instagramPost.hashtags.forEach(tag => {
            if (tag) {
              hashtagCounts[tag.toLowerCase()] = (hashtagCounts[tag.toLowerCase()] || 0) + 1;
            }
          });
        }
      } else {
        const tiktokPost = post as TikTokPost;
        if (tiktokPost.hashtags && tiktokPost.hashtags.length) {
          tiktokPost.hashtags.forEach(tag => {
            if (tag.name) {
              hashtagCounts[tag.name.toLowerCase()] = (hashtagCounts[tag.name.toLowerCase()] || 0) + 1;
            }
          });
        }
      }
    });
    
    // Sort hashtags by count and get top 5
    return Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  // Generate top hashtags chart data for Nordstrom
  const nordstromHashtagsData = useMemo(() => {
    if (!hasData || !posts[mainBrand] || posts[mainBrand].length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    const topHashtags = extractHashtags(mainBrand);
    
    return {
      labels: topHashtags.map(([tag]) => `#${tag}`),
      datasets: [
        {
          label: `${mainBrand} Top Hashtags`,
          data: topHashtags.map(([_, count]) => count),
          backgroundColor: vibrantColors[0],
          borderColor: vibrantColors[0].replace('0.8', '1'),
          borderWidth: 1,
        }
      ]
    };
  }, [posts, mainBrand, hasData, platform, vibrantColors]);

  // Generate top hashtags chart data for competitor
  const competitorHashtagsData = useMemo(() => {
    if (!hasData || !posts[selectedCompetitor] || posts[selectedCompetitor].length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    const topHashtags = extractHashtags(selectedCompetitor);
    
    return {
      labels: topHashtags.map(([tag]) => `#${tag}`),
      datasets: [
        {
          label: `${selectedCompetitor} Top Hashtags`,
          data: topHashtags.map(([_, count]) => count),
          backgroundColor: vibrantColors[1],
          borderColor: vibrantColors[1].replace('0.8', '1'),
          borderWidth: 1,
        }
      ]
    };
  }, [posts, selectedCompetitor, hasData, platform, vibrantColors]);

  // Chart options
  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Count: ${context.parsed.x}`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count'
        }
      }
    }
  };

  // Handle competitor brand change
  const handleCompetitorChange = (event: any) => {
    setSelectedCompetitor(event.target.value as Brand);
  };

  // Update chart options based on dark mode
  const chartOptions = useMemo(() => {
    return {
      ...barOptions,
      plugins: {
        ...barOptions.plugins,
        legend: {
          ...barOptions.plugins?.legend,
          labels: {
            color: darkMode ? 'rgba(255, 255, 255, 0.8)' : undefined
          }
        },
        tooltip: {
          ...barOptions.plugins?.tooltip,
          titleColor: darkMode ? 'rgba(255, 255, 255, 0.9)' : undefined,
          bodyColor: darkMode ? 'rgba(255, 255, 255, 0.9)' : undefined,
          backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : undefined
        }
      },
      scales: {
        ...barOptions.scales,
        x: {
          ...barOptions.scales?.x,
          grid: {
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : undefined
          },
          ticks: {
            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined
          },
          title: {
            ...barOptions.scales?.x?.title,
            color: darkMode ? 'rgba(255, 255, 255, 0.9)' : undefined
          }
        },
        y: {
          grid: {
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : undefined
          },
          ticks: {
            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined
          }
        }
      }
    };
  }, [barOptions, darkMode]);

  return (
    // Removed p-4 from root, padding is handled by parent card in DashboardOverview
    <div>
      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
        Top 5 hashtags used by brands on {platform}.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nordstrom Top Hashtags */}
        <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800/50' : 'bg-white'}`}> {/* Updated inner card style */}
          <h3 className={`text-md font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Nordstrom Top Hashtags</h3> {/* Updated title style */}
          <div className="h-80 overflow-auto">
  {!hasData || !nordstromHashtagsData.labels.length ? (
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
          {extractHashtags(mainBrand).map(([tag, count]) => (
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
        <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800/50' : 'bg-white'}`}> {/* Updated inner card style */}
          <div className="flex justify-between items-center mb-3"> {/* mb-3 to match title style */}
            <h3 className={`text-md font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Competitor Top Hashtags</h3> {/* Updated title style */}
            <FormControl size="small" style={{ minWidth: 120 }} sx={{
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
                '& .MuiSvgIcon-root': { // Icon color
                  color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined,
                },
              },
            }}>
              <InputLabel id="competitor-select-label" sx={{color: darkMode ? 'rgba(255,255,255,0.7)' : undefined}}>Competitor</InputLabel> {/* Ensure label color in dark mode */}
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
                {selectedBrands.filter(brand => brand !== mainBrand).map((brand) => (
                  <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div className="h-80 overflow-auto">
  {!hasData || !competitorHashtagsData.labels.length ? (
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
          {extractHashtags(selectedCompetitor).map(([tag, count]) => (
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
