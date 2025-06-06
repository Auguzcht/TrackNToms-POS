import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { toast } from 'react-hot-toast';
import { useStaff } from '../../hooks/useStaff';
import Swal from 'sweetalert2';

const permissionGroups = {
  orders: [
    { id: 'order.view', name: 'View Orders' },
    { id: 'order.create', name: 'Create Orders' },
    { id: 'order.edit', name: 'Edit Orders' },
    { id: 'order.delete', name: 'Delete Orders' },
    { id: 'order.void', name: 'Void Orders' },
  ],
  inventory: [
    { id: 'inventory.view', name: 'View Inventory' },
    { id: 'inventory.adjust', name: 'Adjust Inventory' },
    { id: 'inventory.create', name: 'Create Items' },
    { id: 'inventory.edit', name: 'Edit Items' },
    { id: 'inventory.delete', name: 'Delete Items' },
  ],
  suppliers: [
    { id: 'suppliers.view', name: 'View Suppliers' },
    { id: 'suppliers.create', name: 'Create Suppliers' },
    { id: 'suppliers.edit', name: 'Edit Suppliers' },
    { id: 'suppliers.delete', name: 'Delete Suppliers' },
    { id: 'suppliers.manage', name: 'Manage As Supplier' }, // Special permission for supplier accounts
  ],
  menu: [
    { id: 'menu.view', name: 'View Menu' },
    { id: 'menu.create', name: 'Create Menu Items' },
    { id: 'menu.edit', name: 'Edit Menu Items' },
    { id: 'menu.delete', name: 'Delete Menu Items' },
    { id: 'menu.categories', name: 'Manage Categories' },
  ],
  staff: [
    { id: 'staff.view', name: 'View Staff' },
    { id: 'staff.create', name: 'Create Staff' },
    { id: 'staff.edit', name: 'Edit Staff' },
    { id: 'staff.delete', name: 'Delete Staff' },
  ],
  reports: [
    { id: 'reports.view', name: 'View Reports' },
    { id: 'reports.export', name: 'Export Reports' },
    { id: 'reports.sales', name: 'Access Sales Reports' },
    { id: 'reports.inventory', name: 'Access Inventory Reports' },
    { id: 'reports.financial', name: 'Access Financial Reports' },
  ],
  settings: [
    { id: 'settings.view', name: 'View Settings' },
    { id: 'settings.edit', name: 'Edit Settings' },
    { id: 'settings.advanced', name: 'Advanced Settings' },
  ],
  pullouts: [
    { id: 'pullouts.view', name: 'View Pullouts' },
    { id: 'pullouts.create', name: 'Create Pullouts' },
    { id: 'pullouts.edit', name: 'Edit Pullouts' },
    { id: 'pullouts.delete', name: 'Delete Pullouts' },
    { id: 'pullouts.approve', name: 'Approve Pullouts' },
  ],
};

