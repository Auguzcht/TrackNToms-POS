import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useInventory } from '../../hooks/useInventory';
import { useSuppliers } from '../../hooks/useSuppliers';
import placeholderImage from '../../assets/placeholder-image2.png';

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

      {/* Supplier Filter - Match height with style={{ height: '42px' }} */}
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
          <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
        ))}
      </select>

      {/* Status Filter - Match height with style={{ height: '42px' }} */}
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
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
  );
};

const PurchaseOrderList = ({ onEdit, onDelete, canManageSuppliers, suppliers: propSuppliers }) => {
  const { 
    suppliers = propSuppliers || [], 
    loading: suppliersLoading, // Rename loading to suppliersLoading
    error, 
    purchaseOrders, 
    fetchPurchaseOrders, 
    deletePurchaseOrder 
  } = useSuppliers();
  const { loading: inventoryLoading, error: inventoryError } = useInventory();
  
  const [filteredPurchaseOrders, setFilteredPurchaseOrders] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    supplierId: '',
    status: ''
  });
  
  const [sortConfig, setSortConfig] = useState({
    key: 'orderDate',
    direction: 'desc'
  });
  
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPurchaseOrder, setCurrentPurchaseOrder] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [purchaseOrderToDelete, setPurchaseOrderToDelete] = useState(null);

  // Mock purchase orders data for display
  const mockPurchaseOrders = [
    {
      id: 1,
      orderNumber: 'PO-2023-001',
      supplierId: 1,
      orderDate: '2023-10-01',
      deliveryDate: '2023-10-15',
      status: 'completed',
      total: 12500.00,
      items: [
        { id: 1, name: 'Coffee Beans Arabica', quantity: 25, unit: 'kg', unitPrice: 500.00 }
      ]
    },
    {
      id: 2,
      orderNumber: 'PO-2023-002',
      supplierId: 2,
      orderDate: '2023-10-10',
      deliveryDate: null,
      status: 'pending',
      total: 8750.00,
      items: [
        { id: 1, name: 'Milk', quantity: 50, unit: 'L', unitPrice: 95.00 },
        { id: 2, name: 'Sugar', quantity: 30, unit: 'kg', unitPrice: 120.00 }
      ]
    },
    {
      id: 3,
      orderNumber: 'PO-2023-003',
      supplierId: 1,
      orderDate: '2023-09-15',
      deliveryDate: '2023-09-30',
      status: 'completed',
      total: 18750.00,
      items: [
        { id: 3, name: 'Coffee Beans Robusta', quantity: 25, unit: 'kg', unitPrice: 450.00 },
        { id: 4, name: 'Tea Leaves', quantity: 15, unit: 'kg', unitPrice: 600.00 }
      ]
    }
  ];

  // Load purchase orders when component mounts
  useEffect(() => {
    // Fetch real purchase orders data
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  // Apply filters and sorting to purchase orders list
  useEffect(() => {
    if (!purchaseOrders) {
      setFilteredPurchaseOrders([]);
      return;
    }
    
    // Start with actual purchase orders from API
    let result = [...purchaseOrders];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(item => 
        (item.purchase_id && item.purchase_id.toString().includes(searchLower))
      );
    }
    
    // Apply supplier filter
    if (filters.supplierId) {
      result = result.filter(item => item.supplier_id?.toString() === filters.supplierId);
    }
    
    // Apply status filter - requires adding status field to purchases table
    if (filters.status) {
      result = result.filter(item => item.status === filters.status);
    }
    
    // Apply sorting - updated field names to match database schema
    if (sortConfig.key) {
      result.sort((a, b) => {
        // Map frontend keys to database field names
        const keyMap = {
          'orderDate': 'purchase_date',
          'orderNumber': 'purchase_id', 
          'total': 'total_amount',
          'supplierId': 'supplier_id'
        };
        
        const dbKey = keyMap[sortConfig.key] || sortConfig.key;
        
        let aValue = a[dbKey];
        let bValue = b[dbKey];
        
        // Handle dates
        if (dbKey === 'purchase_date') {
          aValue = new Date(aValue || 0).getTime();
          bValue = new Date(bValue || 0).getTime();
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
  }, [purchaseOrders, filters, sortConfig]);

  // Handle sort click
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    
    return (
      <motion.span 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="ml-1 text-xs text-[#571C1F] inline-block"
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
  const handleDeleteClick = (purchaseOrder) => {
    setPurchaseOrderToDelete(purchaseOrder);
    setConfirmDelete(true);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!purchaseOrderToDelete) return;
    
    try {
      // Mock delete operation for now
      // await deletePurchaseOrder(purchaseOrderToDelete.id);
      setFilteredPurchaseOrders(prev => 
        prev.filter(po => po.id !== purchaseOrderToDelete.id)
      );
      toast.success('Purchase order has been deleted');
      setConfirmDelete(false);
      setPurchaseOrderToDelete(null);
    } catch (err) {
      console.error('Error deleting purchase order:', err);
      toast.error('Failed to delete purchase order. Please try again.');
    }
  };

  // Get supplier name by ID
  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Unknown Supplier';
  };

  // Calculate total items in a purchase order
  const calculateTotalItems = (purchaseOrder) => {
    return purchaseOrder.items?.reduce((total, item) => total + Number(item.quantity), 0) || 0;
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
    }).format(amount);
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-[#003B25]/10 border border-[#003B25]/20 text-[#003B25]';
      case 'pending':
        return 'bg-amber-100 border border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'cancelled':
        return 'bg-[#571C1F]/10 border border-[#571C1F]/20 text-[#571C1F]';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Image component with fallback
  const ImageWithFallback = ({ src, alt, className }) => {
    return (
      <div className={`overflow-hidden ${className}`}>
        <img 
          src={src || placeholderImage}
          alt={alt}
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = placeholderImage;
          }}
          className="h-full w-full object-cover"
        />
      </div>
    );
  };

  if (suppliersLoading || inventoryLoading) {
    return (
      <Card className="animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-[#571C1F]">Error Loading Purchase Orders</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error.message || 'Failed to load purchase order data. Please try again.'}</p>
          <div className="mt-6">
            <Button onClick={() => {/* fetchPurchaseOrders() */}}>Try Again</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Filters */}
      <PurchaseOrderFilters 
        filters={filters} 
        setFilters={setFilters} 
        suppliers={suppliers} 
      />
      
      {/* Table */}
      <div className="overflow-x-auto">
        <div className="align-middle inline-block min-w-full">
          <div className="overflow-hidden border border-[#571C1F]/10 rounded-lg shadow-md">
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
                {filteredPurchaseOrders.length > 0 ? (
                  filteredPurchaseOrders.map((po, index) => (
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
                          <div className="flex-shrink-0 h-10 w-10 rounded-full border border-[#571C1F]/10 overflow-hidden bg-[#FFF6F2] mr-3">
                            <ImageWithFallback
                              alt="PO document"
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium text-[#571C1F]">PO-{po.purchase_id.toString().padStart(4, '0')}</div>
                            <div className="text-xs text-gray-600 truncate max-w-xs">
                              {po.first_name} {po.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-600 font-medium">
                        {po.supplier_name || 'Not Specified'}
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
                                : 'bg-[#571C1F]'
                          } rounded-full mr-1`}></span>
                          {(po.status || 'pending').charAt(0).toUpperCase() + (po.status || 'pending').slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                        <div className="flex justify-end space-x-2" onClick={e => e.stopPropagation()}>
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
                          
                          <motion.button
                            whileHover={{ scale: 1.05, y: -1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onDelete(po.purchase_id)}
                            className="p-1.5 text-[#571C1F] hover:text-[#571C1F] hover:bg-[#571C1F]/10 rounded-full transition"
                            aria-label="Delete purchase order"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
                          className="p-3 bg-[#FFF6F2] rounded-md border border-[#571C1F]/20 shadow-md mb-3"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </motion.div>
                        {filters.search || filters.supplierId || filters.status ? (
                          <>
                            <p>No purchase orders match your filters</p>
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
                          <p>No purchase orders found</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {!suppliersLoading && filteredPurchaseOrders.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-xs flex items-center justify-between"
        >
          <span className="text-gray-800 dark:text-gray-600">
            Showing <span className="font-medium text-[#571C1F]">{filteredPurchaseOrders.length}</span> of <span className="font-medium text-[#571C1F]">{mockPurchaseOrders.length}</span> purchase orders
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
          title={`Purchase Order: ${currentPurchaseOrder.orderNumber}`}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Information</h4>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Order Date:</span>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-300">{formatDate(currentPurchaseOrder.orderDate)}</p>
                  </div>
                  {currentPurchaseOrder.deliveryDate && (
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Expected Delivery:</span>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-300">{formatDate(currentPurchaseOrder.deliveryDate)}</p>
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
                      {getSupplierName(currentPurchaseOrder.supplierId)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Total Amount:</span>
                    <p className="text-sm font-medium text-[#571C1F] dark:text-[#571C1F]">
                      {formatCurrency(currentPurchaseOrder.total)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Order Items Section */}
            <div className="pt-6 border-t border-[#571C1F]/10">
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
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {item.ingredient_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-center">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-center">
                          {item.ingredient_unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
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
                        {formatCurrency(currentPurchaseOrder.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
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
              {currentPurchaseOrder.status === 'pending' && (
                <Button 
                  variant="success" 
                  onClick={() => toast.info('Mark as received functionality coming soon!')}
                >
                  Mark as Received
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => toast.info('Print functionality coming soon!')}
              >
                Print PO
              </Button>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Delete Confirmation Modal */}
      {confirmDelete && purchaseOrderToDelete && (
        <Modal
          isOpen={confirmDelete}
          onClose={() => {
            setConfirmDelete(false);
            setPurchaseOrderToDelete(null);
          }}
          title="Confirm Delete"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-800 dark:text-gray-200">
              Are you sure you want to delete purchase order <span className="font-medium text-[#571C1F]">{purchaseOrderToDelete.orderNumber}</span>?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline"
                onClick={() => {
                  setConfirmDelete(false);
                  setPurchaseOrderToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="danger"
                onClick={handleDeleteConfirm}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PurchaseOrderList;