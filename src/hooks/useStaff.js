import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

export const useStaff = () => {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([
    { id: 1, name: 'Manager', description: 'Full system access' },
    { id: 2, name: 'Cashier', description: 'POS and basic functions' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all staff members
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // For now, use mock data since we're not connecting to real backend yet
      const mockStaff = [
        {
          staff_id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@trackntoms.com',
          phone_number: '+1 (555) 123-4567',
          username: 'johndoe',
          role_id: 1,
          role: 'Manager',
          status: 'Active',
          profile_image: null,
          hire_date: '2023-01-15'
        },
        {
          staff_id: 2,
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@trackntoms.com',
          phone_number: '+1 (555) 987-6543',
          username: 'janesmith',
          role_id: 2,
          role: 'Cashier',
          status: 'Active',
          profile_image: null,
          hire_date: '2023-02-20'
        }
      ];
      
      setStaff(mockStaff);
      return mockStaff;
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Failed to fetch staff members');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch a single staff member by ID
  const fetchStaffById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      // Mock data for now
      const staffMember = {
        staff_id: id,
        first_name: id === 1 ? 'John' : 'Jane',
        last_name: id === 1 ? 'Doe' : 'Smith',
        email: id === 1 ? 'john.doe@trackntoms.com' : 'jane.smith@trackntoms.com',
        phone_number: id === 1 ? '+1 (555) 123-4567' : '+1 (555) 987-6543',
        username: id === 1 ? 'johndoe' : 'janesmith',
        role_id: id === 1 ? 1 : 2,
        role: id === 1 ? 'Manager' : 'Cashier',
        status: 'Active',
        profile_image: null,
        hire_date: id === 1 ? '2023-01-15' : '2023-02-20'
      };
      
      return staffMember;
    } catch (err) {
      console.error(`Error fetching staff member with ID ${id}:`, err);
      setError(`Failed to fetch staff member with ID ${id}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new staff member
  const createStaff = useCallback(async (staffData) => {
    setLoading(true);
    setError(null);
    try {
      // Mock API call
      const newStaff = {
        staff_id: Date.now(),
        ...staffData,
        hire_date: new Date().toISOString().split('T')[0]
      };
      
      setStaff(prev => [newStaff, ...prev]);
      toast.success(`${staffData.first_name} ${staffData.last_name} added successfully!`);
      return newStaff;
    } catch (err) {
      console.error('Error creating staff member:', err);
      setError('Failed to create staff member');
      toast.error('Failed to create staff member');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a staff member
  const updateStaff = useCallback(async (id, staffData) => {
    setLoading(true);
    setError(null);
    try {
      // Mock API call
      const updatedStaff = { staff_id: id, ...staffData };
      
      setStaff(prev => prev.map(member => 
        member.staff_id === id ? updatedStaff : member
      ));
      
      toast.success(`${staffData.first_name} ${staffData.last_name} updated successfully!`);
      return updatedStaff;
    } catch (err) {
      console.error(`Error updating staff member with ID ${id}:`, err);
      setError(`Failed to update staff member with ID ${id}`);
      toast.error('Failed to update staff member');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a staff member
  const deleteStaff = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      // Mock API call
      setStaff(prev => prev.filter(member => member.staff_id !== id));
      toast.success('Staff member deleted successfully!');
      return true;
    } catch (err) {
      console.error(`Error deleting staff member with ID ${id}:`, err);
      setError(`Failed to delete staff member with ID ${id}`);
      toast.error('Failed to delete staff member');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all roles
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // For now, use mock data since we're not connecting to a real backend yet
      const mockRoles = [
        { 
          id: 1, 
          name: 'Manager', 
          description: 'Full system access',
          permissions: ['order.view', 'order.create', 'order.edit', 'order.delete', 'order.void',
                       'inventory.view', 'inventory.adjust', 'inventory.create', 'inventory.edit',
                       'inventory.delete', 'menu.view', 'menu.create', 'menu.edit', 'menu.delete',
                       'menu.categories', 'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
                       'reports.view', 'reports.export', 'reports.sales', 'reports.inventory',
                       'reports.financial', 'settings.view', 'settings.edit', 'settings.advanced'],
          staff_count: 1
        },
        { 
          id: 2, 
          name: 'Cashier', 
          description: 'POS and basic functions',
          permissions: ['order.view', 'order.create', 'menu.view'],
          staff_count: 2
        },
        {
          id: 3,
          name: 'Inventory Manager',
          description: 'Manages inventory and supplies',
          permissions: ['inventory.view', 'inventory.adjust', 'inventory.create', 'inventory.edit'],
          staff_count: 0
        }
      ];
      
      // Ensure each role has permissions and staff_count properties
      const normalizedRoles = mockRoles.map(role => ({
        ...role,
        permissions: role.permissions || [],
        staff_count: role.staff_count || 0
      }));
      
      // Important: update the state with the normalized roles
      setRoles(normalizedRoles);
      
      return normalizedRoles;
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Failed to fetch roles');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // Remove 'roles' from the dependency array to prevent infinite loops

  // Add functions to create, update and delete roles
  const createRole = useCallback(async (roleData) => {
    setLoading(true);
    setError(null);
    try {
      // Mock API call
      const newRole = {
        id: Date.now(),
        ...roleData,
        staff_count: 0
      };
      
      setRoles(prev => [...prev, newRole]);
      toast.success(`Role "${roleData.name}" created successfully!`);
      return newRole;
    } catch (err) {
      console.error('Error creating role:', err);
      setError('Failed to create role');
      toast.error('Failed to create role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRole = useCallback(async (id, roleData) => {
    setLoading(true);
    setError(null);
    try {
      // Mock API call
      const updatedRole = { id, ...roleData };
      
      setRoles(prev => prev.map(role => 
        role.id === id ? updatedRole : role
      ));
      
      toast.success(`Role "${roleData.name}" updated successfully!`);
      return updatedRole;
    } catch (err) {
      console.error(`Error updating role with ID ${id}:`, err);
      setError(`Failed to update role with ID ${id}`);
      toast.error('Failed to update role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRole = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      // Mock API call
      setRoles(prev => prev.filter(role => role.id !== id));
      toast.success('Role deleted successfully!');
      return true;
    } catch (err) {
      console.error(`Error deleting role with ID ${id}:`, err);
      setError(`Failed to delete role with ID ${id}`);
      toast.error('Failed to delete role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    staff,
    roles,
    loading,
    error,
    fetchStaff,
    fetchStaffById,
    createStaff,
    updateStaff,
    deleteStaff,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole
  };
};