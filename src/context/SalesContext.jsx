import { createContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

// Create context
export const SalesContext = createContext(null);

// Helper function to format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(amount);
};

export const SalesProvider = ({ children }) => {
  const [sales, setSales] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [currentSale, setCurrentSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [salesStats, setSalesStats] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0
  });

  // Initialize with mock data on component mount
  useEffect(() => {
    initializeMockData();
  }, []);

  // Function to initialize mock data
  const initializeMockData = () => {
    // Mock sales data
    const mockSales = generateMockSales();
    setSales(mockSales);
    
    // Calculate initial stats
    calculateSalesStats(mockSales);
  };

  // Generate mock sales data
  const generateMockSales = () => {
    // Generate random dates within the past 30 days
    const today = new Date();
    const pastMonth = new Date(today);
    pastMonth.setDate(pastMonth.getDate() - 30);
    
    const mockCategories = ['Coffee', 'Pastries', 'Food', 'Drinks', 'Add Ons'];
    const mockProducts = [
      { id: 1, name: 'Americano', category: 'Coffee', price: 120 },
      { id: 2, name: 'Latte', category: 'Coffee', price: 150 },
      { id: 3, name: 'Cappuccino', category: 'Coffee', price: 150 },
      { id: 4, name: 'Espresso', category: 'Coffee', price: 100 },
      { id: 5, name: 'Croissant', category: 'Pastries', price: 80 },
      { id: 6, name: 'Chocolate Chip Cookie', category: 'Pastries', price: 60 },
      { id: 7, name: 'Sandwich', category: 'Food', price: 180 },
      { id: 8, name: 'Iced Tea', category: 'Drinks', price: 100 },
      { id: 9, name: 'Extra Shot', category: 'Add Ons', price: 40 },
      { id: 10, name: 'Caramel Syrup', category: 'Add Ons', price: 30 },
    ];
    
    const paymentMethods = ['cash', 'credit_card', 'gcash', 'maya'];
    
    const mockSales = [];
    
    // Generate 100 random sales
    for (let i = 1; i <= 100; i++) {
      // Random date within the past month
      const saleDate = new Date(
        pastMonth.getTime() + Math.random() * (today.getTime() - pastMonth.getTime())
      );
      
      // Generate between 1 and 5 items for this sale
      const itemCount = Math.floor(Math.random() * 5) + 1;
      const items = [];
      let subtotal = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const randomProduct = mockProducts[Math.floor(Math.random() * mockProducts.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const itemTotal = randomProduct.price * quantity;
        subtotal += itemTotal;
        
        items.push({
          item_id: randomProduct.id,
          name: randomProduct.name,
          category: randomProduct.category,
          price: randomProduct.price,
          quantity: quantity,
          total: itemTotal
        });
      }
      
      // Apply tax (5%)
      const tax = Math.round(subtotal * 0.05);
      const total = subtotal + tax;
      
      // Random payment method
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      // Create sale object
      mockSales.push({
        sale_id: i,
        date: saleDate.toISOString(),
        cashier_id: Math.random() > 0.5 ? 1 : 2, // Either manager or cashier
        cashier_name: Math.random() > 0.5 ? 'John Manager' : 'Jane Cashier',
        payment_method: paymentMethod,
        subtotal: subtotal,
        tax: tax,
        total: total,
        items: items
      });
    }
    
    // Sort by date, newest first
    return mockSales.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Calculate sales statistics
  const calculateSalesStats = (salesData = sales) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    let dailyTotal = 0;
    let weeklyTotal = 0;
    let monthlyTotal = 0;
    
    salesData.forEach(sale => {
      const saleDate = new Date(sale.date);
      
      // Daily sales
      if (saleDate >= today) {
        dailyTotal += sale.total;
      }
      
      // Weekly sales
      if (saleDate >= oneWeekAgo) {
        weeklyTotal += sale.total;
      }
      
      // Monthly sales
      if (saleDate >= oneMonthAgo) {
        monthlyTotal += sale.total;
      }
    });
    
    setSalesStats({
      daily: dailyTotal,
      weekly: weeklyTotal,
      monthly: monthlyTotal
    });
    
    return {
      daily: dailyTotal,
      weekly: weeklyTotal,
      monthly: monthlyTotal
    };
  };

  // Fetch sales with optional filtering
  const fetchSales = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // For now, we'll just filter our mock data
      
      let filteredSales = [...sales];
      
      // Filter by date range if provided
      if (params.startDate) {
        const startDate = new Date(params.startDate);
        filteredSales = filteredSales.filter(sale => 
          new Date(sale.date) >= startDate
        );
      }
      
      if (params.endDate) {
        const endDate = new Date(params.endDate);
        // Set to end of day
        endDate.setHours(23, 59, 59, 999);
        filteredSales = filteredSales.filter(sale => 
          new Date(sale.date) <= endDate
        );
      }
      
      // Filter by cashier if provided
      if (params.cashierId) {
        filteredSales = filteredSales.filter(sale => 
          sale.cashier_id === params.cashierId
        );
      }
      
      // Filter by payment method if provided
      if (params.paymentMethod) {
        filteredSales = filteredSales.filter(sale => 
          sale.payment_method === params.paymentMethod
        );
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return filteredSales;
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Failed to fetch sales data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sales]);

  // Add a new sale
  const addSale = useCallback(async (saleData) => {
    setLoading(true);
    
    try {
      // Convert any camelCase properties to snake_case for DB alignment
      const dbFormatData = {
        cashier_id: saleData.cashierId || 1, // Default to 1 if no user ID
        sale_date: saleData.date || new Date().toISOString(),
        payment_method: saleData.paymentMethod,
        subtotal: saleData.subtotal,
        tax: saleData.tax,
        total_amount: saleData.total,
        items: saleData.items.map(item => ({
          item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          item_total: item.subtotal
        }))
      };
      
      // In a real app, this would be an API call
      const newSaleId = sales.length > 0 ? Math.max(...sales.map(s => s.sale_id)) + 1 : 1;
      
      // Create the new sale object
      const newSale = {
        sale_id: newSaleId,
        ...dbFormatData
      };
      
      // Add to state
      const updatedSales = [newSale, ...sales];
      setSales(updatedSales);
      
      // Update stats
      calculateSalesStats(updatedSales);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      toast.success('Sale completed successfully');
      return newSale;
    } catch (err) {
      console.error('Error adding sale:', err);
      toast.error('Failed to complete sale');
      setError('Failed to add sale');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sales]);

  // Void a sale
  const voidSale = useCallback(async (saleId, reason) => {
    setLoading(true);
    
    try {
      // In a real app, this would be an API call
      // Find the sale to void
      const saleIndex = sales.findIndex(sale => sale.sale_id === saleId);
      
      if (saleIndex === -1) {
        throw new Error(`Sale with ID ${saleId} not found`);
      }
      
      // Mark the sale as voided
      const updatedSales = [...sales];
      updatedSales[saleIndex] = {
        ...updatedSales[saleIndex],
        voided: true,
        voidReason: reason,
        voidDate: new Date().toISOString()
      };
      
      setSales(updatedSales);
      
      // Update stats
      calculateSalesStats(updatedSales);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      toast.success(`Sale #${saleId} voided successfully`);
      return updatedSales[saleIndex];
    } catch (err) {
      console.error('Error voiding sale:', err);
      toast.error('Failed to void sale');
      setError('Failed to void sale');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sales]);

  // Fetch sales analytics
  const fetchSalesAnalytics = useCallback(async (params = {}) => {
    setLoading(true);
    
    try {
      // Filter sales based on date range
      let filteredSales = await fetchSales(params);
      
      // Group sales by hour
      const hourlyDistribution = Array(24)
        .fill()
        .map((_, hour) => ({ hour, sales: 0 }));
      
      filteredSales.forEach(sale => {
        const saleHour = new Date(sale.date).getHours();
        hourlyDistribution[saleHour].sales += sale.total;
      });
      
      // Group sales by day
      const salesByDay = {};
      filteredSales.forEach(sale => {
        const dateStr = new Date(sale.date).toISOString().split('T')[0];
        
        if (!salesByDay[dateStr]) {
          salesByDay[dateStr] = 0;
        }
        
        salesByDay[dateStr] += sale.total;
      });
      
      const dailyTotals = Object.entries(salesByDay)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        hourlyDistribution,
        dailyTotals
      };
    } catch (err) {
      console.error('Error fetching sales analytics:', err);
      setError('Failed to fetch sales analytics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSales]);

  // Fetch top products
  const fetchTopProducts = useCallback(async ({ startDate, endDate, limit = 5 }) => {
    setLoading(true);
    
    try {
      // Filter sales based on date range
      const filteredSales = await fetchSales({ startDate, endDate });
      
      // Aggregate product data
      const productMap = {};
      
      filteredSales.forEach(sale => {
        sale.items.forEach(item => {
          if (!productMap[item.item_id]) {
            productMap[item.item_id] = {
              id: item.item_id,
              name: item.name,
              quantity: 0,
              revenue: 0
            };
          }
          
          productMap[item.item_id].quantity += item.quantity;
          productMap[item.item_id].revenue += item.total;
        });
      });
      
      // Convert to array and sort by revenue
      const topProducts = Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit)
        .map(product => ({
          ...product,
          average_price: product.quantity > 0 
            ? Math.round(product.revenue / product.quantity) 
            : 0
        }));
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return topProducts;
    } catch (err) {
      console.error('Error fetching top products:', err);
      setError('Failed to fetch top products');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSales]);

  // Export sales report
  const exportSalesReport = useCallback(async (params = {}) => {
    setLoading(true);
    
    try {
      // In a real app, this would generate a proper Excel/CSV file
      // For now, just fetch the data and log it to console
      const reportData = await fetchSales(params);
      
      console.log('Exporting sales report with data:', reportData);
      
      // Simulate download
      toast.success('Sales report exported successfully');
      
      // In a real implementation, you'd create a downloadable file here
      return true;
    } catch (err) {
      console.error('Error exporting sales report:', err);
      toast.error('Failed to export sales report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSales]);

  // Get sales statistics by category
  const getSalesByCategory = useCallback(async (params = {}) => {
    try {
      // Filter sales based on params
      const filteredSales = await fetchSales(params);
      
      // Aggregate by category
      const categorySales = {};
      
      filteredSales.forEach(sale => {
        sale.items.forEach(item => {
          const category = item.category || 'Uncategorized';
          
          if (!categorySales[category]) {
            categorySales[category] = 0;
          }
          
          categorySales[category] += item.total;
        });
      });
      
      return categorySales;
    } catch (err) {
      console.error('Error calculating sales by category:', err);
      setError('Failed to calculate category sales');
      throw err;
    }
  }, [fetchSales]);

  // Get sales statistics by payment method
  const getSalesByPaymentMethod = useCallback(async (params = {}) => {
    try {
      // Filter sales based on params
      const filteredSales = await fetchSales(params);
      
      // Aggregate by payment method
      const paymentMethodSales = {};
      
      filteredSales.forEach(sale => {
        const method = sale.payment_method || 'Unknown';
        
        if (!paymentMethodSales[method]) {
          paymentMethodSales[method] = 0;
        }
        
        paymentMethodSales[method] += sale.total;
      });
      
      return paymentMethodSales;
    } catch (err) {
      console.error('Error calculating sales by payment method:', err);
      setError('Failed to calculate payment method sales');
      throw err;
    }
  }, [fetchSales]);

  // Provide all the context values
  const value = {
    sales,
    orders,
    activeOrders,
    currentSale,
    loading,
    error,
    salesStats,
    formatCurrency,
    fetchSales,
    addSale,
    voidSale,
    fetchSalesAnalytics,
    fetchTopProducts,
    getSalesByCategory,
    getSalesByPaymentMethod,
    exportSalesReport,
    calculateSalesStats
  };

  return (
    <SalesContext.Provider value={value}>
      {children}
    </SalesContext.Provider>
  );
};

export default SalesProvider;