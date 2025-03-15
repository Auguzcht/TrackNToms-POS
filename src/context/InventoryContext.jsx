import { createContext, useState, useCallback } from 'react';

export const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  const [ingredients, setIngredients] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all inventory data
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      // In a real app, these would be API calls
      // Mock data for now
      
      // Fetch ingredients
      const mockIngredients = [
        { 
          ingredient_id: 1, 
          name: 'Coffee Beans', 
          unit: 'kg', 
          quantity: 5.5, 
          minimum_quantity: 2, 
          unit_cost: 450.00,
          last_restock_date: '2024-05-15'
        },
        { 
          ingredient_id: 2, 
          name: 'Milk', 
          unit: 'liters', 
          quantity: 8, 
          minimum_quantity: 5, 
          unit_cost: 85.00,
          last_restock_date: '2024-05-18'
        },
        { 
          ingredient_id: 3, 
          name: 'Sugar', 
          unit: 'kg', 
          quantity: 3.2, 
          minimum_quantity: 2, 
          unit_cost: 65.00,
          last_restock_date: '2024-05-10'
        },
        { 
          ingredient_id: 4, 
          name: 'Chocolate Sauce', 
          unit: 'bottles', 
          quantity: 3, 
          minimum_quantity: 4, 
          unit_cost: 180.00,
          last_restock_date: '2024-05-05'
        },
      ];
      
      // Fetch items
      const mockItems = [
        {
          item_id: 1,
          item_name: 'Americano',
          category: 'Coffee',
          base_price: 120.00,
          description: 'Espresso shots topped with hot water',
          is_externally_sourced: false
        },
        {
          item_id: 2,
          item_name: 'Latte',
          category: 'Coffee',
          base_price: 150.00,
          description: 'Espresso with steamed milk',
          is_externally_sourced: false
        },
        {
          item_id: 3,
          item_name: 'Chocolate Muffin',
          category: 'Pastries',
          base_price: 90.00,
          description: 'Freshly baked chocolate muffin',
          is_externally_sourced: true
        },
      ];
      
      setIngredients(mockIngredients);
      setItems(mockItems);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new ingredient
  const addIngredient = useCallback(async (ingredientData) => {
    try {
      // In a real app, this would be an API call
      console.log('Adding ingredient:', ingredientData);
      
      // Mock implementation - add to local state with a fake ID
      const newId = ingredients.length > 0 
        ? Math.max(...ingredients.map(i => i.ingredient_id)) + 1
        : 1;
      
      const newIngredient = {
        ingredient_id: newId,
        ...ingredientData,
        last_restock_date: new Date().toISOString().split('T')[0]
      };
      
      setIngredients(prev => [...prev, newIngredient]);
      
      return {
        success: true,
        ingredient: newIngredient
      };
    } catch (error) {
      console.error('Error adding ingredient:', error);
      return {
        success: false,
        error: error.message || 'Failed to add ingredient'
      };
    }
  }, [ingredients]);

  // Update an existing ingredient
  const updateIngredient = useCallback(async (id, ingredientData) => {
    try {
      // In a real app, this would be an API call
      console.log('Updating ingredient:', id, ingredientData);
      
      setIngredients(prev => 
        prev.map(item => 
          item.ingredient_id === id 
            ? { ...item, ...ingredientData } 
            : item
        )
      );
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error updating ingredient:', error);
      return {
        success: false,
        error: error.message || 'Failed to update ingredient'
      };
    }
  }, []);

  // Add a new item (menu product)
  const addItem = useCallback(async (itemData) => {
    try {
      // In a real app, this would be an API call
      console.log('Adding item:', itemData);
      
      // Mock implementation - add to local state with a fake ID
      const newId = items.length > 0 
        ? Math.max(...items.map(i => i.item_id)) + 1 
        : 1;
      
      const newItem = {
        item_id: newId,
        ...itemData
      };
      
      setItems(prev => [...prev, newItem]);
      
      return {
        success: true,
        item: newItem
      };
    } catch (error) {
      console.error('Error adding item:', error);
      return {
        success: false,
        error: error.message || 'Failed to add item'
      };
    }
  }, [items]);

  // Update an existing item
  const updateItem = useCallback(async (id, itemData) => {
    try {
      // In a real app, this would be an API call
      console.log('Updating item:', id, itemData);
      
      setItems(prev => 
        prev.map(item => 
          item.item_id === id 
            ? { ...item, ...itemData } 
            : item
        )
      );
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error updating item:', error);
      return {
        success: false,
        error: error.message || 'Failed to update item'
      };
    }
  }, []);

  const deleteItem = useCallback(async (id) => {
    try {
      // In a real app, this would be an API call
      console.log('Deleting item:', id);
      
      setItems(prev => prev.filter(item => item.item_id !== id));
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting item:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete item'
      };
    }
  }, []);

  const deleteIngredient = useCallback(async (id) => {
    try {
      // In a real app, this would be an API call
      console.log('Deleting ingredient:', id);
      
      setIngredients(prev => prev.filter(ingredient => ingredient.ingredient_id !== id));
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete ingredient'
      };
    }
  }, []);

  return (
    <InventoryContext.Provider
      value={{
        ingredients,
        items,
        loading,
        fetchInventory,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        addItem,
        updateItem,
        deleteItem
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};