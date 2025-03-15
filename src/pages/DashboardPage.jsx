import { motion } from 'framer-motion';
import { useEffect } from 'react';
import Dashboard from '../components/dashboard/Dashboard';

const DashboardPage = () => {
  // Set the background color when the component mounts and restore when unmounting
  useEffect(() => {
    // Save the original background color
    const originalBgColor = document.body.style.backgroundColor;
    
    // Set the new background color for the dashboard
    document.body.style.backgroundColor = '#FFF6F2';
    
    // Restore the original background color when component unmounts
    return () => {
      document.body.style.backgroundColor = originalBgColor;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="py-0 bg-[#FFF6F2]" // Added explicit bg color here
      style={{ backgroundColor: '#FFF6F2' }} // Backup inline style for reliable color application
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#FFF6F2]"> {/* Added bg color here too */}
        {/* Content grid with smooth animations */}
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
          className="dashboard-content bg-[#FFF6F2]" // Added bg color here as well
        >
          <Dashboard />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;