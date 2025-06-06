import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import Button from '../common/Button';
import { useInventory } from '../../hooks/useInventory';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';

// Validation schema aligned with database structure
const consignmentSchema = Yup.object({
  supplier_id: Yup.number().required('Supplier is required'),
  date: Yup.date().required('Date is required'),
  invoice_number: Yup.string().required('Invoice number is required'),
  reference_number: Yup.string(),
  items: Yup.array().of(
    Yup.object({
      item_id: Yup.number().required('Item is required'),
      quantity: Yup.number().positive('Quantity must be positive').required('Quantity is required'),
      supplier_price: Yup.number().min(0, 'Price cannot be negative').required('Supplier price is required'),
      production_date: Yup.date(),
      // lotNumber is a UI-only field, no validation needed
    })
  ).min(1, 'At least one item is required')
});

const ConsignmentForm = ({ 
  consignmentId = null, 
  suppliers = [], 
  onSave = () => {}, 
  onCancel = () => {} 
}) => {
  // Get auth context for user info
  const { user } = useAuth();
  
  // Get inventory data from the useInventory hook
  const { 
    ingredients, 
    items, 
    loading: inventoryLoading,
    fetchInventory
  } = useInventory();
  
  // Get supplier-related functions from useSuppliers
  const { 
    getConsignment,
    createConsignment, 
    updateConsignment 
  } = useSuppliers();

  const [isLoading, setIsLoading] = useState(false);
  const [consignmentData, setConsignmentData] = useState(null);
  
  // Determine if we're creating or editing
  const isEdit = !!consignmentId;
  
  // Fetch ingredients and items when component mounts
  useEffect(() => {
    // Fetch inventory data (includes both items and ingredients)
    fetchInventory();
    
    // If editing, fetch consignment data
    if (isEdit && getConsignment) {
      setIsLoading(true);
      
      getConsignment(consignmentId)
        .then(data => {
          if (data) {
            setConsignmentData(data);
          } else {
            toast.error('Could not find consignment data');
          }
        })
        .catch(error => {
          console.error('Error fetching consignment:', error);
          toast.error(`Failed to load consignment: ${error.message || 'Unknown error'}`);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [fetchInventory, consignmentId, isEdit, getConsignment]);
  
  // Initialize form with Formik
  const formik = useFormik({
    initialValues: {
      supplier_id: consignmentData?.supplier_id || '',
      date: consignmentData?.date || new Date().toISOString().split('T')[0],
      invoice_number: consignmentData?.invoice_number || '',
      reference_number: consignmentData?.reference_number || '',
      expectedPaymentDate: consignmentData?.expectedPaymentDate || '',
      items: consignmentData?.items?.length > 0 ? consignmentData.items.map(item => ({
        item_id: item.item_id?.toString() || '',
        quantity: item.quantity?.toString() || '',
        supplier_price: item.supplier_price?.toString() || '',
        production_date: item.production_date || '',
        lotNumber: item.lotNumber || ''
      })) : [
        { 
          item_id: '', 
          quantity: '', 
          supplier_price: '', 
          production_date: '', 
          lotNumber: '' 
        }
      ]
    },
    validationSchema: consignmentSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsLoading(true);
      
      try {
        // Calculate total amount
        const total = values.items.reduce(
          (sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.supplier_price)), 
          0
        );
        
        // Calculate usa_total for each item (matches database field)
        const itemsWithTotal = values.items.map(item => ({
          ...item,
          usa_total: parseFloat(item.quantity) * parseFloat(item.supplier_price)
        }));
        
        // Structure data according to database schema
        const consignmentPayload = {
          supplier_id: parseInt(values.supplier_id),
          date: values.date,
          invoice_number: values.invoice_number,
          reference_number: values.reference_number || null,
          manager_id: user?.id || null, 
          total: total,
          created_by: user?.id || null,
          approved_by: null,
          status: 'Pending',
          items: itemsWithTotal.map(item => ({
            item_id: parseInt(item.item_id),
            quantity: parseInt(item.quantity),
            supplier_price: parseFloat(item.supplier_price),
            production_date: item.production_date || null,
            usa_total: parseFloat(item.quantity) * parseFloat(item.supplier_price)
            // no created_at or updated_at here
          }))
        };
        
        let result;
        
        try {
          if (isEdit) {
            result = await updateConsignment(consignmentId, consignmentPayload);
            toast.success(`Consignment #${consignmentId} updated successfully`);
          } else {
            result = await createConsignment(consignmentPayload);
            toast.success('New consignment received successfully');
          }
          
          onSave(result);
        } catch (error) {
          console.error('Error saving consignment:', error);
          toast.error(`Failed to save consignment: ${error.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error preparing consignment data:', error);
        toast.error(`Failed to prepare consignment data: ${error.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
  });
  
  // Add a new item row
  const handleAddItem = () => {
    formik.setFieldValue('items', [
      ...formik.values.items,
      { item_id: '', quantity: '', supplier_price: '', production_date: '', lotNumber: '' }
    ]);
  };
  
  // Remove an item row
  const handleRemoveItem = (index) => {
    const updatedItems = [...formik.values.items];
    updatedItems.splice(index, 1);
    formik.setFieldValue('items', updatedItems);
  };
  
  // Calculate total for an item
  const calculateItemTotal = (quantity, supplier_price) => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(supplier_price) || 0;
    return (qty * price).toFixed(2);
  };
  
  // Calculate order total
  const calculateOrderTotal = () => {
    return formik.values.items.reduce(
      (sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.supplier_price) || 0), 
      0
    ).toFixed(2);
  };
  
  // Add this handler to auto-fill supplier_price when an item is selected
  const handleItemChange = (index, e) => {
    const itemId = e.target.value;
    
    // First, handle the normal formik onChange
    formik.handleChange(e);
    
    // If there's a valid item ID selected
    if (itemId) {
      // Find the selected item from the items array
      const selectedItem = items.find(item => item.item_id.toString() === itemId);
      
      if (selectedItem && selectedItem.base_price) {
        // Set the supplier price to the item's base price
        formik.setFieldValue(`items[${index}].supplier_price`, selectedItem.base_price);
      }
    }
  };
  
  if (isLoading && isEdit && !consignmentData) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="animate-spin h-8 w-8 text-[#571C1F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3 text-[#571C1F] font-medium">Loading consignment details...</span>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
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
                  ? "Update consignment details including items, quantities, and pricing" 
                  : "Record new inventory items received from suppliers"
                }
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <motion.div 
            className="bg-white rounded-lg border border-[#571C1F]/10 p-6 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h3 className="text-lg font-medium text-[#571C1F] mb-4">Consignment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Supplier */}
              <div>
                <label htmlFor="supplier_id" className="block text-sm font-medium text-[#571C1F] mb-1">
                  Supplier *
                </label>
                <select
                  id="supplier_id"
                  name="supplier_id"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
                    formik.touched.supplier_id && formik.errors.supplier_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.supplier_id}
                  disabled={isEdit}
                >
                  <option value="">Select a supplier</option>
                  {suppliers && suppliers.map(supplier => (
                    <option key={supplier.supplier_id} value={supplier.supplier_id}>
                      {supplier.company_name || supplier.supplier_name || 'Unknown Supplier'}
                    </option>
                  ))}
                </select>
                {formik.touched.supplier_id && formik.errors.supplier_id && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.supplier_id}</p>
                )}
                {isEdit && (
                  <p className="mt-1 text-xs text-gray-500">
                    Supplier cannot be changed when editing a consignment
                  </p>
                )}
              </div>
              
              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-[#571C1F] mb-1">
                  Date Received *
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
                    formik.touched.date && formik.errors.date ? 'border-red-500' : 'border-gray-300'
                  }`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.date}
                />
                {formik.touched.date && formik.errors.date && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.date}</p>
                )}
              </div>
              
              {/* Invoice Number */}
              <div>
                <label htmlFor="invoice_number" className="block text-sm font-medium text-[#571C1F] mb-1">
                  Invoice Number *
                </label>
                <input
                  id="invoice_number"
                  name="invoice_number"
                  type="text"
                  placeholder="Invoice number from supplier"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
                    formik.touched.invoice_number && formik.errors.invoice_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.invoice_number}
                />
                {formik.touched.invoice_number && formik.errors.invoice_number && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.invoice_number}</p>
                )}
              </div>
              
              {/* Reference Number */}
              <div>
                <label htmlFor="reference_number" className="block text-sm font-medium text-[#571C1F] mb-1">
                  Reference Number
                </label>
                <input
                  id="reference_number"
                  name="reference_number"
                  type="text"
                  placeholder="Optional internal reference"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
                    formik.touched.reference_number && formik.errors.reference_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.reference_number}
                />
                {formik.touched.reference_number && formik.errors.reference_number && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.reference_number}</p>
                )}
              </div>
              
              {/* Expected Payment Date */}
              <div>
                <label htmlFor="expectedPaymentDate" className="block text-sm font-medium text-[#571C1F] mb-1">
                  Expected Payment Date
                </label>
                <input
                  id="expectedPaymentDate"
                  name="expectedPaymentDate"
                  type="date"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
                    formik.touched.expectedPaymentDate && formik.errors.expectedPaymentDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.expectedPaymentDate}
                />
                {formik.touched.expectedPaymentDate && formik.errors.expectedPaymentDate && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.expectedPaymentDate}</p>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Consignment Items */}
          <motion.div 
            className="bg-white rounded-lg border border-[#571C1F]/10 p-6 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-[#571C1F]">Consignment Items</h3>
              <Button 
                type="button" 
                variant="primary" 
                size="sm"
                onClick={handleAddItem}
                className="flex items-center"
              >
                Add Item
              </Button>
            </div>
            
            {formik.touched.items && typeof formik.errors.items === 'string' && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-sm text-red-700">
                {formik.errors.items}
              </div>
            )}
            
            {formik.values.items.map((item, index) => (
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
                    onClick={() => handleRemoveItem(index)}
                    disabled={formik.values.items.length <= 1}
                    className={`p-1.5 text-[#571C1F] hover:text-[#571C1F] hover:bg-[#571C1F]/10 rounded-full transition ${
                      formik.values.items.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="Remove item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  {/* Item Selection */}
                  <div className="md:col-span-2">
                    <label htmlFor={`items[${index}].item_id`} className="block text-sm font-medium text-[#571C1F] mb-1">
                      Item *
                    </label>
                    <select
                      id={`items[${index}].item_id`}
                      name={`items[${index}].item_id`}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
                        formik.touched.items?.[index]?.item_id && formik.errors.items?.[index]?.item_id 
                          ? 'border-red-500' 
                          : 'border-gray-300'
                      }`}
                      onChange={(e) => handleItemChange(index, e)}
                      onBlur={formik.handleBlur}
                      value={item.item_id}
                    >
                      <option value="">Select an item</option>
                      {items.filter(item => item.is_externally_sourced === true).length > 0 ? (
                        items
                          .filter(item => item.is_externally_sourced === true)
                          .map(item => (
                            <option key={item.item_id} value={item.item_id}>
                              {item.item_name}
                            </option>
                          ))
                      ) : (
                        <option value="" disabled>No externally sourced items available</option>
                      )}
                    </select>
                    {formik.touched.items?.[index]?.item_id && formik.errors.items?.[index]?.item_id && (
                      <p className="mt-1 text-xs text-red-500">{formik.errors.items?.[index]?.item_id}</p>
                    )}
                  </div>
                  
                  {/* Quantity */}
                  <div>
                    <label htmlFor={`items[${index}].quantity`} className="block text-sm font-medium text-[#571C1F] mb-1">
                      Quantity *
                    </label>
                    <input
                      id={`items[${index}].quantity`}
                      name={`items[${index}].quantity`}
                      type="number"
                      min="0"
                      step="1"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
                        formik.touched.items?.[index]?.quantity && formik.errors.items?.[index]?.quantity 
                          ? 'border-red-500' 
                          : 'border-gray-300'
                      }`}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={item.quantity}
                    />
                    {formik.touched.items?.[index]?.quantity && formik.errors.items?.[index]?.quantity && (
                      <p className="mt-1 text-xs text-red-500">{formik.errors.items?.[index]?.quantity}</p>
                    )}
                  </div>
                  
                  {/* Supplier Price */}
                  <div>
                    <label htmlFor={`items[${index}].supplier_price`} className="block text-sm font-medium text-[#571C1F] mb-1">
                      Unit Price (₱) *
                    </label>
                    <input
                      id={`items[${index}].supplier_price`}
                      name={`items[${index}].supplier_price`}
                      type="number"
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
                        formik.touched.items?.[index]?.supplier_price && formik.errors.items?.[index]?.supplier_price 
                          ? 'border-red-500' 
                          : 'border-gray-300'
                      }`}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={item.supplier_price}
                    />
                    {formik.touched.items?.[index]?.supplier_price && formik.errors.items?.[index]?.supplier_price && (
                      <p className="mt-1 text-xs text-red-500">{formik.errors.items?.[index]?.supplier_price}</p>
                    )}
                  </div>
                  
                  {/* Production Date */}
                  <div>
                    <label htmlFor={`items[${index}].production_date`} className="block text-sm font-medium text-[#571C1F] mb-1">
                      Production Date
                    </label>
                    <input
                      id={`items[${index}].production_date`}
                      name={`items[${index}].production_date`}
                      type="date"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
                        formik.touched.items?.[index]?.production_date && formik.errors.items?.[index]?.production_date 
                          ? 'border-red-500' 
                          : 'border-gray-300'
                      }`}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={item.production_date || ''}
                    />
                  </div>
                  
                  {/* Lot Number */}
                  <div>
                    <label htmlFor={`items[${index}].lotNumber`} className="block text-sm font-medium text-[#571C1F] mb-1">
                      Lot Number
                    </label>
                    <input
                      id={`items[${index}].lotNumber`}
                      name={`items[${index}].lotNumber`}
                      type="text"
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F]"
                      onChange={formik.handleChange}
                      value={item.lotNumber || ''}
                    />
                  </div>
                  
                  {/* Subtotal */}
                  <div className="bg-[#571C1F]/5 p-3 rounded-md flex items-center justify-center">
                    <span className="font-medium text-sm text-[#571C1F]">
                      Subtotal: ₱{calculateItemTotal(item.quantity, item.supplier_price)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Order Summary */}
          <motion.div 
            className="bg-white rounded-lg border border-[#571C1F]/10 p-6 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-[#571C1F]">Order Summary</h3>
              <div className="text-xl font-bold text-[#571C1F]">₱{calculateOrderTotal()}</div>
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
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !formik.isValid || inventoryLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                isEdit ? 'Update Consignment' : 'Record Consignment'
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default ConsignmentForm;