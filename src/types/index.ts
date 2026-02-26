import { z } from 'zod';
import { User, ProviderProfile, ClientProfile, Booking, Route, Route, RoutePoint, Dog, Transaction, CreditLedger, PlatformRevenue };

// Common base user
export interface BaseUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'provider' | 'client';
  isApproved: boolean;
  isSuspended: boolean;
  createdAt: Date;
}

// Admin
export interface Admin extends BaseUser {
  role: 'admin';
}

// Provider profile (extends BaseUser)
export interface ProviderProfile extends BaseUser {
  role: 'provider';
  hourlyRate: number;
  services: string[];
  availableCredits: number;
  totalWalks: number;
  rating: number;
  avg_rating?: number;
  review_count?: number;
  bio: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

// Client profile (extends BaseUser)
export interface ClientProfile extends BaseUser {
  role: 'client';
  dogs: Dog[];
}

// Dog type
export interface Dog {
  id: string;
  clientId: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  energyLevel?: 'low' | 'medium' | 'high';
  specialInstructions?: string;
}

// Booking type (from database: bookings table)
export interface Booking {
  id: string;
  clientId: string;
  providerId: string;
  dogIds: string[];
  scheduledDate: Date;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  platformCommission: number; // 20%
  providerPayout: number; // 80% (remaining after commission)
  price: number;
  dogIds: string[];
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
  providerId: string;
  amount: number;
  description: string;
  transactionType: 'purchase' | 'booking_fee';
  createdAt: Date;
}

// PlatformRevenue type (computed)
export interface PlatformRevenue {
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  activeProviders: number;
}