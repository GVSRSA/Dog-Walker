import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Minimal inline types used by the AppContext to avoid depending on a separate types file.
// These include only the fields referenced by the context implementation.
export type User = {
  id: string;
  name: string;
  email?: string;
  role?: 'admin' | 'provider' | 'client';
  isApproved?: boolean;
  isSuspended?: boolean;
  createdAt?: Date;
  phone?: string;
};

export type ProviderProfile = User & {
  bio?: string;
  location?: { lat: number; lng: number; address?: string };
  services?: string[];
  hourlyRate?: number;
  rating?: number;
  totalWalks?: number;
  availableCredits?: number;
  availability?: { days: string[]; startTime: string; endTime: string };
};

export type ClientProfile = User & {
  dogs?: Dog[];
};

export type Dog = {
  id: string;
  name: string;
  breed?: string;
  age?: number;
  notes?: string;
};

export type Booking = {
  id: string;
  clientId: string;
  providerId: string;
  dogIds: string[];
  scheduledDate: Date;
  duration: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  price: number;
  platformCommission?: number;
  providerPayout?: number;
  createdAt?: Date;
  routeId?: string;
};

export type RoutePoint = {
  id: string;
  bookingId: string;
  lat: number;
  lng: number;
  timestamp: Date;
};

export type Route = {
  id: string;
  bookingId: string;
  providerId?: string;
  points: RoutePoint[];
  startTime?: Date;
  endTime?: Date;
};

export type Transaction = {
  id: string;
  userId: string;
  type: 'credit_purchase' | 'booking_fee' | string;
  amount: number;
  credits?: number;
  bookingId?: string;
  createdAt?: Date;
  description?: string;
};

export type PlatformRevenue = {
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  activeProviders: number;
};

interface AppContextType {
  currentUser: (User | ProviderProfile | ClientProfile) | null;
  setCurrentUser: (user: (User | ProviderProfile | ClientProfile) | null) => void;
  users: User[];
  bookings: Booking[];
  routes: Route[];
  transactions: Transaction[];
  platformRevenue: PlatformRevenue;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: 'provider' | 'client') => Promise<void>;
  approveUser: (userId: string) => void;
  suspendUser: (userId: string) => void;
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  confirmBooking: (bookingId: string) => Promise<void>;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => Promise<void>;
  addRoutePoint: (routeId: string, lat: number, lng: number) => void;
  startWalk: (bookingId: string) => Promise<void>;
  endWalk: (bookingId: string) => Promise<void>;
  purchaseCredits: (userId: string, amount: number, credits: number) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  getProviderProfile: (providerId: string) => ProviderProfile | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock initial data
const mockUsers: (User | ProviderProfile | ClientProfile)[] = [
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@paws.com',
    role: 'admin',
    isApproved: true,
    isSuspended: false,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'provider-1',
    name: 'Sarah Johnson',
    email: 'sarah@paws.com',
    role: 'provider',
    phone: '+27 82 123 4567',
    bio: 'Experienced dog walker with 5+ years of experience. Certified pet first aid.',
    location: { lat: -26.2041, lng: 28.0473, address: 'Johannesburg, Gauteng' },
    services: ['Walking', 'Pet Sitting', 'Training'],
    hourlyRate: 150,
    rating: 4.8,
    totalWalks: 156,
    availableCredits: 10,
    availability: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], startTime: '08:00', endTime: '18:00' },
    isApproved: true,
    isSuspended: false,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'provider-2',
    name: 'Mike Chen',
    email: 'mike@paws.com',
    role: 'provider',
    phone: '+27 83 456 7890',
    bio: 'Dog lover specializing in large breeds. Professional walker since 2020.',
    location: { lat: -33.9249, lng: 18.4241, address: 'Cape Town, Western Cape' },
    services: ['Walking', 'Running with Dogs'],
    hourlyRate: 180,
    rating: 4.9,
    totalWalks: 203,
    availableCredits: 5,
    availability: { days: ['Mon', 'Wed', 'Fri', 'Sat'], startTime: '07:00', endTime: '20:00' },
    isApproved: true,
    isSuspended: false,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'client-1',
    name: 'Emily Davis',
    email: 'emily@paws.com',
    role: 'client',
    phone: '+27 71 234 5678',
    dogs: [
      { id: 'dog-1', name: 'Max', breed: 'Golden Retriever', age: 3, notes: 'Very friendly, loves to play fetch' },
      { id: 'dog-2', name: 'Bella', breed: 'Labrador', age: 2, notes: 'Energetic, needs longer walks' },
    ],
    isApproved: true,
    isSuspended: false,
    createdAt: new Date('2024-03-01'),
  },
  {
    id: 'client-2',
    name: 'James Wilson',
    email: 'james@paws.com',
    role: 'client',
    phone: '+27 72 345 6789',
    dogs: [{ id: 'dog-3', name: 'Rocky', breed: 'Bulldog', age: 4, notes: 'Short walks preferred due to breathing' }],
    isApproved: true,
    isSuspended: false,
    createdAt: new Date('2024-03-15'),
  },
];

