import { useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook to handle role-based access control in the application
 * 
 * @returns {Object} Permission check functions
 */
export const usePermissions = () => {
  const { user } = useAuth();
  
  // Define permission map for different roles
  const rolePermissions = useMemo(() => ({
    Admin: [
      // Admin has all permissions
      'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
      'inventory.view', 'inventory.adjust', 'inventory.create', 'inventory.edit', 'inventory.delete',
      'order.view', 'order.create', 'order.edit', 'order.delete', 'order.void',
      'menu.view', 'menu.create', 'menu.edit', 'menu.delete', 'menu.categories',
      'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
      'consignments.view', 'consignments.create', 'consignments.edit', 'consignments.delete',
      'pullouts.view', 'pullouts.create', 'pullouts.edit', 'pullouts.delete', 'pullouts.approve',
      'reports.view', 'reports.export', 'reports.sales', 'reports.inventory', 'reports.financial',
      'settings.view', 'settings.edit', 'settings.advanced'
    ],
    Manager: [
      'staff.view', 'staff.create', 'staff.edit',
      'inventory.view', 'inventory.adjust', 'inventory.create', 'inventory.edit',
      'order.view', 'order.create', 'order.edit', 'order.void',
      'menu.view', 'menu.create', 'menu.edit', 'menu.categories',
      'suppliers.view', 'suppliers.create', 'suppliers.edit',
      'consignments.view', 'consignments.create', 'consignments.edit',
      'pullouts.view', 'pullouts.create', 'pullouts.approve',
      'reports.view', 'reports.export', 'reports.sales', 'reports.inventory',
      'settings.view', 'settings.edit'
    ],
    Cashier: [
      'order.view', 'order.create',
      'menu.view',
      'inventory.view',
      'pullouts.view', 'pullouts.create'
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
    
    return userPermissions.includes(permission);
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
   * @param {string} action - Action to perform (view, create, edit, delete)
   * @returns {boolean} True if the user has permission
   */
  const can = (resource, action) => {
    return hasPermission(`${resource}.${action}`);
  };

  // Convenience methods for common operations
  const canView = (resource) => can(resource, 'view');
  const canCreate = (resource) => can(resource, 'create');
  const canEdit = (resource) => can(resource, 'edit');
  const canDelete = (resource) => can(resource, 'delete');

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    userPermissions
  };
};