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
            supplier_name: data.company_name || '',
            supplier_contact: data.contact_phone || '',
            supplier_email: data.contact_email || '',
            // Parse any additional fields
            ...parseAdditionalFields(data),
            isActive: data.is_active, // Use is_active instead of status
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

  // Helper function to parse fields from supplier data
  const parseAdditionalFields = (data) => {
    return {
      contactPerson: data.contact_person || '',
      phone: data.supplier_contact || '', // Map to supplier_contact
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      postalCode: data.postal_code || '', // Map to postal_code
      country: data.country || '',
      website: data.website || '',
      notes: data.notes || '',
      paymentTerms: data.payment_terms || '', // Map to payment_terms
    };
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
        // Transform form data to database format according to your schema
        const dbData = {
          // Core fields in your suppliers table
          company_name: values.supplier_name,           // Map to company_name (your actual column name)
          contact_person: values.contactPerson,         // Direct mapping
          contact_email: values.supplier_email,         // Map to contact_email
          contact_phone: values.supplier_contact || values.phone || '', // Map to contact_phone
          address: values.address,                      // Direct mapping
          city: values.city,                           // Direct mapping
          state: values.state,                         // Direct mapping
          postal_code: values.postalCode,              // Map to postal_code
          country: values.country,                     // Direct mapping
          website: values.website,                     // Direct mapping
          payment_terms: values.paymentTerms,          // Map to payment_terms
          notes: values.notes,                         // Direct mapping
          is_active: values.isActive,                  // Map to is_active (not status)
          logo: logoUrl || values.logo                 // Direct mapping
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
      <div className="flex items-center justify-center py-8">
        <svg className="animate-spin h-8 w-8 text-[#571C1F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3 text-[#571C1F] font-medium">Loading supplier details...</span>
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
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">{errorMessage}</p>
          <div className="mt-6">
            <Button onClick={onCancel}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

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
                {isNewSupplier 
                  ? "Create a new supplier profile with contact details and payment terms"
                  : "Update supplier information including contact details and payment terms"
                }
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {/* Company Logo Section */}
            <div className="md:col-span-1 h-full">
              <motion.div 
                className="bg-white rounded-lg border border-[#571C1F]/10 p-6 shadow-sm h-full flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-medium text-[#571C1F] mb-4">
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
                <p className="text-xs text-gray-500 mt-auto text-center">
                  Upload a company logo (optional)
                </p>
              </motion.div>
            </div>

            {/* Supplier Basic Information */}
            <div className="md:col-span-2 h-full">
              <motion.div 
                className="bg-white rounded-lg border border-[#571C1F]/10 p-6 shadow-sm h-full flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <h3 className="text-lg font-medium text-[#571C1F] mb-4">
                  Basic Information
                </h3>
                
                <div className="space-y-4 flex-grow">
                  {/* Supplier Name */}
                  <div>
                    <label htmlFor="supplier_name" className="block text-sm font-medium text-[#571C1F] mb-1">
                      Supplier Name *
                    </label>
                    <input
                      id="supplier_name"
                      name="supplier_name"
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
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
                      <label htmlFor="contactPerson" className="block text-sm font-medium text-[#571C1F] mb-1">
                        Contact Person
                      </label>
                      <input
                        id="contactPerson"
                        name="contactPerson"
                        type="text"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
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
                      <label htmlFor="supplier_email" className="block text-sm font-medium text-[#571C1F] mb-1">
                        Email Address
                      </label>
                      <input
                        id="supplier_email"
                        name="supplier_email"
                        type="email"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
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
                      <label htmlFor="phone" className="block text-sm font-medium text-[#571C1F] mb-1">
                        Phone Number
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
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
                      <label htmlFor="website" className="block text-sm font-medium text-[#571C1F] mb-1">
                        Website
                      </label>
                      <input
                        id="website"
                        name="website"
                        type="url"
                        placeholder="https://example.com"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
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
                      <label htmlFor="paymentTerms" className="block text-sm font-medium text-[#571C1F] mb-1">
                        Payment Terms
                      </label>
                      <input
                        id="paymentTerms"
                        name="paymentTerms"
                        type="text"
                        placeholder="e.g. Net 30"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
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
                        <span className="ml-2 text-sm text-gray-700">
                          Active Supplier
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Address Information */}
          <motion.div 
            className="bg-white rounded-lg border border-[#571C1F]/10 p-6 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h3 className="text-lg font-medium text-[#571C1F] mb-4">
              Address Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Address */}
              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-[#571C1F] mb-1">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
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
                <label htmlFor="city" className="block text-sm font-medium text-[#571C1F] mb-1">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
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
                <label htmlFor="state" className="block text-sm font-medium text-[#571C1F] mb-1">
                  State/Province
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
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
                <label htmlFor="postalCode" className="block text-sm font-medium text-[#571C1F] mb-1">
                  Postal Code
                </label>
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
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
                <label htmlFor="country" className="block text-sm font-medium text-[#571C1F] mb-1">
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
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
                <label htmlFor="notes" className="block text-sm font-medium text-[#571C1F] mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="4"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] ${
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
      </motion.div>
    </div>
  );
};

export default SupplierForm;