const mockBookings: Booking[] = [
  {
    id: 'booking-1',
    clientId: 'client-1',
    providerId: 'provider-1',
    dogIds: ['dog-1', 'dog-2'],
    scheduledDate: new Date('2024-12-20T10:00:00'),
    duration: 60,
    status: 'completed',
    price: 150,
    platformCommission: 30,
    providerPayout: 120,
    createdAt: new Date('2024-12-19'),
  },
  {
    id: 'booking-2',
    clientId: 'client-2',
    providerId: 'provider-2',
    dogIds: ['dog-3'],
    scheduledDate: new Date('2024-12-21T14:00:00'),
    duration: 45,
    status: 'active',
    price: 135,
    platformCommission: 27,
    providerPayout: 108,
    createdAt: new Date('2024-12-20'),
    routeId: 'route-1',
  },
  {
    id: 'booking-3',
    clientId: 'client-1',
    providerId: 'provider-1',
    dogIds: ['dog-1'],
    scheduledDate: new Date('2024-12-22T09:00:00'),
    duration: 60,
    status: 'pending',
    price: 150,
    platformCommission: 30,
    providerPayout: 120,
    createdAt: new Date('2024-12-21'),
  },
];

const mockRoutes: Route[] = [
  {
    id: 'route-1',
    bookingId: 'booking-2',
    providerId: 'provider-2',
    points: [
      { id: 'point-1', bookingId: 'booking-2', lat: 40.7282, lng: -73.9942, timestamp: new Date('2024-12-21T14:00:00') },
      { id: 'point-2', bookingId: 'booking-2', lat: 40.7292, lng: -73.9952, timestamp: new Date('2024-12-21T14:05:00') },
      { id: 'point-3', bookingId: 'booking-2', lat: 40.7302, lng: -73.9962, timestamp: new Date('2024-12-21T14:10:00') },
    ],
    startTime: new Date('2024-12-21T14:00:00'),
  },
];

