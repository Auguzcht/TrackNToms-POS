import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import supabase from '../services/supabase';

/**
 * Hook to manage staff members and roles
 * @returns {Object} Staff management functions and state
 */
export const useStaff = () => {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all staff members with their roles
   */
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use a join to get role information along with staff
      const { data, error: staffError } = await supabase
        .from('staff')
        .select(`
          *,
          roles (
            role_id,
            role_name,
            description
          )
        `)
        .order('last_name', { ascending: true });

      if (staffError) {
        throw staffError;
      }
      
      // Transform data to match the expected format
      const formattedStaff = data.map(item => ({
        staff_id: item.staff_id,
        user_id: item.user_id,
        first_name: item.first_name,
        last_name: item.last_name,
        email: item.email,
        phone: item.phone || '',
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
      toast.error('Could not load staff data');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch a single staff member by ID
   * @param {number} id - Staff ID
   */
  const fetchStaffById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: staffError } = await supabase
        .from('staff')
        .select(`
          *,
          roles (
            role_id,
            role_name,
            description
          )
        `)
        .eq('staff_id', id)
        .single();

      if (staffError) {
        throw staffError;
      }
      
      if (!data) {
        throw new Error(`Staff member with ID ${id} not found`);
      }

      // Format the staff member data
      const formattedStaff = {
        staff_id: data.staff_id,
        user_id: data.user_id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || '',
        role_id: data.role_id,
        role: data.roles?.role_name || 'Unknown',
        status: data.status || 'Inactive',
        is_active: data.is_active || false,
        profile_image: data.profile_image,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      return formattedStaff;
    } catch (err) {
      console.error(`Error fetching staff member with ID ${id}:`, err);
      setError(`Failed to fetch staff member with ID ${id}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new staff member
   * @param {Object} staffData - Staff member data
   */
  const createStaff = useCallback(async (staffData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if the email is already in use
      const { data: existingUser, error: checkError } = await supabase
        .from('staff')
        .select('staff_id, email')
        .eq('email', staffData.email)
        .limit(1);
        
      if (checkError) throw checkError;
      
      if (existingUser && existingUser.length > 0) {
        throw new Error('Email address is already in use');
      }

      // If creating a user with system access, first create the auth user
      if (staffData.username && staffData.password) {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: staffData.email,
          password: staffData.password,
          email_confirm: true,
          user_metadata: {
            first_name: staffData.first_name,
            last_name: staffData.last_name,
            role: staffData.role // Use the role name
          }
        });
        
        if (authError) {
          throw authError;
        }
        
        // Use the returned user ID
        staffData.user_id = authData.user.id;
      }

      // Insert the staff record
      const { data, error: insertError } = await supabase
        .from('staff')
        .insert({
          first_name: staffData.first_name,
          last_name: staffData.last_name,
          email: staffData.email,
          phone: staffData.phone,
          role_id: staffData.role_id,
          status: staffData.status || 'Active',
          is_active: staffData.status === 'Active',
          profile_image: staffData.profile_image,
          user_id: staffData.user_id // This will be undefined if not creating an auth user
        })
        .select()
        .single();
        
      if (insertError) {
        throw insertError;
      }

      toast.success(`${staffData.first_name} ${staffData.last_name} added successfully!`);
      
      // Refresh the staff list
      fetchStaff();
      
      return data;
    } catch (err) {
      console.error('Error creating staff member:', err);
      setError('Failed to create staff member');
      toast.error(`Failed to create staff member: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStaff]);

  /**
   * Update a staff member
   * @param {number} id - Staff ID
   * @param {Object} staffData - Updated staff data
   */
  const updateStaff = useCallback(async (id, staffData) => {
    setLoading(true);
    setError(null);
    
    try {
      // First, get the current staff record to check if sensitive fields are changing
      const { data: currentStaff, error: fetchError } = await supabase
        .from('staff')
        .select('*')
        .eq('staff_id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      if (!currentStaff) {
        throw new Error(`Staff member with ID ${id} not found`);
      }

      // Check if email is changing and if it's already in use
      if (staffData.email !== currentStaff.email) {
        const { data: existingUser, error: checkError } = await supabase
          .from('staff')
          .select('staff_id')
          .eq('email', staffData.email)
          .neq('staff_id', id)
          .limit(1);
          
        if (checkError) throw checkError;
        
        if (existingUser && existingUser.length > 0) {
          throw new Error('Email address is already in use by another staff member');
        }
      }
      
      // Prepare update data
      const updateData = {
        first_name: staffData.first_name,
        last_name: staffData.last_name,
        email: staffData.email,
        phone: staffData.phone,
        role_id: staffData.role_id,
        status: staffData.status,
        is_active: staffData.status === 'Active',
        profile_image: staffData.profile_image,
        updated_at: new Date().toISOString()
      };

      // Update the staff record
      const { data, error: updateError } = await supabase
        .from('staff')
        .update(updateData)
        .eq('staff_id', id)
        .select()
        .single();
        
      if (updateError) {
        throw updateError;
      }

      // If this staff member has a linked auth user and password is changing
      if (currentStaff.user_id && staffData.password) {
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
          currentStaff.user_id,
          {
            password: staffData.password,
            email: staffData.email, // Update email in auth if it changed
            user_metadata: {
              first_name: staffData.first_name,
              last_name: staffData.last_name
            }
          }
        );
        
        if (authUpdateError) {
          // Log error but don't fail the whole operation
          console.error('Error updating auth user:', authUpdateError);
          toast.error('Staff record updated but password change failed');
        }
      }

      toast.success(`${staffData.first_name} ${staffData.last_name} updated successfully!`);
      
      // Refresh the staff list
      fetchStaff();
      
      return data;
    } catch (err) {
      console.error(`Error updating staff member with ID ${id}:`, err);
      setError(`Failed to update staff member with ID ${id}`);
      toast.error(`Failed to update staff member: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStaff]);

  /**
   * Delete a staff member
   * @param {number} id - Staff ID
   */
  const deleteStaff = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
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

      // If there's a linked auth user, delete it too
      if (staffRecord.user_id) {
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(staffRecord.user_id);
        
        if (authDeleteError) {
          console.error('Error deleting auth user:', authDeleteError);
          toast.error('Staff record deleted but auth account removal failed');
        }
      }

      toast.success(`${staffRecord.first_name} ${staffRecord.last_name} removed successfully!`);
      
      // Update local state
      setStaff(prev => prev.filter(member => member.staff_id !== id));
      
      return true;
    } catch (err) {
      console.error(`Error deleting staff member with ID ${id}:`, err);
      setError(`Failed to delete staff member with ID ${id}`);
      toast.error(`Failed to delete staff member: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Toggle a staff member's active status
   * @param {number} id - Staff ID
   * @param {boolean} isActive - New active status
   */
  const toggleStaffStatus = useCallback(async (id, isActive) => {
    setLoading(true);
    setError(null);
    
    try {
      const status = isActive ? 'Active' : 'Inactive';
      
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

      toast.success(`${data.first_name} ${data.last_name} is now ${status.toLowerCase()}`);
      
      // Refresh staff list
      fetchStaff();
      
      return true;
    } catch (err) {
      console.error(`Error toggling status for staff with ID ${id}:`, err);
      setError(`Failed to update status for staff with ID ${id}`);
      toast.error(`Failed to update staff status: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStaff]);

  /**
   * Fetch all roles with permission counts
   */
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First get all roles
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .order('role_name', { ascending: true });
        
      if (roleError) throw roleError;

      // Get staff counts for each role
      const { data: staffCounts, error: countError } = await supabase
        .from('staff')
        .select('role_id, count')
        .group('role_id');
        
      if (countError) {
        console.error('Error fetching staff counts:', countError);
        // Continue without counts if there's an error
      }
      
      // Get permissions for each role
      const { data: rolePermissions, error: permError } = await supabase
        .from('role_permissions')
        .select(`
          role_id, 
          permissions (
            permission_id,
            resource_name,
            action_name,
            display_name
          )
        `);
        
      if (permError) {
        console.error('Error fetching role permissions:', permError);
        // Continue without permissions if there's an error
      }

      // Create a map of role_id -> staff count
      const countMap = {};
      if (staffCounts) {
        staffCounts.forEach(item => {
          countMap[item.role_id] = parseInt(item.count, 10);
        });
      }
      
      // Create a map of role_id -> permissions
      const permissionsMap = {};
      if (rolePermissions) {
        rolePermissions.forEach(item => {
          if (!permissionsMap[item.role_id]) {
            permissionsMap[item.role_id] = [];
          }
          
          if (item.permissions) {
            // If this is an array, push all permission IDs
            if (Array.isArray(item.permissions)) {
              item.permissions.forEach(perm => {
                permissionsMap[item.role_id].push(
                  `${perm.resource_name}.${perm.action_name}`
                );
              });
            } else {
              // If it's a single object, push that permission ID
              permissionsMap[item.role_id].push(
                `${item.permissions.resource_name}.${item.permissions.action_name}`
              );
            }
          }
        });
      }

      // Format roles with counts and permissions
      const formattedRoles = roleData.map(role => ({
        id: role.role_id,
        name: role.role_name,
        description: role.description || '',
        staff_count: countMap[role.role_id] || 0,
        permissions: permissionsMap[role.role_id] || [],
        created_at: role.created_at,
        updated_at: role.updated_at
      }));
      
      setRoles(formattedRoles);
      return formattedRoles;
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Failed to fetch roles');
      toast.error('Could not load roles data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new role
   * @param {Object} roleData - Role data with name, description, and permissions
   */
  const createRole = useCallback(async (roleData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if role name already exists
      const { data: existingRole, error: checkError } = await supabase
        .from('roles')
        .select('role_id')
        .ilike('role_name', roleData.name)
        .limit(1);
        
      if (checkError) throw checkError;
      
      if (existingRole && existingRole.length > 0) {
        throw new Error(`Role "${roleData.name}" already exists`);
      }

      // Insert the role
      const { data: newRole, error: roleError } = await supabase
        .from('roles')
        .insert({
          role_name: roleData.name,
          description: roleData.description
        })
        .select()
        .single();
        
      if (roleError) throw roleError;

      // If there are permissions, map them to permission IDs and add them
      if (roleData.permissions && roleData.permissions.length > 0) {
        // Get all permissions to map permission strings to IDs
        const { data: allPermissions, error: permError } = await supabase
          .from('permissions')
          .select('permission_id, resource_name, action_name');
          
        if (permError) throw permError;
        
        // Create a map of "resource.action" -> permission_id
        const permissionMap = {};
        allPermissions.forEach(perm => {
          const key = `${perm.resource_name}.${perm.action_name}`;
          permissionMap[key] = perm.permission_id;
        });
        
        // Create permission assignments
        const rolePermissions = roleData.permissions
          .filter(perm => permissionMap[perm]) // Filter out any that don't match
          .map(perm => ({
            role_id: newRole.role_id,
            permission_id: permissionMap[perm]
          }));
        
        if (rolePermissions.length > 0) {
          const { error: assignError } = await supabase
            .from('role_permissions')
            .insert(rolePermissions);
            
          if (assignError) {
            console.error('Error assigning permissions to role:', assignError);
            toast.error('Role created but some permissions could not be assigned');
          }
        }
      }

      toast.success(`Role "${roleData.name}" created successfully!`);
      
      // Refresh roles
      fetchRoles();
      
      return {
        id: newRole.role_id,
        name: newRole.role_name,
        description: newRole.description,
        permissions: roleData.permissions || [],
        staff_count: 0
      };
    } catch (err) {
      console.error('Error creating role:', err);
      setError('Failed to create role');
      toast.error(`Failed to create role: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRoles]);

  /**
   * Update a role
   * @param {number} id - Role ID
   * @param {Object} roleData - Updated role data
   */
  const updateRole = useCallback(async (id, roleData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if name is changing and if it's already taken
      if (roleData.name) {
        const { data: existingRole, error: checkError } = await supabase
          .from('roles')
          .select('role_id')
          .ilike('role_name', roleData.name)
          .neq('role_id', id)
          .limit(1);
          
        if (checkError) throw checkError;
        
        if (existingRole && existingRole.length > 0) {
          throw new Error(`Role "${roleData.name}" already exists`);
        }
      }

      // Update the role
      const { data: updatedRole, error: roleError } = await supabase
        .from('roles')
        .update({
          role_name: roleData.name,
          description: roleData.description,
          updated_at: new Date().toISOString()
        })
        .eq('role_id', id)
        .select()
        .single();
        
      if (roleError) throw roleError;

      // Handle permission updates by removing all and re-adding
      if (roleData.permissions) {
        // First, remove existing permissions
        const { error: deleteError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', id);
          
        if (deleteError) {
          console.error('Error removing existing permissions:', deleteError);
          // Continue anyway to try adding new permissions
        }
        
        if (roleData.permissions.length > 0) {
          // Get all permissions to map permission strings to IDs
          const { data: allPermissions, error: permError } = await supabase
            .from('permissions')
            .select('permission_id, resource_name, action_name');
            
          if (permError) throw permError;
          
          // Create a map of "resource.action" -> permission_id
          const permissionMap = {};
          allPermissions.forEach(perm => {
            const key = `${perm.resource_name}.${perm.action_name}`;
            permissionMap[key] = perm.permission_id;
          });
          
          // Create permission assignments
          const rolePermissions = roleData.permissions
            .filter(perm => permissionMap[perm])
            .map(perm => ({
              role_id: id,
              permission_id: permissionMap[perm]
            }));
          
          if (rolePermissions.length > 0) {
            const { error: assignError } = await supabase
              .from('role_permissions')
              .insert(rolePermissions);
              
            if (assignError) {
              console.error('Error assigning permissions to role:', assignError);
              toast.error('Role updated but some permissions could not be assigned');
            }
          }
        }
      }

      toast.success(`Role "${roleData.name}" updated successfully!`);
      
      // Refresh roles
      fetchRoles();
      
      return {
        id: updatedRole.role_id,
        name: updatedRole.role_name,
        description: updatedRole.description,
        permissions: roleData.permissions || [],
        staff_count: 0 // This will be updated by fetchRoles()
      };
    } catch (err) {
      console.error(`Error updating role with ID ${id}:`, err);
      setError(`Failed to update role with ID ${id}`);
      toast.error(`Failed to update role: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRoles]);

  /**
   * Delete a role
   * @param {number} id - Role ID
   */
  const deleteRole = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if role is in use
      const { data: staffWithRole, error: checkError } = await supabase
        .from('staff')
        .select('count')
        .eq('role_id', id)
        .limit(1);
        
      if (checkError) throw checkError;
      
      if (staffWithRole && staffWithRole.length > 0) {
        throw new Error('This role is still assigned to staff members and cannot be deleted');
      }

      // Delete role permissions first due to foreign key constraints
      const { error: permDeleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', id);
        
      if (permDeleteError) {
        console.error('Error deleting role permissions:', permDeleteError);
        // Continue anyway to try deleting the role
      }

      // Delete the role
      const { error: roleDeleteError } = await supabase
        .from('roles')
        .delete()
        .eq('role_id', id);
        
      if (roleDeleteError) throw roleDeleteError;

      toast.success('Role deleted successfully!');
      
      // Update local state
      setRoles(prev => prev.filter(role => role.id !== id));
      
      return true;
    } catch (err) {
      console.error(`Error deleting role with ID ${id}:`, err);
      setError(`Failed to delete role with ID ${id}`);
      toast.error(`Failed to delete role: ${err.message}`);
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
    toggleStaffStatus,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole
  };
};