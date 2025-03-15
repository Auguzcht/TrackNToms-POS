import { useState, useEffect } from 'react';
import Button from '../common/Button';
import { useInventory } from '../../hooks/useInventory';
import Swal from 'sweetalert2';
import FileUpload from '../common/FileUpload';
import { motion } from 'framer-motion';

const ItemForm = ({ item = null, ingredients = [], onSubmit, onCancel }) => {
  const { addItem, updateItem } = useInventory();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    item_name: '',
    category: 'Coffee',
    base_price: '',
    description: '',
    is_externally_sourced: false
  });
  const [imageUrl, setImageUrl] = useState('');
  const [imagePath, setImagePath] = useState('');
  
  // Set form data if editing an existing item
  useEffect(() => {
    if (item) {
      setForm({
        item_name: item.item_name || '',
        category: item.category || 'Coffee',
        base_price: item.base_price || '',
        description: item.description || '',
        is_externally_sourced: item.is_externally_sourced || false
      });
      setImageUrl(item.image || '');
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!form.item_name) return "Name is required";
    if (!form.base_price) return "Price is required";
    if (parseFloat(form.base_price) <= 0) return "Price must be greater than zero";
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
    
    // Convert numeric strings to actual numbers
    const formattedData = {
      ...form,
      base_price: parseFloat(form.base_price),
      image: imageUrl || form.image
    };

    try {
      if (item) {
        await updateItem(item.item_id, formattedData);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Menu item updated successfully'
        });
      } else {
        await addItem(formattedData);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Menu item added successfully'
        });
      }
      
      onSubmit();
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

  return (
    <form onSubmit={handleSubmit} className="w-full overflow-visible">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {/* Product Image Section */}
        <div className="md:col-span-1 h-full">
          <motion.div 
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
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
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-auto text-center">
              Upload a clear image of the product
            </p>
          </motion.div>
        </div>
        
        {/* Product Details Section */}
        <div className="md:col-span-2 h-full">
          <motion.div 
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
              Product Details
            </h3>
            
            <div className="flex-grow space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="item_name" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300">
                    Item Name*
                  </label>
                  <input
                    id="item_name"
                    name="item_name"
                    type="text"
                    value={form.item_name}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter item name"
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="Coffee">Coffee</option>
                    <option value="Pastries">Pastries</option>
                    <option value="Food">Food</option>
                    <option value="Utensils">Utensils</option>
                    <option value="Add Ons">Add Ons</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="base_price" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300">
                    Base Price (₱)*
                  </label>
                  <input
                    id="base_price"
                    name="base_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.base_price}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="0.00"
                  />
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
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Externally Sourced (Pre-made/Supplied)
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="flex-grow">
                <label htmlFor="description" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  value={form.description}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter item description"
                ></textarea>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recipe Section - conditionally shown */}
        {!form.is_externally_sourced && (
          <motion.div 
            className="md:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  Recipe Ingredients
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    Swal.fire({
                      title: 'Recipe functionality',
                      text: 'Recipe ingredients management would be implemented here',
                      icon: 'info'
                    });
                  }}
                >
                  Manage Recipe
                </Button>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This section allows you to define ingredients and their quantities needed to create this item.
                  <br />
                  <span className="italic mt-2 block">Currently no ingredients have been added to this recipe.</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      <motion.div 
        className="mt-6 flex justify-end space-x-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
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
          disabled={loading}
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
  );
};

export default ItemForm;