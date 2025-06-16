import React from 'react';
import { motion } from 'framer-motion';
import * as BiIcons from 'react-icons/bi';

interface TikTokEngagementCardProps {
  tikTokEngagementRate: number;
  competitorTikTokEngagementRate: number;
  selectedCompetitor: string;
  cardVariants: any;
}

const TikTokEngagementCard: React.FC<TikTokEngagementCardProps> = ({
  tikTokEngagementRate,
  competitorTikTokEngagementRate,
  selectedCompetitor,
  cardVariants
}) => {
  return (
    <motion.div
      custom={4} // Ensure this custom index is unique if used with others in the same list
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 ease-out"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Engagement Rate (TikTok)</p>
          <h3 className="text-3xl font-bold text-nordstrom-orange mt-1">{tikTokEngagementRate.toFixed(2)}%</h3>
        </div>
        <BiIcons.BiTrendingUp className="text-3xl text-nordstrom-orange/70 dark:text-nordstrom-orange/60" />
      </div>
      <div className="mt-4 text-xs text-gray-600 dark:text-gray-300">
        <div className="flex justify-between">
          <p>Nordstrom</p>
          <p className="font-medium">{tikTokEngagementRate.toFixed(2)}%</p>
        </div>
        <div className="flex justify-between mt-1">
          <p>{selectedCompetitor}</p>
          <p className="font-medium">{competitorTikTokEngagementRate.toFixed(2)}%</p>
        </div>
        {tikTokEngagementRate > 0 && competitorTikTokEngagementRate > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <p>
              {tikTokEngagementRate > competitorTikTokEngagementRate 
                ? `Nordstrom has ${(tikTokEngagementRate - competitorTikTokEngagementRate).toFixed(2)}% higher engagement.`
                : tikTokEngagementRate < competitorTikTokEngagementRate
                  ? `${selectedCompetitor} has ${(competitorTikTokEngagementRate - tikTokEngagementRate).toFixed(2)}% higher engagement.`
                  : 'Equal engagement rates.'}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TikTokEngagementCard;