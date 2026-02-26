import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types';

interface AuthContextType {
  currentUser: Profile | null;
  setCurrentUser: (user: Profile | null) => void;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<Profile | null>;
  register: (email: string, password: string, fullName: string, role: 'client' | 'provider') => Promise<Profile | null>;
  logout: () => void;
  clearStaleSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initUser = async () => {
      console.log('[AuthContext] Initializing user session...');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('[AuthContext] Error getting user:', error);
        
        // If the user from the JWT doesn't exist (stale session from deleted user), clear it
        if (error.message?.includes('does not exist') || error.name === 'AuthApiError') {
          console.log('[AuthContext] Clearing stale session...');
          await supabase.auth.signOut();
        }
        return;
      }
      
      if (user) {
        console.log('[AuthContext] User found:', { id: user.id, email: user.email });
        // Fetch profile from database
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('[AuthContext] Error fetching profile:', profileError);
          return;
        }
        
        if (profile) {
          console.log('[AuthContext] Profile loaded:', { id: profile.id, role: profile.role });
          setCurrentUser(profile);
          setIsAuthenticated(true);
        }
      } else {
        console.log('[AuthContext] No user session found');
      }
    };
    
    initUser();
  }, []);

  const login = async (email: string, password: string): Promise<Profile | null> => {
    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Fetch profile from database
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profile) {
          setCurrentUser(profile);
          setIsAuthenticated(true);
          return profile;
        }
      }

      return null;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const register = async (
    email: string, 
    password: string, 
    fullName: string, 
    role: 'client' | 'provider'
  ): Promise<Profile | null> => {
    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Create profile in database with all required fields
        // Note: created_at, updated_at, credit_balance, avg_rating, review_count, is_suspended are handled automatically by database DEFAULT constraints
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            role,
          })
          .select('*')
          .single();

        if (profileError) {
          // Show detailed error message if profile creation fails
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }

        // Set current user state
        setCurrentUser(profile);
        setIsAuthenticated(true);
        
        return profile;
      }

      return null;
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    }
  };

  const logout = () => {
    supabase.auth.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const clearStaleSession = async () => {
    console.log('[AuthContext] Manually clearing session...');
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    currentUser,
    setCurrentUser,
    isAuthenticated,
    login,
    register,
    logout,
    clearStaleSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};