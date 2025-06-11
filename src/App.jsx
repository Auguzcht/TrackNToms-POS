import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SalesProvider } from './hooks/useSales';
import supabase from './services/supabase';
import LoadingScreen from './components/layout/LoadingScreen';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import { useAuth } from './hooks/useAuth';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import SuppliersPage from './pages/SuppliersPage';
import StaffPage from './pages/StaffPage';
import ReportsPage from './pages/ReportsPage';

// Authentication loading component with branded style
const AuthLoading = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-[#FFF6F2]">
    <motion.div
      animate={{ 
        scale: [1, 1.05, 1],
        opacity: [0.8, 1, 0.8] 
      }}
      transition={{ 
        repeat: Infinity, 
        duration: 1.5,
      }}
      className="mb-4"
    >
      <img src="/src/assets/TomNToms-Logo-2.png" alt="TrackNToms Logo" className="h-24" />
    </motion.div>
    <motion.div 
      className="w-48 h-1.5 bg-[#571C1F]/20 rounded-full overflow-hidden relative"
    >
      <motion.div 
        className="absolute top-0 left-0 h-full bg-[#571C1F]"
        animate={{ x: [-192, 192] }}
        transition={{ 
          repeat: Infinity, 
          duration: 1.5,
          ease: "easeInOut" 
        }}
        style={{ width: '50%' }}
      />
    </motion.div>
    <p className="text-[#571C1F] mt-4 font-medium">Verifying authentication...</p>
  </div>
);

// Enhanced Auth Guard Component with better loading state
const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Show branded loading state when checking auth
  if (loading) {
    return <AuthLoading />;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Remember where the user was trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

// Enhanced Role-based Guard Component
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <AuthLoading />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check user role against allowed roles
  const hasRequiredRole = user && allowedRoles.includes(user.role);
  
  if (!hasRequiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function MainApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Listen for auth status changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user?.email);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
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
                            <RoleRoute allowedRoles={['Admin', 'Manager']}>
                              <InventoryPage />
                            </RoleRoute>
                          } 
                        />
                        <Route 
                          path="/suppliers" 
                          element={
                            <RoleRoute allowedRoles={['Admin', 'Manager', 'Supplier']}> {/* Add Supplier role here */}
                              <SuppliersPage />
                            </RoleRoute>
                          } 
                        />
                        <Route 
                          path="/staff" 
                          element={
                            <RoleRoute allowedRoles={['Admin', 'Manager']}>
                              <StaffPage />
                            </RoleRoute>
                          } 
                        />
                        <Route 
                          path="/reports" 
                          element={
                            <RoleRoute allowedRoles={['Admin', 'Manager']}>
                              <ReportsPage />
                            </RoleRoute>
                          } 
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
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
      
      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFF',
            color: '#333',
          },
          success: {
            iconTheme: {
              primary: '#571C1F',
              secondary: 'white',
            },
          },
        }}
      />
    </motion.div>
  );
}

// Modify the App component to handle basename correctly
function App() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(true);

  // Get the correct base URL for the current environment
  const baseUrl = import.meta.env.MODE === 'production' ? '/' : '/TrackNToms-POS';

  // Start app initialization
  useEffect(() => {
    const checkAuthSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        console.log("Auth session check completed:", data.session ? "Session found" : "No active session");
      } catch (error) {
        console.error("Error checking auth session:", error);
      } finally {
        // Complete initial loading regardless of auth status
        setTimeout(() => {
          setInitialLoading(false);
        }, 1000);
      }
    };
    
    checkAuthSession();
  }, []);

  // Handle loading screen animation completion
  const handleLoadingFinished = () => {
    setShowLoading(false);
  };

  // Supplier tab redirection logic
  const SupplierTabRedirect = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    useEffect(() => {
      // Only run for supplier users
      if (user?.role === 'Supplier') {
        // If they access /suppliers without a tab parameter, redirect to purchase orders
        if (location.pathname === '/suppliers' && !location.search.includes('tab=')) {
          console.log('Supplier redirecting to purchase orders');
          navigate('/suppliers?tab=purchase-orders', { replace: true });
        }
        
        // If they try to access a page they shouldn't, redirect to dashboard
        const restrictedPaths = ['/staff', '/reports'];
        if (restrictedPaths.includes(location.pathname)) {
          console.log('Redirecting supplier from restricted path');
          navigate('/', { replace: true });
        }
      }
    }, [location.pathname, location.search, user, navigate]);
    
    return null; // This is just a logic component, no rendering needed
  };

  return (
    <Router basename={baseUrl}>
      <AuthProvider>
        <SalesProvider>
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
                <MainApp />
                <SupplierTabRedirect />
              </motion.div>
            )}
          </AnimatePresence>
        </SalesProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;