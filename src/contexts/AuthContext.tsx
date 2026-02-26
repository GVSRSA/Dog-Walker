import { useState, useEffect, createContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  password: string;
}

// Database connection
const supabase = supabase;

/**
 * Fetch user from Supabase by email and password
 */
const fetchUser = async (email: string, password: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Error in fetchUser:', err);
    return null;
  }
};

/**
 * Login user
 */
const login = async (email: string, password: string): Promise<User | null> => {
  try {
    // Try to fetch user first to verify credentials
    const user = await fetchUser(email, password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .update({
        // Update last_login to now
        last_login: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Login failed:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Login error:', err);
    throw err;
  }
};

/**
 * Register new user
 */
const register = async (email: string, password: string, role: 'client' | 'provider'): Promise<void> => {
  try {
    const { data } = await supabase
      .from('users')
      .insert({
        email,
        password,
        role,
        is_approved: false,
        is_suspended: false,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Registration failed:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Registration error:', err);
    throw err;
  }
};

/**
 * Logout user - clears session
 */
const logout = async (): Promise<void> => {
  try {
    // Try Supabase logout endpoint
    const { data } = await supabase
      .post('/auth/v1/logout', {
        credentials: 'include',
        mode: 'cors'
      });

    if (error) {
      console.error('Logout failed:', error);
    }
    
    return data;
  } catch (err) {
    console.error('Logout error:', err);
    }
};

// Context Types
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  register: (email: string, password: string, role: 'client' | 'provider') => Promise<void>;
  logout: () => Promise<void>;
  setCurrentUser: (user: User) => void;
  setIsAuthenticated: (value: boolean) => void;
}

// Create Context
const AuthContext = createContext<AuthContextType>(null);

// Main Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch current user on mount
  useEffect(() => {
    const initUser = async () => {
      const { data: user } = await supabase.auth.getUser();
      
      if (data) {
        setCurrentUser(data);
        setIsAuthenticated(true);
      }
    };
    
    initUser();
  }, []);

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Login handler
  const handleLogin = async (email: string, password: string) => {
    try {
      const user = await login(email, password);
      setCurrentUser(user);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  // Register handler
  const handleRegister = async (email: string, password: string, role: 'client' | 'provider') => {
    try {
      await register(email, password, role);
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const value = {
    currentUser,
    setCurrentUser,
    isAuthenticated,
    login: handleLogin,
    register: handleRegister,
    logout,
    setCurrentUser,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};