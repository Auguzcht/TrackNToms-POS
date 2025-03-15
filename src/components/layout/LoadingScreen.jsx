import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import tomsLogo from '../../assets/TomNToms-Logo-2.png';

const LoadingScreen = ({ finishLoading, isInitialLoadingComplete = false }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  useEffect(() => {
    const timeout = setTimeout(() => setIsMounted(true), 10);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Start exit animation when initialLoading is complete (if provided)
    const shouldStartExit = isInitialLoadingComplete !== undefined ? 
      isInitialLoadingComplete : true;
    
    let exitTimer, loadingTimer;
    
    if (shouldStartExit) {
      exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 2800);
      
      loadingTimer = setTimeout(() => {
        finishLoading();
      }, 3200); // Extended to show exit animation
    }
    
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(loadingTimer);
    };
  }, [finishLoading, isInitialLoadingComplete]);

  // Pre-generate random positions for coffee beans to ensure consistency
  const beanProps = useMemo(() => {
    return Array.from({ length: 30 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: 0.2 + (Math.random() * 0.3),
      scale: 0.5 + (Math.random() * 0.5),
      rotate: 45 + (Math.random() * 90),
      exitY: (Math.random() > 0.5 ? -40 : 40) * (Math.random() + 0.5),
      exitX: (Math.random() > 0.5 ? -40 : 40) * (Math.random() + 0.5),
    }));
  }, []);

  // Steam animation variants
  const steamVariants = {
    initial: { opacity: 0, y: 0 },
    animate: {
      opacity: [0, 0.7, 0],
      y: -20,
      transition: {
        repeat: Infinity,
        duration: 2,
        repeatType: "loop",
        ease: "easeInOut"
      }
    },
    exit: {
      opacity: 0,
      y: -30,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  // Coffee bean variants - now using pre-generated random values
  const beanVariants = {
    initial: { opacity: 0, scale: 0, rotate: 45 },
    animate: (i) => ({
      opacity: beanProps[i].opacity,
      scale: beanProps[i].scale,
      rotate: beanProps[i].rotate,
      transition: {
        delay: i * 0.04,
        duration: 0.8 + (Math.random() * 0.4),
        ease: "easeOut"
      }
    }),
    hover: {
      rotate: '+=15deg',
      scale: 1.05,
      transition: { duration: 0.3 }
    },
    exit: (i) => ({
      opacity: 0,
      scale: 0,
      y: beanProps[i].exitY,
      x: beanProps[i].exitX,
      transition: {
        delay: i * 0.02,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  // Text character animation
  const textVariants = {
    hidden: { opacity: 0 },
    visible: (i) => ({
      opacity: 1,
      transition: {
        delay: 0.6 + (i * 0.05),
        duration: 0.3
      }
    }),
    exit: (i) => ({
      opacity: 0,
      y: 20,
      transition: {
        delay: i * 0.01,
        duration: 0.2,
        ease: "easeIn"
      }
    })
  };

  // Loading text
  const loadingText = "Loading TrackNToms POS...";
  const subText = "Preparing your coffee experience";

  // Wipe animation variants
  const wipeVariants = {
    initial: { scaleX: 0, originX: 0 },
    animate: { scaleX: 0 },
    exit: {
      scaleX: 1, 
      transition: { 
        duration: 0.4, 
        ease: "circOut" 
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!isExiting ? (
        <motion.div 
          key="loading-screen"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FFF6F2] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Subtle waves animation */}
            <motion.div 
              className="absolute inset-0 opacity-10"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{
                repeat: Infinity,
                repeatType: "mirror",
                duration: 15,
                ease: "linear"
              }}
              style={{
                backgroundImage: 'radial-gradient(circle at center, rgba(87, 28, 31, 0.2) 0%, transparent 50%)',
                backgroundSize: '120vw 120vh',
              }}
            />
            
            {/* Coffee bean particles - now with consistent positions */}
            <div className="absolute -inset-[10%] opacity-10">
              {beanProps.map((bean, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-[#571C1F] w-8 h-12"
                  style={{
                    top: `${bean.top}%`,
                    left: `${bean.left}%`,
                  }}
                  variants={beanVariants}
                  custom={i}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  whileHover="hover"
                />
              ))}
            </div>
          </div>

          {/* Rest of your loading screen content remains unchanged */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ 
              opacity: 0, 
              y: -30,
              transition: { duration: 0.4, ease: "easeInOut" }
            }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center relative z-10"
          >
            {/* Logo with coffee steam */}
            <div className="relative mb-8">
              {/* Steam animation */}
              <motion.div 
                className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex justify-center space-x-1.5"
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className={`w-1 h-${3 + (i % 2)} bg-[#571C1F]/40 rounded-full`}
                    variants={steamVariants}
                    transition={{ 
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </motion.div>
              
              {/* Logo container with glowing effect */}
              <div className="relative w-24 h-24 mb-6 flex justify-center items-center">
                {/* Pulsing glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[#571C1F] to-[#003B25] opacity-20 blur-lg"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.15, 0.25, 0.15]
                  }}
                  exit={{
                    scale: 1.5,
                    opacity: 0,
                    transition: { duration: 0.5 }
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                />
                
                {/* Secondary glow */}
                <motion.div
                  className="absolute inset-2 rounded-full bg-gradient-to-tr from-[#571C1F]/40 to-[#003B25]/30 opacity-30 blur-md"
                  animate={{ 
                    rotate: [0, 180],
                    scale: [0.95, 1.05, 0.95],
                  }}
                  exit={{
                    rotate: 360,
                    scale: 0,
                    opacity: 0,
                    transition: { duration: 0.5 }
                  }}
                  transition={{
                    rotate: {
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear"
                    },
                    scale: {
                      duration: 4,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }
                  }}
                />
                
                {/* Logo with entrance animation */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ 
                    scale: 1.2, 
                    opacity: 0,
                    y: -20,
                    transition: {
                      type: "spring",
                      stiffness: 100,
                      damping: 10
                    }
                  }}
                  transition={{ 
                    delay: 0.3,
                    duration: 0.8,
                    type: "spring",
                    stiffness: 100
                  }}
                >
                  <img src={tomsLogo} alt="Tom N Toms Logo" className="w-48 relative z-10" />
                </motion.div>
              </div>
            </div>
            
            {/* Progress bar with shimmer effect */}
            <motion.div
              className="w-72 h-2.5 bg-[#003B25]/10 rounded-full overflow-hidden mt-4 relative"
              initial={{ opacity: 0, width: "60%" }}
              animate={{ opacity: 1, width: "72%" }}
              exit={{ 
                width: "60%", 
                opacity: 0, 
                transition: { duration: 0.3 } 
              }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {/* Progress fill */}
              <motion.div
                className="h-full bg-gradient-to-r from-[#571C1F]/90 to-[#571C1F] rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                exit={{ width: "100%" }}
                transition={{ 
                  duration: 2.6,
                  ease: "easeInOut"
                }}
              />
              
              {/* Shimmer effect with improved continuous animation */}
              <motion.div
                className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                animate={{
                  left: ["-100%", "200%"],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.2,
                  ease: "linear",
                  repeatDelay: 0.3
                }}
              />
            </motion.div>
            
            {/* Text with character-by-character animation */}
            <div className="overflow-hidden mt-5">
              <div className="flex justify-center">
                {loadingText.split("").map((char, i) => (
                  <motion.span
                    key={i}
                    className="text-[#003B25] font-medium text-base inline-block"
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={i}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </div>
            </div>
            
            {/* Subtitle with fade in */}
            <motion.p
              className="text-[#571C1F]/70 mt-2 text-xs font-light tracking-wide"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ 
                opacity: 0, 
                y: 10,
                transition: { duration: 0.2 } 
              }}
              transition={{ 
                delay: 1,
                duration: 0.5
              }}
            >
              {subText}
            </motion.p>

            {/* Dots animation */}
            <div className="flex space-x-2 mt-8">
              {[0, 1, 2].map(i => (
                <motion.div 
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#571C1F]/50"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  exit={{
                    scale: 0,
                    opacity: 0,
                    transition: { duration: 0.2, delay: i * 0.1 }
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </motion.div>
          
          {/* Exit wipe effect - horizontal reveal */}
          <motion.div 
            className="fixed inset-0 bg-[#571C1F] z-60 transform origin-left"
            variants={wipeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          />
          
          {/* Second wipe effect - slightly delayed */}
          <motion.div 
            className="fixed inset-0 bg-[#003B25] z-50 transform origin-left"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 0 }}
            exit={{ 
              scaleX: 1, 
              transition: { 
                duration: 0.4, 
                ease: "circOut",
                delay: 0.1
              }
            }}
          />
        </motion.div>
      ) : (
        <motion.div 
          key="exit-screen"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFF6F2]"
          initial={{ opacity: 1 }}
          animate={{ 
            opacity: 0,
            transition: { 
              delay: 0.3, 
              duration: 0.3 
            }
          }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.2, 1],
              opacity: 1,
              transition: {
                duration: 0.4,
                times: [0, 0.6, 1],
                type: "spring",
                stiffness: 300,
                damping: 15
              }
            }}
          >
            <img src={tomsLogo} alt="Tom N Toms Logo" className="w-24" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;