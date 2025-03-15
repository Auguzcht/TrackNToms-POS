import { useState, useEffect } from 'react';
import StatsCard from './StatsCard';
import RecentActivity from './RecentActivity';
import Card from '../common/Card';
import { motion } from 'framer-motion';
// Import chart components
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
  const [stats, setStats] = useState({
    sales: { value: 0, change: 0 },
    orders: { value: 0, change: 0 },
    inventory: { value: 0, change: 0 },
    lowStock: { value: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [topIngredients, setTopIngredients] = useState([]);
  const [supplierData, setSupplierData] = useState({
    topSuppliers: [],
    upcomingDeliveries: []
  });
  const [maxIngredientUsage, setMaxIngredientUsage] = useState(0);
  // Add state for sales chart data
  const [salesChartData, setSalesChartData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    // Simulate fetching dashboard data
    const timer = setTimeout(() => {
      setStats({
        sales: { value: 12580, change: 8.2 },
        orders: { value: 156, change: 4.3 },
        inventory: { value: 1243, change: -2.1 },
        lowStock: { value: 7 }
      });
      
      // Simulated top ingredients data
      const mockIngredients = [
        { id: 1, name: 'Arabica Coffee Beans', usage: 14.5, unit: 'kg', daysRemaining: 6, quantity: 23 },
        { id: 2, name: 'Milk', usage: 12.8, unit: 'L', daysRemaining: 3, quantity: 18 },
        { id: 3, name: 'Vanilla Syrup', usage: 4.2, unit: 'L', daysRemaining: 8, quantity: 12 },
        { id: 4, name: 'Chocolate Powder', usage: 3.7, unit: 'kg', daysRemaining: 12, quantity: 15 },
        { id: 5, name: 'Caramel Syrup', usage: 2.9, unit: 'L', daysRemaining: 7, quantity: 8 },
      ];
      
      setTopIngredients(mockIngredients);
      setMaxIngredientUsage(Math.max(...mockIngredients.map(item => item.usage)));
      
      // Simulated supplier data
      setSupplierData({
        topSuppliers: [
          { id: 1, name: 'Premium Coffee Supplies', reliability: 98 },
          { id: 2, name: 'Fresh Dairy Co.', reliability: 95 },
          { id: 3, name: 'Sweet Additions Inc.', reliability: 92 }
        ],
        upcomingDeliveries: [
          { id: 101, supplier: 'Premium Coffee Supplies', items: 5, date: new Date(Date.now() + 86400000) }, // tomorrow
          { id: 102, supplier: 'Fresh Dairy Co.', items: 3, date: new Date(Date.now() + 86400000 * 2) }, // in 2 days
          { id: 103, supplier: 'Bakery Essentials', items: 8, date: new Date(Date.now() + 86400000 * 4) } // in 4 days
        ]
      });

      // Generate mock sales chart data
      const today = new Date();
      const labels = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      });

      // Generate some realistic sales data with a slight upward trend
      const salesData = [4200, 3800, 5100, 4500, 5300, 6200, 6800];
      const prevSalesData = [3800, 3500, 4600, 4100, 4800, 5700, 6300];

      setSalesChartData({
        labels,
        datasets: [
          {
            label: 'Sales',
            data: salesData,
            borderColor: '#571C1F',
            backgroundColor: 'rgba(87, 28, 31, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#571C1F',
            pointBorderColor: '#571C1F', // Changed from '#ffffff'
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: 'Previous Week',
            data: prevSalesData,
            borderColor: '#003B25',
            borderDash: [5, 5],
            backgroundColor: 'rgba(0, 59, 37, 0.05)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#003B25',
            pointBorderColor: '#003B25', // Changed from '#ffffff'
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          }
        ]
      });
      
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          color: '#571C1F',
          font: {
            family: "'Inter', sans-serif",
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#571C1F',
        bodyColor: '#333',
        borderColor: 'rgba(87, 28, 31, 0.2)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-PH', { 
                style: 'currency', 
                currency: 'PHP' 
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#571C1F',
          font: {
            family: "'Inter', sans-serif",
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(87, 28, 31, 0.05)',
        },
        ticks: {
          color: '#571C1F',
          font: {
            family: "'Inter', sans-serif",
            size: 11
          },
          callback: function(value) {
            return '₱' + value.toLocaleString('en-PH');
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animations: {
      tension: {
        duration: 1000,
        easing: 'easeInOutQuad',
        from: 0.4,
        to: 0.4,
      }
    }
  };

  // Format date function
  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      // Format as "Mon, 20 Jun"
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* First row - Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard 
          title="Today's Sales"
          value={stats.sales.value}
          valuePrefix="₱"
          change={stats.sales.change}
          loading={loading}
          icon="cash"
        />
        <StatsCard 
          title="Orders Processed"
          value={stats.orders.value}
          change={stats.orders.change}
          loading={loading}
          icon="shopping-bag"
        />
        <StatsCard 
          title="Inventory Items"
          value={stats.inventory.value}
          change={stats.inventory.change}
          loading={loading}
          icon="cube"
        />
        <StatsCard 
          title="Low Stock Items"
          value={stats.lowStock.value}
          loading={loading}
          icon="exclamation-circle"
          valueColor="text-[#571C1F]" 
        />
      </div>

      {/* Second row - Sales chart and recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col">
          <Card title="Sales Overview" className="h-full flex-1 flex flex-col">
            {loading ? (
              <div className="animate-pulse flex-1 bg-[#FFF6F2] dark:bg-[#571C1F]/10 rounded"></div>
            ) : (
              <div className="flex-1 flex flex-col p-2">
                <div className="flex justify-between mb-4">
                  <div className="flex space-x-3">
                    <motion.button 
                      className="px-3 py-1.5 text-sm bg-[#571C1F] text-white rounded-md shadow-sm hover:bg-[#571C1F]/90"
                      whileHover={{ y: -1 }}
                      whileTap={{ y: 0 }}
                    >
                      Weekly
                    </motion.button>
                    <motion.button 
                      className="px-3 py-1.5 text-sm bg-white/60 text-[#571C1F] border border-[#571C1F]/10 rounded-md hover:bg-white"
                      whileHover={{ y: -1 }}
                      whileTap={{ y: 0 }}
                    >
                      Monthly
                    </motion.button>
                    <motion.button 
                      className="px-3 py-1.5 text-sm bg-white/60 text-[#571C1F] border border-[#571C1F]/10 rounded-md hover:bg-white"
                      whileHover={{ y: -1 }}
                      whileTap={{ y: 0 }}
                    >
                      Yearly
                    </motion.button>
                  </div>
                  <motion.button 
                    className="text-[#571C1F] hover:text-[#571C1F] flex items-center text-sm font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download Report
                  </motion.button>
                </div>
                
                <div className="flex-1 min-h-[300px] w-full relative">
                  <motion.div 
                    className="h-full w-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Line data={salesChartData} options={chartOptions} height={300} />
                  </motion.div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                  <motion.div 
                    className="bg-white p-3 rounded-lg border border-[#571C1F]/10"
                    whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(87, 28, 31, 0.1)" }}
                  >
                    <p className="text-xs text-gray-500">Avg. Daily Sales</p>
                    <h4 className="text-lg font-bold text-[#571C1F]">₱5,500</h4>
                    <div className="text-xs text-[#003B25] flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                      5.2%
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-white p-3 rounded-lg border border-[#571C1F]/10"
                    whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(87, 28, 31, 0.1)" }}
                  >
                    <p className="text-xs text-gray-500">Peak Hour Sales</p>
                    <h4 className="text-lg font-bold text-[#571C1F]">₱2,800</h4>
                    <div className="text-xs text-gray-500">10:00 - 11:00 AM</div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-white p-3 rounded-lg border border-[#571C1F]/10"
                    whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(87, 28, 31, 0.1)" }}
                  >
                    <p className="text-xs text-gray-500">Weekly Forecast</p>
                    <h4 className="text-lg font-bold text-[#571C1F]">₱42,500</h4>
                    <div className="text-xs text-[#003B25] flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                      3.8%
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
          </Card>
        </div>
        
        <div className="flex flex-col">
          <RecentActivity loading={loading} />
        </div>
      </div>

      {/* Third row - Ingredient Usage and Supplier Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingredient Usage Trend - Enhanced version */}
        <Card title="Top Ingredient Consumption">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-center">
                  <div className="flex-shrink-0 w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="ml-4 flex-grow space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5 pb-1">
              {topIngredients.map((ingredient, index) => (
                <motion.div 
                  key={ingredient.id} 
                  className="relative p-3 border border-[#571C1F]/10 hover:border-[#571C1F]/20 rounded-lg bg-white/60 backdrop-blur-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  whileHover={{ 
                    y: -2, 
                    boxShadow: "0 10px 25px -5px rgba(87, 28, 31, 0.1), 0 8px 10px -6px rgba(87, 28, 31, 0.05)" 
                  }}
                >
                  {/* Animated gradient accent based on days remaining */}
                  <motion.div 
                    className={`absolute top-0 left-0 h-1 rounded-t-lg ${
                      ingredient.daysRemaining <= 3 ? 'bg-gradient-to-r from-[#571C1F] to-red-400' : 
                      ingredient.daysRemaining <= 7 ? 'bg-gradient-to-r from-[#571C1F] to-amber-400' : 
                      'bg-gradient-to-r from-[#003B25] to-emerald-400'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                  />

                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8">
                      <motion.div 
                        className="flex items-center justify-center h-7 w-7 rounded-full bg-[#FFF6F2] text-[#571C1F] border border-[#571C1F]/20 font-bold text-sm"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 260,
                          damping: 20,
                          delay: index * 0.1 + 0.2
                        }}
                      >
                        {index + 1}
                      </motion.div>
                    </div>
                    
                    <div className="flex-grow ml-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-[#571C1F] dark:text-[#571C1F]">
                            {ingredient.name}
                          </span>
                          {ingredient.daysRemaining <= 3 && (
                            <motion.span 
                              className="ml-2 px-1.5 py-0.5 bg-[#571C1F]/10 border border-[#571C1F]/20 text-[#571C1F] text-xs font-medium rounded-full"
                              animate={{ 
                                scale: [1, 1.05, 1],
                                opacity: [1, 0.8, 1]
                              }}
                              transition={{ 
                                duration: 1.5,
                                repeat: Infinity,
                                repeatType: "reverse"
                              }}
                            >
                              Critical
                            </motion.span>
                          )}
                          {ingredient.daysRemaining > 3 && ingredient.daysRemaining <= 7 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full border border-amber-200">
                              Low
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-[#571C1F] dark:text-[#571C1F] flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                          </svg>
                          {ingredient.usage} {ingredient.unit}
                        </span>
                      </div>
                      
                      {/* Progress bar container */}
                      <div className="w-full bg-[#FFF6F2] rounded-full h-2.5 overflow-hidden relative">
                        {/* Progress indicator */}
                        <motion.div 
                          className={`h-2.5 rounded-full ${
                            ingredient.daysRemaining <= 3 ? 'bg-[#571C1F]' : 
                            ingredient.daysRemaining <= 7 ? 'bg-amber-500' : 
                            'bg-[#003B25]'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(ingredient.usage / maxIngredientUsage * 100).toFixed(1)}%` }}
                          transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                        >
                          {/* Animated gradient shimmer effect */}
                          <motion.div 
                            className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{
                              x: ['-100%', '400%'],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 2,
                              ease: "linear",
                              delay: index * 0.2
                            }}
                          />
                        </motion.div>
                      </div>
                      
                      <div className="flex justify-between text-xs mt-1.5">
                        <motion.span 
                          className={`flex items-center ${
                            ingredient.daysRemaining <= 3 ? 'text-[#571C1F] dark:text-[#571C1F]' : 
                            ingredient.daysRemaining <= 7 ? 'text-amber-600 dark:text-amber-400' : 
                            'text-[#003B25] dark:text-[#003B25]'
                          }`}
                          animate={ingredient.daysRemaining <= 3 ? {
                            scale: [1, 1.05, 1]
                          } : {}}
                          transition={{
                            repeat: ingredient.daysRemaining <= 3 ? Infinity : 0,
                            duration: 1.5
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {ingredient.daysRemaining} days remaining
                        </motion.span>
                        <span className="text-gray-500 dark:text-gray-400 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          Stock: {ingredient.quantity} {ingredient.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* Supplier Performance - Enhanced version */}
        <Card title="Supplier Performance">
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse bg-white dark:bg-dark-lighter p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                    <div className="space-y-3">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <motion.div 
                  className="relative overflow-hidden bg-white dark:bg-dark-lighter p-4 border border-[#571C1F]/10 hover:border-[#571C1F]/20 rounded-lg shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 100,
                    damping: 15,
                    delay: 0.1 
                  }}
                  whileHover={{ 
                    y: -2,
                    boxShadow: "0 10px 25px -5px rgba(87, 28, 31, 0.1), 0 8px 10px -6px rgba(87, 28, 31, 0.05)"
                  }}
                >
                  {/* Gradient accent line */}
                  <motion.div 
                    className="absolute top-0 left-0 h-1 bg-gradient-to-r from-[#571C1F] to-[#003B25]"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />

                  <div className="flex items-center mb-3">
                    <motion.div
                      className="p-2 mr-3 bg-[#FFF6F2] rounded-md border border-[#571C1F]/20 shadow-sm"
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 260, 
                        damping: 20,
                        delay: 0.3
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </motion.div>
                    <h3 className="text-sm font-medium text-[#571C1F] dark:text-[#571C1F]">Most Reliable Suppliers</h3>
                  </div>

                  <ul className="space-y-2.5">
                    {supplierData.topSuppliers.map((supplier, idx) => (
                      <motion.li 
                        key={supplier.id} 
                        className="flex justify-between items-center p-2 rounded-lg hover:bg-[#FFF6F2] transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + (idx * 0.1) }}
                        whileHover={{ x: 2 }}
                      >
                        <div className="flex items-center">
                          <motion.div 
                            className="w-1.5 h-1.5 rounded-full bg-[#003B25] mr-2"
                            animate={{ 
                              scale: [1, 1.5, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: idx * 0.5
                            }}
                          />
                          <span className="text-sm text-gray-900 dark:text-[#571C1F]">{supplier.name}</span>
                        </div>
                        <motion.span 
                          className="text-xs bg-[#003B25]/10 border border-[#003B25]/20 text-[#003B25] px-2 py-0.5 rounded-full flex items-center"
                          animate={{ y: [0, -2, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {supplier.reliability}% on-time
                        </motion.span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
                
                <motion.div 
                  className="relative overflow-hidden bg-white dark:bg-dark-lighter p-4 border border-[#003B25]/10 hover:border-[#003B25]/20 rounded-lg shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 100,
                    damping: 15,
                    delay: 0.2 
                  }}
                  whileHover={{ 
                    y: -2,
                    boxShadow: "0 10px 25px -5px rgba(0, 59, 37, 0.1), 0 8px 10px -6px rgba(0, 59, 37, 0.05)"
                  }}
                >
                  {/* Gradient accent line */}
                  <motion.div 
                    className="absolute top-0 left-0 h-1 bg-gradient-to-r from-[#003B25] to-[#571C1F]"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                  
                  <div className="flex items-center mb-3">
                    <motion.div
                      className="p-2 mr-3 bg-[#FFF6F2] rounded-md border border-[#003B25]/20 shadow-sm"
                      initial={{ scale: 0, rotate: 10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 260, 
                        damping: 20,
                        delay: 0.4
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#003B25]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </motion.div>
                    <h3 className="text-sm font-medium text-[#003B25] dark:text-[#003B25]">Upcoming Deliveries</h3>
                  </div>

                  <ul className="space-y-2.5">
                    {supplierData.upcomingDeliveries.map((delivery, idx) => (
                      <motion.li 
                        key={delivery.id} 
                        className="flex justify-between items-center p-2 rounded-lg hover:bg-[#FFF6F2] transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + (idx * 0.1) }}
                        whileHover={{ x: 2 }}
                      >
                        <div>
                          <span className="text-sm text-gray-900 dark:text-[#003B25] flex items-center">
                            <motion.div 
                              className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"
                              animate={{ 
                                scale: [1, 1.5, 1],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: idx * 0.5
                              }}
                            />
                            {delivery.supplier}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 ml-3.5">
                            {delivery.items} items
                          </p>
                        </div>
                        <motion.span 
                          className="text-xs bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full flex items-center"
                          animate={formatDate(delivery.date) === 'Today' ? {
                            scale: [1, 1.05, 1],
                            backgroundColor: ['rgba(219, 234, 254, 1)', 'rgba(219, 234, 254, 0.7)', 'rgba(219, 234, 254, 1)']
                          } : {}}
                          transition={{
                            duration: 1.5,
                            repeat: formatDate(delivery.date) === 'Today' ? Infinity : 0
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {formatDate(delivery.date)}
                        </motion.span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </div>
              
              <motion.div 
                className="relative overflow-hidden bg-white dark:bg-dark-lighter p-4 border border-[#571C1F]/10 hover:border-[#571C1F]/20 rounded-lg shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                  delay: 0.3 
                }}
                whileHover={{ 
                  y: -2,
                  boxShadow: "0 10px 25px -5px rgba(87, 28, 31, 0.1), 0 8px 10px -6px rgba(87, 28, 31, 0.05)"
                }}
              >
                {/* Gradient accent line */}
                <motion.div 
                  className="absolute top-0 left-0 h-1 bg-gradient-to-r from-[#571C1F] via-amber-500 to-[#003B25]"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                />

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <motion.div
                      className="p-2 mr-3 bg-[#FFF6F2] rounded-md border border-[#571C1F]/20 shadow-sm"
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 260, 
                        damping: 20,
                        delay: 0.5
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </motion.div>
                    <h3 className="text-sm font-medium text-[#571C1F] dark:text-[#571C1F]">Purchase Order Status</h3>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Last 30 days</div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <motion.div 
                    className="bg-[#003B25]/5 border border-[#003B25]/10 p-2.5 rounded-lg relative overflow-hidden"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                    whileHover={{ y: -2, backgroundColor: 'rgba(0, 59, 37, 0.1)' }}
                  >
                    <motion.div 
                      className="text-2xl font-bold text-[#003B25]"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.3 }}
                    >
                      12
                    </motion.div>
                    <div className="text-xs text-[#003B25]/80 font-medium">Delivered</div>
                    {/* Subtle shimmer effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  </motion.div>

                  <motion.div 
                  className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg relative overflow-hidden"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                  whileHover={{ y: -2, backgroundColor: 'rgba(251, 191, 36, 0.1)' }}
                >
                  <motion.div 
                    className="text-2xl font-bold text-amber-600"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ 
                      y: 0, 
                      opacity: 1,
                      scale: [1, 1.05, 1] 
                    }}
                    transition={{
                      y: { delay: 0.7, duration: 0.3 },
                      opacity: { delay: 0.7, duration: 0.3 },
                      scale: {
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }
                    }}
                  >
                    3
                  </motion.div>
                  <div className="text-xs text-amber-700 font-medium">In Transit</div>
                  {/* Subtle shimmer effect */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                </motion.div>

                  <motion.div 
                    className="bg-[#571C1F]/5 border border-[#571C1F]/10 p-2.5 rounded-lg relative overflow-hidden"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.3 }}
                    whileHover={{ y: -2, backgroundColor: 'rgba(87, 28, 31, 0.1)' }}
                  >
                    <motion.div 
                      className="text-2xl font-bold text-[#571C1F]"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.3 }}
                    >
                      5
                    </motion.div>
                    <div className="text-xs text-[#571C1F]/80 font-medium">Pending</div>
                    {/* Subtle shimmer effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;