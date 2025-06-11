// Add role-specific navigation items and access control

import { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { APP_VERSION } from '../../services/constants';
import tomsLogo from '../../assets/TomNToms-Logo-2.png';

const Sidebar = ({ isOpen }) => {
  const { user } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const location = useLocation();
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [activeSubpage, setActiveSubpage] = useState(null);

  // Define standard navigation items with required permissions
  const standardNavItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: 'chart-bar', 
      requiredPermission: 'dashboard.view',
      exact: true 
    },
    { 
      name: 'POS', 
      path: '/pos', 
      icon: 'shopping-cart', 
      requiredPermission: 'sales.view',
    },
    { 
      name: 'Inventory', 
      path: '/inventory', 
      icon: 'clipboard-list', 
      requiredPermission: 'inventory.view',
      subpages: [
        { 
          name: 'Ingredients', 
          path: '/inventory?tab=ingredients',
          requiredPermission: 'inventory.view'
        },
        { 
          name: 'Menu Items', 
          path: '/inventory?tab=menu-items',
          requiredPermission: 'inventory.view'
        },
        { 
          name: 'Pullouts', 
          path: '/inventory?tab=pullouts',
          requiredPermission: 'pullouts.view'
        }
      ] 
    },
    { 
      name: 'Suppliers', 
      path: '/suppliers', 
      icon: 'truck', 
      requiredPermission: 'suppliers.view',
      subpages: [
        { 
          name: 'Suppliers', 
          path: '/suppliers?tab=suppliers',
          requiredPermission: 'suppliers.view'
        },
        { 
          name: 'Purchase Orders', 
          path: '/suppliers?tab=purchase-orders',
          requiredPermission: 'purchases.view'
        },
        { 
          name: 'Consignments', 
          path: '/suppliers?tab=consignments',
          requiredPermission: 'suppliers.view'
        }
      ] 
    },
    { 
      name: 'Staff', 
      path: '/staff', 
      icon: 'users', 
      requiredPermission: 'staff.view',
      subpages: [
        { 
          name: 'Staff List', 
          path: '/staff?tab=staff',
          requiredPermission: 'staff.view'
        },
        { 
          name: 'Role Management', 
          path: '/staff?tab=roles',
          requiredPermission: 'staff.manage_roles'
        }
      ] 
    },
    { 
      name: 'Reports', 
      path: '/reports', 
      icon: 'document-report', 
      requiredPermission: 'reports.view',
      subpages: [
        { 
          name: 'Sales Report', 
          path: '/reports?tab=sales',
          requiredPermission: 'reports.sales'
        },
        { 
          name: 'Inventory Report', 
          path: '/reports?tab=inventory',
          requiredPermission: 'reports.inventory'
        },
        { 
          name: 'Financial Report', 
          path: '/reports?tab=financial',
          requiredPermission: 'reports.financial'
        }
      ] 
    }
  ];

  // Supplier-specific navigation
  const supplierNavItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: 'chart-bar', 
      requiredPermission: 'dashboard.view',
      exact: true 
    },
    { 
      name: 'Purchase Orders', 
      path: '/suppliers?tab=purchase-orders', 
      icon: 'clipboard-check',
      requiredPermission: 'suppliers.view', // Change to match the standard nav permissions
      tabName: 'purchase-orders'
    },
    { 
      name: 'Consignments', 
      path: '/suppliers?tab=consignments', 
      icon: 'truck',
      requiredPermission: 'suppliers.view', // Change to match the standard nav permissions
      tabName: 'consignments'
    }
  ];

  // Cashier-specific navigation
  const cashierNavItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: 'chart-bar', 
      requiredPermission: 'dashboard.view',
      exact: true
    },
    { 
      name: 'POS', 
      path: '/pos', 
      icon: 'shopping-cart', 
      requiredPermission: 'sales.view',
    },
    {
      name: 'Inventory', 
      path: '/inventory', 
      icon: 'clipboard-list', 
      requiredPermission: 'inventory.view',
    }
  ];

  // Inventory-specific navigation
  const inventoryNavItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: 'chart-bar', 
      requiredPermission: 'dashboard.view',
      exact: true
    },
    { 
      name: 'Inventory', 
      path: '/inventory', 
      icon: 'clipboard-list', 
      requiredPermission: 'inventory.view',
      subpages: [
        { 
          name: 'Ingredients', 
          path: '/inventory?tab=ingredients',
          requiredPermission: 'inventory.view'
        },
        { 
          name: 'Menu Items', 
          path: '/inventory?tab=menu-items',
          requiredPermission: 'inventory.view'
        },
        { 
          name: 'Pullouts', 
          path: '/inventory?tab=pullouts',
          requiredPermission: 'pullouts.view'
        }
      ] 
    },
    { 
      name: 'Suppliers', 
      path: '/suppliers', 
      icon: 'truck', 
      requiredPermission: 'suppliers.view',
      subpages: [
        { 
          name: 'Suppliers', 
          path: '/suppliers?tab=suppliers',
          requiredPermission: 'suppliers.view'
        },
        { 
          name: 'Purchase Orders', 
          path: '/suppliers?tab=purchase-orders',
          requiredPermission: 'purchases.view'
        }
      ] 
    }
  ];

  // Get the right navigation based on user role
  const navItems = useMemo(() => {
    if (!user) return [];
    
    // Return the appropriate navigation based on role
    switch (user.role) {
      case 'Supplier':
        return supplierNavItems;
      case 'Cashier':
        return cashierNavItems;
      case 'Inventory':
        return inventoryNavItems;
      default:
        return standardNavItems;
    }
  }, [user]);

  // Filter nav items based on user permissions
  const filteredNavItems = useMemo(() => {
    if (!user || permissionsLoading) return [];

    // Special case: Admin has access to everything, bypass permission checks
    if (user.role === 'Admin') {
      return navItems;
    }

    // For other roles, check specific permissions
    return navItems.filter(item => {
      // Check if user has permission for this main menu item
      const hasMainPermission = hasPermission(item.requiredPermission);
      
      // If item has subpages, also filter them by permissions
      if (item.subpages) {
        // Get subpages that user has permission to access
        const allowedSubpages = item.subpages.filter(subpage => 
          hasPermission(subpage.requiredPermission)
        );
        
        // If there are allowed subpages, include this item with only the allowed subpages
        if (allowedSubpages.length > 0) {
          item = {
            ...item,
            subpages: allowedSubpages
          };
          return true;
        }
        
        // If no subpages are allowed but main item is allowed, include it without subpages
        if (hasMainPermission) {
          item = {
            ...item,
            subpages: undefined // Remove subpages
          };
          return true;
        }
        
        // If neither main item nor subpages are allowed, exclude this item
        return false;
      }
      
      // For items without subpages, just check the main permission
      return hasMainPermission;
    });
  }, [user, permissionsLoading, hasPermission, navItems]);

  // Update active subpage when location changes
  useEffect(() => {
    // Find which menu item contains a subpage that matches the current location
    const menuWithActiveSubpage = navItems.find(item => 
      item.subpages?.some(subpage => isSubpageActive(subpage.path))
    );
    
    // If found, expand that menu and set the active subpage
    if (menuWithActiveSubpage) {
      setExpandedMenu(menuWithActiveSubpage.name);
      
      const activeSubpagePath = menuWithActiveSubpage.subpages.find(
        subpage => isSubpageActive(subpage.path)
      )?.path;
      
      setActiveSubpage(activeSubpagePath);
    }
  }, [location.pathname, location.search]);

  // Handle expanding/collapsing subpages
  const toggleSubpages = (itemName) => {
    setExpandedMenu(expandedMenu === itemName ? null : itemName);
  };

  // Check if a menu item is active
  const isMenuActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    
    if (item.tabName) {
      // Special handling for supplier navigation with tabs
      const currentTab = new URLSearchParams(location.search).get('tab');
      return location.pathname.startsWith('/suppliers') && currentTab === item.tabName;
    }
    
    if (item.subpages) {
      return location.pathname.startsWith(item.path.split('?')[0]);
    }
    
    // For normal paths
    const itemBasePath = item.path.split('?')[0];
    return location.pathname === itemBasePath;
  };

  // Check if subpage is active
  const isSubpageActive = (path) => {
    if (path.includes('?tab=')) {
      const [basePath, query] = path.split('?');
      const tabValue = new URLSearchParams(query).get('tab');
      const currentTab = new URLSearchParams(location.search).get('tab');
      
      return location.pathname === basePath && currentTab === tabValue;
    }
    return location.pathname === path;
  };

  // Animation variants for different elements
  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0, y: -10 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.3
      }
    }
  };
  
  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.3 + (i * 0.1),
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };
  
  const subMenuContainerVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: 'auto',
      transition: {
        duration: 0.4,
        ease: "easeInOut",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      height: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };
  
  const subMenuItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  // Updated to make line take full height of container
  const highlightLineVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: (subpages) => ({ 
      height: '100%', 
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" 
      }
    }),
    exit: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  // Updated to make marker more precise with proper alignment
  const activeMarkerVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: (index) => ({
      opacity: 1,
      height: 39, // Match button height
      top: `calc(${index} * 43px)`, // Clean calculation using calc()
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 25 
      }
    })
  };

  // Border glow animation
  const borderGlowVariants = {
    initial: { 
      boxShadow: '0 0 0 rgba(87, 28, 31, 0)' 
    },
    animate: { 
      boxShadow: ['0 0 5px rgba(87, 28, 31, 0.2)', '0 0 12px rgba(87, 28, 31, 0.3)', '0 0 5px rgba(87, 28, 31, 0.2)'],
      transition: { 
        duration: 4,
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="sidebar"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 260, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed left-0 top-0 bottom-0 overflow-hidden z-40 h-screen bg-white dark:bg-dark-lighter border-r border-gray-200 shadow-md"
        >
          {/* Added subtle border glow effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial="initial"
            animate="animate"
            variants={borderGlowVariants}
          />
          
          {/* Enhanced Logo section with larger size and animations */}
          <motion.div 
            className="flex flex-col items-center justify-center py-8 border-b border-[#571C1F]/10 relative overflow-hidden"
            initial="hidden"
            animate="visible"
            variants={logoVariants}
          >
            {/* Background glow effect */}
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{
                background: [
                  'radial-gradient(circle at center, rgba(87, 28, 31, 0.3) 0%, transparent 60%)',
                  'radial-gradient(circle at center, rgba(0, 59, 37, 0.2) 0%, transparent 60%)',
                  'radial-gradient(circle at center, rgba(87, 28, 31, 0.3) 0%, transparent 60%)'
                ]
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            />
            
            {/* Logo image with hover animation */}
            <motion.div
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.3 } 
              }}
              className="relative z-10"
            >
              <img 
                src={tomsLogo} 
                alt="Tom N Toms Logo" 
                className="w-24 mb-3 drop-shadow-md" 
              />
            </motion.div>
            
            {/* App name with hover animation */}
            <motion.h1 
              className="text-[#571C1F] font-bold text-xl relative z-10"
              whileHover={{
                scale: 1.05,
                color: "#450E11",
                transition: { duration: 0.2 }
              }}
            >
              TrackNToms
            </motion.h1>
            
            {/* Subtle tagline */}
            <motion.p
              className="text-xs text-[#571C1F]/70 mt-1 font-medium relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              TomNToms Coffee POS Management
            </motion.p>
          </motion.div>
          
          {/* Menu section with staggered animations */}
          <div className="flex flex-col h-full overflow-y-auto pt-4">
            <div className="flex-1 px-4 space-y-2">
              {permissionsLoading ? (
                // Show loading placeholders while permissions are loading
                Array.from({ length: 4 }).map((_, i) => (
                  <div 
                    key={`loading-${i}`} 
                    className="h-11 bg-gray-100 rounded-lg animate-pulse my-1"
                  />
                ))
              ) : filteredNavItems.length === 0 ? (
                // Show message if no navigation items are available
                <div className="text-center py-8 px-4">
                  <p className="text-sm text-[#571C1F]/70">
                    No menu items available for your current role.
                  </p>
                </div>
              ) : (
                // Render actual menu items
                filteredNavItems.map((item, index) => (
                  <motion.div 
                    key={item.path} 
                    className="my-1"
                    custom={index}
                    variants={menuItemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {/* Main menu item */}
                    {item.subpages ? (
                      <div>
                        <motion.button
                          onClick={() => toggleSubpages(item.name)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isMenuActive(item)
                              ? 'bg-[#571C1F] text-white shadow-md shadow-[#571C1F]/20 hover:text-white'
                              : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-[#571C1F]'
                          }`}
                          whileHover={{ 
                            x: 4, 
                            transition: { duration: 0.2 } 
                          }}
                          whileTap={{ 
                            scale: 0.98, 
                            transition: { duration: 0.1 } 
                          }}
                        >
                          <div className="flex items-center">
                            <span className="mr-3 flex items-center justify-center w-6 h-6">
                              <motion.svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                whileHover={{ 
                                  scale: 1.15, 
                                  transition: { duration: 0.2 } 
                                }}
                              >
                                {renderIcon(item.icon)}
                              </motion.svg>
                            </span>
                            {item.name}
                          </div>
                          
                          {/* Animated arrow icon */}
                          <motion.svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            animate={{ 
                              rotate: expandedMenu === item.name ? 180 : 0,
                              scale: expandedMenu === item.name ? 1.1 : 1
                            }}
                            transition={{ duration: 0.3 }}
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M19 9l-7 7-7-7" 
                            />
                          </motion.svg>
                        </motion.button>
                        
                        {/* Dropdown subpages with enhanced animation */}
                        <AnimatePresence>
                          {expandedMenu === item.name && (
                            <motion.div
                              variants={subMenuContainerVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              className="ml-9 mt-2 space-y-1 relative"
                            >
                              {/* Vertical line container that spans full height */}
                              <div className="absolute left-0 top-0 bottom-0 w-0.5 h-full">
                                {/* Background line */}
                                <motion.div 
                                  className="w-full bg-[#571C1F]/20 absolute inset-0 rounded-full"
                                  custom={item.subpages}
                                  variants={highlightLineVariants}
                                />
                                
                                {/* Active line highlight that moves to selected item */}
                                {activeSubpage && item.subpages.some(subpage => subpage.path === activeSubpage) && (
                                  <motion.div
                                    className="w-full bg-[#571C1F] absolute left-0 rounded-full"
                                    custom={item.subpages.findIndex(subpage => subpage.path === activeSubpage)}
                                    variants={activeMarkerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    style={{ 
                                      // Add fine-tuning adjustment directly in the style
                                      marginTop: 2 
                                    }}
                                  />
                                )}
                              </div>
                              
                              {/* Subpage items with individual animations */}
                              {item.subpages.map((subpage) => (
                                <motion.div
                                  key={subpage.path}
                                  variants={subMenuItemVariants}
                                >
                                  <NavLink
                                    to={subpage.path}
                                    className={({ isActive }) => `
                                      flex items-center px-4 py-2.5 rounded-lg text-sm
                                      transition-all duration-200
                                      ${isSubpageActive(subpage.path) 
                                        ? 'text-[#571C1F] font-medium bg-[#571C1F]/5 shadow-sm hover:bg-[#571C1F]/10 hover:text-[#571C1F]' 
                                        : 'text-gray-600 hover:text-[#571C1F] hover:bg-gray-50'}
                                    `}
                                    onClick={() => setActiveSubpage(subpage.path)}
                                  >
                                    <motion.span 
                                      className={`w-2 h-2 mr-3 rounded-full ${
                                        isSubpageActive(subpage.path)
                                          ? 'bg-[#571C1F]'
                                          : 'bg-[#571C1F]/30'
                                      }`}
                                      whileHover={{ 
                                        scale: 1.5, 
                                        backgroundColor: 'rgba(87, 28, 31, 1)',
                                        transition: { duration: 0.2 }
                                      }}
                                      animate={isSubpageActive(subpage.path) ? {
                                        scale: [1, 1.2, 1],
                                        transition: {
                                          duration: 1.5,
                                          repeat: Infinity,
                                          repeatType: "reverse"
                                        }
                                      } : {}}
                                    />
                                    {subpage.name}
                                  </NavLink>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <NavLink
                        to={item.path}
                        className={`
                          flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                          ${isMenuActive(item) 
                            ? 'bg-[#571C1F] text-white shadow-md shadow-[#571C1F]/20 hover:text-white' 
                            : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-[#571C1F]'}
                        `}
                        end={item.exact}
                      >
                        <motion.span 
                          className="mr-3 flex items-center justify-center w-6 h-6"
                          whileHover={{ 
                            rotate: 10,
                            scale: 1.15,
                            transition: { duration: 0.2 } 
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            {renderIcon(item.icon)}
                          </svg>
                        </motion.span>
                        {item.name}
                      </NavLink>
                    )}
                  </motion.div>
                ))
              )}
            </div>
            
            {/* User role badge and version indicator at bottom */}
            <div className="px-4 py-3">
              {user && (
                <motion.div 
                  className="mb-2 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#571C1F]/10 text-[#571C1F]">
                    {user.role}
                  </span>
                </motion.div>
              )}
              <motion.div
                className="text-center text-xs text-[#571C1F]/70 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                TrackNToms POS v{APP_VERSION}
              </motion.div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

// Helper function to render the correct icon
function renderIcon(icon) {
  switch (icon) {
    case 'chart-bar':
      return (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      );
    case 'shopping-cart':
      return (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      );
    case 'clipboard-list':
      return (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      );
    case 'truck':
      return (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.5 18.5h2m-2 0a1 1 0 0 1-1-1m1 1a1 1 0 0 0 1-1m-2 0v-7.5A1 1 0 0 1 9.5 9m9 9.5h-2m2 0a1 1 0 0 0 1-1m-1 1a1 1 0 0 1-1-1m2 0v-3.5a1 1 0 0 0-.3-.7l-2-2a1 1 0 0 0-.7-.3h-2.5m-5.5 0H5a1 1 0 0 0-1 1v7.5a1 1 0 0 0 1 1h1.5m9-3.5h-3a1 1 0 0 0-1 1V17a1 1 0 0 0 1 1h3"
        />
      );
    case 'users':
      return (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      );
    case 'document-report':
      return (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      );
    case 'cog':
      return (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
      );
    default:
      // Default icon if none matches
      return (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      );
  }
}

export default Sidebar;