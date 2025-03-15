import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export const useInventory = () => {
  const [ingredients, setIngredients] = useState([]);
  const [items, setItems] = useState([]);
  const [pullouts, setPullouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Mock data for ingredients
  const mockIngredients = [
    {
      ingredient_id: 1,
      name: 'Coffee Beans - Arabica',
      description: 'Premium arabica coffee beans',
      quantity: 25.5,
      unit: 'kg',
      cost_per_unit: 15.99,
      minimum_stock_level: 10,
      maximum_stock_level: 50,
      last_restock_date: '2023-11-10',
      image: null
    },
    {
      ingredient_id: 2,
      name: 'Milk',
      description: 'Fresh whole milk',
      quantity: 45,
      unit: 'L',
      cost_per_unit: 2.49,
      minimum_stock_level: 20,
      maximum_stock_level: 60,
      last_restock_date: '2023-11-15',
      image: null
    },
    {
      ingredient_id: 3,
      name: 'Chocolate Syrup',
      description: 'Premium chocolate flavoring syrup',
      quantity: 12,
      unit: 'bottles',
      cost_per_unit: 8.99,
      minimum_stock_level: 5,
      maximum_stock_level: 20,
      last_restock_date: '2023-11-05',
      image: null
    },
    {
      ingredient_id: 4,
      name: 'Vanilla Extract',
      description: 'Pure vanilla extract',
      quantity: 8,
      unit: 'bottles',
      cost_per_unit: 12.50,
      minimum_stock_level: 3,
      maximum_stock_level: 15,
      last_restock_date: '2023-11-08',
      image: null
    }
  ];
  
  // Mock data for items (products)
  const mockItems = [
    {
      item_id: 1,
      item_name: 'Americano',
      description: 'Classic espresso with hot water',
      category_id: 1,
      price: 3.99,
      cost: 1.50,
      status: 'active',
      image: null
    },
    {
      item_id: 2,
      item_name: 'Cappuccino',
      description: 'Espresso with steamed milk and foam',
      category_id: 1,
      price: 4.99,
      cost: 2.00,
      status: 'active',
      image: null
    },
    {
      item_id: 3,
      item_name: 'Chocolate Cake',
      description: 'Rich chocolate cake slice',
      category_id: 2,
      price: 5.99,
      cost: 2.50,
      status: 'active',
      image: null
    }
  ];

  // Mock data for pullouts
  const mockPullouts = [
    {
      pullout_id: 1,
      ingredient_id: 1,
      quantity: 2.5,
      unit: 'kg',
      reason: 'Expired beans',
      date_of_pullout: '2023-11-12',
      staff_id: 1,
      staffName: 'John Doe',
      manager_id: 2,
      managerName: 'Jane Smith',
      status: 'approved',
      ingredientName: 'Coffee Beans - Arabica'
    },
    {
      pullout_id: 2,
      ingredient_id: 2,
      quantity: 5,
      unit: 'L',
      reason: 'Spoiled milk',
      date_of_pullout: '2023-11-14',
      staff_id: 1,
      staffName: 'John Doe',
      manager_id: null,
      managerName: null,
      status: 'pending',
      ingredientName: 'Milk'
    },
    {
      pullout_id: 3,
      ingredient_id: 3,
      quantity: 1,
      unit: 'bottles',
      reason: 'Quality check failed',
      date_of_pullout: '2023-11-16',
      staff_id: 3,
      staffName: 'Alice Johnson',
      manager_id: 2,
      managerName: 'Jane Smith',
      status: 'approved',
      ingredientName: 'Chocolate Syrup'
    }
  ];

  // Fetch ingredients
  const fetchIngredients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setIngredients(mockIngredients);
      return mockIngredients;
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setError('Failed to fetch ingredients');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setItems(mockItems);
      return mockItems;
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to fetch items');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch pullouts
  const fetchPullouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setPullouts(mockPullouts);
      return mockPullouts;
    } catch (err) {
      console.error('Error fetching pullouts:', err);
      setError('Failed to fetch pullouts');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch inventory (all data)
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, you'd have API calls here
      // Fetch everything in parallel
      await Promise.all([
        fetchIngredients(),
        fetchItems(),
        fetchPullouts()
      ]);
      
      return { ingredients, items, pullouts };
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err.message || 'Failed to fetch inventory');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchIngredients, fetchItems, fetchPullouts]);

  // Add a new ingredient
  const addIngredient = useCallback(async (ingredientData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock API call
      const newIngredient = {
        ingredient_id: Date.now(),
        ...ingredientData,
        last_restock_date: new Date().toISOString().split('T')[0]
      };
      
      setIngredients(prev => [...prev, newIngredient]);
      toast.success(`Ingredient ${ingredientData.name} added successfully!`);
      return newIngredient;
    } catch (err) {
      console.error('Error adding ingredient:', err);
      setError('Failed to add ingredient');
      toast.error('Failed to add ingredient');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an ingredient
  const updateIngredient = useCallback(async (id, ingredientData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock API call
      const updatedIngredient = { ingredient_id: id, ...ingredientData };
      
      setIngredients(prev => 
        prev.map(ingredient => ingredient.ingredient_id === id ? updatedIngredient : ingredient)
      );
      
      toast.success(`Ingredient ${ingredientData.name} updated successfully!`);
      return updatedIngredient;
    } catch (err) {
      console.error(`Error updating ingredient with ID ${id}:`, err);
      setError(`Failed to update ingredient with ID ${id}`);
      toast.error('Failed to update ingredient');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete an ingredient
  const deleteIngredient = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock API call
      setIngredients(prev => 
        prev.filter(ingredient => ingredient.ingredient_id !== id)
      );
      
      toast.success('Ingredient deleted successfully!');
      return true;
    } catch (err) {
      console.error(`Error deleting ingredient with ID ${id}:`, err);
      setError(`Failed to delete ingredient with ID ${id}`);
      toast.error('Failed to delete ingredient');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new item/product
  const addItem = useCallback(async (itemData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock API call
      const newItem = {
        item_id: Date.now(),
        ...itemData
      };
      
      setItems(prev => [...prev, newItem]);
      toast.success(`Item ${itemData.item_name} added successfully!`);
      return newItem;
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Failed to add item');
      toast.error('Failed to add item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an item/product
  const updateItem = useCallback(async (id, itemData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock API call
      const updatedItem = { item_id: id, ...itemData };
      
      setItems(prev => 
        prev.map(item => item.item_id === id ? updatedItem : item)
      );
      
      toast.success(`Item ${itemData.item_name} updated successfully!`);
      return updatedItem;
    } catch (err) {
      console.error(`Error updating item with ID ${id}:`, err);
      setError(`Failed to update item with ID ${id}`);
      toast.error('Failed to update item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete an item/product
  const deleteItem = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock API call
      setItems(prev => 
        prev.filter(item => item.item_id !== id)
      );
      
      toast.success('Item deleted successfully!');
      return true;
    } catch (err) {
      console.error(`Error deleting item with ID ${id}:`, err);
      setError(`Failed to delete item with ID ${id}`);
      toast.error('Failed to delete item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new pullout record
  const createPullout = useCallback(async (pulloutData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get ingredient name
      const ingredient = ingredients.find(ing => ing.ingredient_id === pulloutData.ingredient_id);
      
      // Mock API call
      const newPullout = {
        pullout_id: Date.now(),
        ...pulloutData,
        date_of_pullout: new Date().toISOString().split('T')[0],
        status: pulloutData.manager_id ? 'approved' : 'pending',
        ingredientName: ingredient ? ingredient.name : 'Unknown Ingredient'
      };
      
      setPullouts(prev => [...prev, newPullout]);
      
      // Update ingredient quantity
      if (ingredient) {
        const updatedIngredient = {
          ...ingredient,
          quantity: Math.max(0, ingredient.quantity - pulloutData.quantity)
        };
        
        setIngredients(prev => 
          prev.map(ing => ing.ingredient_id === pulloutData.ingredient_id ? updatedIngredient : ing)
        );
      }
      
      toast.success('Pullout record created successfully!');
      return newPullout;
    } catch (err) {
      console.error('Error creating pullout:', err);
      setError('Failed to create pullout record');
      toast.error('Failed to create pullout record');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ingredients]);

  // Update a pullout record
  const updatePullout = useCallback(async (id, pulloutData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Find original pullout to calculate quantity difference
      const originalPullout = pullouts.find(p => p.pullout_id === id);
      if (!originalPullout) {
        throw new Error('Pullout record not found');
      }
      
      // Get ingredient
      const ingredient = ingredients.find(ing => ing.ingredient_id === pulloutData.ingredient_id);
      
      // Calculate quantity difference
      const quantityDifference = pulloutData.quantity - originalPullout.quantity;
      
      // Mock API call
      const updatedPullout = {
        pullout_id: id,
        ...pulloutData,
        status: pulloutData.manager_id ? 'approved' : 'pending',
        ingredientName: ingredient ? ingredient.name : originalPullout.ingredientName
      };
      
      setPullouts(prev => prev.map(p => p.pullout_id === id ? updatedPullout : p));
      
      // Update ingredient quantity if there's a difference
      if (ingredient && quantityDifference !== 0) {
        const updatedIngredient = {
          ...ingredient,
          quantity: Math.max(0, ingredient.quantity - quantityDifference)
        };
        
        setIngredients(prev => 
          prev.map(ing => ing.ingredient_id === pulloutData.ingredient_id ? updatedIngredient : ing)
        );
      }
      
      toast.success('Pullout record updated successfully!');
      return updatedPullout;
    } catch (err) {
      console.error(`Error updating pullout with ID ${id}:`, err);
      setError(`Failed to update pullout with ID ${id}`);
      toast.error('Failed to update pullout record');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ingredients, pullouts]);

  // Delete a pullout record
  const deletePullout = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      // Find the pullout to be deleted
      const pulloutToDelete = pullouts.find(p => p.pullout_id === id);
      if (!pulloutToDelete) {
        throw new Error('Pullout record not found');
      }
      
      // Mock API call
      setPullouts(prev => prev.filter(p => p.pullout_id !== id));
      
      // If pullout was approved, restore the ingredient quantity
      if (pulloutToDelete.status === 'approved') {
        const ingredient = ingredients.find(ing => ing.ingredient_id === pulloutToDelete.ingredient_id);
        if (ingredient) {
          const updatedIngredient = {
            ...ingredient,
            quantity: ingredient.quantity + pulloutToDelete.quantity
          };
          
          setIngredients(prev => 
            prev.map(ing => ing.ingredient_id === pulloutToDelete.ingredient_id ? updatedIngredient : ing)
          );
        }
      }
      
      toast.success('Pullout record deleted successfully!');
      return true;
    } catch (err) {
      console.error(`Error deleting pullout with ID ${id}:`, err);
      setError(`Failed to delete pullout with ID ${id}`);
      toast.error('Failed to delete pullout record');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ingredients, pullouts]);

  // Approve a pullout record
  const approvePullout = useCallback(async (id, managerId, managerName) => {
    setLoading(true);
    setError(null);
    
    try {
      // Find the pullout to be approved
      const pullout = pullouts.find(p => p.pullout_id === id);
      if (!pullout) {
        throw new Error('Pullout record not found');
      }
      
      // Mock API call
      const updatedPullout = {
        ...pullout,
        status: 'approved',
        manager_id: managerId,
        managerName: managerName
      };
      
      setPullouts(prev => prev.map(p => p.pullout_id === id ? updatedPullout : p));
      
      toast.success('Pullout record approved successfully!');
      return updatedPullout;
    } catch (err) {
      console.error(`Error approving pullout with ID ${id}:`, err);
      setError(`Failed to approve pullout with ID ${id}`);
      toast.error('Failed to approve pullout record');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pullouts]);

  // Reject a pullout record
  const rejectPullout = useCallback(async (id, managerId, managerName, reason) => {
    setLoading(true);
    setError(null);
    
    try {
      // Find the pullout to be rejected
      const pullout = pullouts.find(p => p.pullout_id === id);
      if (!pullout) {
        throw new Error('Pullout record not found');
      }
      
      // Mock API call
      const updatedPullout = {
        ...pullout,
        status: 'rejected',
        manager_id: managerId,
        managerName: managerName,
        rejectionReason: reason
      };
      
      setPullouts(prev => prev.map(p => p.pullout_id === id ? updatedPullout : p));
      
      // Restore the ingredient quantity since the pullout was rejected
      const ingredient = ingredients.find(ing => ing.ingredient_id === pullout.ingredient_id);
      if (ingredient && pullout.status === 'approved') {
        const updatedIngredient = {
          ...ingredient,
          quantity: ingredient.quantity + pullout.quantity
        };
        
        setIngredients(prev => 
          prev.map(ing => ing.ingredient_id === pullout.ingredient_id ? updatedIngredient : ing)
        );
      }
      
      toast.success('Pullout record rejected successfully!');
      return updatedPullout;
    } catch (err) {
      console.error(`Error rejecting pullout with ID ${id}:`, err);
      setError(`Failed to reject pullout with ID ${id}`);
      toast.error('Failed to reject pullout record');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ingredients, pullouts]);

  // Add the getPullout function to the useInventory hook
  const getPullout = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      // Find the pullout in the existing state first
      let pullout = pullouts.find(p => p.pullout_id === parseInt(id));
      
      if (!pullout) {
        // If not in state (perhaps page was refreshed), simulate API fetch
        // In a real app, you'd make an API call here
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
        
        // Use mock data if no actual data exists
        pullout = mockPullouts.find(p => p.pullout_id === parseInt(id));
        
        if (!pullout) {
          throw new Error(`Pullout with ID ${id} not found`);
        }
      }
      
      return pullout;
    } catch (err) {
      console.error(`Error fetching pullout with ID ${id}:`, err);
      setError(`Failed to fetch pullout with ID ${id}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pullouts]);

  return {
    ingredients,
    items,
    pullouts,
    loading,
    error,
    fetchInventory,
    fetchIngredients,
    fetchItems,
    fetchPullouts,
    getPullout,        // Add this line
    addIngredient,
    updateIngredient,
    deleteIngredient,
    addItem,
    updateItem,
    deleteItem,
    createPullout,
    updatePullout,
    deletePullout,
    approvePullout,
    rejectPullout
  };
};

export default useInventory;