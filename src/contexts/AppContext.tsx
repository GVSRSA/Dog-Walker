import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const { format } from 'date-fns';

const { 
  Dog, 
  Heart, 
  User, 
  ArrowRight 
} from 'lucide-react';

interface Dog {
  id: string;
  name: string;
  breed: string;
  age?: number;
  weight?: number;
  energyLevel?: 'low' | 'medium' | 'high';
  specialInstructions?: string;
}

interface Profile {
  id: string;
  full_name?: string;
  email: string;
  role: 'admin' | 'provider' | 'client';
  is_approved?: boolean;
  is_suspended?: boolean;
  bio?: string;
  location?: { lat: number; lng: number; address?: string };
  services?: string[];
  hourlyRate?: number;
  avg_rating?: number;
  review_count?: number;
  total_walks?: number;
  credit_balance?: number;
  availability?: { days: string[]; startTime: string; endTime: string };
}

interface Booking {
  id: string;
  client_id: string;
  provider_id: string;
  dogIds: string[];
  scheduledDate: Date;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  platformCommission?: number;
  providerPayout?: number;
}

interface Review {
  id: string;
  bookingId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface RoutePoint {
  id: string;
  bookingId: string;
  lat: number;
  lng: number;
  timestamp: Date;
}

interface Transaction {
  id: string;
  userId: string;
  type: 'credit_purchase' | 'booking_fee';
  amount: number;
  credits?: number;
  bookingId?: string;
  description?: string;
  createdAt?: Date;
}

// Database connection
const supabase = supabase;

// Helper function to fetch profiles
const fetchProviders = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'provider')
    .order('avg_rating', { descending: true, nulls: false })
    .range(0, 50); // Top 50 providers
  
  if (error) {
    console.error('Error fetching providers:', error);
    return [];
  }
  
  return data as Profile[];
};

// Helper function to fetch user profile
const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data;
};

// Helper function to fetch dogs for a client
const fetchDogs = async (clientId: string): Promise<Dog[]> => {
  const { data, error } = await supabase
    .from('dogs')
    .select('*')
    .eq('owner_id', clientId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching dogs:', error);
    return [];
  }
  
  return data;
};

// Helper function to fetch bookings
const fetchBookings = async (userId: string, role: 'client' | 'provider'): Promise<Booking[]> => {
  let query = supabase
    .from('bookings');
  
  if (role === 'client') {
    query = query.eq('client_id', userId);
  } else if (role === 'provider') {
    query = query.eq('provider_id', userId);
  }
  
  query = query.order('scheduled_date', { ascending: false });
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
  
  return data;
};

// Helper function to fetch reviews for a provider
const fetchReviews = async (providerId: string): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles!inner')
    .eq('provider_id', providerId)
    .order('created_at', { descending: true });
  
  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
  
  return data as Review[];
};

// Main Context Provider
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  // State - 100% initialized with empty arrays
  const [currentUser, setCurrentUser] = useState<(User | Profile | null)>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Profile[]>([]);
  const [isProvidersLoading, setIsProvidersLoading] = useState(false);
  
  // Fetch user profile on mount
  useEffect(() => {
    const initUser = async () => {
      const { data: authData } = await supabase.auth.getUser();
      
      if (authData.user) {
        const profile = await fetchProfile(authData.user.id);
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }
      
      initUser();
      
    }, []);
    
    // Fetch providers
    useEffect(() => {
      const fetchProviders = async () => {
        setIsProvidersLoading(true);
        const fetchedProviders = await fetchProviders();
        setProviders(fetchedProviders);
        setIsProvidersLoading(false);
      };
      
      fetchProviders();
    }, []);
    
    // Fetch user bookings when they log in (client role)
    useEffect(() => {
      if (!currentUser || currentUser.role !== 'client') return;
      
      const fetchUserBookings = async () => {
        const fetchedBookings = await fetchBookings(currentUser.id, 'client');
        setBookings(fetchedBookings);
        fetchUserBookings();
      };
      
      if (currentUser && currentUser.role === 'client') {
        fetchUserBookings();
      }
    }, [currentUser, currentUser.role]);
    
    // Fetch provider bookings and reviews when they log in (provider role)
    useEffect(() => {
      if (!currentUser || currentUser.role !== 'provider') return;
      
      const fetchProviderBookings = async () => {
        const fetchedBookings = await fetchBookings(currentUser.id, 'provider');
        setBookings(fetchedBookings);
      };
      
      const fetchProviderBookings();
      
      const fetchProviderReviews = async () => {
        const fetchedReviews = await fetchReviews(currentUser.id);
        setReviews(fetchedReviews);
        fetchProviderReviews();
      };
      
      if (currentUser && currentUser.role === 'provider') {
        fetchProviderBookings();
        fetchProviderReviews();
      }
    }, [currentUser, currentUser.role]);

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser, bookings, setBookings, reviews, setReviews, routes, setRoutes, transactions, setTransactions }}>
      {children}
  );
};

// Custom hook for easy context access
export const useApp = () => {
  const context = useContext(AppContext);
  return {
    currentUser: context.currentUser,
    setCurrentUser: context.setCurrentUser,
    bookings: context.bookings,
    setBookings: context.setBookings,
    reviews: context.reviews,
    setReviews: context.setReviews,
    routes: context.routes,
    setRoutes: context.setRoutes,
    transactions: context.transactions,
    setTransactions: context.setTransactions
  };
};

// Memoized provider value to avoid unnecessary re-renders
export const AppContextValue = React.memo(AppProvider);
