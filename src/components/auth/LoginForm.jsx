import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom'; // Add this import
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';

const LoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate(); // Add this
  const location = useLocation(); // Add this
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Add state for password visibility
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Pass remember state to login function
      const result = await login(email, password, remember);
      
      if (!result.success) {
        setError(result.error);
        toast.error(result.error || 'Login failed');
      } else {
        toast.success('Login successful!');
        
        // Handle redirect after successful login
        const from = location.state?.from?.pathname || '/';
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 500); // Small delay to show the success message
      }
    } catch (err) {
      console.error('Form submission error:', err);
      console.error('Error type:', err.constructor.name);
      console.error('Error stack:', err.stack);
      setError('An unexpected error occurred. Please try again.');
      toast.error('Login error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // For staggered animation of form elements
  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Form Title */}
      <motion.h2 
        className="text-2xl font-bold text-center text-[#571C1F] mb-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Sign in to your Account
      </motion.h2>

      <motion.form 
        className="mt-4 space-y-4"
        onSubmit={handleSubmit}
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-800/30 dark:text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Email Field */}
        <motion.div variants={itemVariants} className="space-y-1">
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-[#003B25] dark:text-gray-300"
          >
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <motion.input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 
                focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-dark-light dark:text-white
                transition-all duration-200"
              placeholder="Enter your email"
              whileFocus={{ scale: 1.01 }}
            />
          </div>
        </motion.div>

        {/* Password Field */}
        <motion.div variants={itemVariants} className="space-y-1">
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-[#003B25] dark:text-gray-300"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            {/* Show/hide password toggle button - only when password has content */}
            {password.length > 0 && (
              <div 
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer z-10"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </div>
            )}
            
            <motion.input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 
                focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-dark-light dark:text-white
                transition-all duration-200"
              placeholder="Enter your password"
              whileFocus={{ scale: 1.01 }}
            />
          </div>
        </motion.div>

        {/* Remember me & Forgot password */}
        <motion.div 
          variants={itemVariants} 
          className="flex justify-between mt-4 text-sm"
        >
          <div className="inline-flex items-center text-gray-600 dark:text-gray-400">
            <div className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="remember" 
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#571C1F] focus:ring-[#571C1F] focus:ring-offset-0 cursor-pointer" 
              />
              <div className="ml-2 text-sm" onClick={() => setRemember(!remember)}>
                <label 
                  htmlFor="remember" 
                  className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                >
                  Remember me
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Stay signed in on this device
                </p>
              </div>
            </div>
          </div>
          
          <motion.button
            type="button"
            onClick={() => toast.error("Password reset not implemented yet")}
            className="text-[#571C1F] hover:text-[#571C1F]/80 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Forgot password?
          </motion.button>
        </motion.div>

        {/* Submit Button */}
        <motion.div variants={itemVariants} className="pt-2">
          <Button 
            type="submit"
            fullWidth
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-3 -ml-1 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </Button>
        </motion.div>
      </motion.form>
    </motion.div>
  );
};

export default LoginForm;