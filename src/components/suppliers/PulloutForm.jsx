import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '../common/Button';
import { useInventory } from '../../hooks/useInventory';
import { useAuth } from '../../hooks/useAuth';
import Swal from 'sweetalert2';
import supabase from '../../services/supabase'; 

const PulloutForm = ({ pulloutId = null, ingredients = [], onSave = () => {}, onCancel = () => {}, currentUser = null }) => {
  const { user } = useAuth();
  const { 
    ingredients: allIngredients, 
    loading: ingredientsLoading,
    pullouts,
    createPullout,
    updatePullout,
    fetchPullouts,
    getPullout
  } = useInventory();
  
  const [form, setForm] = useState({
    ingredient_id: '',
    quantity: '',
    reason: '',
    date_of_pullout: new Date().toISOString().split('T')[0],
    requested_by: user?.id || '',
    approved_by: ''
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
      
      const loadPulloutData = async () => {
        try {
          // Try to use the getPullout function from useInventory hook first
          let pullout;
          
          try {
            // First try to find it in the existing pullouts array
            pullout = pullouts?.find(p => p.pullout_id === parseInt(pulloutId));
            
            // If not found in state, use the getPullout function
            if (!pullout && getPullout) {
              pullout = await getPullout(pulloutId);
              console.log("Fetched pullout with getPullout:", pullout);
            }
            
            // If getPullout isn't available or fails, fall back to direct supabase query
            if (!pullout) {
              const { data } = await supabase
                .from('pullout')
                .select(`
                  *,
                  ingredients:ingredient_id (ingredient_id, name, unit)
                `)
                .eq('pullout_id', pulloutId)
                .single();
                
              if (data) {
                pullout = data;
                console.log("Fetched pullout directly with supabase:", pullout);
              }
            }
          } catch (fetchErr) {
            console.error("Error fetching specific pullout:", fetchErr);
            // Fall back to refreshing the entire pullouts list
            await fetchPullouts();
            pullout = pullouts?.find(p => p.pullout_id === parseInt(pulloutId));
          }
          
          if (pullout) {
            setForm({
              ingredient_id: pullout.ingredient_id?.toString() || '',
              quantity: pullout.quantity?.toString() || '',
              reason: pullout.reason || '',
              date_of_pullout: pullout.date_of_pullout || new Date().toISOString().split('T')[0],
              requested_by: pullout.requested_by || user?.id || '',
              approved_by: pullout.approved_by || ''
            });
            
            // Also fetch the ingredient to get current stock
            if (pullout.ingredient_id) {
              const ingredient = ingredients.find(
                i => i.ingredient_id.toString() === pullout.ingredient_id.toString()
              );
              
              if (ingredient) {
                setSelectedIngredient(ingredient);
              }
            }
            
            // Store the original quantity for comparison when updating
            setOriginalQuantity(parseFloat(pullout.quantity) || 0);
          } else {
            // Add more details to the error message
            console.log("Available pullouts:", pullouts);
            setError(`Pullout record with ID ${pulloutId} not found. It may have been deleted or not yet loaded.`);
            console.error(`Pullout with ID ${pulloutId} not found after fetching data`);
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
  }, [pulloutId, user?.id, fetchPullouts, ingredients, getPullout, pullouts]);

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
        requested_by: form.requested_by || user?.id,
        approved_by: form.approved_by || null,
      };
      
      let result;
      
      if (isEdit) {
        result = await updatePullout(pulloutId, pulloutData);
        // Refresh pullout data after update
        await fetchPullouts();
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Pullout record updated successfully'
        });
      } else {
        result = await createPullout(pulloutData);
        // Refresh pullout data after creation
        await fetchPullouts();
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
      <div className="flex items-center justify-center py-8">
        <svg className="animate-spin h-8 w-8 text-[#571C1F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3 text-[#571C1F] font-medium">Loading pullout details...</span>
      </div>
    );
  }
  
  // Show error state if we couldn't load the pullout data
  if (error) {
    return (
      <div className="w-full">
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <Button onClick={onCancel}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto">
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
                {isEdit 
                  ? "Updating a pullout record will adjust the inventory quantities accordingly" 
                  : "This will remove the specified quantity from inventory"
                }
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div 
            className="bg-white rounded-lg border border-[#571C1F]/10 p-6 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h3 className="text-lg font-medium text-[#571C1F] mb-4">
              Pullout Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="ingredient_id" className="block text-sm font-medium text-[#571C1F] mb-1">
                  Ingredient *
                </label>
                <select
                  id="ingredient_id"
                  name="ingredient_id"
                  value={form.ingredient_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] border-gray-300"
                  disabled={loading || ingredientsLoading || isEdit}
                  required
                >
                  <option value="">Select an ingredient</option>
                  {availableIngredients.map((ingredient) => (
                    <option key={ingredient.ingredient_id} value={ingredient.ingredient_id}>
                      {ingredient.name} ({ingredient.quantity} {ingredient.unit} available)
                    </option>
                  ))}
                </select>
                {isEdit && (
                  <p className="mt-1 text-xs text-gray-500">
                    Ingredient cannot be changed when editing a pullout record
                  </p>
                )}
              </div>
              
              {selectedIngredient && (
                <div className="p-4 bg-[#FFF6F2]/50 border border-[#571C1F]/10 rounded-md">
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F] mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-[#571C1F]">Inventory Information</span>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    <p className="mb-1">
                      <span className="font-medium">Current stock:</span> {selectedIngredient.quantity} {selectedIngredient.unit}
                    </p>
                    <p className={`${
                      selectedIngredient.quantity <= selectedIngredient.minimum_quantity
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      <span className="font-medium">Minimum required:</span> {selectedIngredient.minimum_quantity || 0} {selectedIngredient.unit}
                    </p>
                    {isEdit && (
                      <p className="mt-2 text-amber-600">
                        <span className="font-medium">Original pullout quantity:</span> {originalQuantity} {selectedIngredient.unit}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-[#571C1F] mb-1">
                    Quantity {selectedIngredient && `(${selectedIngredient.unit})`} *
                  </label>
                  <div className="flex rounded-md shadow-sm">
                    <input
                      id="quantity"
                      name="quantity"
                      type="number"
                      step="0.01"
                      min="0"
                      max={isEdit ? undefined : selectedIngredient?.quantity || 9999}
                      value={form.quantity}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] border-gray-300"
                      disabled={loading || !selectedIngredient}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="date_of_pullout" className="block text-sm font-medium text-[#571C1F] mb-1">
                    Date *
                  </label>
                  <input
                    id="date_of_pullout"
                    name="date_of_pullout"
                    type="date"
                    value={form.date_of_pullout}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] border-gray-300"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-[#571C1F] mb-1">
                  Reason for Pullout *
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows="3"
                  value={form.reason}
                  onChange={handleChange}
                  placeholder="Explain why this ingredient needs to be pulled out from inventory"
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] border-gray-300"
                  disabled={loading}
                  required
                ></textarea>
              </div>
              
              {(user?.role === 'Manager' || currentUser?.role === 'Manager') && (
                <div className="p-4 bg-[#FFF6F2]/50 border border-[#571C1F]/10 rounded-md">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-[#571C1F]">
                      Manager Approval
                    </h4>
                    <div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!form.approved_by}
                          onChange={(e) => {
                            setForm(prev => ({
                              ...prev,
                              approved_by: e.target.checked ? user?.id || currentUser?.id : ''
                            }));
                          }}
                          className="sr-only peer"
                          disabled={loading}
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#571C1F]/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#571C1F]"></div>
                        <span className="ml-3 text-sm font-medium text-gray-700">{!!form.approved_by ? 'Approved' : 'Not Approved'}</span>
                      </label>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    As a manager, you can immediately approve this request to adjust inventory quantities
                  </p>
                </div>
              )}
            </div>
          </motion.div>

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
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default PulloutForm;