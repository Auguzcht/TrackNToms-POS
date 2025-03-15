import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Add AnimatePresence import
import { useNavigate, useLocation } from 'react-router-dom';
import InventoryList from '../components/inventory/InventoryList';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import IngredientForm from '../components/inventory/IngredientForm';
import ItemForm from '../components/inventory/ItemForm';
import { useInventory } from '../hooks/useInventory';
import Swal from 'sweetalert2';

const InventoryPage = () => {
  const { ingredients, items, loading, fetchInventory, deleteIngredient, deleteItem } = useInventory();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get tab from URL query parameter or default to 'ingredients'
  const getTabFromURL = () => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    return tab || 'ingredients';
  };
  
  const [activeTab, setActiveTab] = useState(getTabFromURL());
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [iconHovered, setIconHovered] = useState(false);

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getTabFromURL());
  }, [location.search]);

  useEffect(() => {
    fetchInventory();
    
    // Set the background color when the component mounts and restore when unmounting
    const originalBgColor = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#FFF6F2';
    
    return () => {
      document.body.style.backgroundColor = originalBgColor;
    };
  }, [fetchInventory]);

  // Handle adding a new menu item
  const handleAddItem = () => {
    setEditingItem(null);
    setShowItemModal(true);
  };

  // Handle editing an existing menu item
  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowItemModal(true);
  };

  // Handle adding a new ingredient
  const handleAddIngredient = () => {
    setEditingIngredient(null);
    setShowIngredientModal(true);
  };

  // Handle editing an existing ingredient
  const handleEditIngredient = (ingredient) => {
    setEditingIngredient(ingredient);
    setShowIngredientModal(true);
  };

  // Handle deleting an ingredient
  const handleDeleteIngredient = async (ingredientId) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#571C1F',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        await deleteIngredient(ingredientId);
        
        Swal.fire({
          title: 'Deleted!',
          text: 'The ingredient has been deleted.',
          icon: 'success',
          confirmButtonColor: '#571C1F'
        });
        
        await fetchInventory();
      }
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to delete the ingredient.',
        icon: 'error',
        confirmButtonColor: '#571C1F'
      });
      console.error('Error deleting ingredient:', error);
    }
  };

  // Handle deleting a menu item
  const handleDeleteItem = async (itemId) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#571C1F',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        await deleteItem(itemId);
        
        Swal.fire({
          title: 'Deleted!',
          text: 'The item has been deleted.',
          icon: 'success',
          confirmButtonColor: '#571C1F'
        });
        
        await fetchInventory();
      }
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to delete the item.',
        icon: 'error',
        confirmButtonColor: '#571C1F'
      });
      console.error('Error deleting item:', error);
    }
  };

  // Handle successful ingredient submission (both add and edit)
  const handleIngredientSubmit = async () => {
    setShowIngredientModal(false);
    setEditingIngredient(null);
    await fetchInventory();
  };

  // Handle successful item submission (both add and edit)
  const handleItemSubmit = async () => {
    setShowItemModal(false);
    setEditingItem(null);
    await fetchInventory();
  };

  // Handle cancelling ingredient form
  const handleIngredientCancel = () => {
    setShowIngredientModal(false);
    setEditingIngredient(null);
  };

  // Handle cancelling item form
  const handleItemCancel = () => {
    setShowItemModal(false);
    setEditingItem(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#FFF6F2]" // Removed py-6 padding
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
            exit: { opacity: 0 } // Add exit variant
          }}
          initial="hidden"
          animate="show"
          exit="exit" // Add exit animation
          className="space-y-6"
        >
          {/* Header area with action button */}
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
              {/* Wrap the icon in AnimatePresence */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`icon-${activeTab}`} // Add a key that changes with activeTab
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
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  )}
                </motion.div>
              </AnimatePresence>
              
              {/* Wrap the title in AnimatePresence */}
              <AnimatePresence mode="wait">
                <motion.h1 
                  key={`title-${activeTab}`} // Add a key that changes with activeTab
                  className="text-xl font-bold text-[#571C1F]"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'ingredients' ? 'Ingredients' : 'Menu Items'}
                </motion.h1>
              </AnimatePresence>
            </motion.div>
            
            {/* Action button */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }} // Add exit animation
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <AnimatePresence mode="wait">
                {/* Use AnimatePresence to animate between different buttons */}
                {activeTab === 'ingredients' ? (
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
                ) : (
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
              exit={{ width: 0, opacity: 0 }} // Add exit animation for progress bar
              transition={{ duration: 0.8 }}
            />
            
            {/* Use AnimatePresence for tab content transitions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab} // Important: add key to trigger AnimatePresence
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} // Add exit animation
                transition={{ duration: 0.5, delay: 0.3 }}
                className="rounded-lg"
              >
                {activeTab === 'ingredients' ? (
                  <InventoryList
                    data={ingredients}
                    type="ingredient"
                    loading={loading}
                    onEdit={handleEditIngredient}
                    onDelete={handleDeleteIngredient}
                  />
                ) : (
                  <InventoryList
                    data={items}
                    type="item"
                    loading={loading}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Add AnimatePresence for modals */}
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
        </motion.div>
      </div>
    </motion.div>
  );
};

export default InventoryPage;