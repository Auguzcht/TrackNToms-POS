import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useState } from 'react';

const Card = ({
  children,
  className = '',
  title,
  titleClass = '',
  padding = true,
  bordered = true,
  shadow = true,
  hoverable = false,
  animate = false,
  variant = 'default',
  onClick,
  icon = null,
  valueColor = 'text-[#571C1F]',
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Determine component type based on animation requirement
  const Component = animate ? motion.div : 'div';
  const HeaderComponent = animate ? motion.div : 'div';
  const ContentComponent = animate ? motion.div : 'div';

  // Define variant styles
  const variantStyles = {
    default: 'bg-white dark:bg-dark-lighter',
    primary: 'bg-gradient-to-br from-[#571C1F]/5 to-[#571C1F]/10 dark:from-[#571C1F]/10 dark:to-[#571C1F]/20',
    secondary: 'bg-gradient-to-br from-[#003B25]/5 to-[#003B25]/10 dark:from-[#003B25]/10 dark:to-[#003B25]/20',
    transparent: 'bg-white/80 dark:bg-dark-lighter/80 backdrop-blur-sm',
    highlight: bordered ? 'bg-white dark:bg-dark-lighter border-[#571C1F]/30 dark:border-[#571C1F]/20' : 'bg-white dark:bg-dark-lighter'
  };

  // Define shadow styles
  const shadowStyles = {
    true: 'shadow-sm',
    hover: hoverable ? 'transition-shadow duration-300' : 'shadow-sm',
    lg: 'shadow-md',
    xl: 'shadow-lg',
    none: ''
  };

  // Define animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 260, 
        damping: 20 
      } 
    },
    hover: hoverable ? {
      y: -4,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      transition: { duration: 0.2, ease: "easeOut" }
    } : {}
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24,
        delay: 0.1
      } 
    }
  };

  const contentVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        delay: 0.2,
        duration: 0.4
      } 
    }
  };

  // Define the glow effect animation
  const glowVariants = {
    initial: { opacity: 0 },
    hover: { 
      opacity: 0.6, 
      transition: { duration: 0.3 } 
    }
  };

  const getShadowStyle = () => {
    if (isHovered && hoverable && typeof shadow === 'boolean') return 'shadow-lg';
    return shadowStyles[shadow] || shadowStyles.true;
  };

  return (
    <Component
      className={`
        ${variantStyles[variant]} 
        ${bordered ? 'border border-gray-200 dark:border-gray-700' : ''} 
        ${getShadowStyle()}
        rounded-lg overflow-hidden
        ${hoverable ? 'cursor-pointer transform transition-all duration-200' : ''}
        ${className}
      `}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      variants={animate ? cardVariants : undefined}
      initial={animate ? "hidden" : undefined}
      animate={animate ? "visible" : undefined}
      whileHover={hoverable && animate ? "hover" : undefined}
      {...props}
    >
      {/* Subtle glow effect on hover for hoverable cards */}
      {hoverable && animate && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none z-0"
          initial="initial"
          animate={isHovered ? "hover" : "initial"}
          variants={glowVariants}
        >
          <div 
            className="absolute inset-0 rounded-lg blur-md"
            style={{ 
              background: variant === 'primary' || variant === 'highlight' ? 
                'radial-gradient(circle at center, rgba(87, 28, 31, 0.3) 0%, transparent 70%)' : 
                variant === 'secondary' ? 
                  'radial-gradient(circle at center, rgba(0, 59, 37, 0.3) 0%, transparent 70%)' :
                  'radial-gradient(circle at center, rgba(87, 28, 31, 0.2) 0%, rgba(0, 59, 37, 0.1) 70%, transparent 100%)'
            }}
          />
        </motion.div>
      )}

      {/* Card title with icon support */}
      {title && (
        <HeaderComponent 
          className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-medium flex items-center ${valueColor} ${titleClass}`}
          variants={animate ? titleVariants : undefined}
        >
          {icon && <span className="mr-2">{icon}</span>}
          {title}
        </HeaderComponent>
      )}
      
      {/* Card content */}
      <ContentComponent 
        className={`${padding ? 'p-4' : ''} relative z-10`}
        variants={animate ? contentVariants : undefined}
      >
        {children}
      </ContentComponent>

      {/* Subtle shimmer effect for hoverable cards */}
      {hoverable && (
        <motion.div 
          className="absolute inset-0 w-full h-full overflow-hidden rounded-lg z-0"
          initial={{ opacity: 0 }}
          animate={isHovered ? { opacity: 0.4 } : { opacity: 0 }}
          transition={{ duration: 0.3 }}
          aria-hidden="true"
        >
          <motion.div 
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 transform"
            animate={isHovered ? {
              x: ['0%', '200%'],
              opacity: [0, 0.2, 0],
              transition: {
                duration: 1.5,
                ease: 'easeInOut',
              }
            } : {}}
          />
        </motion.div>
      )}
    </Component>
  );
};

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  title: PropTypes.node,
  titleClass: PropTypes.string,
  padding: PropTypes.bool,
  bordered: PropTypes.bool,
  shadow: PropTypes.oneOf([true, false, 'hover', 'lg', 'xl', 'none']),
  hoverable: PropTypes.bool,
  animate: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'primary', 'secondary', 'transparent', 'highlight']),
  onClick: PropTypes.func,
  icon: PropTypes.node,
  valueColor: PropTypes.string
};

// Create a CardGrid component for consistent grid layouts
export const CardGrid = ({ 
  children, 
  cols = { default: 1, sm: 2, md: 3, lg: 4 }, 
  gap = 4,
  className = '', 
  ...props 
}) => {
  // Calculate the column classes based on the cols prop
  const getColClasses = () => {
    const colSizes = {
      default: cols.default || 1,
      sm: cols.sm || cols.default || 1,
      md: cols.md || cols.sm || cols.default || 1,
      lg: cols.lg || cols.md || cols.sm || cols.default || 1,
      xl: cols.xl || cols.lg || cols.md || cols.sm || cols.default || 1,
    };

    return `grid grid-cols-${colSizes.default} sm:grid-cols-${colSizes.sm} md:grid-cols-${colSizes.md} lg:grid-cols-${colSizes.lg} xl:grid-cols-${colSizes.xl} gap-${gap}`;
  };

  return (
    <div className={`${getColClasses()} ${className}`} {...props}>
      {children}
    </div>
  );
};

CardGrid.propTypes = {
  children: PropTypes.node,
  cols: PropTypes.shape({
    default: PropTypes.number,
    sm: PropTypes.number,
    md: PropTypes.number,
    lg: PropTypes.number,
    xl: PropTypes.number,
  }),
  gap: PropTypes.number,
  className: PropTypes.string
};

export default Card;