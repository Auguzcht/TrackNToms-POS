import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCatalog from './ProductCatalog';
import OrderBuilder from './OrderBuilder';
import Payment from './Payment';
import { useSales } from '../../hooks/useSales';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

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
    // Fetch product categories and products
    const fetchProducts = async () => {
      try {
        // In a real app, this would come from your API
        const dummyCategories = [
          { id: 'coffee', name: 'Coffee' },
          { id: 'drinks', name: 'Drinks' },
          { id: 'pastries', name: 'Pastries' },
          { id: 'food', name: 'Food' },
          { id: 'addons', name: 'Add Ons' },
        ];
        
        const dummyProducts = [
          { id: 1, name: 'Americano', category: 'coffee', price: 120, image: null },
          { id: 2, name: 'Cappuccino', category: 'coffee', price: 150, image: null },
          { id: 3, name: 'Latte', category: 'coffee', price: 160, image: null },
          { id: 4, name: 'Mocha', category: 'coffee', price: 170, image: null },
          { id: 5, name: 'Croissant', category: 'pastries', price: 85, image: null },
          { id: 6, name: 'Chocolate Muffin', category: 'pastries', price: 90, image: null },
          { id: 7, name: 'Sandwich', category: 'food', price: 160, image: null },
          { id: 8, name: 'Pasta', category: 'food', price: 220, image: null },
          { id: 9, name: 'Orange Juice', category: 'drinks', price: 110, image: null },
          { id: 10, name: 'Extra Shot', category: 'addons', price: 40, image: null },
          { id: 11, name: 'Vanilla Syrup', category: 'addons', price: 30, image: null },
          { id: 12, name: 'Espresso', category: 'coffee', price: 110, image: null },
        ];
        
        // Initialize dummy inventory
        const dummyInventory = {};
        dummyProducts.forEach(product => {
          dummyInventory[product.id] = {
            quantity: Math.floor(Math.random() * 20) + 5,
            threshold: 3
          };
        });

        setCategories(dummyCategories);
        setProducts(dummyProducts);
        setInventory(dummyInventory);
        setSelectedCategory('coffee'); // Default to coffee
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  const addItemToOrder = (product) => {
    // Check inventory
    if (inventory[product.id]?.quantity <= 0) {
      toast.error(`${product.name} is out of stock!`);
      return;
    }

    const existingItem = activeOrder.items.find(item => item.id === product.id);
    let updatedItems;
    
    if (existingItem) {
      // If item exists, check if we can add more based on inventory
      if (existingItem.quantity + 1 > inventory[product.id].quantity) {
        toast.error(`Not enough ${product.name} in stock!`);
        return;
      }
      
      // Update quantity
      updatedItems = activeOrder.items.map(item => {
        if (item.id === product.id) {
          return {
            ...item,
            quantity: item.quantity + 1,
            subtotal: (item.quantity + 1) * product.price
          };
        }
        return item;
      });
    } else {
      // Add new item
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
      // In a real app, this would be an API call to record the sale and update inventory
      
      // Generate a sale ID
      const saleId = `SALE-${Date.now().toString().slice(-6)}`;
      
      // Prepare sale data with order details and payment info
      const saleData = {
        id: saleId,
        date: new Date(),
        cashier: user?.name || 'Unknown',
        items: activeOrder.items,
        subtotal: activeOrder.subtotal,
        tax: activeOrder.tax,
        total: activeOrder.total,
        payment: paymentData
      };
      
      // Simulate API processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update inventory by deducting sold items
      updateInventory();
      
      // In a real app, you would call your addSale method:
      // const result = await addSale(saleData);
      
      // Log the completed sale
      console.log('Sale completed:', saleData);
      
      // Return successful result with sale ID
      return {
        success: true,
        saleId: saleId
      };
    } catch (error) {
      console.error('Error completing payment:', error);
      return { success: false, error: 'Failed to process payment' };
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