const RoleManager = () => {
  const { roles, loading, error, fetchRoles, createRole, updateRole, deleteRole } = useStaff();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Load roles when component mounts
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleEditRole = (role) => {
    setCurrentRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissions: [...role.permissions]
    });
    setShowRoleModal(true);
  };

  const handleNewRole = () => {
    setCurrentRole(null);
    setRoleForm({
      name: '',
      description: '',
      permissions: []
    });
    setShowRoleModal(true);
  };

  const handlePermissionChange = (permissionId) => {
    setRoleForm(prev => {
      if (prev.permissions.includes(permissionId)) {
        return {
          ...prev,
          permissions: prev.permissions.filter(id => id !== permissionId)
        };
      } else {
        return {
          ...prev,
          permissions: [...prev.permissions, permissionId]
        };
      }
    });
  };

  const handleSelectAllInGroup = (group, checked) => {
    const groupPermissions = permissionGroups[group].map(p => p.id);
    
    setRoleForm(prev => {
      if (checked) {
        // Add all permissions from this group that aren't already included
        const newPermissions = [...new Set([
          ...prev.permissions, 
          ...groupPermissions
        ])];
        return { ...prev, permissions: newPermissions };
      } else {
        // Remove all permissions from this group
        return {
          ...prev,
          permissions: prev.permissions.filter(id => !groupPermissions.includes(id))
        };
      }
    });
  };

  const handleSubmitRole = async (e) => {
    e.preventDefault();
    
    try {
      if (currentRole) {
        // Update existing role
        await updateRole(currentRole.id, roleForm);
        toast.success(`Role "${roleForm.name}" updated successfully`);
      } else {
        // Create new role
        await createRole(roleForm);
        toast.success(`Role "${roleForm.name}" created successfully`);
      }
      
      setShowRoleModal(false);
      fetchRoles(); // Refresh the roles list
    } catch (err) {
      console.error('Error saving role:', err);
      toast.error(`Failed to save role: ${err.message || 'Unknown error'}`);
    }
  };

  // Function to create a Supplier role with appropriate permissions
  const handleCreateSupplierRole = async () => {
    try {
      // Check if Supplier role already exists
      const existingRole = roles.find(role => role.name === 'Supplier');
      
      if (existingRole) {
        toast.info('A Supplier role already exists! You can edit it instead.');
        handleEditRole(existingRole);
        return;
      }
      
      // Define supplier role with permissions
      const supplierRole = {
        name: 'Supplier',
        description: 'Account for supplier users with permissions to manage their inventory and deliveries',
        permissions: [
          'inventory.view',
          'suppliers.view',
          'suppliers.manage', // Special permission for suppliers to manage their own account
          'reports.view',
          'reports.inventory'
        ]
      };
      
      await createRole(supplierRole);
      toast.success('Supplier role created successfully!');
      fetchRoles(); // Refresh the roles list
    } catch (err) {
      console.error('Error creating supplier role:', err);
      toast.error(`Failed to create supplier role: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    
    // Special check for Supplier role to prevent accidental deletion of linked supplier accounts
    if (deleteTarget.name === 'Supplier' && deleteTarget.staff_count > 0) {
      // Show a special warning for supplier role
      const result = await Swal.fire({
        title: 'Warning: Supplier Role',
        text: 'This role may have staff members linked to supplier accounts. Deleting it could break those connections. Are you absolutely sure?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, Delete Anyway',
        cancelButtonText: 'Cancel'
      });
      
      if (!result.isConfirmed) {
        return;
      }
    }
    
    try {
      await deleteRole(deleteTarget.id);
      toast.success(`Role "${deleteTarget.name}" deleted successfully`);
      setConfirmDelete(false);
      setDeleteTarget(null);
      fetchRoles(); // Refresh the roles list
    } catch (err) {
      console.error('Error deleting role:', err);
      toast.error(`Failed to delete role: ${err.message || 'Unknown error'}`);
    }
  };

  const isGroupChecked = (group) => {
    const groupPermissions = permissionGroups[group].map(p => p.id);
    return groupPermissions.every(id => roleForm.permissions.includes(id));
  };

  const isGroupPartiallyChecked = (group) => {
    const groupPermissions = permissionGroups[group].map(p => p.id);
    const intersection = groupPermissions.filter(id => roleForm.permissions.includes(id));
    return intersection.length > 0 && intersection.length < groupPermissions.length;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading roles</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              {error.message || 'An unknown error occurred. Please try again later.'}
            </div>
            <div className="mt-4">
              <Button onClick={fetchRoles} size="sm">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map(role => (
          <Card 
            key={role.id} 
            className={`relative ${role.name === 'Supplier' ? 'border-blue-300 dark:border-blue-700' : ''}`}
          >
            
            <div className="absolute top-3 right-3 flex space-x-1">
              <button 
                onClick={() => handleEditRole(role)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              {role.name !== 'Administrator' && ( // Prevent deletion of admin role
                <button 
                  onClick={() => {
                    setDeleteTarget(role);
                    setConfirmDelete(true);
                  }}
                  className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            <h3 className="text-lg font-medium text-[#571C1F] dark:text-[#571C1F] mb-2">{role.name}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-700 mb-4 line-clamp-2">
              {role.description || 'No description provided.'}
            </p>
          
            <div className="space-y-2">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  {role.permissions?.length || 0} permissions granted
                </span>
              </div>
              
              {role.staff_count > 0 && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    {role.staff_count} {role.staff_count === 1 ? 'staff member' : 'staff members'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-medium text-[#571C1F] dark:text-gray-400 uppercase tracking-wider mb-2">
                Permission Groups
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.keys(permissionGroups).map(group => {
                  const groupPermissions = permissionGroups[group].map(p => p.id);
                  // Add null check with optional chaining and default to empty array if undefined
                  const permissions = role.permissions || [];
                  const granted = groupPermissions.some(id => permissions.includes(id));
                  const allGranted = groupPermissions.every(id => permissions.includes(id));
                  
                  return (
                    <div 
                      key={group}
                      className={`px-2 py-1 text-xs rounded-full ${
                        granted 
                          ? allGranted
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {group.charAt(0).toUpperCase() + group.slice(1)}
                      {allGranted ? ' (All)' : granted ? ' (Partial)' : ' (None)'}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {roles.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-dark-lighter rounded-lg shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No roles found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating your first role.
          </p>
          <div className="mt-6">
            <Button onClick={handleNewRole}>
              Create New Role
            </Button>
          </div>
        </div>
      )}

      {/* Supplier Role Quick Creation */}
      {roles.length > 0 && !roles.some(role => role.name === 'Supplier') && (
        <div className="my-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-md">
          <div className="flex items-start md:items-center flex-col md:flex-row">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mt-3 md:mt-0 ml-0 md:ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                To connect suppliers to staff accounts, you need to create a Supplier role
              </p>
              <p className="mt-3 text-sm md:mt-0 md:ml-6">
                <Button 
                  size="sm" 
                  onClick={handleCreateSupplierRole}
                  className="whitespace-nowrap"
                >
                  Create Supplier Role
                </Button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Role Edit/Create Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title={currentRole ? `Edit Role: ${currentRole.name}` : "Create New Role"}
        size="lg"
      >
        <form onSubmit={handleSubmitRole} className="space-y-6">
          <div>
            <label htmlFor="role-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role Name
            </label>
            <input
              type="text"
              id="role-name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark dark:text-white"
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label htmlFor="role-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="role-description"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark dark:text-white"
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              placeholder="Brief description of this role's responsibilities"
            ></textarea>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Permissions</h3>
            
            <div className="space-y-6">
              {Object.entries(permissionGroups).map(([group, permissions]) => (
                <div key={group} className="bg-gray-50 dark:bg-dark rounded-md p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-3">
                    <div 
                      className="h-5 w-5 relative flex items-center justify-center mr-2"
                      onClick={() => handleSelectAllInGroup(group, !isGroupChecked(group))}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-700 rounded"
                        checked={isGroupChecked(group)}
                        onChange={() => {}}
                        id={`group-${group}`}
                      />
                      {isGroupPartiallyChecked(group) && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="h-2 w-2 bg-primary rounded-sm"></div>
                        </div>
                      )}
                    </div>
                    <label htmlFor={`group-${group}`} className="font-medium text-gray-900 dark:text-white capitalize">
                      {group}
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                    {permissions.map(permission => (
                      <div key={permission.id} className="flex items-center">
                        <input
                          id={permission.id}
                          type="checkbox"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-700 rounded"
                          checked={roleForm.permissions.includes(permission.id)}
                          onChange={() => handlePermissionChange(permission.id)}
                        />
                        <label htmlFor={permission.id} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {permission.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowRoleModal(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!roleForm.name.trim()}
            >
              {currentRole ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmDelete}
        onClose={() => {
          setConfirmDelete(false);
          setDeleteTarget(null);
        }}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete the role <span className="font-semibold">{deleteTarget?.name}</span>?
          </p>
          
          {deleteTarget?.staff_count > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-200">
                    This role is assigned to {deleteTarget?.staff_count} staff member{deleteTarget?.staff_count !== 1 ? 's' : ''}. Deleting it will remove these permissions from those users.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setConfirmDelete(false);
                setDeleteTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="danger"
              onClick={handleDeleteConfirm}
            >
              Delete Role
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default RoleManager;