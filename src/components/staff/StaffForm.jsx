import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Button from '../common/Button';
import { toast } from 'react-hot-toast';
import { useStaff } from '../../hooks/useStaff';
import { useSuppliers } from '../../hooks/useSuppliers';
import FileUpload from '../common/FileUpload';
import ImageWithFallback from '../common/ImageWithFallback';
import { motion } from 'framer-motion'; // Import motion from framer-motion

// Validation schema remains the same
const staffSchema = Yup.object({
  first_name: Yup.string()
    .required('First name is required')
    .max(50, 'First name should be 50 characters or less'),
  last_name: Yup.string()
    .required('Last name is required')
    .max(50, 'Last name should be 50 characters or less'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  phone: Yup.string()
    .matches(/^(\+?\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}$/, 'Invalid phone number')
    .required('Phone number is required'),
  role_id: Yup.number()
    .required('Role is required'),
  // Make username optional
  username: Yup.string()
    .min(4, 'Username should be at least 4 characters')
    .max(20, 'Username should be 20 characters or less')
    .matches(/^[a-zA-Z0-9_]*$/, 'Username can only contain letters, numbers, and underscores'),
  password: Yup.string()
    .when('isNewStaff', {
      is: true,
      then: Yup.string()
        .required('Password is required')
        .min(8, 'Password should be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
    }),
  confirm_password: Yup.string()
    .when('password', {
      is: val => val && val.length > 0,
      then: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Please confirm password')
    }),
  status: Yup.string()
    .oneOf(['Active', 'Inactive'], 'Status must be either Active or Inactive')
    .required('Status is required')
});

const StaffForm = ({ staffId = null, onSave = () => {}, onCancel = () => {}, readOnly = false }) => {
  const { roles, fetchRoles, fetchStaffById, createStaff, updateStaff, loading } = useStaff();
  const { suppliers, fetchSuppliers } = useSuppliers();
  const [staffData, setStaffData] = useState(null);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [profileImagePath, setProfileImagePath] = useState('');
  const [isSupplierRole, setIsSupplierRole] = useState(false); // Track if current role is a supplier role

  // Check if we're creating a new staff member or editing an existing one
  const isNewStaff = staffId === null;

  // Initialize formik BEFORE the useEffect hooks that depend on it
  const formik = useFormik({
    initialValues: {
      first_name: staffData?.first_name || '',
      last_name: staffData?.last_name || '',
      email: staffData?.email || '',
      phone: staffData?.phone || '',
      role_id: staffData?.role_id || '',
      username: staffData?.username || '',
      password: '',
      confirm_password: '',
      status: staffData?.status || 'Active',
      isNewStaff,
      profile_image: staffData?.profile_image || '',
      supplier_id: staffData?.supplier_id || '', // Include supplier_id
    },
    validationSchema: staffSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      // Skip submission if in readOnly mode
      if (readOnly) return;
      
      try {
        // Create data object to send to API
        const staffData = {
          ...values,
          // If we have a new uploaded image, use that path
          profile_image: profileImageUrl || values.profile_image,
        };
        
        // Log the supplier connection if role is Supplier
        if (isSupplierRole) {
          console.log(`Linking staff to supplier: ${staffData.supplier_id}`);
        }
        
        let result;
        if (isNewStaff) {
          result = await createStaff(staffData);
        } else {
          result = await updateStaff(staffId, staffData);
        }
        
        toast.success(`Staff member ${values.first_name} ${values.last_name} saved successfully`);
        onSave(result);
      } catch (error) {
        console.error("Error saving staff:", error);
        toast.error(`Failed to save staff: ${error.message || "Unknown error"}`);
      }
    },
  });

  useEffect(() => {
    // Fetch roles for the role dropdown
    fetchRoles();

    // If editing or viewing, fetch the staff member data
    if (!isNewStaff) {
      setLoadingStaff(true);
      fetchStaffById(staffId)
        .then(data => {
          if (data) {
            setStaffData(data);
            // If staff has a profile image, set it
            if (data.profile_image) {
              setProfileImageUrl(data.profile_image);
            }
          } else {
            throw new Error(`Staff with ID ${staffId} not found`);
          }
        })
        .catch(error => {
          console.error("Error fetching staff details:", error);
          setErrorMessage(`Failed to load staff details: ${error.message || "Unknown error"}`);
        })
        .finally(() => {
          setLoadingStaff(false);
        });
    }
  }, [fetchRoles, fetchStaffById, staffId, isNewStaff]);

  // Load suppliers if needed when component mounts
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Detect role changes - NOW this can safely access formik
  useEffect(() => {
    // Check if the selected role is a Supplier role
    const selectedRole = roles.find(role => role.id === parseInt(formik.values.role_id));
    setIsSupplierRole(selectedRole?.name === 'Supplier');
  }, [formik.values.role_id, roles]);

  // Handle file upload completion
  const handleImageUploadComplete = (result) => {
    setProfileImageUrl(result.url);
    setProfileImagePath(result.path);
    toast.success('Profile image uploaded successfully');
  };
  
  // Handle file upload error
  const handleImageUploadError = (error) => {
    toast.error(`Failed to upload image: ${error.message}`);
  };
  
  // Handle image deletion
  const handleImageDelete = () => {
    setProfileImageUrl('');
    formik.setFieldValue('profile_image', '');
    toast.success('Profile image removed');
  };

  // Loading state with the new PulloutForm style
  if (loadingStaff) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="animate-spin h-8 w-8 text-[#571C1F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3 text-[#571C1F] font-medium">Loading staff details...</span>
      </div>
    );
  }
  
  // Error state with the new PulloutForm style
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

  // Safe way to get form title without "undefined undefined" issue
  const getFormTitle = () => {
    if (isNewStaff) {
      return 'Add New Staff Member';
    }
    
    if (!staffData) {
      return 'Staff Details';
    }
    
    const name = `${staffData.first_name || ''} ${staffData.last_name || ''}`.trim();
    
    if (readOnly) {
      return `Staff Details: ${name || 'Loading...'}`;
    }
    
    return `Edit Staff: ${name || 'Loading...'}`;
  };

  // New input field wrapper component for consistent styling
  const FormField = ({ label, name, required = false, children, className = "" }) => (
    <div className={`flex flex-col ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && !readOnly && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );

  // Input component with improved styling and fixed layout
  const InputField = ({ name, type = "text", placeholder = "", icon, ...props }) => (
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 z-10">
          {icon}
        </div>
      )}
      <input
        id={name}
        name={name}
        type={type}
        className={`w-full px-3 ${icon ? 'pl-10' : 'pl-3'} py-2 border rounded-md shadow-sm ${
          readOnly 
            ? 'bg-gray-50/50 dark:bg-gray-800/30' 
            : 'focus:outline-none focus:ring-primary focus:border-primary'
        } dark:text-white dark:border-gray-700 ${
          formik.touched[name] && formik.errors[name] 
            ? 'border-red-500 dark:border-red-500' 
            : 'border-gray-300'
        }`}
        placeholder={placeholder}
        value={formik.values[name] || ''}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        readOnly={readOnly}
        disabled={readOnly}
        {...props}
      />
      {!readOnly && formik.touched[name] && formik.errors[name] && (
        <div className="mt-1 text-xs text-red-500">{formik.errors[name]}</div>
      )}
    </div>
  );

  // New SelectField component for consistent dropdown styling
  const SelectField = ({ name, children, icon, ...props }) => (
    <div className="relative">
      {icon && (
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {icon}
        </span>
      )}
      <select
        id={name}
        name={name}
        className={`w-full px-3 ${icon ? 'pl-10' : 'pl-3'} py-2 border rounded-md shadow-sm ${
          readOnly 
            ? 'bg-gray-50/50 dark:bg-gray-800/30' 
            : 'focus:outline-none focus:ring-primary focus:border-primary'
        } dark:text-white dark:border-gray-700 ${
          formik.touched[name] && formik.errors[name] 
            ? 'border-red-500 dark:border-red-500' 
            : 'border-gray-300'
        }`}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values[name]}
        disabled={readOnly}
        {...props}
      >
        {children}
      </select>
      {!readOnly && formik.touched[name] && formik.errors[name] && (
        <p className="mt-1 text-xs text-red-500">{formik.errors[name]}</p>
      )}
    </div>
  );

  // Update the main return statement to apply conditional styling based on readOnly prop
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Only show the info banner in edit mode */}
        {!readOnly && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  {isNewStaff 
                    ? "Create a new staff account with appropriate role and access level" 
                    : "Update staff member information and adjust their role or system access"
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={formik.handleSubmit} className={`space-y-${readOnly ? '4' : '6'}`}>
          {/* Profile Information Section */}
          <motion.div
            className={`bg-white rounded-lg border border-[#571C1F]/10 ${readOnly ? 'p-4' : 'p-6'} shadow-sm`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h3 className={`${readOnly ? 'text-base' : 'text-lg'} font-medium text-[#571C1F] ${readOnly ? 'mb-3' : 'mb-4'}`}>
              Personal Information
            </h3>

            <div className={`grid grid-cols-1 md:grid-cols-${readOnly ? '4' : '3'} gap-${readOnly ? '4' : '6'}`}>
              {/* Profile Image */}
              <div className={`flex flex-col items-center ${readOnly ? 'md:border-r md:border-[#571C1F]/10 md:pr-4' : 'md:border-r md:border-[#571C1F]/10 md:pr-6'}`}>
                <div className={`${readOnly ? 'w-24 h-24' : 'w-full max-w-xs mb-2'}`}>
                  {readOnly ? (
                    <div className="h-24 w-24 rounded-full overflow-hidden border border-[#571C1F]/10">
                      <ImageWithFallback
                        src={profileImageUrl || formik.values.profile_image}
                        alt={`${formik.values.first_name} ${formik.values.last_name}`}
                        className="h-24 w-24 object-cover"
                      />
                    </div>
                  ) : (
                    <FileUpload
                      category="staff"
                      onUploadComplete={handleImageUploadComplete}
                      onUploadError={handleImageUploadError}
                      onDeleteComplete={handleImageDelete}
                      accept="image/jpeg,image/png,image/gif"
                      maxSize={2}
                      initialPreview={profileImageUrl || formik.values.profile_image}
                      previewClass="w-32 h-32 object-cover rounded-full"
                      previewContainerClass="border border-gray-200 dark:border-gray-700 rounded-full overflow-hidden"
                      alt={`${formik.values.first_name} ${formik.values.last_name}`}
                      displayMode={readOnly}
                      label={readOnly ? "" : "Change Photo"}
                    />
                  )}
                </div>
                {!readOnly && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Upload a professional profile photo.<br />
                    Recommended size: 400x400 pixels.
                  </p>
                )}
              </div>

              {/* Basic Information */}
              <div className={`md:col-span-${readOnly ? '3' : '2'} space-y-${readOnly ? '2' : '4'}`}>
                {readOnly ? (
                  // Read-only compact display
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Full Name</p>
                      <p className="font-medium text-[#571C1F]">{formik.values.first_name} {formik.values.last_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Role</p>
                      <p className="font-medium">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {roles.find(r => r.id == formik.values.role_id)?.name || 'Unknown Role'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium">{formik.values.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium">{formik.values.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          formik.values.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            formik.values.status === 'Active' ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          {formik.values.status}
                        </span>
                      </p>
                    </div>
                    {formik.values.username && (
                      <div>
                        <p className="text-xs text-gray-500">Username</p>
                        <p className="font-medium">{formik.values.username}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Edit mode - keep original layout
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name fields */}
                    <FormField label="First Name" name="first_name" required={true}>
                      <InputField name="first_name" readOnly={readOnly} />
                    </FormField>
                    
                    <FormField label="Last Name" name="last_name" required={true}>
                      <InputField name="last_name" readOnly={readOnly} />
                    </FormField>

                    {/* Contact fields */}
                    <FormField label="Email Address" name="email" required={true}>
                      <InputField 
                        name="email" 
                        readOnly={readOnly}
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        }
                      />
                    </FormField>
                    
                    <FormField label="Phone Number" name="phone" required={true}>
                      <InputField 
                        name="phone" 
                        readOnly={readOnly}
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        }
                      />
                    </FormField>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* System Access Section - Only show in edit mode or if there's a role assigned */}
          {(!readOnly || formik.values.role_id) && (
            <motion.div 
              className={`bg-white rounded-lg border border-[#571C1F]/10 ${readOnly ? 'p-4' : 'p-6'} shadow-sm`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <h3 className={`${readOnly ? 'text-base' : 'text-lg'} font-medium text-[#571C1F] ${readOnly ? 'mb-3' : 'mb-4'}`}>
                System Access & Role
              </h3>
              
              {readOnly ? (
                // Read-only compact display for system access
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Role</p>
                    <p className="font-medium">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {roles.find(r => r.id == formik.values.role_id)?.name || 'Unknown Role'}
                      </span>
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Username</p>
                    <p className="font-medium">
                      {formik.values.username || 
                        <span className="text-gray-500 italic text-sm">Using email as login</span>
                      }
                    </p>
                  </div>

                  {isSupplierRole && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Linked Supplier</p>
                      <p className="font-medium">
                        {formik.values.supplier_id ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {suppliers.find(s => s.supplier_id === parseInt(formik.values.supplier_id))?.company_name || 'Unknown Supplier'}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic text-sm">Not linked to any supplier</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Keep original edit mode layout
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Role field */}
                    <FormField label="Role" name="role_id" required={true}>
                      <SelectField 
                        name="role_id"
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                        }
                      >
                        <option value="">Select a role</option>
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </SelectField>
                    </FormField>
                    
                    {/* Status field */}
                    <FormField label="Status" name="status" required={true}>
                      <SelectField 
                        name="status"
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </SelectField>
                    </FormField>
                  </div>

                  {/* Username and Password fields */}
                  <div className="mt-6 p-4 bg-[#FFF6F2]/50 border border-[#571C1F]/10 rounded-md">
                    <p className="text-sm text-gray-700 mb-4">
                      Configure login credentials for system access. Username is optional and email will be used if not provided.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Username field */}
                      <FormField label="Username (Optional)" name="username">
                        <InputField 
                          name="username" 
                          icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          }
                          autoComplete="username"
                        />
                      </FormField>

                      {/* Password field */}
                      <FormField label={isNewStaff ? 'Password' : 'Change Password'} name="password" required={isNewStaff}>
                        <InputField 
                          name="password" 
                          type="password" 
                          icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          }
                          autoComplete="new-password"
                          placeholder={isNewStaff ? "" : "(leave blank to keep current)"}
                        />
                      </FormField>
                      
                      {/* Confirm Password field - Only shown when needed */}
                      {(isNewStaff || formik.values.password) && (
                        <FormField label="Confirm Password" name="confirm_password" required={true}>
                          <InputField 
                            name="confirm_password" 
                            type="password" 
                            icon={
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            }
                            autoComplete="new-password"
                          />
                        </FormField>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Supplier Link Section - Only shown for Supplier roles */}
          {isSupplierRole && !readOnly && (
            <motion.div 
              className="bg-white rounded-lg border border-[#571C1F]/10 p-6 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <h3 className="text-lg font-medium text-[#571C1F] mb-4">Supplier Connection</h3>
              
              <div className="p-4 bg-[#FFF6F2]/50 border border-[#571C1F]/10 rounded-md">
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F] mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-[#571C1F]">Supplier Association</span>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Link this staff account to a supplier company to provide access to the supplier portal.
                </p>
                
                <FormField label="Linked Supplier" name="supplier_id">
                  <SelectField 
                    name="supplier_id"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h5m0 0v5m0-5l-6 6M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                      </svg>
                    }
                  >
                    <option value="">Not linked to any supplier</option>
                    {suppliers.filter(s => !s.user_id || s.user_id === staffData?.user_id).map(supplier => (
                      <option key={supplier.supplier_id} value={supplier.supplier_id}>
                        {supplier.company_name}
                      </option>
                    ))}
                  </SelectField>
                </FormField>
              </div>
            </motion.div>
          )}

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
              {readOnly ? 'Close' : 'Cancel'}
            </Button>
            
            {!readOnly && (
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
                    {isNewStaff ? 'Creating...' : 'Updating...'}
                  </span>
                ) : (
                  isNewStaff ? 'Create Staff' : 'Update Staff'
                )}
              </Button>
            )}
            
            {readOnly && canManage && (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  onCancel();
                  onEdit(staffData?.staff_id);
                }}
              >
                Edit Staff
              </Button>
            )}
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default StaffForm;