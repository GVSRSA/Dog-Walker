import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch all dogs for a client
 */
export const fetchDogs = async (clientId: string): Promise<Dog[]> => {
  try {
    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .eq('owner_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
    console.error('Error fetching dogs:', error);
    return [];
  }
    
  return data as Dog[];
  } catch (err) {
    console.error('Error in fetchDogs:', err);
    return [];
  }
};

/**
 * Fetch all approved providers
 */
export const fetchProviders = async (): Promise<Profile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'provider')
      .in('is_approved', true)
      .in('is_suspended', false)
      .order('avg_rating', { descending: true, nulls: false })
      .limit(50); // Top 50 providers by rating
  
  if (error) {
    console.error('Error fetching providers:', error);
    return [];
  }
  
  return data as Profile[];
  } catch (err) {
    console.error('Error in fetchProviders:', err);
    return [];
  }
};

/**
 * Fetch a single profile by ID
 */
export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  try {
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
  } catch (err) {
    console.error('Error in fetchProfile:', err);
    return null;
  }
};

/**
 * Fetch bookings for a user
 */
export const fetchBookings = async (userId: string, role: 'client' | 'provider' = 'client'): Promise<Booking[]> => {
  try {
    let query = supabase.from('bookings');
    
    if (role === 'client') {
      query = query.eq('client_id', userId);
    } else if (role === 'provider') {
      query = query.eq('provider_id', userId);
    } else {
      console.error('Invalid role:', role);
      return [];
    }
    
    query = query.order('scheduled_date', { ascending: false });
    const { data, error } = await query;
  
    if (error) {
      console.error('Error fetching bookings:', error);
    return [];
  }
  
  return data as Booking[];
  } catch (err) {
    console.error('Error in fetchBookings:', err);
    return [];
  }
};

/**
 * Fetch reviews for a provider
 */
export const fetchReviews = async (providerId: string): Promise<Review[]> => {
  try {
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
  } catch (err) {
    console.error('Error in fetchReviews:', err);
    return [];
  }
};

/**
 * Get provider for booking
 */
export const fetchProviderProfile = (userId: string): Promise<Profile | null> => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!data) {
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Error in fetchProviderProfile:', err);
    return null;
  }
};

/**
 * Fetch user by email and password (used in login)
 */
export const fetchUser = async (email: string, password: string): Promise<any> => {
  try {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();
  
    if (!data) {
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Error in fetchUser:', err);
    return null;
  }
};