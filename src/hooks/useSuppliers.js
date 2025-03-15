import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock data for suppliers
  const mockSuppliers = [
    {
      id: 1,
      supplier_id: 1,
      supplier_name: 'Coffee Beans Co.',
      supplier_contact: '+1 (555) 123-4567',
      supplier_email: 'contact@coffeebeans.com',
      contact_person: 'John Bean',
      address: '123 Roast Avenue',
      city: 'Seattle',
      state: 'WA',
      postal_code: '98101',
      country: 'USA',
      website: 'https://coffeebeans.com',
      payment_terms: 'Net 30',
      notes: 'Premium coffee bean supplier',
      is_active: true,
      logo: null
    },
    {
      id: 2,
      supplier_id: 2,
      supplier_name: 'Milk & Dairy Supplies',
      supplier_contact: '+1 (555) 987-6543',
      supplier_email: 'orders@milkanddairy.com',
      contact_person: 'Sarah Cream',
      address: '456 Dairy Lane',
      city: 'Portland',
      state: 'OR',
      postal_code: '97201',
      country: 'USA',
      website: 'https://milkanddairy.com',
      payment_terms: 'Net 15',
      notes: 'Fresh dairy products supplier',
      is_active: true,
      logo: null
    },
    {
      id: 3,
      supplier_id: 3,
      supplier_name: 'Sweet Treats Bakery',
      supplier_contact: '+1 (555) 456-7890',
      supplier_email: 'info@sweettreatsbakery.com',
      contact_person: 'Michael Sugar',
      address: '789 Dessert Street',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94103',
      country: 'USA',
      website: 'https://sweettreatsbakery.com',
      payment_terms: 'COD',
      notes: 'Pastries and desserts supplier',
      is_active: true,
      logo: null
    }
  ];

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setSuppliers(mockSuppliers);
      return mockSuppliers;
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to fetch suppliers');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Update the getSupplierById function with better debugging:
  const getSupplierById = useCallback(async (id) => {
    console.log(`getSupplierById called with ID: ${id} (type: ${typeof id})`);
    
    if (id === null || id === undefined) {
      console.error("getSupplierById received null/undefined ID");
      throw new Error("Invalid supplier ID (null or undefined)");
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Convert ID to number for comparison
      const numericId = Number(id);
      console.log(`Looking for supplier with numeric ID: ${numericId}`);
      
      // Debug the available suppliers
      console.log("Available suppliers:", mockSuppliers.map(s => ({id: s.id, supplier_id: s.supplier_id})));
      
      // Find supplier by either id or supplier_id
      const supplier = mockSuppliers.find(s => 
        s.id === numericId || s.supplier_id === numericId
      );
      
      if (!supplier) {
        console.error(`No supplier found with ID ${id}`);
        throw new Error(`Supplier with ID ${id} not found`);
      }
      
      console.log("Found supplier:", supplier);
      return supplier;
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 700));
      
      const newSupplier = {
        id: Date.now(),
        supplier_id: Date.now(),
        ...supplierData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setSuppliers(prev => [...prev, newSupplier]);
      toast.success(`Supplier ${supplierData.supplier_name} created successfully`);
      return newSupplier;
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 700));
      
      const updatedSupplier = {
        id: Number(id),
        supplier_id: Number(id),
        ...supplierData,
        updated_at: new Date().toISOString()
      };
      
      setSuppliers(prev => prev.map(s => 
        s.id === Number(id) ? updatedSupplier : s
      ));
      
      toast.success(`Supplier ${supplierData.supplier_name} updated successfully`);
      return updatedSupplier;
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSuppliers(prev => prev.filter(s => s.id !== Number(id)));
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

  // Mock consignment management
  const [consignments, setConsignments] = useState([]);
  
  const fetchConsignments = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const mockConsignments = [
        {
          id: 1,
          invoiceNumber: 'INV-2023-0001',
          referenceNumber: 'REF-001',
          supplierId: 1,
          consignmentDate: '2023-08-15',
          receivedBy: 'Manager 1',
          status: 'Completed',
          items: [
            { id: 1, itemName: 'Coffee Beans (Arabica)', quantity: 25, unitPrice: 20, subtotal: 500 },
            { id: 2, itemName: 'Coffee Beans (Robusta)', quantity: 15, unitPrice: 18, subtotal: 270 }
          ]
        },
        {
          id: 2,
          invoiceNumber: 'INV-2023-0002',
          referenceNumber: 'REF-002',
          supplierId: 2,
          consignmentDate: '2023-09-05',
          receivedBy: 'Manager 1',
          status: 'Completed',
          items: [
            { id: 1, itemName: 'Fresh Milk', quantity: 50, unitPrice: 5, subtotal: 250 },
            { id: 2, itemName: 'Cream', quantity: 30, unitPrice: 8, subtotal: 240 }
          ]
        }
      ];
      
      setConsignments(mockConsignments);
      return mockConsignments;
    } catch (err) {
      console.error('Error fetching consignments:', err);
      setError('Failed to fetch consignments');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create consignment
  const createConsignment = useCallback(async (consignmentData) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newConsignment = {
        id: Date.now(),
        ...consignmentData,
        createdAt: new Date().toISOString()
      };
      
      setConsignments(prev => [newConsignment, ...prev]);
      toast.success('Consignment created successfully');
      return newConsignment;
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const updatedConsignment = {
        id: Number(id),
        ...consignmentData,
        updatedAt: new Date().toISOString()
      };
      
      setConsignments(prev => prev.map(c => 
        c.id === Number(id) ? updatedConsignment : c
      ));
      
      toast.success('Consignment updated successfully');
      return updatedConsignment;
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setConsignments(prev => prev.filter(c => c.id !== Number(id)));
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

  return {
    suppliers,
    loading,
    error,
    fetchSuppliers,
    getSupplierById,
    getSupplier, // Add this alias to fix the error
    createSupplier,
    updateSupplier,
    deleteSupplier,
    
    // Consignment operations
    consignments,
    fetchConsignments,
    createConsignment,
    updateConsignment,
    deleteConsignment
  };
};

export default useSuppliers;