import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useInventory } from '../../hooks/useInventory';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useAuth } from '../../hooks/useAuth';
import placeholderImage from '../../assets/placeholder-image2.png';
import ImageWithFallback from '../common/ImageWithFallback';

// Filter component for purchase orders list
const PurchaseOrderFilters = ({ filters, setFilters, suppliers }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-4 items-center">
      {/* Search Filter */}
      <div className="relative rounded-md shadow-sm max-w-xs flex-grow sm:flex-grow-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          name="search"
          id="search"
          className="block w-full pl-10 pr-10 py-2 border border-[#571C1F]/20 rounded-md focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Search reference..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        {filters.search && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
              className="text-gray-400 hover:text-[#571C1F] focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
        )}
      </div>

      {/* Supplier Filter */}
      <select
        id="supplier"
        name="supplier"
        className="block pl-3 pr-10 py-2 border border-[#571C1F]/20 rounded-md focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white w-40"
        value={filters.supplierId}
        onChange={e => setFilters({ ...filters, supplierId: e.target.value })}
        style={{ height: '42px' }}
      >
        <option value="">All Suppliers</option>
        {suppliers.map(supplier => (
          <option key={supplier.supplier_id} value={supplier.supplier_id}>
            {supplier.company_name}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        id="status"
        name="status"
        className="block pl-3 pr-10 py-2 border border-[#571C1F]/20 rounded-md focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white w-40"
        value={filters.status}
        onChange={e => setFilters({ ...filters, status: e.target.value })}
        style={{ height: '42px' }}
      >
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="completed">Completed</option>
        <option value="rejected">Rejected</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
  );
};

// Update the component structure to match SupplierList
const PurchaseOrderList = ({ 
  onEdit, 
  onDelete, 
  canManageSuppliers, 
  suppliers: propSuppliers,
  onAdd,
  loading: externalLoading
}) => {
  // Add the user from auth context
  const { user } = useAuth();

  // Add the acceptPurchaseOrder and rejectPurchaseOrder to the destructuring
  const { 
    suppliers = propSuppliers || [], 
    loading: suppliersLoading,
    error, 
    purchaseOrders, 
    fetchPurchaseOrders, 
    deletePurchaseOrder,
    markPurchaseReceived,
    approvePurchaseOrder,
    cancelPurchaseOrder
  } = useSuppliers();
  
  const [filteredPurchaseOrders, setFilteredPurchaseOrders] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    supplierId: '',
    status: ''
  });
  
  const [sortConfig, setSortConfig] = useState({
    key: 'purchase_date',
    direction: 'desc'
  });
  
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPurchaseOrder, setCurrentPurchaseOrder] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [purchaseOrderToDelete, setPurchaseOrderToDelete] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Loading state control - combine all loading sources
  const isLoading = suppliersLoading || externalLoading || processing;

  // Load purchase orders when component mounts
  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  // Apply filters and sorting to purchase orders list - keep existing logic
  useEffect(() => {
    if (!purchaseOrders) {
      setFilteredPurchaseOrders([]);
      return;
    }
    
    // Use a small timeout for smooth transition
    setTimeout(() => {
      // Start with all purchase orders
      let result = [...purchaseOrders];
      
      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(item => 
          (item.purchase_id && item.purchase_id.toString().includes(searchLower)) ||
          (item.supplier_name && item.supplier_name.toLowerCase().includes(searchLower)) ||
          (item.staff_name && item.staff_name.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply supplier filter
      if (filters.supplierId) {
        result = result.filter(item => item.supplier_id?.toString() === filters.supplierId);
      }
      
      // Apply status filter
      if (filters.status) {
        result = result.filter(item => (item.status || 'pending').toLowerCase() === filters.status.toLowerCase());
      }
      
      // Apply sorting
      if (sortConfig.key) {
        result.sort((a, b) => {
          let aValue, bValue;
          
          if (sortConfig.key === 'orderDate') {
            aValue = new Date(a.purchase_date || 0).getTime();
            bValue = new Date(b.purchase_date || 0).getTime();
          } else if (sortConfig.key === 'orderNumber') {
            aValue = parseInt(a.purchase_id || 0);
            bValue = parseInt(b.purchase_id || 0);
          } else if (sortConfig.key === 'supplierId') {
            aValue = a.supplier_name || '';
            bValue = b.supplier_name || '';
          } else if (sortConfig.key === 'total') {
            aValue = parseFloat(a.total_amount || 0);
            bValue = parseFloat(b.total_amount || 0);
          } else if (sortConfig.key === 'status') {
            aValue = a.status || '';
            bValue = b.status || '';
          } else {
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
          }
          
          if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }
      
      setFilteredPurchaseOrders(result);
    }, 50);
  }, [purchaseOrders, filters, sortConfig]);

  // Handle sort click
  const handleSort = (key) => {
    // Map frontend keys to database field names
    const keyMap = {
      'orderDate': 'purchase_date',
      'orderNumber': 'purchase_id', 
      'total': 'total_amount',
      'supplierId': 'supplier_id',
      'status': 'status'
    };
    
    const dbKey = keyMap[key] || key;
    
    let direction = 'asc';
    if (sortConfig.key === dbKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: dbKey, direction });
  };

  // Get sort indicator
  const getSortIndicator = (key) => {
    // Map frontend keys to database field names
    const keyMap = {
      'orderDate': 'purchase_date',
      'orderNumber': 'purchase_id', 
      'total': 'total_amount',
      'supplierId': 'supplier_id',
      'status': 'status'
    };
    
    const dbKey = keyMap[key] || key;
    
    if (sortConfig.key !== dbKey) return null;
    
    return (
      <motion.span 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="ml-1 text-xs text-white inline-block"
      >
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </motion.span>
    );
  };

  // Handle view purchase order details
  const handleViewPurchaseOrder = (purchaseOrder) => {
    setCurrentPurchaseOrder(purchaseOrder);
    setShowDetailsModal(true);
  };

  // Handle delete click
  const handleDeleteClick = (purchaseOrderId) => {
    const order = purchaseOrders.find(po => po.purchase_id === purchaseOrderId);
    if (order) {
      setPurchaseOrderToDelete(order);
      setConfirmDelete(true);
    }
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!purchaseOrderToDelete) return;
    
    setProcessing(true);
    try {
      // Call cancelPurchaseOrder instead of deletePurchaseOrder
      await cancelPurchaseOrder(purchaseOrderToDelete.purchase_id);
      toast.success('Purchase order cancelled');
      setConfirmDelete(false);
      setPurchaseOrderToDelete(null);
      // Refresh purchase orders list
      fetchPurchaseOrders();
    } catch (err) {
      console.error('Error cancelling purchase order:', err);
      toast.error(`Failed to cancel order: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };
  
  // Handle mark as received
  const handleMarkReceived = async (purchaseId) => {
    setProcessing(true);
    try {
      await markPurchaseReceived(purchaseId);
      toast.success('Purchase order marked as received');
      setShowDetailsModal(false);
      // Refresh purchase orders list
      fetchPurchaseOrders();
    } catch (err) {
      console.error('Error marking purchase order as received:', err);
      toast.error(`Failed to mark as received: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Handle approve purchase order
  const handleApproveOrder = async (purchaseId) => {
    setProcessing(true);
    try {
      // Call the approvePurchaseOrder method from useSuppliers
      await approvePurchaseOrder(purchaseId);
      toast.success('Purchase order approved');
      // Refresh purchase orders list
      fetchPurchaseOrders();
    } catch (err) {
      console.error('Error approving purchase order:', err);
      toast.error(`Failed to approve order: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Handle supplier accept purchase order
  const handleAcceptOrder = async (purchaseId) => {
    setProcessing(true);
    try {
      // Import supabase at the top of the file if not already there
      // import supabase from '../../services/supabase';
      
      const { data: purchase } = await supabase
        .from('purchase')
        .select('*')
        .eq('purchase_id', purchaseId)
        .single();
        
      if (!purchase) {
        throw new Error('Purchase order not found');
      }
      
      if (purchase.status !== 'approved') {
        throw new Error('Only approved purchase orders can be accepted');
      }
      
      const { error: updateError } = await supabase
        .from('purchase')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString() 
        })
        .eq('purchase_id', purchaseId);
      
      if (updateError) throw updateError;
      
      // Notify staff that created the purchase order
      if (purchase.created_by) {
        await supabase.rpc('create_notification', {
          p_user_id: purchase.created_by,
          p_title: 'Purchase Order Accepted',
          p_message: `Purchase order #${purchaseId} has been accepted by supplier`,
          p_link: `/suppliers?tab=purchase-orders&id=${purchaseId}`
        });
      }
      
      toast.success('Purchase order accepted');
      fetchPurchaseOrders();
      
      if (showDetailsModal) {
        setShowDetailsModal(false);
      }
    } catch (err) {
      console.error('Error accepting purchase order:', err);
      toast.error(`Failed to accept order: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Handle supplier reject purchase order
  const handleRejectOrder = async (purchaseId, reason) => {
    setProcessing(true);
    try {
      // Call the rejectPurchaseOrder method from useSuppliers
      await rejectPurchaseOrder(purchaseId, user?.supplier_id, reason);
      toast.success('Purchase order rejected');
      // Refresh purchase orders list
      fetchPurchaseOrders();
    } catch (err) {
      console.error('Error rejecting purchase order:', err);
      toast.error(`Failed to reject order: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Format date with fallback
  const formatDate = (dateString, fallback = '-') => {
    if (!dateString) return fallback;
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return fallback;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-[#003B25]/10 border border-[#003B25]/20 text-[#003B25]';
      case 'pending':
        return 'bg-amber-100 border border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'approved':
        return 'bg-blue-100 border border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'rejected':
      case 'cancelled':
        return 'bg-[#571C1F]/10 border border-[#571C1F]/20 text-[#571C1F]';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="flex flex-col">
      {/* Filters */}
      <PurchaseOrderFilters 
        filters={filters} 
        setFilters={setFilters} 
        suppliers={suppliers} 
      />
      
      {/* Enhanced table container with subtle shadow - like in SupplierList */}
      <div className="overflow-x-auto">
        <div className="align-middle inline-block min-w-full">
          <div className="overflow-hidden border border-[#571C1F]/10 rounded-lg shadow-md">
            {isLoading ? (
              // Loading state - consistent with SupplierList
              <div className="px-6 py-4">
                <div className="animate-pulse space-y-4">
                  {Array(5).fill(0).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredPurchaseOrders.length === 0 ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-[#571C1F] text-white">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Order Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">PO Number</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Supplier</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">Items</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">Total</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
                        className="p-3 bg-[#FFF6F2] rounded-md border border-[#571C1F]/20 shadow-md mb-3 inline-flex"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </motion.div>
                      {filters.search || filters.supplierId || filters.status ? (
                        <>
                          <p className="text-[#571C1F] font-medium">No purchase orders match your filters</p>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFilters({ search: '', supplierId: '', status: '' })}
                            className="mt-2 text-[#571C1F] hover:text-[#571C1F]/80 font-medium px-3 py-1 rounded-md border border-[#571C1F]/30 hover:border-[#571C1F]/50 transition-all"
                          >
                            Clear filters
                          </motion.button>
                        </>
                      ) : (
                        <p className="text-[#571C1F] font-medium">No purchase orders found</p>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              // Regular table - keep existing structure but with smoother animations
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-[#571C1F] text-white">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('orderDate')}
                    >
                      <div className="flex items-center">
                        <span>Order Date</span>
                        {getSortIndicator('orderDate')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('orderNumber')}
                    >
                      <div className="flex items-center">
                        <span>PO Number</span>
                        {getSortIndicator('orderNumber')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('supplierId')}
                    >
                      <div className="flex items-center">
                        <span>Supplier</span>
                        {getSortIndicator('supplierId')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider"
                    >
                      <span>Items</span>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('total')}
                    >
                      <div className="flex items-right justify-center">
                        <span>Total</span>
                        {getSortIndicator('total')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center justify-center">
                        <span>Status</span>
                        {getSortIndicator('status')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-lighter divide-y divide-[#571C1F]/10 dark:divide-gray-700">
                  {filteredPurchaseOrders.map((po, index) => (
                    <motion.tr 
                      key={po.purchase_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="bg-white hover:bg-[#FFF6F2] dark:bg-dark-lighter dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={(e) => {
                        if (e.target.closest('button')) return;
                        handleViewPurchaseOrder(po);
                      }}
                    >
                      <td className="px-6 py-4 text-sm text-[#571C1F]">
                        {formatDate(po.purchase_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="font-medium text-[#571C1F]">PO-{po.purchase_id.toString().padStart(4, '0')}</div>
                            <div className="text-xs text-gray-600 truncate max-w-xs">
                              {po.staff_name || 'Unknown Staff'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-600 font-medium">
                        {po.supplier_name || 'Unknown Supplier'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-600 font-medium text-center">
                        {po.items?.length || 0} items
                      </td>
                      <td className="px-6 py-4 text-sm text-[#571C1F] dark:text-[#571C1F] font-medium text-center">
                        {formatCurrency(po.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(po.status || 'pending')}`}>
                          <span className={`w-1.5 h-1.5 ${
                            (po.status || 'pending') === 'completed' 
                              ? 'bg-[#003B25]' 
                              : (po.status || 'pending') === 'pending'
                                ? 'bg-amber-500'
                                : (po.status || 'pending') === 'approved'
                                  ? 'bg-blue-500'
                                  : 'bg-[#571C1F]'
                          } rounded-full mr-1`}></span>
                          {(po.status || 'pending').charAt(0).toUpperCase() + (po.status || 'pending').slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                        <div className="flex justify-end space-x-2" onClick={e => e.stopPropagation()}>
                          {/* Manager approve button - only for pending orders */}
                          {canManageSuppliers && po.status === 'pending' && (
                            <motion.button
                              whileHover={{ scale: 1.05, y: -1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleApproveOrder(po.purchase_id)}
                              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-full transition"
                              aria-label="Approve purchase order"
                              title="Approve"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </motion.button>
                          )}
                          
                          {/* Edit button - only for pending orders */}
                          {po.status === 'pending' && (
                            <motion.button
                              whileHover={{ scale: 1.05, y: -1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onEdit(po.purchase_id)}
                              className="p-1.5 text-[#003B25] hover:text-[#003B25] hover:bg-[#003B25]/10 rounded-full transition"
                              aria-label="Edit purchase order"
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </motion.button>
                          )}
                          
                          {/* Cancel button - only for pending and approved purchase orders */}
                          {(po.status === 'pending' || po.status === 'approved') && (
                            <motion.button
                              whileHover={{ scale: 1.05, y: -1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCancelOrder(po.purchase_id)}
                              className="p-1.5 text-[#571C1F] hover:text-[#571C1F] hover:bg-[#571C1F]/10 rounded-full transition"
                              aria-label="Cancel purchase order"
                              title="Cancel"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      {/* Results count - like in SupplierList */}
      {!isLoading && filteredPurchaseOrders.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-xs flex items-center justify-between"
        >
          <span className="text-gray-800 dark:text-gray-600">
            Showing <span className="font-medium text-[#571C1F]">{filteredPurchaseOrders.length}</span> of <span className="font-medium text-[#571C1F]">{purchaseOrders.length}</span> purchase orders
          </span>
          <span className="text-[#571C1F]/70">
            {filters.search && `Search results for "${filters.search}"`}
          </span>
        </motion.div>
      )}

      {/* Purchase Order Details Modal */}
      {showDetailsModal && currentPurchaseOrder && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={`Purchase Order: PO-${currentPurchaseOrder.purchase_id.toString().padStart(4, '0')}`}
          size="lg" // Changed from default to "lg" for a larger modal
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Information</h4>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Order Date:</span>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-300">{formatDate(currentPurchaseOrder.purchase_date)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Created By:</span>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-300">
                      {currentPurchaseOrder.staff_name || 'Unknown Staff'}
                    </p>
                  </div>
                  {currentPurchaseOrder.status === 'completed' && (
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Approved By:</span>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-300">
                        {currentPurchaseOrder.manager_name || 'Unknown Manager'}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(currentPurchaseOrder.status)}`}>
                    <span className={`w-1.5 h-1.5 ${
                        currentPurchaseOrder.status === 'completed' 
                          ? 'bg-[#003B25]' 
                          : currentPurchaseOrder.status === 'pending'
                            ? 'bg-amber-500'
                            : currentPurchaseOrder.status === 'approved'
                              ? 'bg-blue-500'
                              : 'bg-[#571C1F]'
                      } rounded-full mr-1`}></span>
                      {currentPurchaseOrder.status.charAt(0).toUpperCase() + currentPurchaseOrder.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Supplier Details</h4>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Supplier:</span>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-300">
                      {currentPurchaseOrder.supplier_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Total Amount:</span>
                    <p className="text-sm font-medium text-[#571C1F] dark:text-[#571C1F]">
                      {formatCurrency(currentPurchaseOrder.total_amount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Order Items Section */}
            <div className="pt-6">
              <div className="bg-white rounded-lg border border-[#571C1F]/10 p-4 shadow-sm">
                <h4 className="text-lg font-medium text-[#571C1F] mb-3">Order Items</h4>
                <div className="overflow-x-auto border border-[#571C1F]/10 rounded-lg">
                  <table className="min-w-full divide-y divide-[#571C1F]/10">
                    <thead className="bg-[#FFF6F2]">
                      <tr className="text-left text-sm">
                        <th scope="col" className="px-4 py-3 text-xs font-medium text-[#571C1F]/70 uppercase tracking-wider">
                          Item
                        </th>
                        <th scope="col" className="px-4 py-3 text-xs font-medium text-[#571C1F]/70 uppercase tracking-wider text-center">
                          Quantity
                        </th>
                        <th scope="col" className="px-4 py-3 text-xs font-medium text-[#571C1F]/70 uppercase tracking-wider text-center">
                          Unit
                        </th>
                        <th scope="col" className="px-4 py-3 text-xs font-medium text-[#571C1F]/70 uppercase tracking-wider text-right">
                          Unit Price
                        </th>
                        <th scope="col" className="px-4 py-3 text-xs font-medium text-[#571C1F]/70 uppercase tracking-wider text-right">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#571C1F]/10">
                      {currentPurchaseOrder.items && currentPurchaseOrder.items.map((item, idx) => (
                        <tr key={`${item.ingredient_id}-${idx}`} className="hover:bg-[#FFF6F2]/50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {item.ingredient_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium text-center">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium text-center">
                            {item.ingredient_unit}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#571C1F] font-medium text-right">
                            {formatCurrency(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#FFF6F2]/50">
                      <tr>
                        <th scope="row" colSpan="4" className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                          Total:
                        </th>
                        <td className="px-4 py-3 text-sm font-bold text-[#571C1F] text-right">
                          {formatCurrency(currentPurchaseOrder.total_amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Notes Section - only show if there are notes */}
            {currentPurchaseOrder.notes && (
              <div className="pt-4 border-t border-[#571C1F]/10">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notes</h4>
                <div className="bg-[#FFF6F2]/50 p-4 rounded-md text-sm text-gray-800 dark:text-gray-300 whitespace-pre-line">
                  {currentPurchaseOrder.notes}
                </div>
              </div>
            )}
            
            {/* Actions Section */}
            <div className="pt-4 border-t border-[#571C1F]/10 flex justify-end space-x-3">
              {/* Only allow marking as received for approved purchase orders */}
              {currentPurchaseOrder.status === 'approved' && canManageSuppliers && (
                <Button 
                  variant="success" 
                  onClick={() => handleMarkReceived(currentPurchaseOrder.purchase_id)}
                  disabled={processing}
                >
                  {processing ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>Mark as Received</>
                  )}
                </Button>
              )}
              
              {/* Supplier Actions Section - only show for suppliers viewing approved orders */}
              {currentPurchaseOrder.status === 'approved' && user?.role === 'Supplier' && (
                <>
                  <Button 
                    variant="success" 
                    onClick={() => handleAcceptOrder(currentPurchaseOrder.purchase_id)}
                    disabled={processing}
                    className="flex items-center"
                  >
                    {processing ? (
                      <span className="flex items-center">
                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Accept
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="danger"
                    onClick={() => {
                      Swal.fire({
                        title: 'Reject Order?',
                        text: "Please provide a reason for rejecting this order",
                        input: 'textarea',
                        inputPlaceholder: 'Reason for rejection...',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#571C1F',
                        cancelButtonColor: '#6B7280',
                        confirmButtonText: 'Reject Order'
                      }).then((result) => {
                        if (result.isConfirmed) {
                          handleRejectOrder(currentPurchaseOrder.purchase_id, result.value);
                          setShowDetailsModal(false);
                        }
                      });
                    }}
                    disabled={processing}
                    className="flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </Button>
                </>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Cancel Confirmation Modal */}
      {confirmDelete && purchaseOrderToDelete && (
        <Modal
          isOpen={confirmDelete}
          onClose={() => {
            setConfirmDelete(false);
            setPurchaseOrderToDelete(null);
          }}
          title="Confirm Cancellation"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-800 dark:text-gray-200">
              Are you sure you want to cancel purchase order <span className="font-medium text-[#571C1F]">PO-{purchaseOrderToDelete.purchase_id.toString().padStart(4, '0')}</span>?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This action will mark the order as cancelled.
            </p>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline"
                onClick={() => {
                  setConfirmDelete(false);
                  setPurchaseOrderToDelete(null);
                }}
                disabled={processing}
              >
                No, Keep Order
              </Button>
              <Button 
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={processing}
              >
                {processing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Yes, Cancel Order
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PurchaseOrderList;