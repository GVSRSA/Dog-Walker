import { z } from 'zod';

// Profile types (from Supabase profiles table)
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'provider' | 'client';
  is_approved: boolean;
  is_suspended: boolean;
  bio?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  services?: string[];
  hourly_rate?: number;
  credit_balance?: number;
  total_walks?: number;
  avg_rating?: number;
  review_count?: number;
  created_at: string;
  updated_at?: string;
}

// Dog type (from Supabase dogs table)
export interface Dog {
  id: string;
  owner_id: string;
  name: string;
  breed: string;
  age?: number;
  weight?: number;
  energy_level?: 'low' | 'medium' | 'high';
  special_instructions?: string;
  image_url?: string;
  created_at?: string;
}

// Booking type (from Supabase bookings table)
export interface Booking {
  id: string;
  client_id?: string;
  provider_id?: string;
  dog_id?: string;
  dog_ids?: string[];
  scheduled_at?: string;
  scheduled_date?: string;
  duration?: number;
  status?: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  price?: number;
  total_fee?: number;
  platform_fee?: number;
  provider_payout?: number;
  created_at?: string;
}

// Review type (from Supabase reviews table)
export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  provider_id: string;
  rating: number;
  comment: string;
  created_at?: string;
}

// Route type (from database: tracking_logs table)
export interface Route {
  id: string;
  bookingId: string;
  providerId: string;
  startTime: Date;
  endTime?: Date;
  points: RoutePoint[];
}

// RoutePoint type (from database: route_points table)
export interface RoutePoint {
  id: string;
  routeId: string;
  bookingId: string;
  lat: number;
  lng: number;
  timestamp: Date;
}

// Transaction type (from database: credit_ledger table)
export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  credits: number;
  type: 'purchase' | 'booking_fee' | 'refund';
  created_at?: string;
}

// PlatformRevenue type (computed)
export interface PlatformRevenue {
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  activeProviders: number;
}