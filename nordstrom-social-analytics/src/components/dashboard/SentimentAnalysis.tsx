import React, { useMemo, useState } from 'react';
import { Bar, Line, Pie, Chart } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend,
  ChartOptions
} from 'chart.js';
import { Brand, InstagramPost, SentimentLabel, TikTokPost } from '../../types';
import { BRAND_COLORS, getColorByBrand, generateColors } from '../../utils/chartUtils';
import EmptyChartFallback from '../../components/common/EmptyChartFallback';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, ToggleButton, ToggleButtonGroup } from '@mui/material';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Register the filler plugin for area charts
ChartJS.register({
  id: 'customFiller',
  beforeDraw: (chart) => {
    // Add shadow to chart
    const ctx = chart.ctx;
    ctx.shadowColor = 'rgba(0,0,0,0.05)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
  }
});

interface SentimentAnalysisProps {
  selectedBrands: Brand[];
  posts: Record<Brand, (InstagramPost | TikTokPost)[] | undefined>;
  selectedMonth: string;
  onMonthChange: React.Dispatch<React.SetStateAction<string>>;
}

const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({ selectedBrands, posts, selectedMonth, onMonthChange }) => {
  // Local platform state for sentiment analysis
  const [localPlatform, setLocalPlatform] = useState<'Instagram' | 'TikTok'>('Instagram');

  // Compute filtered posts for the selected platform only
  const filteredPosts = useMemo(() => {
    // Helper to match month
    const matchesMonth = (date: Date) => {
      if (selectedMonth === 'All (Feb-May)') return true;
      const monthName = date.toLocaleString('default', { month: 'long' });
      return monthName === selectedMonth;
    };
    // Initialize with all Brand keys for type safety
    const out: Record<Brand, InstagramPost[] | TikTokPost[]> = {
      Nordstrom: [], Macys: [], Saks: [], Bloomingdales: [], Tjmaxx: [], Sephora: [], Ulta: [], Aritzia: [], "American Eagle": [], Walmart: [], "Amazon Beauty": [], Revolve: []
    };
    selectedBrands.forEach(brand => {
      const brandPosts = posts[brand] || [];
      if (localPlatform === 'Instagram') {
        out[brand] = (brandPosts as (InstagramPost | TikTokPost)[]).filter(
          (post): post is InstagramPost => {
            if ((post as InstagramPost).mediaType === undefined) return false;
            if (selectedMonth === 'All (Feb-May)') return true;
            const ts = (post as InstagramPost).timestamp;
            if (!ts) return false;
            const date = new Date(ts);
            return matchesMonth(date);
          }
        );
      } else {
        out[brand] = (brandPosts as (InstagramPost | TikTokPost)[]).filter(
          (post): post is TikTokPost => {
            if ((post as TikTokPost).playCount === undefined) return false;
            if (selectedMonth === 'All (Feb-May)') return true;
            const ct = (post as TikTokPost).createTime;
            if (!ct) return false;
            let date: Date;
            if (typeof ct === 'number' || !isNaN(Number(ct))) {
              date = new Date(Number(ct) * 1000);
            } else {
              date = new Date(ct as string);
            }
            return matchesMonth(date);
          }
        );
      }
    });
    return out;
  }, [selectedBrands, posts, localPlatform, selectedMonth]);
  // State for selected brand in charts
  const [selectedBrandForSentiment, setSelectedBrandForSentiment] = useState<string>('all');
  const [selectedBrandForVolume, setSelectedBrandForVolume] = useState<string>('all');
  
  // State for competitor brand selection
  const [selectedCompetitor, setSelectedCompetitor] = useState<Brand>('Macys');
  
  // Nordstrom is our main brand
  const mainBrand: Brand = 'Nordstrom';

  // Use local platform state throughout instead of prop
  const platform = localPlatform;

  // Calculate sentiment distribution by brand
  const sentimentDistributionByBrand = useMemo(() => {
    // Prepare data for Chart.js bar chart: brands on x-axis, sentiment counts in grouped bars
    const labels = selectedBrands;
    const positives: number[] = [];
    const neutrals: number[] = [];
    const negatives: number[] = [];
    labels.forEach(brand => {
      let pos = 0, neu = 0, neg = 0;
      (filteredPosts[brand] || []).forEach(post => {
        if (post.sentimentLabel === 'positive') pos++;
        else if (post.sentimentLabel === 'neutral') neu++;
        else if (post.sentimentLabel === 'negative') neg++;
      });
      positives.push(pos);
      neutrals.push(neu);
      negatives.push(neg);
    });
    return {
      labels,
      datasets: [
        {
          label: 'Positive',
          data: positives,
          backgroundColor: 'rgba(75, 192, 75, 0.8)',
          borderColor: 'rgba(75, 192, 75, 1)',
          borderWidth: 1,
        },
        {
          label: 'Neutral',
          data: neutrals,
          backgroundColor: 'rgba(150, 150, 150, 0.8)',
          borderColor: 'rgba(150, 150, 150, 1)',
          borderWidth: 1,
        },
        {
          label: 'Negative',
          data: negatives,
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        }
      ]
    };
  }, [selectedBrands, filteredPosts]);

  // Calculate average sentiment score over time by brand
  const averageSentimentOverTimeByBrand = useMemo(() => {
    // Gather all dates from all brands
    const allDates = new Set<string>();
    const brandScoresByDate: Record<Brand, Record<string, { total: number; count: number }>> = {
      'Nordstrom': {},
      'Macys': {},
      'Saks': {},
      'Bloomingdales': {},
      'Tjmaxx': {},
      'Sephora': {},
      'Ulta': {},
      'Aritzia': {},
      'American Eagle': {},
      'Walmart': {},
      'Amazon Beauty': {},
      'Revolve': {}
    };
    
    selectedBrands.forEach(brand => {
      const brandPosts = filteredPosts[brand] || [];
      brandScoresByDate[brand] = {};
      
      brandPosts.forEach(post => {
        const timestamp = platform === 'Instagram' 
          ? (post as InstagramPost).timestamp 
          : (post as TikTokPost).createTime;
        
        if (timestamp && typeof post.sentimentScore === 'number') {
          try {
            const date = new Date(timestamp);
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            allDates.add(dateStr);
            
            if (!brandScoresByDate[brand][dateStr]) {
              brandScoresByDate[brand][dateStr] = { total: 0, count: 0 };
            }
            
            brandScoresByDate[brand][dateStr].total += post.sentimentScore;
            brandScoresByDate[brand][dateStr].count++;
          } catch (e) {
            console.error('Error processing date for sentiment analysis:', e);
          }
        }
      });
    });
    
    // Sort dates
    const dates = Array.from(allDates).sort();
    
    // Filter brands based on selection
    const brandsToShow = selectedBrandForSentiment === 'all' 
      ? selectedBrands 
      : selectedBrands.filter(brand => brand === selectedBrandForSentiment);
    
    // Create datasets for each brand
    const datasets = brandsToShow.map((brand, index) => {
      const averageScores = dates.map(date => {
        const data = brandScoresByDate[brand][date];
        if (!data || data.count === 0) return null; // Use null for missing data points
        return data.total / data.count;
      });
      
      const brandColor = getColorByBrand(brand, index);
      return {
        label: `${brand}`,
        data: averageScores,
        borderColor: brandColor.replace(/,\s*0\.\d+\)/, ', 1)'), // Make opaque for border
        backgroundColor: brandColor,
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: brandColor
      };
    });
    
    return {
      labels: dates,
      datasets
    };
  }, [selectedBrands, filteredPosts, platform, selectedBrandForSentiment]);

  // Function to calculate sentiment distribution for a specific brand
  const calculateSentimentDistribution = (brand: Brand) => {
    let positive = 0;
    let neutral = 0;
    let negative = 0;
    
    const brandPosts = filteredPosts[brand] || [];
    
    brandPosts.forEach(post => {
      if (post.sentimentLabel === 'positive') positive++;
      else if (post.sentimentLabel === 'neutral') neutral++;
      else if (post.sentimentLabel === 'negative') negative++;
    });
    
    return {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [
        {
          data: [positive, neutral, negative],
          backgroundColor: [
            'rgba(75, 192, 75, 0.8)',  // Green for Positive
            'rgba(150, 150, 150, 0.8)', // Gray for Neutral
            'rgba(255, 99, 132, 0.8)'   // Red for Negative
          ],
          borderColor: [
            'rgba(75, 192, 75, 1)',
            'rgba(150, 150, 150, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1,
        }
      ]
    };
  };
  
  // Calculate sentiment distribution for Nordstrom (main brand)
  const nordstromSentimentDistribution = useMemo(() => {
    return calculateSentimentDistribution(mainBrand);
  }, [filteredPosts, mainBrand]);
  
  // Calculate sentiment distribution for selected competitor
  const competitorSentimentDistribution = useMemo(() => {
    return calculateSentimentDistribution(selectedCompetitor);
  }, [filteredPosts, selectedCompetitor]);
  
  // Function to calculate sentiment over time for a specific brand
  const calculateSentimentOverTime = (brand: Brand) => {
    // Get posts for the specific brand, filtered by local platform
    const brandPosts = filteredPosts[brand] || [];
    
    // Group by date and sentiment
    const countsByDate: Record<string, { positive: number; neutral: number; negative: number }> = {};
    
    brandPosts.forEach(post => {
      const timestamp = platform === 'Instagram' 
        ? (post as InstagramPost).timestamp 
        : (post as TikTokPost).createTime;
      
      if (timestamp && post.sentimentLabel) {
        try {
          const date = new Date(timestamp);
          const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          if (!countsByDate[dateStr]) {
            countsByDate[dateStr] = { positive: 0, neutral: 0, negative: 0 };
          }
          
          if (post.sentimentLabel === 'positive') countsByDate[dateStr].positive++;
          else if (post.sentimentLabel === 'neutral') countsByDate[dateStr].neutral++;
          else if (post.sentimentLabel === 'negative') countsByDate[dateStr].negative++;
        } catch (e) {
          console.error('Error processing date for sentiment analysis:', e);
        }
      }
    });
    
    // Convert to arrays for chart
    const dates = Object.keys(countsByDate).sort();
    const positiveData = dates.map(date => countsByDate[date].positive);
    const neutralData = dates.map(date => countsByDate[date].neutral);
    const negativeData = dates.map(date => countsByDate[date].negative);
    
    return {
      labels: dates,
      datasets: [
        {
          label: 'Positive',
          data: positiveData,
          backgroundColor: 'rgba(75, 192, 75, 0.8)', // Green for positive
          borderColor: 'rgba(75, 192, 75, 1)',
          borderWidth: 1,
          fill: 'origin',
          tension: 0.4,
        },
        {
          label: 'Neutral',
          data: neutralData,
          backgroundColor: 'rgba(150, 150, 150, 0.8)', // Gray for neutral
          borderColor: 'rgba(150, 150, 150, 1)',
          borderWidth: 1,
          fill: 'origin',
          tension: 0.4,
        },
        {
          label: 'Negative',
          data: negativeData,
          backgroundColor: 'rgba(255, 99, 132, 0.8)', // Red for negative
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          fill: 'origin',
          tension: 0.4,
        }
      ]
    };
  };
  
  // Calculate sentiment over time for Nordstrom (main brand)
  const nordstromSentimentOverTime = useMemo(() => {
    return calculateSentimentOverTime(mainBrand);
  }, [posts, platform, mainBrand]);
  
  // Calculate sentiment over time for selected competitor
  const competitorSentimentOverTime = useMemo(() => {
    return calculateSentimentOverTime(selectedCompetitor);
  }, [posts, platform, selectedCompetitor]);
  
  // Check if there's any data to display
  const hasData = useMemo(() => {
    let totalPosts = 0;
    selectedBrands.forEach(brand => {
      totalPosts += (posts[brand]?.length || 0);
    });
    return totalPosts > 0;
  }, [selectedBrands, posts]);
  
  // Check if we're dealing with TikTok data but no sentiments have been calculated
  const checkAndFixTikTokData = useMemo(() => {
    if (platform === 'TikTok') {
      let hasPosts = false;
      let hasSentiment = false;
      
      selectedBrands.forEach(brand => {
        const brandPosts = posts[brand] || [];
        if (brandPosts.length > 0) {
          hasPosts = true;
          // Check if at least one post has sentiment data (either score or label)
          if (brandPosts.some(post => 'sentimentScore' in post || 'sentimentLabel' in post)) {
            hasSentiment = true;
          }
        }
      });
      
      return hasPosts && !hasSentiment; // Return true if there are TikTok posts but no sentiment data
    }
    return false;
  }, [platform, selectedBrands, posts]);
  
  // Common chart options
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${percentage}% (${value})`;
          }
        }
      }
    },
  };

  // Options for stacked area chart (Line type)
  const stackedAreaOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        stacked: true,
        beginAtZero: true,
      },
      x: {
        stacked: true,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };
  
  // Options specifically for Bar charts
  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        stacked: true,
        beginAtZero: true,
      },
      x: {
        stacked: true,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  if (!hasData && !checkAndFixTikTokData) {
    return (
      <div className="mt-8 p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Sentiment Analysis</h2>
        <EmptyChartFallback message={`No ${localPlatform} data available for sentiment analysis`} />
      </div>
    );
  }

  return (
    // Root div styling is removed as it will be handled by the parent in DashboardOverview.tsx
    <div>
      {/* Local platform toggle for Sentiment Analysis */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2 md:gap-0">
        <h3 className="text-lg font-semibold">Sentiment Analysis</h3>
        <div className="flex items-center gap-4">
          <FormControl size="small" variant="outlined">
            <InputLabel id="sentiment-month-label">Month</InputLabel>
            <Select
              labelId="sentiment-month-label"
              id="sentiment-month-select"
              value={selectedMonth}
              label="Month"
              onChange={(e: SelectChangeEvent<string>) => onMonthChange(e.target.value)}
              style={{ minWidth: 120 }}
            >
              <MenuItem value="All (Feb-May)">All</MenuItem>
              <MenuItem value="February">February</MenuItem>
              <MenuItem value="March">March</MenuItem>
              <MenuItem value="April">April</MenuItem>
              <MenuItem value="May">May</MenuItem>
            </Select>
          </FormControl>
          <ToggleButtonGroup
            value={localPlatform}
            exclusive
            onChange={(_event: React.MouseEvent<HTMLElement>, newPlatform: 'Instagram' | 'TikTok' | null) => {
              if (newPlatform) setLocalPlatform(newPlatform);
            }}
            size="small"
            aria-label="Platform"
          >
            <ToggleButton value="Instagram" aria-label="Instagram">
              Instagram
            </ToggleButton>
            <ToggleButton value="TikTok" aria-label="TikTok">
              TikTok
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        Sentiment analysis of {localPlatform} posts for selected brands based on post text/captions.
      </p>
      
      {checkAndFixTikTokData ? (
        <div className="p-6 text-center bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-300 dark:border-yellow-700">
          <p className="text-yellow-700 dark:text-yellow-300 mb-4">
            <strong>Note:</strong> TikTok sentiment analysis requires text data to be properly loaded. 
            Please ensure your TikTok data includes captions or text content.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Bar Chart - Sentiment Distribution by Brand */}
          <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow"> {/* Adjusted inner card styling */}
            <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-3">Sentiment Distribution by Brand</h3>
            <div className="h-80">
              {sentimentDistributionByBrand.datasets[0].data.every(d => d === 0) &&
               sentimentDistributionByBrand.datasets[1].data.every(d => d === 0) &&
               sentimentDistributionByBrand.datasets[2].data.every(d => d === 0) ? (
                <EmptyChartFallback message="No sentiment data available" />
              ) : (
                <Bar data={sentimentDistributionByBrand} options={stackedBarOptions} />
              )}
            </div>
          </div>
          

        </div>
      )}
    </div>
  );
};

export default SentimentAnalysis;
