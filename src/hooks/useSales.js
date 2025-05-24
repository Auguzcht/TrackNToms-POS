import { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { toast } from 'react-hot-toast';
import supabase from '../services/supabase';
import { useAuth } from './useAuth';
import { useInventory } from './useInventory';

// Create a context for sales data
const SalesContext = createContext(null);

/**
 * Provider component for sales management
 * @param {Object} props - Component props
 * @returns {JSX.Element} Provider component
 */
export const SalesProvider = ({ children }) => {
  const { user } = useAuth();
  const { deductIngredientsForSale, checkIngredientAvailability } = useInventory();
  
  const [sales, setSales] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [currentSale, setCurrentSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [salesStats, setSalesStats] = useState({
    total: 0,
    count: 0,
    average: 0,
    byCategory: {},
    byPaymentMethod: {}
  });

  // Set up real-time subscriptions for sales
  useEffect(() => {
    // Subscription for sales header changes
    const salesSubscription = supabase
      .channel('sales-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sales_header' 
        }, 
        (payload) => {
          console.log('Sales change received:', payload);
          
          // Handle different events
          switch (payload.eventType) {
            case 'INSERT':
              setSales(prev => [payload.new, ...prev]);
              break;
            case 'UPDATE':
              setSales(prev => prev.map(sale => 
                sale.sale_id === payload.new.sale_id ? { ...sale, ...payload.new } : sale
              ));
              break;
            case 'DELETE':
              setSales(prev => prev.filter(sale => sale.sale_id !== payload.old.sale_id));
              break;
            default:
              break;
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions when component unmounts
    return () => {
      supabase.removeChannel(salesSubscription);
    };
  }, []);

  /**
   * Format currency for display
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (default: PHP)
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (amount, currency = 'PHP') => {
    if (amount === null || amount === undefined) return '₱0.00';
    
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol'
    }).format(amount);
  };

  /**
   * Fetch sales data with optional filters
   * @param {Object} options - Query options
   * @returns {Array} Sales data
   */
  const fetchSales = useCallback(async (options = {}) => {
    const { startDate, endDate, limit = 100, cashierId, paymentMethod } = options;
    
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('sales_with_details')  // View that joins sales_header with staff info
        .select('*')
        .order('sale_date', { ascending: false });
      
      // Apply filters if provided
      if (startDate) {
        query = query.gte('sale_date', startDate);
      }
      
      if (endDate) {
        query = query.lte('sale_date', endDate);
      }
      
      if (cashierId) {
        query = query.eq('cashier_id', cashierId);
      }
      
      if (paymentMethod) {
        query = query.eq('payment_method', paymentMethod);
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error: salesError } = await query;
      
      if (salesError) throw salesError;
      
      // For each sale, fetch the sale details (items)
      const salesWithItems = await Promise.all(
        data.map(async (sale) => {
          const { data: items, error: itemsError } = await supabase
            .from('sales_detail')
            .select(`
              *,
              items:item_id (
                item_id,
                item_name,
                category,
                base_price
              )
            `)
            .eq('sale_id', sale.sale_id);
          
          if (itemsError) {
            console.error('Error fetching sale items:', itemsError);
            return {
              ...sale,
              items: []
            };
          }
          
          // Format items with item details
          const formattedItems = items.map(item => ({
            id: item.sale_detail_id,
            item_id: item.item_id,
            name: item.items?.item_name || 'Unknown Item',
            category: item.items?.category || 'Uncategorized',
            price: parseFloat(item.unit_price),
            quantity: item.quantity,
            subtotal: parseFloat(item.subtotal)
          }));
          
          return {
            ...sale,
            items: formattedItems,
            cashier_name: sale.cashier_first_name && sale.cashier_last_name 
              ? `${sale.cashier_first_name} ${sale.cashier_last_name}` 
              : 'Unknown'
          };
        })
      );
      
      setSales(salesWithItems);
      calculateSalesStats(salesWithItems);
      
      return salesWithItems;
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Failed to fetch sales');
      toast.error('Could not load sales data');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch analytics data for sales dashboard
   * @param {Object} options - Query options
   * @returns {Object} Analytics data
   */
  const fetchSalesAnalytics = useCallback(async (options = {}) => {
    const { startDate, endDate, interval = 'day' } = options;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call a Supabase RPC function to get aggregated sales data
      const { data, error: analyticsError } = await supabase
        .rpc('get_sales_analytics', { 
          p_start_date: startDate, 
          p_end_date: endDate,
          p_interval: interval
        });
      
      if (analyticsError) throw analyticsError;
      
      return data || [];
    } catch (err) {
      console.error('Error fetching sales analytics:', err);
      setError('Failed to fetch sales analytics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch top-selling products
   * @param {Object} options - Query options
   * @returns {Array} Top products
   */
  const fetchTopProducts = useCallback(async (options = {}) => {
    const { startDate, endDate, limit = 10 } = options;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call a Supabase RPC function to get top products
      const { data, error: topProductsError } = await supabase
        .rpc('get_top_products', { 
          p_start_date: startDate, 
          p_end_date: endDate,
          p_limit: limit
        });
      
      if (topProductsError) throw topProductsError;
      
      return data || [];
    } catch (err) {
      console.error('Error fetching top products:', err);
      setError('Failed to fetch top products');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get sales grouped by category
   * @param {Array} salesData - Sales data or null to use current state
   * @returns {Object} Sales by category
   */
  const getSalesByCategory = useCallback((salesData = null) => {
    const data = salesData || sales;
    const categories = {};
    
    data.forEach(sale => {
      sale.items.forEach(item => {
        const category = item.category || 'Uncategorized';
        if (!categories[category]) {
          categories[category] = 0;
        }
        categories[category] += item.subtotal;
      });
    });
    
    return categories;
  }, [sales]);

  /**
   * Get sales grouped by payment method
   * @param {Array} salesData - Sales data or null to use current state
   * @returns {Object} Sales by payment method
   */
  const getSalesByPaymentMethod = useCallback((salesData = null) => {
    const data = salesData || sales;
    const methods = {};
    
    data.forEach(sale => {
      const method = sale.payment_method || 'Unknown';
      if (!methods[method]) {
        methods[method] = 0;
      }
      methods[method] += parseFloat(sale.total_amount);
    });
    
    return methods;
  }, [sales]);

  /**
   * Calculate sales statistics
   * @param {Array} salesData - Sales data or null to use current state
   * @returns {Object} Calculated statistics
   */
  const calculateSalesStats = useCallback((salesData = null) => {
    const data = salesData || sales;
    
    // Skip calculation if no data
    if (!data || data.length === 0) {
      const emptyStats = {
        total: 0,
        count: 0,
        average: 0,
        byCategory: {},
        byPaymentMethod: {}
      };
      
      setSalesStats(emptyStats);
      return emptyStats;
    }
    
    // Calculate basic metrics
    const count = data.length;
    const total = data.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    const average = total / count;
    
    // Calculate sales by category
    const byCategory = getSalesByCategory(data);
    
    // Calculate sales by payment method
    const byPaymentMethod = getSalesByPaymentMethod(data);
    
    const stats = {
      total,
      count,
      average,
      byCategory,
      byPaymentMethod
    };
    
    setSalesStats(stats);
    return stats;
  }, [sales, getSalesByCategory, getSalesByPaymentMethod]);

  /**
   * Add a new sale with transaction safety
   * @param {Object} saleData - Sale data with items
   * @returns {Object} Created sale
   */
  const addSale = useCallback(async (saleData) => {
    setLoading(true);
    setError(null);
    
    try {
      // First, check if all items are available in inventory
      for (const item of saleData.items) {
        const { available, message } = await checkIngredientAvailability(item.item_id, item.quantity);
        
        if (!available) {
          throw new Error(message || `Item ${item.item_id} is not available in requested quantity`);
        }
      }

      // Extract items array from the sale data
      const { items, ...saleHeader } = saleData;
      
      // Add timestamps to sale header
      const headerWithTimestamps = {
        ...saleHeader,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert sale header
      const { data: newSale, error: saleError } = await supabase
        .from('sales_header')
        .insert([headerWithTimestamps])
        .select()
        .single();
      
      if (saleError) throw saleError;
      
      if (items && items.length > 0) {
        // Prepare items for insertion (add sale_id to each)
        const itemsWithSaleId = items.map(item => ({
          sale_id: newSale.sale_id,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price || 0,
          subtotal: item.subtotal || (item.quantity * item.unit_price),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        // Insert sale items
        const { error: itemsError } = await supabase
          .from('sales_detail')
          .insert(itemsWithSaleId);
        
        if (itemsError) {
          // Critical error - items couldn't be inserted, need to rollback
          console.error('Error adding sale items - attempting to rollback sale:', itemsError);
          
          // Try to delete the sale header as a rollback operation
          const { error: deleteError } = await supabase
            .from('sales_header')
            .delete()
            .eq('sale_id', newSale.sale_id);
            
          if (deleteError) {
            console.error('Error during rollback of sale header:', deleteError);
          }
          
          throw new Error(`Failed to add sale items: ${itemsError.message}`);
        }
      }
      
      // Now deduct from inventory - this should be done in a transaction or with triggers
      // Here we're handling it in the application
      try {
        await deductIngredientsForSale(items.map(item => ({
          item_id: item.item_id,
          quantity: item.quantity
        })));
      } catch (inventoryError) {
        console.error('Error updating inventory:', inventoryError);
        // Continue despite inventory update error - this will need reconciliation later
        toast.warning('Sale completed but inventory update may be incomplete');
      }
      
      // Return the new sale with its ID
      const result = {
        ...saleData,
        sale_id: newSale.sale_id,
        created_at: newSale.created_at
      };
      
      toast.success(`Sale #${newSale.sale_id} completed successfully!`);
      return result;
    } catch (err) {
      console.error('Error creating sale:', err);
      setError('Failed to create sale');
      toast.error(`Failed to complete sale: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [checkIngredientAvailability, deductIngredientsForSale]);

  /**
   * Void a sale (mark as voided, not delete)
   * @param {number|string} id - Sale ID
   * @param {string} reason - Void reason
   * @returns {Object} Updated sale
   */
  const voidSale = useCallback(async (id, reason = 'No reason provided') => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the current sale details for inventory restoration
      const { data: saleDetails, error: detailsError } = await supabase
        .from('sales_detail')
        .select(`
          item_id,
          quantity,
          items:item_id (
            item_name
          )
        `)
        .eq('sale_id', id);
      
      if (detailsError) throw detailsError;
      
      // Update the sale status to voided
      const { data: voidedSale, error: updateError } = await supabase
        .from('sales_header')
        .update({
          is_voided: true,
          void_reason: reason,
          void_datetime: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('sale_id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      // Create void record for audit purposes
      const { error: voidLogError } = await supabase
        .from('sales_voids')
        .insert({
          sale_id: id,
          staff_id: user?.staff_id,
          void_reason: reason,
          void_datetime: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (voidLogError) {
        console.error('Error logging void record:', voidLogError);
        // Continue despite logging error
      }
      
      // Try to restore inventory - this would ideally be done in a transaction
      try {
        // For each item in the sale, add back to inventory
        for (const item of saleDetails) {
          // Get current ingredient usage for this item
          const { data: ingredientsUsed, error: ingredientsError } = await supabase
            .from('item_ingredients')
            .select(`
              ingredient_id,
              quantity,
              ingredients:ingredient_id (
                quantity
              )
            `)
            .eq('item_id', item.item_id);
            
          if (ingredientsError) {
            console.error('Error fetching ingredients for item:', ingredientsError);
            continue;
          }
          
          // Restore each ingredient
          for (const ingredient of ingredientsUsed) {
            const totalRestoreAmount = ingredient.quantity * item.quantity;
            const currentAmount = ingredient.ingredients.quantity || 0;
            
            const { error: restoreError } = await supabase
              .from('ingredients')
              .update({
                quantity: currentAmount + totalRestoreAmount,
                updated_at: new Date().toISOString()
              })
              .eq('ingredient_id', ingredient.ingredient_id);
              
            if (restoreError) {
              console.error('Error restoring ingredient quantity:', restoreError);
            }
          }
        }
      } catch (inventoryError) {
        console.error('Error restoring inventory:', inventoryError);
        toast.warning('Sale was voided but inventory restoration may be incomplete');
      }
      
      // Update state
      setSales(prev => prev.map(sale => 
        sale.sale_id === id ? { ...sale, is_voided: true, void_reason: reason } : sale
      ));
      
      toast.success(`Sale #${id} has been voided`);
      
      return voidedSale;
    } catch (err) {
      console.error(`Error voiding sale with ID ${id}:`, err);
      setError(`Failed to void sale with ID ${id}`);
      toast.error(`Failed to void sale: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.staff_id]);

  /**
   * Export sales report data
   * @param {Object} options - Export options
   * @returns {Blob} Export data
   */
  const exportSalesReport = useCallback(async (options = {}) => {
    // Fetch sales data using the current filters if not already loaded
    const reportData = options.data || await fetchSales(options);
    
    // Generate CSV or PDF based on the format option
    const format = options.format || 'csv';
    
    if (format === 'csv') {
      // Generate CSV headers
      const headers = [
        'Sale ID',
        'Date',
        'Time',
        'Cashier',
        'Payment Method',
        'Items Count',
        'Total Amount',
        'Status'
      ].join(',');
      
      // Generate CSV rows
      const rows = reportData.map(sale => {
        const saleDate = new Date(sale.sale_date);
        const date = saleDate.toLocaleDateString();
        const time = saleDate.toLocaleTimeString();
        
        return [
          sale.sale_id,
          date,
          time,
          sale.cashier_name,
          sale.payment_method,
          sale.items.length,
          sale.total_amount,
          sale.is_voided ? 'Voided' : 'Completed'
        ].join(',');
      });
      
      // Create the CSV content
      const csvContent = [headers, ...rows].join('\n');
      
      // Create a Blob with the CSV data
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      return blob;
    } else if (format === 'pdf') {
      // PDF generation would typically use a library like pdfmake or jsPDF
      // This is a placeholder for the PDF generation logic
      throw new Error('PDF export not yet implemented');
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }, [fetchSales]);

  // Context value
  const contextValue = {
    sales,
    orders,
    activeOrders,
    currentSale,
    loading,
    error,
    salesStats,
    formatCurrency,
    fetchSales,
    fetchSalesAnalytics,
    fetchTopProducts,
    getSalesByCategory,
    getSalesByPaymentMethod,
    addSale,
    voidSale,
    exportSalesReport,
    calculateSalesStats
  };

  return (
    <SalesContext.Provider value={contextValue}>
      {children}
    </SalesContext.Provider>
  );
};

/**
 * Custom hook to access sales context functionality
 * 
 * @returns {Object} Sales context methods and state
 * @throws {Error} If used outside of a SalesProvider
 */
export const useSales = () => {
  const context = useContext(SalesContext);

  if (context === null || context === undefined) {
    throw new Error('useSales must be used within a SalesProvider. Make sure your component is wrapped in the SalesProvider component.');
  }

  return {
    // Sales data
    sales: context.sales,
    orders: context.orders,
    activeOrders: context.activeOrders,
    currentSale: context.currentSale,
    
    // Status indicators
    loading: context.loading,
    error: context.error,
    
    // Statistics
    salesStats: context.salesStats,
    
    // Format helpers
    formatCurrency: context.formatCurrency,
    
    // Data retrieval methods
    fetchSales: context.fetchSales,
    fetchSalesAnalytics: context.fetchSalesAnalytics,
    fetchTopProducts: context.fetchTopProducts,
    getSalesByCategory: context.getSalesByCategory,
    getSalesByPaymentMethod: context.getSalesByPaymentMethod,
    
    // Data modification methods
    addSale: context.addSale,
    voidSale: context.voidSale,
    
    // Export functionality
    exportSalesReport: context.exportSalesReport,
    
    // Additional utilities
    calculateSalesStats: context.calculateSalesStats
  };
};

export default useSales;