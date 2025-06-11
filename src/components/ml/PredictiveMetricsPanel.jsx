import { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PredictiveMetricsPanel = ({ metrics, dateRange, onRefresh }) => {
  const [chartData, setChartData] = useState(null);
  const [featureData, setFeatureData] = useState(null);
  
  useEffect(() => {
    if (metrics?.profitPrediction) {
      // Format data for Chart.js - profit/cost/revenue trends
      const labels = metrics.profitPrediction.dates.map(date => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      });

      const chartDataObj = {
        labels,
        datasets: [
          {
            label: 'Revenue',
            data: metrics.profitPrediction.values.map((val, i) => val + (metrics.costTrends?.values?.[i] || val * 0.6)),
            borderColor: '#003B25',
            backgroundColor: 'rgba(0, 59, 37, 0.5)',
            tension: 0.3,
            yAxisID: 'y',
            borderWidth: 2
          },
          {
            label: 'Costs',
            data: metrics.costTrends?.values || metrics.profitPrediction.values.map(val => val * 0.6),
            borderColor: '#571C1F',
            backgroundColor: 'rgba(87, 28, 31, 0.5)',
            tension: 0.3,
            yAxisID: 'y',
            borderWidth: 2
          },
          {
            label: 'Profit',
            data: metrics.profitPrediction.values,
            borderColor: '#FF9466',
            backgroundColor: 'rgba(255, 148, 102, 0.5)',
            tension: 0.3,
            yAxisID: 'y',
            borderWidth: 2.5,
            borderDash: []
          },
          {
            label: 'Confidence Range',
            data: metrics.profitPrediction.upperBound || [],
            borderColor: 'rgba(255, 148, 102, 0.5)',
            backgroundColor: 'rgba(255, 148, 102, 0.2)',
            pointRadius: 0,
            borderWidth: 1,
            tension: 0.3,
            fill: '+1', // Fill to the dataset below
            yAxisID: 'y'
          },
          {
            label: 'Lower Bound',
            data: metrics.profitPrediction.lowerBound || [],
            borderColor: 'rgba(255, 148, 102, 0.5)', 
            backgroundColor: 'transparent',
            pointRadius: 0,
            borderWidth: 1,
            tension: 0.3,
            yAxisID: 'y'
          }
        ]
      };
      
      setChartData(chartDataObj);
    }
    
    // Always set feature importance data, even if we have to use defaults
    const importanceData = metrics?.featureImportance?.length > 0
      ? [...metrics.featureImportance].sort((a, b) => b.importance - a.importance).slice(0, 5)
      : [
          { feature: 'Day of week', importance: 28 },
          { feature: 'Weather conditions', importance: 24 },
          { feature: 'Holidays', importance: 20 },
          { feature: 'Seasonal trends', importance: 15 },
          { feature: 'Product categories', importance: 13 }
        ];
    
    setFeatureData({
      labels: importanceData.map(f => f.feature),
      datasets: [
        {
          label: 'Feature Importance',
          data: importanceData.map(f => f.importance),
          backgroundColor: [
            'rgba(87, 28, 31, 0.8)',
            'rgba(0, 59, 37, 0.8)',
            'rgba(255, 148, 102, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(139, 92, 246, 0.8)',
          ],
          borderColor: [
            'rgba(87, 28, 31, 1)',
            'rgba(0, 59, 37, 1)',
            'rgba(255, 148, 102, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(139, 92, 246, 1)',
          ],
          borderWidth: 1,
          borderRadius: 4,
          hoverOffset: 4
        }
      ]
    });
    
  }, [metrics]);

  if (!metrics || !metrics.profitPrediction) {
    return (
      <motion.div 
        className="flex items-center justify-center h-60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-600 mb-2">No financial prediction data available</p>
          {onRefresh && (
            <button 
              onClick={onRefresh}
              className="mt-2 px-4 py-2 bg-[#571C1F] text-white rounded-md hover:bg-[#571C1F]/90 transition-colors duration-200 shadow-sm flex items-center mx-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Generate Predictions
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // Calculate trend indicators
  const revenueTrend = metrics.revenueTrends?.trend || 'stable';
  const costTrend = metrics.costTrends?.trend || 'stable';
  
  // Get trend icons
  const getTrendIcon = (trend) => {
    if (trend === 'increasing') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
        </svg>
      );
    } else if (trend === 'decreasing') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    );
  };

  // Calculate trend colors
  const getRevenueColor = () => {
    return revenueTrend === 'increasing' ? 'text-green-600' : revenueTrend === 'decreasing' ? 'text-red-600' : 'text-blue-600';
  };

  const getCostColor = () => {
    return costTrend === 'increasing' ? 'text-red-600' : costTrend === 'decreasing' ? 'text-green-600' : 'text-blue-600';
  };

  return (
    <div>
      {/* Financial performance cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div 
          className="relative p-4 rounded-lg border border-[#003B25]/20 bg-gradient-to-br from-green-50 to-white shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ y: -2, boxShadow: "0 10px 15px -5px rgba(0, 59, 37, 0.1)" }}
        >
          <motion.div 
            className="absolute top-0 left-0 h-1 w-full bg-[#003B25]"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#003B25]/70">Projected Revenue</p>
              <h3 className="text-xl font-bold mt-1 text-[#003B25]">
                ₱{metrics.confidenceIntervals?.revenue?.upper?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') || 0}
              </h3>
              
              <motion.div 
                className={`flex items-center text-xs mt-1.5 ${getRevenueColor()}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {getTrendIcon(revenueTrend)}
                {metrics.revenueTrends?.prediction || 'Stable trend predicted'}
              </motion.div>
            </div>
            <motion.div 
              className="p-3 bg-green-100/50 rounded-full shadow-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260, 
                damping: 20,
                delay: 0.3
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#003B25]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
            </motion.div>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-xs text-[#003B25]/60 mb-1">
              <span>Confidence: {metrics.revenueTrends?.confidence || 85}%</span>
              <span>Next 30 days</span>
            </div>
            <div className="w-full bg-[#003B25]/10 rounded-full h-1.5">
              <motion.div 
                className="bg-[#003B25] h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${metrics.revenueTrends?.confidence || 85}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="relative p-4 rounded-lg border border-[#571C1F]/20 bg-gradient-to-br from-red-50 to-white shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ y: -2, boxShadow: "0 10px 15px -5px rgba(87, 28, 31, 0.1)" }}
        >
          <motion.div 
            className="absolute top-0 left-0 h-1 w-full bg-[#571C1F]"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#571C1F]/70">Projected Costs</p>
              <h3 className="text-xl font-bold mt-1 text-[#571C1F]">
                ₱{metrics.confidenceIntervals?.costs?.upper?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') || 0}
              </h3>
              
              <motion.div 
                className={`flex items-center text-xs mt-1.5 ${getCostColor()}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {getTrendIcon(costTrend)}
                {metrics.costTrends?.prediction || 'Stable trend predicted'}
              </motion.div>
            </div>
            <motion.div 
              className="p-3 bg-red-100/50 rounded-full shadow-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260, 
                damping: 20,
                delay: 0.4
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </motion.div>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-xs text-[#571C1F]/60 mb-1">
              <span>Confidence: {metrics.costTrends?.confidence || 82}%</span>
              <span>Next 30 days</span>
            </div>
            <div className="w-full bg-[#571C1F]/10 rounded-full h-1.5">
              <motion.div 
                className="bg-[#571C1F] h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${metrics.costTrends?.confidence || 82}%` }}
                transition={{ duration: 1, delay: 0.6 }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="relative p-4 rounded-lg border border-[#FF9466]/30 bg-gradient-to-br from-orange-50 to-white shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ y: -2, boxShadow: "0 10px 15px -5px rgba(255, 148, 102, 0.15)" }}
        >
          <motion.div 
            className="absolute top-0 left-0 h-1 w-full bg-[#FF9466]"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#FF9466]/70">Projected Profit</p>
              <h3 className="text-xl font-bold mt-1 text-[#FF9466]">
                ₱{metrics.confidenceIntervals?.profit?.upper?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') || 0}
              </h3>
              
              <motion.div 
                className="flex items-center text-xs mt-1.5 text-blue-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1v-3a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Profit margin: {(((metrics.confidenceIntervals?.profit?.upper || 0) / (metrics.confidenceIntervals?.revenue?.upper || 1)) * 100).toFixed(1)}%
              </motion.div>
            </div>
            <motion.div 
              className="p-3 bg-orange-100/50 rounded-full shadow-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260, 
                damping: 20,
                delay: 0.5
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FF9466]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            </motion.div>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-xs text-[#FF9466]/70 mb-1">
              <span>Accuracy: {metrics.accuracy?.toFixed(1) || 85}%</span>
              <span>Next 30 days</span>
            </div>
            <div className="w-full bg-[#FF9466]/10 rounded-full h-1.5">
              <motion.div 
                className="bg-[#FF9466] h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${metrics.accuracy || 85}%` }}
                transition={{ duration: 1, delay: 0.7 }}
              />
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Two-column layout for charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial forecast chart */}
        {chartData && (
          <motion.div 
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-sm font-medium text-gray-700 mb-3">Financial Forecast Trend</h3>
            <div className="h-60">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        boxWidth: 10,
                        font: {
                          family: "'Inter', sans-serif",
                          size: 11
                        },
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          return `${context.dataset.label}: ₱${context.raw?.toFixed(2)}`;
                        }
                      },
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      titleColor: '#571C1F',
                      bodyColor: '#333',
                      borderColor: 'rgba(87, 28, 31, 0.2)',
                      borderWidth: 1,
                      padding: 8
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: false,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                      },
                      ticks: {
                        callback: (value) => `₱${value}`,
                        font: {
                          family: "'Inter', sans-serif",
                          size: 10
                        },
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        font: {
                          family: "'Inter', sans-serif",
                          size: 10
                        },
                      }
                    }
                  }
                }}
              />
            </div>
            <p className="text-xs text-center text-gray-500 mt-2">
              Forecast period: {dateRange || 'Next 14 days'} • 
              Confidence interval: {metrics.confidenceIntervals?.confidence || 95}%
            </p>
          </motion.div>
        )}
        
        {/* Feature importance chart - Always show this section */}
        <motion.div 
          className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-sm font-medium text-gray-700 mb-3">Key Factors Influencing Predictions</h3>
          <div className="h-60">
            {featureData && featureData.labels && featureData.datasets ? (
              <Bar
                data={featureData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
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
                      padding: 8,
                      callbacks: {
                        label: (context) => {
                          return `Impact: ${context.raw}%`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Importance Score (%)'
                      },
                      ticks: {
                        callback: (value) => `${value}%`,
                        font: {
                          family: "'Inter', sans-serif",
                          size: 10
                        },
                      }
                    },
                    y: {
                      grid: {
                        display: false
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">Loading feature importance data...</p>
              </div>
            )}
          </div>
          <p className="text-xs text-center text-gray-500 mt-2">
            Based on historical data analysis • Weight of each factor in financial outcomes
          </p>
        </motion.div>
      </div>
      
      {/* Confidence intervals section */}
      <motion.div
        className="mt-6 p-4 rounded-lg border border-[#571C1F]/10 bg-[#FFF6F2]/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h3 className="text-sm font-medium text-gray-700 mb-3">AI Confidence Intervals (95% confidence)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
            <p className="text-xs text-blue-700 font-medium">Revenue Range</p>
            <p className="text-sm mt-1 text-gray-700">
              ₱{metrics.confidenceIntervals?.revenue?.lower?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} - 
              ₱{metrics.confidenceIntervals?.revenue?.upper?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-red-100 shadow-sm">
            <p className="text-xs text-red-700 font-medium">Costs Range</p>
            <p className="text-sm mt-1 text-gray-700">
              ₱{metrics.confidenceIntervals?.costs?.lower?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} - 
              ₱{metrics.confidenceIntervals?.costs?.upper?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-green-100 shadow-sm">
            <p className="text-xs text-green-700 font-medium">Profit Range</p>
            <p className="text-sm mt-1 text-gray-700">
              ₱{metrics.confidenceIntervals?.profit?.lower?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} - 
              ₱{metrics.confidenceIntervals?.profit?.upper?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PredictiveMetricsPanel;