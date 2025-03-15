import { motion } from 'framer-motion';
import { useEffect } from 'react';
import SalesTerminal from '../components/pos/SalesTerminal';

const POSPage = () => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#FFF6F2] h-full"
      style={{ backgroundColor: '#FFF6F2' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#FFF6F2] pt-0">
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
            <SalesTerminal />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default POSPage;