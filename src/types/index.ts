export type UserRole = 'admin' | 'provider' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isApproved: boolean;
  isSuspended: boolean;
  createdAt: Date;
}

export interface ProviderProfile extends User {
  bio?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  services: string[];
  hourlyRate: number;
  rating: number;
  totalWalks: number;
  availableCredits: number;
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
  };
}

export interface ClientProfile extends User {
  dogs?: Dog[];
}

export interface Dog {
  id: string;
  name: string;
  breed?: string;
  age?: number;
  notes?: string;
}

export type BookingStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  clientId: string;
  providerId: string;
  dogIds: string[];
  scheduledDate: Date;
  duration: number; // in minutes
  status: BookingStatus;
  price: number;
  platformCommission: number;
  providerPayout: number;
  createdAt: Date;
  routeId?: string;
}

export interface RoutePoint {
  id: string;
  bookingId: string;
  lat: number;
  lng: number;
  timestamp: Date;
}

export interface Route {
  id: string;
  bookingId: string;
  points: RoutePoint[];
  startTime?: Date;
  endTime?: Date;
}

export type TransactionType = 'credit_purchase' | 'booking_fee' | 'platform_payout';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  credits?: number;
  bookingId?: string;
  createdAt: Date;
  description: string;
}

export interface PlatformRevenue {
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  activeProviders: number;
}
