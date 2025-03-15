import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FiX } from 'react-icons/fi';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnClickOutside = true,
  variant = 'default',
  closeButton = true,
}) => {
  const modalRef = useRef(null);

  // Updated size classes - removed min-width constraints which can cause horizontal overflow
  // and added more responsive width handling
  const sizes = {
    sm: 'w-full max-w-sm',
    md: 'w-full max-w-md',
    lg: 'w-full max-w-lg',
    xl: 'w-full max-w-xl',
    '2xl': 'w-full max-w-2xl',
    '3xl': 'w-full max-w-3xl',
    '4xl': 'w-full max-w-4xl',
    '5xl': 'w-full max-w-5xl',
    'full': 'w-[95vw]',
  };
  
  // Updated variants with the design color scheme
  const variants = {
    default: 'bg-white dark:bg-gray-800',
    primary: 'bg-white dark:bg-gray-800 border-t-4 border-[#571C1F]',
    secondary: 'bg-white dark:bg-gray-800 border-t-4 border-[#003B25]',
    glass: 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-md'
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (closeOnClickOutside && modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };
  
  // Shimmer effect for modal
  const shimmerVariants = {
    hidden: { x: '-100%', opacity: 0 },
    visible: { 
      x: ['0%', '100%'], 
      opacity: [0, 0.05, 0],
      transition: {
        delay: 0.3,
        duration: 1.5,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
          onClick={handleBackdropClick}
        >
          {/* Enhanced backdrop with blur */}
          <motion.div
            className="fixed inset-0 bg-white/5 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          <motion.div
            ref={modalRef}
            className={`${sizes[size]} rounded-lg shadow-2xl z-10 flex flex-col max-h-[90vh] ${variants[variant]}`}
            variants={modalVariants}
            style={{ overflowX: 'hidden' }} // Force overflow-x hidden at style level
          >
            {/* Shimmer effect that runs once when modal opens */}
            <motion.div 
              className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
              aria-hidden="true"
              variants={shimmerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent transform opacity-0" />
            </motion.div>
            
            {title && (
              <div className="px-6 py-4 border-b border-[#571C1F]/20 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                <motion.h3 
                  className="text-lg font-medium text-[#571C1F] dark:text-gray-100"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {title}
                </motion.h3>
                
                {closeButton && (
                  <motion.button
                    onClick={onClose}
                    className="rounded-full p-1.5 text-gray-500 hover:text-[#571C1F] hover:bg-[#571C1F]/10 dark:hover:bg-gray-700 transition-colors ml-4"
                    aria-label="Close"
                    initial={{ opacity: 0, rotate: 45 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    whileHover={{ 
                      scale: 1.1,
                      backgroundColor: variant === 'primary' ? 'rgba(87, 28, 31, 0.1)' : 
                                      variant === 'secondary' ? 'rgba(0, 59, 37, 0.1)' : 
                                      'rgba(87, 28, 31, 0.05)'
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiX className="h-5 w-5" />
                  </motion.button>
                )}
              </div>
            )}
            
            <motion.div 
              className="px-6 py-5 overflow-y-auto flex-grow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{ maxWidth: '100%', overflowX: 'hidden' }} // Ensure content respects container width
            >
              <div className="w-full" style={{ maxWidth: '100%' }}>
                {children}
              </div>
            </motion.div>
            
            {footer && (
              <motion.div 
                className="px-6 py-4 border-t border-[#571C1F]/20 dark:border-gray-700 flex justify-end space-x-3 flex-shrink-0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {footer}
              </motion.div>
            )}
            
            {/* Only show this close button if there's no title bar */}
            {!title && closeButton && (
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 rounded-full p-1.5 text-gray-500 hover:text-[#571C1F] hover:bg-[#571C1F]/10 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
                initial={{ opacity: 0, rotate: 45 }}
                animate={{ opacity: 1, rotate: 0 }}
                whileHover={{ 
                  scale: 1.1, 
                  backgroundColor: 'rgba(87, 28, 31, 0.1)'
                }}
                whileTap={{ scale: 0.95 }}
              >
                <FiX className="h-5 w-5" />
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', 'full']),
  closeOnClickOutside: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'primary', 'secondary', 'glass']),
  closeButton: PropTypes.bool
};

export default Modal;