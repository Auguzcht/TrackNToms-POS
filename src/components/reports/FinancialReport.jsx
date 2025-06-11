import { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { Spinner } from '../common/Spinner';
import { useSales } from '../../hooks/useSales';
import { useInventory } from '../../hooks/useInventory';
import { useMLPredictions } from '../../hooks/useMLPredictions';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Import ML components
import PredictiveMetricsPanel from '../ml/PredictiveMetricsPanel';

const FinancialReport = forwardRef(({ 
  startDate = null,
  endDate = null,
  onExport = () => {}
}, ref) => {
  const { fetchSales } = useSales();
  const { fetchInventory } = useInventory();
  const { getPredictiveMetrics } = useMLPredictions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Add state for ML component
  const [predictiveMetrics, setPredictiveMetrics] = useState({
    profitPrediction: null,
    revenueTrends: null,
    costTrends: null,
    confidenceIntervals: null,
    featureImportance: []
  });
  
  const [financialData, setFinancialData] = useState({
    revenue: {
      total: 0,
      byCategory: {},
      dailyTotals: []
    },
    expenses: {
      total: 0,
      byCategory: {
        inventory: 0,
        operating: 0,
        other: 0
      }
    },
    profit: 0,
    profitMargin: 0
  });

  // Create refs for chart components
  const revenueChartRef = useRef(null);
  const profitChartRef = useRef(null);
  
  // Format date range for display
  const dateRangeText = useMemo(() => {
    if (!startDate && !endDate) return 'All time';
    if (startDate && !endDate) return `Since ${new Date(startDate).toLocaleDateString()}`;
    if (!startDate && endDate) return `Until ${new Date(endDate).toLocaleDateString()}`;
    return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
  }, [startDate, endDate]);

  // Store raw data for export
  const [rawFinancialData, setRawFinancialData] = useState({
    sales: [],
    expenses: []
  });

  useEffect(() => {
    const generateFinancialReport = async () => {
      setLoading(true);
      try {
        // Fetch sales data for the given period
        const salesData = await fetchSales({ 
          startDate, 
          endDate 
        });
        
        // Store raw data for export functionality
        setRawFinancialData({
          ...rawFinancialData,
          sales: salesData
        });
        
        // Fetch inventory data (expenses)
        const { data: inventoryData } = await fetchInventory();
        
        // Process sales data
        let totalRevenue = 0;
        let revenueByCategory = {};
        let dailyTotals = [];
        
        // Group by date
        const dateMap = {};
        
        salesData.forEach(sale => {
          if (!sale.is_voided) {
            totalRevenue += parseFloat(sale.total_amount);
            
            // Aggregate by category
            sale.items?.forEach(item => {
              const category = item.category || 'Uncategorized';
              revenueByCategory[category] = (revenueByCategory[category] || 0) + parseFloat(item.subtotal);
            });
            
            // Aggregate by date
            const saleDate = new Date(sale.sale_date).toISOString().split('T')[0];
            if (!dateMap[saleDate]) {
              dateMap[saleDate] = 0;
            }
            dateMap[saleDate] += parseFloat(sale.total_amount);
          }
        });
        
        // Convert date map to array for charting
        dailyTotals = Object.entries(dateMap).map(([date, total]) => ({ 
          date, 
          total 
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Process inventory expenses
        const inventoryExpense = inventoryData?.ingredients?.reduce((total, ing) => {
          // Assuming each ingredient with a last_restock_date in our period was purchased
          if (ing.last_restock_date) {
            const restockDate = new Date(ing.last_restock_date);
            if ((!startDate || restockDate >= new Date(startDate)) && 
                (!endDate || restockDate <= new Date(endDate))) {
              return total + parseFloat(ing.unit_cost || 0) * parseFloat(ing.quantity || 0);
            }
          }
          return total;
        }, 0) || 0;
        
        // Add operating expenses based on revenue
        const operatingExpense = totalRevenue * 0.35; // 35% of revenue
        const otherExpense = totalRevenue * 0.05; // 5% of revenue
        
        const totalExpenses = inventoryExpense + operatingExpense + otherExpense;
        
        // Calculate profit and metrics
        const profit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
        
        setFinancialData({
          revenue: {
            total: totalRevenue,
            byCategory: revenueByCategory,
            dailyTotals
          },
          expenses: {
            total: totalExpenses,
            byCategory: {
              inventory: inventoryExpense,
              operating: operatingExpense,
              other: otherExpense
            }
          },
          profit,
          profitMargin
        });

        // Store expense data for export
        setRawFinancialData(prev => ({
          ...prev,
          expenses: [
            { category: 'Inventory', amount: inventoryExpense },
            { category: 'Operating', amount: operatingExpense },
            { category: 'Other', amount: otherExpense }
          ]
        }));

        // Fetch ML predictive metrics
        try {
          const predictions = await getPredictiveMetrics({ 
            startDate: startDate ? new Date(startDate) : undefined, 
            endDate: endDate ? new Date(endDate) : undefined,
            forecastDays: 14
          });
          
          setPredictiveMetrics(predictions);
        } catch (mlError) {
          console.error('Error fetching ML predictions:', mlError);
          // Don't fail the entire report just because ML failed
        }
        
      } catch (err) {
        console.error('Error generating financial report:', err);
        setError('Failed to generate financial report. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    generateFinancialReport();
  }, [fetchSales, fetchInventory, getPredictiveMetrics, startDate, endDate, refreshKey]);

  // Handle exporting financial data
  const handleExport = (format = 'csv') => {
    try {
      console.log("FinancialReport handleExport called with format:", format);
      
      // Check if we have data to export
      if (!financialData || !financialData.revenue || !financialData.expenses) {
        toast.error('No financial data available to export');
        return;
      }
      
      // Create a simplified CSV-friendly data array
      const csvData = [
        // Header row
        {
          'Report Type': 'Financial Summary',
          'Period': dateRangeText,
          'Generated On': new Date().toLocaleString()
        },
        {}, // Empty row for spacing
        
        // Summary section
        { 'Metric': 'Total Revenue', 'Value': `₱${financialData.revenue.total.toFixed(2)}` },
        { 'Metric': 'Total Expenses', 'Value': `₱${financialData.expenses.total.toFixed(2)}` },
        { 'Metric': 'Gross Profit', 'Value': `₱${financialData.profit.toFixed(2)}` },
        { 'Metric': 'Net Profit', 'Value': `₱${financialData.profit.toFixed(2)}` },
        { 'Metric': 'Profit Margin', 'Value': `${financialData.profitMargin.toFixed(2)}%` },
        {}, // Empty row
        
        // Revenue breakdown section
        { 'Category': 'REVENUE BY CATEGORY' },
        ...Object.entries(financialData.revenue.byCategory).map(([category, amount]) => ({
          'Category': category,
          'Amount': `₱${amount.toFixed(2)}`,
          'Percentage': `${((amount / financialData.revenue.total) * 100).toFixed(1)}%`
        })),
        {}, // Empty row
        
        // Expenses breakdown section
        { 'Category': 'EXPENSES BY CATEGORY' },
        ...Object.entries(financialData.expenses.byCategory).map(([category, amount]) => ({
          'Category': category.charAt(0).toUpperCase() + category.slice(1),
          'Amount': `₱${amount.toFixed(2)}`,
          'Percentage': `${((amount / financialData.expenses.total) * 100).toFixed(1)}%`
        }))
      ];
      
      // Format the data for the export function
      const formattedReport = {
        type: 'financial',
        title: 'Financial Report',
        dateRange: {
          startDate,
          endDate,
          formatted: dateRangeText
        },
        summary: {
          revenue: financialData.revenue.total || 0,
          expenses: financialData.expenses.total || 0,
          grossProfit: financialData.profit || 0,
          netProfit: financialData.profit || 0,
          grossProfitMargin: financialData.profitMargin || 0,
          netProfitMargin: financialData.profitMargin || 0
        },
        data: csvData, // Use our flattened CSV data here
        analytics: {
          revenue: {
            byCategory: financialData.revenue.byCategory || {},
            dailyTrend: financialData.revenue.dailyTotals || []
          },
          expenses: {
            byCategory: financialData.expenses.byCategory || {}
          }
        }
      };

      // Call the parent onExport function
      onExport('financial', format, formattedReport);
    } catch (error) {
      console.error('Error exporting financial data:', error);
      toast.error('Failed to export financial report');
    }
  };

  // Expose the handleExport method to the parent via ref
  useImperativeHandle(ref, () => ({
    handleExport
  }), [handleExport]);

  // Handle refreshing predictive metrics
  const handleRefreshPredictions = async () => {
    try {
      const predictions = await getPredictiveMetrics({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        forecastDays: 14,
        forceRefresh: true
      });
      
      setPredictiveMetrics(predictions);
      toast.success("Financial predictions refreshed successfully");
    } catch (err) {
      console.error('Error refreshing predictions:', err);
      toast.error("Failed to refresh financial predictions");
    }
  };

  // Calculate revenue chart data
  const revenueChartData = useMemo(() => {
    if (!financialData.revenue.dailyTotals || financialData.revenue.dailyTotals.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Daily Revenue',
          data: [],
          backgroundColor: 'rgba(87, 28, 31, 0.7)',
          borderColor: 'rgba(87, 28, 31, 1)',
          borderWidth: 1,
          borderRadius: 4
        }]
      };
    }
    
    return {
      labels: financialData.revenue.dailyTotals.map(item => new Date(item.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Daily Revenue',
          data: financialData.revenue.dailyTotals.map(item => item.total),
          backgroundColor: 'rgba(87, 28, 31, 0.7)',
          borderColor: 'rgba(87, 28, 31, 1)',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    };
  }, [financialData.revenue.dailyTotals]);

  // Calculate expense breakdown chart data for doughnut chart
  const expenseChartData = useMemo(() => ({
    labels: ['Inventory', 'Operating', 'Other'],
    datasets: [
      {
        data: [
          financialData.expenses.byCategory.inventory || 0,
          financialData.expenses.byCategory.operating || 0,
          financialData.expenses.byCategory.other || 0
        ],
        backgroundColor: [
          'rgba(87, 28, 31, 0.8)',
          'rgba(0, 59, 37, 0.8)',
          'rgba(255, 159, 64, 0.8)'
        ],
        borderWidth: 1,
        borderColor: '#ffffff'
      }
    ]
  }), [financialData.expenses.byCategory]);
  
  // Calculate profit breakdown data
  const profitBreakdownData = useMemo(() => ({
    labels: ['Revenue', 'Expenses', 'Profit'],
    datasets: [
      {
        label: 'Financial Breakdown',
        data: [
          financialData.revenue.total || 0,
          financialData.expenses.total || 0,
          financialData.profit || 0
        ],
        backgroundColor: [
          'rgba(0, 59, 37, 0.8)', // Revenue (green)
          'rgba(255, 159, 64, 0.8)', // Expenses (orange)
          'rgba(87, 28, 31, 0.8)' // Profit (brand color)
        ],
        borderColor: [
          'rgba(0, 59, 37, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(87, 28, 31, 1)'
        ],
        borderWidth: 1
      }
    ]
  }), [financialData.revenue.total, financialData.expenses.total, financialData.profit]);

  // Cleanup chart instances when unmounting
  useEffect(() => {
    return () => {
      if (revenueChartRef.current && revenueChartRef.current.destroy) {
        revenueChartRef.current.destroy();
      }
      if (profitChartRef.current && profitChartRef.current.destroy) {
        profitChartRef.current.destroy();
      }
    };
  }, []);

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
          label="Generating financial report and predictions..."
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
      {/* Summary Cards - Using same style as SalesReport */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard 
          title="Total Revenue"
          value={financialData.revenue.total}
          prefix="₱"
          change={12.5}
          changeType="positive"
          icon="revenue"
          bgColor="bg-white"
          valueColor="text-gray-900"
        />
        <SummaryCard 
          title="Total Expenses"
          value={financialData.expenses.total}
          prefix="₱"
          change={8.3}
          changeType="negative"
          icon="expense"
          bgColor="bg-white"
          valueColor="text-gray-900"
        />
        <SummaryCard 
          title="Net Profit"
          value={financialData.profit}
          prefix="₱"
          suffix={` (${financialData.profitMargin.toFixed(1)}%)`}
          change={15.8}
          changeType={financialData.profit > 0 ? "positive" : "negative"}
          icon="chart"
          bgColor="bg-white"
          valueColor="text-gray-900"
        />
      </div>

      {/* ML Component - Predictive Analytics */}
      <Card 
        title="Financial Predictions & Analysis" 
        className="bg-white border border-[#571C1F]/10 hover:border-[#571C1F]/20 transition-colors duration-200 shadow-sm"
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#571C1F] rounded-full mr-2"></div>
            <span className="text-sm text-gray-500">AI-powered financial analysis and forecasting</span>
          </div>
          
          <Button
            onClick={handleRefreshPredictions}
            size="sm"
            type="secondary"
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            }
          >
            Refresh Predictions
          </Button>
        </div>
        
        <PredictiveMetricsPanel 
          metrics={predictiveMetrics}
          dateRange={dateRangeText}
          onRefresh={handleRefreshPredictions}
        />
      </Card>

      {/* Revenue and Profit Breakdown - 2 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card 
          title="Revenue Trend" 
          className="bg-white border border-[#571C1F]/10 hover:border-[#571C1F]/20 transition-colors duration-200 shadow-sm"
        >
          <div className="mb-2 flex items-center">
            <div className="w-3 h-3 bg-[#571C1F] rounded-full mr-2"></div>
            <span className="text-sm text-gray-500">Daily revenue during selected period</span>
          </div>
          
          <div style={{ height: "350px" }}>
            {revenueChartData.labels.length > 0 ? (
              <Bar 
                data={revenueChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
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
                      callbacks: {
                        label: (context) => {
                          return context && context.raw !== undefined ? 
                            `₱${context.raw.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : '';
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => {
                          return '₱' + (value ? value.toLocaleString() : '0');
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 text-sm">No revenue data available for this period</p>
              </div>
            )}
          </div>
        </Card>

        {/* Profit Breakdown */}
        <Card 
          title="Profit Breakdown" 
          className="bg-white border border-[#571C1F]/10 hover:border-[#571C1F]/20 transition-colors duration-200 shadow-sm"
        >
          <div className="mb-2 flex items-center">
            <div className="w-3 h-3 bg-[#571C1F] rounded-full mr-2"></div>
            <span className="text-sm text-gray-500">Revenue, expenses, and profit for the period</span>
          </div>
          
          <div style={{ height: "350px" }}>
            {/* Only render chart when we have valid data */}
            {financialData && 
              financialData.revenue && 
              financialData.revenue.total > 0 ? (
                <Doughnut 
                  data={profitBreakdownData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          color: '#333',
                          font: {
                            weight: 'bold'
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#571C1F',
                        bodyColor: '#333',
                        borderColor: 'rgba(87, 28, 31, 0.2)',
                        borderWidth: 1,
                        callbacks: {
                          label: (context) => {
                            if (!context || context.raw === undefined) return '';
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ₱${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
                          }
                        }
                      }
                    }
                  }}
                />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 text-sm">No financial data available for this period</p>
              </div>
            )}
           </div>
        </Card>
      </div>
    </motion.div>
  );
});

// Summary Card component
const SummaryCard = ({ 
  title, 
  value, 
  prefix = '', 
  suffix = '', 
  change = 0, 
  changeType = 'neutral',
  icon = 'chart',
  bgColor = 'from-[#FFF6F2]/50 to-white',
  accentColor = '[#571C1F]' 
}) => {
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
    if (changeType === 'positive') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
        </svg>
      );
    } else if (changeType === 'negative') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
        </svg>
      );
    }
    return null;
  };

  // Get icon based on type
  let iconElement = null;
  switch (icon) {
    case 'revenue':
      iconElement = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      break;
    case 'expense':
      iconElement = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
      break;
    case 'chart':
      iconElement = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
      break;
    default:
      iconElement = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }

  return (
    <motion.div 
      className={`rounded-lg shadow-sm p-4 border border-${accentColor}/10 relative overflow-hidden bg-gradient-to-br ${bgColor}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      whileHover={{ y: -4, boxShadow: `0 10px 25px -5px rgba(87, 28, 31, 0.1)` }}
    >
      <motion.div 
        className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#571C1F] to-[#003B25]"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      />
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="text-xl font-bold mt-1 text-gray-900">
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
          className={`p-3 bg-${accentColor}/10 rounded-full shadow-md`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 260, 
            damping: 20,
            delay: 0.3
          }}
        >
          {iconElement}
        </motion.div>
      </div>

      {/* Animated indicator bar at bottom */}
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

export default FinancialReport;