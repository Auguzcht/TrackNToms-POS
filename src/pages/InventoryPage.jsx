import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import InventoryList from '../components/inventory/InventoryList';
import Modal from '../components/common/Modal';
import IngredientForm from '../components/inventory/IngredientForm';
import ItemForm from '../components/inventory/ItemForm';
import PulloutList from '../components/suppliers/PulloutList';
import PulloutForm from '../components/suppliers/PulloutForm';
import { useInventory } from '../hooks/useInventory';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../hooks/useAuth';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { Spinner } from '../components/common/Spinner';

const InventoryPage = () => {
  const { 
    ingredients, 
    items, 
    pullouts, 
    loading, 
    error,
    fetchInventoryOnly, 
    fetchIngredients,
    fetchItems,
    fetchPullouts, 
    addIngredient,
    updateIngredient,
    deleteIngredient,
    addItem,
    updateItem,
    deleteItem,
    createPullout, 
    updatePullout, 
    deletePullout, 
    approvePullout 
  } = useInventory();
  
  // Add permissions check
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canAddIngredient = hasPermission('inventory.add');
  const canEditIngredient = hasPermission('inventory.edit');
  const canDeleteIngredient = hasPermission('inventory.delete');
  const canManagePullouts = hasPermission('inventory.manage') || hasPermission('pullouts.approve');
  const canApprovePullouts = hasPermission('pullouts.approve'); // Add this line
  const canCreatePullouts = canManagePullouts || hasPermission('pullouts.create');
  const canDeletePullout = hasPermission('inventory.delete') || hasPermission('pullouts.delete');
  
  const { user } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get tab from URL query parameter or default to 'ingredients'
  const getTabFromURL = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    return ['ingredients', 'menu-items', 'pullouts'].includes(tab) ? tab : 'ingredients';
  }, [location.search]);
  
  const [activeTab, setActiveTab] = useState(() => getTabFromURL());
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPulloutModal, setShowPulloutModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingPullout, setEditingPullout] = useState(null);
  const [iconHovered, setIconHovered] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pageError, setPageError] = useState(null);

  // Update active tab when URL changes
  useEffect(() => {
    const tab = getTabFromURL();
    setActiveTab(tab);
    
    // Load specific data based on active tab
    const loadTabData = async () => {
      try {
        setPageError(null);
        
        if (tab === 'ingredients') {
          await fetchIngredients();
        } else if (tab === 'menu-items') {
          await fetchItems();
        } else if (tab === 'pullouts') {
          // Fetch both pullouts and ingredients (ingredients needed for names)
          await Promise.all([fetchPullouts(), fetchIngredients()]);
        }
      } catch (err) {
        console.error(`Failed to fetch ${tab} data:`, err);
        setPageError(err.message || `Failed to fetch ${tab} data`);
        toast.error(`Could not load ${tab}. Please try again.`);
      }
    };
    
    loadTabData();
  }, [location.search, fetchIngredients, fetchItems, fetchPullouts, getTabFromURL]);

  // Initial data load - fetch both ingredients and items, but NO pullouts
  useEffect(() => {
    const loadData = async () => {
      try {
        setPageError(null);
        await fetchInventoryOnly(); // Use fetchInventoryOnly instead of fetchInventory
      } catch (err) {
        console.error('Error loading inventory data:', err);
        setPageError(err.message || 'Failed to load inventory data');
        toast.error('Could not load inventory data. Please try again.');
      }
    };
    
    loadData();
    
    // Set the background color when the component mounts and restore when unmounting
    const originalBgColor = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#FFF6F2';
    
    return () => {
      document.body.style.backgroundColor = originalBgColor;
    };
  }, [fetchInventoryOnly, refreshTrigger]);

  // Display error notification if API error occurs
  useEffect(() => {
    if (error) {
      setPageError(error);
      toast.error(error);
    }
  }, [error]);

  // Handle tab change
  const handleTabChange = useCallback((tab) => {
    navigate(`?tab=${tab}`);
  }, [navigate]);

  // Handle adding a new menu item - FIXED: Added missing function
  const handleAddItem = useCallback(() => {
    if (!hasPermission('inventory.add')) {
      toast.error('You do not have permission to add menu items');
      return;
    }
    setEditingItem(null);
    setShowItemModal(true);
  }, [hasPermission]);

  // Handle editing an existing menu item - FIXED: Added missing function
  const handleEditItem = useCallback((item) => {
    if (!hasPermission('inventory.edit')) {
      toast.error('You do not have permission to edit menu items');
      return;
    }
    setEditingItem(item);
    setShowItemModal(true);
  }, [hasPermission]);

  // Handle adding a new ingredient - FIXED: Added missing function
  const handleAddIngredient = useCallback(() => {
    if (!canAddIngredient) {
      toast.error('You do not have permission to add ingredients');
      return;
    }
    setEditingIngredient(null);
    setShowIngredientModal(true);
  }, [canAddIngredient]);

  // Handle editing an existing ingredient - FIXED: Added missing function
  const handleEditIngredient = useCallback((ingredient) => {
    if (!canEditIngredient) {
      toast.error('You do not have permission to edit ingredients');
      return;
    }
    setEditingIngredient(ingredient);
    setShowIngredientModal(true);
  }, [canEditIngredient]);

  // Handle deleting an ingredient - FIXED: Added missing function
  const handleDeleteIngredient = useCallback(async (ingredientId) => {
    if (!canDeleteIngredient) {
      toast.error('You do not have permission to delete ingredients');
      return;
    }
    
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This will permanently delete this ingredient. You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#571C1F',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        await deleteIngredient(ingredientId);
        toast.success('Ingredient deleted successfully');
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error deleting ingredient:', err);
      
      Swal.fire({
        title: 'Error!',
        text: err.message || 'Failed to delete the ingredient.',
        icon: 'error',
        confirmButtonColor: '#571C1F'
      });
    }
  }, [deleteIngredient, canDeleteIngredient]);

  // Handle deleting a menu item - FIXED: Added missing function
  const handleDeleteItem = useCallback(async (itemId) => {
    if (!hasPermission('inventory.delete')) {
      toast.error('You do not have permission to delete menu items');
      return;
    }
    
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This will permanently delete this menu item. You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#571C1F',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        await deleteItem(itemId);
        toast.success('Menu item deleted successfully');
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error deleting menu item:', err);
      
      Swal.fire({
        title: 'Error!',
        text: err.message || 'Failed to delete the menu item.',
        icon: 'error',
        confirmButtonColor: '#571C1F'
      });
    }
  }, [deleteItem, hasPermission]);

  // Update handleIngredientSubmit to refresh items too if needed
  const handleIngredientSubmit = useCallback(() => {
    setShowIngredientModal(false);
    setEditingIngredient(null);
    
    // Refresh ingredients list
    fetchIngredients();
    
    // Also refresh pullouts since they display ingredient names
    if (activeTab === 'pullouts') {
      fetchPullouts();
    }
    
    setRefreshTrigger(prev => prev + 1);
    toast.success(`Ingredient ${editingIngredient ? 'updated' : 'added'} successfully!`);
  }, [editingIngredient, fetchIngredients, fetchPullouts, activeTab]);

  // Handle the menu item form submission
  const handleItemSubmit = useCallback(async () => {
    setShowItemModal(false);
    setEditingItem(null);
    
    // Refresh items list
    await fetchItems();
    
    // Also refresh related data if needed
    if (activeTab === 'items' || editingItem?.is_externally_sourced === false) {
      // If we're editing a recipe-based item, refresh ingredients too
      await fetchIngredients();
    }
    
    setRefreshTrigger(prev => prev + 1);
    toast.success(`Menu item ${editingItem ? 'updated' : 'added'} successfully!`);
  }, [editingItem, fetchItems, fetchIngredients, activeTab]);

  // Update handlePulloutSubmit to refresh both pullouts and ingredients
  const handlePulloutSubmit = useCallback(() => {
    setShowPulloutModal(false);
    setEditingPullout(null);
    
    // Refresh pullouts list
    fetchPullouts();
    
    // Also refresh ingredients since pullout may change stock levels
    fetchIngredients();
    
    setRefreshTrigger(prev => prev + 1);
    toast.success(`Pullout ${editingPullout ? 'updated' : 'created'} successfully!`);
  }, [editingPullout, fetchPullouts, fetchIngredients]);

  // Handle cancelling ingredient form - FIXED: Added missing function
  const handleIngredientCancel = useCallback(() => {
    setShowIngredientModal(false);
    setEditingIngredient(null);
  }, []);

  // Handle cancelling item form - FIXED: Added missing function
  const handleItemCancel = useCallback(() => {
    setShowItemModal(false);
    setEditingItem(null);
  }, []);

  // Handle cancelling pullout form - FIXED: Added missing function
  const handlePulloutCancel = useCallback(() => {
    setShowPulloutModal(false);
    setEditingPullout(null);
  }, []);

  // Handle adding a new pullout - FIXED: Add missing function
  const handleAddPullout = useCallback(() => {
    if (!canCreatePullouts) {
      toast.error('You do not have permission to create pullouts');
      return;
    }
    setEditingPullout(null);
    setShowPulloutModal(true);
  }, [canCreatePullouts]);

  // Handle editing an existing pullout - FIXED: Add missing function
  const handleEditPullout = useCallback((pulloutId) => {
    if (!canManagePullouts) {
      toast.error('You do not have permission to edit pullouts');
      return;
    }
    setEditingPullout(pulloutId);
    setShowPulloutModal(true);
  }, [canManagePullouts]);

  // Handle deleting a pullout - FIXED: Add missing function
  const handleDeletePullout = useCallback(async (pulloutId) => {
    if (!canDeletePullout) {
      toast.error('You do not have permission to delete pullouts');
      return;
    }
    
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This will permanently delete this pullout record. You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#571C1F',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        await deletePullout(pulloutId);
        toast.success('Pullout record deleted successfully');
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error deleting pullout:', err);
      
      Swal.fire({
        title: 'Error!',
        text: err.message || 'Failed to delete the pullout record.',
        icon: 'error',
        confirmButtonColor: '#571C1F'
      });
    }
  }, [deletePullout, canDeletePullout]);

  // Filter data based on user's permissions if needed
  const visibleIngredients = useMemo(() => {
    return ingredients;
  }, [ingredients]);

  const visibleItems = useMemo(() => {
    return items;
  }, [items]);

  // Move this function BEFORE any conditional returns
  const handleRefresh = useCallback(() => {
    console.log("Refreshing inventory data...");
    
    // Fetch data based on active tab
    if (activeTab === 'ingredients') {
      fetchIngredients();
    } else if (activeTab === 'menu-items') {
      fetchItems();
    } else if (activeTab === 'pullouts') {
      fetchPullouts();
      fetchIngredients();
    }
  }, [activeTab, fetchIngredients, fetchItems, fetchPullouts]);

  // Show loading spinner if both permissions and inventory are loading
  if ((loading && !visibleIngredients.length && !visibleItems.length) || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FFF6F2]">
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="lg" color="#571C1F" />
          <p className="text-[#571C1F] font-medium">Loading inventory...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (pageError && !loading && !visibleIngredients.length && !visibleItems.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FFF6F2]">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="flex items-center justify-center mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-center text-[#571C1F] mb-2">Failed to load inventory</h2>
          <p className="text-gray-600 text-center mb-6">{pageError}</p>
          <div className="flex justify-center">
            <button
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className="px-4 py-2 bg-[#571C1F] text-white rounded-md hover:bg-[#4A1519] transition-colors"
            >
              Try Again
            </button>
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
            },
            exit: { opacity: 0 }
          }}
          initial="hidden"
          animate="show"
          exit="exit"
          className="space-y-6"
        >
          {/* Header area with title and action button */}
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
              {/* Wrap the icon in AnimatePresence */}
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
                  {activeTab === 'ingredients' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  ) : activeTab === 'menu-items' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9 7 9-7M3 11h18M3 15h18" />
                    </svg>
                  )}
                </motion.div>
              </AnimatePresence>
              
              {/* Wrap the title in AnimatePresence */}
              <AnimatePresence mode="wait">
                <motion.h1 
                  key={`title-${activeTab}`}
                  className="text-xl font-bold text-[#571C1F]"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'ingredients' ? 'Ingredients' : activeTab === 'menu-items' ? 'Menu Items' : 'Pullouts'}
                </motion.h1>
              </AnimatePresence>
            </motion.div>
            
            {/* Action button - RESTORED */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <AnimatePresence mode="wait">
                {activeTab === 'ingredients' ? (
                  canAddIngredient && (
                    <motion.button 
                      key="add-ingredient-button"
                      onClick={handleAddIngredient}
                      className="px-4 py-2 bg-[#571C1F] text-white rounded-lg shadow-sm font-medium text-sm flex items-center hover:bg-[#4A1519] transition-colors"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ scale: 1.02, y: -1, boxShadow: "0 4px 6px -1px rgba(87, 28, 31, 0.1), 0 2px 4px -1px rgba(87, 28, 31, 0.06)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Ingredient
                    </motion.button>
                  )
                ) : activeTab === 'menu-items' ? (
                  hasPermission('inventory.add') && (
                    <motion.button 
                      key="add-menu-item-button"
                      onClick={handleAddItem}
                      className="px-4 py-2 bg-[#571C1F] text-white rounded-lg shadow-sm font-medium text-sm flex items-center hover:bg-[#4A1519] transition-colors"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ scale: 1.02, y: -1, boxShadow: "0 4px 6px -1px rgba(87, 28, 31, 0.1), 0 2px 4px -1px rgba(87, 28, 31, 0.06)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Menu Item
                    </motion.button>
                  )
                ) : (
                  canCreatePullouts && (
                    <motion.button 
                      key="add-pullout-button"
                      onClick={handleAddPullout}
                      className="px-4 py-2 bg-[#571C1F] text-white rounded-lg shadow-sm font-medium text-sm flex items-center hover:bg-[#4A1519] transition-colors"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ scale: 1.02, y: -1, boxShadow: "0 4px 6px -1px rgba(87, 28, 31, 0.1), 0 2px 4px -1px rgba(87, 28, 31, 0.06)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      New Pullout
                    </motion.button>
                  )
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Content area with animated horizontal bar */}
          <div className="relative">
            <motion.div
              className="h-1 bg-gradient-to-r from-[#571C1F] to-[#003B25] rounded-full mb-6"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.8 }}
            />
            
            {/* Show loading state within the tab content area */}
            {loading && (
              (activeTab === 'ingredients' && !visibleIngredients.length) || 
              (activeTab === 'menu-items' && !visibleItems.length) ||
              (activeTab === 'pullouts' && !pullouts?.length)
            ) ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-12"
              >
                <Spinner size="md" color="#571C1F" />
                <span className="ml-3 text-[#571C1F] font-medium">
                  Loading {
                    activeTab === 'ingredients' ? 'ingredients' : 
                    activeTab === 'menu-items' ? 'menu items' :
                    'pullout records'
                  }...
                </span>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="rounded-lg"
                >
                  {activeTab === 'ingredients' ? (
                    <InventoryList
                      data={visibleIngredients}
                      type="ingredient"
                      loading={loading}
                      onEdit={canEditIngredient ? handleEditIngredient : null}
                      onDelete={canDeleteIngredient ? handleDeleteIngredient : null}
                    />
                  ) : activeTab === 'menu-items' ? (
                    <InventoryList
                      data={visibleItems}
                      type="item"
                      loading={loading}
                      onEdit={hasPermission('inventory.edit') ? handleEditItem : null}
                      onDelete={hasPermission('inventory.delete') ? handleDeleteItem : null}
                    />
                  ) : (
                    <PulloutList
                      pullouts={pullouts || []}
                      ingredients={ingredients || []}
                      loading={loading}
                      onEdit={canManagePullouts ? handleEditPullout : null}
                      onDelete={canDeletePullout ? handleDeletePullout : null}
                      canApprovePullouts={canManagePullouts}
                      canCreatePullouts={canCreatePullouts}
                      currentUser={user} // You'll need to get the user from useAuth()
                      onRefresh={handleRefresh} // Use the new callback function here
                      useExternalModals={true}
                      onAdd={canCreatePullouts ? handleAddPullout : null}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
          
          {/* Modals */}
          <AnimatePresence>
            {showIngredientModal && (
              <Modal
                isOpen={showIngredientModal}
                onClose={handleIngredientCancel}
                title={editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
                size="4xl"
                variant="primary"
              >
                <IngredientForm
                  ingredient={editingIngredient}
                  onSubmit={handleIngredientSubmit}
                  onCancel={handleIngredientCancel}
                />
              </Modal>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showItemModal && (
              <Modal
                isOpen={showItemModal}
                onClose={handleItemCancel}
                title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                size="4xl"
                variant="secondary"
              >
                <ItemForm
                  item={editingItem}
                  ingredients={ingredients}
                  onSubmit={handleItemSubmit}
                  onCancel={handleItemCancel}
                />
              </Modal>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showPulloutModal && (
              <Modal
                isOpen={showPulloutModal}
                onClose={handlePulloutCancel}
                title={editingPullout ? 'Edit Pullout Record' : 'New Pullout Request'}
                size="lg"
                variant="primary"
              >
                <PulloutForm
                  pulloutId={editingPullout}
                  ingredients={ingredients}
                  onSave={handlePulloutSubmit}
                  onCancel={handlePulloutCancel}
                  currentUser={user} // You'll need to get the user from useAuth()
                />
              </Modal>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default InventoryPage;