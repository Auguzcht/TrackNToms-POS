import { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../common/Card';

const ProductCatalog = ({
  categories,
  products,
  selectedCategory,
  onSelectCategory,
  onSelectProduct,
  loading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredProducts = products.filter(product => {
    // Filter by selected category and search query
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  return (
    <Card className="h-full flex flex-col">
      <div className="mb-4">
        <div className="relative">
          <motion.input
            type="text"
            placeholder="Search products..."
            className="w-full px-4 py-2 pl-10 border border-[#571C1F]/20 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#571C1F] focus:border-[#571C1F] bg-white text-[#571C1F]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            whileFocus={{ boxShadow: "0 0 0 2px rgba(87, 28, 31, 0.2)" }}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="bg-white rounded-md p-1 flex overflow-x-auto hide-scrollbar">
          <motion.div 
            className="flex space-x-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                className={`px-3.5 py-1.5 rounded-md text-sm font-medium min-w-[80px] flex justify-center items-center ${
                  selectedCategory === category.id
                    ? 'bg-[#571C1F] text-white shadow-sm'
                    : 'bg-[#FFF6F2] text-[#571C1F] hover:bg-[#FFE6E0]'
                }`}
                onClick={() => onSelectCategory(category.id)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ 
                  duration: 0.3, 
                  delay: 0.05 + (index * 0.03) 
                }}
                whileTap={{ scale: 0.97 }}
              >
                <motion.span
                  animate={{ 
                    color: selectedCategory === category.id ? '#fff' : '#571C1F' 
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {category.name}
                </motion.span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Increased fixed height container */}
      <div className="flex-grow overflow-y-auto" style={{ height: "469px", minHeight: "469px" }}>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => (
              <motion.div 
                key={index} 
                className="animate-pulse bg-white border border-[#571C1F]/10 rounded-lg overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="bg-[#FFF6F2] h-40 rounded-t-md mb-2"></div>
                <div className="p-3">
                  <div className="bg-[#571C1F]/10 h-4 rounded w-3/4 mb-2"></div>
                  <div className="bg-[#571C1F]/10 h-4 rounded w-1/2"></div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-8 text-[#571C1F]/60">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-[#571C1F]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="mt-2">No products found.</p>
              </div>
            ) : (
              filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  className="bg-white border border-[#571C1F]/10 rounded-lg overflow-hidden cursor-pointer transition-all"
                  onClick={() => onSelectProduct(product)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.03,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    backgroundColor: '#FFF6F2',
                    boxShadow: "0 4px 12px -2px rgba(87, 28, 31, 0.12)"
                  }}
                >
                  <motion.div 
                    className="relative h-40 bg-[#FFF6F2] flex items-center justify-center overflow-hidden"
                    whileHover={{
                      backgroundColor: '#FFE6E0'
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="text-[#571C1F]/40">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Price badge */}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full border border-[#571C1F]/20 text-xs font-bold text-[#571C1F]">
                      ₱{product.price.toFixed(2)}
                    </div>
                  </motion.div>
                  
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-[#571C1F] truncate">
                        {product.name}
                      </h3>
                      <div className="ml-1 flex-shrink-0">
                        {product.isPopular && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-[#003B25]/10 text-[#003B25]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Hot
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#571C1F]" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-1 text-xs text-[#571C1F]/70">
                          {product.category?.name || 'Coffee'}
                        </span>
                      </div>
                      {product.inStock ? (
                        <span className="text-xs text-[#003B25] flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          In Stock
                        </span>
                      ) : (
                        <span className="text-xs text-[#571C1F]/70 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProductCatalog;