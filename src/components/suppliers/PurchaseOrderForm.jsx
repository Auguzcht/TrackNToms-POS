import { useState, useEffect, useMemo } from 'react';
import Button from '../common/Button';
import { useInventory } from '../../hooks/useInventory';
import { useAuth } from '../../hooks/useAuth';
import { useSuppliers } from '../../hooks/useSuppliers';
import supabase from '../../services/supabase';
import Swal from 'sweetalert2';
import { UNITS } from '../../services/constants'; // Change from UNIT_OPTIONS to UNITS
import { motion } from 'framer-motion';

const PurchaseOrderForm = ({ 
  purchaseId = null, 
  suppliers = [], 
  onSubmit = () => {}, 
  onCancel = () => {} 
}) => {
  const { user } = useAuth();
  const { ingredients, fetchIngredients, loading: ingredientsLoading } = useInventory();
  const { getPurchaseOrder, loading: purchaseLoading } = useSuppliers();
  
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({
    notes: '',
    supplier_id: '',
    created_by: user?.id || ''
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState([
    { ingredient_id: '', name: '', quantity: '', unit: '', unit_price: '', subtotal: 0 }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [purchaseData, setPurchaseData] = useState(null);
  const [supplierAssociations, setSupplierAssociations] = useState([]);
  
  // Filtered ingredients based on search term
  const filteredIngredients = useMemo(() => {
    if (!searchTerm) return [];
    
    return ingredients.filter(ingredient => 
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10); // Limit to 10 results for performance
  }, [ingredients, searchTerm]);
  
  // Fetch ingredients on component mount
  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  // Load existing purchase order if in edit mode
  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      if (!purchaseId) return;
      
      setIsEdit(true);
      setLoading(true);
      
      try {
        const data = await getPurchaseOrder(purchaseId);
        setPurchaseData(data);
        
        // Set form data
        setForm({
          notes: data.notes || '',
          supplier_id: data.supplier_id?.toString() || '',
          created_by: data.created_by || user?.id || ''
        });
        
        // Set order items
        if (data.items && data.items.length > 0) {
          setOrderItems(data.items.map(item => ({
            ingredient_id: item.ingredient_id,
            name: item.ingredient_name || '',
            quantity: item.quantity?.toString() || '',
            unit: item.ingredient_unit || '',
            unit_price: item.unit_price?.toString() || '',
            subtotal: item.subtotal || 0
          })));
        }
      } catch (error) {
        console.error('Error fetching purchase order:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Failed to load purchase order: ${error.message}`
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPurchaseOrder();
  }, [purchaseId, getPurchaseOrder, user]);
  
  // Load supplier associations when supplier is selected
  useEffect(() => {
    const loadSupplierAssociations = async () => {
      if (!form.supplier_id) {
        setSupplierAssociations([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('ingredient_suppliers')
          .select(`
            *,
            ingredients:ingredient_id (ingredient_id, name, unit)
          `)
          .eq('supplier_id', form.supplier_id);
          
        if (error) throw error;
        
        setSupplierAssociations(data || []);
      } catch (err) {
        console.error('Error loading supplier associations:', err);
      }
    };
    
    loadSupplierAssociations();
  }, [form.supplier_id]);

  // Update created_by whenever user changes
  useEffect(() => {
    if (user?.id && !isEdit) {
      setForm(prev => ({ ...prev, created_by: user.id }));
    }
  }, [user, isEdit]);
  
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
    
    // Update ingredient name and unit when selected from dropdown
    if (field === 'ingredient_id' && value) {
      const selectedIngredient = ingredients.find(ing => ing.ingredient_id.toString() === value);
      if (selectedIngredient) {
        updatedItems[index].name = selectedIngredient.name;
        updatedItems[index].unit = selectedIngredient.unit;
        
        // If this ingredient is associated with the selected supplier, pre-fill the price
        const association = supplierAssociations.find(
          a => a.ingredient_id.toString() === value
        );
        if (association && association.typical_price) {
          updatedItems[index].unit_price = association.typical_price.toString();
        }
      }
    }
    
    // If quantity or unit_price changed, recalculate subtotal
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' 
        ? parseFloat(value) || 0 
        : parseFloat(updatedItems[index].quantity) || 0;
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
      { ingredient_id: '', name: '', quantity: '', unit: '', unit_price: '', subtotal: 0 }
    ]);
  };
  
  const removeOrderItem = (index) => {
    if (orderItems.length === 1) {
      // Keep at least one item
      setOrderItems([
        { ingredient_id: '', name: '', quantity: '', unit: '', unit_price: '', subtotal: 0 }
      ]);
    } else {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };
  
  const validateForm = () => {
    if (!form.created_by) return "Staff ID is required";
    if (!form.supplier_id) return "Please select a supplier";
    
    // Check if at least one item is properly filled
    let hasValidItem = false;
    
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      
      if (item.ingredient_id && item.quantity && item.unit_price) {
        hasValidItem = true;
        
        // Validate quantity is positive
        if (parseFloat(item.quantity) <= 0) {
          return `Item #${i + 1}: Quantity must be greater than zero`;
        }
        
        // Validate price is positive
        if (parseFloat(item.unit_price) <= 0) {
          return `Item #${i + 1}: Price must be greater than zero`;
        }
        
        // Validate price format
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
      
      // Calculate total amount
      const totalAmount = validItems.reduce(
        (sum, item) => sum + item.subtotal, 
        0
      );
      
      // Create purchase order data object
      const purchaseData = {
        // Purchase header fields
        created_by: form.created_by,
        supplier_id: parseInt(form.supplier_id),
        total_amount: parseFloat(totalAmount.toFixed(2)),
        status: 'pending', // Always starts as pending
        purchase_date: new Date().toISOString(), // Add purchase date
        
        // Purchase details items
        purchase_details: validItems.map(item => ({
          ingredient_id: parseInt(item.ingredient_id),
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(parseFloat(item.unit_price).toFixed(2)),
          subtotal: parseFloat(item.subtotal.toFixed(2))
          // Remove created_at and updated_at fields
        })),
        
        // Additional data
        notes: form.notes
      };
      
      console.log('Submitting purchase data:', purchaseData);
      
      // Try to directly insert into Supabase as a fallback
      if (!isEdit) {
        try {
          console.log('Trying direct Supabase insert as fallback...');
          
          // First, create the purchase header
          const { data: newPurchase, error: purchaseError } = await supabase
            .from('purchase')
            .insert([{
              created_by: form.created_by,
              supplier_id: parseInt(form.supplier_id),
              purchase_date: new Date().toISOString(),
              total_amount: parseFloat(totalAmount.toFixed(2)),
              status: 'pending',
              notes: form.notes,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select();
          
          if (purchaseError) {
            console.error('Error creating purchase in Supabase:', purchaseError);
            throw purchaseError;
          }
          
          console.log('Purchase header created:', newPurchase);
          
          if (newPurchase && newPurchase.length > 0) {
            // Now create purchase details
            const purchaseId = newPurchase[0].purchase_id;
            
            const purchaseDetails = validItems.map(item => ({
              purchase_id: purchaseId,
              ingredient_id: parseInt(item.ingredient_id),
              quantity: parseFloat(item.quantity),
              unit_price: parseFloat(parseFloat(item.unit_price).toFixed(2)),
              subtotal: parseFloat(item.subtotal.toFixed(2))
              // Remove created_at and updated_at fields
            }));
            
            const { data: detailsData, error: detailsError } = await supabase
              .from('purchase_details')
              .insert(purchaseDetails);
            
            if (detailsError) {
              console.error('Error creating purchase details in Supabase:', detailsError);
            } else {
              console.log('Purchase details created successfully');
            }
          }
        } catch (directError) {
          console.error('Direct Supabase insertion failed:', directError);
        }
      }
      
      // Submit to parent
      onSubmit(purchaseData, isEdit ? 'update' : 'create', purchaseId);
      
      // Update supplier associations with latest pricing
      for (const item of validItems) {
        try {
          // Check if association already exists
          const { data: existingAssoc, error: checkError } = await supabase
            .from('ingredient_suppliers')
            .select('*')
            .eq('ingredient_id', item.ingredient_id)
            .eq('supplier_id', parseInt(form.supplier_id))
            .single();
          
          if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking supplier association:', checkError);
            continue;
          }
          
          if (!existingAssoc) {
            // Create new association
            const { error: insertError } = await supabase
              .from('ingredient_suppliers')
              .insert({
                ingredient_id: item.ingredient_id,
                supplier_id: parseInt(form.supplier_id),
                typical_price: parseFloat(item.unit_price),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
            if (insertError) {
              console.error('Error creating supplier association:', insertError);
            }
          } else if (existingAssoc.typical_price !== parseFloat(item.unit_price)) {
            // Update existing association with latest price
            const { error: updateError } = await supabase
              .from('ingredient_suppliers')
              .update({
                typical_price: parseFloat(item.unit_price),
                updated_at: new Date().toISOString()
              })
              .eq('ingredient_id', item.ingredient_id)
              .eq('supplier_id', parseInt(form.supplier_id));
              
            if (updateError) {
              console.error('Error updating supplier association:', updateError);
            }
          }
        } catch (err) {
          console.error('Error managing ingredient-supplier association:', err);
        }
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: isEdit ? 'Purchase order updated successfully' : 'Purchase order created successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error saving purchase order:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'An error occurred while saving purchase order'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Purchase order header */}
      <motion.div 
        className="bg-transparent rounded-lg border border-gray-200 p-4 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-md font-medium text-white mb-3">Order Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Show purchase date only for existing orders */}
          {isEdit && purchaseData?.purchase_date && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Purchase Date
              </label>
              <div className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
                {new Date(purchaseData.purchase_date).toLocaleString()}
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              id="supplier_id"
              name="supplier_id"
              value={form.supplier_id}
              onChange={handleChangeForm}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-dark-light dark:text-white"
              disabled={loading || isEdit}
              required
            >
              <option value="">Select a supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.supplier_id} value={supplier.supplier_id}>
                  {supplier.company_name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {isEdit ? "Supplier cannot be changed for existing orders" : "Select the supplier for this purchase order"}
            </p>
          </div>
          
          {/* Total amount display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Amount
            </label>
            <div className="mt-1 text-lg font-bold text-[#571C1F]">
              ₱{totalAmount.toFixed(2)}
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Purchase order items */}
      <motion.div 
        className="bg-transparent rounded-lg border border-gray-200 p-4 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h3 className="text-md font-medium text-white mb-3">Order Items</h3>
        
        <div className="space-y-4">
          {orderItems.map((item, index) => (
            <motion.div 
              key={index} 
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              {/* Item header with remove button */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-[#571C1F]">
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove
                </Button>
              </div>
              
              {/* Item details */}
              <div className="space-y-4">
                {/* Ingredient selector with fuzzy search */}
                <div>
                  <label htmlFor={`ingredient_${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ingredient <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Ingredient search field and dropdown */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search or add a new ingredient..."
                      value={item.name}
                      onChange={(e) => {
                        handleChangeItem(index, 'name', e.target.value);
                        setSearchTerm(e.target.value);
                        // Clear ingredient_id when searching
                        if (!e.target.value) {
                          handleChangeItem(index, 'ingredient_id', '');
                        }
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-dark-light dark:border-gray-600 dark:text-white"
                      disabled={loading}
                      required
                    />
                    
                    {searchTerm && filteredIngredients.length > 0 && !item.ingredient_id && (
                      <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredIngredients.map(ingredient => (
                          <div
                            key={ingredient.ingredient_id}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-700"
                            onClick={() => {
                              handleChangeItem(index, 'ingredient_id', ingredient.ingredient_id.toString());
                              handleChangeItem(index, 'name', ingredient.name);
                              handleChangeItem(index, 'unit', ingredient.unit);
                              setSearchTerm('');
                              
                              // Check if this ingredient has a typical price from this supplier
                              const association = supplierAssociations.find(
                                a => a.ingredient_id === ingredient.ingredient_id
                              );
                              if (association && association.typical_price) {
                                handleChangeItem(index, 'unit_price', association.typical_price.toString());
                              }
                            }}
                          >
                            <div className="font-medium text-white">{ingredient.name}</div>
                            <div className="text-xs text-gray-300">
                              {ingredient.unit} • Current stock: {ingredient.quantity}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Show associated suppliers if this ingredient has any */}
                  {item.ingredient_id && supplierAssociations.some(a => a.ingredient_id.toString() === item.ingredient_id) && (
                    <div className="mt-1 text-xs text-green-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      This ingredient is already associated with this supplier
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor={`quantity_${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      id={`quantity_${index}`}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={e => handleChangeItem(index, 'quantity', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-dark-light dark:border-gray-600 dark:text-white"
                      disabled={loading}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor={`unit_${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Unit
                    </label>
                    <select
                      id={`unit_${index}`}
                      value={item.unit}
                      onChange={e => handleChangeItem(index, 'unit', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-dark-light dark:border-gray-600 dark:text-white"
                      disabled={loading || item.ingredient_id} // Disable if ingredient is selected
                    >
                      <option value="">Select unit</option>
                      {UNITS.map(unit => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                    {item.ingredient_id && (
                      <p className="mt-1 text-xs text-gray-500">
                        Unit is determined by the selected ingredient
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor={`unit_price_${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Unit Price (₱) <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₱</span>
                      </div>
                      <input
                        id={`unit_price_${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={e => handleChangeItem(index, 'unit_price', e.target.value)}
                        className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-dark-light dark:border-gray-600 dark:text-white"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {item.subtotal > 0 && (
                  <div className="text-right font-medium text-[#571C1F]">
                    Subtotal: ₱{item.subtotal.toFixed(2)}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          <div className="pt-2">
            <Button
              type="button"
              variant="primary" // Changed from "outline" to "primary"
              onClick={addOrderItem}
              disabled={loading}
              className="w-full flex items-center justify-center"
            >
              <span className="whitespace-nowrap">Add Another Item</span>
            </Button>
          </div>
        </div>
      </motion.div>
      
      {/* Notes */}
      <motion.div 
        className="bg-transparent rounded-lg border border-gray-200 p-4 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h3 className="text-md font-medium text-white mb-3">Additional Information</h3>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Order Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows="3"
            value={form.notes}
            onChange={handleChangeForm}
            placeholder="Add any additional instructions or notes for this purchase order"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-dark-light dark:border-gray-600 dark:text-white"
            disabled={loading}
          ></textarea>
        </div>
      </motion.div>
      
      {/* Form actions */}
      <motion.div 
        className="flex justify-end space-x-3 pt-4"
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
            isEdit ? 'Update Order' : 'Create Order'
          )}
        </Button>
      </motion.div>
    </form>
  );
};

export default PurchaseOrderForm;
