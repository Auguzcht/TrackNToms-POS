import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import placeholderImage from '../../assets/placeholder-image.png';
import ImageWithFallback from '../common/ImageWithFallback';
import { format } from 'date-fns';

// Update StaffFilters component
const StaffFilters = ({ filters, setFilters, roles }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-4 items-center">
      {/* Search Input */}
      <div className="relative rounded-md shadow-sm max-w-xs flex-grow sm:flex-grow-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search staff..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="block w-full pl-10 pr-10 py-2 border border-[#571C1F]/20 rounded-md focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        {filters.search && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setFilters({ ...filters, search: '' })}
              className="text-gray-400 hover:text-[#571C1F] focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
        )}
      </div>

      {/* Role Filter */}
      <select
        value={filters.roleId}
        onChange={e => setFilters({ ...filters, roleId: e.target.value })}
        className="block pl-3 pr-10 py-2 border border-[#571C1F]/20 rounded-md focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white w-40"
      >
        <option value="">All Roles</option>
        {roles.map(role => (
          <option key={role.id} value={role.id}>{role.name}</option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        value={filters.status}
        onChange={e => setFilters({ ...filters, status: e.target.value })}
        className="block pl-3 pr-10 py-2 border border-[#571C1F]/20 rounded-md focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white w-40"
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
};

// Replace the useStaff implementation in StaffList.jsx
export const useStaff = () => {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all staff members
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Import supabase client
      const supabase = (await import('../../services/supabase')).default;
      
      // Fetch staff with proper error handling
      const { data, error: staffError } = await supabase
        .from('staff')
        .select(`
          *,
          roles (
            role_id,
            role_name
          )
        `)
        .order('last_name', { ascending: true });

      if (staffError) throw staffError;
      
      // Format the staff data
      const formattedStaff = data.map(item => ({
        staff_id: item.staff_id,
        user_id: item.user_id,
        first_name: item.first_name,
        last_name: item.last_name,
        email: item.email,
        phone: item.phone || '',
        username: item.email.split('@')[0], // Use email prefix as username
        role_id: item.role_id,
        role: item.roles?.role_name || 'Unknown',
        status: item.status || 'Inactive',
        is_active: item.is_active || false,
        profile_image: item.profile_image,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setStaff(formattedStaff);
      return formattedStaff;
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Failed to fetch staff members');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all roles
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Import supabase client
      const supabase = (await import('../../services/supabase')).default;
      
      // Get all roles
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .order('role_name', { ascending: true });
        
      if (roleError) throw roleError;
      
      // Format roles without attempting to fetch permissions (which is causing 400 errors)
      const formattedRoles = roleData.map(role => ({
        id: role.role_id,
        name: role.role_name,
        description: role.description || '',
      }));
      
      setRoles(formattedRoles);
      return formattedRoles;
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Failed to fetch roles');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle staff status (active/inactive)
  const toggleStaffStatus = useCallback(async (id, isActive) => {
    setLoading(true);
    setError(null);
    
    try {
      const status = isActive ? 'Active' : 'Inactive';
      
      // Import supabase client
      const supabase = (await import('../../services/supabase')).default;
      
      const { data, error: updateError } = await supabase
        .from('staff')
        .update({
          status: status,
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('staff_id', id)
        .select('first_name, last_name')
        .single();
        
      if (updateError) {
        throw updateError;
      }

      // Refresh staff list
      fetchStaff();
      
      return true;
    } catch (err) {
      console.error(`Error toggling status for staff with ID ${id}:`, err);
      setError(`Failed to update status for staff with ID ${id}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStaff]);

  // Delete a staff member
  const deleteStaff = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      // Import supabase client
      const supabase = (await import('../../services/supabase')).default;
      
      // Get the staff record to check if there's an auth user to delete
      const { data: staffRecord, error: fetchError } = await supabase
        .from('staff')
        .select('user_id, first_name, last_name')
        .eq('staff_id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      if (!staffRecord) {
        throw new Error(`Staff member with ID ${id} not found`);
      }

      // Delete the staff record
      const { error: deleteError } = await supabase
        .from('staff')
        .delete()
        .eq('staff_id', id);
        
      if (deleteError) {
        throw deleteError;
      }

      // Refresh staff list
      fetchStaff();
      
      return true;
    } catch (err) {
      console.error(`Error deleting staff with ID ${id}:`, err);
      setError(`Failed to delete staff with ID ${id}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStaff]);

  return {
    staff,
    roles,
    loading,
    error,
    fetchStaff,
    fetchRoles,
    deleteStaff,
    toggleStaffStatus
  };
};

const StaffDetails = ({ staff, onEdit, onClose, roles, suppliers }) => {
  if (!staff) return null;
  
  return (
    <div className="space-y-6 w-full max-w-[95vw] mx-auto">
      {/* Info banner at the top */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              View staff member details including contact information and system access
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information Section */}
      <motion.div
        className="bg-white rounded-lg border border-[#571C1F]/10 p-4 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h3 className="text-base font-medium text-[#571C1F] mb-3">
          Personal Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Profile Image */}
          <div className="flex flex-col items-center md:border-r md:border-[#571C1F]/10 md:pr-4">
            <div className="w-24 h-24">
              <div className="h-24 w-24 rounded-full overflow-hidden border border-[#571C1F]/10">
                <ImageWithFallback
                  src={staff.profile_image}
                  alt={`${staff.first_name} ${staff.last_name}`}
                  className="h-24 w-24 object-cover"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="md:col-span-3 space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Full Name</p>
                <p className="font-medium text-[#571C1F]">{staff.first_name} {staff.last_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <p className="font-medium">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {staff.role || roles.find(r => r.id === staff.role_id)?.name || 'Unknown Role'}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-gray-500 italic text-sm">{staff.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-gray-500 italic text-sm">{staff.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    staff.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      staff.status === 'Active' ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    {staff.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Username</p>
                <p className="font-medium">
                  {staff.username || 
                    <span className="text-gray-500 italic text-sm">Using email as login</span>
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* System Access Section */}
      <motion.div 
        className="bg-white rounded-lg border border-[#571C1F]/10 p-4 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h3 className="text-base font-medium text-[#571C1F] mb-3">
          Account Details
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Account Created</p>
            <p className="text-base font-medium text-[#571C1F]">
              {staff.created_at ? format(new Date(staff.created_at), 'MMM d, yyyy') : 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Last Updated</p>
            <p className="text-base font-medium text-[#571C1F]">
              {staff.updated_at ? format(new Date(staff.updated_at), 'MMM d, yyyy') : 'Unknown'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Supplier Connection Section - Only shown for Supplier roles */}
      {staff.role === 'Supplier' && (
        <motion.div 
          className="bg-white rounded-lg border border-[#571C1F]/10 p-4 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h3 className="text-base font-medium text-[#571C1F] mb-3">
            Supplier Connection
          </h3>
          
          <div className="p-4 bg-[#FFF6F2]/50 border border-[#571C1F]/10 rounded-md">
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F] mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-[#571C1F]">Linked Supplier</span>
            </div>
            
            <div className="mt-2">
              {staff.supplier_id ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {suppliers.find(s => s.supplier_id === parseInt(staff.supplier_id))?.company_name || 'Unknown Supplier'}
                </span>
              ) : (
                <span className="text-gray-500 italic text-sm">Not linked to any supplier</span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Update the StaffList component props to include suppliers
const StaffList = ({ 
  onEdit = () => {}, 
  onView = () => {}, 
  onAdd = () => {},
  staff = [],
  roles = [],
  suppliers = [], // Add suppliers prop with empty array default
  loading = false,
  error = null
}) => {
  const navigate = useNavigate();
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    roleId: '',
    status: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'last_name',
    direction: 'asc'
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [confirmStatusChange, setConfirmStatusChange] = useState(false);
  const [staffToToggle, setStaffToToggle] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Use fetchStaff, fetchRoles, deleteStaff, toggleStaffStatus from useStaff
  const { deleteStaff, toggleStaffStatus } = useStaff();

  // Custom handlers for view and edit that use props
  const handleView = (staffId) => {
    // Change variable name to avoid shadowing the staff array parameter
    const staffMember = staff.find(s => s.staff_id === staffId);
    if (staffMember) {
      setSelectedStaff(staffMember);
      setShowDetailsModal(true);
    } else {
      // If we want to fetch from parent component instead
      onView(staffId);
    }
  };

  const handleEdit = (staffId) => {
    onEdit(staffId);
  };

  const handleAdd = () => {
    onAdd();
  };

  // Apply filters and sorting to staff list
  useEffect(() => {
    let result = [...staff];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(person => 
        person.first_name.toLowerCase().includes(searchLower) ||
        person.last_name.toLowerCase().includes(searchLower) ||
        person.email.toLowerCase().includes(searchLower) ||
        person.username.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply role filter
    if (filters.roleId) {
      result = result.filter(person => person.role_id.toString() === filters.roleId);
    }
    
    // Apply status filter
    if (filters.status) {
      const statusValue = filters.status === 'active' ? 'Active' : 'Inactive';
      result = result.filter(person => person.status === statusValue);
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        // Map sort keys to actual object properties
        const keyMap = {
          'lastName': 'last_name',
          'firstName': 'first_name',
          'email': 'email',
          'roleId': 'role_id',
          'isActive': 'status'
        };
        
        const actualKey = keyMap[sortConfig.key] || sortConfig.key;
        
        if (a[actualKey] < b[actualKey]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[actualKey] > b[actualKey]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredStaff(result);
  }, [staff, filters, sortConfig]);

  // Handle sort click
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Handle delete confirmation
  const handleDeleteClick = (staff) => {
    setStaffToDelete(staff);
    setConfirmDelete(true);
  };

  // Execute delete
  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return;
    
    try {
      await deleteStaff(staffToDelete.staff_id);
      toast.success(`${staffToDelete.first_name} ${staffToDelete.last_name} has been removed`);
      setConfirmDelete(false);
      setStaffToDelete(null);
    } catch (err) {
      console.error('Error deleting staff:', err);
      toast.error(`Failed to delete staff: ${err.message || 'Unknown error'}`);
    }
  };

  // Handle status change confirmation
  const handleStatusToggleClick = (staff) => {
    setStaffToToggle(staff);
    setConfirmStatusChange(true);
  };

  // Execute status change
  const handleStatusToggleConfirm = async () => {
    if (!staffToToggle) return;
    
    try {
      const newStatus = staffToToggle.status === 'Active' ? false : true;
      await toggleStaffStatus(staffToToggle.staff_id, newStatus);
      toast.success(`${staffToToggle.first_name} ${staffToToggle.last_name} is now ${newStatus ? 'active' : 'inactive'}`);
      setConfirmStatusChange(false);
      setStaffToToggle(null);
    } catch (err) {
      console.error('Error changing staff status:', err);
      toast.error(`Failed to update status: ${err.message || 'Unknown error'}`);
    }
  };

  // Replace the getRoleName function (around line 403)
  const getRoleName = (roleId) => {
    // Check if roles exists and find the role by matching role_id or id
    const role = roles.find(r => r.id === roleId || r.role_id === roleId);
    return role ? role.name : 'Unknown Role';
  };

  if (loading && staff.length === 0) {
    return (
      <Card className="animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`loading-item-${i}`} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (error && staff.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Error Loading Staff</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error.message || 'Failed to load staff data. Please try again.'}</p>
          <div className="mt-6">
            <Button onClick={fetchStaff}>Try Again</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        {/* Filters */}
        <div className="mb-6">
          <StaffFilters 
            filters={filters} 
            setFilters={setFilters} 
            roles={roles} 
          />
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto">
          <div className="align-middle inline-block min-w-full">
            <div className="overflow-hidden border border-[#571C1F]/10 rounded-lg shadow-md">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-[#571C1F] text-white">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer">
                      <div className="flex items-center">
                        <span>Name</span>
                        {getSortIndicator('lastName')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('email')}
                    >
                      Contact {getSortIndicator('email')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('roleId')}
                    >
                      Role {getSortIndicator('roleId')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('isActive')}
                    >
                      Status {getSortIndicator('isActive')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-lighter divide-y divide-[#571C1F]/10 dark:divide-gray-700">
                  {filteredStaff.map((staff, index) => (
                    <motion.tr 
                      key={`staff-${staff.staff_id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="bg-white hover:bg-[#FFF6F2] dark:bg-dark-lighter dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={(e) => {
                        // Add this to prevent row click when clicking action buttons
                        if (e.target.closest('button')) return;
                        console.log('Row clicked for staff:', staff.staff_id);
                        handleView(staff.staff_id); 
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {staff.profile_image ? (
                              <img className="h-10 w-10 rounded-full" 
                                   src={staff.profile_image} 
                                   alt={`${staff.first_name} ${staff.last_name}`}
                                   onError={(e) => {
                                     e.target.onerror = null;
                                     e.target.src = placeholderImage;
                                   }} />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-[#FFF6F2] border border-[#571C1F]/10 flex items-center justify-center">
                                <span className="text-[#571C1F] text-sm font-medium">
                                  {staff.first_name?.[0]}{staff.last_name?.[0]}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-[#571C1F]">
                              {staff.first_name} {staff.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {staff.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {staff.phone || "No phone"}
                          </span>
                          <span className="text-xs text-gray-500">
                            @{staff.username || staff.email.split('@')[0]}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
                          {staff.role || getRoleName(staff.role_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          staff.status === 'Active'
                            ? 'bg-[#003B25]/10 border border-[#003B25]/20 text-[#003B25]' 
                            : 'bg-[#571C1F]/10 border border-[#571C1F]/20 text-[#571C1F]'
                        }`}>
                          <span className={`w-1.5 h-1.5 ${staff.status === 'Active' ? 'bg-[#003B25]' : 'bg-[#571C1F]'} rounded-full mr-1`}></span>
                          {staff.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {/* Action buttons stay the same */}
                        <div className="flex justify-end space-x-2" onClick={e => e.stopPropagation()}>
                          <motion.button
                            whileHover={{ scale: 1.05, y: -1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEdit(staff.staff_id)}
                            className="p-1.5 text-[#003B25] hover:text-[#003B25] hover:bg-[#003B25]/10 rounded-full transition"
                            aria-label="Edit staff"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05, y: -1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteClick(staff)}
                            className="p-1.5 text-[#571C1F] hover:text-[#571C1F] hover:bg-[#571C1F]/10 rounded-full transition"
                            aria-label="Delete staff"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  
                  {filteredStaff.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {filters.search || filters.roleId || filters.status ? (
                            <>
                              <p>No staff members match your filters</p>
                              <button
                                onClick={() => setFilters({ search: '', roleId: '', status: '' })}
                                className="mt-2 text-primary hover:text-primary-dark dark:hover:text-primary-light"
                              >
                                Clear filters
                              </button>
                            </>
                          ) : (
                            <p>No staff members found</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmDelete}
        onClose={() => {
          setConfirmDelete(false);
          setStaffToDelete(null);
        }}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete {staffToDelete?.first_name} {staffToDelete?.last_name}? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmDelete(false);
                setStaffToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteConfirm}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Status Change Confirmation Modal */}
      <Modal
        isOpen={confirmStatusChange}
        onClose={() => {
          setConfirmStatusChange(false);
          setStaffToToggle(null);
        }}
        title={`${staffToToggle?.status === 'Active' ? 'Deactivate' : 'Activate'} Account`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {staffToToggle?.status === 'Active'
              ? `Are you sure you want to deactivate ${staffToToggle?.first_name} ${staffToToggle?.last_name}'s account? They will no longer be able to log in.`
              : `Are you sure you want to activate ${staffToToggle?.first_name} ${staffToToggle?.last_name}'s account? They will be able to log in again.`}
          </p>
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmStatusChange(false);
                setStaffToToggle(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={staffToToggle?.status === 'Active' ? "warning" : "success"}
              onClick={handleStatusToggleConfirm}
            >
              {staffToToggle?.status === 'Active' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Deactivate
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Activate
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Staff Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={
          selectedStaff && (
            <div className="flex items-center">
              <span>
                {selectedStaff?.first_name} {selectedStaff?.last_name}
              </span>
            </div>
          )
        }
        size="3xl"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowDetailsModal(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowDetailsModal(false);
                onEdit(selectedStaff?.staff_id);
              }}
              className="inline-flex items-center"
            >
              Edit Staff
            </Button>
          </>
        }
      >
        {selectedStaff && (
          <StaffDetails
            staff={selectedStaff}
            onEdit={() => {
              setShowDetailsModal(false);
              onEdit(selectedStaff?.staff_id);
            }}
            onClose={() => setShowDetailsModal(false)}
            roles={roles}
            suppliers={suppliers || []}
          />
        )}
      </Modal>
    </motion.div>
  );
};

export default StaffList;