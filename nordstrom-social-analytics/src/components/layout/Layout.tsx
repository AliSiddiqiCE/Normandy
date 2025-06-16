import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../layout/Header';
import { useSocialData } from '../../context/SocialDataContext';
import * as Fi from 'react-icons/fi';
import * as Fa from 'react-icons/fa';

const Layout: React.FC = () => {
  const { darkMode } = useSocialData();
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  
  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex-1 w-full">
        <Header />
        {/* Apply max-width and auto horizontal margins to center content, maintain padding for header */}
        <main className="pt-20 px-6 pb-8 transition-all duration-300 w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;