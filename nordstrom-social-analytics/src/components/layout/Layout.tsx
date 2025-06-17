import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import { useSocialData } from '../../context/SocialDataContext';

const Layout: React.FC = () => {
  const { darkMode } = useSocialData();

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
