import { useState, useCallback, useRef, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import supabase from '../services/supabase';
import { useSales } from './useSales';
import { useInventory } from './useInventory';
import { useSuppliers } from './useSuppliers';
import { formatDateRange } from '../utils/date-utils';
import { exportToCSV, exportToPDF } from '../utils/export-utils';

/**
 * Hook for generating, analyzing, and exporting reports
 * @returns {Object} Report management functions and state
 */
const useReports = () => {
  const { fetchSales, fetchSalesAnalytics, getSalesByCategory } = useSales();
  const { fetchIngredients, fetchItems, fetchPullouts } = useInventory();
  const { fetchPurchaseOrders } = useSuppliers();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });

  // Add a cache for generated reports
  const reportsCache = useRef({});

  /**
   * Generate a sales report
   * @param {Object} options - Report options
   * @returns {Object} Sales report data
   */
  const generateSalesReport = useCallback(async (options = {}) => {
    const { 
      startDate = dateRange.startDate, 
      endDate = dateRange.endDate,
      includeVoided = false,
      groupBy = 'day',
      cashierId = null,
      forceRefresh = false // New option to bypass cache
    } = options;
    
    // Generate a cache key based on parameters
    const cacheKey = `sales:${startDate || 'all'}:${endDate || 'all'}:${includeVoided}:${groupBy}:${cashierId || 'all'}`;
    
    // Check if we have a cached version of this report
    if (!forceRefresh && reportsCache.current[cacheKey]) {
      console.log('Using cached sales report');
      const cachedReport = reportsCache.current[cacheKey];
      setReportData(cachedReport);
      return cachedReport;
    }
    
    setLoading(true);
    setError(null);
    setReportType('sales');
    
    try {
      // Fetch raw sales data
      let salesData = await fetchSales({ startDate, endDate, cashierId });
      
      // Filter out voided sales if not included
      if (!includeVoided) {
        salesData = salesData.filter(sale => !sale.is_voided);
      }
      
      // Fetch sales analytics
      const analyticsData = await fetchSalesAnalytics({ 
        startDate, 
        endDate, 
        interval: groupBy 
      });
      
      // Fetch all items to get their externally sourced status
      const { data: allItems } = await supabase
        .from('items')
        .select('item_id, is_externally_sourced');
      
      // Create a lookup map for item properties
      const itemPropertiesMap = {};
      if (allItems && allItems.length > 0) {
        allItems.forEach(item => {
          itemPropertiesMap[item.item_id] = {
            is_externally_sourced: item.is_externally_sourced === true
          };
        });
      }
      
      // Calculate summary metrics
      const totalSales = salesData.reduce((sum, sale) => 
        sum + parseFloat(sale.total_amount), 0);
      
      const totalTransactions = salesData.length;
      
      const averageOrderValue = totalTransactions > 0 
        ? totalSales / totalTransactions 
        : 0;
      
      // Get sales by category and payment method
      const categorySales = getSalesByCategory(salesData);
      
      // Track in-house vs external product sales
      let inHouseSales = 0;
      let externalSales = 0;
      
      const paymentMethodBreakdown = salesData.reduce((acc, sale) => {
        const method = sale.payment_method || 'Unknown';
        acc[method] = (acc[method] || 0) + parseFloat(sale.total_amount);
        return acc;
      }, {});
      
      // Get top selling items and track external vs in-house
      const itemSales = {};
      salesData.forEach(sale => {
        sale.items.forEach(item => {
          // Get the external status from our lookup map or from the item itself
          const isExternallySourced = 
            itemPropertiesMap[item.item_id]?.is_externally_sourced || 
            item.is_externally_sourced === true;
          
          const subtotal = parseFloat(item.subtotal || 0);
          
          // Update in-house vs external totals
          if (isExternallySourced) {
            externalSales += subtotal;
          } else {
            inHouseSales += subtotal;
          }
          
          if (!itemSales[item.item_id]) {
            itemSales[item.item_id] = {
              id: item.item_id,
              name: item.name || `Item ${item.item_id}`,
              category: item.category || 'Uncategorized',
              quantity: 0,
              revenue: 0,
              is_externally_sourced: isExternallySourced
            };
          }
          
          itemSales[item.item_id].quantity += item.quantity;
          itemSales[item.item_id].revenue += subtotal;
        });
      });
      
      // Sort by revenue to get top items
      const topItems = Object.values(itemSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      
      // Hourly sales breakdown
      const hourlySales = salesData.reduce((acc, sale) => {
        const hour = new Date(sale.sale_date).getHours();
        acc[hour] = (acc[hour] || 0) + parseFloat(sale.total_amount);
        return acc;
      }, {});
      
      // Prepare the final report data with the correct product type breakdown
      const report = {
        type: 'sales',
        title: 'Sales Report',
        dateRange: {
          startDate,
          endDate,
          formatted: formatDateRange(startDate, endDate)
        },
        summary: {
          totalSales,
          totalTransactions,
          averageOrderValue,
          voidedSales: salesData.filter(sale => sale.is_voided).length,
          productTypeSales: {
            inHouse: inHouseSales,
            external: externalSales
          }
        },
        data: salesData,
        analytics: {
          categorySales,
          paymentMethodBreakdown,
          topItems,
          hourlySales,
          trend: analyticsData
        }
      };
      
      // Cache the generated report
      reportsCache.current[cacheKey] = report;
      
      setReportData(report);
      return report;
      
    } catch (err) {
      console.error('Error generating sales report:', err);
      setError(`Failed to generate sales report: ${err.message}`);
      toast.error('Could not generate sales report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dateRange, fetchSales, fetchSalesAnalytics, getSalesByCategory]);

  /**
   * Generate an inventory report
   * @param {Object} options - Report options
   * @returns {Object} Inventory report data
   */
  const generateInventoryReport = useCallback(async (options = {}) => {
    const { 
      startDate = dateRange.startDate, 
      endDate = dateRange.endDate,
      includeZeroStock = true,
      categoryFilter = null
    } = options;
    
    setLoading(true);
    setError(null);
    setReportType('inventory');
    
    try {
      // Fetch inventory data
      const ingredients = await fetchIngredients();
      const items = await fetchItems();
      const pullouts = await fetchPullouts();
      
      // Fetch purchases for the date range (to calculate inventory movements)
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchase_details')
        .select(`
          purchase_id,
          ingredient_id, 
          quantity, 
          unit_price,
          subtotal,
          purchases:purchase_id ( 
            purchase_date,
            status
          )
        `)
        .gte('purchases.purchase_date', startDate || '1900-01-01')
        .lte('purchases.purchase_date', endDate || new Date().toISOString())
        .eq('purchases.status', 'completed');
      
      if (purchaseError) throw purchaseError;
      
      // Process ingredients with stock levels and values
      const processedIngredients = ingredients.map(ingredient => {
        // Calculate value
        const value = ingredient.quantity * (ingredient.unit_cost || 0);
        
        // Calculate stock status
        let stockStatus = 'normal';
        if (ingredient.quantity <= 0) {
          stockStatus = 'out';
        } else if (ingredient.quantity <= ingredient.minimum_quantity) {
          stockStatus = 'low';
        }
        
        // Calculate purchases for this ingredient
        const ingredientPurchases = purchases
          .filter(p => p.ingredient_id === ingredient.ingredient_id)
          .reduce((sum, p) => sum + p.quantity, 0);
        
        // Calculate pullouts for this ingredient
        const ingredientPullouts = pullouts
          .filter(p => 
            p.ingredient_id === ingredient.ingredient_id && 
            p.status === 'approved'
          )
          .reduce((sum, p) => sum + p.quantity, 0);
        
        return {
          ...ingredient,
          value,
          stockStatus,
          movement: {
            purchases: ingredientPurchases,
            pullouts: ingredientPullouts
          }
        };
      });
      
      // Filter ingredients if needed
      let filteredIngredients = processedIngredients;
      if (!includeZeroStock) {
        filteredIngredients = filteredIngredients.filter(ing => ing.quantity > 0);
      }
      
      // Calculate summary metrics
      const totalIngredients = filteredIngredients.length;
      const lowStockItems = filteredIngredients.filter(ing => ing.stockStatus === 'low').length;
      const outOfStockItems = filteredIngredients.filter(ing => ing.stockStatus === 'out').length;
      const inventoryValue = filteredIngredients.reduce((sum, ing) => sum + ing.value, 0);
      
      // Organize ingredients by category
      const ingredientsByCategory = filteredIngredients.reduce((acc, ing) => {
        const category = ing.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(ing);
        return acc;
      }, {});
      
      // Prepare the final report data
      const report = {
        type: 'inventory',
        title: 'Inventory Report',
        dateRange: {
          startDate,
          endDate,
          formatted: formatDateRange(startDate, endDate)
        },
        summary: {
          totalIngredients,
          lowStockItems,
          outOfStockItems,
          inventoryValue,
          totalItems: items.length
        },
        data: {
          ingredients: filteredIngredients,
          ingredientsByCategory,
          items
        },
        analytics: {
          stockStatus: {
            normal: totalIngredients - lowStockItems - outOfStockItems,
            low: lowStockItems,
            out: outOfStockItems
          },
          movement: {
            purchases: purchases,
            pullouts: pullouts
          }
        }
      };
      
      setReportData(report);
      return report;
      
    } catch (err) {
      console.error('Error generating inventory report:', err);
      setError(`Failed to generate inventory report: ${err.message}`);
      toast.error('Could not generate inventory report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dateRange, fetchIngredients, fetchItems, fetchPullouts]);

  /**
   * Generate a financial report
   * @param {Object} options - Report options
   * @returns {Object} Financial report data
   */
  const generateFinancialReport = useCallback(async (options = {}) => {
    const { 
      startDate = dateRange.startDate, 
      endDate = dateRange.endDate,
      includeVoided = false
    } = options;
    
    setLoading(true);
    setError(null);
    setReportType('financial');
    
    try {
      // Fetch sales data
      let salesData = await fetchSales({ startDate, endDate });
      
      // Filter out voided sales if not included
      if (!includeVoided) {
        salesData = salesData.filter(sale => !sale.is_voided);
      }
      
      // Fetch purchases (expenses)
      const purchaseOrders = await fetchPurchaseOrders();
      
      const filteredPurchases = purchaseOrders.filter(po => {
        // Only include completed purchases
        if (po.status !== 'completed') return false;
        
        // Filter by date range if provided
        const purchaseDate = new Date(po.purchase_date);
        
        if (startDate && endDate) {
          return purchaseDate >= new Date(startDate) && 
                 purchaseDate <= new Date(endDate);
        }
        
        if (startDate && !endDate) {
          return purchaseDate >= new Date(startDate);
        }
        
        if (!startDate && endDate) {
          return purchaseDate <= new Date(endDate);
        }
        
        return true;
      });
      
      // Calculate revenue metrics
      const totalRevenue = salesData.reduce((sum, sale) => 
        sum + parseFloat(sale.total_amount), 0);
      
      // Group revenue by product category
      const revenueByCategory = {};
      salesData.forEach(sale => {
        sale.items.forEach(item => {
          const category = item.category || 'Uncategorized';
          if (!revenueByCategory[category]) {
            revenueByCategory[category] = 0;
          }
          revenueByCategory[category] += parseFloat(item.subtotal);
        });
      });
      
      // Calculate daily revenue totals for trend charts
      const dailyRevenue = {};
      salesData.forEach(sale => {
        const date = new Date(sale.sale_date).toISOString().split('T')[0];
        if (!dailyRevenue[date]) {
          dailyRevenue[date] = 0;
        }
        dailyRevenue[date] += parseFloat(sale.total_amount);
      });
      
      // Convert to array for charts
      const dailyRevenueTrend = Object.entries(dailyRevenue)
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Calculate expense metrics
      const inventoryExpense = filteredPurchases
        .reduce((sum, po) => sum + parseFloat(po.total_amount), 0);
      
      // In a real app, you'd fetch actual operating expenses
      // Here we're simulating them as a percentage of revenue
      const operatingExpense = totalRevenue * 0.35; // 35% of revenue
      const otherExpense = totalRevenue * 0.05; // 5% of revenue
      
      const totalExpenses = inventoryExpense + operatingExpense + otherExpense;
      
      // Calculate profit metrics
      const grossProfit = totalRevenue - inventoryExpense;
      const netProfit = totalRevenue - totalExpenses;
      
      // Calculate profit margin metrics
      const grossProfitMargin = totalRevenue > 0 
        ? (grossProfit / totalRevenue) * 100 
        : 0;
      
      const netProfitMargin = totalRevenue > 0 
        ? (netProfit / totalRevenue) * 100 
        : 0;
      
      // Prepare the final report data
      const report = {
        type: 'financial',
        title: 'Financial Report',
        dateRange: {
          startDate,
          endDate,
          formatted: formatDateRange(startDate, endDate)
        },
        summary: {
          revenue: totalRevenue,
          expenses: totalExpenses,
          grossProfit,
          netProfit,
          grossProfitMargin,
          netProfitMargin
        },
        data: {
          sales: salesData,
          purchases: filteredPurchases
        },
        analytics: {
          revenue: {
            byCategory: revenueByCategory,
            dailyTrend: dailyRevenueTrend
          },
          expenses: {
            byCategory: {
              inventory: inventoryExpense,
              operating: operatingExpense,
              other: otherExpense
            }
          }
        }
      };
      
      setReportData(report);
      return report;
      
    } catch (err) {
      console.error('Error generating financial report:', err);
      setError(`Failed to generate financial report: ${err.message}`);
      toast.error('Could not generate financial report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dateRange, fetchSales, fetchPurchaseOrders]);

  /**
   * Generate a custom analytics report using Supabase RPC functions
   * @param {Object} options - Report options
   * @returns {Object} Custom analytics data
   */
  const generateCustomReport = useCallback(async (options = {}) => {
    const {
      reportName,
      startDate = dateRange.startDate,
      endDate = dateRange.endDate,
      parameters = {},
      procedureName
    } = options;
    
    setLoading(true);
    setError(null);
    setReportType('custom');
    
    try {
      // Call the specified RPC function
      const { data, error: rpcError } = await supabase.rpc(
        procedureName, 
        {
          p_start_date: startDate,
          p_end_date: endDate,
          ...parameters
        }
      );
      
      if (rpcError) throw rpcError;
      
      // Prepare the final report data
      const report = {
        type: 'custom',
        title: reportName || 'Custom Report',
        dateRange: {
          startDate,
          endDate,
          formatted: formatDateRange(startDate, endDate)
        },
        data: data || [],
        parameters: {
          ...parameters,
          startDate,
          endDate
        }
      };
      
      setReportData(report);
      return report;
      
    } catch (err) {
      console.error(`Error generating custom report (${reportName}):`, err);
      setError(`Failed to generate custom report: ${err.message}`);
      toast.error('Could not generate custom report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  /**
   * Export the current report to a file
   * @param {Object} options - Export options
   * @returns {Blob} File data
   */
  const exportReport = useCallback(async (options = {}) => {
    const { 
      report = reportData,
      format = 'csv',
      fileName = null
    } = options;
    
    if (!report) {
      toast.error('No report data to export');
      throw new Error('No report data available for export');
    }
    
    try {
      setLoading(true);
      
      // Generate default file name based on report type
      const defaultFileName = `${report.title.replace(/\s+/g, '-').toLowerCase()}-${
        report.dateRange.formatted.replace(/\s+/g, '-').toLowerCase()
      }`;
      
      const outputFileName = fileName || defaultFileName;
      
      let blob;
      
      // Export based on format
      if (format === 'csv') {
        // Prepare data for CSV export based on report type
        let csvData;
        
        switch (report.type) {
          case 'sales':
            csvData = report.data.map(sale => ({
              'Sale ID': sale.sale_id,
              'Date': new Date(sale.sale_date).toLocaleDateString(),
              'Time': new Date(sale.sale_date).toLocaleTimeString(),
              'Cashier': sale.cashier_name,
              'Payment Method': sale.payment_method,
              'Total Amount': parseFloat(sale.total_amount).toFixed(2),
              'Status': sale.is_voided ? 'Voided' : 'Completed'
            }));
            break;
            
          case 'inventory':
            csvData = report.data.ingredients.map(ing => ({
              'Name': ing.name,
              'Category': ing.category || 'Uncategorized',
              'Current Stock': ing.quantity,
              'Unit': ing.unit,
              'Minimum Required': ing.minimum_quantity,
              'Unit Cost': parseFloat(ing.unit_cost || 0).toFixed(2),
              'Total Value': ing.value.toFixed(2),
              'Status': ing.stockStatus.charAt(0).toUpperCase() + ing.stockStatus.slice(1)
            }));
            break;
            
          case 'financial':
            // Create a combined report with revenue and expenses
            csvData = [
              // Header row for the report
              {
                'Report Type': 'Financial Summary',
                'Period': report.dateRange.formatted,
                'Generated On': new Date().toLocaleString()
              },
              // Empty row for spacing
              {},
              // Summary section
              {
                'Metric': 'Total Revenue',
                'Value': report.summary.revenue.toFixed(2)
              },
              {
                'Metric': 'Total Expenses',
                'Value': report.summary.expenses.toFixed(2)
              },
              {
                'Metric': 'Gross Profit',
                'Value': report.summary.grossProfit.toFixed(2)
              },
              {
                'Metric': 'Net Profit',
                'Value': report.summary.netProfit.toFixed(2)
              },
              {
                'Metric': 'Net Profit Margin',
                'Value': `${report.summary.netProfitMargin.toFixed(2)}%`
              },
              // Empty row for spacing
              {},
              // Revenue breakdown header
              { 'Category': 'REVENUE BY CATEGORY' },
              // Revenue data
              ...Object.entries(report.analytics.revenue.byCategory).map(([category, amount]) => ({
                'Category': category,
                'Amount': amount.toFixed(2),
                'Percentage': `${(amount / report.summary.revenue * 100).toFixed(2)}%`
              })),
              // Empty row for spacing
              {},
              // Expenses breakdown header
              { 'Category': 'EXPENSES BY CATEGORY' },
              // Expenses data
              ...Object.entries(report.analytics.expenses.byCategory).map(([category, amount]) => ({
                'Category': category.charAt(0).toUpperCase() + category.slice(1),
                'Amount': amount.toFixed(2),
                'Percentage': `${(amount / report.summary.expenses * 100).toFixed(2)}%`
              }))
            ];
            break;
            
          case 'custom':
          default:
            // For custom reports, just export the data directly
            csvData = report.data;
            break;
        }
        
        // Use utility to export data as CSV
        blob = exportToCSV(csvData);
        
      } else if (format === 'pdf') {
        // For PDF export, we'll need to format the data differently
        // In a real app, you'd use a library like pdfmake or jsPDF
        blob = await exportToPDF(report);
      } else if (format === 'excel') {
        try {
          const XLSX = require('xlsx');
          
          let worksheetData;
          
          switch (report.type) {
            case 'sales':
              worksheetData = report.data.map(sale => ({
                'Sale ID': sale.sale_id,
                'Date': new Date(sale.sale_date).toLocaleDateString(),
                'Time': new Date(sale.sale_date).toLocaleTimeString(),
                'Cashier': sale.cashier_name,
                'Payment Method': sale.payment_method,
                'Total Amount': parseFloat(sale.total_amount).toFixed(2),
                'Status': sale.is_voided ? 'Voided' : 'Completed'
              }));
              break;
              
            // Handle other report types...
          }
          
          // Create worksheet and workbook
          const worksheet = XLSX.utils.json_to_sheet(worksheetData);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, report.title);
          
          // Generate Excel file
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        } catch (err) {
          console.error('Excel export error:', err);
          throw new Error(`Excel export failed: ${err.message}`);
        }
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }
      
      // Trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${outputFileName}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Report exported successfully as ${format.toUpperCase()}`);
      
      return blob;
      
    } catch (err) {
      console.error('Error exporting report:', err);
      toast.error(`Failed to export report: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [reportData]);

  /**
   * Set the date range for reports
   * @param {Object} range - Date range object with startDate and endDate
   */
  const setReportDateRange = useCallback((range) => {
    setDateRange(range);
  }, []);

  /**
   * Get predefined date range options
   * @returns {Array} Date range options
   */
  const getDateRangeOptions = useCallback(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    return [
      { 
        id: 'today', 
        label: 'Today',
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      },
      { 
        id: 'yesterday', 
        label: 'Yesterday',
        startDate: yesterday.toISOString().split('T')[0],
        endDate: yesterday.toISOString().split('T')[0]
      },
      { 
        id: 'thisWeek', 
        label: 'This Week',
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      },
      { 
        id: 'thisMonth', 
        label: 'This Month',
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      },
      { 
        id: 'lastMonth', 
        label: 'Last Month',
        startDate: startOfLastMonth.toISOString().split('T')[0],
        endDate: endOfLastMonth.toISOString().split('T')[0]
      },
      { 
        id: 'custom', 
        label: 'Custom Range'
      }
    ];
  }, []);

  /**
   * Get predefined report templates
   * @returns {Array} Report templates
   */
  const getReportTemplates = useCallback(() => {
    return [
      {
        id: 'dailySales',
        name: 'Daily Sales',
        type: 'sales',
        description: 'Summary of sales transactions for each day',
        generator: generateSalesReport,
        options: { groupBy: 'day' }
      },
      {
        id: 'lowStock',
        name: 'Low Stock Items',
        type: 'inventory',
        description: 'Ingredients that are below minimum required levels',
        generator: generateInventoryReport,
        options: { includeZeroStock: true }
      },
      {
        id: 'profitMargin',
        name: 'Profit Margin Analysis',
        type: 'financial',
        description: 'Detailed breakdown of profit margins by category',
        generator: generateFinancialReport
      },
      {
        id: 'topSelling',
        name: 'Top Selling Items',
        type: 'sales',
        description: 'Most popular menu items by quantity and revenue',
        generator: generateSalesReport
      },
      {
        id: 'inventoryValue',
        name: 'Inventory Valuation',
        type: 'inventory',
        description: 'Total value of current inventory',
        generator: generateInventoryReport
      }
    ];
  }, [generateSalesReport, generateInventoryReport, generateFinancialReport]);

  /**
   * Clear the current report data
   */
  const clearReport = useCallback(() => {
    setReportData(null);
    setReportType(null);
    setError(null);
  }, []);

  // Add this function to the hook
  const scheduleReport = useCallback(async (options = {}) => {
    const {
      reportType,
      reportOptions,
      schedule, // 'daily', 'weekly', 'monthly'
      email, // recipient email
      format = 'pdf'
    } = options;
    
    setLoading(true);
    
    try {
      // Call a Supabase Function to schedule the report
      const { data, error } = await supabase.functions.invoke('schedule-report', {
        body: {
          reportType,
          reportOptions,
          schedule,
          email,
          format
        }
      });
      
      if (error) throw error;
      
      toast.success(`Report scheduled to be sent ${schedule} to ${email}`);
      return data;
    } catch (err) {
      console.error('Error scheduling report:', err);
      toast.error(`Failed to schedule report: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add this function to calculate period-over-period comparisons
  const calculatePeriodComparison = useCallback(async (reportType, currentData, options) => {
    // Calculate the previous period based on current date range
    const { startDate, endDate } = options;
    if (!startDate || !endDate) return null;
    
    // Calculate previous period dates
    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);
    const duration = currentEnd - currentStart;
    
    const previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    
    const previousStart = new Date(previousEnd);
    previousStart.setTime(previousEnd.getTime() - duration);
    
    // Format dates
    const prevStartFormatted = previousStart.toISOString().split('T')[0];
    const prevEndFormatted = previousEnd.toISOString().split('T')[0];
    
    try {
      let previousData;
      
      // Generate the appropriate report type for the previous period
      switch (reportType) {
        case 'sales':
          previousData = await fetchSales({ 
            startDate: prevStartFormatted, 
            endDate: prevEndFormatted,
            ...options
          });
          break;
          
        // Handle other report types...
      }
      
      return {
        periodStart: prevStartFormatted,
        periodEnd: prevEndFormatted,
        data: previousData,
        comparison: {
          // Calculate percentage changes for key metrics
          // This will depend on the report type
        }
      };
    } catch (err) {
      console.error('Error calculating period comparison:', err);
      return null;
    }
  }, [fetchSales]);

  // Add a filtering function for report data
  const filterReportData = useCallback((filters = {}) => {
    if (!reportData) return null;
    
    const { searchTerm, minAmount, maxAmount, categories = [], paymentMethods = [] } = filters;
    
    try {
      switch (reportType) {
        case 'sales':
          let filteredSales = [...reportData.data];
          
          // Apply text search
          if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredSales = filteredSales.filter(sale => 
              sale.sale_id.toString().includes(term) ||
              sale.cashier_name?.toLowerCase().includes(term) ||
              sale.payment_method?.toLowerCase().includes(term)
            );
          }
          
          // Apply amount filters
          if (minAmount !== undefined) {
            filteredSales = filteredSales.filter(sale => 
              parseFloat(sale.total_amount) >= minAmount
            );
          }
          
          if (maxAmount !== undefined) {
            filteredSales = filteredSales.filter(sale => 
              parseFloat(sale.total_amount) <= maxAmount
            );
          }
          
          // Apply category filters
          if (categories.length > 0) {
            filteredSales = filteredSales.filter(sale => 
              sale.items.some(item => categories.includes(item.category))
            );
          }
          
          // Apply payment method filters
          if (paymentMethods.length > 0) {
            filteredSales = filteredSales.filter(sale => 
              paymentMethods.includes(sale.payment_method)
            );
          }
          
          // Recalculate summary metrics
          const totalSales = filteredSales.reduce(
            (sum, sale) => sum + parseFloat(sale.total_amount), 0
          );
          
          return {
            ...reportData,
            data: filteredSales,
            summary: {
              ...reportData.summary,
              totalSales,
              totalTransactions: filteredSales.length,
              averageOrderValue: filteredSales.length > 0 
                ? totalSales / filteredSales.length 
                : 0
            }
          };
          
        // Handle other report types...
          
        default:
          return reportData;
      }
    } catch (err) {
      console.error('Error filtering report data:', err);
      return reportData;
    }
  }, [reportData, reportType]);

  return {
    // State
    loading,
    error,
    reportData,
    reportType,
    dateRange,
    
    // Report generators
    generateSalesReport,
    generateInventoryReport,
    generateFinancialReport,
    generateCustomReport,
    
    // Export functionality
    exportReport,
    
    // Other helper functions
    setReportDateRange,
    getDateRangeOptions,
    getReportTemplates,
    clearReport,
    calculatePeriodComparison,
    filterReportData,
    scheduleReport
  };
};

export { useReports };
export default useReports;