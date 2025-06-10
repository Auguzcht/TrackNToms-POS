import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { Spinner } from '../common/Spinner';
import { useSales } from '../../hooks/useSales';
import { useReports } from '../../hooks/useReports';
import { useMLPredictions } from '../../hooks/useMLPredictions';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import supabase from '../../services/supabase';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Import ML components
import SalesForecastChart from '../ml/SalesForecastChart';
import ProductAssociationChart from '../ml/ProductAssociationChart';

const SalesReport = ({ 
  startDate = null,
  endDate = null,
  onExport = () => {}
}) => {
  const { fetchSales, exportSalesReport } = useSales();
  const { exportReport } = useReports();
  const { 
    getSalesForecast, // Change this from fetchSalesForecast to getSalesForecast
    getProductAssociations 
  } = useMLPredictions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add the missing state for salesData
  const [salesData, setSalesData] = useState([]); 
  
  // States for ML components
  const [forecastData, setForecastData] = useState({
    dates: [],
    predictions: [],
    actual: [],
    lowerBound: [],
    upperBound: [],
    accuracy: null
  });
  
  const [associationRules, setAssociationRules] = useState({
    rules: [],
    confidence: 0.3,
    support: 0.01,
    metrics: {}
  });
  
  // Original state for regular sales data
  const [reportData, setReportData] = useState({
    totalSales: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    categorySales: {},
    productTypeSales: { // Added to track internal vs external products
      inHouse: 0,
      external: 0
    },
    paymentMethods: {},
    topSellingItems: []
  });

  // New state to force refresh of charts
  const [refreshKey, setRefreshKey] = useState(0);
  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Format date range for display
  const dateRangeText = useMemo(() => {
    if (!startDate && !endDate) return 'All time';
    if (startDate && !endDate) return `Since ${new Date(startDate).toLocaleDateString()}`;
    if (!startDate && endDate) return `Until ${new Date(endDate).toLocaleDateString()}`;
    return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
  }, [startDate, endDate]);

  // Load ML forecasts along with regular sales data
  useEffect(() => {
    const generateSalesReport = async () => {
      setLoading(true);
      try {
        // Fetch regular sales data - use UTC time format to avoid timezone issues
        const formattedStartDate = startDate ? new Date(startDate).toISOString() : undefined;
        const formattedEndDate = endDate ? new Date(endDate).toISOString() : undefined;
        
        const salesData = await fetchSales({ 
          startDate: formattedStartDate,
          endDate: formattedEndDate
        });
        
        // Set component state with sales data
        setSalesData(salesData);
        
        // Fetch all items to get their externally sourced status - add this
        const { data: allItems } = await supabase
          .from('items')
          .select('item_id, is_externally_sourced');
        
        // Create a lookup map for item properties - add this
        const itemPropertiesMap = {};
        if (allItems && allItems.length > 0) {
          allItems.forEach(item => {
            itemPropertiesMap[item.item_id] = {
              is_externally_sourced: item.is_externally_sourced === true
            };
          });
        }
        
        // Calculate sales metrics from fetched data
        const totalSales = salesData.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
        const totalTransactions = salesData.length;
        const averageOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
        
        // Calculate category sales
        const categorySales = {};
        // Track inhouse vs external products
        let inHouseSales = 0;
        let externalSales = 0;

        salesData.forEach(sale => {
          if (!sale.is_voided) {
            sale.items?.forEach(item => {
              const category = item.category || 'Uncategorized';
              categorySales[category] = (categorySales[category] || 0) + parseFloat(item.subtotal || 0);
              
              // Track whether item is externally sourced or made in-house
              // Check from the items table first, then fall back to the item property
              const isExternallySourced = 
                itemPropertiesMap[item.item_id]?.is_externally_sourced || 
                item.is_externally_sourced === true;
              
              if (isExternallySourced) {
                externalSales += parseFloat(item.subtotal || 0);
              } else {
                inHouseSales += parseFloat(item.subtotal || 0);
              }
            });
          }
        });
        
        // Calculate payment methods
        const paymentMethods = {};
        salesData.forEach(sale => {
          if (!sale.is_voided) {
            const method = sale.payment_method || 'Unknown';
            paymentMethods[method] = (paymentMethods[method] || 0) + parseFloat(sale.total_amount || 0);
          }
        });
        
        // Get top selling items
        const itemMap = {};
        salesData.forEach(sale => {
          if (!sale.is_voided) {
            sale.items?.forEach(item => {
              // Check from the items table first, then fall back to the item property
              const isExternallySourced = 
                itemPropertiesMap[item.item_id]?.is_externally_sourced || 
                item.is_externally_sourced === true;
              
              if (!itemMap[item.item_id]) {
                itemMap[item.item_id] = {
                  id: item.item_id,
                  name: item.name || `Item ${item.item_id}`,
                  category: item.category || 'Uncategorized',
                  quantity: 0,
                  revenue: 0,
                  is_externally_sourced: isExternallySourced
                };
              }
              itemMap[item.item_id].quantity += item.quantity;
              itemMap[item.item_id].revenue += parseFloat(item.subtotal || 0);
            });
          }
        });
        
        const topSellingItems = Object.values(itemMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);
          
        // Update report data state
        setReportData({
          totalSales,
          totalTransactions,
          averageOrderValue,
          categorySales,
          productTypeSales: {
            inHouse: inHouseSales,
            external: externalSales
          },
          paymentMethods: {
            labels: Object.keys(paymentMethods),
            datasets: [{
              data: Object.values(paymentMethods),
              backgroundColor: [
                'rgba(87, 28, 31, 0.8)',
                'rgba(0, 59, 37, 0.8)',
                'rgba(255, 159, 64, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(153, 102, 255, 0.8)',
              ],
              borderWidth: 1,
              borderColor: '#ffffff'
            }]
          },
          topSellingItems
        });
        
        // Get sales forecast data
        try {
          // Change this to use getSalesForecast instead of fetchSalesForecast
          const forecastResult = await getSalesForecast({
            startDate: formattedStartDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: formattedEndDate || new Date().toISOString(),
            forecastDays: 7
          });
          
          if (forecastResult && forecastResult.forecast) {
            const forecastDates = forecastResult.forecast.map(point => point.date) || [];
            const predictions = forecastResult.forecast.map(point => point.prediction) || [];
            const actuals = forecastResult.forecast.map(point => point.actual) || [];
            const lowerBound = forecastResult.forecast.map(point => point.lower_bound) || [];
            const upperBound = forecastResult.forecast.map(point => point.upper_bound) || [];
            
            setForecastData({
              dates: forecastDates,
              predictions,
              actual: actuals,
              lowerBound,
              upperBound,
              accuracy: forecastResult.accuracy?.mape ? (100 - forecastResult.accuracy.mape).toFixed(1) : null
            });
          }
        } catch (forecastErr) {
          console.error('Error loading forecast data:', forecastErr);
          // Don't fail the whole report if just forecasts fail
        }
        
        // Get product associations
        try {
          const associations = await getProductAssociations({
            minConfidence: 0.3,
            minSupport: 0.01
          });
          
          setAssociationRules({
            rules: associations.rules || [],
            metrics: associations.metrics || {},
            confidence: 0.3,
            support: 0.01
          });
        } catch (associationsErr) {
          console.error('Error loading product associations:', associationsErr);
          // Don't fail the whole report if just associations fail
        }
        
      } catch (err) {
        console.error('Error generating sales report:', err);
        setError('Failed to generate sales report. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    generateSalesReport();
  }, [fetchSales, getSalesForecast, getProductAssociations, startDate, endDate, refreshKey]);

  // Handle threshold changes for association rules
  const handleThresholdChange = (type, value) => {
    const updatedValue = parseFloat(value);
    setAssociationRules(prev => ({
      ...prev,
      [type]: updatedValue
    }));
    
    // Use the correct function name from your hook
    getProductAssociations({
      minConfidence: type === 'confidence' ? updatedValue : associationRules.confidence,
      minSupport: type === 'support' ? updatedValue : associationRules.support
    }).then(result => {
      setAssociationRules(prev => ({
        ...prev,
        rules: result.rules || [],
        metrics: result.metrics || {}
      }));
    });
  };

  // Function to handle exporting data
  const handleExportData = async (format = 'csv') => {
    setIsExporting(true);
    try {
      // Use the export function from the reports hook
      await exportReport({
        type: 'sales',
        startDate,
        endDate,
        format,
        data: salesData
      });
      
      // Optionally call the onExport callback
      onExport('sales', format);
    } catch (error) {
      console.error('Error exporting sales data:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportForecast = (format) => {
    onExport('forecast', format);
  };

  // Function to refresh charts
  const refreshCharts = () => {
    setShowRefreshIndicator(true);
    setRefreshKey(prev => prev + 1);
    
    // Hide the indicator after a delay
    setTimeout(() => {
      setShowRefreshIndicator(false);
    }, 1000);
  };

  if (loading) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-64 bg-[#FFF6F2]/30 rounded-lg p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Spinner 
          size="lg" 
          color="#571C1F" 
          label="Generating sales report and forecasts..."
          type="pulse"
        />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="bg-red-50 border border-red-200 rounded-lg p-6 mt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
      >
        <div className="flex items-center">
          <div className="mr-4 flex-shrink-0 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-red-800">Error Loading Report</h3>
            <p className="mt-1 text-red-700">{error}</p>
            <button 
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard 
          title="Total Sales"
          value={reportData.totalSales}
          prefix="₱"
          change={10.5}
          changeType="positive"
          icon="cash"
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

      {/* ML Component - Sales Forecast */}
      {!loading && forecastData.dates.length > 0 && (
        <Card 
          title="Sales Forecast" 
          className="bg-white border border-[#571C1F]/10 hover:border-[#571C1F]/20 transition-colors duration-200 overflow-visible shadow-sm"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[#571C1F] rounded-full mr-2"></div>
              <span className="text-sm text-gray-500">Next 7 days sales prediction based on historical patterns</span>
            </div>
            {forecastData.accuracy && (
              <div className="px-3 py-1 bg-[#003B25]/10 rounded-full text-xs text-[#003B25] font-medium">
                Accuracy: {forecastData.accuracy}%
              </div>
            )}
          </div>
          
          <div style={{ height: "350px" }}>
            <SalesForecastChart 
              key={`forecast-chart-${refreshKey || 0}`}
              forecastData={forecastData} 
              dateRange={dateRangeText}
              onExport={handleExportForecast}
            />
          </div>
        </Card>
      )}

      {/* Payment Methods and Product Type - 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Chart */}
        <Card 
          title="Sales by Payment Method" 
          className="bg-white border border-[#571C1F]/10 hover:border-[#571C1F]/20 transition-colors duration-200 shadow-sm"
        >
          <div className="h-60">
            <PaymentMethodsChart 
              key={`payment-chart-${refreshKey || 0}`}
              data={reportData.paymentMethods} 
              loading={loading} 
            />
          </div>
        </Card>

        {/* Product Type: In-house vs External */}
        <Card 
          title="Product Type Breakdown" 
          className="bg-white border border-[#571C1F]/10 hover:border-[#571C1F]/20 transition-colors duration-200 shadow-sm"
        >
          <div className="flex flex-col h-60">
            <div className="flex-1 flex items-center justify-center">
              <ProductTypePieChart 
                key={`product-type-chart-${refreshKey || 0}`}
                data={{
                  labels: ['In-house Products', 'Externally Sourced'],
                  datasets: [{
                    data: [reportData.productTypeSales.inHouse, reportData.productTypeSales.external],
                    backgroundColor: [
                      'rgba(0, 59, 37, 0.8)',
                      'rgba(87, 28, 31, 0.8)',
                    ],
                    borderWidth: 1,
                    borderColor: '#ffffff'
                  }]
                }} 
                loading={loading} 
              />
            </div>
            {/* Legend with values */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <motion.div 
                className="bg-[#003B25]/10 border border-[#003B25]/20 p-2 rounded-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -2 }}
              >
                <div className="text-sm font-medium text-[#003B25]">In-house Products</div>
                <div className="text-lg font-bold text-[#003B25]">
                  ₱{reportData.productTypeSales.inHouse.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </div>
                <div className="text-xs text-[#003B25]/70">
                  {(reportData.productTypeSales.inHouse / reportData.totalSales * 100).toFixed(1)}% of total
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-[#571C1F]/10 border border-[#571C1F]/20 p-2 rounded-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -2 }}
              >
                <div className="text-sm font-medium text-[#571C1F]">Externally Sourced</div>
                <div className="text-lg font-bold text-[#571C1F]">
                  ₱{reportData.productTypeSales.external.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </div>
                <div className="text-xs text-[#571C1F]/70">
                  {(reportData.productTypeSales.external / reportData.totalSales * 100).toFixed(1)}% of total
                </div>
              </motion.div>
            </div>
          </div>
        </Card>
      </div>

      {/* Three-Column Layout: Categories, Top by Revenue, Top by Quantity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category Breakdown */}
        <Card 
          title="Category Breakdown" 
          className="bg-white border border-[#571C1F]/10 hover:border-[#571C1F]/20 transition-colors duration-200 shadow-sm"
        >
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            <AnimatePresence>
              {Object.entries(reportData.categorySales)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount], index) => {
                  // Calculate percentage of total
                  const percentage = (amount / reportData.totalSales) * 100;
                  
                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="relative p-3 border border-[#571C1F]/10 hover:border-[#571C1F]/20 rounded-lg bg-white/60 backdrop-blur-sm"
                      whileHover={{ 
                        y: -2, 
                        boxShadow: "0 10px 25px -5px rgba(87, 28, 31, 0.1), 0 8px 10px -6px rgba(87, 28, 31, 0.05)" 
                      }}
                    >
                      {/* Animated gradient accent based on sales percentage */}
                      <motion.div 
                        className={`absolute top-0 left-0 h-1 rounded-t-lg ${
                          percentage >= 25 ? 'bg-gradient-to-r from-[#571C1F] to-red-400' : 
                          percentage >= 10 ? 'bg-gradient-to-r from-[#571C1F] to-amber-400' : 
                          'bg-gradient-to-r from-[#003B25] to-emerald-400'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                      />

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <motion.div 
                            className="flex items-center justify-center h-7 w-7 rounded-full bg-[#FFF6F2] text-[#571C1F] border border-[#571C1F]/20"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ 
                              type: "spring",
                              stiffness: 260,
                              damping: 20,
                              delay: index * 0.1 + 0.2
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                          </motion.div>
                          <span className="ml-2 text-sm font-medium text-gray-900">{category}</span>
                        </div>
                        
                        {percentage >= 20 && (
                          <motion.span 
                            className="px-2 py-0.5 bg-[#571C1F]/10 border border-[#571C1F]/20 text-[#571C1F] text-xs font-medium rounded-full"
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
                            Top Seller
                          </motion.span>
                        )}
                      </div>

                      {/* Changed this section to right-align the text with flex and justify-end */}
                      <div className="flex justify-end mb-2">
                        <div className="text-lg font-bold text-[#571C1F]">
                          ₱{amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        </div>
                      </div>
                      
                      {/* Progress bar container */}
                      <div className="w-full bg-[#FFF6F2] rounded-full h-2.5 overflow-hidden relative">
                        {/* Progress indicator */}
                        <motion.div 
                          className="h-2.5 bg-[#571C1F] rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage.toFixed(1)}%` }}
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
                      
                      <div className="text-xs text-gray-700 mt-1 text-right font-medium">
                        {percentage.toFixed(1)}% of total sales
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          </div>
        </Card>

        {/* Top Revenue Generators */}
        <Card 
          title="Top Revenue Generators" 
          className="bg-white border border-[#571C1F]/10 hover:border-[#571C1F]/20 transition-colors duration-200 shadow-sm"
        >
          <div className="space-y-3 p-2 max-h-[500px] overflow-y-auto pr-2">
            {reportData.topSellingItems.slice(0, 5).map((item, index) => (
              <motion.div 
                key={item.id} 
                className={`relative p-3 border ${item.is_externally_sourced ? 'border-[#571C1F]/20' : 'border-[#003B25]/20'} rounded-lg bg-white shadow-sm`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                whileHover={{ 
                  y: -2, 
                  boxShadow: "0 10px 15px -5px rgba(87, 28, 31, 0.1)" 
                }}
              >
                {/* Source indicator - left border color */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
                    item.is_externally_sourced ? 'bg-[#571C1F]' : 'bg-[#003B25]'
                  }`}
                />
                
                {/* Item ranking badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <motion.div 
                      className={`flex items-center justify-center h-8 w-8 rounded-full 
                        ${index === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 
                          index === 1 ? 'bg-gray-100 text-gray-700 border border-gray-300' : 
                          index === 2 ? 'bg-orange-50 text-orange-700 border border-orange-200' : 
                          'bg-gray-50 text-gray-600 border border-gray-200'} 
                        font-bold text-xs`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: index * 0.1 + 0.2
                      }}
                    >
                      #{index + 1}
                    </motion.div>
                    
                    <div className="ml-3">
                      <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                      <div className="flex items-center text-xs text-gray-500 mt-0.5">
                        <span className="mr-1">{item.category}</span>
                        {item.is_externally_sourced && (
                          <span className="px-1.5 py-0.5 bg-[#571C1F]/10 text-[#571C1F] text-xs font-medium rounded-full">
                            External
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-base font-bold text-[#571C1F]">₱{item.revenue.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{item.quantity} sold</div>
                  </div>
                </div>
                
                {/* Progress bar - Enhanced */}
                <div className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className={`h-2 rounded-full ${item.is_externally_sourced ? 'bg-[#571C1F]' : 'bg-[#003B25]'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.revenue / reportData.totalSales * 100).toFixed(1)}%` }}
                    transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                  >
                    {/* Animated gradient shimmer effect */}
                    <motion.div 
                      className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{
                        x: ['-100%', '400%'],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "linear"
                      }}
                    />
                  </motion.div>
                </div>
                
                <div className="mt-1.5 text-xs font-medium text-right text-gray-700">
                  {(item.revenue / reportData.totalSales * 100).toFixed(1)}% of total revenue
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Top Items by Quantity - Improved */}
        <Card 
          title="Top Items by Quantity" 
          className="bg-white border border-[#571C1F]/10 hover:border-[#571C1F]/20 transition-colors duration-200 shadow-sm"
        >
          <div className="space-y-3 p-2 max-h-[500px] overflow-y-auto pr-2">
            {reportData.topSellingItems
              .slice()
              .sort((a, b) => b.quantity - a.quantity)
              .slice(0, 5)
              .map((item, index) => {
                // Calculate percentage for more accurate visualization
                const topQuantityItem = reportData.topSellingItems
                  .slice()
                  .sort((a, b) => b.quantity - a.quantity)[0].quantity;
                  
                const percentage = (item.quantity / topQuantityItem) * 100;
                
                return (
                  <motion.div 
                    key={item.id} 
                    className={`relative p-3 border ${item.is_externally_sourced ? 'border-[#571C1F]/20' : 'border-[#003B25]/20'} rounded-lg bg-white shadow-sm`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100,
                      damping: 15
                    }}
                    whileHover={{ 
                      y: -2, 
                      boxShadow: "0 10px 15px -5px rgba(87, 28, 31, 0.1)" 
                    }}
                  >
                    {/* Source indicator - left border color */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-blue-500"
                    />
                    
                    {/* Item ranking badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <motion.div 
                          className="flex items-center justify-center h-8 w-8 rounded-full 
                            bg-blue-50 text-blue-700 border border-blue-200
                            font-bold text-xs"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: index * 0.1 + 0.2
                          }}
                        >
                          #{index + 1}
                        </motion.div>
                        
                        <div className="ml-3">
                          <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                          <div className="flex items-center text-xs text-gray-500 mt-0.5">
                            <span className="mr-1">{item.category}</span>
                            {item.is_externally_sourced && (
                              <span className="px-1.5 py-0.5 bg-[#571C1F]/10 text-[#571C1F] text-xs font-medium rounded-full">
                                External
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-base font-bold text-blue-600">{item.quantity} units</div>
                        <div className="text-xs text-gray-500">₱{item.revenue.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    {/* Progress bar - Enhanced */}
                    <div className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        className="h-2 rounded-full bg-blue-500 relative"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage.toFixed(1)}%` }}
                        transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                      >
                        {/* Animated gradient shimmer effect */}
                        <motion.div 
                          className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          animate={{
                            x: ['-100%', '400%'],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 2,
                            ease: "linear"
                          }}
                        />
                      </motion.div>
                    </div>
                    
                    <div className="mt-1.5 text-xs font-medium text-right text-gray-700">
                      {percentage.toFixed(1)}% of top seller quantity
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </Card>
      </div>

      {/* Full Detailed Items Table */}
      <Card 
        title="Items Sales Detail" 
        className="bg-white border border-[#571C1F]/10 hover:border-[#571C1F]/20 transition-colors duration-200 shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#571C1F]/10">
            <thead className="bg-[#FFF6F2]/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                  Share
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#571C1F]/10">
              {reportData.topSellingItems.map((item, index) => (
                <tr 
                  key={item.id} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#FFF6F2]/20'} hover:bg-[#FFF6F2]/40 transition-colors`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{item.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${item.is_externally_sourced 
                        ? 'bg-[#571C1F]/10 text-[#571C1F]' 
                        : 'bg-[#003B25]/10 text-[#003B25]'}`}>
                      {item.is_externally_sourced ? 'External' : 'In-house'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₱{item.revenue.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <motion.div 
                          className={`h-2 rounded-full ${
                            item.is_externally_sourced ? 'bg-[#571C1F]' : 'bg-[#003B25]'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.revenue / reportData.totalSales * 100).toFixed(1)}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {(item.revenue / reportData.totalSales * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ML Component - Product Associations - Improved */}
      <Card 
        title="Product Association Analysis" 
        className="bg-white border border-[#571C1F]/10 hover:border-[#571C1F]/20 transition-colors duration-200 shadow-sm"
      >
        <div className="mb-4 flex flex-col space-y-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#571C1F] rounded-full mr-2"></div>
            <span className="text-sm text-gray-600 font-medium">Discover which products are commonly purchased together</span>
          </div>
          
          {associationRules.metrics?.totalAssociations && (
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="px-3 py-1.5 bg-[#FFF6F2] rounded-lg text-sm text-[#571C1F] font-medium border border-[#571C1F]/10">
                <span className="font-bold">{associationRules.metrics.totalAssociations}</span> associations found
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => handleThresholdChange('confidence', 0.3)}
                  size="sm" 
                  type="outline"
                >
                  Reset Filters
                </Button>
                
                <Button
                  onClick={() => onExport('associations', 'csv')}
                  size="sm"
                  type="secondary"
                >
                  Export
                </Button>
              </div>
            </div>
          )}
          
          {/* Improved sliders for confidence and support */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
            {/* Confidence threshold slider */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="confidence-slider" className="text-sm font-medium text-gray-700">
                  Confidence Threshold
                </label>
                <span className="text-sm bg-[#571C1F] text-white px-2 py-0.5 rounded-md">
                  {(associationRules.confidence * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="relative h-10">
                <input
                  id="confidence-slider"
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={associationRules.confidence}
                  onChange={(e) => handleThresholdChange('confidence', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#571C1F]"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                  <span>10%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
            
            {/* Support threshold slider */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="support-slider" className="text-sm font-medium text-gray-700">
                  Support Threshold
                </label>
                <span className="text-sm bg-[#003B25] text-white px-2 py-0.5 rounded-md">
                  {(associationRules.support * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="relative h-10">
                <input
                  id="support-slider"
                  type="range"
                  min="0.01"
                  max="0.25"
                  step="0.01"
                  value={associationRules.support}
                  onChange={(e) => handleThresholdChange('support', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#003B25]"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                  <span>1%</span>
                  <span>10%</span>
                  <span>25%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Rules display */}
        <div className="mt-4 border-t border-gray-100 pt-4">
          {associationRules.rules.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <p>No associations found with current thresholds</p>
              <p className="text-sm mt-2">Try lowering the confidence and support thresholds</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {associationRules.rules.slice(0, 10).map((rule, index) => (
                <motion.div
                  key={`${rule.antecedent}-${rule.consequent}-${index}`}
                  className="p-3 border border-gray-100 rounded-lg shadow-sm bg-white"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -1, backgroundColor: '#fafafa' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium">
                          {rule.antecedent && Array.isArray(rule.antecedent) ? rule.antecedent.join(", ") : "Product"}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <span className="text-sm font-medium">
                          {rule.consequent && Array.isArray(rule.consequent) ? rule.consequent.join(", ") : "Related Product"}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-1 bg-[#571C1F]/5 rounded-md">
                          <div className="text-xs text-gray-500">Confidence</div>
                          <div className="text-sm font-medium">{(rule.confidence != null ? (rule.confidence * 100).toFixed(1) : '0.0')}%</div>
                        </div>
                        <div className="text-center p-1 bg-[#003B25]/5 rounded-md">
                          <div className="text-xs text-gray-500">Support</div>
                          <div className="text-sm font-medium">{(rule.support != null ? (rule.support * 100).toFixed(1) : '0.0')}%</div>
                        </div>
                        <div className="text-center p-1 bg-blue-50 rounded-md">
                          <div className="text-xs text-gray-500">Lift</div>
                          <div className="text-sm font-medium">{(rule.lift != null ? rule.lift.toFixed(2) : '0.00')}x</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {associationRules.rules.length > 10 && (
                <div className="text-center mt-2 text-sm text-gray-500">
                  + {associationRules.rules.length - 10} more associations found
                </div>
              )}
            </div>
          )}
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
        <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293 4.293a1 1 0 00-1.414-1.414l5-5a1 1 0 011.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
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
      case 'order':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        );
      case 'chart':
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
            {prefix}{typeof value === 'number' ? value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : value}{suffix}
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
          className="p-3 bg-[#FFF6F2] rounded-full shadow-md"
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

const PaymentMethodsChart = ({ data, loading }) => {
  const chartRef = useRef();
  
  // More aggressive cleanup
  useEffect(() => {
    // Return a cleanup function
    return () => {
      if (chartRef.current) {
        // Try both ways to access the chart instance
        const chart = 
          chartRef.current.chartInstance || 
          (chartRef.current.canvas && ChartJS.getChart(chartRef.current.canvas));
          
        if (chart) {
          chart.destroy();
        }
      }
    };
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: "'Inter', sans-serif",
            size: 11
          },
          color: '#571C1F',
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#571C1F',
        bodyColor: '#333',
        borderColor: 'rgba(87, 28, 31, 0.2)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true,
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            const value = context.raw;
            const total = context.chart.getDatasetMeta(0).total;
            const percentage = Math.round((value / total) * 100);
            const formattedValue = new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP'
            }).format(value);
            return `${formattedValue} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="md" color="#571C1F" />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center">
      <Doughnut 
        data={data} 
        options={{
          ...chartOptions,
          id: `payment-chart-${Date.now()}`
        }}
        ref={chartRef}
      />
    </div>
  );
};

// New component for Product Type Pie Chart
const ProductTypePieChart = ({ data, loading }) => {
  const chartRef = useRef();
  
  // Cleanup function
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        const chart = 
          chartRef.current.chartInstance || 
          (chartRef.current.canvas && ChartJS.getChart(chartRef.current.canvas));
          
        if (chart) {
          chart.destroy();
        }
      }
    };
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#571C1F',
        bodyColor: '#333',
        borderColor: 'rgba(87, 28, 31, 0.2)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const total = context.chart.getDatasetMeta(0).total;
            const percentage = Math.round((value / total) * 100);
            const formattedValue = new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP'
            }).format(value);
            return `${context.label}: ${formattedValue} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="md" color="#571C1F" />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center max-h-40">
      <Doughnut 
        data={data} 
        options={{
          ...chartOptions,
          id: `product-type-chart-${Date.now()}`
        }}
        ref={chartRef}
      />
    </div>
  );
};

export default SalesReport;