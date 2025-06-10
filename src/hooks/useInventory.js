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
          table: 'pullout' // Changed from 'pullouts' to 'pullout' to match actual table name
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
      // Step 1: Fetch pullouts with ingredients (this join works)
      const { data: pulloutsData, error: pulloutsError } = await supabase
        .from('pullout')
        .select(`
          *,
          ingredients:ingredient_id (ingredient_id, name, unit)
        `)
        .order('date_of_pullout', { ascending: false });
      
      if (pulloutsError) throw pulloutsError;
      
      // Step 2: Fetch all staff for mapping UUIDs to staff info
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('user_id, staff_id, first_name, last_name, email, role_id');
      
      if (staffError) throw staffError;
      
      // Step 3: Create a map of auth user IDs to staff info
      const staffMap = {};
      if (staffData) {
        staffData.forEach(staff => {
          if (staff.user_id) {
            staffMap[staff.user_id] = staff;
          }
        });
      }
      
      // Step 4: Map the data together
      const formattedData = pulloutsData.map(pullout => {
        // Look up staff info using requested_by UUID
        const requestedByStaff = staffMap[pullout.requested_by] || null;
        const approvedByStaff = staffMap[pullout.approved_by] || null;
        
        return {
          ...pullout,
          // Include original staff references (for compatibility)
          staff: requestedByStaff,
          managers: approvedByStaff,
          
          // Add computed fields for easy access
          staffName: requestedByStaff ? 
            `${requestedByStaff.first_name} ${requestedByStaff.last_name}` : 
            'Unknown User',
          managerName: approvedByStaff ? 
            `${approvedByStaff.first_name} ${approvedByStaff.last_name}` : 
            null,
          ingredientName: pullout.ingredients?.name || 'Unknown'
        };
      });
      
      setPullouts(formattedData || []);
      return formattedData || [];
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
    // Keep this log inside the function where it won't trigger re-renders
    console.log("fetchInventory called");
    
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

  // Fetch inventory data only (no pullouts)
  const fetchInventoryOnly = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [ingredientsData, itemsData] = await Promise.all([
        fetchIngredients(),
        fetchItems()
      ]);
      
      return { 
        ingredients: ingredientsData, 
        items: itemsData
      };
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err.message || 'Failed to fetch inventory');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchIngredients, fetchItems]);

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

      // Format pullout data - use requested_by and approved_by fields
      const pullout = {
        ingredient_id: pulloutData.ingredient_id,
        quantity: pulloutData.quantity,
        reason: pulloutData.reason,
        requested_by: pulloutData.requested_by || user?.id, // Use user ID directly
        date_of_pullout: pulloutData.date_of_pullout || new Date().toISOString().split('T')[0],
        status: 'pending', // Default status is pending
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add approved_by if present
      if (pulloutData.approved_by) {
        pullout.approved_by = pulloutData.approved_by;
        pullout.status = 'approved';
      }
      
      // Create the pullout record
      const { data: newPullout, error: pulloutError } = await supabase
        .from('pullout')
        .insert(pullout)
        .select()
        .single();
      
      if (pulloutError) throw pulloutError;
      
      // If manager approval is included, approve it immediately and update inventory
      if (pulloutData.approved_by) {
        // Update the ingredient quantity
        const { error: updateError } = await supabase
          .from('ingredients')
          .update({ 
            quantity: ingredient.quantity - pulloutData.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('ingredient_id', pulloutData.ingredient_id);
        
        if (updateError) throw updateError;
        
        toast.success('Pullout record created and approved');
      } else {
        toast.success('Pullout record created successfully!');
      }
      
      // Return created pullout
      return newPullout;
    } catch (err) {
      console.error('Error creating pullout:', err);
      setError('Failed to create pullout record');
      toast.error(`Failed to create pullout record: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Update a pullout record
  const updatePullout = useCallback(async (id, pulloutData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get original pullout
      const { data: originalPullout, error: fetchError } = await supabase
        .from('pullout') // Changed from 'pullouts' to 'pullout'
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
        .from('pullout')
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
        .from('pullout') // Changed from pullouts to pullout
        .select('status')
        .eq('pullout_id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (pullout.status === 'approved') {
        throw new Error('Cannot delete an approved pullout record');
      }
      
      // Delete the pullout
      const { error: deleteError } = await supabase
        .from('pullout') // Changed from pullouts to pullout
        .delete()
        .eq('pullout_id', id);
      
      if (deleteError) throw deleteError;
      
      // Update local state
      setPullouts(prev => prev.filter(p => p.pullout_id !== id));
      
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
        .from('pullout') // CORRECT: Using 'pullout' (singular)
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
      
      // FIXED: Changed from 'pullouts' to 'pullout'
      // FIXED: Changed manager_id to approved_by
      const { data: approvedPullout, error: approveError } = await supabase
        .from('pullout') // FIXED: Changed from 'pullouts' to 'pullout'
        .update({
          approved_by: managerId, // FIXED: Changed from manager_id to approved_by
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
      
      // Also update the local state
      setPullouts(prevPullouts => 
        prevPullouts.map(p => 
          p.pullout_id === id ? {...p, status: 'approved', approved_by: managerId} : p
        )
      );
      
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
      // Check if pullout is still pending - THIS LINE IS INCORRECT
      const { data: pullout, error: pulloutError } = await supabase
        .from('pullout') // Changed from 'pullouts' to 'pullout'
        .select('status')
        .eq('pullout_id', id)
        .single();
      
      if (pulloutError) throw pulloutError;
      
      if (pullout.status !== 'pending') {
        throw new Error(`This pullout is already ${pullout.status}`);
      }
      
      // Reject the pullout - THIS LINE IS INCORRECT
      const { data: rejectedPullout, error: rejectError } = await supabase
        .from('pullout') // Changed from 'pullouts' to 'pullout'
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
      // Check if we have it locally first
      const localPullout = pullouts.find(p => p.pullout_id === parseInt(id));
      
      if (localPullout) {
        return localPullout;
      }
      
      // If not found locally, fetch from the database
      const { data: pullout, error: pulloutError } = await supabase
        .from('pullout')
        .select(`
          *,
          ingredients:ingredient_id (ingredient_id, name, unit)
        `)
        .eq('pullout_id', id)
        .single();
      
      if (pulloutError) throw pulloutError;
      
      // Fetch staff info separately
      let requestedByStaff = null;
      let approvedByStaff = null;
      
      if (pullout.requested_by || pullout.approved_by) {
        const userIds = [pullout.requested_by, pullout.approved_by].filter(Boolean);
        
        // Get staff info for these user IDs
        if (userIds.length > 0) {
          const { data: staffData } = await supabase
            .from('staff')
            .select('user_id, staff_id, first_name, last_name, email')
            .in('user_id', userIds);
          
          if (staffData) {
            const staffMap = {};
            staffData.forEach(staff => {
              if (staff.user_id) {
                staffMap[staff.user_id] = staff;
              }
            });
            
            requestedByStaff = staffMap[pullout.requested_by] || null;
            approvedByStaff = staffMap[pullout.approved_by] || null;
          }
        }
      }
      
      // Format the pullout with staff info
      const formattedPullout = {
        ...pullout,
        staff: requestedByStaff,
        managers: approvedByStaff,
        staffName: requestedByStaff ? 
          `${requestedByStaff.first_name} ${requestedByStaff.last_name}` : 
          'Unknown User',
        managerName: approvedByStaff ? 
          `${approvedByStaff.first_name} ${approvedByStaff.last_name}` : 
          null,
        ingredientName: pullout.ingredients?.name || 'Unknown'
      };
      
      return formattedPullout;
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

  // Add this function to handle ingredient availability checking
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
            quantity,
            minimum_quantity
          )
        `)
        .eq('item_id', itemId);
      
      if (recipeError) throw recipeError;
      
      if (!recipe || recipe.length === 0) {
        // No ingredients needed, so it's available
        return { 
          available: true,
          availableQuantity: 999,
          lowStockThreshold: 5,
          message: 'No ingredients required'
        };
      }
      
      // Check if all ingredients have enough stock
      let available = true;
      let limitingQuantity = Infinity;
      let limitingIngredient = null;
      let message = '';
      
      for (const item of recipe) {
        if (!item.ingredients || item.ingredients.quantity === null) {
          continue;
        }
        
        const requiredQty = item.quantity * quantity;
        const availableQty = item.ingredients.quantity || 0;
        const availableBatches = Math.floor(availableQty / item.quantity);
        
        if (requiredQty > availableQty) {
          available = false;
          limitingIngredient = item.ingredients;
          message = `Not enough ${item.ingredients.name} to make this item`;
          break;
        }
        
        if (availableBatches < limitingQuantity) {
          limitingQuantity = availableBatches;
          limitingIngredient = item.ingredients;
        }
      }
      
      return {
        available,
        availableQuantity: limitingQuantity,
        lowStockThreshold: limitingIngredient?.minimum_quantity || 5,
        message,
        limitingIngredient: limitingIngredient?.name
      };
    } catch (error) {
      console.error('Error checking ingredient availability:', error);
      throw error;
    }
  }, []);

  // Add this function to process a sale by deducting ingredients
  const processItemSale = useCallback(async (items) => {
    try {
      const deductions = [];
      
      // For each item being sold
      for (const item of items) {
        // Get the recipe for the item
        const { data: recipe, error: recipeError } = await supabase
          .from('item_ingredients')
          .select(`
            quantity,
            ingredients:ingredient_id (
              ingredient_id,
              name,
              quantity,
              minimum_quantity
            )
          `)
          .eq('item_id', item.item_id);
        
        if (recipeError) throw recipeError;
        
        if (!recipe || recipe.length === 0) {
          continue; // No ingredients to deduct
        }
        
        // Calculate the required ingredient amounts
        for (const ingredient of recipe) {
          if (!ingredient.ingredients) continue;
          
          const deductAmount = ingredient.quantity * item.quantity;
          
          // Add to deductions list
          deductions.push({
            ingredient_id: ingredient.ingredients.ingredient_id,
            name: ingredient.ingredients.name,
            quantity: deductAmount,
            current_quantity: ingredient.ingredients.quantity || 0,
            minimum_quantity: ingredient.ingredients.minimum_quantity || 5
          });
        }
      }
      
      // Group the deductions by ingredient
      const groupedDeductions = {};
      for (const deduction of deductions) {
        if (!groupedDeductions[deduction.ingredient_id]) {
          groupedDeductions[deduction.ingredient_id] = { ...deduction };
        } else {
          groupedDeductions[deduction.ingredient_id].quantity += deduction.quantity;
        }
      }
      
      const deductionsArray = Object.values(groupedDeductions);
      
      // Process each deduction
      for (const deduction of deductionsArray) {
        // Update the ingredient quantity
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
        if ((deduction.current_quantity - deduction.quantity) <= deduction.minimum_quantity) {
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

  // Get suppliers for an ingredient
  const getIngredientSuppliers = useCallback(async (ingredientId) => {
    try {
      const { data, error } = await supabase
        .from('ingredient_suppliers')
        .select(`
          *,
          suppliers:supplier_id (supplier_id, company_name, contact_person, contact_phone)
        `)
        .eq('ingredient_id', ingredientId);
        
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error(`Error fetching suppliers for ingredient ${ingredientId}:`, err);
      return [];
    }
  }, []);

  // Add preferred supplier for ingredient
  const setPreferredSupplier = useCallback(async (ingredientId, supplierId) => {
    try {
      // Reset all to false first
      await supabase
        .from('ingredient_suppliers')
        .update({ is_preferred: false })
        .eq('ingredient_id', ingredientId);
        
      // Set selected one to true
      await supabase
        .from('ingredient_suppliers')
        .update({ is_preferred: true })
        .eq('ingredient_id', ingredientId)
        .eq('supplier_id', supplierId);
        
      return true;
    } catch (err) {
      console.error(`Error setting preferred supplier for ingredient ${ingredientId}:`, err);
      return false;
    }
  }, []);

  // New function to fetch inventory data for export
  const fetchInventoryForExport = useCallback(async () => {
    // Don't update state, just return data
    try {
      const [ingredientsData, itemsData, pulloutsData] = await Promise.all([
        // Use the raw Supabase calls instead of the functions that update state
        supabase.from('ingredients').select('*').order('name', { ascending: true }),
        supabase.from('items').select('*').order('item_name', { ascending: true }),
        supabase.from('pullout').select('*')
      ]);
      
      return { 
        ingredients: ingredientsData.data || [], 
        items: itemsData.data || [], 
        pullouts: pulloutsData.data || [] 
      };
    } catch (err) {
      console.error('Error fetching inventory for export:', err);
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
    fetchInventoryOnly, // Add this here
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
    processItemSale,
    recipeIngredients,
    getIngredientSuppliers,
    setPreferredSupplier,
    fetchInventoryForExport // Add this to your returned object
  };
};

export default useInventory;