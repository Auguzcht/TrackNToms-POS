import { createContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import supabase from '../services/supabase';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        // Check active session - this is where the error might be occurring
        console.log('Checking for existing session...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        const activeSession = data.session;
        setSession(activeSession);
        
        // If we have an active session, fetch the user profile
        if (activeSession) {
          console.log('Active session found, fetching user profile');
          await fetchUserProfile(activeSession.user);
        } else {
          console.log('No active session found');
          setLoading(false);
        }

        // Set up auth listener for changes
        const { data: authData } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            console.log('Auth state changed:', event, currentSession ? currentSession.user?.email : 'No session');
            setSession(currentSession);
            
            if (event === 'SIGNED_IN' && currentSession) {
              await fetchUserProfile(currentSession.user);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setSession(null);
            } else if (event === 'USER_UPDATED' && currentSession) {
              await fetchUserProfile(currentSession.user);
            }
          }
        );

        return () => {
          if (authData?.subscription) {
            authData.subscription.unsubscribe();
          }
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Fetch user profile from staff table
  const fetchUserProfile = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }
    
    try {
      console.log('Fetching user profile for:', authUser.id);
      
      // Get user details from staff table
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', authUser.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        // If there's an error, use the auth user data with a default role
        setUser({ 
          id: authUser.id,
          email: authUser.email,
          role: authUser.user_metadata?.role || 'Cashier',
          first_name: authUser.user_metadata?.first_name || 'Unknown',
          last_name: authUser.user_metadata?.last_name || 'User',
          status: 'Active'
        });
        setLoading(false);
        return;
      }

      // If no staff record found
      if (!data) {
        console.warn('No staff record found for user:', authUser.id);
        setUser({ 
          id: authUser.id,
          email: authUser.email,
          role: authUser.user_metadata?.role || 'Cashier',
          first_name: authUser.user_metadata?.first_name || 'Unknown',
          last_name: authUser.user_metadata?.last_name || 'User',
          status: 'Active'
        });
        setLoading(false);
        return;
      }

      // Map staff record to user object
      setUser({
        id: authUser.id,
        email: authUser.email,
        first_name: data.first_name || authUser.user_metadata?.first_name,
        last_name: data.last_name || authUser.user_metadata?.last_name,
        role: data.position || authUser.user_metadata?.role || 'Cashier',
        status: data.status || 'Active',
        profile_image: data.profile_image || null,
        phone: data.phone || null,
        staff_id: data.staff_id
      });
    } catch (err) {
      console.error('Exception in fetchUserProfile:', err);
      // Fallback to basic user data
      setUser({
        id: authUser.id,
        email: authUser.email,
        role: authUser.user_metadata?.role || 'Cashier',
        first_name: authUser.user_metadata?.first_name || 'Unknown',
        last_name: authUser.user_metadata?.last_name || 'User',
        status: 'Active'
      });
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password, remember = false) => {
    try {
      console.log('Attempting login for:', email);
      
      // Add validation to ensure email and password are provided
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      // Use signInWithPassword for authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error details:', error);
        throw error;
      }

      console.log('Login successful for:', email);
      
      // Return success, actual user profile will be fetched through the auth state listener
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign in. Please check your credentials.'
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('Logging out user');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  // Signup function
  const signup = async (email, password, firstName, lastName) => {
    try {
      console.log('Attempting signup for:', email);
      
      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: 'Cashier' // Default role for self-signup
          }
        }
      });

      if (error) {
        console.error('Signup error details:', error);
        throw error;
      }

      console.log('Signup successful, user created:', data.user?.id);

      // If signup is successful, we need to create a corresponding staff record
      if (data?.user?.id) {
        try {
          const { error: staffError } = await supabase.from('staff').insert({
            user_id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            position: 'Cashier', // Default position for self-signup
            email: email,
            status: 'Pending', // Set as pending until admin approval
            is_active: false, // Inactive until approved
            access_level: 1 // Lowest access level
          });
          
          if (staffError) {
            console.error('Error creating staff record:', staffError);
          } else {
            console.log('Staff record created successfully');
          }
          
          toast.success('Account created! Please check your email to confirm your account.');
        } catch (staffError) {
          console.error('Exception creating staff record:', staffError);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign up. Please try again.'
      };
    }
  };

  // Context value
  const value = {
    user,
    session,
    loading,
    login,
    logout,
    signup,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};