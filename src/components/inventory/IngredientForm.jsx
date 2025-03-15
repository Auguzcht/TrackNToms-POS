import { useState, useEffect } from 'react';
import Button from '../common/Button';
import { useInventory } from '../../hooks/useInventory';
import Swal from 'sweetalert2';
import FileUpload from '../common/FileUpload';
import { motion } from 'framer-motion';

const IngredientForm = ({ ingredient = null, onSave = () => {}, onCancel = () => {} }) => {
  const { addIngredient, updateIngredient } = useInventory();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    unit: '',
    quantity: '',
    minimum_quantity: '',
    unit_cost: '',
    image: ''
  });
  const [imageUrl, setImageUrl] = useState('');
  const [imagePath, setImagePath] = useState('');
  
  // Set form data if editing an existing ingredient
  useEffect(() => {
    if (ingredient) {
      setForm({
        name: ingredient.name || '',
        unit: ingredient.unit || '',
        quantity: ingredient.quantity || '',
        minimum_quantity: ingredient.minimum_quantity || '',
        unit_cost: ingredient.unit_cost || '',
        image: ingredient.image || ''
      });
      setImageUrl(ingredient.image || '');
    }
  }, [ingredient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.name) return "Name is required";
    if (!form.unit) return "Unit is required";
    if (!form.quantity) return "Quantity is required";
    if (parseFloat(form.quantity) < 0) return "Quantity must be positive";
    if (!form.minimum_quantity) return "Minimum quantity is required";
    if (parseFloat(form.minimum_quantity) < 0) return "Minimum quantity must be positive";
    if (!form.unit_cost) return "Unit cost is required";
    if (parseFloat(form.unit_cost) <= 0) return "Unit cost must be greater than zero";
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
      const ingredientData = {
        ...form,
        quantity: parseFloat(form.quantity),
        minimum_quantity: parseFloat(form.minimum_quantity),
        unit_cost: parseFloat(form.unit_cost),
        image: imageUrl || form.image,
      };

      if (ingredient) {
        await updateIngredient(ingredient.ingredient_id, ingredientData);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Ingredient updated successfully'
        });
      } else {
        await addIngredient(ingredientData);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Ingredient added successfully'
        });
      }
      
      onSave();
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
      {/* Use h-full to make sure child divs can stretch to full height */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
        {/* Image Section - Added h-full and flex flex-col to make container take full height */}
        <div className="lg:col-span-1 h-full">
          <motion.div 
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
              Ingredient Image
            </h3>
            
            {/* Make FileUpload take up available space with flex-grow */}
            <div className="flex-grow flex flex-col">
              <FileUpload
                category="ingredients"
                onUploadComplete={handleImageUploadComplete}
                onUploadError={handleImageUploadError}
                onDeleteComplete={handleImageDelete}
                accept="image/jpeg,image/png,image/gif"
                maxSize={2}
                initialPreview={imageUrl || form.image}
                previewClass="w-full h-60 object-contain rounded-md" // Increased height
                alt={form.name || "Ingredient image"}
                className="w-full mb-3 flex-grow" // Added flex-grow
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-auto text-center">
              Upload a clear image of the ingredient
            </p>
          </motion.div>
        </div>
        
        {/* Ingredient Details - Added h-full and flex flex-col */}
        <div className="lg:col-span-2 h-full">
          <motion.div 
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
              Ingredient Details
            </h3>
            
            <div className="space-y-4 flex-grow">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300">
                  Name*
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g. Coffee Beans"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300">
                    Current Stock*
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      id="quantity"
                      name="quantity"
                      type="number"
                      step="0.01"
                      value={form.quantity}
                      onChange={handleChange}
                      className="flex-grow px-3 py-2 border border-r-0 border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="e.g. 10.5"
                    />
                    <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md dark:bg-gray-600 dark:border-gray-600 dark:text-gray-200">
                      {form.unit || 'units'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300">
                    Unit of Measure*
                  </label>
                  <select
                    id="unit"
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="" disabled>Select a unit</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (l)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="pack">Pack</option>
                    <option value="box">Box</option>
                    <option value="bottle">Bottle</option>
                    <option value="cup">Cup</option>
                    <option value="tbsp">Tablespoon (tbsp)</option>
                    <option value="tsp">Teaspoon (tsp)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="minimum_quantity" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300">
                    Reorder Level*
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      id="minimum_quantity"
                      name="minimum_quantity"
                      type="number"
                      step="0.01"
                      value={form.minimum_quantity}
                      onChange={handleChange}
                      className="flex-grow px-3 py-2 border border-r-0 border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="e.g. 2.0"
                    />
                    <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md dark:bg-gray-600 dark:border-gray-600 dark:text-gray-200">
                      {form.unit || 'units'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Alert will be shown when stock falls below this level
                  </p>
                </div>
                
                <div>
                  <label htmlFor="unit_cost" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300">
                    Unit Cost (₱)*
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md dark:bg-gray-600 dark:border-gray-600 dark:text-gray-200">
                      ₱
                    </span>
                    <input
                      id="unit_cost"
                      name="unit_cost"
                      type="number"
                      step="0.01"
                      value={form.unit_cost}
                      onChange={handleChange}
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="e.g. 100.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
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
            ingredient ? 'Update Ingredient' : 'Add Ingredient'
          )}
        </Button>
      </motion.div>
    </form>
  );
};

export default IngredientForm;