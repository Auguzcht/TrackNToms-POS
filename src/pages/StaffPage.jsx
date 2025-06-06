import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

// Import staff components
import StaffList from '../components/staff/StaffList';
import RoleManager from '../components/staff/RoleManager';
import StaffForm from '../components/staff/StaffForm';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';

// Import hooks
import { useAuth } from '../hooks/useAuth';
import { useStaff } from '../hooks/useStaff';
import { toast } from 'react-hot-toast';

const StaffPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { staff, roles, fetchStaff, fetchRoles, loading, error } = useStaff();
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [iconHovered, setIconHovered] = useState(false);

  // Get tab from URL query parameter or default to 'staff'
  const getTabFromURL = () => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    return tab || 'staff';
  };
  
  const [activeTab, setActiveTab] = useState(getTabFromURL());

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getTabFromURL());
  }, [location.search]);

  // Fetch staff and roles data when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        if (activeTab === 'staff') {
          await fetchStaff();
        } else if (activeTab === 'roles') {
          await fetchRoles();
        }
      } catch (err) {
        console.error("Error loading data:", err);
        toast.error("Failed to load data. Please try again.");
      }
    };
    
    loadData();
  }, [activeTab, fetchStaff, fetchRoles]);

  // Set background color when the component mounts and restore when unmounting
  useEffect(() => {
    const originalBgColor = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#FFF6F2';
    
    return () => {
      document.body.style.backgroundColor = originalBgColor;
    };
  }, []);

  // Check if user has permissions to manage staff
  const canManageStaff = user?.role === 'Admin' || user?.role === 'Manager' || 
    user?.permissions?.includes('staff.manage') || user?.permissions?.includes('staff.edit');

  // Update the URL when tab changes
  const handleTabChange = (tab) => {
    navigate(`/staff?tab=${tab}`);
    if (tab === 'staff') {
      fetchStaff();
    } else if (tab === 'roles') {
      fetchRoles();
    }
  };

  const handleAddStaff = () => {
    setCurrentStaffId(null);
    setModalMode('add');
    setShowStaffModal(true);
  };
  
  const handleEditStaff = (staffId) => {
    setCurrentStaffId(staffId);
    setModalMode('edit');
    setShowStaffModal(true);
  };

  const handleViewStaff = (staffId) => {
    setCurrentStaffId(staffId);
    setModalMode('view');
    setShowStaffModal(true);
  };

  const handleStaffSaved = () => {
    setShowStaffModal(false);
    setCurrentStaffId(null);
    // Refresh data after saving
    fetchStaff();
  };

  const handleModalClose = () => {
    setShowStaffModal(false);
    setCurrentStaffId(null);
  };

  // Get icon based on active tab
  const getTabIcon = () => {
    switch (activeTab) {
      case 'staff':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'roles':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#FFF6F2]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            },
            exit: { opacity: 0 }
          }}
          initial="hidden"
          animate="show"
          exit="exit"
          className="space-y-6"
        >
          {/* Header area with icon and action button */}
          <motion.div 
            className="flex justify-between items-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`icon-${activeTab}`}
                  className="p-2 bg-[#FFF6F2] rounded-md border border-[#571C1F]/20 shadow-md relative overflow-hidden z-10"
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 10, opacity: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 260, 
                    damping: 20,
                    delay: 0.2
                  }}
                  onMouseEnter={() => setIconHovered(true)}
                  onMouseLeave={() => setIconHovered(false)}
                  whileHover={{ 
                    scale: 1.1, 
                    rotate: [0, -5, 5, -5, 0],
                    boxShadow: "0 5px 15px -3px rgba(87, 28, 31, 0.3)",
                    transition: { duration: 0.5 }
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
                  {getTabIcon()}
                </motion.div>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.h1 
                  key={`title-${activeTab}`}
                  className="text-xl font-bold text-[#571C1F]"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'staff' ? 'Staff List' : 'Role Management'}
                </motion.h1>
              </AnimatePresence>
            </motion.div>
            
            {/* Action button */}
            <AnimatePresence mode="wait">
              {activeTab === 'staff' && canManageStaff ? (
                <motion.div 
                  key="staff-action-button-container"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <motion.button 
                    key="add-staff-button"
                    onClick={handleAddStaff}
                    className="px-4 py-2 bg-[#571C1F] text-white rounded-lg shadow-sm font-medium text-sm flex items-center hover:bg-[#4A1519] transition-colors"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.02, y: -1, boxShadow: "0 4px 6px -1px rgba(87, 28, 31, 0.1), 0 2px 4px -1px rgba(87, 28, 31, 0.06)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Add Staff Member
                  </motion.button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>

          {/* Progress bar */}
          <div className="relative">
            <motion.div
              className="h-1 bg-gradient-to-r from-[#571C1F] to-[#003B25] rounded-full mb-6"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.8 }}
            />

            {/* Content area with AnimatePresence for smooth transitions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-lg"
            >
              <AnimatePresence mode="wait">
                {activeTab === 'staff' && (
                  <motion.div
                    key="staff-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <StaffList 
                      onEdit={handleEditStaff} 
                      onView={handleViewStaff}
                      onAdd={handleAddStaff}
                      staff={staff}
                      roles={roles}
                      loading={loading}
                      error={error}
                    />
                  </motion.div>
                )}
                {activeTab === 'roles' && canManageStaff && (
                  <motion.div
                    key="roles-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RoleManager />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Staff Modal with AnimatePresence */}
          <AnimatePresence>
            {showStaffModal && (
              <Modal
                isOpen={showStaffModal}
                onClose={handleModalClose}
                title={
                  modalMode === 'view' 
                    ? "View Staff Member" 
                    : modalMode === 'edit'
                      ? "Edit Staff Member" 
                      : "Add New Staff Member"
                }
                size={modalMode === 'view' ? "4xl" : "3xl"}
                variant={modalMode === 'view' ? 'secondary' : modalMode === 'edit' ? 'secondary' : 'primary'}
              >
                <StaffForm 
                  staffId={currentStaffId}
                  onSave={handleStaffSaved}
                  onCancel={handleModalClose}
                  readOnly={modalMode === 'view'}
                />
              </Modal>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StaffPage;