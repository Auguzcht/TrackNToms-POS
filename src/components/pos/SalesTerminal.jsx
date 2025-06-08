import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCatalog from './ProductCatalog';
import OrderBuilder from './OrderBuilder';
import Payment from './Payment';
import VoidTransaction from './VoidTransaction';
import { useSales } from '../../hooks/useSales';
import { useAuth } from '../../hooks/useAuth';
import { useInventory } from '../../hooks/useInventory';
import { toast } from 'react-hot-toast';
import Button from '../common/Button';
import Card from '../common/Card';

// Update the component signature to accept props
const SalesTerminal = ({ initialProducts = [], initialCategories = [] }) => {
  const { user } = useAuth();
  const { addSale, fetchSale, voidSale } = useSales();
  const { checkIngredientAvailability, fetchItems, processItemSale } = useInventory();
  
  // Initialize with a valid object structure
  const [activeOrder, setActiveOrder] = useState({
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0
  });
  
  const [paymentStep, setPaymentStep] = useState(false);
  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategories.length > 0 ? initialCategories[0].id : null
  );
  const [inventory, setInventory] = useState({});
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [saleToVoid, setSaleToVoid] = useState(null);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState(null);

  // If no initial data was provided, fetch using useInventory
  useEffect(() => {
    if (initialProducts.length === 0 || initialCategories.length === 0) {
      const fetchProductsFromInventory = async () => {
        try {
          setLoading(true);
          // Use the existing hook function instead of api
          const menuItems = await fetchItems();

          // Extract unique categories from items
          const uniqueCategories = [...new Set(menuItems.map(item => item.category || 'Uncategorized'))];
          const formattedCategories = uniqueCategories.map(category => ({
            id: category.toLowerCase().replace(/\s+/g, '-'),
            name: category
          }));

          // Format products to match our component structure
          const formattedProducts = menuItems.map(item => ({
            id: item.item_id,
            name: item.item_name || 'Unnamed Item',
            category: (item.category || 'Uncategorized').toLowerCase().replace(/\s+/g, '-'),
            price: parseFloat(item.base_price) || 0,
            description: item.description || '',
            image: item.image || null,
            is_externally_sourced: item.is_externally_sourced || false
          }));

          setCategories(formattedCategories);
          setProducts(formattedProducts);
          setSelectedCategory(formattedCategories[0]?.id || null);
          
          // Now check inventory after loading products
          await checkInventoryForProducts(formattedProducts);
        } catch (error) {
          console.error('Error fetching menu items:', error);
          toast.error('Failed to load menu items');
        } finally {
          setLoading(false);
        }
      };

      fetchProductsFromInventory();
    } else {
      // Just check inventory for the provided products
      checkInventoryForProducts(initialProducts);
    }
  }, [initialProducts, initialCategories, fetchItems]);

  // New function to check inventory for products
  const checkInventoryForProducts = async (products) => {
    try {
      setLoading(true);
      
      // Create a mapping of product id to inventory status
      const inventoryStatus = {};
      
      // Check each product's ingredient availability
      for (const product of products) {
        try {
          const result = await checkIngredientAvailability(product.id, 1);
          inventoryStatus[product.id] = {
            quantity: result.availableQuantity || 0,
            available: result.available !== false, // Default to true if undefined
            threshold: result.lowStockThreshold || 5
          };
        } catch (error) {
          console.error(`Error checking availability for product ${product.id}:`, error);
          inventoryStatus[product.id] = { quantity: 0, available: true, threshold: 5 };
        }
      }
      
      setInventory(inventoryStatus);
    } catch (error) {
      console.error('Error checking inventory status:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItemToOrder = async (product) => {
    try {
      // Check ingredient availability directly using the hook
      const availability = await checkIngredientAvailability(product.id, 1);

      if (!availability.available) {
        toast.error(availability.message || `${product.name} is out of stock!`);
        return;
      }

      // Rest of the existing addItemToOrder logic...
      const existingItem = activeOrder.items.find(item => item.id === product.id);
      let updatedItems;
      
      if (existingItem) {
        // Check availability for increased quantity
        const newQuantity = existingItem.quantity + 1;
        const availabilityCheck = await checkIngredientAvailability(product.id, newQuantity);

        if (!availabilityCheck.available) {
          toast.error(availabilityCheck.message || `Not enough ${product.name} in stock!`);
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
  
  const updateItemQuantity = async (itemId, quantity) => {
    // Don't allow zero or negative quantities
    if (quantity <= 0) {
      removeItemFromOrder(itemId);
      return;
    }
    
    try {
      // Check inventory availability first
      const product = products.find(p => p.id === itemId);
      if (!product) return;
      
      const availability = await checkIngredientAvailability(itemId, quantity);
      
      if (!availability.available) {
        toast.error(availability.message || `Not enough ${product.name} in stock!`);
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
    } catch (error) {
      console.error('Error updating item quantity:', error);
      toast.error('Failed to update quantity');
    }
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

  // Update completePayment to use the authenticated user directly
  const completePayment = async (paymentData) => {
    try {
      if (!user) {
        toast.error('You must be logged in to complete a sale');
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      // Prepare sale data matching database schema
      const saleData = {
        cashier_id: user.id, // Use the authenticated user's ID directly
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
        // Save the completed sale for possible void operation
        setLastCompletedSale(result);
        
        // Process the ingredients deduction using our hook
        await processItemSale(activeOrder.items.map(item => ({
          item_id: item.id,
          quantity: item.quantity
        })));
        
        // We don't need to set receipt states anymore, just return the result
        toast.success(`Sale #${result.sale_id} completed successfully`);

        // Re-check inventory for products
        checkInventoryForProducts(products);

        return {
          success: true,
          saleId: result.sale_id,
          cashierName: user?.first_name || user?.user_metadata?.first_name || 'Cashier'
        };
      }
      
      return {
        success: false,
        error: 'Failed to create sale'
      };
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

  // Handle void request
  const handleVoidRequest = () => {
    if (lastCompletedSale) {
      setSaleToVoid(lastCompletedSale);
      setVoidDialogOpen(true);
    } else {
      // Show input for sale ID
      setShowVoidModal(true);
    }
  };

  // Handle void by ID
  const handleVoidById = async (saleId) => {
    try {
      const sale = await fetchSale(saleId);
      if (sale) {
        setSaleToVoid(sale);
        setShowVoidModal(false);
        setVoidDialogOpen(true);
      } else {
        toast.error(`Sale #${saleId} not found`);
      }
    } catch (error) {
      console.error('Error fetching sale:', error);
      toast.error(`Could not find sale #${saleId}`);
    }
  };

  // Handle void completion
  const handleVoidComplete = (result) => {
    setVoidDialogOpen(false);
    setSaleToVoid(null);
    
    // If this was the last completed sale, clear it
    if (lastCompletedSale && lastCompletedSale.sale_id === result.sale_id) {
      setLastCompletedSale(null);
    }
    
    // Re-check inventory as items may have been returned to stock
    checkInventoryForProducts(products);
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
          {voidDialogOpen && saleToVoid ? (
            <motion.div
              key="void"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 w-full h-full"
            >
              <VoidTransaction 
                sale={saleToVoid}
                onVoidComplete={handleVoidComplete}
                onCancel={() => {
                  setVoidDialogOpen(false);
                  setSaleToVoid(null);
                }}
              />
            </motion.div>
          ) : paymentStep ? (
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
                onVoidSale={handleVoidRequest}
                lastCompletedSale={lastCompletedSale}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Void Sale by ID Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Void Sale by ID</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale ID</label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter sale ID"
                id="saleIdInput"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowVoidModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-[#571C1F] text-white rounded-md hover:bg-[#4A1519]"
                onClick={() => {
                  const saleId = document.getElementById('saleIdInput').value;
                  if (saleId) {
                    handleVoidById(saleId);
                  }
                }}
              >
                Find Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesTerminal;