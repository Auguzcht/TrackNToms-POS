import { useState, useEffect } from 'react';
import Button from '../common/Button';
import { useInventory } from '../../hooks/useInventory';
import { useAuth } from '../../hooks/useAuth';
import Swal from 'sweetalert2';

const PurchaseOrderForm = ({ onSubmit, onCancel, managers = [] }) => {
  const { user } = useAuth();
  const { ingredients, loading: ingredientsLoading } = useInventory();
  
  const [form, setForm] = useState({
    purchase_date: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDThh:mm
    notes: '',
    manager_id: '', // Changed from null to empty string for select compatibility
    staff_id: user?.id || '' // Added to explicitly track the staff_id from the database
  });
  
  const [orderItems, setOrderItems] = useState([
    { ingredient_id: '', quantity: '', unit_price: '', subtotal: 0, product_expiration_date: '' }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Update staff_id whenever user changes
  useEffect(() => {
    if (user?.id) {
      setForm(prev => ({ ...prev, staff_id: user.id }));
    }
  }, [user]);
  
  // Calculate total amount whenever order items change
  useEffect(() => {
    const total = orderItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    setTotalAmount(total);
  }, [orderItems]);
  
  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleChangeItem = (index, field, value) => {
    const updatedItems = [...orderItems];
    updatedItems[index][field] = value;
    
    // If quantity or unit_price changed, recalculate subtotal
    if (field === 'quantity' || field === 'unit_price') {
      // Ensure quantity is an integer as per database schema
      const quantity = field === 'quantity' 
        ? parseInt(value) || 0 
        : parseInt(updatedItems[index].quantity) || 0;
      const unitPrice = field === 'unit_price' 
        ? parseFloat(value) || 0 
        : parseFloat(updatedItems[index].unit_price) || 0;
      updatedItems[index].subtotal = quantity * unitPrice;
    }
    
    setOrderItems(updatedItems);
  };
  
  const addOrderItem = () => {
    setOrderItems([
      ...orderItems,
      { ingredient_id: '', quantity: '', unit_price: '', subtotal: 0, product_expiration_date: '' }
    ]);
  };
  
  const removeOrderItem = (index) => {
    if (orderItems.length === 1) {
      // Keep at least one item
      setOrderItems([
        { ingredient_id: '', quantity: '', unit_price: '', subtotal: 0, product_expiration_date: '' }
      ]);
    } else {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };
  
  const getIngredientById = (id) => {
    return ingredients.find(ingredient => ingredient.ingredient_id.toString() === id.toString());
  };
  
  const validateForm = () => {
    if (!form.purchase_date) return "Purchase date and time is required";
    if (!form.staff_id) return "Staff ID is required"; // Additional validation for staff_id
    
    // Check if at least one item is properly filled
    let hasValidItem = false;
    
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      
      if (item.ingredient_id && item.quantity && item.unit_price) {
        hasValidItem = true;
        
        // Validate quantity is an integer
        if (!Number.isInteger(parseFloat(item.quantity))) {
          return `Item #${i + 1}: Quantity must be a whole number`;
        }
        
        // Validate price format to match database decimal(7,2)
        if (parseFloat(item.unit_price) > 99999.99) {
          return `Item #${i + 1}: Unit price exceeds maximum allowed value`;
        }
      } else if (item.ingredient_id || item.quantity || item.unit_price) {
        // Partially filled item - error
        return `Item #${i + 1} is incomplete. Please fill all required fields or remove it.`;
      }
    }
    
    if (!hasValidItem) {
      return "At least one item is required";
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
      // Filter out empty items
      const validItems = orderItems.filter(item => 
        item.ingredient_id && item.quantity && item.unit_price
      );
      
      // Prepare data for submission - aligned with database schema
      const purchaseData = {
        // Purchase header table fields
        purchase_date: form.purchase_date,
        staff_id: user.id, // Use authenticated user ID
        manager_id: form.manager_id || null, // Convert empty string back to null for DB
        total_amount: parseFloat(totalAmount.toFixed(2)), // Ensure proper decimal format for MySQL
        
        // Purchase details items
        purchase_details: validItems.map(item => ({
          ingredient_id: parseInt(item.ingredient_id),
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(parseFloat(item.unit_price).toFixed(2)), // Format to match decimal(7,2)
          subtotal: parseFloat(item.subtotal.toFixed(2)), // Format to match decimal(12,2)
          product_expiration_date: item.product_expiration_date || null
        })),
        
        // Additional data not in main tables
        notes: form.notes
      };
      
      console.log('Submitting purchase order:', purchaseData);
      
      // Simulate successful order creation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Purchase order created successfully'
      });
      
      onSubmit(purchaseData);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'An error occurred while creating purchase order'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Purchase order header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Purchase Date and Time <span className="text-red-500">*</span>
          </label>
          <input
            id="purchase_date"
            name="purchase_date"
            type="datetime-local"
            value={form.purchase_date}
            onChange={handleChangeForm}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark-light dark:border-gray-600 dark:text-white"
            disabled={loading}
            required
          />
        </div>
        
        <div>
          <label htmlFor="manager_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Manager Approval (Optional)
          </label>
          <select
            id="manager_id"
            name="manager_id"
            value={form.manager_id}
            onChange={handleChangeForm}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark-light dark:text-white"
            disabled={loading}
          >
            <option value="">Select a manager</option>
            {managers.map(manager => (
              <option key={manager.manager_id} value={manager.manager_id}>
                {manager.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Manager approval may be required for certain purchase orders
          </p>
        </div>
      </div>
      
      {/* Current Staff/User Info */}
      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-medium">Created by:</span> {user?.name || 'Unknown User'}
        </p>
      </div>
      
      {/* Purchase order items */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Order Items</h3>
        
        <div className="space-y-4">
          {orderItems.map((item, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Item #{index + 1}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => removeOrderItem(index)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  disabled={loading}
                >
                  Remove
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor={`ingredient_id_${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ingredient <span className="text-red-500">*</span>
                  </label>
                  <select
                    id={`ingredient_id_${index}`}
                    value={item.ingredient_id}
                    onChange={e => handleChangeItem(index, 'ingredient_id', e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark-light dark:text-white"
                    disabled={loading || ingredientsLoading}
                    required={index === 0}
                  >
                    <option value="">Select an ingredient</option>
                    {ingredients.map((ingredient) => (
                      <option key={ingredient.ingredient_id} value={ingredient.ingredient_id}>
                        {ingredient.name} ({ingredient.unit})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor={`quantity_${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quantity <span className="text-red-500">*</span> {item.ingredient_id && getIngredientById(item.ingredient_id) ? `(${getIngredientById(item.ingredient_id).unit})` : ''}
                  </label>
                  <input
                    id={`quantity_${index}`}
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={e => handleChangeItem(index, 'quantity', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark-light dark:border-gray-600 dark:text-white"
                    disabled={loading || !item.ingredient_id}
                    required={index === 0}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Must be a whole number
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`unit_price_${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Unit Price (₱) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id={`unit_price_${index}`}
                    type="number"
                    min="0"
                    max="99999.99" // Added max value to match decimal(7,2)
                    step="0.01"
                    value={item.unit_price}
                    onChange={e => handleChangeItem(index, 'unit_price', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark-light dark:border-gray-600 dark:text-white"
                    disabled={loading || !item.ingredient_id}
                    required={index === 0}
                  />
                </div>
                
                <div>
                  <label htmlFor={`product_expiration_date_${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Expiration Date (Optional)
                  </label>
                  <input
                    id={`product_expiration_date_${index}`}
                    type="date"
                    value={item.product_expiration_date}
                    onChange={e => handleChangeItem(index, 'product_expiration_date', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark-light dark:border-gray-600 dark:text-white"
                    disabled={loading || !item.ingredient_id}
                  />
                </div>
              </div>
              
              {item.subtotal > 0 && (
                <div className="text-right mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subtotal: ₱{item.subtotal.toFixed(2)}
                </div>
              )}
            </div>
          ))}
          
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOrderItem}
              disabled={loading}
              className="w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Another Item
            </Button>
          </div>
        </div>
      </div>
      
      {/* Order summary */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium text-gray-900 dark:text-white">Total Order Amount:</span>
          <span className="text-2xl font-bold text-primary">₱{totalAmount.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows="3"
          value={form.notes}
          onChange={handleChangeForm}
          placeholder="Add any additional instructions or notes for this purchase order"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark-light dark:border-gray-600 dark:text-white"
          disabled={loading}
        ></textarea>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Note: These notes will be stored separately from the purchase record
        </p>
      </div>
      
      {/* Form actions */}
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
              Submitting...
            </span>
          ) : (
            'Create Purchase Order'
          )}
        </Button>
      </div>
    </form>
  );
};

export default PurchaseOrderForm;