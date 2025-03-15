import { createContext, useState, useCallback, useContext } from 'react';
import { toast } from 'react-hot-toast';
import api, { endpoints } from './api';

// Create context for inventory management
const InventoryContext = createContext(null);

// Inventory provider component
export const InventoryProvider = ({ children }) => {
  const [ingredients, setIngredients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all ingredients
  const fetchIngredients = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await endpoints.inventory.getIngredients(params);
      setIngredients(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setError(err.response?.data?.message || 'Failed to fetch ingredients');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch a single ingredient by ID
  const fetchIngredientById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await endpoints.inventory.getIngredientById(id);
      return response.data;
    } catch (err) {
      console.error(`Error fetching ingredient ${id}:`, err);
      setError(err.response?.data?.message || 'Failed to fetch ingredient details');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new ingredient
  const createIngredient = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await endpoints.inventory.createIngredient(data);
      setIngredients(prev => [...prev, response.data]);
      toast.success(`${response.data.name} has been added to inventory`);
      return response.data;
    } catch (err) {
      console.error('Error creating ingredient:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create ingredient';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing ingredient
  const updateIngredient = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await endpoints.inventory.updateIngredient(id, data);
      setIngredients(prev => 
        prev.map(item => item.id === id ? response.data : item)
      );
      toast.success(`${response.data.name} has been updated`);
      return response.data;
    } catch (err) {
      console.error(`Error updating ingredient ${id}:`, err);
      const errorMsg = err.response?.data?.message || 'Failed to update ingredient';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete an ingredient
  const deleteIngredient = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await endpoints.inventory.deleteIngredient(id);
      setIngredients(prev => prev.filter(item => item.id !== id));
      toast.success('Ingredient has been removed');
      return true;
    } catch (err) {
      console.error(`Error deleting ingredient ${id}:`, err);
      const errorMsg = err.response?.data?.message || 'Failed to delete ingredient';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Adjust ingredient stock level
  const adjustStock = useCallback(async (id, quantity, reason) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await endpoints.inventory.adjustStock(id, quantity, reason);
      
      // Update the ingredient in our state
      setIngredients(prev => 
        prev.map(item => item.id === id ? {
          ...item,
          currentStock: response.data.currentStock
        } : item)
      );
      
      toast.success(`Stock has been ${quantity >= 0 ? 'increased' : 'decreased'} by ${Math.abs(quantity)} units`);
      return response.data;
    } catch (err) {
      console.error(`Error adjusting stock for ingredient ${id}:`, err);
      const errorMsg = err.response?.data?.message || 'Failed to adjust stock level';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stock adjustment history
  const fetchStockHistory = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await endpoints.inventory.getStockHistory(params);
      setStockHistory(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching stock history:', err);
      setError(err.response?.data?.message || 'Failed to fetch stock history');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch low stock items
  const fetchLowStockItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await endpoints.inventory.getLowStockItems();
      setLowStockItems(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching low stock items:', err);
      setError(err.response?.data?.message || 'Failed to fetch low stock items');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate days of inventory remaining based on usage rate
  const calculateInventoryDays = useCallback((ingredient) => {
    if (!ingredient || ingredient.usageRatePerDay === 0) {
      return Infinity; // No usage, inventory lasts "forever"
    }
    
    return Math.floor(ingredient.currentStock / ingredient.usageRatePerDay);
  }, []);

  // Generate a purchase order for low stock items
  const generatePurchaseOrder = useCallback(async () => {
    try {
      // This would typically call a backend API endpoint
      // For now, we'll simulate it by creating an order from low stock items
      const itemsToOrder = lowStockItems.map(item => ({
        ingredientId: item.id,
        name: item.name,
        quantity: Math.max(item.reorderLevel - item.currentStock, 0),
        unit: item.unit,
        estimatedCost: (item.lastPurchasePrice || 0) * Math.max(item.reorderLevel - item.currentStock, 0)
      }));
      
      return {
        items: itemsToOrder,
        totalEstimatedCost: itemsToOrder.reduce((sum, item) => sum + item.estimatedCost, 0),
        generatedDate: new Date().toISOString(),
        status: 'draft'
      };
    } catch (err) {
      console.error('Error generating purchase order:', err);
      toast.error('Failed to generate purchase order');
      throw err;
    }
  }, [lowStockItems]);

  // Check for stock alerts
  const checkStockAlerts = useCallback(() => {
    const alerts = ingredients.filter(ingredient => 
      ingredient.currentStock <= ingredient.alertThreshold
    ).map(ingredient => ({
      id: ingredient.id,
      name: ingredient.name,
      currentStock: ingredient.currentStock,
      unit: ingredient.unit,
      threshold: ingredient.alertThreshold,
      daysRemaining: calculateInventoryDays(ingredient)
    }));
    
    return alerts;
  }, [ingredients, calculateInventoryDays]);

  // Export inventory data (typically CSV)
  const exportInventory = useCallback(async (format = 'csv') => {
    setLoading(true);
    
    try {
      const response = await endpoints.reports.exportInventory({ format });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory-export-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Inventory export completed');
      return true;
    } catch (err) {
      console.error('Error exporting inventory:', err);
      toast.error('Failed to export inventory data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate inventory value report
  const generateInventoryValueReport = useCallback(() => {
    try {
      const report = {
        totalItems: ingredients.length,
        totalValue: ingredients.reduce((sum, item) => 
          sum + (item.currentStock * (item.lastPurchasePrice || 0)), 0),
        byCategory: {},
        lowValueItems: [],
        highValueItems: []
      };
      
      // Group by category
      ingredients.forEach(item => {
        const category = item.category || 'Uncategorized';
        if (!report.byCategory[category]) {
          report.byCategory[category] = {
            count: 0,
            value: 0
          };
        }
        
        report.byCategory[category].count += 1;
        report.byCategory[category].value += item.currentStock * (item.lastPurchasePrice || 0);
      });
      
      // Sort items by value
      const sortedItems = [...ingredients].sort((a, b) => {
        const valueA = a.currentStock * (a.lastPurchasePrice || 0);
        const valueB = b.currentStock * (b.lastPurchasePrice || 0);
        return valueB - valueA;
      });
      
      // Get top and bottom 5 items by value
      report.highValueItems = sortedItems.slice(0, 5).map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.currentStock,
        unit: item.unit,
        price: item.lastPurchasePrice || 0,
        value: item.currentStock * (item.lastPurchasePrice || 0)
      }));
      
      report.lowValueItems = sortedItems.slice(-5).map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.currentStock,
        unit: item.unit,
        price: item.lastPurchasePrice || 0,
        value: item.currentStock * (item.lastPurchasePrice || 0)
      }));
      
      return report;
    } catch (err) {
      console.error('Error generating inventory value report:', err);
      toast.error('Failed to generate inventory value report');
      throw err;
    }
  }, [ingredients]);

  // Context value
  const value = {
    ingredients,
    categories,
    stockHistory,
    lowStockItems,
    loading,
    error,
    fetchIngredients,
    fetchIngredientById,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    adjustStock,
    fetchStockHistory,
    fetchLowStockItems,
    calculateInventoryDays,
    generatePurchaseOrder,
    checkStockAlerts,
    exportInventory,
    generateInventoryValueReport
  };

  // Return the provider with context value
  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

// Custom hook to use inventory context
export const useInventory = () => {
  const context = useContext(InventoryContext);
  
  if (context === null) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  
  return context;
};

export default { InventoryProvider, useInventory };