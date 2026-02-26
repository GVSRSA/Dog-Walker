/**
 * Sync a profile from auth.users to profiles table
 * This function creates or updates a profile for an existing auth user
 */

import { supabase } from '@/integrations/supabase/client';

export async function syncProfile(authUserId: string, email?: string) {
  try {
    console.log('[syncProfile] Syncing profile for auth user:', authUserId);

    // First, get the auth user data if email not provided
    if (!email) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('[syncProfile] Failed to get auth user:', authError);
        return { success: false, error: 'Failed to get auth user' };
      }
      email = user.email || '';
    }

    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUserId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[syncProfile] Error checking profile:', checkError);
      return { success: false, error: checkError.message };
    }

    const profileData = {
      id: authUserId,
      email: email,
      full_name: email?.split('@')[0] || '', // Use email prefix as default name
      role: 'admin', // Default to admin for this sync function
      is_approved: true,
      is_suspended: false,
      updated_at: new Date().toISOString(),
    };

    if (existingProfile) {
      // Update existing profile
      console.log('[syncProfile] Updating existing profile:', existingProfile.id);
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', authUserId)
        .select('*')
        .single();

      if (updateError) {
        console.error('[syncProfile] Error updating profile:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('[syncProfile] Profile updated successfully:', updatedProfile);
      return { success: true, profile: updatedProfile };
    } else {
      // Insert new profile
      console.log('[syncProfile] Creating new profile for auth user:', authUserId);
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select('*')
        .single();

      if (insertError) {
        console.error('[syncProfile] Error creating profile:', insertError);
        return { success: false, error: insertError.message };
      }

      console.log('[syncProfile] Profile created successfully:', newProfile);
      return { success: true, profile: newProfile };
    }
  } catch (error) {
    console.error('[syncProfile] Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Sync the current logged-in user's profile
 */
export async function syncCurrentUserProfile() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.error('[syncCurrentUserProfile] No user logged in');
      return { success: false, error: 'No user logged in' };
    }

    return await syncProfile(user.id, user.email);
  } catch (error) {
    console.error('[syncCurrentUserProfile] Error:', error);
    return { success: false, error: 'Failed to sync profile' };
  }
}

/**
 * Sync profile by email (admin utility)
 */
export async function syncProfileByEmail(email: string) {
  try {
    // Find auth user by email (requires service role, so this won't work from client)
    // Instead, we'll use the admin API or ask user to log in first
    console.log('[syncProfileByEmail] Please log in first to sync profile');
    return { success: false, error: 'Please log in first' };
  } catch (error) {
    console.error('[syncProfileByEmail] Error:', error);
    return { success: false, error: 'Failed to sync profile' };
  }
}
