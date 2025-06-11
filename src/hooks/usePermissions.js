import { useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook to handle role-based access control in the application
 * 
 * @returns {Object} Permission check functions
 */
export const usePermissions = () => {
  const { user } = useAuth();
  
  // Define permission map for different roles based on the actual database permissions
  const rolePermissions = useMemo(() => ({
    Admin: [
      // Admin has all permissions
      // Staff permissions
      'staff.view', 'staff.create', 'staff.edit', 'staff.delete', 'staff.manage', 'staff.approve',
      
      // Inventory permissions
      'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.manage', 'inventory.approve',
      
      // Items (menu) permissions
      'items.view', 'items.create', 'items.edit', 'items.delete', 'items.manage', 'items.approve',
      
      // Sales permissions
      'sales.view', 'sales.create', 'sales.edit', 'sales.delete', 'sales.manage', 'sales.approve',
      
      // Suppliers permissions
      'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete', 'suppliers.manage', 'suppliers.approve',
      
      // Ingredients permissions
      'ingredients.view', 'ingredients.create', 'ingredients.edit', 'ingredients.delete', 'ingredients.manage',
      
      // Purchase permissions
      'purchase.view', 'purchase.create', 'purchase.edit', 'purchase.delete', 'purchase.manage', 'purchase.approve', 
      'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.delete', 'purchases.manage', 'purchases.approve',
      
      // Consignment permissions
      'consignment.view', 'consignment.create', 'consignment.edit', 'consignment.delete', 'consignment.manage', 'consignment.approve',
      'consignments.view', 'consignments.create', 'consignments.edit', 'consignments.delete', 'consignments.manage', 'consignments.approve',
      
      // Pullout permissions
      'pullouts.view', 'pullouts.create', 'pullouts.edit', 'pullouts.delete', 'pullouts.manage', 'pullouts.approve',
      
      // Roles permissions
      'roles.view', 'roles.create', 'roles.edit', 'roles.delete', 'roles.manage', 'roles.approve',
      
      // Notifications permissions
      'notifications.view', 'notifications.create', 'notifications.edit', 'notifications.delete', 'notifications.manage', 'notifications.approve'
    ],
    Manager: [
      // Staff permissions
      'staff.view', 'staff.create', 'staff.edit',
      
      // Inventory permissions
      'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.manage',
      
      // Items permissions
      'items.view', 'items.create', 'items.edit', 'items.manage',
      
      // Sales permissions
      'sales.view', 'sales.create', 'sales.edit',
      
      // Suppliers permissions
      'suppliers.view', 'suppliers.create', 'suppliers.edit',
      
      // Ingredients permissions
      'ingredients.view', 'ingredients.create', 'ingredients.edit',
      
      // Purchase permissions
      'purchase.view', 'purchase.create', 'purchase.edit',
      'purchases.view', 'purchases.create', 'purchases.edit',
      
      // Consignment permissions
      'consignment.view', 'consignment.create', 'consignment.edit',
      'consignments.view', 'consignments.create', 'consignments.edit',
      
      // Pullout permissions
      'pullouts.view', 'pullouts.create', 'pullouts.approve',
      
      // Notifications permissions
      'notifications.view'
    ],
    Cashier: [
      // View permissions
      'items.view',
      'inventory.view',
      'sales.view', 'sales.create',
      'pullouts.view', 'pullouts.create'
    ],
    Supplier: [
      // Limited permissions for supplier users
      'inventory.view',
      'suppliers.view', 'suppliers.manage',
      'purchase.view',
      'purchases.view',
      'consignment.view',
      'consignments.view'
    ]
  }), []);

  // Get user permissions based on their role
  const userPermissions = useMemo(() => {
    if (!user) return [];
    
    // If user has custom permissions field, use that first
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions;
    }
    
    // Otherwise fall back to role-based permissions
    return rolePermissions[user.role] || [];
  }, [user, rolePermissions]);

  /**
   * Check if the current user has a specific permission
   * @param {string} permission - Permission to check for
   * @returns {boolean} True if the user has the permission
   */
  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Admin role has all permissions
    if (user.role === 'Admin') return true;
    
    // Check for the exact permission
    if (userPermissions.includes(permission)) return true;
    
    // Check if user has the 'manage' permission for this resource
    const resourceName = permission.split('.')[0];
    const managePermission = `${resourceName}.manage`;
    
    return userPermissions.includes(managePermission);
  };

  /**
   * Check if the user has any of the specified permissions
   * @param {string[]} permissions - Array of permissions to check
   * @returns {boolean} True if the user has any of the permissions
   */
  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => hasPermission(permission));
  };

  /**
   * Check if the user has all of the specified permissions
   * @param {string[]} permissions - Array of permissions to check
   * @returns {boolean} True if the user has all of the permissions
   */
  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => hasPermission(permission));
  };

  /**
   * Check if current user can access a specific resource for a given action
   * @param {string} resource - Resource name (staff, inventory, etc.)
   * @param {string} action - Action to perform (view, create, edit, delete, approve)
   * @returns {boolean} True if the user has permission
   */
  const can = (resource, action) => {
    // Handle both singulars and plurals for resources that might have both forms
    if (resource === 'purchases') resource = 'purchase';
    if (resource === 'consignments') resource = 'consignment';
    
    return hasPermission(`${resource}.${action}`);
  };

  // Convenience methods for common operations
  const canView = (resource) => can(resource, 'view');
  const canCreate = (resource) => can(resource, 'create');
  const canEdit = (resource) => can(resource, 'edit');
  const canDelete = (resource) => can(resource, 'delete');
  const canApprove = (resource) => can(resource, 'approve');
  const canManage = (resource) => can(resource, 'manage');

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canApprove,
    canManage,
    userPermissions
  };
};