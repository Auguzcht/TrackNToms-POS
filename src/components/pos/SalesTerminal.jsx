import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCatalog from './ProductCatalog';
import OrderBuilder from './OrderBuilder';
import Payment from './Payment';
import { useSales } from '../../hooks/useSales';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import api from '../../services/api'; // Assuming you have an api module for making requests
const SalesTerminal = () => {
  const { user } = useAuth();
  const { addSale } = useSales();
  const [activeOrder, setActiveOrder] = useState({
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0
  });
  const [paymentStep, setPaymentStep] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [inventory, setInventory] = useState({}); // For tracking inventory

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/inventory/items');
        const menuItems = response.data;

        // Extract unique categories from items
        const uniqueCategories = [...new Set(menuItems.map(item => item.category))];
        const formattedCategories = uniqueCategories.map(category => ({
          id: category.toLowerCase(),
          name: category
        }));

        // Format products to match our component structure
        const formattedProducts = menuItems.map(item => ({
          id: item.item_id,
          name: item.item_name,
          category: item.category.toLowerCase(),
          price: parseFloat(item.base_price),
          description: item.description,
          image: item.image,
          is_externally_sourced: item.is_externally_sourced
        }));

        setCategories(formattedCategories);
        setProducts(formattedProducts);
        setSelectedCategory(formattedCategories[0]?.id || 'coffee');
        setLoading(false);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        toast.error('Failed to load menu items');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const addItemToOrder = async (product) => {
    try {
      // Check ingredient availability first
      const availability = await api.get(`/inventory/items/${product.id}/ingredients/availability`, {
        params: { quantity: 1 }
      });

      if (!availability.data.available) {
        toast.error(availability.data.message || `${product.name} is out of stock!`);
        return;
      }

      // Rest of the existing addItemToOrder logic...
      const existingItem = activeOrder.items.find(item => item.id === product.id);
      let updatedItems;
      
      if (existingItem) {
        // Check availability for increased quantity
        const newQuantity = existingItem.quantity + 1;
        const availabilityCheck = await api.get(`/inventory/items/${product.id}/ingredients/availability`, {
          params: { quantity: newQuantity }
        });

        if (!availabilityCheck.data.available) {
          toast.error(availabilityCheck.data.message);
          return;
        }

        updatedItems = activeOrder.items.map(item => {
          if (item.id === product.id) {
            return {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.price
            };
          }
          return item;
        });
      } else {
        updatedItems = [
          ...activeOrder.items,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            subtotal: product.price
          }
        ];
      }

      const subtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const tax = subtotal * 0.12; // Tax rate could come from settings
      const total = subtotal + tax;

      setActiveOrder({
        items: updatedItems,
        subtotal,
        tax,
        total
      });

    } catch (error) {
      console.error('Error adding item to order:', error);
      toast.error('Failed to add item to order');
    }
  };
  
  const updateItemQuantity = (itemId, quantity) => {
    // Don't allow zero or negative quantities
    if (quantity <= 0) {
      removeItemFromOrder(itemId);
      return;
    }
    
    // Check inventory
    const inventoryItem = inventory[itemId];
    if (quantity > inventoryItem?.quantity) {
      toast.error(`Requested quantity exceeds available stock!`);
      return;
    }
    
    const updatedItems = activeOrder.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          subtotal: quantity * item.price
        };
      }
      return item;
    });
    
    // Calculate totals
    const subtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * 0.12;
    const total = subtotal + tax;
    
    setActiveOrder({
      items: updatedItems,
      subtotal,
      tax,
      total
    });
  };
  
  const removeItemFromOrder = (itemId) => {
    const updatedItems = activeOrder.items.filter(item => item.id !== itemId);
    
    // Calculate totals
    const subtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * 0.12;
    const total = subtotal + tax;
    
    setActiveOrder({
      items: updatedItems,
      subtotal,
      tax,
      total
    });
  };
  
  const clearOrder = () => {
    setActiveOrder({
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0
    });
  };
  
  const proceedToPayment = () => {
    if (activeOrder.items.length === 0) {
      toast.error('Please add items to the order first');
      return;
    }
    setPaymentStep(true);
  };

  // Update inventory after successful payment
  const updateInventory = () => {
    const updatedInventory = {...inventory};
    
    activeOrder.items.forEach(item => {
      updatedInventory[item.id] = {
        ...updatedInventory[item.id],
        quantity: updatedInventory[item.id].quantity - item.quantity
      };
      
      // Check if we need to show low stock warning
      if (updatedInventory[item.id].quantity <= updatedInventory[item.id].threshold) {
        toast.warning(`Low stock alert: ${item.name} (${updatedInventory[item.id].quantity} left)`);
      }
    });
    
    setInventory(updatedInventory);
  };

  const completePayment = async (paymentData) => {
    try {
      // Prepare sale data matching database schema
      const saleData = {
        cashier_id: user?.staff_id || 1,
        sale_date: new Date().toISOString(),
        payment_method: paymentData.method,
        total_amount: activeOrder.total,
        items: activeOrder.items.map(item => ({
          item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.subtotal
        }))
      };

      // Call the addSale method from useSales
      const result = await addSale(saleData);

      if (result) {
        // Clear the order
        clearOrder();
        setPaymentStep(false);
        toast.success(`Sale #${result.sale_id} completed successfully`);

        // Deduct ingredients from inventory through the API
        await api.post('/inventory/deduct-ingredients', {
          items: saleData.items
        });

        return {
          success: true,
          saleId: result.sale_id
        };
      }
    } catch (error) {
      console.error('Error completing sale:', error);
      toast.error(error.message || 'Failed to process sale');
      return { 
        success: false, 
        error: error.message || 'Failed to process sale' 
      };
    }
  };

  const cancelPayment = () => {
    setPaymentStep(false);
  };

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Left side - Product catalog */}
      <motion.div 
        layout
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="w-full md:w-2/3 md:pr-4 mb-6 md:mb-0"
      >
        <ProductCatalog 
          categories={categories}
          products={products}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onSelectProduct={addItemToOrder}
          loading={loading}
          inventory={inventory}
        />
      </motion.div>
      
      {/* Right side - Container for OrderBuilder and Payment */}
      <div className="w-full md:w-1/3 relative" style={{ height: "618px" }}>
        <AnimatePresence mode="wait">
          {paymentStep ? (
            <motion.div
              key="payment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 w-full h-full"
            >
              <Payment 
                order={activeOrder}
                onComplete={completePayment}
                onCancel={cancelPayment}
              />
            </motion.div>
          ) : (
            <motion.div
              key="order"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 w-full h-full"
            >
              <OrderBuilder 
                order={activeOrder}
                onUpdateQuantity={updateItemQuantity}
                onRemoveItem={removeItemFromOrder}
                onClearOrder={clearOrder}
                onCheckout={proceedToPayment}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SalesTerminal;