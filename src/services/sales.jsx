import { createContext, useState, useCallback, useContext } from 'react';
import { toast } from 'react-hot-toast';
import api, { endpoints } from './api';

// Create context for sales management
const SalesContext = createContext(null);

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount);
};

// Sales provider component
export const SalesProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [salesStats, setSalesStats] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0
  });

  // Fetch all orders with optional filtering
  const fetchOrders = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await endpoints.orders.getAll(params);
      setOrders(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch orders');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch a single order by ID
  const fetchOrderById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await endpoints.orders.getById(id);
      setCurrentOrder(response.data);
      return response.data;
    } catch (err) {
      console.error(`Error fetching order ${id}:`, err);
      setError(err.response?.data?.message || 'Failed to fetch order details');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch active orders (in progress, ready for pickup)
  const fetchActiveOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await endpoints.orders.getActiveOrders();
      setActiveOrders(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching active orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch active orders');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new order
  const createOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await endpoints.orders.create(orderData);
      setOrders(prev => [response.data, ...prev]);
      setCurrentOrder(response.data);
      toast.success(`Order #${response.data.orderNumber} created successfully`);
      return response.data;
    } catch (err) {
      console.error('Error creating order:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create order';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing order
  const updateOrder = useCallback(async (id, orderData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await endpoints.orders.update(id, orderData);
      
      // Update orders list
      setOrders(prev => prev.map(order => 
        order.id === id ? response.data : order
      ));
      
      // Update current order if it's the one being edited
      if (currentOrder && currentOrder.id === id) {
        setCurrentOrder(response.data);
      }
      
      // Update active orders if needed
      setActiveOrders(prev => prev.map(order => 
        order.id === id ? response.data : order
      ));
      
      toast.success(`Order #${response.data.orderNumber} updated`);
      return response.data;
    } catch (err) {
      console.error(`Error updating order ${id}:`, err);
      const errorMsg = err.response?.data?.message || 'Failed to update order';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentOrder]);

  // Update order status
  const updateOrderStatus = useCallback(async (id, status) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await endpoints.orders.updateStatus(id, status);
      
      // Update orders list
      setOrders(prev => prev.map(order => 
        order.id === id ? { ...order, status: response.data.status } : order
      ));
      
      // Update current order if it's the one being edited
      if (currentOrder && currentOrder.id === id) {
        setCurrentOrder({ ...currentOrder, status: response.data.status });
      }
      
      // Update active orders
      if (['completed', 'cancelled', 'voided'].includes(status)) {
        // Remove from active orders if status is terminal
        setActiveOrders(prev => prev.filter(order => order.id !== id));
      } else {
        // Update status in active orders
        setActiveOrders(prev => prev.map(order => 
          order.id === id ? { ...order, status: response.data.status } : order
        ));
      }
      
      toast.success(`Order #${response.data.orderNumber} is now ${status}`);
      return response.data;
    } catch (err) {
      console.error(`Error updating order ${id} status:`, err);
      const errorMsg = err.response?.data?.message || 'Failed to update order status';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentOrder]);

  // Void an order
  const voidOrder = useCallback(async (id, reason) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await endpoints.orders.void(id, reason);
      
      // Update orders list
      setOrders(prev => prev.map(order => 
        order.id === id ? { ...order, status: 'voided', voidReason: reason } : order
      ));
      
      // Update current order if it's the one being voided
      if (currentOrder && currentOrder.id === id) {
        setCurrentOrder({ ...currentOrder, status: 'voided', voidReason: reason });
      }
      
      // Remove from active orders
      setActiveOrders(prev => prev.filter(order => order.id !== id));
      
      toast.success(`Order #${response.data.orderNumber} has been voided`);
      return response.data;
    } catch (err) {
      console.error(`Error voiding order ${id}:`, err);
      const errorMsg = err.response?.data?.message || 'Failed to void order';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentOrder]);

  // Fetch sales statistics
  const fetchSalesStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      // Fetch daily sales
      const dailyResponse = await endpoints.reports.getSales({
        startDate: startOfDay,
        endDate: new Date().toISOString(),
        groupBy: 'day'
      });
      
      // Fetch weekly sales
      const weeklyResponse = await endpoints.reports.getSales({
        startDate: startOfWeek.toISOString(),
        endDate: new Date().toISOString(),
        groupBy: 'week'
      });
      
      // Fetch monthly sales
      const monthlyResponse = await endpoints.reports.getSales({
        startDate: startOfMonth.toISOString(),
        endDate: new Date().toISOString(),
        groupBy: 'month'
      });
      
      const stats = {
        daily: dailyResponse.data.total || 0,
        weekly: weeklyResponse.data.total || 0,
        monthly: monthlyResponse.data.total || 0
      };
      
      setSalesStats(stats);
      return stats;
    } catch (err) {
      console.error('Error fetching sales statistics:', err);
      setError(err.response?.data?.message || 'Failed to fetch sales statistics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get sales data for charts
  const getSalesChartData = useCallback(async (period = 'week') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await endpoints.dashboard.getSalesChart(period);
      return response.data;
    } catch (err) {
      console.error('Error fetching sales chart data:', err);
      setError(err.response?.data?.message || 'Failed to fetch sales chart data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get top selling products
  const getTopProducts = useCallback(async (limit = 5) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await endpoints.dashboard.getTopProducts(limit);
      return response.data;
    } catch (err) {
      console.error('Error fetching top products:', err);
      setError(err.response?.data?.message || 'Failed to fetch top products');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate sales by category
  const calculateSalesByCategory = useCallback((ordersData = orders) => {
    const categories = {};
    
    ordersData.forEach(order => {
      if (order.status !== 'voided' && order.status !== 'cancelled') {
        order.items.forEach(item => {
          const category = item.category || 'Uncategorized';
          
          if (!categories[category]) {
            categories[category] = {
              count: 0,
              total: 0
            };
          }
          
          categories[category].count += item.quantity;
          categories[category].total += item.price * item.quantity;
        });
      }
    });
    
    return Object.entries(categories).map(([name, data]) => ({
      name,
      count: data.count,
      total: data.total,
      formattedTotal: formatCurrency(data.total)
    }));
  }, [orders]);

  // Export sales report
  const exportSalesReport = useCallback(async (params = {}) => {
    setLoading(true);
    
    try {
      const response = await endpoints.reports.exportSales({
        ...params,
        responseType: 'blob'
      });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `sales-report-${dateStr}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Sales report downloaded successfully');
      return true;
    } catch (err) {
      console.error('Error exporting sales report:', err);
      toast.error('Failed to download sales report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Context value
  const value = {
    orders,
    activeOrders,
    currentOrder,
    loading,
    error,
    salesStats,
    formatCurrency,
    fetchOrders,
    fetchOrderById,
    fetchActiveOrders,
    createOrder,
    updateOrder,
    updateOrderStatus,
    voidOrder,
    fetchSalesStats,
    getSalesChartData,
    getTopProducts,
    calculateSalesByCategory,
    exportSalesReport
  };

  // Return the provider with context value
  return (
    <SalesContext.Provider value={value}>
      {children}
    </SalesContext.Provider>
  );
};

// Custom hook to use sales context
export const useSales = () => {
  const context = useContext(SalesContext);
  
  if (context === null) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  
  return context;
};

export default { SalesProvider, useSales, formatCurrency };