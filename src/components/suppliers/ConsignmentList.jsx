import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import ConsignmentDetails from './ConsignmentDetails';

// Update the ConsignmentFilters component to match the SupplierList styling
const ConsignmentFilters = ({ filters, setFilters, suppliers }) => {
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
          placeholder="Search consignments..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="block w-full pl-10 pr-10 py-2 border border-[#571C1F]/20 rounded-md focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        {filters.search && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
          <option key={supplier.id || supplier.supplier_id} value={supplier.id || supplier.supplier_id}>
            {supplier.supplier_name || supplier.name}
          </option>
        ))}
      </select>

      {/* Date Range Filter */}
      <select
        id="dateRange"
        name="dateRange"
        className="block pl-3 pr-10 py-2 border border-[#571C1F]/20 rounded-md focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white w-40"
        value={filters.dateRange}
        onChange={e => setFilters({ ...filters, dateRange: e.target.value })}
        style={{ height: '42px' }}
      >
        <option value="all">All Time</option>
        <option value="today">Today</option>
        <option value="thisWeek">This Week</option>
        <option value="thisMonth">This Month</option>
        <option value="last30Days">Last 30 Days</option>
        <option value="last90Days">Last 90 Days</option>
      </select>
    </div>
  );
};

// Updated ConsignmentList component
const ConsignmentList = ({ 
  consignments = [], 
  suppliers = [],
  loading = false, 
  onEdit, 
  onDelete, 
  onRefresh,
  onAdd,  
  canManage = true,
  useExternalModals = false  
}) => {
  const [filteredConsignments, setFilteredConsignments] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    supplierId: '',
    dateRange: 'all'
  });
  
  const [sortConfig, setSortConfig] = useState({
    key: 'receivedDate',
    direction: 'desc'
  });
  
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentConsignment, setCurrentConsignment] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [consignmentToDelete, setConsignmentToDelete] = useState(null);

  // Apply filters and sorting to consignments list
  useEffect(() => {
    if (!consignments || consignments.length === 0) {
      setFilteredConsignments([]);
      return;
    }
    
    let result = [...consignments];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(item => 
        (item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(searchLower)) ||
        (item.referenceNumber && item.referenceNumber.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply supplier filter
    if (filters.supplierId) {
      result = result.filter(item => {
        const supplierId = typeof item.supplierId === 'number' ? 
                          item.supplierId.toString() : 
                          item.supplierId;
        return supplierId === filters.supplierId;
      });
    }
    
    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (filters.dateRange) {
        case 'today':
          result = result.filter(item => {
            const itemDate = new Date(item.receivedDate);
            return itemDate >= today;
          });
          break;
        case 'thisWeek':
          const firstDayOfWeek = new Date(today);
          firstDayOfWeek.setDate(today.getDate() - today.getDay());
          result = result.filter(item => {
            const itemDate = new Date(item.receivedDate);
            return itemDate >= firstDayOfWeek;
          });
          break;
        case 'thisMonth':
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          result = result.filter(item => {
            const itemDate = new Date(item.receivedDate);
            return itemDate >= firstDayOfMonth;
          });
          break;
        case 'last30Days':
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(today.getDate() - 30);
          result = result.filter(item => {
            const itemDate = new Date(item.receivedDate);
            return itemDate >= thirtyDaysAgo;
          });
          break;
        case 'last90Days':
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(today.getDate() - 90);
          result = result.filter(item => {
            const itemDate = new Date(item.receivedDate);
            return itemDate >= ninetyDaysAgo;
          });
          break;
        default:
          break;
      }
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle dates
        if (sortConfig.key === 'receivedDate' || sortConfig.key === 'dueDate') {
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
    
    setFilteredConsignments(result);
  }, [consignments, filters, sortConfig]);

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
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Handle new consignment button click - always use external modal via onAdd
  const handleNewConsignment = () => {
    if (onAdd) {
      onAdd();
    }
  };

  // Handle edit consignment button click - always use external modal via onEdit
  const handleEditConsignment = (consignment) => {
    if (onEdit) {
      onEdit(consignment.id);
    }
  };

  // Handle view consignment details
  const handleViewConsignment = (consignment) => {
    setCurrentConsignment(consignment);
    setShowDetailsModal(true);
  };

  // Handle delete click
  const handleDeleteClick = (consignment) => {
    setConsignmentToDelete(consignment);
    setConfirmDelete(true);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!consignmentToDelete) return;
    
    try {
      // Use the onDelete prop if provided
      if (onDelete) {
        await onDelete(consignmentToDelete.id);
      }
      
      setConfirmDelete(false);
      setConsignmentToDelete(null);
      toast.success('Consignment has been deleted');
      
      // Refresh the list
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error deleting consignment:', err);
      toast.error('Failed to delete consignment. Please try again.');
    }
  };

  // Get supplier name by ID
  const getSupplierName = (supplierId) => {
    const supplier = suppliers?.find(s => 
      s.id === supplierId || 
      s.supplier_id === supplierId ||
      s.id === Number(supplierId) ||
      s.supplier_id === Number(supplierId)
    );
    return supplier ? (supplier.supplier_name || supplier.name) : 'Unknown Supplier';
  };

  // Calculate total items in a consignment
  const calculateTotalItems = (consignment) => {
    if (!consignment || !consignment.items) return 0;
    return consignment.items.reduce((total, item) => total + Number(item.quantity || 0), 0);
  };

  // Calculate total value of a consignment
  const calculateTotalValue = (consignment) => {
    if (!consignment || !consignment.items) return 0;
    return consignment.items.reduce((total, item) => {
      return total + (Number(item.quantity || 0) * Number(item.unitPrice || 0));
    }, 0);
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
    if (amount === undefined || amount === null) return '₱0.00';
    
    try {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(amount);
    } catch (error) {
      return '₱0.00';
    }
  };

  // Add this function at the component level
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-[#003B25]/10 border border-[#003B25]/20 text-[#003B25]';
      case 'partial':
        return 'bg-amber-100 border border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800/30 dark:text-amber-300';
      case 'unpaid':
        return 'bg-[#571C1F]/10 border border-[#571C1F]/20 text-[#571C1F]';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading && (!consignments || consignments.length === 0)) {
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

  return (
    <div className="flex flex-col">
      {/* Filters */}
      <ConsignmentFilters 
        filters={filters} 
        setFilters={setFilters} 
        suppliers={suppliers || []} 
      />
      
      {/* Consignments Table */}
      <div className="overflow-x-auto">
        <div className="align-middle inline-block min-w-full">
          <div className="overflow-hidden border border-[#571C1F]/10 rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-[#571C1F] text-white">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('receivedDate')}
                  >
                    <div className="flex items-center">
                      <span>Received Date</span>
                      {getSortIndicator('receivedDate')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('invoiceNumber')}
                  >
                    <div className="flex items-center">
                      <span>Invoice</span>
                      {getSortIndicator('invoiceNumber')}
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
                    className="px-6 py-3 text-left justify-center text-xs font-semibold text-white uppercase tracking-wider"
                  >
                    Items
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left justify-center text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('totalAmount')}
                  >
                    <div className="flex items-left justify-start">
                      <span>Amount</span>
                      {getSortIndicator('totalAmount')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('paymentStatus')}
                  >
                    <div className="flex items-center justify-center">
                      <span>Status</span>
                      {getSortIndicator('paymentStatus')}
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
                {filteredConsignments.length > 0 ? (
                  filteredConsignments.map((consignment, index) => (
                    <motion.tr 
                      key={consignment.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="bg-white hover:bg-[#FFF6F2] dark:bg-dark-lighter dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => handleViewConsignment(consignment)}
                    >
                      {/* Table rows remain similar with updated styling */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#571C1F]">
                        {formatDate(consignment.receivedDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full border border-[#571C1F]/10 overflow-hidden bg-[#FFF6F2] mr-3">
                            <div className="h-10 w-10 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-[#571C1F]">
                              {consignment.invoiceNumber || 'No Invoice'}
                            </div>
                            {consignment.referenceNumber && (
                              <div className="text-xs text-gray-600 truncate max-w-xs">
                                Ref: {consignment.referenceNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#571C1F] dark:text-gray-600 font-medium">
                        {getSupplierName(consignment.supplierId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#571C1F] dark:text-gray-600 font-medium">
                        {calculateTotalItems(consignment)} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#571C1F] font-medium">
                        {formatCurrency(calculateTotalValue(consignment))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(consignment.paymentStatus)}`}>
                          <span className={`w-1.5 h-1.5 ${
                            consignment.paymentStatus === 'paid' 
                              ? 'bg-[#003B25]' 
                              : consignment.paymentStatus === 'partial'
                                ? 'bg-amber-500'
                                : 'bg-[#571C1F]'
                          } rounded-full mr-1`}></span>
                          {consignment.paymentStatus === 'paid' ? 'Paid' : 
                          consignment.paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
                        </span>
                        {consignment.dueDate && consignment.paymentStatus !== 'paid' && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Due: {formatDate(consignment.dueDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2" onClick={e => e.stopPropagation()}>
                          {canManage && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05, y: -1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEditConsignment(consignment)}
                                className="p-1.5 text-[#003B25] hover:text-[#003B25] hover:bg-[#003B25]/10 rounded-full transition"
                                aria-label="Edit consignment"
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </motion.button>
                              
                              <motion.button
                                whileHover={{ scale: 1.05, y: -1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeleteClick(consignment)}
                                className="p-1.5 text-[#571C1F] hover:text-[#571C1F] hover:bg-[#571C1F]/10 rounded-full transition"
                                aria-label="Delete consignment"
                                title="Delete"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </motion.button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
                          className="p-3 bg-[#FFF6F2] rounded-md border border-[#571C1F]/20 shadow-md mb-3 inline-flex"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        </motion.div>
                        {filters.search || filters.supplierId || filters.dateRange !== 'all' ? (
                          <>
                            <p className="text-[#571C1F] font-medium">No consignments match your filters</p>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setFilters({ search: '', supplierId: '', dateRange: 'all' })}
                              className="mt-2 text-[#571C1F] hover:text-[#571C1F]/80 font-medium px-3 py-1 rounded-md border border-[#571C1F]/30 hover:border-[#571C1F]/50 transition-all"
                            >
                              Clear filters
                            </motion.button>
                          </>
                        ) : (
                          <p className="text-[#571C1F] font-medium">No consignments found</p>
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

      {/* Results count with matching styling */}
      {!loading && filteredConsignments.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-xs flex items-center justify-between"
        >
          <span className="text-gray-800 dark:text-gray-600">
            Showing <span className="font-medium text-[#571C1F]">{filteredConsignments.length}</span> of <span className="font-medium text-[#571C1F]">{consignments.length}</span> consignments
          </span>
          <span className="text-[#571C1F]/70">
            {filters.search && `Search results for "${filters.search}"`}
          </span>
        </motion.div>
      )}

      {/* Consignment Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Consignment Details"
        size="lg"
      >
        {currentConsignment && (
          <ConsignmentDetails
            consignment={currentConsignment}
            supplier={suppliers.find(s => s.id === currentConsignment.supplierId)}
            onEdit={() => {
              setShowDetailsModal(false);
              handleEditConsignment(currentConsignment);
            }}
            onClose={() => setShowDetailsModal(false)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmDelete}
        onClose={() => {
          setConfirmDelete(false);
          setConsignmentToDelete(null);
        }}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this consignment record? This action cannot be undone.
          </p>
          {consignmentToDelete && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <div className="text-sm"><span className="font-medium">Invoice:</span> {consignmentToDelete.invoiceNumber || 'N/A'}</div>
              <div className="text-sm"><span className="font-medium">Supplier:</span> {getSupplierName(consignmentToDelete.supplierId)}</div>
              <div className="text-sm"><span className="font-medium">Date:</span> {formatDate(consignmentToDelete.receivedDate)}</div>
              <div className="text-sm"><span className="font-medium">Amount:</span> {formatCurrency(calculateTotalValue(consignmentToDelete))}</div>
            </div>
          )}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900 rounded p-3 text-sm text-yellow-800 dark:text-yellow-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Note: This will only delete the record, not adjust inventory levels.
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDelete(false);
                setConsignmentToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ConsignmentList;