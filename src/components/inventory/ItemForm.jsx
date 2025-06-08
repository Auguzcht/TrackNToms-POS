import { useState, useEffect } from 'react';
import Button from '../common/Button';
import { useInventory } from '../../hooks/useInventory';
import Swal from 'sweetalert2';
import FileUpload from '../common/FileUpload';
import { motion } from 'framer-motion';
import { PRODUCT_CATEGORIES } from '../../services/constants';

// Create a formatted version of PRODUCT_CATEGORIES for display purposes
const formattedCategories = PRODUCT_CATEGORIES.map(category => ({
  value: category.value,
  label: category.label
    .split(' ')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
    .replace('&', '&')
}));

const ItemForm = ({ item = null, ingredients = [], onSubmit, onCancel }) => {
  const { addItem, updateItem, fetchItemIngredients, updateItemIngredients } = useInventory();
  const [loading, setLoading] = useState(false);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [form, setForm] = useState({
    item_name: '',
    category: 'espresso_beverage', // Default to espresso_beverage
    base_price: '',
    description: '',
    is_externally_sourced: false
  });
  const [imageUrl, setImageUrl] = useState('');
  const [imagePath, setImagePath] = useState('');
  
  // State for recipe ingredients
  const [recipeIngredients, setRecipeIngredients] = useState([
    { ingredient_id: '', quantity: '' }
  ]);
  
  // Set form data if editing an existing item
  useEffect(() => {
    if (item) {
      setForm({
        item_name: item.item_name || '',
        category: item.category || 'espresso_beverage',
        base_price: item.base_price || '',
        description: item.description || '',
        is_externally_sourced: item.is_externally_sourced || false
      });
      setImageUrl(item.image || '');
      
      // Load recipe ingredients if it's not an externally sourced item
      if (item.item_id && !item.is_externally_sourced) {
        loadRecipeIngredients(item.item_id);
      }
    }
  }, [item]);
  
  // Load existing recipe ingredients
  const loadRecipeIngredients = async (itemId) => {
    try {
      setLoadingRecipe(true);
      const recipe = await fetchItemIngredients(itemId);
      
      if (recipe && recipe.length > 0) {
        // Transform to match our state structure
        const formattedRecipe = recipe.map(ing => ({
          ingredient_id: ing.ingredient_id.toString(),
          quantity: ing.quantity_per_item.toString()
        }));
        setRecipeIngredients(formattedRecipe);
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load recipe ingredients'
      });
    } finally {
      setLoadingRecipe(false);
    }
  };

  // Handle adding a new ingredient row
  const addIngredientToRecipe = () => {
    setRecipeIngredients([...recipeIngredients, { ingredient_id: '', quantity: '' }]);
  };

  // Handle removing an ingredient
  const removeIngredientFromRecipe = (index) => {
    if (recipeIngredients.length === 1) {
      // Keep at least one empty row
      setRecipeIngredients([{ ingredient_id: '', quantity: '' }]);
    } else {
      const updated = [...recipeIngredients];
      updated.splice(index, 1);
      setRecipeIngredients(updated);
    }
  };

  // Handle ingredient field changes
  const handleRecipeIngredientChange = (index, field, value) => {
    const updated = [...recipeIngredients];
    updated[index][field] = value;
    setRecipeIngredients(updated);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // If externally sourced is checked, reset recipe ingredients
    if (name === 'is_externally_sourced' && checked) {
      setRecipeIngredients([{ ingredient_id: '', quantity: '' }]);
    }
  };

  const validateForm = () => {
    if (!form.item_name) return "Name is required";
    if (!form.base_price) return "Price is required";
    if (parseFloat(form.base_price) <= 0) return "Price must be greater than zero";
    
    // Validate recipe if not externally sourced
    if (!form.is_externally_sourced) {
      // Check if at least one valid ingredient
      const hasValidIngredient = recipeIngredients.some(ing => 
        ing.ingredient_id && parseFloat(ing.quantity) > 0
      );
      
      if (!hasValidIngredient) {
        return "Add at least one ingredient to the recipe with a valid quantity";
      }
      
      // Check for invalid quantities
      for (let i = 0; i < recipeIngredients.length; i++) {
        const ing = recipeIngredients[i];
        if (ing.ingredient_id && (!ing.quantity || parseFloat(ing.quantity) <= 0)) {
          return `Ingredient #${i + 1} has an invalid quantity`;
        }
      }
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: error
      });
      return;
    }

    setLoading(true);
    
    try {
      const formattedData = {
        ...form,
        base_price: parseFloat(form.base_price),
        image: imageUrl || form.image
      };
      
      let result;
      
      if (item) {
        // Update existing item
        result = await updateItem(item.item_id, formattedData);
        
        // Update recipe if not externally sourced
        if (!form.is_externally_sourced) {
          // Filter out incomplete ingredients
          const validIngredients = recipeIngredients.filter(
            ing => ing.ingredient_id && ing.quantity
          );
          
          // Format recipe for API
          const formattedRecipe = validIngredients.map(ing => ({
            ingredient_id: parseInt(ing.ingredient_id),
            quantity: parseFloat(ing.quantity)
          }));
          
          await updateItemIngredients(item.item_id, formattedRecipe);
        }
        
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Menu item updated successfully'
        });
      } else {
        // Create new item
        result = await addItem(formattedData);
        
        // Add recipe if not externally sourced and if item was created successfully
        if (!form.is_externally_sourced && result) {
          // Filter out incomplete ingredients
          const validIngredients = recipeIngredients.filter(
            ing => ing.ingredient_id && ing.quantity
          );
          
          // Format recipe for API
          const formattedRecipe = validIngredients.map(ing => ({
            ingredient_id: parseInt(ing.ingredient_id),
            quantity: parseFloat(ing.quantity)
          }));
          
          await updateItemIngredients(result.item_id, formattedRecipe);
        }
        
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Menu item added successfully'
        });
      }
      
      // Immediately pass back the result to trigger list refresh
      onSubmit(result);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'An error occurred while saving'
      });
    } finally {
      setLoading(false);
    }
  };

  // Image handling functions
  const handleImageUploadComplete = (result) => {
    setImageUrl(result.url);
    setImagePath(result.path);
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Image uploaded successfully'
    });
  };

  const handleImageUploadError = (error) => {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: `Failed to upload image: ${error.message}`
    });
  };

  const handleImageDelete = () => {
    setImageUrl('');
    setForm(prev => ({ ...prev, image: '' }));
  };

  // Helper to get ingredient name by ID
  const getIngredientName = (id) => {
    const ingredient = ingredients.find(i => i.ingredient_id.toString() === id);
    return ingredient ? ingredient.name : '';
  };

  // Helper to get ingredient unit by ID
  const getIngredientUnit = (id) => {
    const ingredient = ingredients.find(i => i.ingredient_id.toString() === id);
    return ingredient ? ingredient.unit : '';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                {item 
                  ? "Edit menu item details and customize the recipe ingredients if applicable" 
                  : "Add a new menu item with image, details, and recipe ingredients if applicable"
                }
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {/* Product Image Section */}
            <div className="md:col-span-1 h-full">
              <motion.div 
                className="bg-white rounded-lg border border-[#571C1F]/10 p-6 shadow-sm h-full flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-medium text-[#571C1F] mb-4">
                  Product Image
                </h3>
                
                <div className="flex-grow flex flex-col">
                  <FileUpload
                    category="products"
                    onUploadComplete={handleImageUploadComplete}
                    onUploadError={handleImageUploadError}
                    onDeleteComplete={handleImageDelete}
                    accept="image/jpeg,image/png,image/gif"
                    maxSize={2} // 2MB max
                    initialPreview={imageUrl || form.image}
                    previewClass="w-full h-60 object-contain rounded-md"
                    alt={form.item_name || "Product image"}
                    className="w-full mb-3 flex-grow"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-auto text-center">
                  Upload a clear image of the product
                </p>
              </motion.div>
            </div>
            
            {/* Product Details Section */}
            <div className="md:col-span-2 h-full">
              <motion.div 
                className="bg-white rounded-lg border border-[#571C1F]/10 p-6 shadow-sm h-full flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <h3 className="text-lg font-medium text-[#571C1F] mb-4">
                  Product Details
                </h3>
                
                <div className="flex-grow space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="item_name" className="block text-sm font-medium text-[#571C1F] mb-1">
                        Item Name *
                      </label>
                      <input
                        id="item_name"
                        name="item_name"
                        type="text"
                        value={form.item_name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] border-gray-300"
                        placeholder="Enter item name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-[#571C1F] mb-1">
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] border-gray-300"
                      >
                        {formattedCategories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="base_price" className="block text-sm font-medium text-[#571C1F] mb-1">
                        Base Price (₱) *
                      </label>
                      <div className="flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          ₱
                        </span>
                        <input
                          id="base_price"
                          name="base_price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.base_price}
                          onChange={handleChange}
                          className="flex-1 py-2 px-3 border rounded-r-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] border-gray-300"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center h-full mt-auto">
                      <label className="flex items-center cursor-pointer">
                        <input
                          id="is_externally_sourced"
                          name="is_externally_sourced"
                          type="checkbox"
                          checked={form.is_externally_sourced}
                          onChange={handleChange}
                          className="h-4 w-4 text-[#571C1F] focus:ring-[#571C1F] border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Externally Sourced (Pre-made/Supplied)
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    <label htmlFor="description" className="block text-sm font-medium text-[#571C1F] mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows="4"
                      value={form.description}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] border-gray-300"
                      placeholder="Enter item description"
                    ></textarea>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Recipe Section - Only show if not externally sourced */}
            {!form.is_externally_sourced && (
              <motion.div 
                className="md:col-span-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <div className="bg-white rounded-lg border border-[#571C1F]/10 p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-[#571C1F]">
                      Recipe Ingredients
                    </h3>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={addIngredientToRecipe}
                      className="flex items-center"
                    >
                      Add Ingredient
                    </Button>
                  </div>
                  
                  {loadingRecipe ? (
                    <div className="bg-[#FFF6F2]/50 p-4 rounded-md flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-[#571C1F] mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Loading recipe...</span>
                    </div>
                  ) : recipeIngredients.length > 0 ? (
                    <div className="space-y-4">
                      {recipeIngredients.map((ing, index) => (
                        <motion.div 
                          key={index}
                          className="bg-[#FFF6F2] p-5 rounded-lg mb-4 border border-[#571C1F]/10 relative"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <div className="absolute right-2 top-2">
                            <button
                              type="button"
                              onClick={() => removeIngredientFromRecipe(index)}
                              disabled={recipeIngredients.length <= 1}
                              className={`p-1.5 text-[#571C1F] hover:text-[#571C1F] hover:bg-[#571C1F]/10 rounded-full transition ${
                                recipeIngredients.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title="Remove ingredient"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-[#571C1F] mb-1">
                                Ingredient *
                              </label>
                              <select
                                value={ing.ingredient_id}
                                onChange={(e) => handleRecipeIngredientChange(index, 'ingredient_id', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] border-gray-300"
                              >
                                <option value="">Select an ingredient</option>
                                {ingredients.map(ingredient => (
                                  <option key={ingredient.ingredient_id} value={ingredient.ingredient_id}>
                                    {ingredient.name} ({ingredient.unit})
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-[#571C1F] mb-1">
                                Quantity {ing.ingredient_id ? `(${getIngredientUnit(ing.ingredient_id)})` : ''} *
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={ing.quantity}
                                onChange={(e) => handleRecipeIngredientChange(index, 'quantity', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] border-gray-300"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#FFF6F2]/50 p-4 rounded-md border border-[#571C1F]/10">
                      <p className="text-sm text-gray-600">
                        This section allows you to define ingredients and their quantities needed to create this item.
                        <br />
                        <span className="italic mt-2 block">No ingredients have been added to this recipe yet.</span>
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Form Actions */}
          <motion.div 
            className="flex justify-end space-x-3 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || loadingRecipe}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                item ? 'Update Item' : 'Add Item'
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default ItemForm;