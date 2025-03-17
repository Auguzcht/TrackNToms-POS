import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [consignments, setConsignments] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/suppliers');
      console.log('Suppliers fetched:', response.data);
      setSuppliers(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to fetch suppliers');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get supplier by ID
  const getSupplierById = useCallback(async (id) => {
    console.log(`getSupplierById called with ID: ${id} (type: ${typeof id})`);
    
    if (id === null || id === undefined) {
      console.error("getSupplierById received null/undefined ID");
      throw new Error("Invalid supplier ID (null or undefined)");
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/suppliers/${id}`);
      console.log("Found supplier:", response.data);
      return response.data;
    } catch (err) {
      console.error(`Error fetching supplier with ID ${id}:`, err);
      setError(`Failed to fetch supplier with ID ${id}`);
      toast.error('Failed to load supplier details');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Alias for getSupplierById to maintain compatibility with SupplierForm
  const getSupplier = getSupplierById;

  // Create supplier
  const createSupplier = useCallback(async (supplierData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/suppliers', supplierData);
      
      setSuppliers(prev => [...prev, response.data]);
      toast.success(`Supplier ${supplierData.supplier_name} created successfully`);
      return response.data;
    } catch (err) {
      console.error('Error creating supplier:', err);
      setError('Failed to create supplier');
      toast.error('Failed to create supplier');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update supplier
  const updateSupplier = useCallback(async (id, supplierData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/suppliers/${id}`, supplierData);
      
      setSuppliers(prev => prev.map(s => 
        s.supplier_id === Number(id) ? response.data : s
      ));
      
      toast.success(`Supplier ${supplierData.supplier_name} updated successfully`);
      return response.data;
    } catch (err) {
      console.error(`Error updating supplier with ID ${id}:`, err);
      setError(`Failed to update supplier with ID ${id}`);
      toast.error('Failed to update supplier');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete supplier
  const deleteSupplier = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/suppliers/${id}`);
      
      setSuppliers(prev => prev.filter(s => s.supplier_id !== Number(id)));
      toast.success('Supplier deleted successfully');
      return true;
    } catch (err) {
      console.error(`Error deleting supplier with ID ${id}:`, err);
      setError(`Failed to delete supplier with ID ${id}`);
      toast.error('Failed to delete supplier');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch consignments
  const fetchConsignments = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/consignments', { params });
      console.log('Consignments fetched:', response.data);
      setConsignments(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching consignments:', err);
      setError('Failed to fetch consignments');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get consignment by ID
  const getConsignment = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/consignments/${id}`);
      return response.data;
    } catch (err) {
      console.error(`Error fetching consignment with ID ${id}:`, err);
      setError(`Failed to fetch consignment with ID ${id}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create consignment
  const createConsignment = useCallback(async (consignmentData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/consignments', consignmentData);
      
      setConsignments(prev => [response.data, ...prev]);
      toast.success('Consignment created successfully');
      return response.data;
    } catch (err) {
      console.error('Error creating consignment:', err);
      setError('Failed to create consignment');
      toast.error('Failed to create consignment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update consignment
  const updateConsignment = useCallback(async (id, consignmentData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/consignments/${id}`, consignmentData);
      
      setConsignments(prev => prev.map(c => 
        c.consignment_id === Number(id) ? response.data : c
      ));
      
      toast.success('Consignment updated successfully');
      return response.data;
    } catch (err) {
      console.error(`Error updating consignment with ID ${id}:`, err);
      setError(`Failed to update consignment with ID ${id}`);
      toast.error('Failed to update consignment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete consignment
  const deleteConsignment = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/consignments/${id}`);
      
      setConsignments(prev => prev.filter(c => c.consignment_id !== Number(id)));
      toast.success('Consignment deleted successfully');
      return true;
    } catch (err) {
      console.error(`Error deleting consignment with ID ${id}:`, err);
      setError(`Failed to delete consignment with ID ${id}`);
      toast.error('Failed to delete consignment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch purchase orders
  const fetchPurchaseOrders = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/purchases', { params });
      console.log('Purchase orders fetched:', response.data);
      setPurchaseOrders(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError('Failed to fetch purchase orders');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get purchase order by ID
  const getPurchaseOrder = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/purchases/${id}`);
      return response.data;
    } catch (err) {
      console.error(`Error fetching purchase order with ID ${id}:`, err);
      setError(`Failed to fetch purchase order with ID ${id}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create purchase order
  const createPurchaseOrder = useCallback(async (purchaseData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/purchases', purchaseData);
      
      setPurchaseOrders(prev => [response.data, ...prev]);
      toast.success('Purchase order created successfully');
      return response.data;
    } catch (err) {
      console.error('Error creating purchase order:', err);
      setError('Failed to create purchase order');
      toast.error('Failed to create purchase order');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update purchase order
  const updatePurchaseOrder = useCallback(async (id, purchaseData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/purchases/${id}`, purchaseData);
      
      setPurchaseOrders(prev => prev.map(p => 
        p.purchase_id === Number(id) ? response.data : p
      ));
      
      toast.success('Purchase order updated successfully');
      return response.data;
    } catch (err) {
      console.error(`Error updating purchase order with ID ${id}:`, err);
      setError(`Failed to update purchase order with ID ${id}`);
      toast.error('Failed to update purchase order');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete purchase order
  const deletePurchaseOrder = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/purchases/${id}`);
      
      setPurchaseOrders(prev => prev.filter(p => p.purchase_id !== Number(id)));
      toast.success('Purchase order deleted successfully');
      return true;
    } catch (err) {
      console.error(`Error deleting purchase order with ID ${id}:`, err);
      setError(`Failed to delete purchase order with ID ${id}`);
      toast.error('Failed to delete purchase order');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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
    deletePurchaseOrder
  };
};

export default useSuppliers;