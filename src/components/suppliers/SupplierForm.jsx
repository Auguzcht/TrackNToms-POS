import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import Button from '../common/Button';
import { useSuppliers } from '../../hooks/useSuppliers';
import FileUpload from '../common/FileUpload';
import { motion } from 'framer-motion';

// Validation schema for supplier form aligned with database schema
const supplierSchema = Yup.object({
  // Core DB fields
  supplier_name: Yup.string()
    .required('Supplier name is required')
    .max(100, 'Name should be 100 characters or less'),
  supplier_contact: Yup.string()
    .max(100, 'Contact information should be 100 characters or less'),
  supplier_email: Yup.string()
    .email('Invalid email address')
    .max(100, 'Email should be 100 characters or less'),
  // Additional fields stored as JSON in metadata column or handled by application logic
  contactPerson: Yup.string()
    .max(100, 'Contact person name should be 100 characters or less'),
  phone: Yup.string()
    .matches(/^(\+?\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}$/, 'Invalid phone number')
    .max(20, 'Phone number should be 20 characters or less'),
  address: Yup.string()
    .max(255, 'Address should be 255 characters or less'),
  city: Yup.string()
    .max(50, 'City should be 50 characters or less'),
  state: Yup.string()
    .max(50, 'State/Province should be 50 characters or less'),
  postalCode: Yup.string()
    .max(20, 'Postal code should be 20 characters or less'),
  country: Yup.string()
    .max(50, 'Country should be 50 characters or less'),
  website: Yup.string()
    .url('Invalid URL format')
    .max(100, 'Website should be 100 characters or less'),
  notes: Yup.string()
    .max(500, 'Notes should be 500 characters or less'),
  paymentTerms: Yup.string()
    .max(100, 'Payment terms should be 100 characters or less'),
  isActive: Yup.boolean()
});

