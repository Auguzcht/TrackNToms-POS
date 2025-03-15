import { useContext } from 'react';
import { SalesContext } from '../context/SalesContext';

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