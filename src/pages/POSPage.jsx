import { motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import SalesTerminal from '../components/pos/SalesTerminal';
import { useInventory } from '../hooks/useInventory';
import { Spinner } from '../components/common/Spinner';
import { toast } from 'react-hot-toast';

const POSPage = () => {
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState({
    categories: [],
    products: []
  });

  // Use the inventory hook to fetch items
  const { fetchItems, error } = useInventory();

  // Load items from database
  const loadProductData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch menu items from database
      const items = await fetchItems();
      
      if (!items || items.length === 0) {
        toast.warning('No menu items found. Please add items in the Inventory section.');
        setProductData({
          categories: [],
          products: []
        });
        setLoading(false);
        return;
      }

      // Extract unique categories from items
      const uniqueCategories = [...new Set(items.map(item => item.category || 'Uncategorized'))];
      const formattedCategories = uniqueCategories.map(category => ({
        id: category.toLowerCase().replace(/\s+/g, '-'),
        name: category || 'Uncategorized'
      }));

      // Format products to match our component structure
      const formattedProducts = items.map(item => ({
        id: item.item_id,
        name: item.item_name || 'Unnamed Item',
        category: (item.category || 'Uncategorized').toLowerCase().replace(/\s+/g, '-'),
        price: parseFloat(item.base_price) || 0,
        description: item.description || '',
        image: item.image || null,
        is_externally_sourced: item.is_externally_sourced || false,
        inStock: true // Default to true, will be checked by SalesTerminal
      }));

      setProductData({
        categories: formattedCategories,
        products: formattedProducts
      });
      
      console.log(`Loaded ${formattedProducts.length} products in ${formattedCategories.length} categories`);
    } catch (err) {
      console.error('Error loading menu items:', err);
      toast.error('Failed to load menu items. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [fetchItems]);

  // Load data when component mounts
  useEffect(() => {
    loadProductData();
  }, [loadProductData]);

  // Set the background color when the component mounts and restore when unmounting
  useEffect(() => {
    // Save the original background color
    const originalBgColor = document.body.style.backgroundColor;
    
    // Set the new background color for the POS page
    document.body.style.backgroundColor = '#FFF6F2';
    
    // Restore the original background color when component unmounts
    return () => {
      document.body.style.backgroundColor = originalBgColor;
    };
  }, []);

  // Show error if there was a problem loading items
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FFF6F2]">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#571C1F] mb-2">Failed to load menu items</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={loadProductData}
            className="px-4 py-2 bg-[#571C1F] text-white rounded-lg shadow-sm font-medium hover:bg-[#4A1519] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#FFF6F2] h-full"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#FFF6F2] pt-0">
        {loading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center space-y-4">
              <Spinner size="lg" color="#571C1F" />
              <p className="text-[#571C1F] font-medium">Loading menu items...</p>
            </div>
          </div>
        ) : (
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            initial="hidden"
            animate="show"
            className="pos-content bg-[#FFF6F2]"
          > 
            <motion.div 
              className="flex-grow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <SalesTerminal 
                initialProducts={productData.products}
                initialCategories={productData.categories}
              />
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default POSPage;