import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Check for stored user on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);
  
  // In a real app, we'd validate the token with the server here
  
  const login = async (email, password) => {
    // TODO: Replace with actual API call
    try {
      // Mock login - replace with actual API call
      // This is just for development purposes
      if (email === 'manager@example.com' && password === 'password') {
        const userData = {
          staff_id: 1,
          first_name: 'Admin',
          last_name: 'User',
          email: 'manager@example.com',
          role: 'Manager',
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      } 
      else if (email === 'cashier@example.com' && password === 'password') {
        const userData = {
          staff_id: 2,
          first_name: 'Cashier',
          last_name: 'User',
          email: 'cashier@example.com',
          role: 'Cashier',
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      }
      else {
        return { 
          success: false, 
          error: 'Invalid email or password'
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };
  
  const value = {
    user,
    loading,
    login,
    logout,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};