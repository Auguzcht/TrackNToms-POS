import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import { toast } from 'react-hot-toast';

// Create context for authentication
const AuthContext = createContext(null);

// Token storage keys
const AUTH_TOKEN_KEY = 'track_n_toms_auth_token';
const AUTH_USER_KEY = 'track_n_toms_auth_user';
const AUTH_EXPIRY_KEY = 'track_n_toms_auth_expiry';

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Initialize auth state from localStorage on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
        const storedUser = localStorage.getItem(AUTH_USER_KEY);
        const expiry = localStorage.getItem(AUTH_EXPIRY_KEY);
        
        if (storedToken && storedUser && expiry) {
          // Check if token is expired
          if (new Date().getTime() > parseInt(expiry)) {
            // Token expired, clean up and stay logged out
            clearAuthData();
          } else {
            // Set up axios auth header
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            
            // Parse the stored user
            const user = JSON.parse(storedUser);
            setCurrentUser(user);
            
            // Fetch user permissions
            await fetchUserPermissions(user.id);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError('Failed to initialize authentication');
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Function to fetch user permissions
  const fetchUserPermissions = async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/staff/${userId}/permissions`);
      setUserPermissions(response.data.permissions || []);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      // Default to empty permissions if fetch fails
      setUserPermissions([]);
    }
  };

  // Function to login a user
  const login = async (username, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });
      
      const { user, token, expiresIn } = response.data;
      
      // Calculate expiry time
      const expiryTime = new Date().getTime() + expiresIn * 1000;
      
      // Store auth data
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toString());
      
      // Set up axios auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update state
      setCurrentUser(user);
      
      // Fetch user permissions
      await fetchUserPermissions(user.id);
      
      // Redirect to dashboard
      navigate('/dashboard');
      
      toast.success(`Welcome back, ${user.firstName}!`);
      return true;
    } catch (err) {
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (err.response.status === 401) {
          errorMessage = 'Invalid username or password';
        } else if (err.response.status === 403) {
          errorMessage = 'Your account is inactive. Please contact an administrator.';
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to log out a user
  const logout = () => {
    clearAuthData();
    toast.success('You have been logged out');
    navigate('/login');
  };

  // Function to clear all auth data
  const clearAuthData = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
    
    // Remove auth header
    delete axios.defaults.headers.common['Authorization'];
    
    // Update state
    setCurrentUser(null);
    setUserPermissions([]);
  };

  // Check if user has a specific permission
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    
    // If user is an administrator, grant all permissions
    if (currentUser.isAdmin) return true;
    
    return userPermissions.includes(permission);
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissions = []) => {
    if (!currentUser) return false;
    
    // If user is an administrator, grant all permissions
    if (currentUser.isAdmin) return true;
    
    return permissions.some(permission => userPermissions.includes(permission));
  };

  // Function to handle password recovery request
  const requestPasswordReset = async (email) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.post(`${API_BASE_URL}/auth/password-reset-request`, { email });
      toast.success('If the email exists in our system, password reset instructions have been sent.');
      return true;
    } catch (err) {
      // We don't want to reveal if an email exists in the system or not
      // for security reasons, so we'll still show a success message even if
      // the request fails (unless it's a server error)
      if (err.response && err.response.status >= 500) {
        const errorMessage = 'Server error. Please try again later.';
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      }
      
      toast.success('If the email exists in our system, password reset instructions have been sent.');
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to reset password using token
  const resetPassword = async (token, newPassword) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.post(`${API_BASE_URL}/auth/password-reset`, {
        token,
        newPassword
      });
      
      toast.success('Password has been reset successfully. You can now log in with your new password.');
      navigate('/login');
      return true;
    } catch (err) {
      let errorMessage = 'Failed to reset password. The link may have expired or is invalid.';
      
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to change password when logged in
  const changePassword = async (currentPassword, newPassword) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.post(`${API_BASE_URL}/auth/change-password`, {
        currentPassword,
        newPassword
      });
      
      toast.success('Password changed successfully');
      return true;
    } catch (err) {
      let errorMessage = 'Failed to change password';
      
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update user profile
  const updateProfile = async (userData) => {
    if (!currentUser) {
      toast.error('You need to be logged in to update your profile');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(`${API_BASE_URL}/staff/${currentUser.id}/profile`, userData);
      
      // Update stored user data
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      toast.success('Profile updated successfully');
      return true;
    } catch (err) {
      let errorMessage = 'Failed to update profile';
      
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    currentUser,
    isLoading,
    error,
    setError,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    requestPasswordReset,
    resetPassword,
    changePassword,
    updateProfile
  };

  // Return the provider with the auth state and functions
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC for protected routes
export const withProtectedRoute = (Component, requiredPermissions = []) => {
  const ProtectedRoute = (props) => {
    const { currentUser, isLoading, hasAnyPermission } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!isLoading && !currentUser) {
        // User is not logged in, redirect to login
        navigate('/login', { state: { from: window.location.pathname } });
      } else if (!isLoading && currentUser && requiredPermissions.length > 0) {
        // Check if user has required permissions
        if (!hasAnyPermission(requiredPermissions)) {
          // User doesn't have required permissions
          toast.error('You do not have permission to access this page');
          navigate('/dashboard');
        }
      }
    }, [currentUser, isLoading, navigate]);

    // Show loading while checking auth
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-dark">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-3 text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      );
    }

    // If auth check passed, render the component
    return currentUser ? <Component {...props} /> : null;
  };

  return ProtectedRoute;
};

export default { AuthProvider, useAuth, withProtectedRoute };