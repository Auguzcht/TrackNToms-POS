import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

export const useInventory = () => {
  const [ingredients, setIngredients] = useState([]);
  const [items, setItems] = useState([]);
  const [pullouts, setPullouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  
  // Fetch ingredients
  const fetchIngredients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Remove /api from path since it's already in the base URL
      const response = await api.get('/inventory/ingredients');
      console.log('Ingredients response:', response.data);
      setIngredients(response.data);
      return response.data;
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
      // Remove /api from path since it's already in the base URL
      const response = await api.get('/inventory/items');
      console.log('Items response:', response.data);
      setItems(response.data);
      return response.data;
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
      // Remove /api from path since it's already in the base URL
      const response = await api.get('/inventory/pullouts');
      setPullouts(response.data);
      return response.data;
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
      const response = await api.post('/inventory/ingredients', ingredientData);
      const newIngredient = response.data;
      
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
      const response = await api.put(`/inventory/ingredients/${id}`, ingredientData);
      const updatedIngredient = response.data;
      
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
      await api.delete(`/inventory/ingredients/${id}`);
      
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
      const response = await api.post('/inventory/items', itemData);
      const newItem = response.data;
      
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
      const response = await api.put(`/inventory/items/${id}`, itemData);
      const updatedItem = response.data;
      
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
      await api.delete(`/inventory/items/${id}`);
      
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
      const response = await api.post('/inventory/pullouts', pulloutData);
      const newPullout = response.data;
      
      setPullouts(prev => [...prev, newPullout]);
      
      // Backend should handle ingredient quantity updates
      // Refresh ingredients to get updated quantities
      await fetchIngredients();
      
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
  }, [fetchIngredients]);

  // Update a pullout record
  const updatePullout = useCallback(async (id, pulloutData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put(`/inventory/pullouts/${id}`, pulloutData);
      const updatedPullout = response.data;
      
      setPullouts(prev => prev.map(p => p.pullout_id === id ? updatedPullout : p));
      
      // Refresh ingredients to get updated quantities
      await fetchIngredients();
      
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
  }, [fetchIngredients]);

  // Delete a pullout record
  const deletePullout = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.delete(`/inventory/pullouts/${id}`);
      
      setPullouts(prev => prev.filter(p => p.pullout_id !== id));
      
      // Refresh ingredients to get updated quantities
      await fetchIngredients();
      
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
  }, [fetchIngredients]);

  // Approve a pullout record
  const approvePullout = useCallback(async (id, managerId, managerName) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.patch(`/inventory/pullouts/${id}/approve`, {
        manager_id: managerId
      });
      
      const approvedPullout = response.data;
      
      setPullouts(prev => prev.map(p => p.pullout_id === id ? approvedPullout : p));
      
      // Refresh ingredients since approval might affect quantities
      await fetchIngredients();
      
      toast.success('Pullout record approved successfully!');
      return approvedPullout;
    } catch (err) {
      console.error(`Error approving pullout with ID ${id}:`, err);
      setError(`Failed to approve pullout with ID ${id}`);
      toast.error('Failed to approve pullout record');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchIngredients]);

  // Reject a pullout record
  const rejectPullout = useCallback(async (id, managerId, managerName, reason) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.patch(`/inventory/pullouts/${id}/reject`, {
        manager_id: managerId,
        reason: reason
      });
      
      const rejectedPullout = response.data;
      
      setPullouts(prev => prev.map(p => p.pullout_id === id ? rejectedPullout : p));
      
      toast.success('Pullout record rejected successfully!');
      return rejectedPullout;
    } catch (err) {
      console.error(`Error rejecting pullout with ID ${id}:`, err);
      setError(`Failed to reject pullout with ID ${id}`);
      toast.error('Failed to reject pullout record');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get a specific pullout record
  const getPullout = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      // First check if we already have it in state
      let pullout = pullouts.find(p => p.pullout_id === parseInt(id));
      
      // If not, fetch it from the API
      if (!pullout) {
        const response = await api.get(`/inventory/pullouts/${id}`);
        pullout = response.data;
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

  // Fetch item ingredients
  const fetchItemIngredients = useCallback(async (itemId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/inventory/items/${itemId}/ingredients`);
      return response.data;
    } catch (err) {
      console.error('Error fetching item ingredients:', err);
      setError('Failed to fetch item ingredients');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update item ingredients
  const updateItemIngredients = useCallback(async (itemId, ingredients) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/inventory/items/${itemId}/ingredients`, {
        ingredients
      });
      return response.data;
    } catch (err) {
      console.error('Error updating item ingredients:', err);
      setError('Failed to update item ingredients');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check ingredient availability
  const checkIngredientAvailability = useCallback(async (itemId, quantity = 1) => {
    try {
      const response = await api.get(`/inventory/items/${itemId}/ingredients/availability`, {
        params: { quantity }
      });
      return response.data;
    } catch (err) {
      console.error('Error checking ingredient availability:', err);
      throw err;
    }
  }, []);

  // Deduct ingredients for sale
  const deductIngredientsForSale = useCallback(async (items) => {
    try {
      const response = await api.post('/inventory/deduct-ingredients', { items });
      
      // Update local ingredient quantities
      setIngredients(prev => {
        const newIngredients = [...prev];
        response.data.deductions.forEach(deduction => {
          const ingredient = newIngredients.find(i => i.ingredient_id === deduction.ingredient_id);
          if (ingredient) {
            ingredient.quantity -= deduction.quantity;
            
            // Check if we need to show low stock warning
            if (ingredient.quantity <= ingredient.minimum_quantity) {
              toast.warning(`Low stock alert: ${ingredient.name}`);
            }
          }
        });
        return newIngredients;
      });

      return response.data;
    } catch (err) {
      console.error('Error deducting ingredients:', err);
      toast.error('Failed to update inventory');
      throw err;
    }
  }, []);

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
    getPullout,
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
    rejectPullout,
    fetchItemIngredients,
    updateItemIngredients,
    checkIngredientAvailability,
    deductIngredientsForSale,
    recipeIngredients
  };
};

export default useInventory;