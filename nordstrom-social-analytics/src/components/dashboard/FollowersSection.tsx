import React, { useMemo } from 'react';
import { Bar, Line, Chart } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ChartOptions
} from 'chart.js';
import { Brand, InstagramPost, TikTokPost, SocialPlatform } from '../../types';
import EmptyChartFallback from '../common/EmptyChartFallback';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type FollowersSectionProps = {
  platform: SocialPlatform;
  selectedBrands: Brand[];
  posts: Record<Brand, (InstagramPost | TikTokPost)[]>;
  followersData?: Record<Brand, { date: string; count: number }[]>;
};

const FollowersSection: React.FC<FollowersSectionProps> = ({ 
  platform, 
  selectedBrands, 
  posts,
  followersData 
}) => {
  // Pastel color palette
  const pastelColors = [
    'rgba(187, 222, 251, 0.7)',  // Light Blue
    'rgba(209, 196, 233, 0.7)',  // Lavender
    'rgba(244, 143, 177, 0.7)',  // Pink
    'rgba(200, 230, 201, 0.7)',  // Mint Green
    'rgba(255, 224, 178, 0.7)',  // Light Orange
    'rgba(225, 190, 231, 0.7)',  // Light Purple
    'rgba(255, 245, 157, 0.7)',  // Light Yellow
    'rgba(220, 237, 200, 0.7)',  // Light Green
  ];

  // Check if we have followers data
  const hasData = useMemo(() => {
    if (!followersData) return false;
    
    for (const brand of selectedBrands) {
      if (followersData[brand]?.length > 0) {
        return true;
      }
    }
    return false;
  }, [followersData, selectedBrands]);

  // Calculate followers count by brand
  const followersByBrand = useMemo(() => {
    // Simulate or extract follower count data
    // In a real implementation, this would come from API or stored data
    const dataset = selectedBrands.map((brand, index) => {
      // For demonstration - calculate a simulated followers count
      // In real implementation, use actual follower counts
      let followerCount = 0;
      
      if (platform === 'Instagram') {
        // Simulate Instagram followers (10k-100k range)
        followerCount = Math.floor(10000 + Math.random() * 90000);
      } else {
        // Simulate TikTok followers (5k-80k range)
        followerCount = Math.floor(5000 + Math.random() * 75000);
      }
      
      return followerCount;
    });

    return {
      labels: selectedBrands,
      datasets: [
        {
          label: `${platform} Followers`,
          data: dataset,
          backgroundColor: selectedBrands.map((_, i) => pastelColors[i % pastelColors.length]),
          borderColor: selectedBrands.map((_, i) => pastelColors[i % pastelColors.length].replace('0.7', '1')),
          borderWidth: 1,
        }
      ]
    };
  }, [selectedBrands, platform, pastelColors]);

  // Followers growth over time by brand
  const followersGrowthOverTime = useMemo(() => {
    // In a real implementation, this would use actual historical followers data
    // For now, let's simulate a 30-day period with growth trends
    
    const days = 30;
    const dates = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      return date.toISOString().split('T')[0];
    });
    
    const datasets = selectedBrands.map((brand, brandIndex) => {
      // Starting follower count (differ by brand)
      const startingCount = platform === 'Instagram' 
        ? 10000 + brandIndex * 5000 
        : 5000 + brandIndex * 3000;
      
      // Growth rate (varies by brand)
      const growthFactor = 1 + (0.005 + (brandIndex * 0.002));
      
      // Generate follower count data with some randomness
      const followerCounts = dates.map((_, dayIndex) => {
        const baseCount = startingCount * Math.pow(growthFactor, dayIndex);
        // Add some random fluctuation
        const randomFactor = 0.98 + (Math.random() * 0.04);
        return Math.floor(baseCount * randomFactor);
      });
      
      return {
        label: `${brand}`,
        data: followerCounts,
        borderColor: pastelColors[brandIndex % pastelColors.length].replace('0.7', '1'),
        backgroundColor: pastelColors[brandIndex % pastelColors.length],
        borderWidth: 2,
        tension: 0.4,
        fill: false,
      };
    });
    
    return {
      labels: dates,
      datasets
    };
  }, [selectedBrands, platform, pastelColors]);

  // Chart options
  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw as number;
            return `${context.dataset.label}: ${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return (value as number).toLocaleString();
          }
        }
      }
    }
  };

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw as number;
            return `${context.dataset.label}: ${value.toLocaleString()} followers`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return (value as number).toLocaleString();
          }
        }
      }
    }
  };

  return (
    <div className="mt-8 p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Followers Analytics</h2>
      <p className="text-sm text-gray-600 mb-6">
        Follower count and growth analysis for {platform} accounts of selected brands.
      </p>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Bar Chart - Followers by Brand */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Followers by Brand</h3>
          <div className="h-80">
            {followersByBrand.datasets[0].data.length === 0 ? (
              <EmptyChartFallback message="No followers data available" />
            ) : (
              <Bar data={followersByBrand} options={barOptions} />
            )}
          </div>
        </div>
        
        {/* Line Chart - Followers Growth Over Time */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Followers Growth Over Time</h3>
          <div className="h-80">
            {followersGrowthOverTime.labels.length === 0 ? (
              <EmptyChartFallback message="No followers history data available" />
            ) : (
              <Line data={followersGrowthOverTime} options={lineOptions} />
            )}
          </div>
          <div className="mt-4 text-sm text-gray-500 italic">
            <p>Note: This chart shows simulated growth data for demonstration purposes.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowersSection;