const SupplierForm = ({ supplierId = null, onSave = () => {}, onCancel = () => {} }) => {
  const { createSupplier, updateSupplier, getSupplier, loading } = useSuppliers();
  const [supplierData, setSupplierData] = useState(null);
  const [loadingSupplier, setLoadingSupplier] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPath, setLogoPath] = useState('');

  // FIXED: Clear check for null or undefined and use clearer variable name
  const isNewSupplier = supplierId === null || supplierId === undefined;

  console.log("SupplierForm rendering:", { supplierId, isNewSupplier });

  // Fetch supplier data if editing
  useEffect(() => {
    // FIXED: More explicit condition check that doesn't depend on derived state
    if (supplierId !== null && supplierId !== undefined) {
      console.log("Fetching supplier data for ID:", supplierId);
      setLoadingSupplier(true);
      getSupplier(supplierId)
        .then(data => {
          console.log("Supplier data received:", data);
          if (!data) {
            throw new Error(`No supplier found with ID ${supplierId}`);
          }
          // Transform database data to form format
          const transformedData = {
            supplier_name: data.supplier_name || '',
            supplier_contact: data.supplier_contact || '',
            supplier_email: data.supplier_email || '',
            // Parse any additional fields from metadata or use defaults
            ...parseAdditionalFields(data),
            isActive: data.status === 'Active'
          };
          setSupplierData(transformedData);
          setLogoUrl(data.logo || '');
        })
        .catch(error => {
          console.error('Error fetching supplier details:', error);
          setErrorMessage(`Failed to load supplier details: ${error.message}`);
        })
        .finally(() => {
          setLoadingSupplier(false);
        });
    }
  // FIXED: Removed isNewSupplier from dependencies to avoid circular updates
  }, [getSupplier, supplierId]);

  // Helper function to parse additional fields from metadata or other storage
  const parseAdditionalFields = (data) => {
    try {
      // If your application stores additional fields as JSON in a metadata column
      // or in related tables, parse them here
      const metadata = data.metadata ? JSON.parse(data.metadata) : {};
      
      return {
        contactPerson: metadata.contactPerson || '',
        phone: metadata.phone || '',
        address: metadata.address || '',
        city: metadata.city || '',
        state: metadata.state || '',
        postalCode: metadata.postalCode || '',
        country: metadata.country || '',
        website: metadata.website || '',
        notes: metadata.notes || '',
        paymentTerms: metadata.paymentTerms || '',
      };
    } catch (error) {
      console.error('Error parsing supplier metadata:', error);
      return {
        contactPerson: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        website: '',
        notes: '',
        paymentTerms: '',
      };
    }
  };

  // Initialize formik with enableReinitialize to update when supplierData changes
  const formik = useFormik({
    initialValues: {
      supplier_name: supplierData?.supplier_name || '',
      supplier_contact: supplierData?.supplier_contact || '',
      supplier_email: supplierData?.supplier_email || '',
      contactPerson: supplierData?.contactPerson || '',
      phone: supplierData?.phone || '',
      address: supplierData?.address || '',
      city: supplierData?.city || '',
      state: supplierData?.state || '',
      postalCode: supplierData?.postalCode || '',
      country: supplierData?.country || '',
      website: supplierData?.website || '',
      notes: supplierData?.notes || '',
      paymentTerms: supplierData?.paymentTerms || '',
      isActive: supplierData?.isActive !== undefined ? supplierData.isActive : true,
      logo: supplierData?.logo || ''
    },
    validationSchema: supplierSchema,
    enableReinitialize: true, // CRITICAL: This ensures form updates when supplierData changes
    onSubmit: async (values) => {
      try {
        // Transform form data to database format
        const dbData = {
          supplier_name: values.supplier_name,
          supplier_contact: values.supplier_contact || values.phone || '',  // Use contact field or phone as fallback
          supplier_email: values.supplier_email,
          status: values.isActive ? 'Active' : 'Inactive',
          // Store additional fields as needed by your application
          metadata: JSON.stringify({
            contactPerson: values.contactPerson,
            phone: values.phone,
            address: values.address,
            city: values.city,
            state: values.state,
            postalCode: values.postalCode,
            country: values.country,
            website: values.website,
            notes: values.notes,
            paymentTerms: values.paymentTerms,
          }),
          logo: logoUrl || values.logo
        };
        
        let result;
        
        if (isNewSupplier) {
          // Create new supplier
          result = await createSupplier(dbData);
          toast.success(`Supplier ${values.supplier_name} created successfully`);
        } else {
          // Update existing supplier
          result = await updateSupplier(supplierId, dbData);
          toast.success(`Supplier ${values.supplier_name} updated successfully`);
        }
        
        // Call the onSave callback with the result
        onSave(result);
      } catch (error) {
        console.error('Error saving supplier:', error);
        toast.error(error.message || 'Failed to save supplier. Please try again.');
      }
    }
  });

  // Handle file upload completion
  const handleLogoUploadComplete = (result) => {
    setLogoUrl(result.url);
    setLogoPath(result.path);
    toast.success('Logo uploaded successfully');
  };
  
  // Handle file upload error
  const handleLogoUploadError = (error) => {
    toast.error(`Failed to upload logo: ${error.message}`);
  };
  
  // Handle logo deletion
  const handleLogoDelete = () => {
    setLogoUrl('');
    formik.setFieldValue('logo', '');
    toast.success('Logo removed');
  };

  if (loadingSupplier) {
    return (
      <div className="animate-pulse w-full">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="w-full">
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Error</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{errorMessage}</p>
          <div className="mt-6">
            <Button onClick={onCancel}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={formik.handleSubmit} className="w-full overflow-visible">
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
        {isNewSupplier ? 'Add New Supplier' : `Edit Supplier: ${supplierData?.supplier_name}`}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {/* Company Logo Section - Removed white background */}
        <div className="md:col-span-1 h-full">
          <motion.div 
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-full flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
              Company Logo
            </h3>
            
            <div className="flex-grow flex flex-col">
              <FileUpload
                category="suppliers"
                onUploadComplete={handleLogoUploadComplete}
                onUploadError={handleLogoUploadError}
                onDeleteComplete={handleLogoDelete}
                accept="image/jpeg,image/png,image/gif,image/svg+xml"
                maxSize={3} // 3MB max
                initialPreview={logoUrl || formik.values.logo}
                previewClass="w-full h-60 object-contain rounded-md"
                alt={formik.values.supplier_name || "Supplier logo"}
                className="w-full mb-3 flex-grow"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-auto text-center">
              Upload a company logo (optional)
            </p>
          </motion.div>
        </div>

        {/* Supplier Basic Information - Removed white background */}
        <div className="md:col-span-2 h-full">
          <motion.div 
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-full flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
              Basic Information
            </h3>
            
            <div className="space-y-4 flex-grow">
              {/* Supplier Name */}
              <div>
                <label htmlFor="supplier_name" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300 mb-1">
                  Supplier Name *
                </label>
                <input
                  id="supplier_name"
                  name="supplier_name"
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    formik.touched.supplier_name && formik.errors.supplier_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.supplier_name}
                />
                {formik.touched.supplier_name && formik.errors.supplier_name && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.supplier_name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact Person */}
                <div>
                  <label htmlFor="contactPerson" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300 mb-1">
                    Contact Person
                  </label>
                  <input
                    id="contactPerson"
                    name="contactPerson"
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                      formik.touched.contactPerson && formik.errors.contactPerson ? 'border-red-500' : 'border-gray-300'
                    }`}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.contactPerson}
                  />
                  {formik.touched.contactPerson && formik.errors.contactPerson && (
                    <p className="mt-1 text-xs text-red-500">{formik.errors.contactPerson}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="supplier_email" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="supplier_email"
                    name="supplier_email"
                    type="email"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                      formik.touched.supplier_email && formik.errors.supplier_email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.supplier_email}
                  />
                  {formik.touched.supplier_email && formik.errors.supplier_email && (
                    <p className="mt-1 text-xs text-red-500">{formik.errors.supplier_email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                      formik.touched.phone && formik.errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    onChange={(e) => {
                      formik.handleChange(e);
                      formik.setFieldValue('supplier_contact', e.target.value);
                    }}
                    onBlur={formik.handleBlur}
                    value={formik.values.phone}
                  />
                  {formik.touched.phone && formik.errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{formik.errors.phone}</p>
                  )}
                </div>

                {/* Website */}
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300 mb-1">
                    Website
                  </label>
                  <input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://example.com"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                      formik.touched.website && formik.errors.website ? 'border-red-500' : 'border-gray-300'
                    }`}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.website}
                  />
                  {formik.touched.website && formik.errors.website && (
                    <p className="mt-1 text-xs text-red-500">{formik.errors.website}</p>
                  )}
                </div>

                {/* Payment Terms */}
                <div>
                  <label htmlFor="paymentTerms" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300 mb-1">
                    Payment Terms
                  </label>
                  <input
                    id="paymentTerms"
                    name="paymentTerms"
                    type="text"
                    placeholder="e.g. Net 30"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                      formik.touched.paymentTerms && formik.errors.paymentTerms ? 'border-red-500' : 'border-gray-300'
                    }`}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.paymentTerms}
                  />
                  {formik.touched.paymentTerms && formik.errors.paymentTerms && (
                    <p className="mt-1 text-xs text-red-500">{formik.errors.paymentTerms}</p>
                  )}
                </div>
                
                {/* Status */}
                <div className="flex items-center h-full mt-auto col-span-full">
                  <label className="flex items-center cursor-pointer">
                    <input
                      id="isActive"
                      name="isActive"
                      type="checkbox"
                      className="h-4 w-4 text-[#571C1F] focus:ring-[#571C1F] border-gray-300 rounded"
                      onChange={formik.handleChange}
                      checked={formik.values.isActive}
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Active Supplier
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Address Information - Removed white background */}
        <motion.div 
          className="md:col-span-3 h-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-full flex flex-col">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
              Address Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
              {/* Address */}
              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300 mb-1">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    formik.touched.address && formik.errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.address}
                />
                {formik.touched.address && formik.errors.address && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.address}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300 mb-1">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    formik.touched.city && formik.errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.city}
                />
                {formik.touched.city && formik.errors.city && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.city}</p>
                )}
              </div>

              {/* State/Province */}
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300 mb-1">
                  State/Province
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    formik.touched.state && formik.errors.state ? 'border-red-500' : 'border-gray-300'
                  }`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.state}
                />
                {formik.touched.state && formik.errors.state && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.state}</p>
                )}
              </div>

              {/* Postal Code */}
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300 mb-1">
                  Postal Code
                </label>
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    formik.touched.postalCode && formik.errors.postalCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.postalCode}
                />
                {formik.touched.postalCode && formik.errors.postalCode && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.postalCode}</p>
                )}
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300 mb-1">
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    formik.touched.country && formik.errors.country ? 'border-red-500' : 'border-gray-300'
                  }`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.country}
                />
                {formik.touched.country && formik.errors.country && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.country}</p>
                )}
              </div>
              
              {/* Notes */}
              <div className="sm:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-[#571C1F] dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="4"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    formik.touched.notes && formik.errors.notes ? 'border-red-500' : 'border-gray-300'
                  }`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.notes}
                  placeholder="Additional notes about this supplier"
                />
                {formik.touched.notes && formik.errors.notes && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.notes}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Form Actions */}
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
          disabled={loading || !formik.isValid}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : isNewSupplier ? 'Create Supplier' : 'Update Supplier'}
        </Button>
      </motion.div>
    </form>
  );
};

export default SupplierForm;