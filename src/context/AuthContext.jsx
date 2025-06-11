import { createContext, useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import supabase from '../services/supabase';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const initializedRef = useRef(false);

  // Single auth initialization - rely ONLY on onAuthStateChange
  useEffect(() => {
    // Prevent multiple initializations
    if (initializedRef.current) {
      console.log('Auth already initialized, skipping...');
      return;
    }

    console.log('Initializing auth listener...');
    initializedRef.current = true;

    // Set up the auth state listener - this handles EVERYTHING
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.email || 'No session');
        
        // Always update session state first
        setSession(currentSession);
        
        switch (event) {
          case 'INITIAL_SESSION':
            // This handles both fresh page loads AND returning from inactive tabs
            if (currentSession) {
              console.log('Initial session found, fetching user profile');
              try {
                await fetchUserProfile(currentSession.user);
                setConnectionStatus('connected');
              } catch (error) {
                console.error('Error during initial profile fetch:', error);
                setConnectionStatus('degraded');
              }
            } else {
              console.log('No initial session found');
              setUser(null);
            }
            setLoading(false);
            break;

          case 'SIGNED_IN':
            console.log('User signed in');
            // Only handle this if it's NOT during initial load
            if (!loading) {
              try {
                await fetchUserProfile(currentSession.user);
                setConnectionStatus('connected');
                toast.success('Successfully signed in!');
              } catch (error) {
                console.error('Error during sign-in profile fetch:', error);
                setConnectionStatus('degraded');
              }
            }
            break;

          case 'SIGNED_OUT':
            console.log('User signed out');
            setUser(null);
            setSession(null);
            setConnectionStatus('connected');
            setLoading(false);
            break;

          case 'USER_UPDATED':
            console.log('User updated');
            if (currentSession) {
              try {
                await fetchUserProfile(currentSession.user);
              } catch (error) {
                console.error('Error during user update profile fetch:', error);
              }
            }
            break;

          case 'TOKEN_REFRESHED':
            console.log('Token refreshed successfully');
            setConnectionStatus('connected');
            // Don't refetch profile on token refresh - user data hasn't changed
            break;

          default:
            console.log('Unhandled auth event:', event);
        }
      }
    );

    // Cleanup function
    return () => {
      console.log('Cleaning up auth listener');
      subscription.unsubscribe();
      initializedRef.current = false;
    };
  }, []); // Empty dependency array - initialize once and only once

  // Fetch user profile from staff table
  const fetchUserProfile = async (authUser) => {
    if (!authUser) {
      setUser(null);
      return;
    }
    
    try {
      console.log('Fetching user profile for:', authUser.id);
      
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', authUser.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      
      if (!data) {
        console.warn('No staff record found for user:', authUser.id);
        
        // Create fallback user object
        const fallbackUser = { 
          id: authUser.id,
          email: authUser.email,
          role: authUser.user_metadata?.role || 'Cashier',
          first_name: authUser.user_metadata?.first_name || 'Unknown',
          last_name: authUser.user_metadata?.last_name || 'User',
          status: 'Active'
        };
        
        setUser(fallbackUser);
        
        // Try to create a staff record if missing
        try {
          const { error: insertError } = await supabase.from('staff').insert({
            user_id: authUser.id,
            first_name: authUser.user_metadata?.first_name || 'Unknown',
            last_name: authUser.user_metadata?.last_name || 'User',
            email: authUser.email,
            position: authUser.user_metadata?.role || 'Cashier',
            status: 'Active',
            is_active: true
          });
          
          if (!insertError) {
            console.log('Created missing staff record for user:', authUser.id);
          }
        } catch (createErr) {
          console.error('Failed to create staff record:', createErr);
        }
      } else {
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
      }

      setConnectionStatus('connected');
    } catch (err) {
      console.error('Error fetching user profile:', err);
      
      // Set connection status based on error type
      if (err.message?.includes('network') || err.code === 'NETWORK_ERROR') {
        setConnectionStatus('disconnected');
      } else {
        setConnectionStatus('degraded');
      }
      
      // Fallback to basic user data from auth
      setUser({
        id: authUser.id,
        email: authUser.email,
        role: authUser.user_metadata?.role || 'Cashier',
        first_name: authUser.user_metadata?.first_name || 'Unknown',
        last_name: authUser.user_metadata?.last_name || 'User',
        status: 'Active'
      });
    }
  };

  // Login function
  const login = async (email, password, remember = false) => {
    try {
      console.log('Attempting login for:', email, 'with remember:', remember);
      
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          // Configure session persistence based on remember checkbox
          // When true: persists session in localStorage (default)
          // When false: uses sessionStorage (cleared when browser is closed)
          persistSession: remember 
        }
      });

      if (error) {
        console.error('Login error details:', error);
        return {
          success: false,
          error: error.message || 'Failed to sign in. Please check your credentials.'
        };
      }

      console.log('Login successful for:', email);
      setConnectionStatus('connected');
      
      // Set user and session immediately to trigger redirect
      setSession(data.session);
      
      // Fetch user profile immediately instead of waiting for auth state change
      if (data.user) {
        try {
          await fetchUserProfile(data.user);
        } catch (profileError) {
          console.error('Error fetching profile after login:', profileError);
        }
      }
      
      setLoading(false);
      
      // Return success so the login form can handle UI updates
      return { 
        success: true,
        redirectTo: '/' // Include a redirect target
      };
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
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.warn('Logout API error:', error);
        toast.warning('Logged out with some errors. You may need to clear browser data.');
      } else {
        toast.success('Logged out successfully');
      }
      
      // onAuthStateChange will handle clearing user/session state
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to complete logout properly');
      
      // Force clear state anyway for better UX
      setUser(null);
      setSession(null);
    }
  };

  // Refresh the session manually
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        setConnectionStatus('degraded');
        return false;
      }
      
      console.log('Session refresh successful');
      setConnectionStatus('connected');
      // onAuthStateChange will handle the TOKEN_REFRESHED event
      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      setConnectionStatus('disconnected');
      return false;
    }
  };

  // Signup function (disabled)
  const signup = async (email, password, userData = {}) => {
    return {
      success: false,
      error: 'Direct signup is disabled. New accounts can only be created by an administrator.'
    };
  };

  // Connection status toast notifications
  useEffect(() => {
    if (connectionStatus === 'disconnected' && user) {
      toast.error(
        'Connection to server lost. Please check your internet connection.', 
        { 
          duration: 8000,
          id: 'connection-lost'
        }
      );
    }
    
    if (connectionStatus === 'connected' && user) {
      toast.dismiss('connection-lost');
    }
  }, [connectionStatus, user]);

  // Context value
  const value = {
    user,
    session,
    loading,
    login,
    logout,
    signup,
    refreshSession,
    isAuthenticated: !!session, // Use session for accuracy
    connectionStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};