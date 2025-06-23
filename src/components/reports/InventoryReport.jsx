import { useState, useEffect, useMemo, useRef } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { Spinner } from '../common/Spinner';
import { useInventory } from '../../hooks/useInventory';
import { useMLPredictions } from '../../hooks/useMLPredictions';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, BarElement, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';

// Import ML components
import AnomalyDetectionPanel from '../ml/AnomalyDetectionPanel';
import InventoryOptimizationPanel from '../ml/InventoryOptimizationPanel';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const InventoryReport = ({ 
  startDate = null,
  endDate = null, 
  onExport = () => {} 
}) => {
  const { 
    ingredients, 
    items, 
    pullouts, 
    loading: inventoryLoading, 
    fetchInventory, 
    createPullout 
  } = useInventory();
  const { detectInventoryAnomalies, getInventoryOptimizations, applyInventoryOptimization } = useMLPredictions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Add states for ML components
  const [anomalies, setAnomalies] = useState({
    detected: [],
    detected_at: new Date().toISOString(),
  });
  
  const [optimizationData, setOptimizationData] = useState({
    recommendations: [],
    potentialSavings: 0,
    wasteReduction: 0
  });
  
  const [reportData, setReportData] = useState({
    ingredients: [],
    items: [],
    summary: {
      totalIngredients: 0,
      totalItems: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      inventoryValue: 0
    },
    analytics: {
      stockByCategory: {},
      recentMovements: [],
      valueByCategory: []
    }
  });

  // Format date range for display
  const dateRangeText = useMemo(() => {
    if (!startDate && !endDate) return 'All time';
    if (startDate && !endDate) return `Since ${new Date(startDate).toLocaleDateString()}`;
    if (!startDate && endDate) return `Until ${new Date(endDate).toLocaleDateString()}`;
    return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
  }, [startDate, endDate]);

  // Add a ref to track if this is the first render
  const initialLoadCompleted = useRef(false);

  useEffect(() => {
    // Skip the effect if we've already loaded the data once and only pullouts changed
    if (initialLoadCompleted.current && !startDate && !endDate) {
      return;
    }
    
    const generateInventoryReport = async () => {
      setLoading(true);
      try {
        // Fetch inventory data
        const inventoryData = await fetchInventory();
        
        // Process ingredients data
        const processedIngredients = (inventoryData.ingredients || []).map(ing => {
          // Calculate value
          const value = ing.quantity * ing.unit_cost || 0;
          
          // Calculate stock status
          let stockStatus = 'normal';
          if (ing.quantity <= 0) {
            stockStatus = 'out';
          } else if (ing.quantity <= ing.minimum_quantity) {
            stockStatus = 'low';
          }
          
          return {
            ...ing,
            value,
            stockStatus,
            lastRestockDate: ing.last_restock_date ? new Date(ing.last_restock_date).toLocaleDateString() : 'N/A',
            // Ensure category is defined (using database default or 'Uncategorized')
            category: ing.category || 'Uncategorized'
          };
        });
        
        // Calculate summary metrics
        const totalIngredients = processedIngredients.length;
        const lowStockItems = processedIngredients.filter(ing => ing.stockStatus === 'low').length;
        const outOfStockItems = processedIngredients.filter(ing => ing.stockStatus === 'out').length;
        const inventoryValue = processedIngredients.reduce((sum, ing) => sum + ing.value, 0);
        
        // Group by category for charts
        const stockByCategory = {};
        const valueByCategory = [];
        const categoryValues = {};

        // Process ingredients by category
        processedIngredients.forEach(ing => {
          // Ensure ingredient has a category
          const category = ing.category || 'Uncategorized';
          
          // For stock status breakdown
          if (!stockByCategory[category]) {
            stockByCategory[category] = {
              normal: 0,
              low: 0,
              out: 0
            };
          }
          stockByCategory[category][ing.stockStatus]++;
          
          // For value by category - accumulate values
          if (!categoryValues[category]) {
            categoryValues[category] = 0;
          }
          categoryValues[category] += ing.value;
        });

        // Convert the category values object to an array for the chart
        Object.keys(categoryValues).forEach(category => {
          valueByCategory.push({
            category,
            value: categoryValues[category]
          });
        });

        // Sort categories by value (highest first)
        valueByCategory.sort((a, b) => b.value - a.value);

        // Log to help debugging
        console.log('Value by category:', valueByCategory);
        
        // Get recent movement data from pullouts
        const recentMovements = [];

        // Ensure pullouts is defined and has data
        if (Array.isArray(pullouts) && pullouts.length > 0) {
          // Take the most recent 5 pullouts
          pullouts.slice(0, 5).forEach(pullout => {
            if (pullout) {
              recentMovements.push({
                date: format(new Date(pullout.date_of_pullout || pullout.created_at), 'MMM d, yyyy'),
                item: pullout.ingredientName || pullout.ingredients?.name || 'Unknown Ingredient',
                quantity: pullout.quantity || 0,
                type: 'pullout',
                reason: pullout.reason || 'No reason provided'
              });
            }
          });
        }

        // Set the report data with proper movements
        setReportData({
          ingredients: processedIngredients,
          items: inventoryData.items,
          summary: {
            totalIngredients,
            totalItems: inventoryData.items?.length || 0,
            lowStockItems,
            outOfStockItems,
            inventoryValue
          },
          analytics: {
            stockByCategory,
            recentMovements, // Now properly populated
            valueByCategory
          }
        });

        // Fetch ML anomaly detections using the deployed edge function
        try {
          const anomalyResults = await detectInventoryAnomalies({ 
            startDate: startDate ? new Date(startDate) : undefined, 
            endDate: endDate ? new Date(endDate) : undefined 
          });
          
          // Handle the actual response structure from your edge function
          setAnomalies({
            detected: anomalyResults.anomalies || [],
            detected_at: anomalyResults.detected_at || new Date().toISOString(),
          });
        } catch (mlError) {
          console.error('Error fetching anomaly data:', mlError);
          // Don't fail the whole report if ML components fail
          setAnomalies({
            detected: [],
            detected_at: new Date().toISOString(),
          });
        }
        
        // Fetch ML inventory optimization recommendations using the deployed edge function
        try {
          const optimizationResults = await getInventoryOptimizations();
          setOptimizationData({
            recommendations: optimizationResults.recommendations || [],
            potentialSavings: optimizationResults.potentialSavings || 0,
            wasteReduction: optimizationResults.wasteReduction || 0
          });
        } catch (mlError) {
          console.error('Error fetching optimization data:', mlError);
          // Don't fail the whole report if ML components fail
          setOptimizationData({
            recommendations: [],
            potentialSavings: 0,
            wasteReduction: 0
          });
        }
        
        // Mark initial load as completed
        initialLoadCompleted.current = true;
        
      } catch (err) {
        console.error('Error generating inventory report:', err);
        setError('Failed to generate inventory report. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    generateInventoryReport();
    
    // Remove 'pullouts' from the dependency array
  }, [startDate, endDate, fetchInventory, detectInventoryAnomalies, getInventoryOptimizations]);

  // Handle refreshing anomaly detection
  const handleRefreshAnomalyDetection = async () => {
    try {
      const anomalyResults = await detectInventoryAnomalies({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        forceRefresh: true
      });
      
      // Make sure we have valid data before setting state
      setAnomalies({
        detected: anomalyResults?.detected || [],
        detected_at: anomalyResults?.detected_at || new Date().toISOString()
      });
      
      // Use console.log instead of toast to avoid the error
      console.log("Successfully refreshed anomaly detection data");
    } catch (err) {
      console.error('Error refreshing anomaly detection:', err);
      console.log("Failed to refresh anomaly detection");
    }
  };

  // Handle applying inventory optimization recommendations
  const handleApplyRecommendations = async (recommendationIds, recommendations) => {
    try {
      // Process each recommendation
      for (const recommendation of recommendations) {
        // If this is a restock recommendation, create a pullout with negative quantity (which means adding stock)
        if (recommendation.type === 'restock') {
          await createPullout({
            ingredient_id: recommendation.ingredient.ingredient_id,
            quantity: -Math.abs(recommendation.recommendedValue - recommendation.currentValue),  // Negative means adding stock
            reason: `AI-recommended restock: ${recommendation.reason}`,
            date_of_pullout: new Date().toISOString().split('T')[0],
            approved_by: true // Auto-approve the AI recommendations
          });
        } 
        // If this is a reduce recommendation, create a positive pullout (removing stock)
        else if (recommendation.type === 'reduce') {
          await createPullout({
            ingredient_id: recommendation.ingredient.ingredient_id,
            quantity: Math.abs(recommendation.currentValue - recommendation.recommendedValue),
            reason: `AI-recommended reduction: ${recommendation.reason}`,
            date_of_pullout: new Date().toISOString().split('T')[0],
            approved_by: true // Auto-approve the AI recommendations
          });
        } 
        // For other recommendation types, apply them via the ML API
        else {
          await applyInventoryOptimization(recommendation.id);
        }
      }
      
      // Refresh the optimization data
      const newOptimizationData = await getInventoryOptimizations();
      setOptimizationData(newOptimizationData);
      
      // Also refresh inventory data - this will update the entire report
      await fetchInventory();
      toast.success(`Successfully applied ${recommendationIds.length} recommendation(s)`);
    } catch (err) {
      console.error('Error applying recommendations:', err);
      toast.error("Failed to apply recommendations");
    }
  };

  // Function to refresh charts
  const refreshCharts = () => {
    setRefreshKey(prev => prev + 1);
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
          label="Generating inventory report and analytics..."
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

  // Data for stock status chart - updated to match SalesReport style
  const stockStatusData = {
    labels: ['Normal', 'Low Stock', 'Out of Stock'],
    datasets: [
      {
        label: 'Ingredients',
        data: [
          reportData.summary.totalIngredients - reportData.summary.lowStockItems - reportData.summary.outOfStockItems,
          reportData.summary.lowStockItems,
          reportData.summary.outOfStockItems
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Make sure we actually have category data from the database
  const categories = reportData.analytics.valueByCategory
    .filter(item => item.category && item.value > 0)
    .slice(0, 7); // Limit to top 7 categories

  // Use placeholder data if we have no categories
  if (categories.length === 0) {
    categories.push({ 
      category: 'Uncategorized', 
      value: reportData.summary.inventoryValue 
    });
  }

  // Data for inventory value chart - updated to match SalesReport style
  const inventoryValueData = {
    labels: categories.map(item => item.category),
    datasets: [
      {
        label: 'Inventory Value (₱)',
        data: categories.map(item => item.value),
        backgroundColor: [
          'rgba(87, 28, 31, 0.8)',
          'rgba(0, 59, 37, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(201, 203, 207, 0.8)',
          'rgba(255, 99, 132, 0.8)'
        ],
        borderColor: [
          'rgb(87, 28, 31)',
          'rgb(0, 59, 37)',
          'rgb(255, 159, 64)',
          'rgb(54, 162, 235)',
          'rgb(153, 102, 255)',
          'rgb(201, 203, 207)',
          'rgb(255, 99, 132)'
        ],
        borderWidth: 1,
        hoverOffset: 4
      }
    ]
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard 
          title="Total Ingredients"
          value={reportData.summary.totalIngredients}
          subtext="Items in inventory"
          changeType="neutral"
          icon="ingredients"
          bgColor="from-cyan-50 to-blue-50"
          accentColor="cyan-500"
        />
        <SummaryCard 
          title="Low Stock"
          value={reportData.summary.lowStockItems}
          subtext="Items below minimum"
          changeType={reportData.summary.lowStockItems > 0 ? "negative" : "positive"}
          icon="alert"
          bgColor="from-amber-50 to-yellow-50"
          accentColor="amber-400"
        />
        <SummaryCard 
          title="Out of Stock"
          value={reportData.summary.outOfStockItems}
          subtext="Items at zero"
          changeType={reportData.summary.outOfStockItems > 0 ? "negative" : "positive"}
          icon="error"
          bgColor="from-red-50 to-rose-50"
          accentColor="red-500"
        />
        <SummaryCard 
          title="Menu Items"
          value={reportData.summary.totalItems}
          subtext="Active products"
          changeType="neutral"
          icon="food"
          bgColor="from-purple-50 to-indigo-50"
          accentColor="purple-400"
        />
        <SummaryCard 
          title="Inventory Value"
          value={`₱${reportData.summary.inventoryValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`}
          subtext="Total ingredient value"
          changeType="positive"
          icon="money"
          bgColor="from-green-50 to-emerald-50"
          accentColor="emerald-500"
        />
      </div>

      {/* Charts - 2 Column Grid with Shadows and Hover Effects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card 
          title="Inventory Status" 
          className="bg-white border border-[#571C1F]/10 hover:border-[#571C1F]/20 transition-colors duration-200 shadow-sm"
        >
          <div className="mb-2 flex items-center">
            <div className="w-3 h-3 bg-[#571C1F] rounded-full mr-2"></div>
            <span className="text-sm text-gray-500">Current inventory breakdown by status</span>
          </div>
          <div className="h-64">
            <Doughnut
              key={`status-chart-${refreshKey}`}
              data={stockStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                      padding: 15,
                      usePointStyle: true,
                      color: '#333'
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
                      label: function(context) {
                        const value = context.raw;
                        const total = context.chart.getDatasetMeta(0).total;
                        const percentage = Math.round((value / total) * 100);
                        return `${context.label}: ${value} items (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </Card>
        
        <Card 
          title="Top Ingredients by Value" 
          className="bg-white border border-[#571C1F]/10 hover:border-[#571C1F]/20 transition-colors duration-200 shadow-sm"
        >
          <div className="mb-2 flex items-center">
            <div className="w-3 h-3 bg-[#003B25] rounded-full mr-2"></div>
            <span className="text-sm text-gray-500">Highest value ingredients in your inventory</span>
          </div>
          <div className="h-64">
            {reportData.ingredients.length > 0 ? (
              <Bar
                key={`top-ingredients-${refreshKey}`}
                data={{
                  labels: reportData.ingredients
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 7)
                    .map(ing => ing.name),
                  datasets: [
                    {
                      label: 'Value (₱)',
                      data: reportData.ingredients
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 7)
                        .map(ing => ing.value),
                      backgroundColor: [
                        'rgba(87, 28, 31, 0.8)',
                        'rgba(0, 59, 37, 0.8)',
                        'rgba(255, 159, 64, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                        'rgba(201, 203, 207, 0.8)',
                        'rgba(255, 99, 132, 0.8)'
                      ],
                      borderColor: [
                        'rgb(87, 28, 31)',
                        'rgb(0, 59, 37)',
                        'rgb(255, 159, 64)',
                        'rgb(54, 162, 235)',
                        'rgb(153, 102, 255)',
                        'rgb(201, 203, 207)',
                        'rgb(255, 99, 132)'
                      ],
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y', // Makes it a horizontal bar chart
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      titleColor: '#003B25',
                      bodyColor: '#333',
                      borderColor: 'rgba(0, 59, 37, 0.2)',
                      borderWidth: 1,
                      padding: 10,
                      boxPadding: 5,
                      callbacks: {
                        label: function(context) {
                          const value = context.raw;
                          const formattedValue = new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP'
                          }).format(value);
                          return `${formattedValue}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      ticks: {
                        color: '#333',
                        font: {
                          size: 11
                        },
                        callback: function(value) {
                          const label = this.getLabelForValue(value);
                          // Truncate long names
                          return label.length > 15 ? label.substring(0, 15) + '...' : label;
                        }
                      }
                    },
                    x: {
                      ticks: {
                        color: '#333',
                        callback: function(value) {
                          return '₱' + value.toLocaleString();
                        }
                      },
                      grid: {
                        display: false
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#571C1F]/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">No ingredient data available</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ML Component - Anomaly Detection - Styled like SalesReport components */}
      <Card 
        title="Inventory Anomaly Detection" 
        className="bg-white border border-[#571C1F]/10 hover:border-[#571C1F]/20 transition-colors duration-200 shadow-sm"
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#571C1F] rounded-full mr-2"></div>
            <span className="text-sm text-gray-500">AI-powered detection of unusual inventory patterns</span>
          </div>
          
          {/* Don't add duplicate button as it's in the AnomalyDetectionPanel */}
          <div className="text-xs text-gray-500 italic">
            Last analyzed: {new Date(anomalies.detected_at).toLocaleString()}
          </div>
        </div>
        
        <AnomalyDetectionPanel 
          anomalies={{
            detected: anomalies.detected || [],
            detected_at: anomalies.detected_at || new Date().toISOString()
          }}
          startDate={startDate}
          endDate={endDate}
          onRefresh={handleRefreshAnomalyDetection}
        />
      </Card>

      {/* ML Component - Inventory Optimization - Styled like SalesReport components */}
      <Card 
        title="Inventory Optimization Recommendations" 
        className="bg-white border border-[#571C1F]/10 hover:border-[#571C1F]/20 transition-colors duration-200 shadow-sm"
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#003B25] rounded-full mr-2"></div>
            <span className="text-sm text-gray-500">Smart inventory management suggestions to reduce costs</span>
          </div>
          
          {optimizationData.potentialSavings > 0 && (
            <div className="px-3 py-1 bg-[#003B25]/10 rounded-full text-xs text-[#003B25] font-medium">
              Potential Savings: ₱{optimizationData.potentialSavings.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </div>
          )}
        </div>
        
        <InventoryOptimizationPanel 
          data={optimizationData}
          ingredients={ingredients || []}
          onApply={handleApplyRecommendations}
        />
      </Card>

      {/* Recent Inventory Movement - Enhanced with animation and styling */}
      <Card 
        title="Recent Inventory Activity" 
        className="bg-white border border-[#571C1F]/10 hover:border-[#571C1F]/20 transition-colors duration-200 shadow-sm"
      >
        <div className="mb-2 flex items-center">
          <div className="w-3 h-3 bg-[#571C1F] rounded-full mr-2"></div>
          <span className="text-sm text-gray-500">Latest inventory transactions and movements</span>
        </div>
        
        {reportData.analytics.recentMovements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#571C1F]/10">
              <thead className="bg-[#FFF6F2]/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">Ingredient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#571C1F]/10">
                <AnimatePresence>
                  {reportData.analytics.recentMovements.map((movement, index) => (
                    <motion.tr 
                      key={index} 
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#FFF6F2]/20'} hover:bg-[#FFF6F2]/40 transition-colors`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{movement.date}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{movement.item}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{movement.quantity}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${movement.type === 'pullout' ? 'bg-[#571C1F]/10 text-[#571C1F]' : 'bg-[#003B25]/10 text-[#003B25]'}`}>
                          {movement.type === 'pullout' ? 'Pull Out' : 'Restock'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{movement.reason}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <motion.div 
              className="p-3 bg-[#FFF6F2]/50 rounded-full mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#571C1F]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.div>
            <p className="text-sm">No recent inventory movements recorded</p>
            <p className="text-xs mt-1">Inventory transactions will appear here as they occur</p>
          </div>
        )}
      </Card>

      {/* Ingredients Inventory - Enhanced with animations and styling */}
      <Card 
        title="Ingredients Inventory" 
        className="bg-white border border-[#571C1F]/10 hover:border-[#571C1F]/20 transition-colors duration-200 shadow-sm"
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#571C1F] rounded-full mr-2"></div>
            <span className="text-sm text-gray-500">Complete inventory list with quantities and values</span>
          </div>
        </div>
        
        {reportData.ingredients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#571C1F]/10">
              <thead className="bg-[#FFF6F2]/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                    Min Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                    Last Restock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#571C1F] uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#571C1F]/10">
                <AnimatePresence>
                  {reportData.ingredients.map((ingredient, index) => (
                    <motion.tr 
                      key={ingredient.ingredient_id} 
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#FFF6F2]/20'} hover:bg-[#FFF6F2]/40 transition-colors`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      whileHover={{ backgroundColor: 'rgba(255, 246, 242, 0.4)' }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{ingredient.name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {ingredient.category || 'Uncategorized'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {ingredient.quantity} {ingredient.unit}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {ingredient.minimum_quantity} {ingredient.unit}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ₱{parseFloat(ingredient.unit_cost).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ₱{ingredient.value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {ingredient.lastRestockDate}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${ingredient.stockStatus === 'normal' ? 'bg-green-100 text-green-800' : 
                            ingredient.stockStatus === 'low' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {ingredient.stockStatus === 'normal' ? 'Normal' : 
                           ingredient.stockStatus === 'low' ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <motion.div 
              className="p-3 bg-[#FFF6F2]/50 rounded-full mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#571C1F]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </motion.div>
            <p className="text-sm">No ingredient data available</p>
            <p className="text-xs mt-1">Add ingredients to your inventory to see them here</p>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

// Updated Summary Card component to match SalesReport style with additional colors
const SummaryCard = ({ 
  title, 
  value, 
  subtext, 
  changeType = 'neutral', 
  icon,
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

  let iconElement = null;
  
  switch (icon) {
    case 'ingredients':
      iconElement = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2M7 7h10" />
        </svg>
      );
      break;
    case 'alert':
      iconElement = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
      break;
    case 'error':
      iconElement = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      break;
    case 'food':
      iconElement = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
      break;
    case 'money':
      iconElement = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#571C1F] to-[#003B25]`}
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      />
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="text-xl font-bold mt-1 text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          
          <p className="text-xs mt-2 text-gray-500">{subtext}</p>
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
        className={`absolute bottom-0 left-0 h-1 bg-${accentColor}/30`}
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

export default InventoryReport;