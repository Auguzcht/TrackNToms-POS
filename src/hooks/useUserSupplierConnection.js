import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import supabase from '../services/supabase';

/**
 * A hook specifically for managing connections between users/staff and suppliers
 * @returns {Object} Functions to manage user-supplier connections
 */
export const useUserSupplierConnection = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get the supplier linked to a specific user
   * @param {string} userId - Auth user ID
   * @returns {Object|null} Supplier data or null
   */
  const getSupplierByUserId = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') { // Not found error
        throw fetchError;
      }
      
      return data || null;
    } catch (err) {
      console.error('Error getting supplier for user:', err);
      setError(`Failed to get supplier for user: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get staff members who can manage the specified supplier
   * @param {number|string} supplierId - Supplier ID
   * @returns {Array} Staff members
   */
  const getStaffForSupplier = useCallback(async (supplierId) => {
    setLoading(true);
    setError(null);
    
    try {
      // First get the user_id for this supplier
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('user_id')
        .eq('supplier_id', supplierId)
        .single();
        
      if (supplierError) throw supplierError;
      
      if (!supplier?.user_id) {
        return [];
      }
      
      // Get staff information for this user_id
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select(`
          staff_id,
          user_id,
          first_name,
          last_name,
          email,
          role_id,
          roles:role_id (role_name)
        `)
        .eq('user_id', supplier.user_id);
        
      if (staffError) throw staffError;
      
      return staffData || [];
    } catch (err) {
      console.error(`Error getting staff for supplier ${supplierId}:`, err);
      setError(`Failed to get staff for supplier: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Link a user to a supplier
   * @param {string} userId - Auth user ID
   * @param {number|string} supplierId - Supplier ID
   * @returns {Object} Updated supplier data
   */
  const linkUserToSupplier = useCallback(async (userId, supplierId) => {
    setLoading(true);
    setError(null);
    
    try {
      // First, unlink any existing connections for this user
      const { error: clearError } = await supabase
        .from('suppliers')
        .update({ user_id: null })
        .eq('user_id', userId);
        
      if (clearError) {
        console.warn('Error clearing previous supplier connections:', clearError);
      }
      
      // Now link the user to the specified supplier
      const { data, error: linkError } = await supabase
        .from('suppliers')
        .update({ user_id: userId })
        .eq('supplier_id', supplierId)
        .select()
        .single();
        
      if (linkError) throw linkError;
      
      toast.success('User successfully linked to supplier');
      return data;
    } catch (err) {
      console.error('Error linking user to supplier:', err);
      setError(`Failed to link user to supplier: ${err.message}`);
      toast.error(`Failed to link user to supplier: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Unlink a user from all suppliers
   * @param {string} userId - Auth user ID
   * @returns {boolean} Success status
   */
  const unlinkUserFromSuppliers = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: unlinkError } = await supabase
        .from('suppliers')
        .update({ user_id: null })
        .eq('user_id', userId);
        
      if (unlinkError) throw unlinkError;
      
      toast.success('User unlinked from suppliers');
      return true;
    } catch (err) {
      console.error('Error unlinking user from suppliers:', err);
      setError(`Failed to unlink user: ${err.message}`);
      toast.error(`Failed to unlink user: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getSupplierByUserId,
    getStaffForSupplier,
    linkUserToSupplier,
    unlinkUserFromSuppliers
  };
};

export default useUserSupplierConnection;