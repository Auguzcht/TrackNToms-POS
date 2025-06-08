import { useState, useEffect, useMemo } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { useSales } from '../../hooks/useSales';
import { useInventory } from '../../hooks/useInventory';
import { useMLPredictions } from '../../hooks/useMLPredictions'; // Updated name
import { motion } from 'framer-motion';

// Import ML components
import PredictiveMetricsPanel from '../ml/PredictiveMetricsPanel';

const FinancialReport = ({ 
  startDate = null,
  endDate = null,
  onExport = () => {}
}) => {
  const { fetchSales } = useSales();
  const { fetchInventory } = useInventory();
  const { getPredictiveMetrics } = useMLPredictions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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

  // Format date range for display
  const dateRangeText = useMemo(() => {
    if (!startDate && !endDate) return 'All time';
    if (startDate && !endDate) return `Since ${new Date(startDate).toLocaleDateString()}`;
    if (!startDate && endDate) return `Until ${new Date(endDate).toLocaleDateString()}`;
    return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
  }, [startDate, endDate]);

  useEffect(() => {
    const generateFinancialReport = async () => {
      setLoading(true);
      try {
        // Fetch sales data for the given period
        const salesData = await fetchSales({ 
          startDate, 
          endDate 
        });
        
        // Fetch purchase data (expenses)
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
        
        // Process purchase data as expenses
        // This is a simplified calculation - in a real scenario you'd get this from purchase_details
        // We'll generate from our ingredients value for now
        
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
        
        // Add mock operating expenses based on revenue
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

        // Fetch ML predictive metrics
        const predictions = await getPredictiveMetrics({ 
          startDate: startDate ? new Date(startDate) : undefined, 
          endDate: endDate ? new Date(endDate) : undefined,
          forecastDays: 14
        });
        
        setPredictiveMetrics(predictions);
        
      } catch (err) {
        console.error('Error generating financial report:', err);
        setError('Failed to generate financial report. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    generateFinancialReport();
  }, [fetchSales, fetchInventory, getPredictiveMetrics, startDate, endDate]);

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
    } catch (err) {
      console.error('Error refreshing predictions:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Generating financial report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        Financial Report {dateRangeText ? `(${dateRangeText})` : ''}
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard 
          title="Total Revenue"
          value={financialData.revenue.total}
          prefix="₱"
          change={12.5}
          changeType="positive"
          icon="revenue"
        />
        <SummaryCard 
          title="Total Expenses"
          value={financialData.expenses.total}
          prefix="₱"
          change={8.3}
          changeType="negative" // Higher expenses is negative
          icon="expense"
        />
        <SummaryCard 
          title="Net Profit"
          value={financialData.profit}
          prefix="₱"
          suffix={` (${financialData.profitMargin.toFixed(1)}%)`}
          change={15.8}
          changeType={financialData.profit > 0 ? "positive" : "negative"}
          icon="chart"
        />
      </div>

      {/* ML Component - Predictive Analytics */}
      <Card title="Financial Predictions & Analysis">
        <PredictiveMetricsPanel 
          metrics={predictiveMetrics}
          dateRange={dateRangeText}
          onRefresh={handleRefreshPredictions}
        />
      </Card>

      {/* Revenue Breakdown */}
      <Card title="Revenue Breakdown">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-base font-medium mb-4 text-gray-800 dark:text-gray-200">Revenue by Category</h3>
            <div className="space-y-3">
              {Object.entries(financialData.revenue.byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{category}</span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">₱{amount.toFixed(2)}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({((amount / financialData.revenue.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-base font-medium mb-4 text-gray-800 dark:text-gray-200">Expenses by Category</h3>
            <div className="space-y-3">
              {Object.entries(financialData.expenses.byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">₱{amount.toFixed(2)}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({((amount / financialData.expenses.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Revenue Trend */}
      <Card title="Revenue Trend">
        <div className="h-80">
          {/* Here you would include a line chart for revenue trends */}
          {/* This would use the financialData.revenue.dailyTotals array */}
          <p className="text-center text-sm text-gray-500 mt-4">
            Revenue trend visualization will appear here
          </p>
        </div>
      </Card>
    </div>
  );
};

// Summary Card component for displaying financial metrics
const SummaryCard = ({ title, value, prefix = '', suffix = '', change = 0, changeType = 'neutral', icon = 'chart' }) => {
  // Card implementation
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      {/* Card content */}
    </div>
  );
};

export default FinancialReport;