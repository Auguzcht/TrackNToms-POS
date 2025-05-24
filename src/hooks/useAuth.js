import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook to access authentication functionality
 * 
 * @returns {Object} Authentication context methods and state
 * @throws {Error} If used outside of an AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Extend the context with additional helper functions if needed
  return {
    ...context,
    
    // Helper to check if the user has a specific role
    hasRole: (role) => {
      if (!context.user) return false;
      return context.user.role === role;
    },
    
    // Helper to check if the user has any of the specified roles
    hasAnyRole: (roles) => {
      if (!context.user) return false;
      return roles.includes(context.user.role);
    },
    
    // Check if a user's status is active
    isActive: () => {
      if (!context.user) return false;
      return context.user.status === 'Active';
    },
    
    // Helper to get full name
    getFullName: () => {
      if (!context.user) return '';
      return `${context.user.first_name} ${context.user.last_name}`;
    },
    
    // Helper to get initials
    getInitials: () => {
      if (!context.user) return '';
      return `${context.user.first_name.charAt(0)}${context.user.last_name.charAt(0)}`.toUpperCase();
    }
  };
};