import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router-dom';

// Import supplier components
import SupplierList from '../components/suppliers/SupplierList';
import ConsignmentList from '../components/suppliers/ConsignmentList';
import PurchaseOrderList from '../components/suppliers/PurchaseOrderList';
import SupplierForm from '../components/suppliers/SupplierForm';
import ConsignmentForm from '../components/suppliers/ConsignmentForm';
import PurchaseOrderForm from '../components/suppliers/PurchaseOrderForm';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Spinner } from '../components/common/Spinner';

// Import hooks
import { useAuth } from '../hooks/useAuth';
import { useSuppliers } from '../hooks/useSuppliers';

const SuppliersPage = () => {
  // Adapt the page based on user role
  const { user } = useAuth();
  const isSupplier = user?.role === 'Supplier';
  
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
  
  // Get tab from URL query parameter or default to 'suppliers'
  const getTabFromURL = () => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    // Only return valid tab options - remove 'pullouts'
    return ['suppliers', 'consignments', 'purchase-orders'].includes(tab) ? tab : 'suppliers';
  };

  // State management
  const [activeTab, setActiveTab] = useState(getTabFromURL());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'supplier', 'consignment', 'purchase-order'
  const [editingId, setEditingId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pageError, setPageError] = useState(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [iconHovered, setIconHovered] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  // Update active tab when URL changes
  useEffect(() => {
    const tab = getTabFromURL();
    // Force supplier to only see purchase orders or consignments
    if (isSupplier && tab === 'suppliers') {
      navigate('/suppliers?tab=purchase-orders', { replace: true });
    } else {
      setActiveTab(tab);
    }
  }, [location.search, isSupplier, navigate]);

  // Set background color when the component mounts and restore when unmounting
  useEffect(() => {
    const originalBgColor = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#FFF6F2';
    
    return () => {
      document.body.style.backgroundColor = originalBgColor;
    };
  }, []);

  // Check if user has permissions to manage suppliers
  const canViewSuppliers = user?.permissions?.includes('suppliers.view') || user?.role === 'Manager' || user?.role === 'Admin';
  const canManageSuppliers = user?.permissions?.includes('suppliers.manage') || 
                         user?.permissions?.includes('suppliers.create') || 
                         user?.role === 'Manager' || 
                         user?.role === 'Admin';
  const canManagePurchases = user?.permissions?.includes('purchases.create') || 
                         user?.permissions?.includes('purchases.approve') || 
                         user?.role === 'Manager' || 
                         user?.role === 'Admin';

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
          const [suppliersResult, consignmentsResult] = await Promise.all([
            fetchSuppliers(),
            fetchConsignments()
          ]);
          console.log(`Retrieved ${suppliersResult.length} suppliers and ${consignmentsResult.length} consignments`);
          break;
        case 'purchase-orders':
          console.log('Fetching purchase orders and suppliers data...');
          const [suppliersForPO, purchaseOrdersResult] = await Promise.all([
            fetchSuppliers(),
            fetchPurchaseOrders()
          ]);
          console.log(`Retrieved ${suppliersForPO.length} suppliers and ${purchaseOrdersResult.length} purchase orders`);
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
  }, [activeTab, fetchSuppliers, fetchConsignments, fetchPurchaseOrders]);

  // Initial data fetch
  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  // Modal handling functions
  const openAddModal = (type) => {
    console.log(`Opening ${type} add modal`);
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
      }
      // Remove pullout case
      
      // Refresh the list
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast.error(`Failed to delete ${type}. ${error.message || 'Please try again.'}`);
    } finally {
      setPageLoading(false);
    }
  };

  // Render modal content based on type (remove pullout case)
  const renderModalContent = () => {
    if (!isModalOpen) return null;
    
    if (modalType === 'supplier') {
      return (
        <SupplierForm 
          key={`supplier-${editingId || 'new'}`}
          supplierId={editingId} 
          onSave={handleSave} 
          onCancel={closeModal}
        />
      );
    }
    
    if (modalType === 'consignment') {
      return (
        <ConsignmentForm 
          key={`consignment-${editingId || 'new'}`}
          consignmentId={editingId} 
          suppliers={suppliers || []}
          onSave={handleSave}
          onCancel={closeModal}
        />
      );
    } else if (modalType === 'purchase-order') {
      // Replace the placeholder with the actual PurchaseOrderForm
      return (
        <PurchaseOrderForm
          key={`purchase-order-${editingId || 'new'}`}
          purchaseId={editingId}
          suppliers={suppliers || []}
          onSubmit={handleSave}
          onCancel={closeModal}
        />
      );
    }
    
    return null;
  };

  // Get modal title based on type (remove pullout case)
  const getModalTitle = () => {
    if (!modalType) return '';
    
    switch (modalType) {
      case 'supplier':
        return editingId ? 'Edit Supplier' : 'Add New Supplier';
      case 'consignment':
        return editingId ? 'Edit Consignment' : 'New Consignment';
      case 'purchase-order':
        return editingId ? 'Edit Purchase Order' : 'New Purchase Order';
      default:
        return '';
    }
  };

  // Get modal size based on type (remove pullout case)
  const getModalSize = () => {
    switch (modalType) {
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

  // Get modal variant based on type (remove pullout case)
  const getModalVariant = () => {
    switch (modalType) {
      case 'supplier':
        return 'primary';
      case 'consignment':
        return 'secondary';
      case 'purchase-order':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Determine if there's an error to show (remove inventory error)
  const error = suppliersError || pageError;
  const loading = suppliersLoading || pageLoading;

  // Get icon based on active tab (remove pullouts case)
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
      default:
        return null;
    }
  };

  // Get tab title based on active tab (remove pullouts case)
  const getTabTitle = () => {
    switch (activeTab) {
      case 'suppliers':
        return 'Suppliers';
      case 'purchase-orders':
        return 'Purchase Orders';
      case 'consignments':
        return 'Consignments';
      default:
        return '';
    }
  };

  // Get button label based on active tab (remove pullout case)
  const getAddButtonLabel = () => {
    switch (activeTab) {
      case 'suppliers':
        return 'Add Supplier';
      case 'purchase-orders':
        return 'New Order';
      case 'consignments':
        return 'Add Consignment';
      default:
        return 'Add New';
    }
  };

  // Check if user can add items in current tab (remove pullouts case)
  const canAddInCurrentTab = () => {
    if (activeTab === 'suppliers' || activeTab === 'purchase-orders' || activeTab === 'consignments') {
      return canManageSuppliers;
    }
    return false;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#FFF6F2]"
    >
      {/* Show loading spinner if data is loading initially */}
      {(loading && !suppliers.length) || permissionsLoading ? (
        <div className="flex items-center justify-center h-screen bg-[#FFF6F2]">
          <div className="flex flex-col items-center space-y-4">
            <Spinner size="lg" color="#571C1F" />
            <p className="text-[#571C1F] font-medium">Loading {activeTab}...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-screen bg-[#FFF6F2]">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <div className="flex items-center justify-center mb-4 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-center text-[#571C1F] mb-2">Failed to load suppliers</h2>
            <p className="text-gray-600 text-center mb-6">{error}</p>
            <div className="flex justify-center">
              <button
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#571C1F] hover:bg-[#4A1519] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#571C1F]"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      ) : (
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
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`icon-${activeTab}`}
                    className="p-2 bg-[#FFF6F2] rounded-md border border-[#571C1F]/20 shadow-md relative overflow-hidden z-10"
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 10, opacity: 0 }}
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
                    key={`title-${activeTab}`}
                    className="text-xl font-bold text-[#571C1F]"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
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
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <AnimatePresence mode="wait">
                    <motion.button 
                      key={`add-button-${activeTab}`}
                      onClick={() => openAddModal(activeTab === 'suppliers' ? 'supplier' : 
                                                activeTab === 'consignments' ? 'consignment' : 'purchase-order')}
                      className="px-4 py-2 bg-[#571C1F] text-white rounded-lg shadow-sm font-medium text-sm flex items-center hover:bg-[#4A1519] transition-colors"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
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
              
              {/* Show loading state within the tab content area */}
              {pageLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-12"
                >
                  <Spinner size="md" color="#571C1F" />
                  <span className="ml-3 text-[#571C1F] font-medium">
                    Loading {
                      activeTab === 'suppliers' ? 'suppliers' : 
                      activeTab === 'purchase-orders' ? 'purchase orders' :
                      'consignments'
                    }...
                  </span>
                </motion.div>
              )}
              
              {!pageLoading && (
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
                          loading={loading}
                          onEdit={(id) => openEditModal('supplier', id)}
                          onDelete={(id) => handleDelete('supplier', id)}
                          canManage={canManageSuppliers}
                          onAdd={() => openAddModal('supplier')}
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
                          loading={loading}
                          onEdit={(id) => openEditModal('purchase-order', id)}
                          onDelete={(id) => handleDelete('purchase-order', id)}
                          canManageSuppliers={canManageSuppliers}
                          suppliers={suppliers || []}
                          onAdd={() => openAddModal('purchase-order')}
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
                          loading={loading}
                          onEdit={(id) => openEditModal('consignment', id)}
                          onDelete={(id) => handleDelete('consignment', id)}
                          canManage={canManageSuppliers}
                          onAdd={() => openAddModal('consignment')}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}

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