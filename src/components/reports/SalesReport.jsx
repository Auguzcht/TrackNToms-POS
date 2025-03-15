import { useState, useEffect, useMemo } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { useSales } from '../../hooks/useSales';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { Doughnut } from 'react-chartjs-2';

const SalesReport = ({ 
  startDate = null,
  endDate = null,
  onExport = () => {}
}) => {
  const { fetchSales } = useSales();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [reportData, setReportData] = useState({
    totalSales: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    categorySales: {},
    paymentMethods: {},
    topSellingItems: []
  });

  // Format date range for display
  const dateRangeText = useMemo(() => {
    if (!startDate && !endDate) return "All Time";
    if (startDate && !endDate) {
      return `From ${new Date(startDate).toLocaleDateString()}`;
    }
    if (!startDate && endDate) {
      return `Until ${new Date(endDate).toLocaleDateString()}`;
    }
    return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
  }, [startDate, endDate]);

  useEffect(() => {
    const generateSalesReport = async () => {
      setLoading(true);
      try {
        // Fetch sales data
        const salesData = await fetchSales({ startDate, endDate });
        
        // Calculate total sales, transactions, and average order value
        let totalSales = 0;
        let totalTransactions = salesData.length;
        let categorySales = {};
        let paymentMethods = {};
        let topSellingItems = {};

        salesData.forEach(sale => {
          totalSales += sale.total;
          sale.items.forEach(item => {
            if (!categorySales[item.category]) {
              categorySales[item.category] = 0;
            }
            categorySales[item.category] += item.quantity * item.price;

            if (!topSellingItems[item.name]) {
              topSellingItems[item.name] = { quantity: 0, revenue: 0 };
            }
            topSellingItems[item.name].quantity += item.quantity;
            topSellingItems[item.name].revenue += item.quantity * item.price;
          });

          if (!paymentMethods[sale.paymentMethod]) {
            paymentMethods[sale.paymentMethod] = 0;
          }
          paymentMethods[sale.paymentMethod] += sale.total;
        });

        const averageOrderValue = totalSales / totalTransactions;

        setReportData({
          totalSales,
          totalTransactions,
          averageOrderValue,
          categorySales,
          paymentMethods,
          topSellingItems: Object.entries(topSellingItems).map(([name, data]) => ({
            name,
            ...data
          })).sort((a, b) => b.revenue - a.revenue)
        });
        
      } catch (err) {
        console.error('Error generating sales report:', err);
        setError('Failed to generate sales report. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    generateSalesReport();
  }, [fetchSales, startDate, endDate]);

  const getPageTitle = () => {
    if (!startDate && !endDate) return "All Time Sales Report";
    if (startDate && !endDate) {
      return `Sales Report from ${new Date(startDate).toLocaleDateString()}`;
    }
    if (!startDate && endDate) {
      return `Sales Report until ${new Date(endDate).toLocaleDateString()}`;
    }
    return `Sales Report: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-dark-lighter p-4 rounded-lg shadow-sm animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-dark-lighter p-4 rounded-lg shadow-sm animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-6 bg-[#FFF6F2]/30"
    >
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#571C1F]">{getPageTitle()}</h1>
          <p className="text-sm text-gray-500">{dateRangeText}</p>
        </div>
        <motion.button 
          className="px-4 py-2 bg-[#571C1F] text-white rounded-lg shadow-sm hover:bg-[#571C1F]/90 flex items-center"
          whileHover={{ y: -2 }}
          whileTap={{ y: 0 }}
          onClick={onExport}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Export Report
        </motion.button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard 
          title="Total Sales"
          value={reportData.totalSales}
          prefix="₱"
          change={10.5}
          changeType="positive"
          icon="cash"
          bgColor="bg-[#FFF6F2]" // Add Dashboard's background color
          iconColor="text-[#571C1F]"
          valueColor="text-[#571C1F]"
          hoverEffect="hover:bg-[#FFF6F2]/90"
        />
        <SummaryCard 
          title="Total Transactions"
          value={reportData.totalTransactions}
          suffix=" orders"
          change={5.2}
          changeType="positive"
          icon="order"
        />
        <SummaryCard 
          title="Average Order Value"
          value={reportData.averageOrderValue}
          prefix="₱"
          change={3.8}
          changeType="positive"
          icon="chart"
        />
      </div>

      {/* Sales Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Sales Card */}
        <Card 
          title="Sales by Category"
          className="bg-white border border-[#571C1F]/10 hover:border-[#571C1F]/20 transition-colors duration-200"
        >
          <motion.div 
            className="absolute top-0 left-0 h-1 bg-gradient-to-r from-[#571C1F] to-[#003B25]"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8 }}
          />
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {Object.entries(reportData.categorySales)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount], index) => (
                  <motion.div 
                    key={`category-${category}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100,
                      damping: 15
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">₱{amount.toFixed(2)}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          ({((amount / reportData.totalSales) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </Card>

        {/* Payment Methods Card */}
        <Card title="Sales by Payment Method">
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {Object.entries(reportData.paymentMethods)
                .sort(([, a], [, b]) => b - a)
                .map(([method, amount], index) => (
                  <motion.div 
                    key={`payment-${method}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100,
                      damping: 15
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{method}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">₱{amount.toFixed(2)}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          ({((amount / reportData.totalSales) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </Card>
      </div>

      {/* Top Selling Items */}
      <Card title="Top Selling Items">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantity Sold
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Revenue
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  % of Sales
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {reportData.topSellingItems.map((item, index) => (
                <motion.tr 
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                    ₱{item.revenue.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">
                    {((item.revenue / reportData.totalSales) * 100).toFixed(1)}%
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
};

// Summary Card component for displaying financial metrics
const SummaryCard = ({ title, value, prefix = '', suffix = '', change = 0, changeType = 'neutral', icon = 'chart', bgColor = 'bg-white', iconColor = 'text-gray-500', valueColor = 'text-gray-900', hoverEffect = '' }) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getChangeIcon = () => {
    if (change === 0) return null;
    
    return change > 0 ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
      </svg>
    );
  };

  const getIconComponent = () => {
    switch (icon) {
      case 'cash':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'expense':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'chart':
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
    }
  };

  return (
    <motion.div 
      className={`rounded-lg shadow-sm p-4 border border-[#571C1F]/10 relative overflow-hidden ${bgColor} ${hoverEffect}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(87, 28, 31, 0.1)" }}
    >
      <motion.div 
        className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#571C1F] to-[#003B25]"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      />
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className={`text-xl font-bold mt-1 ${valueColor}`}>
            {prefix}{typeof value === 'number' ? value.toFixed(2) : value}{suffix}
          </h3>
          
          {change !== 0 && (
            <motion.div 
              className={`flex items-center text-xs mt-2 ${getChangeColor()}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {getChangeIcon()}
              {Math.abs(change).toFixed(1)}% from previous period
            </motion.div>
          )}
        </div>
        <motion.div 
          className="p-3 bg-[#FFF6F2] rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 260, 
            damping: 20,
            delay: 0.3
          }}
        >
          {getIconComponent()}
        </motion.div>
      </div>

      {/* Animated indicator bar at bottom showing relative value */}
      <motion.div 
        className="absolute bottom-0 left-0 h-1 bg-[#571C1F]/30"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 1, delay: 0.4 }}
      >
        <motion.div 
          className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          animate={{ x: ['-100%', '400%'] }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        />
      </motion.div>
    </motion.div>
  );
};

const SalesTrendChart = ({ data, loading }) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(87, 28, 31, 0.1)',
        },
        ticks: {
          callback: (value) => `₱${value}`
        }
      },
      x: {
        grid: {
          color: 'rgba(87, 28, 31, 0.1)',
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse flex-1 bg-[#FFF6F2] dark:bg-[#571C1F]/10 rounded min-h-[300px]" />
    );
  }

  return (
    <div className="h-[300px]">
      <Line data={data} options={chartOptions} />
    </div>
  );
};

const PaymentMethodsChart = ({ data, loading }) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse flex-1 bg-[#FFF6F2] dark:bg-[#571C1F]/10 rounded min-h-[300px]" />
    );
  }

  return (
    <div className="h-[300px]">
      <Doughnut data={data} options={chartOptions} />
    </div>
  );
};

const ItemDetailsCard = ({ item, index }) => {
  return (
    <motion.div 
      className="p-4 bg-white border border-[#571C1F]/10 rounded-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ 
        y: -2,
        boxShadow: "0 10px 25px -5px rgba(87, 28, 31, 0.1)"
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#571C1F]">{item.name}</span>
        <span className="text-xs bg-[#FFF6F2] text-[#571C1F] px-2 py-1 rounded-full">
          {item.quantity} sold
        </span>
      </div>
      <div className="mt-2 text-sm text-gray-500">
        Revenue: ₱{item.revenue.toFixed(2)}
      </div>
      <motion.div 
        className="mt-2 h-1 bg-[#FFF6F2] rounded-full overflow-hidden"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 0.8, delay: index * 0.1 }}
      >
        <motion.div 
          className="h-full bg-[#571C1F]"
          initial={{ width: 0 }}
          animate={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
          transition={{ duration: 0.8, delay: (index * 0.1) + 0.2 }}
        />
      </motion.div>
    </motion.div>
  );
};

export default SalesReport;