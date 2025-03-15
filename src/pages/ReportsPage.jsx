import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

// Import report components
import SalesReport from '../components/reports/SalesReport';
import InventoryReport from '../components/reports/InventoryReport';
import FinancialReport from '../components/reports/FinancialReport';

// Import hooks
import { useAuth } from '../hooks/useAuth';

const ReportsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [iconHovered, setIconHovered] = useState(false);
  
  // Get tab from URL query parameter or default to 'sales'
  const getTabFromURL = () => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    return tab || 'sales';
  };
  
  const [activeTab, setActiveTab] = useState(getTabFromURL());
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [appliedRange, setAppliedRange] = useState({
    startDate: null,
    endDate: null
  });

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getTabFromURL());
  }, [location.search]);
  
  // Set background color when the component mounts and restore when unmounting
  useEffect(() => {
    const originalBgColor = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#FFF6F2';
    
    return () => {
      document.body.style.backgroundColor = originalBgColor;
    };
  }, []);

  // Quick date range options
  const dateRangeOptions = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last7days', label: 'Last 7 Days' },
    { id: 'thisMonth', label: 'This Month' },
    { id: 'lastMonth', label: 'Last Month' },
    { id: 'custom', label: 'Custom Range' },
  ];

  // Set initial date range to "Last 7 Days" on component mount
  useEffect(() => {
    handleDateRangeSelect('last7days');
  }, []);

  // Update the URL when tab changes
  const handleTabChange = (tab) => {
    navigate(`/reports?tab=${tab}`);
    // setActiveTab is not needed here since useEffect will update it based on URL
  };

  const handleDateRangeSelect = (rangeId) => {
    const today = new Date();
    let startDate = null;
    let endDate = null;

    switch (rangeId) {
      case 'today':
        startDate = today;
        endDate = today;
        setIsCustomRange(false);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        startDate = yesterday;
        endDate = yesterday;
        setIsCustomRange(false);
        break;
      case 'last7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        startDate = sevenDaysAgo;
        endDate = today;
        setIsCustomRange(false);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = today;
        setIsCustomRange(false);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        setIsCustomRange(false);
        break;
      case 'custom':
        setIsCustomRange(true);
        return;
      default:
        return;
    }

    // Format dates as ISO strings for consistency
    const formattedStartDate = startDate ? startDate.toISOString().split('T')[0] : null;
    const formattedEndDate = endDate ? endDate.toISOString().split('T')[0] : null;

    setDateRange({
      startDate: formattedStartDate,
      endDate: formattedEndDate
    });

    // Also apply the range immediately when using quick options
    setAppliedRange({
      startDate: formattedStartDate,
      endDate: formattedEndDate
    });
  };

  const handleCustomRangeApply = () => {
    // Validate date range
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('Please select both start and end dates for custom range');
      return;
    }

    // Ensure start date is not after end date
    if (new Date(dateRange.startDate) > new Date(dateRange.endDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }

    // Apply the custom date range
    setAppliedRange({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  };

  const handleCustomRangeReset = () => {
    setDateRange({
      startDate: null,
      endDate: null
    });
  };

  const handleExport = useCallback(async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    
    try {
      switch (activeTab) {
        case 'sales':
          await exportSalesReport();
          break;
        case 'inventory':
          await exportInventoryReport();
          break;
        case 'financial':
          await exportFinancialReport();
          break;
        default:
          throw new Error('Unknown report type');
      }
      
      toast.success(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} report exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${activeTab} report: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  }, [activeTab, isExporting, appliedRange]);

  // Mock export functions (in a real app, these would call API services)
  const exportSalesReport = async () => {
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const exportInventoryReport = async () => {
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const exportFinancialReport = async () => {
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  // Format date range for display
  const displayDateRange = () => {
    if (!appliedRange.startDate) return 'All Time';
    
    const startFormatted = format(new Date(appliedRange.startDate), 'PPP');
    
    if (!appliedRange.endDate || appliedRange.startDate === appliedRange.endDate) {
      return startFormatted;
    }
    
    const endFormatted = format(new Date(appliedRange.endDate), 'PPP');
    return `${startFormatted} - ${endFormatted}`;
  };

  // Get tab icon based on active tab
  const getTabIcon = () => {
    switch (activeTab) {
      case 'sales':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'inventory':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'financial':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#FFF6F2]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            },
            exit: { opacity: 0 } // Add exit variant
          }}
          initial="hidden"
          animate="show"
          exit="exit" // Add this to enable exit animations
          className="space-y-6"
        >
          {/* Header area with icon and date range selector */}
          <motion.div 
            className="flex justify-between items-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} // Add exit animation
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} // Add exit animation
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Add AnimatePresence for the icon */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`icon-${activeTab}`} // Add key to trigger proper animation
                  className="p-2 bg-[#FFF6F2] rounded-md border border-[#571C1F]/20 shadow-md relative overflow-hidden z-10"
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 10, opacity: 0 }} // Add exit animation
                  transition={{ 
                    type: "spring", 
                    stiffness: 260, 
                    damping: 20,
                    delay: 0.2
                  }}
                  onMouseEnter={() => setIconHovered(true)}
                  onMouseLeave={() => setIconHovered(false)}
                  whileHover={{ 
                    scale: 1.1, 
                    rotate: [0, -5, 5, -5, 0],
                    boxShadow: "0 5px 15px -3px rgba(87, 28, 31, 0.3)",
                    transition: { duration: 0.5 }
                  }}
                >
                  {/* Radial gradient background inside icon container */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      background: [
                        'radial-gradient(circle at center, rgba(87, 28, 31, 0.1) 0%, transparent 60%)',
                        'radial-gradient(circle at center, rgba(0, 59, 37, 0.05) 0%, transparent 60%)',
                        'radial-gradient(circle at center, rgba(87, 28, 31, 0.1) 0%, transparent 60%)'
                      ]
                    }}
                    transition={{ 
                      duration: 6, 
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  />
                  {getTabIcon()}
                </motion.div>
              </AnimatePresence>
              
              {/* Add AnimatePresence for the title */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`title-${activeTab}`} // Add key to trigger proper animation
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }} // Add exit animation
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="text-xl font-bold text-[#571C1F]">
                    {activeTab === 'sales' 
                      ? 'Sales Report' 
                      : activeTab === 'inventory' 
                        ? 'Inventory Report' 
                        : 'Financial Report'}
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {displayDateRange()}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
            
            {/* Date range selector - add exit animation */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }} // Add exit animation
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center space-x-2"
            >
              <select 
                className="block pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] sm:text-sm rounded-md bg-white"
                onChange={(e) => handleDateRangeSelect(e.target.value)}
                value={isCustomRange ? 'custom' : undefined}
              >
                {dateRangeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              {/* Custom range inputs with AnimatePresence */}
              <AnimatePresence mode="wait">
                {isCustomRange && (
                  <motion.div 
                    key="custom-range-controls"
                    initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="date"
                      value={dateRange.startDate || ''}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="block pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] sm:text-sm rounded-md bg-white"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="date"
                      value={dateRange.endDate || ''}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="block pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] sm:text-sm rounded-md bg-white"
                    />
                    <motion.button
                      onClick={handleCustomRangeApply}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm rounded-md font-medium text-white bg-[#571C1F] hover:bg-[#4A1519] transition-colors"
                      whileHover={{ scale: 1.02, y: -1, boxShadow: "0 4px 6px -1px rgba(87, 28, 31, 0.1), 0 2px 4px -1px rgba(87, 28, 31, 0.06)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Apply
                    </motion.button>
                    <motion.button
                      onClick={handleCustomRangeReset}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm rounded-md font-medium text-gray-700 bg-white hover:bg-gray-50"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Reset
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Tab Navigation with exit animations */}
          <div className="relative">
            <motion.div
              className="h-1 bg-gradient-to-r from-[#571C1F] to-[#003B25] rounded-full mb-6"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }} // Add exit animation
              transition={{ duration: 0.8 }}
            />

            {/* Report content with exit animations */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} // Add exit animation
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-lg"
            >
              <AnimatePresence mode="wait">
                {activeTab === 'sales' && (
                  <motion.div
                    key="sales-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SalesReport 
                      startDate={appliedRange.startDate}
                      endDate={appliedRange.endDate}
                      onExport={handleExport}
                    />
                  </motion.div>
                )}
                
                {activeTab === 'inventory' && (
                  <motion.div
                    key="inventory-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <InventoryReport 
                      startDate={appliedRange.startDate}
                      endDate={appliedRange.endDate}
                      onExport={handleExport}
                    />
                  </motion.div>
                )}
                
                {activeTab === 'financial' && (
                  <motion.div
                    key="financial-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FinancialReport 
                      startDate={appliedRange.startDate}
                      endDate={appliedRange.endDate}
                      onExport={handleExport}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ReportsPage;