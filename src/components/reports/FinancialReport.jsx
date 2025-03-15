import { useState, useEffect, useMemo } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { useSales } from '../../hooks/useSales';
import { useInventory } from '../../hooks/useInventory';
import { motion } from 'framer-motion';

const FinancialReport = ({ 
  startDate = null,
  endDate = null,
  onExport = () => {}
}) => {
  const { fetchSales } = useSales();
  const { fetchInventory } = useInventory();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
    const generateFinancialReport = async () => {
      setLoading(true);
      try {
        // Fetch sales data
        const salesData = await fetchSales({ startDate, endDate });
        
        // Fetch purchases (expenses) data - this would come from a proper API in a real app
        const purchasesData = await mockFetchPurchases(startDate, endDate);
        
        // Calculate revenue by category
        const revenueByCategory = {};
        let totalRevenue = 0;
        
        // Process sales data
        salesData.forEach(sale => {
          sale.items.forEach(item => {
            const category = item.category || 'Uncategorized';
            if (!revenueByCategory[category]) {
              revenueByCategory[category] = 0;
            }
            const itemTotal = item.quantity * item.price;
            revenueByCategory[category] += itemTotal;
            totalRevenue += itemTotal;
          });
        });
        
        // Group sales by day for chart
        const dailyTotals = groupSalesByDay(salesData);
        
        // Calculate expenses
        let totalExpenses = 0;
        const expensesByCategory = {
          inventory: 0,
          operating: 0,
          other: 0
        };
        
        // Process purchases/expenses data
        purchasesData.forEach(purchase => {
          expensesByCategory.inventory += purchase.total_amount;
          totalExpenses += purchase.total_amount;
        });
        
        // Add mock operating expenses
        expensesByCategory.operating = totalRevenue * 0.35; // Simulate operating expenses as 35% of revenue
        totalExpenses += expensesByCategory.operating;
        
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
            byCategory: expensesByCategory
          },
          profit,
          profitMargin
        });
        
      } catch (err) {
        console.error('Error generating financial report:', err);
        setError('Failed to generate financial report. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    generateFinancialReport();
  }, [fetchSales, fetchInventory, startDate, endDate]);

  // Mock function to simulate fetching purchase data (expenses)
  const mockFetchPurchases = async (startDate, endDate) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock purchase data
    return [
      {
        purchase_id: 1,
        purchase_date: '2024-05-01',
        total_amount: 12500.00,
        details: [
          { ingredient_id: 1, quantity: 25, unit_price: 450.00, subtotal: 11250.00 },
          { ingredient_id: 3, quantity: 10, unit_price: 125.00, subtotal: 1250.00 },
        ]
      },
      {
        purchase_id: 2,
        purchase_date: '2024-05-10',
        total_amount: 8750.00,
        details: [
          { ingredient_id: 2, quantity: 50, unit_price: 85.00, subtotal: 4250.00 },
          { ingredient_id: 4, quantity: 25, unit_price: 180.00, subtotal: 4500.00 },
        ]
      },
      {
        purchase_id: 3,
        purchase_date: '2024-05-20',
        total_amount: 15300.00,
        details: [
          { ingredient_id: 1, quantity: 20, unit_price: 450.00, subtotal: 9000.00 },
          { ingredient_id: 2, quantity: 45, unit_price: 85.00, subtotal: 3825.00 },
          { ingredient_id: 3, quantity: 20, unit_price: 125.00, subtotal: 2475.00 },
        ]
      }
    ].filter(purchase => {
      if (!startDate && !endDate) return true;
      
      const purchaseDate = new Date(purchase.purchase_date);
      
      if (startDate && !endDate) {
        return purchaseDate >= new Date(startDate);
      }
      
      if (!startDate && endDate) {
        return purchaseDate <= new Date(endDate);
      }
      
      return purchaseDate >= new Date(startDate) && purchaseDate <= new Date(endDate);
    });
  };

  // Helper function to group sales by day
  const groupSalesByDay = (sales) => {
    const dailyTotals = {};
    
    sales.forEach(sale => {
      // Get date without time
      const saleDate = new Date(sale.date).toISOString().split('T')[0];
      
      if (!dailyTotals[saleDate]) {
        dailyTotals[saleDate] = 0;
      }
      
      dailyTotals[saleDate] += sale.total;
    });
    
    // Convert to array for chart data
    return Object.entries(dailyTotals).map(([date, total]) => ({
      date,
      total
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
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
      className="space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard 
          title="Total Revenue"
          value={financialData.revenue.total}
          prefix="₱"
          change={10.5} // This would come from comparison with previous period
          changeType="positive"
          icon="cash"
        />
        <SummaryCard 
          title="Total Expenses"
          value={financialData.expenses.total}
          prefix="₱"
          change={5.2}
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

      {/* Revenue Breakdown */}
      <Card title="Revenue Breakdown">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-base font-medium mb-4 text-gray-800 dark:text-gray-200">Revenue by Category</h3>
            <div className="space-y-4">
              {Object.entries(financialData.revenue.byCategory).map(([category, amount]) => (
                <div key={category} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">₱{amount.toFixed(2)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      ({((amount / financialData.revenue.total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium mb-4 text-gray-800 dark:text-gray-200">Daily Revenue Trend</h3>
            {financialData.revenue.dailyTotals.length > 0 ? (
              <div className="h-full flex items-center justify-center">
                {/* This would be replaced with an actual chart component */}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  [Revenue chart would be displayed here - integration with recharts or chart.js]
                  <br />
                  Data available for {financialData.revenue.dailyTotals.length} days
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                No data available for the selected time period
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Profit and Loss Statement */}
      <Card title="Profit and Loss Statement">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  Total Revenue
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                  ₱{financialData.revenue.total.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">
                  100%
                </td>
              </tr>
              
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white pl-8">
                  Inventory Expenses
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                  ₱{financialData.expenses.byCategory.inventory.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">
                  {financialData.revenue.total > 0 ? ((financialData.expenses.byCategory.inventory / financialData.revenue.total) * 100).toFixed(1) : '0'}%
                </td>
              </tr>
              
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white pl-8">
                  Operating Expenses
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                  ₱{financialData.expenses.byCategory.operating.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">
                  {financialData.revenue.total > 0 ? ((financialData.expenses.byCategory.operating / financialData.revenue.total) * 100).toFixed(1) : '0'}%
                </td>
              </tr>
              
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white pl-8">
                  Other Expenses
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                  ₱{financialData.expenses.byCategory.other.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">
                  {financialData.revenue.total > 0 ? ((financialData.expenses.byCategory.other / financialData.revenue.total) * 100).toFixed(1) : '0'}%
                </td>
              </tr>
              
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  Total Expenses
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                  ₱{financialData.expenses.total.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">
                  {financialData.revenue.total > 0 ? ((financialData.expenses.total / financialData.revenue.total) * 100).toFixed(1) : '0'}%
                </td>
              </tr>
              
              <tr className="bg-green-50 dark:bg-green-900/20 font-medium">
                <td className="px-4 py-3 text-sm text-green-800 dark:text-green-300">
                  Net Profit
                </td>
                <td className="px-4 py-3 text-sm text-right text-green-800 dark:text-green-300">
                  ₱{financialData.profit.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-green-700 dark:text-green-400">
                  {financialData.profitMargin.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
};

// Summary Card component for displaying financial metrics
const SummaryCard = ({ title, value, prefix = '', suffix = '', change = 0, changeType = 'neutral', icon = 'chart' }) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getChangeIcon = () => {
    if (change === 0) return null;
    
    if (changeType === 'positive') {
      return (
        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
        </svg>
      );
    }
    
    return (
      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
      </svg>
    );
  };
  
  const getIcon = () => {
    switch (icon) {
      case 'cash':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'expense':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'chart':
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        );
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {prefix}{value.toFixed(2)}{suffix}
          </p>
          <div className={`mt-1 flex items-center text-sm ${getChangeColor()}`}>
            {getChangeIcon()}
            <span>{change}% from previous period</span>
          </div>
        </div>
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full h-fit">
          {getIcon()}
        </div>
      </div>
    </Card>
  );
};

export default FinancialReport;