import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import * as BiIcons from 'react-icons/bi';
import * as HiIcons from 'react-icons/hi';
import { FiSun, FiMoon } from 'react-icons/fi';
import { HiOutlineMenu } from 'react-icons/hi'; // Added for mobile menu
import { ALL_BRANDS } from '../../services/api';
import { useSocialData } from '../../context/SocialDataContext';
import { AVAILABLE_MONTHS, initialFilterOptions } from '../../context/SocialDataContext';
import { Brand, Platform } from '../../types';

interface HeaderProps {
  // No props needed for simplified header
}

const Header: React.FC<HeaderProps> = () => {
  const { 
    isLoading, 
    refreshData, 
    socialData, 
    filterOptions, 
    setFilterOptions,
    selectedBrands, 
    setSelectedBrands,
    darkMode,
    toggleDarkMode // Added
  } = useSocialData();

  const [showFilters, setShowFilters] = useState(false);
  const [refreshClicked, setRefreshClicked] = useState(false);
  const [activeFilterSection, setActiveFilterSection] = useState<'platform' | 'months' | 'brands' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Added for mobile menu
  
  // Handle click outside to close filter dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.filter-dropdown') && !target.closest('.filter-button')) {
        setActiveFilterSection(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle brand selection
  const handleBrandSelection = (brand: Brand) => {
    if (selectedBrands.includes(brand)) {
      // Don't allow deselecting if it's the last selected brand
      if (selectedBrands.length > 1) {
        setSelectedBrands(selectedBrands.filter(b => b !== brand));
      }
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
    // Refresh data when changing brands
    refreshData();
  };

  // Handle data refresh
  const handleRefresh = async () => {
    setRefreshClicked(true);
    await refreshData();
    setTimeout(() => setRefreshClicked(false), 1000);
  };

  // Handle platform filter change
  const handlePlatformChange = (platform: Platform | 'All') => {
    setFilterOptions({
      ...filterOptions,
      platform
    });
    // Refresh data when changing platform
    refreshData();
  };
  
  // Handle month selection - single select dropdown
  const handleMonthSelection = (month: string) => {
    setFilterOptions({
      ...filterOptions,
      selectedMonth: month
    });
    // Refresh data when changing months
    refreshData();
  };

  // Get the last fetched time for display
  const getLastFetchedTime = () => {
    const times: Date[] = [];
    
    // Collect all last fetched times
    selectedBrands.forEach(brand => {
      const instagramTime = socialData.lastFetched.Instagram[brand];
      const tiktokTime = socialData.lastFetched.TikTok[brand];
      
      // Make sure we only add valid Date objects
      if (instagramTime && instagramTime instanceof Date && !isNaN(instagramTime.getTime())) {
        times.push(instagramTime);
      }
      if (tiktokTime && tiktokTime instanceof Date && !isNaN(tiktokTime.getTime())) {
        times.push(tiktokTime);
      }
    });
    
    if (times.length === 0) return 'Never';
    
    // Return the most recent time
    try {
      const mostRecent = new Date(Math.max(...times.map(t => t.getTime())));
      return format(mostRecent, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  };

  return (
    <div className={`sticky top-0 left-0 right-0 z-50 bg-white text-gray-800 shadow-md transition-all duration-300`}>
      <div className="p-4 flex justify-between items-center">
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-sans font-bold text-nordstrom-blue">Nordstrom Social Analytics</h1>
            {isLoading && (
              <div className="ml-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-nordstrom-blue mr-2"></div> {/* Adjusted border color */}
                <span className="text-xs text-nordstrom-blue">Updating data...</span> {/* Adjusted text color */}
              </div>
            )}
          </div>
          {/* "Last updated" text and "Refresh now" span removed as per subtask */}
        </div>

        {/* Desktop Menu Items */}
        <div className="hidden lg:flex items-center space-x-3">
          {/* Dark Mode Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors duration-150 ${darkMode ? 'hover:bg-gray-700 text-gray-300 hover:text-yellow-400' : 'hover:bg-gray-100 text-gray-500 hover:text-[#004170]'} focus:outline-none focus:ring-2 focus:ring-[#004170]`}
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
          </motion.button>
          
          {/* Filter dropdowns */}
          <div className="flex items-center space-x-2">
            {/* Month selector */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveFilterSection(activeFilterSection === 'months' ? null : 'months')}
                className="bg-transparent border border-[#004170] text-[#004170] hover:bg-[#004170] hover:text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 flex items-center filter-button group"
              >
                <FaIcons.FaCalendarAlt className="mr-2 text-[#004170] group-hover:text-white transition-colors duration-150" size={14} />
                <span>Month: {filterOptions.selectedMonth}</span>
                <BiIcons.BiChevronDown className="ml-1" />
              </motion.button>
              
              {activeFilterSection === 'months' && (
                <div className={`absolute right-0 mt-2 w-64 rounded-md shadow-lg ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-800'} ring-1 ring-black ring-opacity-5 z-50 filter-dropdown`}> {/* Adjusted dropdown bg */}
                  <div className="p-3">
                    <div className="mb-2">
                      <h3 className="font-medium">Select Month</h3>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      {['All (Feb-May)', 'February', 'March', 'April', 'May'].map((month) => (
                        <button
                          key={month}
                          onClick={() => handleMonthSelection(month)}
                          className={`px-3 py-2 rounded-md flex items-center justify-between ${
                            filterOptions.selectedMonth === month
                              ? 'bg-nordstrom-blue text-white' /* Active item */
                              : (darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100')
                          }`}
                        >
                          <span>{month}</span>
                          {filterOptions.selectedMonth === month && 
                            <AiIcons.AiOutlineCheck size={14} className="ml-2" />
                          }
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Brand selector */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveFilterSection(activeFilterSection === 'brands' ? null : 'brands')}
                className="bg-transparent border border-[#004170] text-[#004170] hover:bg-[#004170] hover:text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 flex items-center filter-button group"
              >
                <FaIcons.FaStore className="mr-2 text-[#004170] group-hover:text-white transition-colors duration-150" size={14} />
                <span>Brands ({selectedBrands.length})</span>
                <BiIcons.BiChevronDown className="ml-1" />
              </motion.button>
              
              {activeFilterSection === 'brands' && (
                <div className={`absolute right-0 mt-2 w-72 rounded-md shadow-lg ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-800'} ring-1 ring-black ring-opacity-5 z-50 filter-dropdown`}> {/* Adjusted dropdown bg */}
                  <div className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Select Brands</h3>
                      <div className="text-xs text-gray-400">
                        {selectedBrands.length} selected
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {ALL_BRANDS.map((brand) => (
                        <button
                          key={brand}
                          onClick={() => handleBrandSelection(brand)}
                          className={`px-3 py-2 rounded-md flex items-center justify-between ${
                            selectedBrands.includes(brand)
                              ? 'bg-nordstrom-blue text-white' /* Active item */
                              : (darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100')
                          }`}
                        >
                          <span className="truncate">{brand}</span>
                          {selectedBrands.includes(brand) && 
                            <AiIcons.AiOutlineCheck size={14} className="ml-2 flex-shrink-0" />
                          }
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Platform selector */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveFilterSection(activeFilterSection === 'platform' ? null : 'platform')}
                className="bg-transparent border border-[#004170] text-[#004170] hover:bg-[#004170] hover:text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 flex items-center filter-button group"
              >
                {filterOptions.platform === 'Instagram' && <FaIcons.FaInstagram className="mr-2 text-[#004170] group-hover:text-white transition-colors duration-150" size={14} />}
                {filterOptions.platform === 'TikTok' && <FaIcons.FaTiktok className="mr-2 text-[#004170] group-hover:text-white transition-colors duration-150" size={14} />}
                <span>Platform: {filterOptions.platform}</span>
                <BiIcons.BiChevronDown className="ml-1" />
              </motion.button>
              
              {activeFilterSection === 'platform' && (
                <div className={`absolute right-0 mt-2 w-52 rounded-md shadow-lg ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-800'} ring-1 ring-black ring-opacity-5 z-50 filter-dropdown`}> {/* Adjusted dropdown bg */}
                  <div className="p-3">
                    <div className="mb-2">
                      <h3 className="font-medium">Select Platform</h3>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      {/* Modified to only offer Instagram and TikTok */}
                      {['Instagram', 'TikTok'].map((platform) => (
                        <button
                          key={platform}
                          onClick={() => handlePlatformChange(platform as Platform)} // 'All' is no longer an option here
                          className={`px-3 py-2 rounded-md flex items-center justify-between ${
                            filterOptions.platform === platform
                              ? 'bg-nordstrom-blue text-white' /* Active item */
                              : (darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100')
                          }`}
                        >
                          <span className="flex items-center">
                            {/* Removed 'All' platform icon logic */}
                            {platform === 'Instagram' && <FaIcons.FaInstagram size={16} className="mr-2" />}
                            {platform === 'TikTok' && <FaIcons.FaTiktok size={16} className="mr-2" />}
                            {platform}
                          </span>
                          {filterOptions.platform === platform && 
                            <AiIcons.AiOutlineCheck size={14} className="ml-2" />
                          }
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* "Reset filters" button removed as per subtask - this was already done in a previous step, re-confirming */}
          </div>

          {/* "Refresh Data" button removed as per subtask - this was already done in a previous step, re-confirming */}
          
          {/* Export Button */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-transparent border border-[#004170] text-[#004170] hover:bg-[#004170] hover:text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 flex items-center group"
              onClick={() => {
                const platformToExport = filterOptions.platform;
                const exportDate = new Date().toISOString().split('T')[0];
                const fileName = `Nordstrom_Social_Analytics_${platformToExport}_${exportDate}.pdf`;

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

        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen);
              if (isMobileMenuOpen) setActiveFilterSection(null); // Close filter dropdowns when closing mobile menu
            }}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-nordstrom-blue text-gray-600 hover:text-nordstrom-blue" /* Adjusted for light bg */
            aria-label="Toggle menu"
          >
            <HiOutlineMenu size={24} />
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {/* TODO: Restyle this mobile panel for a bg-white header theme. */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`lg:hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} shadow-lg overflow-hidden`} /* Adjusted for light theme */
          >
            <div className="p-4 space-y-3">
              {/* Dark Mode Toggle */}
              <motion.button
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-between p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-nordstrom-blue text-gray-700"  /* Adjusted for light theme */
              >
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
              </motion.button>

              {/* Month selector */}
              <div className="relative">
                <motion.button
                  onClick={() => setActiveFilterSection(activeFilterSection === 'months' ? null : 'months')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-md flex items-center justify-between filter-button" /* Adjusted for light theme */
                >
                  <div className="flex items-center">
                    <FaIcons.FaCalendarAlt className="mr-2" size={14} />
                    <span>Month: {filterOptions.selectedMonth}</span>
                  </div>
                  <BiIcons.BiChevronDown className="ml-1" />
                </motion.button>
                {activeFilterSection === 'months' && (
                  <div className={`mt-1 rounded-md shadow-lg ${darkMode ? 'bg-gray-600 text-gray-100' : 'bg-white text-gray-800'} ring-1 ring-black ring-opacity-5 z-50 filter-dropdown`}> {/* Adjusted for light theme */}
                    <div className="p-3 space-y-2">
                      <h3 className="font-medium text-sm">Select Month</h3>
                      {['All (Feb-May)', 'February', 'March', 'April', 'May'].map((month) => (
                        <button
                          key={month}
                          onClick={() => { handleMonthSelection(month); setIsMobileMenuOpen(false); setActiveFilterSection(null); }}
                          className={`w-full px-3 py-2 rounded-md flex items-center justify-between text-sm ${
                            filterOptions.selectedMonth === month
                              ? 'bg-nordstrom-blue text-white' /* Active item */
                              : (darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-100')
                          }`}
                        >
                          <span>{month}</span>
                          {filterOptions.selectedMonth === month && <AiIcons.AiOutlineCheck size={14} className="ml-2" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Brand selector */}
              <div className="relative">
                <motion.button
                  onClick={() => setActiveFilterSection(activeFilterSection === 'brands' ? null : 'brands')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-md flex items-center justify-between filter-button" /* Adjusted for light theme */
                >
                  <div className="flex items-center">
                    <FaIcons.FaStore className="mr-2" size={14} />
                    <span>Brands ({selectedBrands.length})</span>
                  </div>
                  <BiIcons.BiChevronDown className="ml-1" />
                </motion.button>
                {activeFilterSection === 'brands' && (
                  <div className={`mt-1 rounded-md shadow-lg ${darkMode ? 'bg-gray-600 text-gray-100' : 'bg-white text-gray-800'} ring-1 ring-black ring-opacity-5 z-50 filter-dropdown`}> {/* Adjusted for light theme */}
                    <div className="p-3">
                      <h3 className="font-medium text-sm mb-2">Select Brands ({selectedBrands.length})</h3>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {ALL_BRANDS.map((brand) => (
                          <button
                            key={brand}
                            onClick={() => { handleBrandSelection(brand); /* Do not close menu here to allow multi-select */ }}
                            className={`px-3 py-2 rounded-md flex items-center justify-between text-sm ${
                              selectedBrands.includes(brand)
                                ? 'bg-nordstrom-blue text-white' /* Active item */
                                : (darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-100')
                            }`}
                          >
                            <span className="truncate">{brand}</span>
                            {selectedBrands.includes(brand) && <AiIcons.AiOutlineCheck size={14} className="ml-2 flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                       <button onClick={() => {setIsMobileMenuOpen(false); setActiveFilterSection(null);}} className={`mt-2 w-full p-2 rounded-md text-sm ${darkMode ? 'bg-gray-500 text-gray-100 hover:bg-gray-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Done</button> {/* Adjusted for light theme */}
                    </div>
                  </div>
                )}
              </div>

              {/* Platform selector */}
              <div className="relative">
                <motion.button
                  onClick={() => setActiveFilterSection(activeFilterSection === 'platform' ? null : 'platform')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-md flex items-center justify-between filter-button" /* Adjusted for light theme */
                >
                  <div className="flex items-center">
                    {filterOptions.platform === 'Instagram' && <FaIcons.FaInstagram className="mr-2" size={14} />}
                    {filterOptions.platform === 'TikTok' && <FaIcons.FaTiktok className="mr-2" size={14} />}
                    <span>Platform: {filterOptions.platform}</span>
                  </div>
                  <BiIcons.BiChevronDown className="ml-1" />
                </motion.button>
                {activeFilterSection === 'platform' && (
                  <div className={`mt-1 rounded-md shadow-lg ${darkMode ? 'bg-gray-600 text-gray-100' : 'bg-white text-gray-800'} ring-1 ring-black ring-opacity-5 z-50 filter-dropdown`}> {/* Adjusted for light theme */}
                    <div className="p-3 space-y-2">
                      <h3 className="font-medium text-sm">Select Platform</h3>
                      {/* Modified to only offer Instagram and TikTok */}
                      {['Instagram', 'TikTok'].map((platform) => (
                        <button
                          key={platform}
                          onClick={() => { handlePlatformChange(platform as Platform); setIsMobileMenuOpen(false); setActiveFilterSection(null);}}
                          className={`w-full px-3 py-2 rounded-md flex items-center justify-between text-sm ${
                            filterOptions.platform === platform
                              ? 'bg-nordstrom-blue text-white' /* Active item */
                              : (darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-100')
                          }`}
                        >
                          <span className="flex items-center">
                            {/* Removed 'All' platform icon logic */}
                            {platform === 'Instagram' && <FaIcons.FaInstagram size={16} className="mr-2" />}
                            {platform === 'TikTok' && <FaIcons.FaTiktok size={16} className="mr-2" />}
                            {platform}
                          </span>
                          {filterOptions.platform === platform && <AiIcons.AiOutlineCheck size={14} className="ml-2" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* "Reset Filters" button removed from mobile menu as it was removed from desktop */}
              {/* "Refresh Data" button removed from mobile menu as it was removed from desktop */}

              {/* Export Button */}
              <motion.button
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-md flex items-center justify-center" /* Adjusted for light theme */
                onClick={() => {
                  const platformToExport = filterOptions.platform;
                  const exportDate = new Date().toISOString().split('T')[0];
                  const fileName = `Nordstrom_Social_Analytics_${platformToExport}_${exportDate}.pdf`;

                  const dashboardContentElement = document.getElementById('dashboard-content-to-export');

                  if (dashboardContentElement) {
                    html2canvas(dashboardContentElement, { 
                      scale: 2, 
                      useCORS: true, 
                      logging: true,
                      onclone: (doc) => { // Changed 'document' to 'doc' to avoid conflict
                        if (darkMode) {
                          doc.documentElement.classList.add('dark');
                        }
                      }
                    }).then(canvas => {
                      const imgData = canvas.toDataURL('image/png');
                      const pdf = new jsPDF({
                        orientation: 'portrait',
                        unit: 'px',
                        format: [canvas.width, canvas.height]
                      });
                      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                      pdf.save(fileName);
                    }).catch(error => {
                      console.error('Error generating PDF for mobile:', error);
                      alert('Failed to generate PDF. Please check the console for errors.');
                    });
                  } else {
                    console.error('Dashboard content element not found for PDF export (mobile).');
                    alert('Could not find content to export. Please ensure the dashboard content area has the ID "dashboard-content-to-export".');
                  }
                  setIsMobileMenuOpen(false); 
                  setActiveFilterSection(null);
                }}
              >
                <HiIcons.HiOutlineDownload className="mr-2" />
                <span>Export Data</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters panel (secondary filter UI, kept for now but might be redundant) */}
      {/* TODO: This entire section needs to be restyled or removed if mobile panel is sufficient */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`px-4 pb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} shadow-md`} /* Adjusted for light theme */
          >
            {/* Filter Navigation */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveFilterSection('platform')}
                  className={`px-4 py-2 font-medium ${
                    activeFilterSection === 'platform' 
                      ? `border-b-2 border-nordstrom-blue text-nordstrom-blue`
                      : `text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200`
                  }`}
                >
                  Platforms
                </button>
                <button
                  onClick={() => setActiveFilterSection('months')}
                  className={`px-4 py-2 font-medium ${
                    activeFilterSection === 'months' 
                      ? `border-b-2 border-nordstrom-blue text-nordstrom-blue`
                      : `text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200`
                  }`}
                >
                  Months
                </button>
                <button
                  onClick={() => setActiveFilterSection('brands')}
                  className={`px-4 py-2 font-medium ${
                    activeFilterSection === 'brands' 
                      ? `border-b-2 border-nordstrom-blue text-nordstrom-blue`
                      : `text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200`
                  }`}
                >
                  Brands
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Platform Filter Section */}
              {activeFilterSection === 'platform' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`font-medium text-gray-800 dark:text-gray-100`}>Select Platform</h3>
                    <div className={`text-xs text-gray-500 dark:text-gray-400`}>Choose which platform(s) to analyze</div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Instagram', 'TikTok'].map((platform) => (
                      <button
                        key={platform}
                        onClick={() => handlePlatformChange(platform as Platform | 'All')}
                        className={`px-4 py-2 rounded-md flex items-center ${filterOptions.platform === platform
                          ? 'bg-nordstrom-blue text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {platform === 'All' && <BiIcons.BiWorld className="mr-2" />}
                        {platform === 'Instagram' && <FaIcons.FaInstagram className="mr-2" />}
                        {platform === 'TikTok' && <FaIcons.FaTiktok className="mr-2" />}
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Months Filter Section */}
              {activeFilterSection === 'months' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`font-medium text-gray-800 dark:text-gray-100`}>Select Months</h3>
                    <div className="flex space-x-2">
                        <button
                          onClick={() => handleMonthSelection('All (Feb-May)')}
                          className={`text-xs text-nordstrom-blue hover:underline flex items-center`}
                        >
                        <AiIcons.AiOutlineCheckSquare size={16} className="mr-1" /> Select All
                      </button>
                        <button
                          onClick={() => handleMonthSelection('February')}
                           className={`text-xs text-nordstrom-blue hover:underline flex items-center`}
                        >
                        <AiIcons.AiOutlineClear size={16} className="mr-1" /> Clear
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {AVAILABLE_MONTHS.map((month) => (
                      <button
                        key={month}
                        onClick={() => handleMonthSelection(month)}
                        className={`px-4 py-3 rounded-md flex items-center justify-between ${
                          filterOptions.selectedMonth === month
                            ? 'bg-nordstrom-blue text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <span>{month}</span>
                        {filterOptions.selectedMonth === month && 
                          <AiIcons.AiOutlineCheck size={16} className="ml-2" />
                        }
                      </button>
                    ))}
                  </div>
                  
                  <div className={`mt-2 p-2 bg-blue-50 text-blue-800 dark:bg-gray-700 dark:text-gray-300 text-xs rounded`}>
                    <p className="flex items-center">
                      <BiIcons.BiInfoCircle size={16} className="mr-1 flex-shrink-0" />
                      Data is filtered by <code className={`mx-1 px-1 bg-blue-100 dark:bg-gray-600 rounded`}>timestamp</code> for Instagram and <code className={`mx-1 px-1 bg-blue-100 dark:bg-gray-600 rounded`}>createTimeISO</code> for TikTok.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Brands Filter Section */}
              {activeFilterSection === 'brands' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`font-medium text-gray-800 dark:text-gray-100`}>Select Brands to Compare</h3>
                    <div className={`text-xs text-gray-500 dark:text-gray-400`}>
                      {selectedBrands.length} brand(s) selected
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {ALL_BRANDS.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => handleBrandSelection(brand)}
                        className={`px-3 py-2 rounded-md flex items-center justify-between ${
                          selectedBrands.includes(brand)
                            ? 'bg-nordstrom-blue text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <span>{brand}</span>
                        {selectedBrands.includes(brand) && 
                          <AiIcons.AiOutlineCheck size={16} className="ml-2" />
                        }
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Header;