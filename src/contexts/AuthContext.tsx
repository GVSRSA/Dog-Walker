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
  clearRedirectFlag: () => void;
  needsRedirectToLanding: boolean;
  needsProfileCompletion: boolean;
  setNeedsProfileCompletion: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to safely transform database profile to our Profile type with defaults
const transformProfile = (dbProfile: any): Profile => {
  return {
    id: dbProfile.id || '',
    email: dbProfile.email || '',
    full_name: dbProfile.full_name || '',
    role: dbProfile.role || 'client',
    // Admins are auto-approved, others default to false
    is_approved: dbProfile.is_approved ?? dbProfile.role === 'admin',
    is_suspended: dbProfile.is_suspended ?? false,
    bio: dbProfile.bio || undefined,
    location: dbProfile.location || undefined,
    services: dbProfile.services || undefined,
    hourly_rate: dbProfile.hourly_rate || undefined,
    credit_balance: dbProfile.credit_balance || undefined,
    total_walks: dbProfile.total_walks || undefined,
    avg_rating: dbProfile.avg_rating || undefined,
    review_count: dbProfile.review_count || undefined,
    created_at: dbProfile.created_at || new Date().toISOString(),
    updated_at: dbProfile.updated_at || undefined,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsRedirectToLanding, setNeedsRedirectToLanding] = useState(false);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  useEffect(() => {
    const initUser = async () => {
      console.log('[AuthContext] Checking user session...');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.log('[AuthContext] Session invalid, clearing it:', error.message);
        // Silently clear the invalid session
        await supabase.auth.signOut();
        // Only set redirect flag if not already on landing page
        const currentPath = window.location.pathname;
        if (currentPath !== '/' && currentPath !== '/login' && currentPath !== '/register') {
          setNeedsRedirectToLanding(true);
        }
        return;
      }
      
      if (user) {
        console.log('[AuthContext] User found:', { id: user.id, email: user.email });
        // Fetch profile from database - using select(*) for simplicity and safety
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            // Check for specific error types
            if (profileError.code === 'PGRST116') {
              // Profile not found - user needs to complete profile
              console.log('[AuthContext] Profile not found, user needs to complete profile');
              setCurrentUser(null);
              setIsAuthenticated(false);
              setNeedsProfileCompletion(true);
              return;
            } else if (profileError.code === '42P01') {
              // Table does not exist - critical system error
              console.error('[AuthContext] Profiles table does not exist:', profileError.message);
              setCurrentUser(null);
              setIsAuthenticated(false);
              setNeedsProfileCompletion(false);
              return;
            } else {
              // Other errors - log but don't trigger profile completion
              console.error('[AuthContext] Profile fetch error:', profileError.message, profileError.code);
              setCurrentUser(null);
              setIsAuthenticated(false);
              setNeedsProfileCompletion(false);
              return;
            }
          }
          
          if (profile) {
            console.log('[AuthContext] Profile loaded:', { id: profile.id, role: profile.role });
            const transformedProfile = transformProfile(profile);
            setCurrentUser(transformedProfile);
            setIsAuthenticated(true);
            setNeedsProfileCompletion(false);
          }
        } catch (err) {
          console.error('[AuthContext] Unexpected error fetching profile:', err);
          setCurrentUser(null);
          setIsAuthenticated(false);
          setNeedsProfileCompletion(true);
        }
      } else {
        // No session - treat as guest (silent fail, no alerts)
        console.log('[AuthContext] No session found, treating as guest');
        setCurrentUser(null);
        setIsAuthenticated(false);
        setNeedsProfileCompletion(false);
      }
    };
    
    initUser();
  }, []);

  const login = async (email: string, password: string): Promise<Profile | null> => {
    try {
      console.log('[AuthContext] Starting login for:', email);
      
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Login failed:', error);
        throw error;
      }

      console.log('[AuthContext] Auth successful for user:', data.user?.id);

      if (data.user) {
        // Fetch profile from database - using select(*) for simplicity
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (profileError) {
            console.error('[AuthContext] Profile fetch failed:', profileError);
            
            // Provide more descriptive error messages
            if (profileError.code === 'PGRST116') {
              throw new Error('Profile not found. Please complete your profile setup.');
            } else if (profileError.code === '42P01') {
              throw new Error('System error: Profiles table not found. Please contact support.');
            } else {
              throw new Error(`Unable to load profile: ${profileError.message}`);
            }
          }
          
          if (profile) {
            console.log('[AuthContext] Profile loaded, updating auth state:', { id: profile.id, role: profile.role, is_approved: profile.is_approved });
            const transformedProfile = transformProfile(profile);
            console.log('[AuthContext] Transformed profile with admin auto-approval:', { 
              id: transformedProfile.id, 
              role: transformedProfile.role, 
              is_approved: transformedProfile.is_approved 
            });
            setCurrentUser(transformedProfile);
            setIsAuthenticated(true);
            setNeedsProfileCompletion(false);
            return transformedProfile;
          }
        } catch (err) {
          console.error('[AuthContext] Unexpected error in login:', err);
          throw err;
        }
      }

      return null;
    } catch (err) {
      console.error('[AuthContext] Login error:', err);
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
      console.log('[AuthContext] Starting registration for:', email);
      
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Supabase auth signup failed:', error);
        throw error;
      }

      console.log('[AuthContext] Supabase auth signup successful:', { userId: data.user?.id });

      if (data.user) {
        // Create profile in database with all required fields
        // IMPORTANT: Using auth.user.id for the profiles table id column
        console.log('[AuthContext] Creating profile in database with id:', data.user.id);
        
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,  // Using auth.user.id
              email,
              full_name: fullName,
              role,
            })
            .select('*')
            .single();

          if (profileError) {
            console.error('[AuthContext] Profile creation failed:', profileError);
            
            // Check for table not existing error
            if (profileError.code === '42P01') {
              throw new Error('System error: Profiles table not found. Please contact support.');
            }
            
            // Show detailed error message if profile creation fails
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }

          console.log('[AuthContext] Profile created successfully:', { id: profile.id, role: profile.role });
          
          const transformedProfile = transformProfile(profile);

          // Set current user state BEFORE returning
          setCurrentUser(transformedProfile);
          setIsAuthenticated(true);
          
          console.log('[AuthContext] Registration complete, auth state updated');
          
          return transformedProfile;
        } catch (err) {
          console.error('[AuthContext] Unexpected error in registration:', err);
          throw err;
        }
      }

      return null;
    } catch (err) {
      console.error('[AuthContext] Registration error:', err);
      throw err;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const clearStaleSession = async () => {
    console.log('[AuthContext] Manually clearing session...');
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const clearRedirectFlag = () => {
    console.log('[AuthContext] Clearing redirect flag');
    setNeedsRedirectToLanding(false);
  };

  const value = {
    currentUser,
    setCurrentUser,
    isAuthenticated,
    login,
    register,
    logout,
    clearStaleSession,
    clearRedirectFlag,
    needsRedirectToLanding,
    needsProfileCompletion,
    setNeedsProfileCompletion,
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