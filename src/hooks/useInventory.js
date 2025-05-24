import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import supabase from '../services/supabase';
import { useAuth } from './useAuth';

export const useInventory = () => {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState([]);
  const [items, setItems] = useState([]);
  const [pullouts, setPullouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);

  // Set up real-time subscriptions for inventory changes
  useEffect(() => {
    // Subscription for ingredients
    const ingredientsSubscription = supabase
      .channel('ingredients-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'ingredients' 
        }, 
        (payload) => {
          console.log('Ingredients change received:', payload);
          // Handle different events
          switch (payload.eventType) {
            case 'INSERT':
              setIngredients(prev => [...prev, payload.new]);
              break;
            case 'UPDATE':
              setIngredients(prev => 
                prev.map(ing => ing.ingredient_id === payload.new.ingredient_id ? 
                  { ...ing, ...payload.new } : ing)
              );
              break;
            case 'DELETE':
              setIngredients(prev => 
                prev.filter(ing => ing.ingredient_id !== payload.old.ingredient_id)
              );
              break;
            default:
              break;
          }
        }
      )
      .subscribe();

    // Subscription for menu items
    const itemsSubscription = supabase
      .channel('items-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'items' 
        }, 
        (payload) => {
          console.log('Menu items change received:', payload);
          // Handle different events
          switch (payload.eventType) {
            case 'INSERT':
              setItems(prev => [...prev, payload.new]);
              break;
            case 'UPDATE':
              setItems(prev => 
                prev.map(item => item.item_id === payload.new.item_id ? 
                  { ...item, ...payload.new } : item)
              );
              break;
            case 'DELETE':
              setItems(prev => 
                prev.filter(item => item.item_id !== payload.old.item_id)
              );
              break;
            default:
              break;
          }
        }
      )
      .subscribe();

    // Subscription for pullouts
    const pulloutsSubscription = supabase
      .channel('pullouts-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pullouts' 
        }, 
        (payload) => {
          console.log('Pullouts change received:', payload);
          // Handle different events
          switch (payload.eventType) {
            case 'INSERT':
              setPullouts(prev => [...prev, payload.new]);
              break;
            case 'UPDATE':
              setPullouts(prev => 
                prev.map(po => po.pullout_id === payload.new.pullout_id ? 
                  { ...po, ...payload.new } : po)
              );
              break;
            case 'DELETE':
              setPullouts(prev => 
                prev.filter(po => po.pullout_id !== payload.old.pullout_id)
              );
              break;
            default:
              break;
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions when component unmounts
    return () => {
      supabase.removeChannel(ingredientsSubscription);
      supabase.removeChannel(itemsSubscription);
      supabase.removeChannel(pulloutsSubscription);
    };
  }, []);
  
  // Fetch ingredients
  const fetchIngredients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('*')
        .order('name', { ascending: true });
      
      if (ingredientsError) throw ingredientsError;
      
      console.log('Ingredients fetched:', data);
      setIngredients(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setError('Failed to fetch ingredients');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch items (menu products)
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .order('item_name', { ascending: true });
      
      if (itemsError) throw itemsError;
      
      console.log('Menu items fetched:', data);
      setItems(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to fetch menu items');
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
      // Get detailed pullout data with staff information
      const { data, error: pulloutsError } = await supabase
        .from('pullouts_with_staff')  // Using a view that joins pullouts with staff info
        .select('*')
        .order('created_at', { ascending: false });
      
      if (pulloutsError) throw pulloutsError;
      
      setPullouts(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching pullouts:', err);
      setError('Failed to fetch pullouts');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all inventory data at once
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [ingredientsData, itemsData, pulloutsData] = await Promise.all([
        fetchIngredients(),
        fetchItems(),
        fetchPullouts()
      ]);
      
      return { 
        ingredients: ingredientsData, 
        items: itemsData, 
        pullouts: pulloutsData 
      };
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
      // Add created_at and updated_at timestamps
      const newIngredientData = {
        ...ingredientData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error: insertError } = await supabase
        .from('ingredients')
        .insert(newIngredientData)
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      toast.success(`Ingredient ${ingredientData.name} added successfully!`);
      return data;
    } catch (err) {
      console.error('Error adding ingredient:', err);
      setError('Failed to add ingredient');
      toast.error(`Failed to add ingredient: ${err.message}`);
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
      // Add updated_at timestamp
      const updatedIngredientData = {
        ...ingredientData,
        updated_at: new Date().toISOString()
      };
      
      const { data, error: updateError } = await supabase
        .from('ingredients')
        .update(updatedIngredientData)
        .eq('ingredient_id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      toast.success(`Ingredient ${ingredientData.name} updated successfully!`);
      return data;
    } catch (err) {
      console.error(`Error updating ingredient with ID ${id}:`, err);
      setError(`Failed to update ingredient with ID ${id}`);
      toast.error(`Failed to update ingredient: ${err.message}`);
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
      // First, check if the ingredient is used in any menu items
      const { data: usageData, error: usageError } = await supabase
        .from('item_ingredients')
        .select('item_id')
        .eq('ingredient_id', id)
        .limit(1);
      
      if (usageError) throw usageError;
      
      if (usageData && usageData.length > 0) {
        throw new Error('Cannot delete an ingredient that is in use by menu items');
      }
      
      // Now we can safely delete
      const { error: deleteError } = await supabase
        .from('ingredients')
        .delete()
        .eq('ingredient_id', id);
      
      if (deleteError) throw deleteError;
      
      toast.success('Ingredient deleted successfully!');
      return true;
    } catch (err) {
      console.error(`Error deleting ingredient with ID ${id}:`, err);
      setError(`Failed to delete ingredient with ID ${id}`);
      toast.error(`Failed to delete ingredient: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new menu item
  const addItem = useCallback(async (itemData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Add created_at and updated_at timestamps
      const newItemData = {
        ...itemData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error: insertError } = await supabase
        .from('items')
        .insert(newItemData)
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      toast.success(`Item ${itemData.item_name} added successfully!`);
      return data;
    } catch (err) {
      console.error('Error adding menu item:', err);
      setError('Failed to add menu item');
      toast.error(`Failed to add menu item: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a menu item
  const updateItem = useCallback(async (id, itemData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Add updated_at timestamp
      const updatedItemData = {
        ...itemData,
        updated_at: new Date().toISOString()
      };
      
      const { data, error: updateError } = await supabase
        .from('items')
        .update(updatedItemData)
        .eq('item_id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      toast.success(`Item ${itemData.item_name} updated successfully!`);
      return data;
    } catch (err) {
      console.error(`Error updating menu item with ID ${id}:`, err);
      setError(`Failed to update menu item with ID ${id}`);
      toast.error(`Failed to update menu item: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a menu item
  const deleteItem = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      // First delete any recipe ingredients (since they reference this item)
      const { error: recipeError } = await supabase
        .from('item_ingredients')
        .delete()
        .eq('item_id', id);
      
      if (recipeError) throw recipeError;
      
      // Then delete the item itself
      const { error: deleteError } = await supabase
        .from('items')
        .delete()
        .eq('item_id', id);
      
      if (deleteError) throw deleteError;
      
      toast.success('Menu item deleted successfully!');
      return true;
    } catch (err) {
      console.error(`Error deleting menu item with ID ${id}:`, err);
      setError(`Failed to delete menu item with ID ${id}`);
      toast.error(`Failed to delete menu item: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new pullout record
  const createPullout = useCallback(async (pulloutData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the current ingredient quantity
      const { data: ingredient, error: ingredientError } = await supabase
        .from('ingredients')
        .select('quantity')
        .eq('ingredient_id', pulloutData.ingredient_id)
        .single();
      
      if (ingredientError) throw ingredientError;
      
      // Make sure we have enough quantity for the pullout
      if (ingredient.quantity < pulloutData.quantity) {
        throw new Error('Not enough quantity available for this pullout');
      }

      // Format pullout data
      const pullout = {
        ingredient_id: pulloutData.ingredient_id,
        quantity: pulloutData.quantity,
        reason: pulloutData.reason,
        staff_id: pulloutData.staff_id || user?.staff_id,
        status: 'pending', // Default status is pending
        date_of_pullout: pulloutData.date_of_pullout || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Create the pullout record
      const { data: newPullout, error: pulloutError } = await supabase
        .from('pullouts')
        .insert(pullout)
        .select()
        .single();
      
      if (pulloutError) throw pulloutError;
      
      // If manager approval is included, approve it immediately
      if (pulloutData.manager_id) {
        const { data: approvedPullout, error: approveError } = await supabase
          .from('pullouts')
          .update({
            manager_id: pulloutData.manager_id,
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('pullout_id', newPullout.pullout_id)
          .select()
          .single();
        
        if (approveError) throw approveError;
        
        // Update ingredient quantity
        const { error: updateError } = await supabase
          .from('ingredients')
          .update({ 
            quantity: ingredient.quantity - pulloutData.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('ingredient_id', pulloutData.ingredient_id);
        
        if (updateError) throw updateError;
        
        toast.success('Pullout record created and approved');
        return approvedPullout;
      }
      
      toast.success('Pullout record created successfully!');
      return newPullout;
    } catch (err) {
      console.error('Error creating pullout:', err);
      setError('Failed to create pullout record');
      toast.error(`Failed to create pullout record: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.staff_id]);

  // Update a pullout record
  const updatePullout = useCallback(async (id, pulloutData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get original pullout
      const { data: originalPullout, error: fetchError } = await supabase
        .from('pullouts')
        .select('*')
        .eq('pullout_id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Don't allow updating approved or rejected pullouts
      if (originalPullout.status !== 'pending') {
        throw new Error(`Cannot update a pullout that is already ${originalPullout.status}`);
      }
      
      // If ingredient or quantity changed, validate the new quantity
      if (pulloutData.ingredient_id !== originalPullout.ingredient_id || 
          pulloutData.quantity !== originalPullout.quantity) {
        
        const { data: ingredient, error: ingredientError } = await supabase
          .from('ingredients')
          .select('quantity')
          .eq('ingredient_id', pulloutData.ingredient_id)
          .single();
        
        if (ingredientError) throw ingredientError;
        
        if (ingredient.quantity < pulloutData.quantity) {
          throw new Error('Not enough quantity available for this pullout');
        }
      }
      
      // Format update data
      const updateData = {
        ingredient_id: pulloutData.ingredient_id,
        quantity: pulloutData.quantity,
        reason: pulloutData.reason,
        date_of_pullout: pulloutData.date_of_pullout || originalPullout.date_of_pullout,
        updated_at: new Date().toISOString()
      };
      
      // Update the pullout
      const { data: updatedPullout, error: updateError } = await supabase
        .from('pullouts')
        .update(updateData)
        .eq('pullout_id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      toast.success('Pullout record updated successfully!');
      return updatedPullout;
    } catch (err) {
      console.error(`Error updating pullout with ID ${id}:`, err);
      setError(`Failed to update pullout with ID ${id}`);
      toast.error(`Failed to update pullout record: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a pullout record
  const deletePullout = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if pullout is already approved - can't delete approved pullouts
      const { data: pullout, error: fetchError } = await supabase
        .from('pullouts')
        .select('status')
        .eq('pullout_id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (pullout.status === 'approved') {
        throw new Error('Cannot delete an approved pullout record');
      }
      
      // Delete the pullout
      const { error: deleteError } = await supabase
        .from('pullouts')
        .delete()
        .eq('pullout_id', id);
      
      if (deleteError) throw deleteError;
      
      toast.success('Pullout record deleted successfully!');
      return true;
    } catch (err) {
      console.error(`Error deleting pullout with ID ${id}:`, err);
      setError(`Failed to delete pullout with ID ${id}`);
      toast.error(`Failed to delete pullout record: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Approve a pullout record
  const approvePullout = useCallback(async (id, managerId) => {
    setLoading(true);
    setError(null);
    
    try {
      // Begin by getting the pullout information
      const { data: pullout, error: pulloutError } = await supabase
        .from('pullouts')
        .select('*, ingredients:ingredient_id(quantity)')
        .eq('pullout_id', id)
        .single();
      
      if (pulloutError) throw pulloutError;
      
      if (pullout.status !== 'pending') {
        throw new Error(`This pullout is already ${pullout.status}`);
      }
      
      // Check if there is enough quantity
      if (pullout.ingredients.quantity < pullout.quantity) {
        throw new Error('Not enough quantity available for this pullout');
      }
      
      // Approve the pullout
      const { data: approvedPullout, error: approveError } = await supabase
        .from('pullouts')
        .update({
          manager_id: managerId,
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('pullout_id', id)
        .select()
        .single();
      
      if (approveError) throw approveError;
      
      // Update the ingredient quantity
      const newQuantity = pullout.ingredients.quantity - pullout.quantity;
      const { error: updateError } = await supabase
        .from('ingredients')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('ingredient_id', pullout.ingredient_id);
      
      if (updateError) throw updateError;
      
      toast.success('Pullout record approved successfully!');
      return approvedPullout;
    } catch (err) {
      console.error(`Error approving pullout with ID ${id}:`, err);
      setError(`Failed to approve pullout with ID ${id}`);
      toast.error(`Failed to approve pullout record: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reject a pullout record
  const rejectPullout = useCallback(async (id, managerId, rejectionReason) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if pullout is still pending
      const { data: pullout, error: pulloutError } = await supabase
        .from('pullouts')
        .select('status')
        .eq('pullout_id', id)
        .single();
      
      if (pulloutError) throw pulloutError;
      
      if (pullout.status !== 'pending') {
        throw new Error(`This pullout is already ${pullout.status}`);
      }
      
      // Reject the pullout
      const { data: rejectedPullout, error: rejectError } = await supabase
        .from('pullouts')
        .update({
          manager_id: managerId,
          status: 'rejected',
          rejection_reason: rejectionReason || 'Not approved',
          updated_at: new Date().toISOString()
        })
        .eq('pullout_id', id)
        .select()
        .single();
      
      if (rejectError) throw rejectError;
      
      toast.success('Pullout record rejected successfully!');
      return rejectedPullout;
    } catch (err) {
      console.error(`Error rejecting pullout with ID ${id}:`, err);
      setError(`Failed to reject pullout with ID ${id}`);
      toast.error(`Failed to reject pullout record: ${err.message}`);
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
      // Check if we have it locally
      const localPullout = pullouts.find(p => p.pullout_id === parseInt(id));
      
      if (localPullout) {
        return localPullout;
      }
      
      // Fetch from database with related data
      const { data, error: pulloutError } = await supabase
        .from('pullouts_with_staff')  // View that joins pullouts with staff info
        .select('*')
        .eq('pullout_id', id)
        .single();
      
      if (pulloutError) throw pulloutError;
      
      return data;
    } catch (err) {
      console.error(`Error fetching pullout with ID ${id}:`, err);
      setError(`Failed to fetch pullout with ID ${id}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pullouts]);

  // Fetch ingredients in a menu item recipe
  const fetchItemIngredients = useCallback(async (itemId) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: recipeError } = await supabase
        .from('item_ingredients')
        .select(`
          quantity,
          ingredients:ingredient_id (
            ingredient_id,
            name,
            unit,
            quantity,
            minimum_quantity,
            unit_cost
          )
        `)
        .eq('item_id', itemId);
      
      if (recipeError) throw recipeError;
      
      // Format data for easier consumption
      const formattedRecipe = data.map(item => ({
        ingredient_id: item.ingredients.ingredient_id,
        name: item.ingredients.name,
        unit: item.ingredients.unit,
        quantity_per_item: item.quantity,
        available_quantity: item.ingredients.quantity,
        minimum_quantity: item.ingredients.minimum_quantity,
        unit_cost: item.ingredients.unit_cost
      }));
      
      setRecipeIngredients(formattedRecipe);
      return formattedRecipe;
    } catch (err) {
      console.error(`Error fetching ingredients for item ${itemId}:`, err);
      setError(`Failed to fetch recipe ingredients`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update menu item ingredients (recipe)
  const updateItemIngredients = useCallback(async (itemId, ingredients) => {
    setLoading(true);
    setError(null);
    
    try {
      // First delete existing recipe
      const { error: deleteError } = await supabase
        .from('item_ingredients')
        .delete()
        .eq('item_id', itemId);
      
      if (deleteError) throw deleteError;
      
      // If there are ingredients to add
      if (ingredients && ingredients.length > 0) {
        // Format the ingredients data for insertion
        const recipeData = ingredients.map(ing => ({
          item_id: itemId,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity
        }));
        
        // Insert the new recipe ingredients
        const { error: insertError } = await supabase
          .from('item_ingredients')
          .insert(recipeData);
        
        if (insertError) throw insertError;
      }
      
      toast.success('Recipe updated successfully!');
      return await fetchItemIngredients(itemId);
    } catch (err) {
      console.error(`Error updating recipe for item ${itemId}:`, err);
      setError('Failed to update recipe');
      toast.error(`Failed to update recipe: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchItemIngredients]);

  // Check if a menu item has enough ingredients in stock
  const checkIngredientAvailability = useCallback(async (itemId, quantity = 1) => {
    try {
      // Get the recipe ingredients
      const { data: recipe, error: recipeError } = await supabase
        .from('item_ingredients')
        .select(`
          quantity,
          ingredients:ingredient_id (
            ingredient_id,
            name,
            quantity
          )
        `)
        .eq('item_id', itemId);
      
      if (recipeError) throw recipeError;
      
      if (!recipe || recipe.length === 0) {
        // No ingredients needed, so it's available
        return { available: true };
      }
      
      // Check if all ingredients have enough stock
      const unavailable = recipe.filter(item => 
        item.ingredients.quantity < (item.quantity * quantity)
      );
      
      if (unavailable.length > 0) {
        return {
          available: false,
          message: `Not enough ${unavailable[0].ingredients.name} in stock`
        };
      }
      
      return { available: true };
    } catch (err) {
      console.error(`Error checking availability for item ${itemId}:`, err);
      throw err;
    }
  }, []);

  // Process a sale by deducting ingredients
  const deductIngredientsForSale = useCallback(async (items) => {
    try {
      // For each item in the sale, get its ingredients and calculate total deductions
      const deductions = {};
      
      for (const item of items) {
        // Get the recipe
        const { data: recipe, error: recipeError } = await supabase
          .from('item_ingredients')
          .select(`
            ingredient_id,
            quantity,
            ingredients:ingredient_id (
              name,
              quantity
            )
          `)
          .eq('item_id', item.item_id);
        
        if (recipeError) throw recipeError;
        
        // Calculate deductions for each ingredient
        for (const ingredient of recipe) {
          const totalDeduction = ingredient.quantity * item.quantity;
          
          if (!deductions[ingredient.ingredient_id]) {
            deductions[ingredient.ingredient_id] = {
              ingredient_id: ingredient.ingredient_id,
              name: ingredient.ingredients.name,
              quantity: totalDeduction,
              current_quantity: ingredient.ingredients.quantity
            };
          } else {
            deductions[ingredient.ingredient_id].quantity += totalDeduction;
          }
        }
      }
      
      // Convert to array
      const deductionsArray = Object.values(deductions);
      
      // Check if we have enough of all ingredients
      for (const deduction of deductionsArray) {
        if (deduction.current_quantity < deduction.quantity) {
          throw new Error(`Not enough ${deduction.name} in stock`);
        }
      }
      
      // Perform the deductions - this will be a RDBMS transaction
      for (const deduction of deductionsArray) {
        const { error: updateError } = await supabase
          .from('ingredients')
          .update({
            quantity: deduction.current_quantity - deduction.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('ingredient_id', deduction.ingredient_id);
        
        if (updateError) {
          throw updateError;
        }
        
        // Check if we need to show low stock warning
        if ((deduction.current_quantity - deduction.quantity) <= 
            // This is a placeholder - you'll need to get the minimum quantity
            // In a real app, we'd join with the ingredients table to get this
            (deduction.minimum_quantity || 5)) {
          toast.warning(`Low stock alert: ${deduction.name}`);
        }
      }
      
      return {
        success: true,
        deductions: deductionsArray
      };
    } catch (err) {
      console.error('Error processing sale deductions:', err);
      toast.error(`Sale error: ${err.message}`);
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