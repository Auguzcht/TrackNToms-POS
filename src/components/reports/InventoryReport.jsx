import { useState, useEffect, useMemo } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { useInventory } from '../../hooks/useInventory';
import { motion } from 'framer-motion';

const InventoryReport = ({ 
  startDate = null,
  endDate = null, 
  onExport = () => {} 
}) => {
  const { ingredients, items, loading: inventoryLoading, fetchInventory } = useInventory();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
    movementData: {
      purchases: [],
      pullouts: [],
      usage: []
    }
  });

  // Format date range for display
  const dateRangeText = useMemo(() => {
    if (!startDate && !endDate) return "Current Inventory";
    if (startDate && !endDate) {
      return `From ${new Date(startDate).toLocaleDateString()}`;
    }
    if (!startDate && endDate) {
      return `Until ${new Date(endDate).toLocaleDateString()}`;
    }
    return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
  }, [startDate, endDate]);

  useEffect(() => {
    const generateInventoryReport = async () => {
      setLoading(true);
      try {
        // Fetch fresh inventory data
        await fetchInventory();
        
        // Fetch inventory movement data - in a real app, this would come from your API
        const movementData = await mockFetchInventoryMovement(startDate, endDate);
        
        // Process ingredients
        const processedIngredients = ingredients.map(ingredient => {
          // Calculate value - handle case where unit_cost is undefined
          const value = ingredient.quantity * (ingredient.unit_cost || 0);
          
          // Calculate stock status
          let stockStatus = 'normal';
          if (ingredient.quantity <= 0) {
            stockStatus = 'out';
          } else if (ingredient.quantity <= ingredient.minimum_quantity) {
            stockStatus = 'low';
          }

          // Get movement for this ingredient
          const purchases = movementData.purchases
            .filter(p => p.ingredient_id === ingredient.ingredient_id)
            .reduce((sum, p) => sum + p.quantity, 0);
            
          const pullouts = movementData.pullouts
            .filter(p => p.ingredient_id === ingredient.ingredient_id)
            .reduce((sum, p) => sum + p.quantity, 0);
          
          // Simulate usage based on sales - in a real app, this would be calculated based on recipes and sales data
          const usage = movementData.usage
            .filter(u => u.ingredient_id === ingredient.ingredient_id)
            .reduce((sum, u) => sum + u.quantity, 0);
          
          return {
            ...ingredient,
            value,
            stockStatus,
            movement: {
              purchases,
              pullouts,
              usage
            }
          };
        });

        // Calculate total inventory value
        const totalValue = processedIngredients.reduce((sum, ing) => sum + ing.value, 0);
        const lowStockCount = processedIngredients.filter(ing => ing.stockStatus === 'low').length;
        const outOfStockCount = processedIngredients.filter(ing => ing.stockStatus === 'out').length;
        
        setReportData({
          ingredients: processedIngredients,
          items,
          summary: {
            totalIngredients: ingredients.length,
            totalItems: items.length,
            lowStockItems: lowStockCount,
            outOfStockItems: outOfStockCount,
            inventoryValue: totalValue
          },
          movementData
        });
        
      } catch (err) {
        console.error('Error generating inventory report:', err);
        setError('Failed to generate inventory report. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    generateInventoryReport();
  }, [fetchInventory, ingredients, items, startDate, endDate]);

  // Mock function to simulate fetching inventory movement data
  const mockFetchInventoryMovement = async (startDate, endDate) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock purchases data
    const purchases = [
      { id: 1, ingredient_id: 1, date: '2024-05-01', quantity: 25, unit_cost: 450 },
      { id: 2, ingredient_id: 3, date: '2024-05-01', quantity: 10, unit_cost: 125 },
      { id: 3, ingredient_id: 2, date: '2024-05-10', quantity: 50, unit_cost: 85 },
      { id: 4, ingredient_id: 4, date: '2024-05-10', quantity: 25, unit_cost: 180 },
      { id: 5, ingredient_id: 1, date: '2024-05-20', quantity: 20, unit_cost: 450 },
      { id: 6, ingredient_id: 2, date: '2024-05-20', quantity: 45, unit_cost: 85 },
      { id: 7, ingredient_id: 3, date: '2024-05-20', quantity: 20, unit_cost: 125 },
    ];
    
    // Mock pullouts data
    const pullouts = [
      { id: 1, ingredient_id: 1, date: '2024-05-05', quantity: 3, reason: 'Expired' },
      { id: 2, ingredient_id: 3, date: '2024-05-12', quantity: 2, reason: 'Damaged packaging' },
      { id: 3, ingredient_id: 2, date: '2024-05-18', quantity: 5, reason: 'Quality control' },
    ];
    
    // Mock usage data (based on sales/production)
    const usage = [
      { ingredient_id: 1, date: '2024-05-02', quantity: 5 },
      { ingredient_id: 3, date: '2024-05-03', quantity: 3 },
      { ingredient_id: 2, date: '2024-05-04', quantity: 8 },
      { ingredient_id: 4, date: '2024-05-05', quantity: 4 },
      { ingredient_id: 1, date: '2024-05-06', quantity: 7 },
      { ingredient_id: 2, date: '2024-05-07', quantity: 6 },
      { ingredient_id: 3, date: '2024-05-08', quantity: 3 },
      { ingredient_id: 4, date: '2024-05-09', quantity: 5 },
      { ingredient_id: 1, date: '2024-05-12', quantity: 4 },
      { ingredient_id: 2, date: '2024-05-13', quantity: 9 },
      { ingredient_id: 3, date: '2024-05-14', quantity: 2 },
      { ingredient_id: 4, date: '2024-05-15', quantity: 6 },
    ];
    
    // Filter by date range if provided
    const filterByDateRange = (items) => {
      return items.filter(item => {
        if (!startDate && !endDate) return true;
        
        const itemDate = new Date(item.date);
        
        if (startDate && !endDate) {
          return itemDate >= new Date(startDate);
        }
        
        if (!startDate && endDate) {
          return itemDate <= new Date(endDate);
        }
        
        return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
      });
    };
    
    return {
      purchases: filterByDateRange(purchases),
      pullouts: filterByDateRange(pullouts),
      usage: filterByDateRange(usage)
    };
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
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-900">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
        <motion.div 
          className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-[#571C1F]/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
          whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(87, 28, 31, 0.1)" }}
        >
          <motion.div 
            className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#003B25] to-[#571C1F]"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Inventory Value</p>
              <h3 className="text-xl font-bold text-[#571C1F] dark:text-[#571C1F] mt-1">
                ₱{reportData.summary.inventoryValue.toFixed(2)}
              </h3>
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          className="relative overflow-hidden bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow-sm p-4 border border-yellow-200 dark:border-yellow-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
          whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(234, 179, 8, 0.2)" }}
        >
          <motion.div 
            className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-yellow-500 to-[#571C1F]"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-yellow-200">Low Stock Items</p>
              <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-300 mt-1">
                {reportData.summary.lowStockItems} of {reportData.summary.totalIngredients}
              </h3>
              <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                {((reportData.summary.lowStockItems / reportData.summary.totalIngredients) * 100).toFixed(1)}%
              </p>
            </div>
            <motion.div 
              className="p-3 bg-yellow-100 dark:bg-yellow-800/40 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260, 
                damping: 20,
                delay: 0.4
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </motion.div>
          </div>
        </motion.div>
        
        <motion.div 
          className="relative overflow-hidden bg-red-50 dark:bg-red-900/20 rounded-lg shadow-sm p-4 border border-red-200 dark:border-red-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.3 }}
          whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.2)" }}
        >
          <motion.div 
            className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-red-500 to-[#571C1F]"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-red-200">Out of Stock Items</p>
              <h3 className="text-xl font-bold text-red-800 dark:text-red-300 mt-1">
                {reportData.summary.outOfStockItems} of {reportData.summary.totalIngredients}
              </h3>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {((reportData.summary.outOfStockItems / reportData.summary.totalIngredients) * 100).toFixed(1)}%
              </p>
            </div>
            <motion.div 
              className="p-3 bg-red-100 dark:bg-red-800/40 rounded-full"
              initial={{ scale: 0 }}
              animate={{ 
                scale: 1,
                rotate: [0, -10, 0, 10, 0]
              }}
              transition={{ 
                scale: {
                  type: "spring",
                  stiffness: 260, 
                  damping: 20,
                  delay: 0.5
                },
                rotate: {
                  duration: 0.5,
                  delay: 1,
                  ease: "easeInOut"
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Low Stock Items */}
      <Card title="Low Stock & Out of Stock Ingredients">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Minimum Required
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {reportData.ingredients
                .filter(ing => ing.stockStatus === 'low' || ing.stockStatus === 'out')
                .sort((a, b) => {
                  // Sort by status (out of stock first, then low stock)
                  if (a.stockStatus !== b.stockStatus) {
                    return a.stockStatus === 'out' ? -1 : 1;
                  }
                  // Then sort by how far below minimum (worst cases first)
                  const aRatio = a.quantity / a.minimum_quantity;
                  const bRatio = b.quantity / b.minimum_quantity;
                  return aRatio - bRatio;
                })
                .map((ingredient) => (
                  <tr key={ingredient.ingredient_id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {ingredient.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {ingredient.quantity} {ingredient.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {ingredient.minimum_quantity} {ingredient.unit}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ingredient.stockStatus === 'out' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {ingredient.stockStatus === 'out' ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white font-medium">
                      ₱{(ingredient.value || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              {reportData.ingredients.filter(ing => ing.stockStatus === 'low' || ing.stockStatus === 'out').length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                    All ingredients are at adequate stock levels.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inventory Value Distribution */}
      <Card title="Inventory Value Distribution">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-base font-medium mb-4 text-gray-800 dark:text-gray-200">Top Ingredients by Value</h3>
            <div className="space-y-4">
              {reportData.ingredients
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)
                .map((ingredient, index) => (
                  <div key={ingredient.ingredient_id} className="flex items-center">
                    <div className="flex-shrink-0 w-8 text-sm text-gray-500 dark:text-gray-400">
                      #{index + 1}
                    </div>
                    <div className="flex-grow">
                      <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(ingredient.value / reportData.summary.inventoryValue * 100).toFixed(2)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {ingredient.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ₱{ingredient.value.toFixed(2)} ({(ingredient.value / reportData.summary.inventoryValue * 100).toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-base font-medium mb-4 text-gray-800 dark:text-gray-200">Inventory Status Overview</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Normal Stock</span>
              </div>
              <div className="text-sm text-gray-900 dark:text-white font-medium">
                {reportData.ingredients.filter(i => i.stockStatus === 'normal').length} items 
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  ({((reportData.ingredients.filter(i => i.stockStatus === 'normal').length / reportData.ingredients.length) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Low Stock</span>
              </div>
              <div className="text-sm text-gray-900 dark:text-white font-medium">
                {reportData.ingredients.filter(i => i.stockStatus === 'low').length} items
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  ({((reportData.ingredients.filter(i => i.stockStatus === 'low').length / reportData.ingredients.length) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Out of Stock</span>
              </div>
              <div className="text-sm text-gray-900 dark:text-white font-medium">
                {reportData.ingredients.filter(i => i.stockStatus === 'out').length} items
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  ({((reportData.ingredients.filter(i => i.stockStatus === 'out').length / reportData.ingredients.length) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inventory Movement Summary</h4>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs text-green-700 dark:text-green-400 mb-1">Purchased</p>
                  <p className="text-lg font-semibold text-green-800 dark:text-green-300">
                    {reportData.movementData.purchases.reduce((sum, item) => sum + item.quantity, 0)} units
                  </p>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-400 mb-1">Used</p>
                  <p className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                    {reportData.movementData.usage.reduce((sum, item) => sum + item.quantity, 0)} units
                  </p>
                </div>
                
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-xs text-red-700 dark:text-red-400 mb-1">Pulled Out</p>
                  <p className="text-lg font-semibold text-red-800 dark:text-red-300">
                    {reportData.movementData.pullouts.reduce((sum, item) => sum + item.quantity, 0)} units
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Full Inventory List */}
      <Card title="Complete Inventory List">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Min. Required
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {reportData.ingredients.map((ingredient) => (
                <tr key={ingredient.ingredient_id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {ingredient.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {ingredient.quantity} {ingredient.unit}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {ingredient.minimum_quantity} {ingredient.unit}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">
                    ₱{(ingredient.unit_cost || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white font-medium">
                    ₱{(ingredient.value || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {ingredient.stockStatus === 'normal' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Normal
                      </span>
                    )}
                    {ingredient.stockStatus === 'low' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                        Low
                      </span>
                    )}
                    {ingredient.stockStatus === 'out' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                        Out
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
};

// Complete the SummaryCard component
const SummaryCard = ({ title, value, subtext, color = 'default', icon }) => {
  const getBackgroundColor = () => {
    switch (color) {
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'danger':
        return 'bg-red-50 dark:bg-red-900/20';
      default:
        return 'bg-white dark:bg-dark-lighter';
    }
  };

  return (
    <div className={`p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${getBackgroundColor()}`}>
      <div className="flex">
        {icon && (
          <div className="flex-shrink-0 mr-4">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{value}</p>
          {subtext && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtext}</p>}
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;