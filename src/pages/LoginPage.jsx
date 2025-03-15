import { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';
import tomsLogo from '../assets/TomNToms-Logo-2.png';

const LoginPage = () => {
  const { user, loading } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);

  // Pre-generate positions for coffee beans to ensure consistency
  const beanProps = useMemo(() => {
    return Array.from({ length: 15 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: 0.1 + (Math.random() * 0.1),
      scale: 0.5 + (Math.random() * 0.5),
      rotate: 45 + (Math.random() * 90),
    }));
  }, []);

  // Preload images to avoid flashing
  useEffect(() => {
    const logoImg = new Image();
    logoImg.src = tomsLogo;
    logoImg.onload = () => setImagesPreloaded(true);
  }, []);

  // Delay showing content for smooth entrance animation, but only after images are preloaded
  useEffect(() => {
    if (imagesPreloaded) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [imagesPreloaded]);

  // Redirect if user is already logged in
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <motion.div 
      className="min-h-screen bg-[#FFF6F2] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient background */}
        <motion.div 
          className="absolute inset-0 opacity-10"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            repeat: Infinity,
            repeatType: "mirror",
            duration: 20,
            ease: "linear"
          }}
          style={{
            backgroundImage: 'radial-gradient(circle at center, rgba(87, 28, 31, 0.2) 0%, transparent 70%)',
            backgroundSize: '120vw 120vh',
          }}
        />
        
        {/* Coffee bean pattern with consistent positions */}
        <div className="absolute inset-0 pointer-events-none">
          {beanProps.map((bean, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-[#571C1F] w-8 h-12"
              style={{
                top: `${bean.top}%`,
                left: `${bean.left}%`,
              }}
              initial={{ opacity: 0, scale: 0, rotate: bean.rotate }}
              animate={{ 
                opacity: bean.opacity,
                scale: bean.scale,
                rotate: bean.rotate,
              }}
              transition={{ 
                delay: i * 0.1,
                duration: 1.5,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Main content */}
      <div className="relative min-h-screen flex flex-col lg:flex-row items-center justify-center z-10">
        {/* Left side - branding column */}
        <motion.div 
          className="lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16"
          initial={{ opacity: 0, x: -50 }}
          animate={{ 
            opacity: 1, 
            x: 0, 
            transition: { 
              type: "spring", 
              stiffness: 100, 
              damping: 20,
              delay: 0.2
            }
          }}
        >
          {/* Logo with smoother shadow transition */}
          <div className="relative mb-8">
            {/* Logo glow effect - pre-rendered to avoid stuttering */}
            <motion.div
              className="absolute -inset-8 rounded-full opacity-70 blur-xl"
              style={{
                background: 'radial-gradient(circle at center, rgba(87, 28, 31, 0.3) 0%, rgba(0, 59, 37, 0.2) 60%, transparent 80%)',
              }}
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.6, 0.7, 0.6]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            />
            
            {/* Logo container with subtle hover */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                delay: 0.2
              }}
            >
              <img 
                src={tomsLogo} 
                alt="Tom N Toms Logo" 
                className="w-64 relative z-10 drop-shadow-lg" 
              />
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold text-[#571C1F] mb-2">
              <motion.span
                className="inline-block"
                whileHover={{ 
                  color: "#450E11",
                  textShadow: "0 1px 8px rgba(87, 28, 31, 0.15)",
                  transition: { duration: 0.3 }
                }}
              >
                TrackNToms POS
              </motion.span>
            </h1>
            <motion.p 
              className="text-[#003B25]/80 max-w-md"
              whileHover={{ 
                color: "rgba(0, 59, 37, 0.9)",
                transition: { duration: 0.3 }
              }}
            >
              The All-in-One Point of Sale System for TomNToms Coffee
            </motion.p>
          </motion.div>
        </motion.div>
        
        {/* Right side - login form */}
        <AnimatePresence mode="wait">
          {showContent && (
            <motion.div
              className="lg:w-1/2 w-full flex justify-center items-center p-8"
              initial={{ opacity: 0, x: 50 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                transition: { 
                  type: "spring",
                  stiffness: 100, 
                  damping: 20,
                  delay: 0.3
                }
              }}
              exit={{ opacity: 0, x: 100 }}
            >
              <div className="w-full max-w-md relative">
                {/* Card glow effect - subtle version */}
                <motion.div
                  className="absolute -inset-2 bg-gradient-to-r from-[#571C1F]/20 to-[#003B25]/10 rounded-xl blur-lg"
                  animate={{ 
                    opacity: [0.4, 0.5, 0.4],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                />
                
                {/* Login card with more subtle hover */}
                <motion.div 
                  className="backdrop-blur-sm bg-white/90 dark:bg-dark-lighter/90 p-8 rounded-lg shadow-lg relative z-10 border border-gray-200/30 dark:border-gray-700/30"
                  initial={{ y: 10, opacity: 0.8 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileHover={{ 
                    y: -1, // Much more subtle lift
                    boxShadow: "0 10px 25px -5px rgba(87, 28, 31, 0.1)",
                    transition: { duration: 0.3, ease: "easeOut" }
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                    delay: 0.4
                  }}
                >
                  {/* Coffee cup icon with steam */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex justify-center">
                    <div className="relative">
                      <div className="absolute -top-3 left-0 right-0 flex justify-center space-x-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className={`w-1 h-${2 + (i % 2)} bg-[#571C1F]/50 rounded-full`}
                            animate={{
                              opacity: [0, 0.7, 0],
                              y: [0, -8, -12],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              delay: i * 0.3,
                              ease: "easeInOut"
                            }}
                          />
                        ))}
                      </div>
                      <motion.div 
                        className="w-8 h-6 border-2 border-[#571C1F]/70 rounded-b-lg"
                        whileHover={{
                          borderColor: "rgba(87, 28, 31, 0.9)", // Removed scale for subtlety
                          transition: { duration: 0.2 }
                        }}
                      />
                    </div>
                  </div>

                  {/* Title with more subtle character animation */}
                  <div className="text-center mb-6">
                    <div className="overflow-hidden">
                      <motion.h2 
                        className="text-2xl font-bold text-[#571C1F] mb-2"
                        initial={{ y: 40 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                      >
                        {/* Character by character animation - more subtle */}
                        {"Welcome Back".split("").map((char, index) => (
                          <motion.span
                            key={index}
                            className="inline-block"
                            whileHover={{ 
                              y: -2, // More subtle lift
                              color: "#450E11",
                              transition: { duration: 0.2 }
                            }}
                          >
                            {char === " " ? "\u00A0" : char}
                          </motion.span>
                        ))}
                      </motion.h2>
                    </div>
                    <motion.p 
                      className="text-gray-600 dark:text-gray-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.8 }}
                      whileHover={{
                        color: "#003B25",
                        transition: { duration: 0.3 }
                      }}
                    >
                      Log in to access your dashboard
                    </motion.p>
                  </div>
                  
                  {/* Login form */}
                  <LoginForm />
                  
                  {/* Additional help text */}
                  <motion.div 
                    className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    whileHover={{
                      color: "#571C1F",
                      transition: { duration: 0.3 }
                    }}
                  >
                    <p>Need help? <motion.span 
                      className="underline cursor-pointer"
                      whileHover={{ 
                        fontWeight: "500", // Removed scale for subtlety
                        transition: { duration: 0.2 }
                      }}
                      whileTap={{ scale: 0.98 }} // More subtle tap effect
                    >Contact your system administrator</motion.span></p>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer with coffee steam animation */}
      <motion.div 
        className="absolute bottom-4 w-full flex justify-center text-sm text-[#571C1F]/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        whileHover={{
          color: "rgba(87, 28, 31, 0.9)",
          transition: { duration: 0.3 }
        }}
      >
        {/* Steam animation */}
        <div className="relative group">
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-3 bg-[#571C1F]/30 rounded-full"
                animate={{
                  opacity: [0, 0.7, 0],
                  y: [0, -10, -15],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          <p>Powered by TrackNToms Technology &copy; 2023</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoginPage;