import { motion, AnimatePresence } from 'framer-motion';
import Card from '../common/Card';
import Button from '../common/Button';
import { useEffect } from 'react';

const OrderBuilder = ({
  order = { items: [], subtotal: 0, tax: 0, total: 0 }, // Default value for order
  onUpdateQuantity,
  onRemoveItem,
  onClearOrder,
  onCheckout,
  onVoidSale,
  lastCompletedSale
}) => {
  // Check if order and order.items exist before accessing length
  const hasItems = order && order.items && order.items.length > 0;
  // Define checkout height to create proper boundary
  const checkoutHeight = 200;
  
  // Log when onCheckout changes for debugging
  useEffect(() => {
    console.log("OrderBuilder received onCheckout:", !!onCheckout);
  }, [onCheckout]);
  
  // Create a dedicated handler to ensure the click is properly handled
  const handleCheckout = (e) => {
    console.log("Checkout button clicked");
    
    // If the custom Button component isn't working properly, this will ensure the handler fires
    if (typeof onCheckout === 'function') {
      onCheckout();
    }
  };
  
  return (
    <Card className="h-full flex flex-col">
      {/* Header section with enhanced styling */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#571C1F]/10 flex-shrink-0">
        <h2 className="text-lg font-bold text-[#571C1F] flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-[#571C1F]/80" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
            <path d="M16 16a2 2 0 11-4 0 2 2 0 014 0zM8 16a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Current Order
        </h2>
        
        {/* Modified Clear button to always show with disabled state when no items */}
        <Button
          variant="ghost"
          size="sm"
          onClick={hasItems ? onClearOrder : undefined}
          disabled={!hasItems}
          className={`hover:bg-[#FFF6F2] group ${hasItems ? 'text-[#571C1F]/70 hover:text-[#571C1F]' : 'text-[#571C1F]/30 cursor-not-allowed'}`}
        >
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${hasItems ? 'group-hover:text-[#571C1F]' : 'text-[#571C1F]/30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </span>
        </Button>
      </div>
      
      {/* Scrollable content with enhanced styling */}
      <div 
        className="overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#571C1F]/10 scrollbar-track-transparent" 
        style={{ 
          height: `calc(618px - 65px - ${checkoutHeight}px)`,
          maxHeight: `calc(618px - 65px - ${checkoutHeight}px)`,
          paddingBottom: "10px"
        }}
      >
        {!hasItems ? (
          <div className="h-full flex flex-col items-center justify-center text-[#571C1F]/50 p-6">
            <div className="bg-[#FFF6F2]/70 rounded-full p-5 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium">No items in the order yet</p>
            <p className="text-xs mt-1 text-center px-6">Click on products from the catalog to add them to your order</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-2.5">
              {order.items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-gradient-to-r from-[#FFF6F2] to-[#FFFBFA] p-3 rounded-lg border border-[#571C1F]/10 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-2 max-w-[85%]">
                      <div className="w-1 h-1 rounded-full bg-[#571C1F]/40 mt-2 group-hover:bg-[#571C1F]"></div>
                      <span className="font-medium text-[#571C1F] line-clamp-1">
                        {item.name}
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onRemoveItem(item.id)}
                      className="text-[#571C1F]/40 hover:text-[#571C1F] transition-colors p-0.5 rounded-full hover:bg-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center space-x-1 bg-white/50 rounded-lg p-0.5">
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-[#571C1F]/20 text-[#571C1F] transition-colors hover:bg-[#FFE6E0] shadow-sm font-bold text-lg"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </motion.button>
                      
                      <motion.span
                        key={item.quantity}
                        initial={{ scale: 1.2, opacity: 0.7 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-[#571C1F] min-w-[24px] text-center font-medium"
                      >
                        {item.quantity}
                      </motion.span>
                      
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-[#571C1F]/20 text-[#571C1F] transition-colors hover:bg-[#FFE6E0] shadow-sm font-bold text-lg"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </motion.button>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-[#571C1F]/70">
                        ₱{item.price.toFixed(2)} × {item.quantity}
                      </div>
                      <motion.div 
                        key={item.subtotal}
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        className="font-medium text-[#571C1F]"
                      >
                        ₱{item.subtotal.toFixed(2)}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
      
      {/* Enhanced visual separator with drop shadow */}
      <div className="border-t border-[#571C1F]/10 h-0 flex-shrink-0 shadow-sm"></div>
      
      {/* Enhanced checkout section with improved styling */}
      <div className="pt-4 pb-0 bg-white rounded-b-lg flex-shrink-0" style={{ height: `${checkoutHeight}px` }}>
        <div className="space-y-2 mb-4 px-3">
          <div className="flex justify-between text-sm">
            <span className="text-[#571C1F]/70">Subtotal</span>
            <motion.span 
              key={order.subtotal}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              className="text-[#571C1F] font-medium"
            >
              ₱{(order.subtotal || 0).toFixed(2)}
            </motion.span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#571C1F]/70">Tax (12%)</span>
            <span className="text-[#571C1F]">₱{(order.tax || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-medium text-base border-t border-dashed border-[#571C1F]/10 mt-1.5 pt-2">
            <span className="text-[#571C1F]">Total</span>
            <motion.span 
              key={order.total}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-[#571C1F] font-bold"
            >
              ₱{(order.total || 0).toFixed(2)}
            </motion.span>
          </div>
        </div>
        
        {/* This is the key part we're changing */}
        <div className="px-3">
          {hasItems ? (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckout}
              className="w-full py-3 px-4 rounded-lg font-medium text-white shadow-md bg-[#571C1F] hover:bg-[#4A1519] flex items-center justify-center"
            >
              <span>Checkout</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </motion.button>
          ) : (
            <motion.button 
              disabled
              className="w-full py-3 px-4 rounded-lg font-medium text-white shadow-md bg-[#571C1F]/40 cursor-not-allowed flex items-center justify-center"
            >
              <span>Checkout</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </motion.button>
          )}
        </div>
      </div>
      
      {/* Add a void sale button near the checkout button */}
      <div className="px-3 pt-2 pb-3 mt-auto">
        <div className="flex justify-between mb-2">
          <button 
            onClick={onVoidSale}
            className="px-3 py-1.5 text-sm font-medium text-[#571C1F] hover:bg-[#FFF6F2] rounded-md border border-[#571C1F]/20 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {lastCompletedSale ? 'Void Last Sale' : 'Void Sale'}
          </button>
          
          <button
            onClick={onClearOrder}
            disabled={!hasItems}
            className={`px-3 py-1.5 text-sm font-medium rounded-md border flex items-center ${
              hasItems 
                ? 'text-[#571C1F] border-[#571C1F]/20 hover:bg-[#FFF6F2]' 
                : 'text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </button>
        </div>

        <button
          onClick={onCheckout}
          disabled={!hasItems}
          className={`w-full py-3 px-4 rounded-lg font-medium shadow-md flex items-center justify-center ${
            hasItems 
              ? 'text-white bg-[#571C1F] hover:bg-[#4A1519]' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>Checkout</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </Card>
  );
};

export default OrderBuilder;