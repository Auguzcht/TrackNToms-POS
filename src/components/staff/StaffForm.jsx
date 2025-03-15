import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Button from '../common/Button';
import { toast } from 'react-hot-toast';
import { useStaff } from '../../hooks/useStaff';
import FileUpload from '../common/FileUpload';
import ImageWithFallback from '../common/ImageWithFallback';

// Validation schema remains unchanged
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
  username: Yup.string()
    .required('Username is required')
    .min(4, 'Username should be at least 4 characters')
    .max(20, 'Username should be 20 characters or less')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
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
  const [staffData, setStaffData] = useState(null);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [profileImagePath, setProfileImagePath] = useState('');

  // Check if we're creating a new staff member or editing an existing one
  const isNewStaff = staffId === null;

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

  // Initialize formik
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

  if (loadingStaff) {
    return (
      <div className="animate-pulse p-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
        <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(8)].map((_, i) => (
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
      <div className="p-6">
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
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

  // Input component with consistent styling - separate the icon from the input styling
  const InputField = ({ name, type = "text", placeholder = "", icon, ...props }) => (
    <div className="relative">
      {icon && (
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {icon}
        </span>
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
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values[name]}
        readOnly={readOnly}
        disabled={readOnly}
        {...props}
      />
      {!readOnly && formik.touched[name] && formik.errors[name] && (
        <p className="mt-1 text-xs text-red-500">{formik.errors[name]}</p>
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

  return (
    <div className="p-0">
      <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        {getFormTitle()}
      </h2>
      
      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {/* VIEW MODE: Two-column layout with profile image on the left */}
        {readOnly ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Image Column */}
            <div className="space-y-4 flex flex-col items-center lg:items-start">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Profile Picture
              </h3>
              
              <div className="w-full max-w-xs flex justify-center">
                {!(profileImageUrl || formik.values.profile_image) ? (
                  <div className="w-36 h-36 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                    <ImageWithFallback 
                      src="/placeholder-profile.png" 
                      fallbackSrc="/placeholder-profile.png" 
                      alt="Profile placeholder" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <FileUpload
                    category="staff"
                    onUploadComplete={handleImageUploadComplete}
                    onUploadError={handleImageUploadError}
                    onDeleteComplete={handleImageDelete}
                    accept="image/jpeg,image/png,image/gif"
                    maxSize={2} // 2MB max
                    initialPreview={profileImageUrl || formik.values.profile_image}
                    previewClass="w-36 h-36 object-cover rounded-full"
                    previewContainerClass="border border-gray-200 dark:border-gray-700 rounded-full overflow-hidden"
                    alt={`${formik.values.first_name} ${formik.values.last_name}`}
                    displayMode={true}
                    label=""
                  />
                )}
              </div>

              {/* Role badge in view mode on mobile */}
              <div className="lg:hidden mt-4 flex flex-col items-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Role</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm font-medium">
                  {roles.find(r => r.id == formik.values.role_id)?.name || 'Unknown Role'}
                </span>
              </div>
            </div>
            
            {/* Form Fields Column - spans 2 columns on large screens for view mode */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Basic Information
                </h3>
                
                {/* Continue with existing view mode layout for rest of fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                  {/* Name row */}
                  <FormField label="First Name" name="first_name" required={true}>
                    <InputField name="first_name" />
                  </FormField>
                  
                  <FormField label="Last Name" name="last_name" required={true}>
                    <InputField name="last_name" />
                  </FormField>
                  
                  {/* Contact row */}
                  <FormField label="Email Address" name="email" required={true}>
                    <InputField 
                      name="email" 
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
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      }
                    />
                  </FormField>
                  
                  {/* Role and Status Row */}
                  <FormField label="Role" name="role_id" required={true}>
                    <div className="px-3 py-2 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-300 dark:border-gray-700 rounded-md">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {roles.find(r => r.id == formik.values.role_id)?.name || 'Unknown Role'}
                      </span>
                    </div>
                  </FormField>
                  
                  <FormField label="Status" name="status" required={true}>
                    <div className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 rounded-md">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        formik.values.status === 'Active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                          formik.values.status === 'Active' ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                        {formik.values.status}
                      </span>
                    </div>
                  </FormField>
                  
                  {/* Username in view mode */}
                  <FormField label="Username" name="username" required={true}>
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
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* EDIT/ADD MODE: Compact vertical layout for modal */
          <div className="space-y-6">
            {/* Profile Upload centered at top */}
            <div className="flex flex-col items-center">
              <div className="w-full max-w-xs mb-2">
                <FileUpload
                  category="staff"
                  onUploadComplete={handleImageUploadComplete}
                  onUploadError={handleImageUploadError}
                  onDeleteComplete={handleImageDelete}
                  accept="image/jpeg,image/png,image/gif"
                  maxSize={2}
                  initialPreview={profileImageUrl || formik.values.profile_image}
                  previewClass="w-28 h-28 object-cover rounded-full"
                  previewContainerClass="border border-gray-200 dark:border-gray-700 rounded-full overflow-hidden"
                  alt={`${formik.values.first_name} ${formik.values.last_name}`}
                  displayMode={false}
                  label="Upload Profile Picture"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
                Upload a professional profile photo. <br />
                Recommended size: 400x400 pixels.
              </p>
            </div>

            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                {/* Name row */}
                <FormField label="First Name" name="first_name" required={true}>
                  <InputField name="first_name" />
                </FormField>
                
                <FormField label="Last Name" name="last_name" required={true}>
                  <InputField name="last_name" />
                </FormField>
                
                {/* Contact row */}
                <FormField label="Email Address" name="email" required={true}>
                  <InputField 
                    name="email" 
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
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    }
                  />
                </FormField>
                
                {/* Role and Status Row */}
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
            </div>
            
            {/* System Access Section */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                System Access
              </h3>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 p-3 rounded-md">
                Configure login credentials for system access. Strong passwords help maintain security.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                {/* Username */}
                <FormField label="Username" name="username" required={true}>
                  <InputField 
                    name="username" 
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                    autoComplete="username" 
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Username should be unique and at least 4 characters.
                  </p>
                </FormField>

                {/* Password - Only required for new staff */}
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
                  <p className="mt-1 text-xs text-gray-500">
                    {isNewStaff ? "Password must contain uppercase, lowercase and digits." : ""}
                  </p>
                </FormField>

                {/* Confirm Password - Only if password field has a value */}
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
          </div>
        )}

        {/* Form actions */}
        <div className="flex justify-end space-x-3 pt-4">
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
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : isNewStaff ? 'Create Staff' : 'Update Staff'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default StaffForm;