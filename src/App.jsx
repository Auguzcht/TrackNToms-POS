import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { SalesProvider } from './context/SalesContext';
import LoadingScreen from './components/layout/LoadingScreen';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import { useAuth } from './hooks/useAuth';
import { API_BASE_URL } from './config/constants';
import DatabaseConnectionTest from './components/common/DatabaseConnectionTest';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import SuppliersPage from './pages/SuppliersPage';
import StaffPage from './pages/StaffPage';
import ReportsPage from './pages/ReportsPage';

// Auth Guard Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Role-based Guard Component
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Start app initialization
  useEffect(() => {
    // In a real app, you might load initial data here
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Handle loading screen animation completion
  const handleLoadingFinished = () => {
    setShowLoading(false);
  };

  // Main app content with entrance animation
  const appContent = (
    <Router basename="/TrackNToms-POS">
      <AuthProvider>
        <SalesProvider>
          <motion.div 
            className="flex flex-col min-h-screen w-screen max-w-[100vw] overflow-x-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen flex flex-col bg-[#FFF6F2] dark:bg-[#FFF6F2] w-full">
                      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
                      <div className="flex flex-1 w-full relative overflow-hidden">
                        <Sidebar isOpen={isSidebarOpen} />
                        
                        <main className={`flex-grow transition-all duration-300 ${isSidebarOpen ? 'md:ml-60' : ''} w-full overflow-x-hidden flex flex-col`}>
                          <div className="w-full px-4 py-8 flex-grow">
                            <Routes>
                              <Route path="/" element={<DashboardPage />} />
                              <Route path="/pos" element={<POSPage />} />
                              <Route 
                                path="/inventory" 
                                element={
                                  <RoleRoute allowedRoles={['Manager']}>
                                    <InventoryPage />
                                  </RoleRoute>
                                } 
                              />
                              <Route 
                                path="/suppliers" 
                                element={
                                  <RoleRoute allowedRoles={['Manager']}>
                                    <SuppliersPage />
                                  </RoleRoute>
                                } 
                              />
                              <Route 
                                path="/staff" 
                                element={
                                  <RoleRoute allowedRoles={['Manager']}>
                                    <StaffPage />
                                  </RoleRoute>
                                } 
                              />
                              <Route 
                                path="/reports" 
                                element={
                                  <RoleRoute allowedRoles={['Manager']}>
                                    <ReportsPage />
                                  </RoleRoute>
                                } 
                              />
                            </Routes>
                          </div>
                          <Footer />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </motion.div>
        </SalesProvider>
      </AuthProvider>
    </Router>
  );

  return (
    <AnimatePresence mode="wait">
      {showLoading ? (
        <LoadingScreen 
          key="loading-screen" 
          finishLoading={handleLoadingFinished} 
          isInitialLoadingComplete={!initialLoading}
        />
      ) : (
        <motion.div
          key="app-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          {appContent}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;