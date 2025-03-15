import { motion } from 'framer-motion';
import Card from '../common/Card';

const RecentActivity = ({ loading = false }) => {
  // Sample activity data - added more items to fill the space
  const activities = [
    {
      id: 1,
      type: 'sale',
      description: 'New sale #1052',
      amount: 245.50,
      time: '5 minutes ago',
    },
    {
      id: 2,
      type: 'inventory',
      description: 'Coffee beans restocked',
      amount: null,
      time: '2 hours ago',
    },
    {
      id: 3,
      type: 'alert',
      description: 'Low stock: Milk',
      amount: null,
      time: '3 hours ago',
    },
    {
      id: 4,
      type: 'sale',
      description: 'New sale #1051',
      amount: 128.75,
      time: '4 hours ago',
    },
    {
      id: 5,
      type: 'system',
      description: 'System backup completed',
      amount: null,
      time: '6 hours ago',
    },
    {
      id: 6,
      type: 'sale',
      description: 'New sale #1050',
      amount: 98.25,
      time: '7 hours ago',
    },
    {
      id: 7,
      type: 'inventory',
      description: 'Milk restocked',
      amount: null,
      time: '8 hours ago',
    },
    {
      id: 8,
      type: 'sale',
      description: 'New sale #1049',
      amount: 176.50,
      time: 'Yesterday',
    },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'sale':
        return (
          <motion.div 
            className="p-2 bg-[#003B25]/10 border border-[#003B25]/20 rounded-full relative overflow-hidden z-10"
            whileHover={{ scale: 1.1 }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#003B25]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.div>
        );
      case 'inventory':
        return (
          <motion.div 
            className="p-2 bg-[#571C1F]/10 border border-[#571C1F]/20 rounded-full relative overflow-hidden z-10"
            whileHover={{ scale: 1.1 }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </motion.div>
        );
      case 'alert':
        return (
          <motion.div 
            className="p-2 bg-[#571C1F]/10 border border-[#571C1F]/20 rounded-full relative overflow-hidden z-10"
            whileHover={{ scale: 1.1 }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: 1, 
              scale: [0.9, 1.1, 0.9], 
              transition: {
                scale: {
                  repeat: Infinity,
                  duration: 2
                }
              }
            }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </motion.div>
        );
      case 'system':
      default:
        return (
          <motion.div 
            className="p-2 bg-gray-100 border border-gray-200 rounded-full relative overflow-hidden z-10"
            whileHover={{ scale: 1.1 }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </motion.div>
        );
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05 // Faster stagger for more items
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <Card title="Recent Activity" className="h-full flex-1 flex flex-col">
      {loading ? (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-4 flex-grow">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="h-10 w-10 bg-[#FFF6F2] dark:bg-[#571C1F]/20 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-[#FFF6F2] dark:bg-[#571C1F]/10 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-[#FFF6F2] dark:bg-[#571C1F]/5 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="h-10 bg-[#FFF6F2] dark:bg-[#571C1F]/10 rounded w-full mt-4 animate-pulse"></div>
        </div>
      ) : (
        <div className="flex flex-col h-full justify-between">
          <motion.div 
            className="space-y-0 relative overflow-y-auto flex-grow pb-2 pt-2 pr-1 custom-scrollbar"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            style={{ maxHeight: 'calc(100% - 44px)' }} // Adjust based on button height
          >
            {/* Static Timeline */}
            <div className="absolute left-5 top-7 bottom-0 w-0.5 bg-gradient-to-b from-[#571C1F]/10 via-[#003B25]/20 to-[#571C1F]/10 z-0"></div>
            
            {/* Activity Items */}
            {activities.map((activity, index) => (
              <motion.div 
                key={activity.id} 
                className="flex items-start space-x-3 p-2 rounded-lg hover:bg-[#FFF6F2]/70 transition-colors relative mb-3"
                variants={itemVariants}
                whileHover={{ 
                  x: 4, 
                  backgroundColor: 'rgba(255, 246, 242, 0.7)',
                  boxShadow: '0 4px 6px -1px rgba(87, 28, 31, 0.05), 0 2px 4px -1px rgba(87, 28, 31, 0.03)',
                  transition: { duration: 0.2 }
                }}
              >
                {/* Timeline Dot */}
                <motion.div
                  className={`absolute left-5 top-[16px] w-2 h-2 rounded-full z-10 ${
                    activity.type === 'sale' ? 'bg-[#003B25]' :
                    activity.type === 'alert' ? 'bg-[#571C1F]' :
                    activity.type === 'inventory' ? 'bg-[#571C1F]/80' :
                    'bg-gray-400'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + (index * 0.05), type: "spring" }}
                  style={{ transform: 'translateX(-4px)' }}
                />
                
                {getActivityIcon(activity.type)}
                
                <div className="flex-1 min-w-0">
                  <motion.p 
                    className="text-sm font-medium text-gray-900"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 + (index * 0.05) }}
                  >
                    {activity.description}
                    {activity.amount && (
                      <motion.span 
                        className="ml-1 font-semibold text-[#571C1F]"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 300, 
                          delay: 0.15 + (index * 0.05) 
                        }}
                      >
                        ₱{activity.amount.toFixed(2)}
                      </motion.span>
                    )}
                  </motion.p>
                  <motion.p 
                    className="text-xs text-gray-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ delay: 0.15 + (index * 0.05) }}
                  >
                    {activity.time}
                  </motion.p>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.button 
            className="w-full text-center py-3 text-sm text-[#571C1F] hover:text-[#003B25] font-medium bg-[#FFF6F2]/50 hover:bg-[#FFF6F2] rounded-md border border-[#571C1F]/10 hover:border-[#571C1F]/30 transition-all duration-300 mt-3 relative overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            whileHover={{ y: -2 }}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
            <span className="relative z-10 flex items-center justify-center">
              View All Activity
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </motion.button>
        </div>
      )}
    </Card>
  );
};

// Define a small CSS class for custom scrollbar styling
const style = document.createElement('style');
style.textContent = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 5px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(87, 28, 31, 0.1);
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(87, 28, 31, 0.2);
  }
`;
document.head.appendChild(style);

export default RecentActivity;