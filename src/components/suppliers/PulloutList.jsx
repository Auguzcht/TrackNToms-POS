import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import Swal from 'sweetalert2'; // Add this import
import PulloutForm from './PulloutForm';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useInventory } from '../../hooks/useInventory';

// Filter component for pullout list
const PulloutFilters = ({ filters, setFilters, ingredients }) => {
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
          placeholder="Search ingredient..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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

      {/* Ingredient Filter */}
      <select
        id="ingredient"
        name="ingredient"
        className="block pl-3 pr-10 py-2 border border-[#571C1F]/20 rounded-md focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white w-40"
        value={filters.ingredientId}
        onChange={e => setFilters({ ...filters, ingredientId: e.target.value })}
        style={{ height: '42px' }}
      >
        <option value="">All Ingredients</option>
        {ingredients.map(ingredient => (
          <option key={ingredient.ingredient_id} value={ingredient.ingredient_id}>
            {ingredient.name}
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

const PulloutList = ({ 
  pullouts = [], 
  ingredients = [],
  loading = false, 
  onEdit, 
  onDelete, 
  onRefresh,
  canManage = true,
  canApprovePullouts = false, // Add this prop
  useExternalModals = false,
  onAdd,
  currentUser = null
}) => {
  const [filteredPullouts, setFilteredPullouts] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    ingredientId: '',
    dateRange: 'all'
  });
  
  const [sortConfig, setSortConfig] = useState({
    key: 'date_of_pullout',
    direction: 'desc'
  });
  
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPullout, setCurrentPullout] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pulloutToDelete, setPulloutToDelete] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [pulloutToApprove, setPulloutToApprove] = useState(null);

  // Get the current user and permissions
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { approvePullout } = useInventory(); // Add this to get the approve function
  
  // Check permissions for approval
  const canApprove = canApprovePullouts || hasPermission('pullouts.approve');

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error('Invalid date:', dateString);
      return dateString;
    }
  };

  // Apply filters and sorting to pullouts list
  useEffect(() => {
    if (!pullouts || pullouts.length === 0) {
      setFilteredPullouts([]);
      return;
    }
    
    let result = [...pullouts];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(item => 
        (item.ingredientName && item.ingredientName.toLowerCase().includes(searchLower)) ||
        (item.staffName && item.staffName.toLowerCase().includes(searchLower)) ||
        (item.reason && item.reason.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply ingredient filter
    if (filters.ingredientId) {
      result = result.filter(item => item.ingredient_id.toString() === filters.ingredientId);
    }
    
    // Apply date filter
    if (filters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (filters.dateRange) {
        case 'today':
          result = result.filter(item => {
            const itemDate = new Date(item.date_of_pullout);
            itemDate.setHours(0, 0, 0, 0);
            return itemDate.getTime() === today.getTime();
          });
          break;
        case 'thisWeek':
          const firstDayOfWeek = new Date(today);
          firstDayOfWeek.setDate(today.getDate() - today.getDay());
          result = result.filter(item => {
            const itemDate = new Date(item.date_of_pullout);
            return itemDate >= firstDayOfWeek;
          });
          break;
        case 'thisMonth':
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          result = result.filter(item => {
            const itemDate = new Date(item.date_of_pullout);
            return itemDate >= firstDayOfMonth;
          });
          break;
        case 'last30Days':
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(today.getDate() - 30);
          result = result.filter(item => {
            const itemDate = new Date(item.date_of_pullout);
            return itemDate >= thirtyDaysAgo;
          });
          break;
        case 'last90Days':
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(today.getDate() - 90);
          result = result.filter(item => {
            const itemDate = new Date(item.date_of_pullout);
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
        if (sortConfig.key === 'date_of_pullout') {
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
    
    setFilteredPullouts(result);
  }, [pullouts, filters, sortConfig]);

  // Handle sort click
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key) {
      // If already sorted by this key, toggle direction
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
      }
    }
    
    // Map the UI sort key to database column name
    const columnMap = {
      'staff_id': 'requested_by',
      'manager_id': 'approved_by'
    };
    
    const actualKey = columnMap[key] || key;
    setSortConfig({ key: actualKey, direction });
  };

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Modify the handleNewPullout function
  const handleNewPullout = () => {
    if (useExternalModals) {
      // If using external modals (from SuppliersPage), call the parent's handler
      onAdd && onAdd();
    } else {
      // Otherwise use internal modal
      setCurrentPullout(null);
      setShowFormModal(true);
    }
  };

  // Modify the handleEditPullout function
  const handleEditPullout = (pullout) => {
    if (useExternalModals || onEdit) {
      // If using external modals or onEdit is provided
      onEdit && onEdit(pullout.pullout_id);
    } else {
      // Otherwise use internal modal
      setCurrentPullout(pullout);
      setShowFormModal(true);
    }
  };

  // Handle delete click
  const handleDeleteClick = (pullout) => {
    if (onDelete) {
      // If parent component provided an onDelete handler
      onDelete(pullout.pullout_id);
    } else {
      // Otherwise handle deletion internally
      setPulloutToDelete(pullout);
      setConfirmDelete(true);
    }
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!pulloutToDelete) return;
    
    try {
      // Use the onDelete prop if provided
      if (onDelete) {
        await onDelete(pulloutToDelete.pullout_id);
        toast.success('Pullout record has been deleted');
      }
      
      setConfirmDelete(false);
      setPulloutToDelete(null);
      
      // Refresh the list if onRefresh is available
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error deleting pullout record:', err);
      toast.error('Failed to delete pullout record. Please try again.');
    }
  };

  // Handle save pullout (create or update)
  const handleSavePullout = () => {
    setShowFormModal(false);
    // Refresh the list if onRefresh is available
    if (onRefresh) {
      onRefresh();
    }
  };

  // Approve pullout confirm
  const handleApproveConfirm = async () => {
    if (!pulloutToApprove) return;
    
    try {
      // Call the approvePullOut function - THIS WAS MISSING
      await approvePullout(
        pulloutToApprove.pullout_id, 
        user?.id || currentUser?.id
      );
      
      toast.success('Pullout request approved successfully');
      setShowApproveModal(false);
      setPulloutToApprove(null);
      
      // Refresh the list
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error approving pullout:', err);
      toast.error(`Failed to approve pullout: ${err.message}`);
      
      // Show more detailed error with SweetAlert
      Swal.fire({
        icon: 'error',
        title: 'Approval Error',
        text: err.message || 'Failed to approve pullout request'
      });
    }
  };

  // Add this function to handle the approve button click
  const handleApproveClick = (pullout) => {
    setPulloutToApprove(pullout);
    setShowApproveModal(true);
  };

  // Get ingredient name by ID
  const getIngredientName = (ingredientId) => {
    const ingredient = ingredients.find(i => i.ingredient_id === ingredientId);
    return ingredient ? ingredient.name : 'Unknown Ingredient';
  };

  // Get ingredient unit by ID
  const getIngredientUnit = (ingredientId) => {
    const ingredient = ingredients.find(i => i.ingredient_id === ingredientId);
    return ingredient ? ingredient.unit : '';
  };

  // Loading state display
  if (loading) {
    return (
      <Card>
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  // Only render the form modal if not using external modals
  const renderFormModal = () => {
    if (useExternalModals) return null;
    
    return (
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={currentPullout ? "Edit Pullout Record" : "New Pullout Request"}
        size="lg"
      >
        <PulloutForm
          pulloutId={currentPullout?.pullout_id}
          ingredients={ingredients}
          onSave={handleSavePullout}
          onCancel={() => setShowFormModal(false)}
        />
      </Modal>
    );
  };

  return (
    <div className="flex flex-col">
      {/* Filters */}
      <PulloutFilters 
        filters={filters} 
        setFilters={setFilters} 
        ingredients={ingredients}
      />
      
      {/* Pullouts Table */}
      <div className="overflow-x-auto">
        <div className="align-middle inline-block min-w-full">
          <div className="overflow-hidden border border-[#571C1F]/10 rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-[#571C1F] text-white">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('date_of_pullout')}
                  >
                    <div className="flex items-center">
                      <span>Date</span>
                      {getSortIndicator('date_of_pullout')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('ingredient_id')}
                  >
                    <div className="flex items-center">
                      <span>Ingredient</span>
                      {getSortIndicator('ingredient_id')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center">
                      <span>Quantity</span>
                      {getSortIndicator('quantity')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider"
                  >
                    <span>Reason</span>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('staff_id')}
                  >
                    <div className="flex items-center">
                      <span>Requested By</span>
                      {getSortIndicator('staff_id')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('manager_id')}
                  >
                    <div className="flex items-center">
                      <span>Approved By</span>
                      {getSortIndicator('manager_id')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-start">
                      <span>Status</span>
                      {getSortIndicator('status')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider"
                  >
                    <span>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-lighter divide-y divide-[#571C1F]/10 dark:divide-gray-700">
                {filteredPullouts.length > 0 ? (
                  filteredPullouts.map((pullout, index) => (
                    <motion.tr 
                      key={pullout.pullout_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="bg-white hover:bg-[#FFF6F2] dark:bg-dark-lighter dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#571C1F]">
                        {formatDate(pullout.date_of_pullout)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full border border-[#571C1F]/10 overflow-hidden bg-[#FFF6F2] mr-3">
                            {/* Replace this div and SVG with image */}
                            {(() => {
                              // Find the ingredient to get its image
                              const ingredient = ingredients.find(i => i.ingredient_id === pullout.ingredient_id);
                              const imageUrl = ingredient?.image;
                              
                              return imageUrl ? (
                                <img 
                                  src={imageUrl} 
                                  alt={pullout.ingredientName || getIngredientName(pullout.ingredient_id)}
                                  className="h-10 w-10 object-cover"
                                  onError={(e) => {
                                    // Fallback to default icon if image fails to load
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : (
                                <div className="h-10 w-10 flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </div>
                              );
                            })()}
                          </div>
                          <div className="font-medium text-[#571C1F]">
                            {pullout.ingredientName || getIngredientName(pullout.ingredient_id)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-600 font-medium">
                        {pullout.quantity} {pullout.unit || ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-600 font-medium">
                        <div className="max-w-xs truncate">
                          {pullout.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#571C1F] font-medium">
                        {pullout.staffName || `Staff #${pullout.staff_id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#571C1F] font-medium">
                        {pullout.approved_by ? (
                          pullout.managerName || `Approved by ${pullout.approved_by?.substring(0, 8)}...`
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#571C1F] font-medium">
                        {pullout.status === 'approved' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 border border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800/30 dark:text-green-300">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                            Approved
                          </span>
                        ) : pullout.status === 'rejected' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 border border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800/30 dark:text-red-300">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 border border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800/30 dark:text-amber-300">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1"></span>
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {canManage && (
                            <>
                              {/* Add Approve button for pending pullouts */}
                              {canApprove && pullout.status === 'pending' && (
                                <motion.button
                                  whileHover={{ scale: 1.05, y: -1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleApproveClick(pullout)}
                                  className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-full transition"
                                  aria-label="Approve pullout"
                                  title="Approve"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </motion.button>
                              )}
                              
                              <motion.button
                                whileHover={{ scale: 1.05, y: -1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEditPullout(pullout)}
                                className="p-1.5 text-[#003B25] hover:text-[#003B25] hover:bg-[#003B25]/10 rounded-full transition"
                                aria-label="Edit pullout"
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </motion.button>
                              
                              <motion.button
                                whileHover={{ scale: 1.05, y: -1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeleteClick(pullout)}
                                className="p-1.5 text-[#571C1F] hover:text-[#571C1F] hover:bg-[#571C1F]/10 rounded-full transition"
                                aria-label="Delete pullout"
                                title="Delete"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                    <td colSpan="8" className="px-6 py-10 text-center bg-white">
                      <div className="flex flex-col items-center justify-center">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
                          className="p-3 bg-[#FFF6F2] rounded-md border border-[#571C1F]/20 shadow-md mb-3 inline-flex"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </motion.div>
                        {filters.search || filters.ingredientId || filters.dateRange !== 'all' ? (
                          <>
                            <p className="text-[#571C1F] font-medium">No pullout records match your filters</p>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setFilters({ search: '', ingredientId: '', dateRange: 'all' })}
                              className="mt-2 text-[#571C1F] hover:text-[#571C1F]/80 font-medium px-3 py-1 rounded-md border border-[#571C1F]/30 hover:border-[#571C1F]/50 transition-all"
                            >
                              Clear filters
                            </motion.button>
                          </>
                        ) : (
                          <p className="text-[#571C1F] font-medium">No pullout records found</p>
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

      {/* Results count */}
      {!loading && filteredPullouts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-xs flex items-center justify-between"
        >
          <span className="text-gray-800 dark:text-gray-600">
            Showing <span className="font-medium text-[#571C1F]">{filteredPullouts.length}</span> of <span className="font-medium text-[#571C1F]">{pullouts.length}</span> pullout records
          </span>
          <span className="text-[#571C1F]/70">
            {filters.search && `Search results for "${filters.search}"`}
          </span>
        </motion.div>
      )}

      {renderFormModal()}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmDelete}
        onClose={() => {
          setConfirmDelete(false);
          setPulloutToDelete(null);
        }}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this pullout record? This action cannot be undone.
          </p>
          {pulloutToDelete && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <div className="text-sm"><span className="font-medium">Ingredient:</span> {pulloutToDelete.ingredientName || getIngredientName(pulloutToDelete.ingredient_id)}</div>
              <div className="text-sm"><span className="font-medium">Quantity:</span> {pulloutToDelete.quantity} {pulloutToDelete.unit || ''}</div>
              <div className="text-sm"><span className="font-medium">Date:</span> {formatDate(pulloutToDelete.date_of_pullout)}</div>
              <div className="text-sm"><span className="font-medium">Staff:</span> {pulloutToDelete.staffName || `Staff #${pulloutToDelete.staff_id}`}</div>
            </div>
          )}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900 rounded p-3 text-sm text-yellow-800 dark:text-yellow-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Note: This will permanently remove the record from inventory history.
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDelete(false);
                setPulloutToDelete(null);
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

      {/* Approval confirmation modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setPulloutToApprove(null);
        }}
        title="Confirm Approval"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to approve this pullout request? This will remove the specified quantity from inventory.
          </p>
          {pulloutToApprove && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <div className="text-sm"><span className="font-medium">Ingredient:</span> {pulloutToApprove.ingredientName || getIngredientName(pulloutToApprove.ingredient_id)}</div>
              <div className="text-sm"><span className="font-medium">Quantity:</span> {pulloutToApprove.quantity} {getIngredientUnit(pulloutToApprove.ingredient_id)}</div>
              <div className="text-sm"><span className="font-medium">Date:</span> {formatDate(pulloutToApprove.date_of_pullout)}</div>
              <div className="text-sm"><span className="font-medium">Requested by:</span> {pulloutToApprove.staffName || 'Unknown staff'}</div>
              <div className="text-sm"><span className="font-medium">Reason:</span> {pulloutToApprove.reason || 'No reason provided'}</div>
            </div>
          )}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded p-3 text-sm text-blue-800 dark:text-blue-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Note: Approving will permanently adjust the inventory quantities.
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveModal(false);
                setPulloutToApprove(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApproveConfirm}
            >
              Approve
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PulloutList;