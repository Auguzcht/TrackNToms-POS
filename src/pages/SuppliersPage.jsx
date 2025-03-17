import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router-dom';

// Import supplier components
import SupplierList from '../components/suppliers/SupplierList';
import ConsignmentList from '../components/suppliers/ConsignmentList';
import PurchaseOrderList from '../components/suppliers/PurchaseOrderList';
import PulloutList from '../components/suppliers/PulloutList';
import SupplierForm from '../components/suppliers/SupplierForm';
import ConsignmentForm from '../components/suppliers/ConsignmentForm';
import PulloutForm from '../components/suppliers/PulloutForm';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

// Import hooks
import { useAuth } from '../hooks/useAuth';
import { useSuppliers } from '../hooks/useSuppliers';
import { useInventory } from '../hooks/useInventory';

const SuppliersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    loading: suppliersLoading, 
    error: suppliersError,
    suppliers, 
    fetchSuppliers, 
    deleteSupplier,
    consignments, 
    fetchConsignments,
    deleteConsignment,
    // Add purchase orders functionality
    purchaseOrders,
    fetchPurchaseOrders,
    deletePurchaseOrder
  } = useSuppliers();
  
  // Add inventory hook for pulling data related to pullouts
  const {
    loading: inventoryLoading,
    error: inventoryError,
    ingredients,
    pullouts,
    fetchPullouts,
    fetchIngredients,
    deletePullout
  } = useInventory();

  // Get tab from URL query parameter or default to 'suppliers'
  const getTabFromURL = () => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    return tab || 'suppliers';
  };

  // State management
  const [activeTab, setActiveTab] = useState(getTabFromURL());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'supplier', 'consignment', 'purchase-order', 'pullout'
  const [editingId, setEditingId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pageError, setPageError] = useState(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [iconHovered, setIconHovered] = useState(false);

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getTabFromURL());
  }, [location.search]);

  // Set background color when the component mounts and restore when unmounting
  useEffect(() => {
    const originalBgColor = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#FFF6F2';
    
    return () => {
      document.body.style.backgroundColor = originalBgColor;
    };
  }, []);

  // Check if user has permissions to manage suppliers/inventory
  const canManageSuppliers = user?.role === 'Manager' || user?.permissions?.includes('suppliers.manage');
  const canManagePullouts = user?.role === 'Manager' || user?.permissions?.includes('inventory.manage');
  // Allow cashiers to create pullout requests but only managers can approve
  const canCreatePullouts = canManagePullouts || user?.role === 'Cashier';

  // Memoized data loading function to prevent unnecessary recreations
  const loadData = useCallback(async () => {
    setPageLoading(true);
    setPageError(null);
    
    try {
      switch (activeTab) {
        case 'suppliers':
          console.log('Fetching suppliers data...');
          const suppliersData = await fetchSuppliers();
          console.log(`Retrieved ${suppliersData.length} suppliers`);
          break;
        case 'consignments':
          console.log('Fetching consignments and suppliers data...');
          // When consignments tab is active, we need both suppliers and consignments
          const [suppliersResult, consignmentsResult] = await Promise.all([
            fetchSuppliers(),
            fetchConsignments()
          ]);
          console.log(`Retrieved ${suppliersResult.length} suppliers and ${consignmentsResult.length} consignments`);
          break;
        case 'purchase-orders':
          console.log('Fetching purchase orders and suppliers data...');
          // Fetch both suppliers and purchase orders when on purchase orders tab
          const [suppliersForPO, purchaseOrdersResult] = await Promise.all([
            fetchSuppliers(),
            fetchPurchaseOrders()
          ]);
          console.log(`Retrieved ${suppliersForPO.length} suppliers and ${purchaseOrdersResult.length} purchase orders`);
          break;
        case 'pullouts':
          console.log('Fetching pullouts and ingredients data...');
          // Fetch both pullouts and ingredients for the pullout page
          const [pulloutsResult, ingredientsResult] = await Promise.all([
            fetchPullouts(),
            fetchIngredients()
          ]);
          console.log(`Retrieved ${pulloutsResult.length} pullouts and ${ingredientsResult.length} ingredients`);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error(`Error loading ${activeTab} data:`, err);
      setPageError(err.message || `Failed to load ${activeTab} data`);
      toast.error(`Could not load ${activeTab}. ${err.message || 'Please try again.'}`);
    } finally {
      setPageLoading(false);
    }
  }, [activeTab, fetchSuppliers, fetchConsignments, fetchPurchaseOrders, fetchPullouts, fetchIngredients]);

  // Initial data fetch
  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  // Modal handling functions
  const openAddModal = (type) => {
    setModalType(type);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (type, id) => {
    console.log(`Opening ${type} edit modal with ID:`, id, typeof id);
    
    // Ensure id is not undefined
    if (id === undefined || id === null) {
      console.error(`Attempted to edit ${type} with invalid ID:`, id);
      toast.error(`Cannot edit ${type}: Invalid ID`);
      return;
    }
    
    // Convert string IDs to numbers for consistency with database
    if (typeof id === 'string') {
      id = parseInt(id, 10);
      if (isNaN(id)) {
        console.error(`Invalid ${type} ID format:`, id);
        toast.error(`Cannot edit ${type}: Invalid ID format`);
        return;
      }
    }
    
    setModalType(type);
    setEditingId(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    // First set isModalOpen to false to trigger animation
    setIsModalOpen(false);
    
    // Then clear the other state after animation completes
    setTimeout(() => {
      setModalType(null);
      setEditingId(null);
    }, 300);
  };

  const handleSave = (data) => {
    closeModal();
    // Trigger refresh of the data
    setRefreshTrigger(prev => prev + 1);
    toast.success(`${modalType === 'supplier' ? 'Supplier' : 
                   modalType === 'consignment' ? 'Consignment' :
                   modalType === 'pullout' ? 'Pullout' : 'Purchase Order'} saved successfully!`);
    return data;
  };

  const handleDelete = async (type, id) => {
    if (!id) return;
    
    try {
      // Convert string IDs to numbers for consistency with database
      if (typeof id === 'string') {
        id = parseInt(id, 10);
        if (isNaN(id)) {
          throw new Error(`Invalid ${type} ID format`);
        }
      }
      
      // Use SweetAlert2 for confirmation
      const confirmResult = await Swal.fire({
        title: 'Are you sure?',
        text: `This ${type} will be permanently deleted.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#571C1F',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, delete it!'
      });
      
      if (!confirmResult.isConfirmed) {
        return;
      }
      
      setPageLoading(true);
      
      if (type === 'supplier') {
        await deleteSupplier(id);
        toast.success('Supplier deleted successfully');
      } else if (type === 'consignment') {
        await deleteConsignment(id);
        toast.success('Consignment deleted successfully');
      } else if (type === 'purchase-order') {
        await deletePurchaseOrder(id);
        toast.success('Purchase order deleted successfully');
      } else if (type === 'pullout') {
        await deletePullout(id);
        toast.success('Pullout record deleted successfully');
      }
      
      // Refresh the list
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast.error(`Failed to delete ${type}. ${error.message || 'Please try again.'}`);
    } finally {
      setPageLoading(false);
    }
  };

  // Render modal content based on type
  const renderModalContent = () => {
    if (!isModalOpen) return null;
    
    console.log(`Rendering modal content: type=${modalType}, id=${editingId}, isOpen=${isModalOpen}`);
    
    if (modalType === 'supplier') {
      return (
        <SupplierForm 
          key={`supplier-${editingId || 'new'}`} // Force remount when ID changes
          supplierId={editingId} 
          onSave={handleSave} 
          onCancel={closeModal}
        />
      );
    }
    
    if (modalType === 'consignment') {
      return (
        <ConsignmentForm 
          key={`consignment-${editingId || 'new'}`} // Force remount when ID changes
          consignmentId={editingId} 
          suppliers={suppliers || []}
          onSave={handleSave}
          onCancel={closeModal}
        />
      );
    } else if (modalType === 'purchase-order') {
      // Add purchase order form when implemented
      return (
        <div className="p-4 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-[#571C1F] mb-2">Purchase Order Form</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            This feature is coming soon. You'll be able to create and manage purchase orders.
          </p>
          <Button variant="outline" onClick={closeModal}>Close</Button>
        </div>
      );
    } else if (modalType === 'pullout') {
      return (
        <PulloutForm 
          key={`pullout-${editingId || 'new'}`} // Force remount when ID changes
          pulloutId={editingId}
          ingredients={ingredients || []}
          onSave={handleSave}
          onCancel={closeModal}
          currentUser={user}
        />
      );
    }
    
    return null;
  };

  // Get modal title based on type and whether adding or editing
  const getModalTitle = () => {
    if (!modalType) return '';
    
    switch (modalType) {
      case 'supplier':
        return editingId ? 'Edit Supplier' : 'Add New Supplier';
      case 'consignment':
        return editingId ? 'Edit Consignment' : 'New Consignment';
      case 'purchase-order':
        return editingId ? 'Edit Purchase Order' : 'New Purchase Order';
      case 'pullout':
        return editingId ? 'Edit Pullout Record' : 'New Ingredient Pullout';
      default:
        return '';
    }
  };

  // Get modal size based on type
  const getModalSize = () => {
    switch (modalType) {
      case 'pullout':
        return 'lg'; // Changed from '2xl' to 'lg'
      case 'supplier':
        return '4xl'; // Larger size for supplier form
      case 'consignment':
        return '4xl'; // Larger size for consignment form
      case 'purchase-order':
        return '3xl'; // Medium-large size for purchase orders
      default:
        return '2xl'; // Default size
    }
  };

  // Get modal variant based on type
  const getModalVariant = () => {
    switch (modalType) {
      case 'supplier':
        return 'primary';
      case 'consignment':
        return 'secondary';
      case 'pullout':
        return 'primary';
      case 'purchase-order':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Determine if there's an error to show
  const error = suppliersError || inventoryError || pageError;
  const loading = suppliersLoading || inventoryLoading;

  // Get icon based on active tab
  const getTabIcon = () => {
    switch (activeTab) {
      case 'suppliers':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'purchase-orders':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'consignments':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        );
      case 'pullouts':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Get tab title based on active tab
  const getTabTitle = () => {
    switch (activeTab) {
      case 'suppliers':
        return 'Suppliers';
      case 'purchase-orders':
        return 'Purchase Orders';
      case 'consignments':
        return 'Consignments';
      case 'pullouts':
        return 'Pullouts';
      default:
        return '';
    }
  };

  // Get button label based on active tab
  const getAddButtonLabel = () => {
    switch (activeTab) {
      case 'suppliers':
        return 'Add Supplier';
      case 'purchase-orders':
        return 'New Order';
      case 'consignments':
        return 'Add Consignment';
      case 'pullouts':
        return 'New Pullout';
      default:
        return 'Add New';
    }
  };

  // Check if user can add items in current tab
  const canAddInCurrentTab = () => {
    if (activeTab === 'suppliers' || activeTab === 'purchase-orders' || activeTab === 'consignments') {
      return canManageSuppliers;
    } else if (activeTab === 'pullouts') {
      return canCreatePullouts;
    }
    return false;
  };

  // Render error state
  if (error && !loading && !pageLoading) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-lg p-6 mt-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Error Loading Data</h3>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            <div className="mt-4">
              <Button onClick={() => setRefreshTrigger(prev => prev + 1)}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#FFF6F2]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Header area with icon and action button */}
          <motion.div 
            className="flex justify-between items-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} // Add exit animation
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} // Add exit animation
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`icon-${activeTab}`} // Add key to trigger AnimatePresence
                  className="p-2 bg-[#FFF6F2] rounded-md border border-[#571C1F]/20 shadow-md relative overflow-hidden z-10"
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 10, opacity: 0 }} // Add exit animation
                  transition={{ 
                    type: "spring", 
                    stiffness: 260, 
                    damping: 20,
                    delay: 0.2
                  }}
                  onMouseEnter={() => setIconHovered(true)}
                  onMouseLeave={() => setIconHovered(false)}
                  whileHover={{ 
                    scale: 1.1, 
                    rotate: [0, -5, 5, -5, 0],
                    boxShadow: "0 5px 15px -3px rgba(87, 28, 31, 0.3)",
                    transition: { duration: 0.5 }
                  }}
                >
                  {/* Radial gradient background inside icon container */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      background: [
                        'radial-gradient(circle at center, rgba(87, 28, 31, 0.1) 0%, transparent 60%)',
                        'radial-gradient(circle at center, rgba(0, 59, 37, 0.05) 0%, transparent 60%)',
                        'radial-gradient(circle at center, rgba(87, 28, 31, 0.1) 0%, transparent 60%)'
                      ]
                    }}
                    transition={{ 
                      duration: 6, 
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  />
                  {getTabIcon()}
                </motion.div>
              </AnimatePresence>
              
              <AnimatePresence mode="wait">
                <motion.h1 
                  key={`title-${activeTab}`} // Add key to trigger AnimatePresence
                  className="text-xl font-bold text-[#571C1F]"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }} // Add exit animation
                  transition={{ duration: 0.3 }}
                >
                  {getTabTitle()}
                </motion.h1>
              </AnimatePresence>
            </motion.div>
            
            {/* Add action button based on the active tab */}
            {canAddInCurrentTab() && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }} // Add exit animation
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <AnimatePresence mode="wait">
                  <motion.button 
                    key={`add-button-${activeTab}`} // Add key to trigger AnimatePresence
                    onClick={() => openAddModal(activeTab === 'suppliers' ? 'supplier' : 
                                              activeTab === 'consignments' ? 'consignment' : 
                                              activeTab === 'pullouts' ? 'pullout' : 'purchase-order')}
                    className="px-4 py-2 bg-[#571C1F] text-white rounded-lg shadow-sm font-medium text-sm flex items-center hover:bg-[#4A1519] transition-colors"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }} // Add exit animation
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.02, y: -1, boxShadow: "0 4px 6px -1px rgba(87, 28, 31, 0.1), 0 2px 4px -1px rgba(87, 28, 31, 0.06)" }}
                    whileTap={{ scale: 0.98 }}
                    disabled={pageLoading || loading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {getAddButtonLabel()}
                  </motion.button>
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>

          {/* Content area with animated horizontal bar */}
          <div className="relative">
            <motion.div
              className="h-1 bg-gradient-to-r from-[#571C1F] to-[#003B25] rounded-full mb-6"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ duration: 0.8 }}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-lg"
            >
              <AnimatePresence mode="wait">
                {/* Suppliers Tab */}
                {activeTab === 'suppliers' && (
                  <motion.div
                    key="suppliers-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-lg"
                  >
                    <SupplierList 
                      suppliers={suppliers || []} 
                      loading={loading || pageLoading}
                      onEdit={(id) => openEditModal('supplier', id)}
                      onDelete={(id) => handleDelete('supplier', id)}
                      canManageSuppliers={canManageSuppliers}
                    />
                  </motion.div>
                )}

                {/* Purchase Orders Tab */}
                {activeTab === 'purchase-orders' && (
                  <motion.div
                    key="purchase-orders-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-lg"
                  >
                    <PurchaseOrderList
                      loading={loading || pageLoading}
                      onEdit={(id) => openEditModal('purchase-order', id)}
                      onDelete={(id) => handleDelete('purchase-order', id)}
                      canManageSuppliers={canManageSuppliers}
                      suppliers={suppliers || []}
                    />
                  </motion.div>
                )}

                {/* Consignments Tab */}
                {activeTab === 'consignments' && (
                  <motion.div
                    key="consignments-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-lg"
                  >
                    <ConsignmentList
                      consignments={consignments || []}
                      suppliers={suppliers || []}
                      loading={loading || pageLoading}
                      onEdit={(id) => openEditModal('consignment', id)}
                      onDelete={(id) => handleDelete('consignment', id)}
                      canManageSuppliers={canManageSuppliers}
                    />
                  </motion.div>
                )}

                {/* Pullouts Tab */}
                {activeTab === 'pullouts' && (
                  <motion.div
                    key="pullouts-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-lg"
                  >
                    <PulloutList
                      pullouts={pullouts || []}
                      ingredients={ingredients || []}
                      loading={inventoryLoading || pageLoading} // Change from loading to inventoryLoading
                      onEdit={(id) => openEditModal('pullout', id)}
                      onDelete={(id) => handleDelete('pullout', id)}
                      canApprovePullouts={canManagePullouts}
                      canCreatePullouts={canCreatePullouts}
                      currentUser={user}
                      onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                      useExternalModals={true}
                      onAdd={() => openAddModal('pullout')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Modal for adding/editing entities */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={closeModal}
            title={getModalTitle()}
            size={getModalSize()}
            variant={getModalVariant()}
          >
            {renderModalContent()}
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SuppliersPage;