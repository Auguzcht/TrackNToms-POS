import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// Page title mapping (unchanged)
const pageTitles = {
  '/dashboard': { 
    title: 'Dashboard', 
    description: 'Overview of store performance and key metrics'
  },
  '/inventory': { 
    title: 'Inventory Management', 
    description: 'Track and manage your inventory'
  },
  '/pos': { 
    title: 'Point of Sale', 
    description: 'Process customer transactions and orders'
  },
  '/suppliers': { 
    title: 'Suppliers', 
    description: 'Manage suppliers, consignments, and purchase orders'
  },
  '/staff': { 
    title: 'Staff', 
    description: 'Manage your staff members and role permissions'
  },
  '/reports': { 
    title: 'Reports', 
    description: 'View sales and inventory analytics'
  },
  '/settings': { 
    title: 'Settings', 
    description: 'Configure your POS system preferences'
  }
};

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  
  // Get current page title and description
  const currentPath = location.pathname;
  const pathParts = currentPath.split('/');
  const mainPath = '/' + (pathParts.length > 1 ? pathParts[1] : '');
  
  // Get base page info with personalization for dashboard
  const basePageInfo = pageTitles[mainPath] || { 
    title: 'Dashboard', 
    description: 'Welcome to your dashboard' 
  };
  
  // Create personalized page info with user's name
  const pageInfo = useMemo(() => {
    // Deep copy the base info to avoid modifying the original object
    const info = { ...basePageInfo };
    
    // Personalize description with user's name if available
    if (user && info.description.includes('Welcome')) {
      info.description = `Welcome to your dashboard, ${user.first_name}`;
    }
    
    return info;
  }, [basePageInfo, user]);

  // Generate consistent random gradient for user
  const userGradient = useMemo(() => {
    if (!user) return 'bg-gradient-to-br from-[#571C1F] to-[#003B25]';
    
    // Use user ID or name to create a consistent gradient
    const seed = user.id || `${user.first_name}${user.last_name}`;
    const colors = [
      'from-pink-500 to-purple-500',
      'from-blue-500 to-teal-500',
      'from-green-500 to-emerald-500',
      'from-amber-500 to-orange-500',
      'from-red-500 to-rose-500',
      'from-indigo-500 to-blue-500',
      'from-[#571C1F] to-[#003B25]',
      'from-[#003B25] to-[#571C1F]',
    ];
    
    // Simple hash function to pick a consistent color
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash % colors.length);
    return `bg-gradient-to-br ${colors[index]}`;
  }, [user]);

  // Handle scroll effect for dynamic header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const toggleUserMenu = () => setShowUserMenu(!showUserMenu);

  // Format current time
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Format current date
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Avatar rendering function - checks if user has profile image
  const renderAvatar = () => {
    if (user?.profile_image) {
      return (
        <img 
          src={user.profile_image} 
          alt={`${user.first_name} ${user.last_name}`}
          className="h-full w-full object-cover rounded-full"
        />
      );
    } else {
      return (
        <div className={`h-full w-full rounded-full flex items-center justify-center text-white ${userGradient}`}>
          <span className="font-medium text-sm">
            {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
          </span>
        </div>
      );
    }
  };

  return (
    <motion.header 
      className={`sticky top-0 z-30 transition-all duration-300 ${
        scrolled 
          ? "bg-[#FFF6F2]/95 backdrop-blur-sm shadow-md" 
          : "bg-[#FFF6F2] border-b border-[#571C1F]/10"
      }`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div 
        className="transition-all duration-300"
        style={{
          marginLeft: isSidebarOpen ? "260px" : "0px" // Updated to match the wider sidebar
        }}
      >
        {/* Single row header with increased height */}
        <div className="px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-3 items-center">
          {/* Left side - Page title and description */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col justify-center"
            >
              <h1 className="text-xl font-bold text-[#571C1F]">{pageInfo.title}</h1>
              <p className="text-sm text-[#003B25]/70">{pageInfo.description}</p>
            </motion.div>
          </AnimatePresence>

          {/* Center - Date and time with fixed position */}
          <motion.div 
            className="hidden md:flex items-center justify-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="bg-white px-5 py-2 rounded-full shadow-sm border border-[#571C1F]/10 flex items-center">
              <span className="text-base font-medium text-[#003B25] mr-2">{formattedTime}</span>
              <div className="h-3.5 w-0.5 bg-[#571C1F]/20 mx-2"></div>
              <span className="text-sm text-[#571C1F]/70">{formattedDate}</span>
            </div>
          </motion.div>

          {/* Right side - User profile */}
          <div className="flex items-center justify-end space-x-5">
            {/* Notification bell with count badge */}
            <motion.button
              className="relative bg-white p-2.5 rounded-full hover:bg-[#571C1F]/5 shadow-sm border border-[#571C1F]/10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-0 right-0 h-5 w-5 bg-[#571C1F] text-white rounded-full text-xs flex items-center justify-center font-bold">
                2
              </span>
            </motion.button>

            {/* User profile button */}
            <div className="relative">
              <motion.button
                type="button"
                className="flex items-center space-x-3 bg-white rounded-full focus:outline-none shadow-sm border border-[#571C1F]/10 p-2 pl-2 pr-4 hover:bg-[#571C1F]/5"
                onClick={toggleUserMenu}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center">
                  {renderAvatar()}
                </div>
                <span className="hidden md:flex items-center space-x-1">
                  <span className="font-medium text-base text-[#571C1F]">
                    {user?.first_name}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#571C1F]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </motion.button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="origin-top-right absolute right-0 mt-2 w-64 rounded-xl overflow-hidden shadow-lg bg-white ring-1 ring-[#571C1F]/10"
                  >
                    {/* Enhanced User info section */}
                    <div className="bg-gradient-to-r from-[#571C1F]/10 to-[#003B25]/10 p-4">
                      <div className="flex items-center mb-3">
                        <div className="h-12 w-12 rounded-full overflow-hidden mr-3 shadow-sm">
                          {renderAvatar()}
                        </div>
                        <div>
                          <p className="font-bold text-[#571C1F]">{user?.first_name} {user?.last_name}</p>
                          <p className="text-xs text-[#003B25]/70 truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div className="text-xs text-[#571C1F]/70 mt-1 bg-white/50 rounded-md p-1.5 backdrop-blur-sm">
                        <span className="font-medium">Last login:</span> {new Date().toLocaleDateString()}
                      </div>
                    </div>
                    
                    {/* Improved Menu items - FIXED to have white background buttons */}
                    <div className="py-2">
                      <button className="w-full text-left px-4 py-2.5 text-sm flex items-center space-x-3 bg-white hover:bg-[#571C1F]/5 transition-colors">
                        <div className="h-7 w-7 rounded-full bg-white border border-[#571C1F]/20 flex items-center justify-center shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-[#571C1F] font-medium">My Profile</span>
                      </button>
                      
                      <button className="w-full text-left px-4 py-2.5 text-sm flex items-center space-x-3 bg-white hover:bg-[#571C1F]/5 transition-colors">
                        <div className="h-7 w-7 rounded-full bg-white border border-[#571C1F]/20 flex items-center justify-center shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <span className="text-[#571C1F] font-medium">Account Settings</span>
                      </button>
                      
                      <hr className="my-2 border-[#571C1F]/10" />
                      
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2.5 text-sm flex items-center space-x-3 bg-white hover:bg-[#571C1F]/5 text-[#571C1F] transition-colors"
                      >
                        <div className="h-7 w-7 rounded-full bg-white border border-[#571C1F]/20 flex items-center justify-center shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 0v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <span className="font-medium">Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;