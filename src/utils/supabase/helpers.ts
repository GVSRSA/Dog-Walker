import { supabase } from '@/integrations/supabase/client';
import type { Profile, Dog, Booking, Review } from '@/types';

/**
 * Fetch all dogs for a client
 */
export const fetchDogs = async (clientId: string): Promise<{ data: Dog[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .eq('owner_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching dogs:', error);
      return { data: [], error };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error in fetchDogs:', err);
    return { data: [], error: err };
  }
};

/**
 * Fetch all approved providers
 */
export const fetchProviders = async (): Promise<{ data: Profile[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'provider')
      .eq('is_approved', true)
      .eq('is_suspended', false)
      .order('avg_rating', { ascending: false, nullsFirst: false })
      .limit(50); // Top 50 providers by rating
  
    if (error) {
      console.error('Error fetching providers:', error);
      return { data: [], error };
    }
  
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error in fetchProviders:', err);
    return { data: [], error: err };
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
export const fetchBookings = async (userId: string, role: 'client' | 'provider' = 'client'): Promise<{ data: Booking[]; error: any }> => {
  try {
    // Include dog name so dashboards can render a real schedule.
    let query = supabase.from('bookings').select('*, dogs(name)');
    
    if (role === 'client') {
      query = query.eq('client_id', userId);
    } else if (role === 'provider') {
      query = query.eq('provider_id', userId);
    } else {
      console.error('Invalid role:', role);
      return { data: [], error: new Error('Invalid role') };
    }
    
    query = query.order('scheduled_date', { ascending: false });
    const { data, error } = await query;
  
    if (error) {
      console.error('Error fetching bookings:', error);
      return { data: [], error };
    }
  
    return { data: (data || []) as any, error: null };
  } catch (err) {
    console.error('Error in fetchBookings:', err);
    return { data: [], error: err };
  }
};

/**
 * Fetch reviews for a provider
 */
export const fetchReviews = async (providerId: string): Promise<{ data: Review[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error fetching reviews:', error);
      return { data: [], error };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error in fetchReviews:', err);
    return { data: [], error: err };
  }
};

/**
 * Fetch all profiles (for admin dashboard)
 */
export const fetchAllProfiles = async (): Promise<{ data: Profile[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error fetching profiles:', error);
      return { data: [], error };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error in fetchAllProfiles:', err);
    return { data: [], error: err };
  }
};

/**
 * Fetch all bookings (for admin dashboard)
 */
export const fetchAllBookings = async (): Promise<{ data: Booking[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('scheduled_date', { ascending: false });
  
    if (error) {
      console.error('Error fetching bookings:', error);
      return { data: [], error };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error in fetchAllBookings:', err);
    return { data: [], error: err };
  }
};

/**
 * Fetch all reviews (for admin dashboard)
 */
export const fetchAllReviews = async (): Promise<{ data: Review[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error fetching reviews:', error);
      return { data: [], error };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error in fetchAllReviews:', err);
    return { data: [], error: err };
  }
};

/**
 * Approve a provider
 */
export const approveProvider = async (providerId: string): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: true })
      .eq('id', providerId);
  
    if (error) {
      console.error('Error approving provider:', error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (err) {
    console.error('Error in approveProvider:', err);
    return { success: false, error: err };
  }
};

/**
 * Suspend a user
 */
export const suspendUser = async (userId: string): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_suspended: true })
      .eq('id', userId);
  
    if (error) {
      console.error('Error suspending user:', error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (err) {
    console.error('Error in suspendUser:', err);
    return { success: false, error: err };
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (bookingId: string, status: string): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: status as any })
      .eq('id', bookingId);
  
    if (error) {
      console.error('Error updating booking status:', error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (err) {
    console.error('Error in updateBookingStatus:', err);
    return { success: false, error: err };
  }
};

/**
 * Purchase credits for a user
 */
export const purchaseCredits = async (userId: string, amount: number, credits: number): Promise<{ success: boolean; error?: any }> => {
  try {
    // Add transaction
    const { error: transError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: amount,
        credits: credits,
        type: 'purchase',
        created_at: new Date().toISOString(),
      });
  
    if (transError) {
      console.error('Error adding transaction:', transError);
      return { success: false, error: transError };
    }
    
    // Get current credit balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('credit_balance')
      .eq('id', userId)
      .single();
    
    // Update user's credit balance
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({
        credit_balance: (profile?.credit_balance || 0) + credits,
      })
      .eq('id', userId);
  
    if (balanceError) {
      console.error('Error updating credit balance:', balanceError);
      return { success: false, error: balanceError };
    }
    
    return { success: true };
  } catch (err) {
    console.error('Error in purchaseCredits:', err);
    return { success: false, error: err };
  }
};