import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import supabase from '../services/supabase';

/**
 * Hook for managing suppliers, consignments, and purchase orders
 * @returns {Object} Supplier management functions and state
 */
export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [consignments, setConsignments] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  /**
   * Fetch all suppliers
   * @returns {Array} Suppliers list
   */
  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('suppliers')
        .select('*')
        .order('company_name', { ascending: true });
      
      if (fetchError) throw fetchError;
      
      console.log('Suppliers fetched:', data);
      setSuppliers(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to fetch suppliers');
      toast.error('Could not load supplier data');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get supplier by ID
   * @param {number|string} id - Supplier ID 
   * @returns {Object} Supplier data
   */
  const getSupplierById = useCallback(async (id) => {
    console.log(`getSupplierById called with ID: ${id} (type: ${typeof id})`);
    
    if (id === null || id === undefined) {
      console.error("getSupplierById received null/undefined ID");
      throw new Error("Invalid supplier ID (null or undefined)");
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First check if we already have this supplier in state
      const cachedSupplier = suppliers.find(s => 
        s.supplier_id === id || s.supplier_id === Number(id)
      );
      
      if (cachedSupplier) {
        console.log("Found supplier in cache:", cachedSupplier);
        return cachedSupplier;
      }
      
      // Otherwise fetch from Supabase
      const { data, error: fetchError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('supplier_id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (!data) {
        throw new Error(`Supplier with ID ${id} not found`);
      }
      
      console.log("Found supplier:", data);
      return data;
    } catch (err) {
      console.error(`Error fetching supplier with ID ${id}:`, err);
      setError(`Failed to fetch supplier with ID ${id}`);
      toast.error('Failed to load supplier details');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [suppliers]);

  // Alias for getSupplierById to maintain compatibility with SupplierForm
  const getSupplier = getSupplierById;

  /**
   * Create a new supplier
   * @param {Object} supplierData - Supplier information
   * @returns {Object} Created supplier
   */
  const createSupplier = useCallback(async (supplierData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if company name already exists
      const { data: existingSupplier, error: checkError } = await supabase
        .from('suppliers')
        .select('supplier_id')
        .ilike('company_name', supplierData.company_name)
        .limit(1);
      
      if (checkError) throw checkError;
      
      if (existingSupplier && existingSupplier.length > 0) {
        throw new Error('A supplier with this name already exists');
      }

      // Add timestamps
      const dataWithTimestamps = {
        ...supplierData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error: insertError } = await supabase
        .from('suppliers')
        .insert([dataWithTimestamps])
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Update local state
      setSuppliers(prev => [...prev, data]);
      
      toast.success(`Supplier ${supplierData.company_name} created successfully`);
      return data;
    } catch (err) {
      console.error('Error creating supplier:', err);
      setError('Failed to create supplier');
      toast.error(`Failed to create supplier: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update a supplier
   * @param {number|string} id - Supplier ID
   * @param {Object} supplierData - Updated supplier data
   * @returns {Object} Updated supplier
   */
  const updateSupplier = useCallback(async (id, supplierData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check for duplicate name if name is being changed
      if (supplierData.company_name) {
        const { data: currentSupplier, error: currentError } = await supabase
          .from('suppliers')
          .select('company_name')
          .eq('supplier_id', id)
          .single();
        
        if (currentError) throw currentError;
        
        // Only check for duplicates if name is actually changing
        if (currentSupplier.company_name !== supplierData.company_name) {
          const { data: existingSupplier, error: checkError } = await supabase
            .from('suppliers')
            .select('supplier_id')
            .ilike('company_name', supplierData.company_name)
            .neq('supplier_id', id)
            .limit(1);
          
          if (checkError) throw checkError;
          
          if (existingSupplier && existingSupplier.length > 0) {
            throw new Error('A supplier with this name already exists');
          }
        }
      }

      // Add updated timestamp
      const dataWithTimestamp = {
        ...supplierData,
        updated_at: new Date().toISOString()
      };
      
      const { data, error: updateError } = await supabase
        .from('suppliers')
        .update(dataWithTimestamp)
        .eq('supplier_id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      // Update local state
      setSuppliers(prev => prev.map(s => 
        s.supplier_id === Number(id) ? data : s
      ));
      
      toast.success(`Supplier ${supplierData.company_name || 'record'} updated successfully`);
      return data;
    } catch (err) {
      console.error(`Error updating supplier with ID ${id}:`, err);
      setError(`Failed to update supplier with ID ${id}`);
      toast.error(`Failed to update supplier: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a supplier
   * @param {number|string} id - Supplier ID
   * @returns {boolean} Success status
   */
  const deleteSupplier = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if supplier has associated consignments or purchase orders
      const { data: relatedConsignments, error: consignmentError } = await supabase
        .from('consignments')
        .select('consignment_id')
        .eq('supplier_id', id)
        .limit(1);
      
      if (consignmentError) throw consignmentError;
      
      if (relatedConsignments && relatedConsignments.length > 0) {
        throw new Error('Cannot delete supplier with existing consignments');
      }
      
      const { data: relatedPurchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('purchase_id')
        .eq('supplier_id', id)
        .limit(1);
      
      if (purchaseError) throw purchaseError;
      
      if (relatedPurchases && relatedPurchases.length > 0) {
        throw new Error('Cannot delete supplier with existing purchase orders');
      }
      
      // Delete the supplier
      const { error: deleteError } = await supabase
        .from('suppliers')
        .delete()
        .eq('supplier_id', id);
      
      if (deleteError) throw deleteError;
      
      // Update local state
      setSuppliers(prev => prev.filter(s => s.supplier_id !== Number(id)));
      
      toast.success('Supplier deleted successfully');
      return true;
    } catch (err) {
      console.error(`Error deleting supplier with ID ${id}:`, err);
      setError(`Failed to delete supplier with ID ${id}`);
      toast.error(`Failed to delete supplier: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch consignments with supplier details
   * @param {Object} params - Query parameters
   * @returns {Array} Consignments list
   */
  const fetchConsignments = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch consignments with supplier details using join
      const { data, error: fetchError } = await supabase
        .from('consignments')
        .select(`
          *,
          suppliers:supplier_id (
            supplier_id,
            company_name
          )
        `)
        .order('date', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      // For each consignment, also fetch its items
      const consignmentsWithItems = await Promise.all(
        data.map(async (consignment) => {
          const { data: items, error: itemsError } = await supabase
            .from('consignment_items')
            .select(`
              *,
              items:item_id (
                item_id,
                item_name,
                category
              )
            `)
            .eq('consignment_id', consignment.consignment_id);
          
          if (itemsError) {
            console.error('Error fetching consignment items:', itemsError);
            return {
              ...consignment,
              items: []
            };
          }
          
          return {
            ...consignment,
            items,
            supplier_name: consignment.suppliers?.company_name
          };
        })
      );
      
      console.log('Consignments fetched:', consignmentsWithItems);
      setConsignments(consignmentsWithItems || []);
      return consignmentsWithItems || [];
    } catch (err) {
      console.error('Error fetching consignments:', err);
      setError('Failed to fetch consignments');
      toast.error('Could not load consignment data');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get consignment by ID with details
   * @param {number|string} id - Consignment ID
   * @returns {Object} Consignment data
   */
  const getConsignment = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch the consignment with supplier details
      const { data: consignment, error: consignmentError } = await supabase
        .from('consignments')
        .select(`
          *,
          suppliers:supplier_id (
            supplier_id,
            company_name
          )
        `)
        .eq('consignment_id', id)
        .single();
      
      if (consignmentError) throw consignmentError;
      
      if (!consignment) {
        throw new Error(`Consignment with ID ${id} not found`);
      }
      
      // Fetch consignment items
      const { data: items, error: itemsError } = await supabase
        .from('consignment_items')
        .select(`
          *,
          items:item_id (
            item_id,
            item_name,
            category
          )
        `)
        .eq('consignment_id', consignment.consignment_id);
      
      if (itemsError) throw itemsError;
      
      // Add items and supplier name to consignment object
      const completeConsignment = {
        ...consignment,
        items: items || [],
        supplier_name: consignment.suppliers?.company_name
      };
      
      return completeConsignment;
    } catch (err) {
      console.error(`Error fetching consignment with ID ${id}:`, err);
      setError(`Failed to fetch consignment with ID ${id}`);
      toast.error('Failed to load consignment details');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new consignment
   * @param {Object} consignmentData - Consignment with items
   * @returns {Object} Created consignment
   */
  const createConsignment = useCallback(async (consignmentData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Extract items array from the consignment data
      const { items, ...consignmentHeader } = consignmentData;
      
      // Add timestamps to consignment header
      const headerWithTimestamps = {
        ...consignmentHeader,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert consignment header
      const { data: newConsignment, error: consignmentError } = await supabase
        .from('consignments')
        .insert([headerWithTimestamps])
        .select()
        .single();
      
      if (consignmentError) throw consignmentError;
      
      if (items && items.length > 0) {
        // Prepare items for insertion (add consignment_id to each)
        const itemsWithConsignmentId = items.map(item => ({
          ...item,
          consignment_id: newConsignment.consignment_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        // Insert consignment items
        const { error: itemsError } = await supabase
          .from('consignment_items')
          .insert(itemsWithConsignmentId);
        
        if (itemsError) {
          console.error('Error adding consignment items:', itemsError);
          // Continue even if items fail - we'll have the consignment header at least
          toast.warning('Consignment created but some items could not be added');
        }
      }
      
      // Fetch the complete consignment (with items) to return
      const completeConsignment = await getConsignment(newConsignment.consignment_id);
      
      // Update local state with the new consignment
      setConsignments(prev => [completeConsignment, ...prev]);
      
      toast.success('Consignment created successfully');
      return completeConsignment;
    } catch (err) {
      console.error('Error creating consignment:', err);
      setError('Failed to create consignment');
      toast.error(`Failed to create consignment: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getConsignment]);

  /**
   * Update an existing consignment
   * @param {number|string} id - Consignment ID
   * @param {Object} consignmentData - Updated consignment data
   * @returns {Object} Updated consignment
   */
  const updateConsignment = useCallback(async (id, consignmentData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Extract items array from the consignment data
      const { items, ...consignmentHeader } = consignmentData;
      
      // Add timestamp to consignment header
      const headerWithTimestamp = {
        ...consignmentHeader,
        updated_at: new Date().toISOString()
      };
      
      // Update consignment header
      const { data: updatedConsignment, error: updateError } = await supabase
        .from('consignments')
        .update(headerWithTimestamp)
        .eq('consignment_id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      if (items) {
        // First delete all existing items
        const { error: deleteError } = await supabase
          .from('consignment_items')
          .delete()
          .eq('consignment_id', id);
        
        if (deleteError) throw deleteError;
        
        if (items.length > 0) {
          // Prepare items for insertion
          const itemsWithConsignmentId = items.map(item => ({
            ...item,
            consignment_id: id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          
          // Insert updated items
          const { error: itemsError } = await supabase
            .from('consignment_items')
            .insert(itemsWithConsignmentId);
          
          if (itemsError) {
            console.error('Error updating consignment items:', itemsError);
            toast.warning('Consignment updated but some items could not be added');
          }
        }
      }
      
      // Fetch the complete updated consignment
      const completeConsignment = await getConsignment(id);
      
      // Update local state
      setConsignments(prev => prev.map(c => 
        c.consignment_id === Number(id) ? completeConsignment : c
      ));
      
      toast.success('Consignment updated successfully');
      return completeConsignment;
    } catch (err) {
      console.error(`Error updating consignment with ID ${id}:`, err);
      setError(`Failed to update consignment with ID ${id}`);
      toast.error(`Failed to update consignment: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getConsignment]);

  /**
   * Delete a consignment
   * @param {number|string} id - Consignment ID
   * @returns {boolean} Success status
   */
  const deleteConsignment = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      // Delete consignment items first (foreign key constraint)
      const { error: itemsDeleteError } = await supabase
        .from('consignment_items')
        .delete()
        .eq('consignment_id', id);
      
      if (itemsDeleteError) throw itemsDeleteError;
      
      // Delete consignment header
      const { error: deleteError } = await supabase
        .from('consignments')
        .delete()
        .eq('consignment_id', id);
      
      if (deleteError) throw deleteError;
      
      // Update local state
      setConsignments(prev => prev.filter(c => c.consignment_id !== Number(id)));
      
      toast.success('Consignment deleted successfully');
      return true;
    } catch (err) {
      console.error(`Error deleting consignment with ID ${id}:`, err);
      setError(`Failed to delete consignment with ID ${id}`);
      toast.error(`Failed to delete consignment: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch purchase orders with supplier details
   * @param {Object} params - Query parameters
   * @returns {Array} Purchase orders list
   */
  const fetchPurchaseOrders = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch purchase orders with supplier details
      const { data, error: fetchError } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers:supplier_id (
            supplier_id,
            company_name
          ),
          staff:staff_id (
            staff_id,
            first_name,
            last_name,
            email
          ),
          approvers:manager_id (
            staff_id,
            first_name,
            last_name,
            email
          )
        `)
        .order('purchase_date', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      // For each purchase order, also fetch its items
      const purchasesWithItems = await Promise.all(
        data.map(async (purchase) => {
          const { data: items, error: itemsError } = await supabase
            .from('purchase_details')
            .select(`
              *,
              ingredients:ingredient_id (
                ingredient_id,
                name,
                unit
              )
            `)
            .eq('purchase_id', purchase.purchase_id);
          
          if (itemsError) {
            console.error('Error fetching purchase items:', itemsError);
            return {
              ...purchase,
              items: [],
              supplier_name: purchase.suppliers?.company_name,
              staff_name: purchase.staff ? 
                `${purchase.staff.first_name} ${purchase.staff.last_name}` : 
                'Unknown',
              manager_name: purchase.approvers ? 
                `${purchase.approvers.first_name} ${purchase.approvers.last_name}` : 
                null
            };
          }
          
          // Format items with ingredient details
          const formattedItems = items.map(item => ({
            purchase_detail_id: item.purchase_detail_id,
            ingredient_id: item.ingredient_id,
            ingredient_name: item.ingredients?.name || 'Unknown Ingredient',
            ingredient_unit: item.ingredients?.unit || 'unit',
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
            product_expiration_date: item.product_expiration_date
          }));
          
          return {
            ...purchase,
            items: formattedItems,
            supplier_name: purchase.suppliers?.company_name,
            staff_name: purchase.staff ? 
              `${purchase.staff.first_name} ${purchase.staff.last_name}` : 
              'Unknown',
            manager_name: purchase.approvers ? 
              `${purchase.approvers.first_name} ${purchase.approvers.last_name}` : 
              null
          };
        })
      );
      
      console.log('Purchase orders fetched:', purchasesWithItems);
      setPurchaseOrders(purchasesWithItems || []);
      return purchasesWithItems || [];
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError('Failed to fetch purchase orders');
      toast.error('Could not load purchase order data');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get purchase order by ID with details
   * @param {number|string} id - Purchase order ID
   * @returns {Object} Purchase order data
   */
  const getPurchaseOrder = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch the purchase order with related details
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers:supplier_id (
            supplier_id,
            company_name
          ),
          staff:staff_id (
            staff_id,
            first_name,
            last_name,
            email
          ),
          approvers:manager_id (
            staff_id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('purchase_id', id)
        .single();
      
      if (purchaseError) throw purchaseError;
      
      if (!purchase) {
        throw new Error(`Purchase order with ID ${id} not found`);
      }
      
      // Fetch purchase items
      const { data: items, error: itemsError } = await supabase
        .from('purchase_details')
        .select(`
          *,
          ingredients:ingredient_id (
            ingredient_id,
            name,
            unit
          )
        `)
        .eq('purchase_id', purchase.purchase_id);
      
      if (itemsError) throw itemsError;
      
      // Format items with ingredient details
      const formattedItems = items.map(item => ({
        purchase_detail_id: item.purchase_detail_id,
        ingredient_id: item.ingredient_id,
        ingredient_name: item.ingredients?.name || 'Unknown Ingredient',
        ingredient_unit: item.ingredients?.unit || 'unit',
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        product_expiration_date: item.product_expiration_date
      }));
      
      // Add items and name details to purchase object
      const completePurchase = {
        ...purchase,
        items: formattedItems || [],
        supplier_name: purchase.suppliers?.company_name,
        staff_name: purchase.staff ? 
          `${purchase.staff.first_name} ${purchase.staff.last_name}` : 
          'Unknown',
        manager_name: purchase.approvers ? 
          `${purchase.approvers.first_name} ${purchase.approvers.last_name}` : 
          null
      };
      
      return completePurchase;
    } catch (err) {
      console.error(`Error fetching purchase order with ID ${id}:`, err);
      setError(`Failed to fetch purchase order with ID ${id}`);
      toast.error('Failed to load purchase order details');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new purchase order
   * @param {Object} purchaseData - Purchase order with items
   * @returns {Object} Created purchase order
   */
  const createPurchaseOrder = useCallback(async (purchaseData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Extract items array from the purchase data
      const { purchase_details, ...purchaseHeader } = purchaseData;
      
      // Add timestamps to purchase header
      const headerWithTimestamps = {
        ...purchaseHeader,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert purchase header
      const { data: newPurchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert([headerWithTimestamps])
        .select()
        .single();
      
      if (purchaseError) throw purchaseError;
      
      if (purchase_details && purchase_details.length > 0) {
        // Prepare items for insertion (add purchase_id to each)
        const itemsWithPurchaseId = purchase_details.map(item => ({
          ...item,
          purchase_id: newPurchase.purchase_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        // Insert purchase items
        const { error: itemsError } = await supabase
          .from('purchase_details')
          .insert(itemsWithPurchaseId);
        
        if (itemsError) {
          console.error('Error adding purchase items:', itemsError);
          toast.warning('Purchase order created but some items could not be added');
        }
      }
      
      // Update inventory quantities if purchase is already approved
      if (newPurchase.status === 'completed' && purchaseData.update_inventory) {
        for (const item of purchase_details) {
          const { data: ingredient, error: getError } = await supabase
            .from('ingredients')
            .select('quantity')
            .eq('ingredient_id', item.ingredient_id)
            .single();
          
          if (getError) {
            console.error('Error fetching ingredient quantity:', getError);
            continue;
          }
          
          const newQuantity = (ingredient.quantity || 0) + item.quantity;
          
          const { error: updateError } = await supabase
            .from('ingredients')
            .update({ 
              quantity: newQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('ingredient_id', item.ingredient_id);
          
          if (updateError) {
            console.error('Error updating ingredient quantity:', updateError);
          }
        }
      }
      
      // Fetch the complete purchase order to return
      const completePurchase = await getPurchaseOrder(newPurchase.purchase_id);
      
      // Update local state
      setPurchaseOrders(prev => [completePurchase, ...prev]);
      
      toast.success('Purchase order created successfully');
      return completePurchase;
    } catch (err) {
      console.error('Error creating purchase order:', err);
      setError('Failed to create purchase order');
      toast.error(`Failed to create purchase order: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getPurchaseOrder]);

  /**
   * Update an existing purchase order
   * @param {number|string} id - Purchase order ID
   * @param {Object} purchaseData - Updated purchase order data
   * @returns {Object} Updated purchase order
   */
  const updatePurchaseOrder = useCallback(async (id, purchaseData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get original purchase order to check status change
      const { data: originalPurchase, error: getError } = await supabase
        .from('purchases')
        .select('status')
        .eq('purchase_id', id)
        .single();
      
      if (getError) throw getError;
      
      // Extract items array from the purchase data
      const { purchase_details, ...purchaseHeader } = purchaseData;
      
      // Add timestamp to purchase header
      const headerWithTimestamp = {
        ...purchaseHeader,
        updated_at: new Date().toISOString()
      };
      
      // Update purchase header
      const { data: updatedPurchase, error: updateError } = await supabase
        .from('purchases')
        .update(headerWithTimestamp)
        .eq('purchase_id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      if (purchase_details) {
        // First delete all existing items
        const { error: deleteError } = await supabase
          .from('purchase_details')
          .delete()
          .eq('purchase_id', id);
        
        if (deleteError) throw deleteError;
        
        if (purchase_details.length > 0) {
          // Prepare items for insertion
          const itemsWithPurchaseId = purchase_details.map(item => ({
            ...item,
            purchase_id: id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          
          // Insert updated items
          const { error: itemsError } = await supabase
            .from('purchase_details')
            .insert(itemsWithPurchaseId);
          
          if (itemsError) {
            console.error('Error updating purchase items:', itemsError);
            toast.warning('Purchase order updated but some items could not be added');
          }
        }
      }
      
      // Check if status changed from pending to completed
      const statusChangedToCompleted = 
        originalPurchase.status !== 'completed' && 
        purchaseHeader.status === 'completed';
      
      // Update inventory if status changed to completed and update_inventory flag is set
      if (statusChangedToCompleted && purchaseData.update_inventory) {
        for (const item of purchase_details) {
          const { data: ingredient, error: getIngError } = await supabase
            .from('ingredients')
            .select('quantity')
            .eq('ingredient_id', item.ingredient_id)
            .single();
          
          if (getIngError) {
            console.error('Error fetching ingredient quantity:', getIngError);
            continue;
          }
          
          const newQuantity = (ingredient.quantity || 0) + item.quantity;
          
          const { error: updateIngError } = await supabase
            .from('ingredients')
            .update({ 
              quantity: newQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('ingredient_id', item.ingredient_id);
          
          if (updateIngError) {
            console.error('Error updating ingredient quantity:', updateIngError);
          }
        }
      }
      
      // Fetch the complete updated purchase order
      const completePurchase = await getPurchaseOrder(id);
      
      // Update local state
      setPurchaseOrders(prev => prev.map(p => 
        p.purchase_id === Number(id) ? completePurchase : p
      ));
      
      toast.success('Purchase order updated successfully');
      return completePurchase;
    } catch (err) {
      console.error(`Error updating purchase order with ID ${id}:`, err);
      setError(`Failed to update purchase order with ID ${id}`);
      toast.error(`Failed to update purchase order: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getPurchaseOrder]);

  /**
   * Delete a purchase order
   * @param {number|string} id - Purchase order ID
   * @returns {boolean} Success status
   */
  const deletePurchaseOrder = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if purchase order is already completed
      const { data: purchase, error: checkError } = await supabase
        .from('purchases')
        .select('status')
        .eq('purchase_id', id)
        .single();
      
      if (checkError) throw checkError;
      
      if (purchase.status === 'completed') {
        throw new Error('Cannot delete a completed purchase order');
      }
      
      // Delete purchase details first (foreign key constraint)
      const { error: detailsDeleteError } = await supabase
        .from('purchase_details')
        .delete()
        .eq('purchase_id', id);
      
      if (detailsDeleteError) throw detailsDeleteError;
      
      // Delete purchase header
      const { error: deleteError } = await supabase
        .from('purchases')
        .delete()
        .eq('purchase_id', id);
      
      if (deleteError) throw deleteError;
      
      // Update local state
      setPurchaseOrders(prev => prev.filter(p => p.purchase_id !== Number(id)));
      
      toast.success('Purchase order deleted successfully');
      return true;
    } catch (err) {
      console.error(`Error deleting purchase order with ID ${id}:`, err);
      setError(`Failed to delete purchase order with ID ${id}`);
      toast.error(`Failed to delete purchase order: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mark a purchase order as received/completed
   * @param {number|string} id - Purchase order ID
   * @param {string} managerId - Manager approving receipt
   * @param {boolean} updateInventory - Whether to update inventory quantities
   * @returns {Object} Updated purchase order
   */
  const markPurchaseReceived = useCallback(async (id, managerId, updateInventory = true) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get purchase order with items
      const purchase = await getPurchaseOrder(id);
      
      if (purchase.status === 'completed') {
        throw new Error('This purchase order is already marked as received');
      }
      
      // Update purchase status to completed
      const { data: updatedPurchase, error: updateError } = await supabase
        .from('purchases')
        .update({ 
          status: 'completed', 
          manager_id: managerId,
          updated_at: new Date().toISOString() 
        })
        .eq('purchase_id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      // Update inventory quantities if flag is set
      if (updateInventory && purchase.items) {
        for (const item of purchase.items) {
          const { data: ingredient, error: getError } = await supabase
            .from('ingredients')
            .select('quantity')
            .eq('ingredient_id', item.ingredient_id)
            .single();
          
          if (getError) {
            console.error('Error fetching ingredient quantity:', getError);
            continue;
          }
          
          const newQuantity = (ingredient.quantity || 0) + item.quantity;
          
          const { error: updateIngError } = await supabase
            .from('ingredients')
            .update({ 
              quantity: newQuantity,
              last_restock_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('ingredient_id', item.ingredient_id);
          
          if (updateIngError) {
            console.error('Error updating ingredient quantity:', updateIngError);
          }
        }
      }
      
      // Fetch the complete updated purchase order
      const completePurchase = await getPurchaseOrder(id);
      
      // Update local state
      setPurchaseOrders(prev => prev.map(p => 
        p.purchase_id === Number(id) ? completePurchase : p
      ));
      
      toast.success('Purchase order marked as received');
      return completePurchase;
    } catch (err) {
      console.error(`Error marking purchase order ${id} as received:`, err);
      setError(`Failed to mark purchase order as received`);
      toast.error(`Failed to mark as received: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getPurchaseOrder]);

  return {
    suppliers,
    loading,
    error,
    fetchSuppliers,
    getSupplierById,
    getSupplier,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    
    // Consignment operations
    consignments,
    fetchConsignments,
    getConsignment,
    createConsignment,
    updateConsignment,
    deleteConsignment,
    
    // Purchase order operations
    purchaseOrders,
    fetchPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    markPurchaseReceived
  };
};

export default useSuppliers;