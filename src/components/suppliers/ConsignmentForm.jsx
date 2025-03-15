import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import Button from '../common/Button';
import Card from '../common/Card';
import { useInventory } from '../../hooks/useInventory';
import { useSuppliers } from '../../hooks/useSuppliers'; // Make sure to import useSuppliers

// Validation schema aligned with database structure
const consignmentSchema = Yup.object({
  supplier_id: Yup.number().required('Supplier is required'),
  date: Yup.date().required('Date is required'),
  // We keep invoice number for UI, but will store extra fields in a metadata JSON if needed
  invoiceNumber: Yup.string().required('Invoice number is required'),
  expectedPaymentDate: Yup.date(),
  items: Yup.array().of(
    Yup.object({
      item_id: Yup.number().required('Item is required'),
      quantity: Yup.number().positive('Quantity must be positive').required('Quantity is required'),
      supplier_price: Yup.number().min(0, 'Price cannot be negative').required('Supplier price is required'),
      production_date: Yup.date(),
      lotNumber: Yup.string()
    })
  ).min(1, 'At least one item is required')
});

const ConsignmentForm = ({ 
  consignmentId = null, 
  suppliers = [], 
  onSave = () => {}, 
  onCancel = () => {} 
}) => {
  // Get inventory data from the useInventory hook
  const { 
    ingredients, 
    items, 
    loading: inventoryLoading,
    fetchInventory // Use fetchInventory instead of separate fetch functions 
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
            // Handle case where no data is returned
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
    } else if (isEdit) {
      // If getConsignment is not available, simulate with mock data
      setIsLoading(true);
      
      // For this example, we'll simulate fetching data
      setTimeout(() => {
        const mockConsignment = {
          consignment_id: consignmentId,
          supplier_id: 1,
          date: '2023-03-01',
          manager_id: 1, // Added to match DB schema
          total: 5000,   // Renamed from totalAmount to match DB schema
          // Additional UI fields - not in DB schema but useful for UI
          invoiceNumber: 'INV-12345',
          expectedPaymentDate: '2023-04-01',
          items: [
            {
              consignment_id: consignmentId,
              item_id: 1,
              quantity: 10,
              supplier_price: 250,
              production_date: '2023-06-01',
              usa_total: 2500, // Added to match DB schema
              // UI only field
              lotNumber: 'LOT-001'
            },
            {
              consignment_id: consignmentId,
              item_id: 3,
              quantity: 5,
              supplier_price: 300,
              production_date: '2023-05-15',
              usa_total: 1500, // Added to match DB schema
              // UI only field
              lotNumber: 'LOT-002'
            }
          ]
        };
        
        setConsignmentData(mockConsignment);
        setIsLoading(false);
      }, 500);
    }
  }, [fetchInventory, consignmentId, isEdit, getConsignment]);
  
  // Initialize form with Formik
  const formik = useFormik({
    initialValues: {
      supplier_id: consignmentData?.supplier_id || '',
      date: consignmentData?.date || new Date().toISOString().split('T')[0],
      invoiceNumber: consignmentData?.invoiceNumber || '',
      expectedPaymentDate: consignmentData?.expectedPaymentDate || '',
      items: consignmentData?.items || [
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
        
        // Calculate usa_total for each item
        const itemsWithTotal = values.items.map(item => ({
          ...item,
          usa_total: parseFloat(item.quantity) * parseFloat(item.supplier_price)
        }));
        
        const consignmentPayload = {
          ...values,
          total,
          manager_id: 1, // In a real app, this would come from the authenticated user
          items: itemsWithTotal
        };
        
        let result;
        
        if (isEdit) {
          // Update existing consignment
          if (updateConsignment) {
            result = await updateConsignment(consignmentId, consignmentPayload);
          } else {
            // Simulate API call if updateConsignment not available
            await new Promise(resolve => setTimeout(resolve, 1000));
            result = { ...consignmentPayload, id: consignmentId };
          }
        } else {
          // Create new consignment
          if (createConsignment) {
            result = await createConsignment(consignmentPayload);
          } else {
            // Simulate API call if createConsignment not available
            await new Promise(resolve => setTimeout(resolve, 1000));
            result = { ...consignmentPayload, id: Date.now() };
          }
        }
        
        toast.success(
          isEdit 
            ? `Consignment #${consignmentId} updated successfully` 
            : 'New consignment received successfully'
        );
        
        onSave(result);
      } catch (error) {
        console.error('Error saving consignment:', error);
        toast.error(`Failed to save consignment: ${error.message || 'Unknown error'}`);
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
  
  if (isLoading && isEdit && !consignmentData) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
        {isEdit ? `Edit Consignment #${consignmentId}` : 'Record New Consignment'}
      </h2>
      
      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {/* Consignment Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supplier */}
          <div>
            <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Supplier *
            </label>
            <select
              id="supplier_id"
              name="supplier_id"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark dark:text-white dark:border-gray-700 ${
                formik.touched.supplier_id && formik.errors.supplier_id ? 'border-red-500 dark:border-red-500' : 'border-gray-300'
              }`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.supplier_id}
            >
              <option value="">Select a supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.supplier_id} value={supplier.supplier_id}>
                  {supplier.supplier_name}
                </option>
              ))}
            </select>
            {formik.touched.supplier_id && formik.errors.supplier_id && (
              <p className="mt-1 text-xs text-red-500">{formik.errors.supplier_id}</p>
            )}
          </div>
          
          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date *
            </label>
            <input
              id="date"
              name="date"
              type="date"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark dark:text-white dark:border-gray-700 ${
                formik.touched.date && formik.errors.date ? 'border-red-500 dark:border-red-500' : 'border-gray-300'
              }`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.date}
            />
            {formik.touched.date && formik.errors.date && (
              <p className="mt-1 text-xs text-red-500">{formik.errors.date}</p>
            )}
          </div>
          
          {/* Invoice Number - UI field, not in DB schema */}
          <div>
            <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Invoice Number *
            </label>
            <input
              id="invoiceNumber"
              name="invoiceNumber"
              type="text"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark dark:text-white dark:border-gray-700 ${
                formik.touched.invoiceNumber && formik.errors.invoiceNumber ? 'border-red-500 dark:border-red-500' : 'border-gray-300'
              }`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.invoiceNumber}
            />
            {formik.touched.invoiceNumber && formik.errors.invoiceNumber && (
              <p className="mt-1 text-xs text-red-500">{formik.errors.invoiceNumber}</p>
            )}
          </div>
          
          {/* Expected Payment Date - UI field, not in DB schema */}
          <div>
            <label htmlFor="expectedPaymentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Expected Payment Date
            </label>
            <input
              id="expectedPaymentDate"
              name="expectedPaymentDate"
              type="date"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark dark:text-white dark:border-gray-700 ${
                formik.touched.expectedPaymentDate && formik.errors.expectedPaymentDate ? 'border-red-500 dark:border-red-500' : 'border-gray-300'
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
        
        {/* Consignment Items */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Consignment Items</h3>
          
          {formik.values.items.map((item, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md mb-4 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Item */}
                <div>
                  <label htmlFor={`items[${index}].item_id`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Item *
                  </label>
                  <select
                    id={`items[${index}].item_id`}
                    name={`items[${index}].item_id`}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark dark:text-white dark:border-gray-700 ${
                      formik.touched.items?.[index]?.item_id && formik.errors.items?.[index]?.item_id 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-300'
                    }`}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={item.item_id}
                  >
                    <option value="">Select an item</option>
                    {items.map(item => (
                      <option key={item.item_id} value={item.item_id}>
                        {item.item_name}
                      </option>
                    ))}
                  </select>
                  {formik.touched.items?.[index]?.item_id && formik.errors.items?.[index]?.item_id && (
                    <p className="mt-1 text-xs text-red-500">{formik.errors.items?.[index]?.item_id}</p>
                  )}
                </div>
                
                {/* Quantity and Supplier Price */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Quantity */}
                  <div>
                    <label htmlFor={`items[${index}].quantity`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantity *
                    </label>
                    <input
                      id={`items[${index}].quantity`}
                      name={`items[${index}].quantity`}
                      type="number"
                      min="0"
                      step="1"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark dark:text-white dark:border-gray-700 ${
                        formik.touched.items?.[index]?.quantity && formik.errors.items?.[index]?.quantity 
                          ? 'border-red-500 dark:border-red-500' 
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
                    <label htmlFor={`items[${index}].supplier_price`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Supplier Price (₱) *
                    </label>
                    <input
                      id={`items[${index}].supplier_price`}
                      name={`items[${index}].supplier_price`}
                      type="number"
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark dark:text-white dark:border-gray-700 ${
                        formik.touched.items?.[index]?.supplier_price && formik.errors.items?.[index]?.supplier_price 
                          ? 'border-red-500 dark:border-red-500' 
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
                </div>
                
                {/* Optional Fields: Production Date and Lot Number */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Production Date */}
                  <div>
                    <label htmlFor={`items[${index}].production_date`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Production Date
                    </label>
                    <input
                      id={`items[${index}].production_date`}
                      name={`items[${index}].production_date`}
                      type="date"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark dark:text-white dark:border-gray-700 ${
                        formik.touched.items?.[index]?.production_date && formik.errors.items?.[index]?.production_date 
                          ? 'border-red-500 dark:border-red-500' 
                          : 'border-gray-300'
                      }`}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={item.production_date || ''}
                    />
                    {formik.touched.items?.[index]?.production_date && formik.errors.items?.[index]?.production_date && (
                      <p className="mt-1 text-xs text-red-500">{formik.errors.items?.[index]?.production_date}</p>
                    )}
                  </div>
                  
                  {/* Lot Number - UI field, not in DB schema */}
                  <div>
                    <label htmlFor={`items[${index}].lotNumber`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Lot Number
                    </label>
                    <input
                      id={`items[${index}].lotNumber`}
                      name={`items[${index}].lotNumber`}
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark dark:text-white dark:border-gray-700 ${
                        formik.touched.items?.[index]?.lotNumber && formik.errors.items?.[index]?.lotNumber 
                          ? 'border-red-500 dark:border-red-500' 
                          : 'border-gray-300'
                      }`}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={item.lotNumber || ''}
                    />
                    {formik.touched.items?.[index]?.lotNumber && formik.errors.items?.[index]?.lotNumber && (
                      <p className="mt-1 text-xs text-red-500">{formik.errors.items?.[index]?.lotNumber}</p>
                    )}
                  </div>
                </div>

                {/* Item Total */}
                <div className="md:col-span-3 flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total: ₱{calculateItemTotal(item.quantity, item.supplier_price)}
                    </span>
                  </div>

                  {/* Remove Item Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={formik.values.items.length <= 1}
                    className={`p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ${
                      formik.values.items.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add Item Button */}
          <div className="mt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleAddItem}
              size="sm"
              className="flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Another Item
            </Button>
          </div>

          {/* Display any array-level errors */}
          {formik.touched.items && typeof formik.errors.items === 'string' && (
            <p className="mt-2 text-sm text-red-500">{formik.errors.items}</p>
          )}
        </div>

        {/* Order Summary */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex justify-between items-center text-lg font-medium">
            <span className="text-gray-700 dark:text-gray-300">Total Amount:</span>
            <span className="text-gray-900 dark:text-white">₱{calculateOrderTotal()}</span>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
            disabled={isLoading || !formik.isValid || inventoryLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              isEdit ? 'Update Consignment' : 'Record Consignment'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ConsignmentForm;