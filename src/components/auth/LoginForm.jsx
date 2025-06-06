import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';

const LoginForm = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Login process
      const result = await login(email, password, remember);
      if (!result.success) {
        setError(result.error);
        toast.error(result.error || 'Login failed');
      } else {
        toast.success('Login successful!');
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
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <motion.input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm placeholder-gray-400 
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
          <motion.div
            className="inline-flex items-center text-gray-600 dark:text-gray-400"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input 
              type="checkbox" 
              id="remember" 
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#571C1F] focus:ring-[#571C1F]" 
            />
            <label htmlFor="remember" className="ml-2 cursor-pointer">Remember me</label>
          </motion.div>
          
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