import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../services/supabase';
import { THEME_COLOR, SECONDARY_COLOR, APP_VERSION } from '../../services/constants';

// Page title mapping
const pageTitles = {
  '/': { 
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
    description: 'View sales, inventory, and financial analytics'
  },
  '/settings': { 
    title: 'Settings', 
    description: 'Configure your POS system preferences'
  }
};

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, logout, isAuthenticated, hasRole } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
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
    if (isAuthenticated && user?.first_name && info.description.includes('Welcome')) {
      info.description = `Welcome to your dashboard, ${user.first_name}`;
    }
    
    return info;
  }, [basePageInfo, user, isAuthenticated]);

  // Generate consistent gradient for user avatar
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu || showNotifications) {
        // Check if the click was outside the menus
        if (!event.target.closest('.user-menu') && !event.target.closest('.notification-menu')) {
          setShowUserMenu(false);
          setShowNotifications(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showNotifications]);

  // Fetch notifications from Supabase
  useEffect(() => {
    // Only fetch if user is authenticated
    if (!isAuthenticated || !user?.user_id) return;
    
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // Fetch real notifications from the database
        const { data, error } = await supabase
          .from('notifications')
          .select('notification_id, title, message, link, is_read, created_at')
          .eq('user_id', user.user_id)
          .order('created_at', { ascending: false })
          .limit(20);  // Fetch most recent 20 notifications
        
        if (error) throw error;
        
        // Transform data to add notification type for proper icon display
        const transformedNotifications = data.map(notification => {
          // Determine notification type based on title or message content
          let type = 'info'; // Default type
          
          // Check title for common keywords
          const lowerTitle = notification.title.toLowerCase();
          if (lowerTitle.includes('alert') || lowerTitle.includes('low stock') || 
              lowerTitle.includes('warning') || lowerTitle.includes('error')) {
            type = 'alert';
          } else if (lowerTitle.includes('order') || lowerTitle.includes('sale') || 
                    lowerTitle.includes('transaction') || lowerTitle.includes('purchase')) {
            type = 'order';
          }
          
          return {
            ...notification,
            id: notification.notification_id,
            read: notification.is_read,
            type
          };
        });
        
        setNotifications(transformedNotifications);
        setUnreadCount(transformedNotifications.filter(n => !n.is_read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
    
    // Set up real-time subscription for new notifications
    const notificationsSubscription = supabase
      .channel('notifications-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.user_id}`
      }, (payload) => {
        // Process new notification
        const newNotification = payload.new;
        
        // Determine notification type
        let type = 'info';
        const lowerTitle = newNotification.title.toLowerCase();
        if (lowerTitle.includes('alert') || lowerTitle.includes('low stock') || 
            lowerTitle.includes('warning') || lowerTitle.includes('error')) {
          type = 'alert';
        } else if (lowerTitle.includes('order') || lowerTitle.includes('sale') || 
                  lowerTitle.includes('transaction') || lowerTitle.includes('purchase')) {
          type = 'order';
        }
        
        const formattedNotification = {
          ...newNotification,
          id: newNotification.notification_id,
          read: newNotification.is_read,
          type
        };
        
        // Add to the notifications state
        setNotifications(prev => [formattedNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show a toast if notification panel is not open
        if (!showNotifications) {
          toast(newNotification.title, {
            icon: type === 'alert' ? '⚠️' : type === 'order' ? '🛒' : 'ℹ️',
          });
        }
      })
      .subscribe();
      
    // Clean up subscription
    return () => {
      supabase.removeChannel(notificationsSubscription);
    };
  }, [isAuthenticated, user?.user_id, showNotifications]);

  // Toggle user menu
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    if (showNotifications) setShowNotifications(false);
  };

  // Toggle notifications panel
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showUserMenu) setShowUserMenu(false);
  };
  
  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('notification_id', notificationId);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? {...notification, read: true, is_read: true} 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Get IDs of all unread notifications
      const unreadIds = notifications
        .filter(notification => !notification.read)
        .map(notification => notification.id);
      
      if (unreadIds.length === 0) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('notification_id', unreadIds);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({...notification, read: true, is_read: true}))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  // Handle notification click - navigate to link if provided and mark as read
  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
    
    // Navigate to link if provided
    if (notification.link) {
      navigate(notification.link);
      setShowNotifications(false);
    }
  };

  // Handle logout with proper navigation
  const handleLogout = async () => {
    try {
      await logout();
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

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

  // Format notification time (e.g., "2 hours ago")
  const formatNotificationTime = (isoDate) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      const diffHours = Math.round(diffMins / 60);
      if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      } else {
        const diffDays = Math.round(diffHours / 24);
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      }
    }
  };

  // Avatar rendering function
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

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'alert':
        return (
          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'order':
        return (
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
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
          marginLeft: isSidebarOpen ? "260px" : "0px"
        }}
      >
        {/* Header content */}
        <div className="px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-3 items-center">
          {/* Left side - Toggle button & Page title */}
          <div className="flex items-center space-x-4">
            {/* Mobile sidebar toggle */}
            <motion.button
              onClick={toggleSidebar}
              className="text-[#571C1F] hover:text-[#571C1F]/80 focus:outline-none"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </motion.button>
            
            {/* Page title with animation */}
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
          </div>

          {/* Center - Date and time */}
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

          {/* Right side - Notifications & User profile */}
          <div className="flex items-center justify-end space-x-5">
            {/* Notification bell with count badge */}
            <div className="relative notification-menu">
              <motion.button
                className="relative bg-white p-2.5 rounded-full hover:bg-[#571C1F]/5 shadow-sm border border-[#571C1F]/10"
                onClick={toggleNotifications}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 bg-[#571C1F] text-white rounded-full text-xs flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </motion.button>
              
              {/* Notifications dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl overflow-hidden shadow-lg bg-white ring-1 ring-[#571C1F]/10 z-50"
                  >
                    {/* Notifications header */}
                    <div className="bg-gradient-to-r from-[#571C1F]/10 to-[#003B25]/10 px-4 py-3 flex items-center justify-between">
                      <h3 className="text-[#571C1F] font-bold">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="bg-[#571C1F] text-white text-xs px-2 py-1 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    
                    {/* Notification list */}
                    <div className="max-h-80 overflow-y-auto">
                      {loading ? (
                        <div className="p-4 text-center">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#571C1F] border-t-transparent"></div>
                          <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <p>No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div 
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`px-4 py-3 border-b border-[#571C1F]/10 hover:bg-[#FFF6F2] transition-colors flex items-start space-x-3 cursor-pointer ${
                              notification.read ? 'opacity-75' : ''
                            }`}
                          >
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className={`text-sm font-medium ${notification.read ? 'text-gray-600' : 'text-[#571C1F]'}`}>
                                  {notification.title}
                                </p>
                                <span className="text-xs text-[#003B25]/70">
                                  {formatNotificationTime(notification.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-[#571C1F] mt-1.5"></div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    
                    {/* Notifications footer */}
                    {notifications.length > 0 && unreadCount > 0 && (
                      <div className="bg-white p-2 border-t border-[#571C1F]/10">
                        <button 
                          onClick={markAllAsRead}
                          className="text-sm text-center text-[#571C1F] hover:text-[#571C1F]/80 w-full py-1.5 rounded-md hover:bg-[#571C1F]/5 transition-colors"
                        >
                          Mark all as read
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User profile dropdown */}
            <div className="relative user-menu">
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
                    {user?.first_name || 'User'}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#571C1F]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </motion.button>

              {/* User menu dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="origin-top-right absolute right-0 mt-2 w-64 rounded-xl overflow-hidden shadow-lg bg-white ring-1 ring-[#571C1F]/10 z-50"
                  >
                    {/* User info section */}
                    <div className="bg-gradient-to-r from-[#571C1F]/10 to-[#003B25]/10 p-4">
                      <div className="flex items-center mb-3">
                        <div className="h-12 w-12 rounded-full overflow-hidden mr-3 shadow-sm">
                          {renderAvatar()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#571C1F] truncate">{user?.first_name} {user?.last_name}</p>
                          <p className="text-xs text-[#003B25]/70 truncate">{user?.email}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                        <div className="bg-white/50 rounded-md p-1.5 backdrop-blur-sm text-center">
                          <span className="font-medium block text-[#003B25]">Role</span>
                          <span className="text-[#571C1F] block mt-0.5">
                            {user?.role || 'Staff'}
                          </span>
                        </div>
                        <div className="bg-white/50 rounded-md p-1.5 backdrop-blur-sm text-center">
                          <span className="font-medium block text-[#003B25]">Status</span>
                          <span className="text-[#571C1F] block mt-0.5">
                            {user?.status || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu items */}
                    <div className="py-2">
                      {/* <button 
                        onClick={() => navigate('/profile')}
                        className="w-full text-left px-4 py-2.5 text-sm flex items-center space-x-3 bg-white hover:bg-[#571C1F]/5 transition-colors"
                      >
                        <div className="h-7 w-7 rounded-full bg-white border border-[#571C1F]/20 flex items-center justify-center shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-[#571C1F] font-medium">My Profile</span>
                      </button>
                      
                      {hasRole('Admin') && (
                        <button 
                          onClick={() => navigate('/settings')}
                          className="w-full text-left px-4 py-2.5 text-sm flex items-center space-x-3 bg-white hover:bg-[#571C1F]/5 transition-colors"
                        >
                          <div className="h-7 w-7 rounded-full bg-white border border-[#571C1F]/20 flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <span className="text-[#571C1F] font-medium">System Settings</span>
                        </button>
                      )}
                      
                      <hr className="my-2 border-[#571C1F]/10" /> */}
                      
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm flex items-center space-x-3 bg-white hover:bg-[#571C1F]/5 text-[#571C1F] transition-colors"
                      >
                        <div className="h-7 w-7 rounded-full bg-white border border-[#571C1F]/20 flex items-center justify-center shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 0v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <span className="font-medium">Sign out</span>
                      </button>
                      
                      <div className="mt-2 px-4 py-2 text-xs text-[#003B25]/60 text-center border-t border-[#571C1F]/10">
                        <p>TrackNToms POS v{APP_VERSION}</p>
                      </div>
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