import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

export const Spinner = ({ 
  size = 'md', 
  color = '#571C1F',
  variant = 'default',
  thickness = 'normal',
  speed = 'normal',
  label = '',
  className = ''
}) => {
  // Define size classes
  const sizeClasses = {
    xs: { outer: 'h-3 w-3', inner: 'h-1.5 w-1.5', text: 'text-xs' },
    sm: { outer: 'h-4 w-4', inner: 'h-2 w-2', text: 'text-xs' },
    md: { outer: 'h-8 w-8', inner: 'h-4 w-4', text: 'text-sm' },
    lg: { outer: 'h-12 w-12', inner: 'h-6 w-6', text: 'text-base' },
    xl: { outer: 'h-16 w-16', inner: 'h-8 w-8', text: 'text-lg' },
    '2xl': { outer: 'h-24 w-24', inner: 'h-12 w-12', text: 'text-xl' }
  };

  // Define thickness variants
  const thicknessValues = {
    thin: '1.5px',
    normal: '2px',
    thick: '3px',
    'extra-thick': '4px'
  };

  // Define animation speed variants
  const speedValues = {
    slow: 2.5,
    normal: 1.5,
    fast: 0.8,
    'extra-fast': 0.5
  };

  // Get the appropriate size class or default to medium
  const spinnerSize = sizeClasses[size] || sizeClasses.md;
  const borderWidth = thicknessValues[thickness] || thicknessValues.normal;
  const animationDuration = speedValues[speed] || speedValues.normal;

  // Calculate the center of the spinner for positioning the inner dot
  const innerSizeWidth = parseInt(spinnerSize.inner.split(' ')[1].replace('w-', ''));
  const innerSizeHeight = parseInt(spinnerSize.inner.split(' ')[0].replace('h-', ''));

  // Determine which spinner variant to render
  const renderSpinner = () => {
    switch(variant) {
      case 'pulse':
        return (
          <div className="flex flex-col items-center justify-center">
            <motion.div
              className={`${spinnerSize.outer} relative`}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                repeat: Infinity,
                duration: animationDuration,
                ease: "easeInOut"
              }}
            >
              <div 
                className="absolute inset-0 rounded-full" 
                style={{ backgroundColor: color }}
              ></div>
            </motion.div>
            {label && (
              <div className={`mt-2 ${spinnerSize.text} text-center font-medium`} style={{ color }}>
                {label}
              </div>
            )}
          </div>
        );
      
      case 'dots':
        return (
          <div className="flex flex-col items-center">
            <div className="flex space-x-2">
              {[0, 1, 2].map(i => (
                <motion.div 
                  key={i}
                  className={`rounded-full ${spinnerSize.inner}`}
                  style={{ backgroundColor: color }}
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: animationDuration / 1.5,
                    delay: i * 0.15,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
            {label && (
              <div className={`mt-2 ${spinnerSize.text} text-center font-medium`} style={{ color }}>
                {label}
              </div>
            )}
          </div>
        );

      case 'wave':
        return (
          <div className="flex flex-col items-center">
            <div className="flex items-end space-x-1">
              {[0, 1, 2, 3, 4].map(i => (
                <motion.div 
                  key={i}
                  className={`w-1 rounded-full`}
                  style={{ 
                    backgroundColor: color, 
                    height: i === 0 || i === 4 ? '30%' : i === 1 || i === 3 ? '60%' : '100%',
                    maxHeight: spinnerSize.outer.split(' ')[0].replace('h-', '') + 'rem'
                  }}
                  animate={{
                    height: [
                      i === 0 || i === 4 ? '30%' : i === 1 || i === 3 ? '60%' : '100%',
                      i === 0 || i === 4 ? '100%' : i === 1 || i === 3 ? '30%' : '60%',
                      i === 0 || i === 4 ? '60%' : i === 1 || i === 3 ? '100%' : '30%',
                      i === 0 || i === 4 ? '30%' : i === 1 || i === 3 ? '60%' : '100%'
                    ]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: animationDuration * 1.2,
                    delay: i * 0.1,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
            {label && (
              <div className={`mt-2 ${spinnerSize.text} text-center font-medium`} style={{ color }}>
                {label}
              </div>
            )}
          </div>
        );

      case 'ring':
        return (
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <motion.div
                className={`${spinnerSize.outer}`}
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Infinity,
                  duration: animationDuration,
                  ease: "linear"
                }}
              >
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{ 
                    borderWidth, 
                    borderColor: `${color}40`,
                    borderStyle: 'solid'
                  }}
                ></div>
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{ 
                    borderWidth, 
                    borderLeftColor: 'transparent',
                    borderBottomColor: 'transparent',
                    borderRightColor: color,
                    borderTopColor: color,
                    borderStyle: 'solid'
                  }}
                ></div>
              </motion.div>
            </div>
            {label && (
              <div className={`mt-2 ${spinnerSize.text} text-center font-medium`} style={{ color }}>
                {label}
              </div>
            )}
          </div>
        );

      // Default spinner (original enhanced design)
      default:
        return (
          <div className="flex flex-col items-center justify-center">
            <motion.div
              className={`relative ${spinnerSize.outer}`}
              animate={{ rotate: 360 }}
              transition={{
                repeat: Infinity,
                duration: animationDuration,
                ease: "linear"
              }}
            >
              {/* Glow effect for larger spinners */}
              {(size === 'lg' || size === 'xl' || size === '2xl') && (
                <motion.div 
                  className="absolute inset-0 rounded-full blur-sm"
                  style={{ backgroundColor: `${color}20` }}
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: animationDuration * 1.5,
                    ease: "easeInOut"
                  }}
                />
              )}
              
              {/* Outer circle with subtle gradient */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{ 
                  borderWidth, 
                  borderColor: `${color}30`, 
                  borderStyle: 'solid',
                  background: `radial-gradient(circle at center, ${color}05, transparent 70%)`
                }}
              ></div>
              
              {/* Spinner arc with gradient effect */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{ 
                  borderWidth,
                  borderTopColor: 'transparent',
                  borderLeftColor: 'transparent',
                  borderBottomColor: color,
                  borderRightColor: color,
                  borderStyle: 'solid'
                }}
              ></div>
              
              {/* Inner dot with pulsing animation */}
              <motion.div
                className={`absolute rounded-full ${spinnerSize.inner}`}
                style={{ 
                  backgroundColor: color,
                  boxShadow: `0 0 8px 0 ${color}70`,
                  top: '50%',
                  left: '50%',
                  marginLeft: `-${innerSizeWidth / 2}rem`,
                  marginTop: `-${innerSizeHeight / 2}rem`
                }}
                animate={{
                  scale: [0.8, 1.15, 0.8],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  repeat: Infinity,
                  duration: animationDuration,
                  ease: "easeInOut"
                }}
              ></motion.div>
            </motion.div>
            
            {/* Optional label text */}
            {label && (
              <div className={`mt-2 ${spinnerSize.text} text-center font-medium`} style={{ color }}>
                {label}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {renderSpinner()}
    </div>
  );
};

Spinner.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  color: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'dots', 'pulse', 'ring', 'wave']),
  thickness: PropTypes.oneOf(['thin', 'normal', 'thick', 'extra-thick']),
  speed: PropTypes.oneOf(['slow', 'normal', 'fast', 'extra-fast']),
  label: PropTypes.string,
  className: PropTypes.string
};

// For convenience, you can also export the specific sizes as named components
export const XSmallSpinner = (props) => <Spinner size="xs" {...props} />;
export const SmallSpinner = (props) => <Spinner size="sm" {...props} />;
export const MediumSpinner = (props) => <Spinner size="md" {...props} />;
export const LargeSpinner = (props) => <Spinner size="lg" {...props} />;
export const ExtraLargeSpinner = (props) => <Spinner size="xl" {...props} />;
export const DoubleExtraLargeSpinner = (props) => <Spinner size="2xl" {...props} />;

// Named variants for easier imports
export const DotsSpinner = (props) => <Spinner variant="dots" {...props} />;
export const PulseSpinner = (props) => <Spinner variant="pulse" {...props} />;
export const RingSpinner = (props) => <Spinner variant="ring" {...props} />;
export const WaveSpinner = (props) => <Spinner variant="wave" {...props} />;

export default Spinner;