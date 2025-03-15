import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
// Import React Icons
import { FiArrowRight } from 'react-icons/fi';

const MotionButton = motion.button;

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  icon = null,
  iconPosition = 'left',
  hoverIcon = null,
  iconAnimationType = 'bounce',
  isLoading = false,
  ...props
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Base style with focus style improvements - removed default focus ring
  const baseStyle = 'relative inline-flex items-center justify-center rounded-md font-medium transition-all focus:outline-none focus-visible:outline-none overflow-hidden';
  
  // Updated theme colors with enhanced focus styles that match button colors
  const variants = {
    primary: 'bg-[#571C1F] text-white hover:bg-[#450E11] shadow-md hover:shadow-lg focus:ring-2 focus:ring-[#571C1F]/50 focus:ring-offset-2',
    secondary: 'bg-[#003B25] text-white hover:bg-[#002A1B] shadow-md hover:shadow-lg focus:ring-2 focus:ring-[#003B25]/50 focus:ring-offset-2',
    white: 'bg-white text-[#571C1F] hover:bg-gray-100 shadow-md hover:shadow-lg focus:ring-2 focus:ring-[#571C1F]/20 focus:ring-offset-2 border border-gray-200',
    outline: 'bg-transparent border border-[#571C1F]/30 text-[#571C1F] hover:bg-[#571C1F]/5 hover:border-[#571C1F] focus:ring-2 focus:ring-[#571C1F]/30 focus:ring-offset-1',
    ghost: 'bg-transparent text-[#571C1F] hover:bg-[#571C1F]/10 focus:ring-1 focus:ring-[#571C1F]/20',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2',
  };
  
  const sizes = {
    xs: 'text-xs px-2.5 py-1.5 rounded',
    sm: 'text-sm px-3 py-2 rounded-md',
    md: 'text-base px-4 py-2 rounded-md',
    lg: 'text-lg px-5 py-2.5 rounded-lg',
    xl: 'text-xl px-6 py-3 rounded-lg'
  };
  
  const disabledClass = disabled || isLoading ? 'opacity-60 cursor-not-allowed shadow-none pointer-events-none' : 'cursor-pointer';
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Animation variants
  const buttonVariants = {
    idle: { scale: 1 },
    hover: { 
      scale: 1.02,
      transition: { duration: 0.2 } 
    },
    tap: { 
      scale: 0.98,
      transition: { duration: 0.1 } 
    }
  };
  
  // Icon animation variants - defined separately like in the TokenInput example
  const iconVariants = {
    idle: { x: 0 },
    bounce: {
      y: [0, -4, 0],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    pulse: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    rotate: {
      rotate: [0, 15, 0, -15, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    slide: {
      x: [0, 5, 0],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    blink: {
      opacity: [1, 0.5, 1],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    loading: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };
  
  // Shimmer effect variants
  const shimmerVariants = {
    initial: { 
      x: '-100%',
    },
    animate: {
      x: '100%',
      transition: {
        repeat: Infinity,
        repeatDelay: 2,
        duration: 2,
        ease: 'easeInOut',
      }
    }
  };
  
  // Dynamically arrange icon and content based on iconPosition
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="w-4 h-4"
          >
            <svg className="w-full h-full text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </motion.div>
          {children}
        </div>
      );
    }
    
    // If we're using a right-aligned icon, always show it
    if (iconPosition === 'right') {
      return (
        <span className="flex items-center justify-center gap-2">
          <span>{children}</span>
          <motion.div
            className="inline-flex items-center text-white"
            animate={isHovered ? iconAnimationType : "idle"}
            variants={iconVariants}
          >
            {hoverIcon && isHovered ? hoverIcon : icon || <FiArrowRight size={18} />}
          </motion.div>
        </span>
      );
    }
    
    // If it's a left-aligned icon
    if (iconPosition === 'left' && (icon || hoverIcon)) {
      return (
        <span className="flex items-center justify-center gap-2">
          <motion.div
            className="inline-flex items-center text-white"
            animate={isHovered ? iconAnimationType : "idle"}
            variants={iconVariants}
          >
            {hoverIcon && isHovered ? hoverIcon : icon}
          </motion.div>
          <span>{children}</span>
        </span>
      );
    }
    
    // No icon case
    return children;
  };
  
  return (
    <MotionButton
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${widthClass} ${disabledClass} ${className}`}
      onClick={disabled || isLoading ? undefined : onClick}
      variants={buttonVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      onHoverStart={() => !disabled && !isLoading && setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{ WebkitTapHighlightColor: 'transparent' }} // Remove tap highlight on mobile
      {...props}
    >
      {/* Improved Shimmer effect overlay */}
      <motion.div 
        className="absolute inset-0 w-full h-full overflow-hidden rounded-md"
        aria-hidden="true"
      >
        <motion.div 
          className="absolute inset-0 -translate-x-full w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
        />
      </motion.div>
      
      {/* Button content */}
      <span className="relative z-10">
        {renderContent()}
      </span>
    </MotionButton>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['primary', 'secondary', 'white', 'outline', 'ghost', 'danger']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.string,
  onClick: PropTypes.func,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  hoverIcon: PropTypes.node,
  iconAnimationType: PropTypes.oneOf(['bounce', 'pulse', 'rotate', 'slide', 'blink']),
  isLoading: PropTypes.bool,
};

export default Button;