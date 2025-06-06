import { useState, useCallback, useEffect } from 'react';
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
      
      // Check for supplier connection if the user has auth credentials
      if (data.user_id) {
        try {
          // Use proper headers with the .eq method
          const { data: supplierData } = await supabase
            .from('suppliers')
            .select('supplier_id, company_name')
            .eq('user_id', data.user_id);
            
          if (supplierData && supplierData.length > 0) {
            formattedStaff.supplier_id = supplierData[0].supplier_id;
            formattedStaff.supplier_name = supplierData[0].company_name;
          }
        } catch (supplierErr) {
          console.log('Error fetching supplier connection:', supplierErr);
          // Continue anyway
        }
      }
      
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
      console.log('Creating staff with data:', staffData);
      
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
      if (staffData.password) {
        console.log('Creating auth user for staff');
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: staffData.email,
          password: staffData.password,
          email_confirm: true,
          user_metadata: {
            first_name: staffData.first_name,
            last_name: staffData.last_name,
            // Use username if provided, otherwise use first name
            username: staffData.username || staffData.first_name.toLowerCase(),
            role_id: staffData.role_id
          }
        });
        
        if (authError) {
          throw authError;
        }
        
        console.log('Auth user created:', authData.user.id);
        
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
          user_id: staffData.user_id
        })
        .select()
        .single();
        
      if (insertError) {
        throw insertError;
      }

      // Check if we need to handle supplier connection
      if (staffData.supplier_id && staffData.user_id) {
        console.log(`Linking new staff to supplier ${staffData.supplier_id}`);
        
        // First check if this supplier is already linked to another user
        const { data: supplierData, error: checkSupplierError } = await supabase
          .from('suppliers')
          .select('user_id, company_name')
          .eq('supplier_id', staffData.supplier_id)
          .single();
          
        if (checkSupplierError && checkSupplierError.code !== 'PGRST116') { // not found is ok
          console.error('Error checking supplier:', checkSupplierError);
        } else if (supplierData && supplierData.user_id && supplierData.user_id !== staffData.user_id) {
          console.warn(`Supplier ${staffData.supplier_id} is already linked to user ${supplierData.user_id}`);
          toast.warning(`Warning: Supplier ${supplierData.company_name} was already linked to another staff member`);
        }
        
        // Update the supplier with the new user_id
        const { error: supplierUpdateError } = await supabase
          .from('suppliers')
          .update({ user_id: staffData.user_id })
          .eq('supplier_id', staffData.supplier_id);
          
        if (supplierUpdateError) {
          console.error('Error linking supplier to user:', supplierUpdateError);
          toast.error('Staff created but supplier connection failed');
        } else {
          // Get the supplier name for the success message
          const supplierName = supplierData ? supplierData.company_name : 'selected supplier';
          toast.success(`Staff member linked to ${supplierName} successfully`);
        }
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

      // Enhanced supplier connection handling
      if (currentStaff.user_id) {
        console.log('Processing supplier connection for user_id:', currentStaff.user_id);
        
        // 1. Find any existing supplier connections for this user
        const { data: existingConnections, error: findError } = await supabase
          .from('suppliers')
          .select('supplier_id, company_name')
          .eq('user_id', currentStaff.user_id);
          
        if (findError) {
          console.error('Error finding existing supplier connections:', findError);
        } else if (existingConnections && existingConnections.length > 0) {
          console.log('Found existing supplier connections:', existingConnections);
          
          // 2. Clear all existing connections unless they match the new one
          for (const connection of existingConnections) {
            if (staffData.supplier_id !== connection.supplier_id.toString()) {
              console.log(`Clearing connection to supplier ${connection.supplier_id} (${connection.company_name})`);
              
              const { error: clearError } = await supabase
                .from('suppliers')
                .update({ user_id: null })
                .eq('supplier_id', connection.supplier_id);
                
              if (clearError) {
                console.error(`Error clearing connection to supplier ${connection.supplier_id}:`, clearError);
              }
            }
          }
        }
        
        // 3. If a new supplier ID is provided, set up that connection
        if (staffData.supplier_id) {
          console.log(`Linking user ${currentStaff.user_id} to supplier ${staffData.supplier_id}`);
          
          const { data: supplierCheck } = await supabase
            .from('suppliers')
            .select('supplier_id, company_name, user_id')
            .eq('supplier_id', staffData.supplier_id)
            .single();
            
          console.log("Found supplier record:", supplierCheck);
            
          const { error: supplierUpdateError } = await supabase
            .from('suppliers')
            .update({ user_id: currentStaff.user_id })
            .eq('supplier_id', staffData.supplier_id);
            
          if (supplierUpdateError) {
            console.error('Error linking supplier to user:', supplierUpdateError);
            toast.error('Staff updated but supplier connection failed');
          } else {
            const supplierName = supplierCheck ? supplierCheck.company_name : 'selected supplier';
            toast.success(`Staff member linked to ${supplierName} successfully`);
          }
        }
      } else if (staffData.supplier_id) {
        // Staff has no user_id but a supplier_id was provided
        toast.error('Cannot link supplier: Staff has no user account');
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
      // First clean up any supplier connections if this staff has a user_id
      if (staffRecord.user_id) {
        console.log(`Cleaning up supplier connections for user_id ${staffRecord.user_id}`);
        
        const { error: supplierUpdateError } = await supabase
          .from('suppliers')
          .update({ user_id: null })
          .eq('user_id', staffRecord.user_id);
          
        if (supplierUpdateError) {
          console.error('Error clearing supplier connections:', supplierUpdateError);
          // Continue with deletion anyway
        }
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

      // Get staff count per role
      const { data: allStaff, error: staffError } = await supabase
        .from('staff')
        .select('role_id');
        
      if (staffError) {
        console.error('Error fetching staff for role count:', staffError);
      }
      
      // Create a count map of staff per role
      const countMap = {};
      if (allStaff) {
        allStaff.forEach(staff => {
          if (staff.role_id) {
            countMap[staff.role_id] = (countMap[staff.role_id] || 0) + 1;
          }
        });
      }
      
      // Simplified permission handling - don't query the database for permissions
      // This removes the 406 and 400 errors you were experiencing
      
      // Format roles with counts but without querying permissions
      const formattedRoles = roleData.map(role => ({
        id: role.role_id,
        name: role.role_name,
        description: role.description || '',
        staff_count: countMap[role.role_id] || 0,
        permissions: [], // Will be populated on demand when editing roles
        created_at: role.created_at,
        updated_at: role.updated_at
      }));
      
      setRoles(formattedRoles);
      return formattedRoles;
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Failed to fetch roles');
      toast.error('Could not load roles data');
      return [];
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

  /**
   * Fetch staff members by role name
   * @param {string} roleName - Role name to filter by
   * @returns {Array} Staff members with specified role
   */
  const fetchStaffByRole = useCallback(async (roleName) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('role_id')
        .eq('role_name', roleName)
        .single();
        
      if (roleError) throw roleError;
      
      if (!roleData) {
        throw new Error(`Role "${roleName}" not found`);
      }
      
      const { data, error: staffError } = await supabase
        .from('staff')
        .select(`
          staff_id,
          user_id,
          first_name,
          last_name,
          email,
          phone,
          status,
          is_active,
          profile_image
        `)
        .eq('role_id', roleData.role_id)
        .eq('is_active', true);
        
      if (staffError) throw staffError;
      
      return data || [];
    } catch (err) {
      console.error(`Error fetching staff with role ${roleName}:`, err);
      setError(`Failed to fetch staff members with role ${roleName}`);
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
    fetchStaffByRole,
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