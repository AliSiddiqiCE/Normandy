import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSocialData } from '../../context/SocialDataContext';
import {
  ChartPieIcon,
  CameraIcon,
  MusicalNoteIcon,
  ArrowsRightLeftIcon,
  HashtagIcon,
  ChartBarSquareIcon,
  HomeIcon, // For Nordstrom main icon
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isCollapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useSocialData();

  const navItems = [
    { path: '/', icon: ChartPieIcon, label: 'Dashboard' },
    { path: '/instagram', icon: CameraIcon, label: 'Instagram' },
    { path: '/tiktok', icon: MusicalNoteIcon, label: 'TikTok' },
    { path: '/comparison', icon: ArrowsRightLeftIcon, label: 'Comparison' },
    { path: '/hashtags', icon: HashtagIcon, label: 'Hashtags' },
    { path: '/analytics', icon: ChartBarSquareIcon, label: 'Analytics' },
  ];

  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0, width: isCollapsed ? 64 : 256 }}
      className={`h-screen fixed top-0 left-0 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'} shadow-lg transition-all duration-300 overflow-hidden flex flex-col`}
    >
      <div className={`p-4 ${isCollapsed ? 'flex justify-center items-center' : ''}`}>
        <div className={`${isCollapsed ? '' : 'flex items-center'}`}>
          <HomeIcon className={`h-8 w-8 ${isCollapsed ? '' : 'mr-2'} ${darkMode ? 'text-gray-300' : 'text-nordstrom-blue'}`} />
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-nordstrom-blue">Nordstrom</h1>
              <p className="text-xs text-gray-500">Social Analytics</p>
            </div>
          )}
        </div>
      </div>

      <nav className="mt-6 flex-grow">
        <ul>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const IconComponent = item.icon;
            return (
              <motion.li key={item.path} whileHover={{ scale: isCollapsed ? 1.1 : 1.03 }} whileTap={{ scale: 0.97 }}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center group ${isCollapsed ? 'justify-center' : ''} p-4 text-left transition-colors duration-150 ${
                    isActive
                      ? (darkMode ? 'bg-gray-700 text-nordstrom-blue font-semibold' : 'bg-nordstrom-blue/10 text-nordstrom-blue font-semibold')
                      : (darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-nordstrom-blue font-medium' : 'text-gray-700 hover:bg-gray-100 hover:text-nordstrom-blue font-medium')
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <IconComponent className={`h-6 w-6 ${isCollapsed ? '' : 'mr-3'} ${
                    isActive
                      ? 'text-nordstrom-blue' // Active icon color
                      : (darkMode ? 'text-gray-400 group-hover:text-nordstrom-blue' : 'text-gray-500 group-hover:text-nordstrom-blue') // Inactive icon color
                  }`} />
                  {!isCollapsed && <span className="flex-grow">{item.label}</span>}
                  {/* Visual indicator for active link (optional, if not using background) */}
                  {isActive && !isCollapsed && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="w-1 h-6 bg-nordstrom-blue rounded"
                    />
                  )}
                </button>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Theme Toggle Section - ensure it stays at the bottom */}
      <div className="p-4 mt-auto border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Theme</span>
            <button
              onClick={toggleDarkMode}
              className={`p-1.5 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              aria-label="Toggle theme"
            >
              {darkMode ?
                <SunIcon className="h-5 w-5 text-yellow-400" /> :
                <MoonIcon className="h-5 w-5 text-gray-600" />
              }
            </button>
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {darkMode ?
                <SunIcon className="h-5 w-5 text-yellow-400" /> :
                <MoonIcon className="h-5 w-5 text-gray-600" />
              }
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Sidebar;