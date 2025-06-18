import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useSocialData } from '../../context/SocialDataContext';

const Header: React.FC = () => {
  const { darkMode, toggleDarkMode, isLoading } = useSocialData();
  
  // Get the current date for display
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className={`sticky top-0 z-50 w-full transition-colors duration-300 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 shadow-md'}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Nordstrom Social Analytics</h1>
            {isLoading && (
              <div className="ml-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-nordstrom-blue mr-2"></div>
                <span className="text-xs text-nordstrom-blue">Updating data...</span>
              </div>
            )}
            <span className="text-sm opacity-75">{currentDate}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
