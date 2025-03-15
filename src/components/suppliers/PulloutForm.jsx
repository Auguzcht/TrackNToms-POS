import { useState, useEffect } from 'react';
import Button from '../common/Button';
import { useInventory } from '../../hooks/useInventory';
import { useAuth } from '../../hooks/useAuth';
import Swal from 'sweetalert2';

const PulloutForm = ({ pulloutId = null, ingredients = [], onSave = () => {}, onCancel = () => {}, currentUser = null }) => {
  const { user } = useAuth();
  const { 
    ingredients: allIngredients, 
    loading: ingredientsLoading,
    pullouts, // Added to fetch pullout data directly
    createPullout,
    updatePullout,
    fetchPullouts // Make sure this is being provided by useInventory
  } = useInventory();
  
  const [form, setForm] = useState({
    ingredient_id: '',
    quantity: '',
    reason: '',
    date_of_pullout: new Date().toISOString().split('T')[0],
    staff_id: user?.id || '',
    manager_id: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingPullout, setLoadingPullout] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [originalQuantity, setOriginalQuantity] = useState(0);
  const [error, setError] = useState(null);

  // Determine if in edit mode
  useEffect(() => {
    setIsEdit(pulloutId !== null);
    
    // If editing an existing pullout, fetch its data
    if (pulloutId) {
      setLoadingPullout(true);
      setError(null);
      
      // First make sure we have the latest pullouts data
      const loadPulloutData = async () => {
        try {
          // First fetch the latest pullouts data to ensure we have current data
          if (fetchPullouts) {
            await fetchPullouts();
          }
          
          // Try to find the pullout in the updated state
          const pullout = pullouts?.find(p => p.pullout_id === parseInt(pulloutId));
          
          if (pullout) {
            setForm({
              ingredient_id: pullout.ingredient_id?.toString() || '',
              quantity: pullout.quantity?.toString() || '',
              reason: pullout.reason || '',
              date_of_pullout: pullout.date_of_pullout || new Date().toISOString().split('T')[0],
              staff_id: pullout.staff_id || user?.id || '',
              manager_id: pullout.manager_id || ''
            });
            
            // Store the original quantity for comparison when updating
            setOriginalQuantity(parseFloat(pullout.quantity) || 0);
          } else {
            // If pullout not found even after fetching, show an error
            setError(`Pullout record with ID ${pulloutId} not found. It may have been deleted.`);
            console.error(`Pullout with ID ${pulloutId} not found after fetching data`);
            
            // Don't throw here - instead, we'll show an error message in the UI
          }
        } catch (err) {
          console.error('Error fetching pullout details:', err);
          setError(`Could not load pullout record: ${err.message || 'Unknown error'}`);
        } finally {
          setLoadingPullout(false);
        }
      };
      
      loadPulloutData();
    }
  }, [pulloutId, pullouts, user?.id, fetchPullouts]);

  // Use either provided ingredients or all ingredients from hook
  const availableIngredients = ingredients.length > 0 ? ingredients : allIngredients;

  // Update selected ingredient when ingredient_id changes
  useEffect(() => {
    if (form.ingredient_id) {
      const ingredient = availableIngredients.find(i => i.ingredient_id.toString() === form.ingredient_id.toString());
      setSelectedIngredient(ingredient || null);
    } else {
      setSelectedIngredient(null);
    }
  }, [form.ingredient_id, availableIngredients]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.ingredient_id) return "Please select an ingredient";
    if (!form.quantity) return "Quantity is required";
    if (parseFloat(form.quantity) <= 0) return "Quantity must be greater than zero";
    
    // In edit mode, check if the new quantity is valid considering the original amount
    if (isEdit) {
      const newQuantity = parseFloat(form.quantity);
      const currentStock = selectedIngredient ? selectedIngredient.quantity : 0;
      
      // If increasing quantity, make sure there's enough stock
      if (newQuantity > originalQuantity && (newQuantity - originalQuantity) > currentStock) {
        return `Cannot increase quantity by more than available stock (${currentStock} ${selectedIngredient?.unit || 'units'})`;
      }
    } else {
      // In create mode, simply check against available stock
      if (selectedIngredient && parseFloat(form.quantity) > selectedIngredient.quantity) {
        return `Quantity cannot exceed available stock (${selectedIngredient.quantity} ${selectedIngredient.unit})`;
      }
    }
    
    if (!form.reason) return "Reason is required";
    if (!form.date_of_pullout) return "Date is required";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: validationError
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare data for submission
      const pulloutData = {
        ...form,
        ingredient_id: parseInt(form.ingredient_id),
        quantity: parseFloat(form.quantity),
        staff_id: form.staff_id || user?.id,
        manager_id: form.manager_id || null,
      };
      
      let result;
      
      if (isEdit) {
        result = await updatePullout(pulloutId, pulloutData);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Pullout record updated successfully'
        });
      } else {
        result = await createPullout(pulloutData);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Pullout request submitted successfully'
        });
      }
      
      onSave(result);
    } catch (error) {
      console.error('Error saving pullout:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'An error occurred while saving pullout record'
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (loadingPullout) {
    return (
      <div className="py-8 flex justify-center">
        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }
  
  // Show error state if we couldn't load the pullout data
  if (error) {
    return (
      <div className="py-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Error Loading Pullout Record</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <div className="mt-4 flex justify-center space-x-3">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Go Back
          </Button>
          <Button
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-900 p-3 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {isEdit 
                ? "Updating a pullout record will adjust the inventory quantities accordingly" 
                : "This will remove the specified quantity from inventory"
              }
            </p>
          </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="ingredient_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Ingredient
        </label>
        <select
          id="ingredient_id"
          name="ingredient_id"
          value={form.ingredient_id}
          onChange={handleChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark-light dark:text-white"
          disabled={loading || ingredientsLoading || isEdit}
        >
          <option value="">Select an ingredient</option>
          {availableIngredients.map((ingredient) => (
            <option key={ingredient.ingredient_id} value={ingredient.ingredient_id}>
              {ingredient.name} ({ingredient.quantity} {ingredient.unit} available)
            </option>
          ))}
        </select>
        {isEdit && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Ingredient cannot be changed when editing a pullout record
          </p>
        )}
      </div>
      
      {selectedIngredient && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Current stock: {selectedIngredient.quantity} {selectedIngredient.unit}
          </p>
          <div className={`text-sm mt-1 ${
            selectedIngredient.quantity <= selectedIngredient.minimum_quantity
              ? 'text-red-500'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            Minimum required: {selectedIngredient.minimum_quantity || 0} {selectedIngredient.unit}
          </div>
          {isEdit && (
            <div className="text-sm mt-2 text-amber-600 dark:text-amber-400">
              Original pullout quantity: {originalQuantity} {selectedIngredient.unit}
            </div>
          )}
        </div>
      )}
      
      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Quantity {selectedIngredient && `(${selectedIngredient.unit})`}
        </label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          step="0.01"
          min="0"
          max={isEdit ? undefined : selectedIngredient?.quantity || 9999}
          value={form.quantity}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark-light dark:border-gray-600 dark:text-white"
          disabled={loading || !selectedIngredient}
        />
      </div>
      
      <div>
        <label htmlFor="date_of_pullout" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Date
        </label>
        <input
          id="date_of_pullout"
          name="date_of_pullout"
          type="date"
          value={form.date_of_pullout}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark-light dark:border-gray-600 dark:text-white"
          disabled={loading}
        />
      </div>
      
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Reason for Pullout
        </label>
        <textarea
          id="reason"
          name="reason"
          rows="3"
          value={form.reason}
          onChange={handleChange}
          placeholder="Explain why this ingredient needs to be pulled out from inventory"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark-light dark:border-gray-600 dark:text-white"
          disabled={loading}
        ></textarea>
      </div>
      
      {(user?.role === 'Manager' || currentUser?.role === 'Manager') && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Manager Approval
          </h3>
          <div className="flex items-center">
            <input
              id="manager_approval"
              name="manager_approval"
              type="checkbox"
              checked={!!form.manager_id}
              onChange={(e) => {
                setForm(prev => ({
                  ...prev,
                  manager_id: e.target.checked ? user?.id || currentUser?.id : ''
                }));
              }}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="manager_approval" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Approve this pullout request
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            As a manager, you can immediately approve this request
          </p>
        </div>
      )}
      
      <div className="flex justify-end space-x-3 pt-4">
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
          disabled={loading || ingredientsLoading}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isEdit ? 'Updating...' : 'Submitting...'}
            </span>
          ) : (
            isEdit ? 'Update Pullout Record' : 'Submit Pullout Request'
          )}
        </Button>
      </div>
    </form>
  );
};

export default PulloutForm;