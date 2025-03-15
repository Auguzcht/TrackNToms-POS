import { motion } from 'framer-motion';
import Card from '../common/Card';
import { useEffect, useState } from 'react';

const StatsCard = ({ 
  title, 
  value, 
  valuePrefix = '', 
  valueSuffix = '',
  change = null, 
  loading = false,
  icon = 'chart-bar',
  valueColor = 'text-gray-900 dark:text-[#571C1F]' 
}) => {
  // Format the number with commas
  const formattedValue = value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // State for animated count
  const [count, setCount] = useState(0);
  
  // Animated counter effect
  useEffect(() => {
    if (!loading && value) {
      let start = 0;
      const end = parseInt(value);
      const duration = 1500;
      const incrementTime = 20;
      const totalSteps = duration / incrementTime;
      const incrementValue = end / totalSteps;
      
      const timer = setInterval(() => {
        start += incrementValue;
        setCount(Math.min(Math.floor(start), end));
        
        if (start >= end) {
          clearInterval(timer);
          setCount(end);
        }
      }, incrementTime);
      
      return () => clearInterval(timer);
    }
  }, [value, loading]);
  
  // Determine if change is positive, negative, or neutral
  const isPositive = change > 0;
  const isNegative = change < 0;
  const changeColor = isPositive 
    ? 'text-[#003B25]' 
    : isNegative 
      ? 'text-[#571C1F]' 
      : 'text-gray-500';
  
  return (
    <motion.div
      whileHover={{ 
        y: -5,
        boxShadow: "0 12px 30px -8px rgba(87, 28, 31, 0.15), 0 10px 15px -3px rgba(87, 28, 31, 0.08)",
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full relative"
    >
      {/* Subtle background glow effect */}
      <motion.div
        className="absolute inset-0 rounded-lg opacity-0"
        initial={{ opacity: 0 }}
        whileHover={{ 
          opacity: 0.5,
          transition: { duration: 0.5 }
        }}
        style={{
          background: isPositive 
            ? 'radial-gradient(circle at center, rgba(0, 59, 37, 0.12) 0%, rgba(0, 59, 37, 0) 70%)' 
            : isNegative 
              ? 'radial-gradient(circle at center, rgba(87, 28, 31, 0.12) 0%, rgba(87, 28, 31, 0) 70%)'
              : 'radial-gradient(circle at center, rgba(87, 28, 31, 0.08) 0%, rgba(87, 28, 31, 0) 70%)'
        }}
      />
      
      <Card className="h-full bg-white backdrop-blur-sm bg-white/95 border border-[#571C1F]/10 hover:border-[#571C1F]/30 transition-all duration-300 overflow-hidden relative">
        {/* Animated gradient accent */}
        <motion.div 
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-[#571C1F] to-[#003B25]"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        
        <div className="flex justify-between items-start">
          <div className="z-10">
            <motion.h3 
              className="text-sm font-medium text-[#571C1F]/80"
              whileHover={{ x: 2 }}
            >
              {title}
            </motion.h3>
            
            {loading ? (
              <div className="mt-2 animate-pulse h-8 w-24 bg-[#FFF6F2] rounded"></div>
            ) : (
              <div className="mt-2 flex items-baseline">
                <motion.p 
                  className={`text-2xl font-semibold ${valueColor}`}
                  initial={{ scale: 0.9, filter: "blur(3px)" }}
                  animate={{ 
                    scale: 1, 
                    filter: "blur(0px)",
                    textShadow: "0 1px 2px rgba(87, 28, 31, 0.1)"
                  }}
                  transition={{ 
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.1
                  }}
                >
                  {valuePrefix}{loading ? '0' : formattedValue}{valueSuffix}
                </motion.p>
                
                {change !== null && (
                  <motion.span 
                    className={`ml-2 text-sm font-medium ${changeColor} flex items-center`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {isPositive && (
                      <motion.div className="relative">
                        <motion.svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-3.5 w-3.5 mr-1" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                          animate={{ 
                            y: [0, -2, 0],
                            transition: { 
                              repeat: Infinity, 
                              repeatType: "reverse", 
                              duration: 1.5
                            } 
                          }}
                        >
                          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </motion.svg>
                        <motion.div 
                          className="absolute inset-0 bg-[#003B25]/10 rounded-full blur-sm"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.7, 0, 0.7]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </motion.div>
                    )}
                    {isNegative && (
                      <motion.div className="relative">
                        <motion.svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-3.5 w-3.5 mr-1" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                          animate={{ 
                            y: [0, 2, 0],
                            transition: { 
                              repeat: Infinity, 
                              repeatType: "reverse", 
                              duration: 1.5
                            } 
                          }}
                        >
                          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </motion.svg>
                        <motion.div 
                          className="absolute inset-0 bg-[#571C1F]/10 rounded-full blur-sm"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.7, 0, 0.7]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </motion.div>
                    )}
                    {Math.abs(change)}%
                  </motion.span>
                )}
              </div>
            )}
            
            {/* Horizontal pulse line */}
            <motion.div 
              className={`h-0.5 mt-3 rounded-full ${isPositive ? 'bg-[#003B25]/20' : isNegative ? 'bg-[#571C1F]/20' : 'bg-gray-200'}`}
              initial={{ width: 0 }}
              animate={{ width: "40%" }}
              transition={{
                duration: 1,
                delay: 0.6,
              }}
            >
              <motion.div 
                className={`h-full rounded-full ${isPositive ? 'bg-[#003B25]' : isNegative ? 'bg-[#571C1F]' : 'bg-gray-400'}`}
                animate={{
                  width: ["0%", "100%", "0%"],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </div>
          
          <motion.div 
            className="p-2.5 bg-[#FFF6F2] rounded-md border border-[#571C1F]/20 shadow-md relative overflow-hidden z-10"
            whileHover={{ 
              scale: 1.1, 
              rotate: [0, -5, 5, -5, 0],
              boxShadow: "0 5px 15px -3px rgba(87, 28, 31, 0.3)",
              transition: { duration: 0.5 }
            }}
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20,
              delay: 0.2
            }}
          >
            {/* Radial gradient background inside icon container */}
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  'radial-gradient(circle at center, rgba(87, 28, 31, 0.1) 0%, transparent 60%)',
                  'radial-gradient(circle at center, rgba(0, 59, 37, 0.05) 0%, transparent 60%)',
                  'radial-gradient(circle at center, rgba(87, 28, 31, 0.1) 0%, transparent 60%)'
                ]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            {getIcon(icon)}
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};

// Helper function to render different icons
const getIcon = (iconName) => {
  switch (iconName) {
    case 'cash':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'shopping-bag':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      );
    case 'cube':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case 'exclamation-circle':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'chart-bar':
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
  }
};

export default StatsCard;