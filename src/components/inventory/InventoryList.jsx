import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import Modal from '../common/Modal'; // Add this import
import placeholderImage from '../../assets/placeholder-image2.png'; 
import { useInventory } from '../../hooks/useInventory';
import IngredientForm from './IngredientForm'; // Add this import

const InventoryList = ({ 
  data = [],
  type = 'ingredient',
  loading = false,
  onView,
  onEdit,
  onDelete,
  onRefresh // Add this prop
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [supplierDetails, setSupplierDetails] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [viewMode, setViewMode] = useState(true); // New state to control view/edit mode
  
  // Get supplier information from useInventory hook
  const { getIngredientSuppliers, setPreferredSupplier } = useInventory();
  
  // Function to load supplier details for an ingredient
  const loadSupplierDetails = async (ingredientId) => {
    if (!ingredientId) return;
    
    setLoadingSuppliers(true);
    try {
      const suppliersData = await getIngredientSuppliers(ingredientId);
      setSupplierDetails(suppliersData || []);
    } catch (error) {
      console.error("Error loading supplier details:", error);
    } finally {
      setLoadingSuppliers(false);
    }
  };
  
  // Handle the ingredient view click
  const handleIngredientView = (ingredient) => {
    if (!ingredient || !ingredient.ingredient_id) return;
    
    setSelectedIngredient(ingredient);
    setShowDetailsModal(true);
    setViewMode(true); // Ensure we're in view mode
    
    // Still call the external onView function if provided
    if (onView) {
      onView(ingredient);
    }
  };
  
  // Handle closing of the modal
  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedIngredient(null);
  };
  
  // Handle edit from the modal
  const handleEditFromModal = () => {
    setViewMode(false); // Switch to edit mode
    if (onEdit) {
      onEdit(selectedIngredient);
    }
  };
  
  // Handle save from form (if edit mode is used)
  const handleSaveFromModal = (updatedIngredient) => {
    setShowDetailsModal(false);
    setSelectedIngredient(null);
    
    // Call any parent refresh logic
    if (onEdit && updatedIngredient) {
      // Pass the updated ingredient back to the parent component
      onEdit(updatedIngredient);
    }
  };

  // Helper function to safely format currency - improved with better error handling
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '₱0.00';
    
    try {
      // Make sure we're working with a number
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return '₱0.00';
      
      return `₱${numValue.toFixed(2)}`;
    } catch (error) {
      console.warn('Error formatting currency value:', value, error);
      return '₱0.00';
    }
  };
  
  // Filter data based on search query
  const filteredData = data.filter(item => {
    if (!item) return false; // Skip null/undefined items
    
    const searchable = type === 'ingredient'
      ? item.name?.toLowerCase() || ''
      : item.item_name?.toLowerCase() || '';
    
    return searchable.includes(searchQuery.toLowerCase());
  });

  // Sort the filtered data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    // Handle potentially undefined objects
    if (!a || !b) return 0;
    
    let aValue, bValue;
    
    if (type === 'ingredient') {
      aValue = sortConfig.key === 'name' ? a.name : 
              sortConfig.key === 'cost_per_unit' ? a.unit_cost : // Look for unit_cost in the database
              a[sortConfig.key];
      bValue = sortConfig.key === 'name' ? b.name : 
              sortConfig.key === 'cost_per_unit' ? b.unit_cost : // Look for unit_cost in the database
              b[sortConfig.key];
    } else {
      aValue = sortConfig.key === 'item_name' ? a.item_name : a[sortConfig.key];
      bValue = sortConfig.key === 'item_name' ? b.item_name : b[sortConfig.key];
    }
    
    // Convert to numbers for numerical comparisons if needed
    if (!isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue))) {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    }
    
    // Handle nullish values - put them at the end regardless of sort direction
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (aValue < bValue) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Enhanced sort indicator with animation - updated to be white
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    
    return (
      <motion.span 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="ml-1 text-xs text-white dark:text-white inline-block"
      >
        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
      </motion.span>
    );
  };

  // Handle image errors
  const handleImageError = (id) => {
    setImageLoadErrors(prev => ({
      ...prev,
      [id]: true
    }));
  };

  // Image component with fallback - Updated to better handle DB images
  const ImageWithFallback = ({ src, alt, id, className }) => {
    // Check if image is a base64 string or URL
    const isBase64 = typeof src === 'string' && src.startsWith('data:');
    const hasError = imageLoadErrors[id];
    
    // Use either the source image or fallback if there was an error
    const imageSrc = (hasError || !src) ? placeholderImage : src;
    
    return (
      <div className={`overflow-hidden ${className}`}>
        <img 
          src={imageSrc}
          alt={alt}
          onError={() => handleImageError(id)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  };

  // Reset image errors when data changes
  useEffect(() => {
    setImageLoadErrors({});
  }, [data]);

  // Add a useEffect to listen for refresh signals
  useEffect(() => {
    // Clear any selection or modals when refreshed externally
    if (showDetailsModal) {
      setShowDetailsModal(false);
      setSelectedIngredient(null);
    }
  }, [data]); // This will trigger when the data prop changes from the parent

  // Render table headers based on type
  const renderTableHeaders = () => {
    if (type === 'ingredient') {
      return (
        <tr className="text-left border-b-2 border-[#571C1F]/20">
          <th 
            scope="col" 
            className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider cursor-pointer bg-[#571C1F]"
            onClick={() => requestSort('name')}
          >
            <div className="flex items-center">
              <span>Name</span>
              {getSortIndicator('name')}
            </div>
          </th>
          <th 
            scope="col" 
            className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider cursor-pointer bg-[#571C1F]"
            onClick={() => requestSort('unit')}
          >
            <div className="flex items-center">
              <span>Unit</span>
              {getSortIndicator('unit')}
            </div>
          </th>
          <th 
            scope="col" 
            className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider cursor-pointer bg-[#571C1F]"
            onClick={() => requestSort('quantity')}
          >
            <div className="flex items-center">
              <span>Quantity</span>
              {getSortIndicator('quantity')}
            </div>
          </th>
          <th 
            scope="col" 
            className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider cursor-pointer bg-[#571C1F]"
            onClick={() => requestSort('cost_per_unit')}
          >
            <div className="flex items-center">
              <span>Unit Cost</span>
              {getSortIndicator('cost_per_unit')}
            </div>
          </th>
          <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider bg-[#571C1F]">
            Actions
          </th>
        </tr>
      );
    } else {
      return (
        <tr className="text-left border-b-2 border-[#571C1F]/20">
          <th 
            scope="col" 
            className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider cursor-pointer bg-[#571C1F]"
            onClick={() => requestSort('item_name')}
          >
            <div className="flex items-center">
              <span>Name</span>
              {getSortIndicator('item_name')}
            </div>
          </th>
          <th 
            scope="col" 
            className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider cursor-pointer bg-[#571C1F]"
            onClick={() => requestSort('category')}
          >
            <div className="flex items-center">
              <span>Category</span>
              {getSortIndicator('category')}
            </div>
          </th>
          <th 
            scope="col" 
            className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider cursor-pointer bg-[#571C1F]"
            onClick={() => requestSort('base_price')}
          >
            <div className="flex items-center">
              <span>Price</span>
              {getSortIndicator('base_price')}
            </div>
          </th>
          <th 
            scope="col" 
            className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider cursor-pointer bg-[#571C1F]"
          >
            Source
          </th>
          <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider bg-[#571C1F]">
            Actions
          </th>
        </tr>
      );
    }
  };

  // Render table rows based on type
  const renderTableRows = () => {
    if (loading) {
      return Array(5).fill(0).map((_, index) => (
        <tr key={index} className="animate-pulse">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </td>
          <td className="px-6 py-4 text-right whitespace-nowrap">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 ml-auto"></div>
          </td>
        </tr>
      ));
    }

    if (sortedData.length === 0) {
      return (
        <tr>
          <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-600 dark:text-gray-400">
            {searchQuery ? (
              <div className="flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#571C1F]/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p>No results match your search</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-[#571C1F] hover:text-[#571C1F]/80 font-medium px-3 py-1 rounded-md border border-[#571C1F]/30 hover:border-[#571C1F]/50 transition-all"
                >
                  Clear search
                </motion.button>
              </div>
            ) : (
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
                <p>No {type === 'ingredient' ? 'ingredients' : 'items'} available</p>
              </div>
            )}
          </td>
        </tr>
      );
    }

    if (type === 'ingredient') {
      return sortedData.map((ingredient, index) => {
        // Skip rendering if the ingredient object is null or undefined
        if (!ingredient) return null;
        
        return (
          <motion.tr 
            key={ingredient.ingredient_id || `ingredient-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="bg-white hover:bg-[#FFF6F2] dark:bg-dark-lighter dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
            onClick={(e) => {
              // Prevent triggering the row click when clicking on action buttons
              if (e.target.closest('button')) return;
              
              // Call our new handleIngredientView function
              handleIngredientView(ingredient);
            }}
          >
            <td className="px-6 py-4 text-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full border border-[#571C1F]/10 overflow-hidden bg-[#FFF6F2]">
                  <ImageWithFallback 
                    src={ingredient.image}
                    alt={ingredient.name}
                    id={`ingredient-${ingredient.ingredient_id || index}`}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                </div>
                <div className="ml-3">
                  <div className="font-medium text-[#571C1F]">{ingredient.name || 'No Name'}</div>
                  {ingredient.description && (
                    <div className="text-xs text-gray-600 truncate max-w-xs">{ingredient.description}</div>
                  )}
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-600 font-medium">
              {ingredient.unit || '-'}

            </td>
            <td className="px-6 py-4 text-sm">
              <span className={`${
                (ingredient.quantity !== undefined && ingredient.minimum_stock_level !== undefined && 
                ingredient.quantity <= ingredient.minimum_stock_level)
                  ? 'text-[#571C1F] dark:text-[#571C1F] font-medium' 
                  : 'text-gray-800 dark:text-gray-600 font-medium'
              }`}>
                {ingredient.quantity !== undefined ? ingredient.quantity : 0} {ingredient.unit || ''}
                {ingredient.quantity !== undefined && ingredient.minimum_stock_level !== undefined && 
                ingredient.quantity <= ingredient.minimum_stock_level && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#571C1F]/10 border border-[#571C1F]/20 text-[#571C1F]"
                  >
                    <span className="w-1.5 h-1.5 bg-[#571C1F] rounded-full mr-1 animate-pulse"></span>
                    Low Stock
                  </motion.span>
                )}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-800 dark:text-[#571C1F] font-medium">
              {formatCurrency(ingredient.unit_cost || ingredient.cost_per_unit)}
            </td>
            <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
              <div className="flex justify-end space-x-2" onClick={e => e.stopPropagation()}>
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1.5 text-[#003B25] hover:text-[#003B25] hover:bg-[#003B25]/10 rounded-full transition"
                  aria-label="Edit ingredient"
                  title="Edit"
                  onClick={() => onEdit(ingredient)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1.5 text-[#571C1F] hover:text-[#571C1F] hover:bg-[#571C1F]/10 rounded-full transition"
                  aria-label="Delete ingredient"
                  title="Delete"
                  onClick={() => onDelete(ingredient.ingredient_id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </motion.button>
              </div>
            </td>
          </motion.tr>
        );
      }).filter(Boolean); // Filter out any null rows
    } else {
      return sortedData.map((item, index) => {
        // Skip rendering if the item object is null or undefined
        if (!item) return null;
        
        return (
          <motion.tr 
            key={item.item_id || `item-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="bg-white hover:bg-[#FFF6F2] dark:bg-dark-lighter dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
            onClick={(e) => {
              // Prevent triggering the row click when clicking on action buttons
              if (e.target.closest('button')) return;
              
              // Call the onView function with the item ID
              onView && onView(item);
            }}
          >
            <td className="px-6 py-4 text-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full border border-[#571C1F]/10 overflow-hidden bg-[#FFF6F2]">
                  <ImageWithFallback 
                    src={item.image}
                    alt={item.item_name}
                    id={`item-${item.item_id || index}`}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                </div>
                <div className="ml-3">
                  <div className="font-medium text-[#571C1F]">{item.item_name || 'No Name'}</div>
                  {item.description && (
                    <div className="text-xs text-gray-600 truncate max-w-xs">{item.description}</div>
                  )}
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-600 font-medium">
              {item.category || 'Uncategorized'}
            </td>
            <td className="px-6 py-4 text-sm text-[#571C1F] dark:text-[#571C1F] font-medium">
              {formatCurrency(item.base_price)}
            </td>
            <td className="px-6 py-4 text-sm">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                item.is_externally_sourced 
                  ? 'bg-[#571C1F]/10 border border-[#571C1F]/20 text-[#571C1F]' 
                  : 'bg-[#003B25]/10 border border-[#003B25]/20 text-[#003B25]'
              }`}>
                <span className={`w-1.5 h-1.5 ${item.is_externally_sourced ? 'bg-[#571C1F]' : 'bg-[#003B25]'} rounded-full mr-1`}></span>
                {item.is_externally_sourced ? 'External' : 'In-house'}
              </span>
            </td>
            <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
              <div className="flex justify-end space-x-2" onClick={e => e.stopPropagation()}>
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1.5 text-[#003B25] hover:text-[#003B25] hover:bg-[#003B25]/10 rounded-full transition"
                  aria-label="Edit item"
                  title="Edit"
                  onClick={() => onEdit(item)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1.5 text-[#571C1F] hover:text-[#571C1F] hover:bg-[#571C1F]/10 rounded-full transition"
                  aria-label="Delete item"
                  title="Delete"
                  onClick={() => onDelete(item.item_id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </motion.button>
              </div>
            </td>
          </motion.tr>
        );
      }).filter(Boolean); // Filter out any null rows
    }
  };

  // Update the renderIngredientModal function to use the viewOnly prop
  const renderIngredientModal = () => {
    if (!showDetailsModal || !selectedIngredient) return null;
    
    return (
      <Modal
        isOpen={showDetailsModal}
        onClose={handleCloseModal}
        title={viewMode ? "Ingredient Details" : "Edit Ingredient"}
        size="4xl"
        variant="primary"
      >
        {viewMode ? (
          <div>
            <IngredientForm
              ingredient={selectedIngredient}
              viewOnly={true}
            />
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleCloseModal}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={handleEditFromModal}
              >
                Edit Ingredient
              </Button>
            </div>
          </div>
        ) : (
          <IngredientForm
            ingredient={selectedIngredient}
            onSave={handleSaveFromModal}
            onCancel={handleCloseModal}
          />
        )}
      </Modal>
    );
  };

  // Update the return statement at the end to include the modal
  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <div className="relative rounded-md shadow-sm max-w-xs flex-grow sm:flex-grow-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={`Search ${type === 'ingredient' ? 'ingredients' : 'items'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-[#571C1F]/20 rounded-md focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {searchQuery && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-[#571C1F] focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="align-middle inline-block min-w-full">
          <div className="overflow-hidden border border-[#571C1F]/10 rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                {renderTableHeaders()}
              </thead>
              <tbody className="bg-white dark:bg-dark-lighter divide-y divide-[#571C1F]/10 dark:divide-gray-700">
                {renderTableRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {!loading && sortedData.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-xs flex items-center justify-between"
        >
          <span className="text-gray-800 dark:text-gray-600">
            Showing <span className="font-medium text-[#571C1F]">{sortedData.length}</span> of <span className="font-medium text-[#571C1F]">{data.length}</span> {type === 'ingredient' ? 'ingredients' : 'items'}
          </span>
          <span className="text-[#571C1F]/70">
            {searchQuery && `Search results for "${searchQuery}"`}
          </span>
        </motion.div>
      )}
      
      {/* Render ingredient modal */}
      {type === 'ingredient' && renderIngredientModal()}
    </div>
  );
};

export default InventoryList;