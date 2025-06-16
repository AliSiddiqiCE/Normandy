import React from 'react';
import * as BiIcons from 'react-icons/bi';

interface EmptyChartFallbackProps {
  message?: string;
}

const EmptyChartFallback: React.FC<EmptyChartFallbackProps> = ({ 
  message = 'No data available for this chart' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-50 rounded-lg">
      <BiIcons.BiBarChartAlt2 className="text-gray-300 text-5xl mb-3" />
      <p className="text-gray-500 text-center">{message}</p>
    </div>
  );
};

export default EmptyChartFallback;