const mockTransactions: Transaction[] = [
  { id: 'trans-1', userId: 'provider-1', type: 'credit_purchase', amount: 500, credits: 10, createdAt: new Date('2024-12-15'), description: 'Purchased 10 credits' },
  { id: 'trans-2', userId: 'provider-1', type: 'booking_fee', amount: 120, bookingId: 'booking-1', createdAt: new Date('2024-12-20'), description: 'Earnings from booking' },
  { id: 'trans-3', userId: 'provider-2', type: 'credit_purchase', amount: 250, credits: 5, createdAt: new Date('2024-12-18'), description: 'Purchased 5 credits' },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<(User | ProviderProfile | ClientProfile) | null>(null);
  const [users, setUsers] = useState<(User | ProviderProfile | ClientProfile)[]>(mockUsers);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [routes, setRoutes] = useState<Route[]>(mockRoutes);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);

  const platformRevenue: PlatformRevenue = {
    totalRevenue: mockTransactions.filter(t => t.type === 'booking_fee').reduce((sum, t) => sum + t.amount * 0.25, 0),
    totalBookings: bookings.length,
    totalUsers: users.length,
    activeProviders: users.filter(u => u.role === 'provider' && u.isApproved && !u.isSuspended).length,
  };

  const login = async (email: string, password: string) => {
    const user = users.find(u => u.email === email);
    if (!user) {
      throw new Error('User not found');
    }
    if (user.isSuspended) {
      throw new Error('Account is suspended');
    }
    // For demo purposes, any password is accepted
    // In production, you would validate the password here
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const register = async (name: string, email: string, password: string, role: 'provider' | 'client') => {
    const newUser: User | ProviderProfile | ClientProfile = {
      id: `${role}-${Date.now()}`,
      name,
      email,
      role,
      isApproved: role === 'client',
      isSuspended: false,
      createdAt: new Date(),
    };

    if (role === 'provider') {
      (newUser as ProviderProfile).services = [];
      (newUser as ProviderProfile).hourlyRate = 20;
      (newUser as ProviderProfile).rating = 0;
      (newUser as ProviderProfile).totalWalks = 0;
      (newUser as ProviderProfile).availableCredits = 0;
      (newUser as ProviderProfile).availability = { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], startTime: '09:00', endTime: '18:00' };
    }

    if (role === 'client') {
      (newUser as ClientProfile).dogs = [];
    }

    setUsers([...users, newUser]);
  };

  const approveUser = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, isApproved: true } : u));
  };

  const suspendUser = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, isSuspended: true } : u));
  };

  const createBooking = (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    const newBooking: Booking = {
      ...booking,
      id: `booking-${Date.now()}`,
      createdAt: new Date(),
    };
    setBookings([...bookings, newBooking]);
    return newBooking;
  };

  const confirmBooking = async (bookingId: string) => {
    // Update booking status to confirmed in Supabase
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId);

    if (error) {
      console.error('Error confirming booking:', error);
      throw error;
    }

    // Update local state
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'confirmed' } : b));
  };

  const updateBookingStatus = async (bookingId: string, status: Booking['status']) => {
    // Update Supabase database
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);
    
    if (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }

    // Update local state
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, status } : b));
  };

  const addRoutePoint = (routeId: string, lat: number, lng: number) => {
    const route = routes.find(r => r.id === routeId);
    const newPoint: RoutePoint = {
      id: `point-${Date.now()}`,
      bookingId: route?.bookingId || '',
      lat,
      lng,
      timestamp: new Date(),
    };
    setRoutes(routes.map(r => r.id === routeId ? { ...r, points: [...r.points, newPoint] } : r));
  };

  const startWalk = async (bookingId: string) => {
    // Update booking status to active in Supabase
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ status: 'active' })
      .eq('id', bookingId);

    if (bookingError) {
      console.error('Error starting walk:', bookingError);
      throw bookingError;
    }

    // Create initial tracking log in Supabase (using default location)
    const { error: trackingError } = await supabase
      .from('tracking_logs')
      .insert({
        booking_id: bookingId,
        location: `(${ -26.2041 },${ 28.0473 })`, // Johannesburg coordinates
      });

    if (trackingError) {
      console.error('Error creating tracking log:', trackingError);
    }

    // Update local state
    const newRoute: Route = {
      id: `route-${Date.now()}`,
      bookingId,
      providerId: bookings.find(b => b.id === bookingId)?.providerId,
      points: [],
      startTime: new Date(),
    };
    setRoutes([...routes, newRoute]);
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'active', routeId: newRoute.id } : b));
  };

  const endWalk = async (bookingId: string) => {
    // Update booking status to completed in Supabase
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', bookingId);

    if (error) {
      console.error('Error ending walk:', error);
      throw error;
    }

    // Update local state
    const booking = bookings.find(b => b.id === bookingId);
    if (booking?.routeId) {
      setRoutes(routes.map(r => r.id === booking.routeId ? { ...r, endTime: new Date() } : r));
    }
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'completed' } : b));
  };

  const purchaseCredits = (userId: string, amount: number, credits: number) => {
    const transaction: Omit<Transaction, 'id' | 'createdAt'> = {
      userId,
      type: 'credit_purchase',
      amount,
      credits,
      description: `Purchased ${credits} credits`,
    };
    addTransaction(transaction);
    setUsers(users.map(u => u.id === userId && u.role === 'provider' ? { ...u, availableCredits: (u as ProviderProfile).availableCredits + credits } : u));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `trans-${Date.now()}`,
      createdAt: new Date(),
    };
    setTransactions([...transactions, newTransaction]);
  };

  const getProviderProfile = (providerId: string): ProviderProfile | undefined => {
    return users.find(u => u.id === providerId && u.role === 'provider') as ProviderProfile;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        bookings,
        routes,
        transactions,
        platformRevenue,
        login,
        logout,
        register,
        approveUser,
        suspendUser,
        createBooking,
        confirmBooking,
        updateBookingStatus,
        addRoutePoint,
        startWalk,
        endWalk,
        purchaseCredits,
        addTransaction,
        getProviderProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};