import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { motion } from 'framer-motion';
import * as HiIcons from 'react-icons/hi';
import { FiSun, FiMoon } from 'react-icons/fi';
import { HiOutlineMenu } from 'react-icons/hi'; // Added for mobile menu
import { ALL_BRANDS } from '../../services/api';
import { useSocialData } from '../../context/SocialDataContext';
import { AVAILABLE_MONTHS, initialFilterOptions } from '../../context/SocialDataContext';
import { Brand, Platform } from '../../types';
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
          {/* Export button */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-transparent border border-[#004170] text-[#004170] hover:bg-[#004170] hover:text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 flex items-center group"
              onClick={() => {
                const exportDate = new Date().toISOString().split('T')[0];
                const fileName = `Nordstrom_Social_Analytics_${exportDate}.pdf`;

                const dashboardContentElement = document.getElementById('dashboard-content-to-export'); // Ensure this ID exists on your main content wrapper

                if (dashboardContentElement) {
                  html2canvas(dashboardContentElement, { 
                    scale: 2, // Increase scale for better resolution
                    useCORS: true, // If you have cross-origin images
                    logging: true, // Enable logging for debugging
                    onclone: (doc) => {
                      // Attempt to ensure all styles are applied, especially for dark mode
                      if (darkMode) {
                        doc.documentElement.classList.add('dark'); // Or your specific dark mode class on html/body
                      }
                    }
                  }).then(canvas => {
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({
                      orientation: 'portrait',
                      unit: 'px',
                      format: [canvas.width, canvas.height] // Use canvas dimensions for PDF page size
                    });
                    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                    pdf.save(fileName);
                  }).catch(error => {
                    console.error('Error generating PDF:', error);
                    alert('Failed to generate PDF. Please check the console for errors.');
                  });
                } else {
                  console.error('Dashboard content element not found for PDF export.');
                  alert('Could not find content to export. Please ensure the dashboard content area has the ID "dashboard-content-to-export".');
                }
              }}
            >
              <span className="mr-2">📄</span>
              <span>Export</span>
            </motion.button>
          </div>
        </div>
        </div>
      
    </header>
    
  );
};

export default Header;
