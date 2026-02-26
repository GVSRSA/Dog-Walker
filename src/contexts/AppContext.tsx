import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  ProviderProfile,
  ClientProfile,
  Booking,
  Route,
  RoutePoint,
  Transaction,
  PlatformRevenue,
  Dog,
} from '@/types';

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
  updateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  addRoutePoint: (routeId: string, lat: number, lng: number) => void;
  startWalk: (bookingId: string) => void;
  endWalk: (bookingId: string) => void;
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
    phone: '+1 555-0101',
    bio: 'Experienced dog walker with 5+ years of experience. Certified pet first aid.',
    location: { lat: 40.7128, lng: -74.0060, address: 'New York, NY' },
    services: ['Walking', 'Pet Sitting', 'Training'],
    hourlyRate: 25,
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
    phone: '+1 555-0102',
    bio: 'Dog lover specializing in large breeds. Professional walker since 2020.',
    location: { lat: 40.7282, lng: -73.9942, address: 'Brooklyn, NY' },
    services: ['Walking', 'Running with Dogs'],
    hourlyRate: 30,
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
    phone: '+1 555-0201',
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
    phone: '+1 555-0202',
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
    price: 25,
    platformCommission: 5,
    providerPayout: 20,
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
    price: 22.5,
    platformCommission: 4.5,
    providerPayout: 18,
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
    price: 25,
    platformCommission: 5,
    providerPayout: 20,
    createdAt: new Date('2024-12-21'),
  },
];

const mockRoutes: Route[] = [
  {
    id: 'route-1',
    bookingId: 'booking-2',
    points: [
      { id: 'point-1', bookingId: 'booking-2', lat: 40.7282, lng: -73.9942, timestamp: new Date('2024-12-21T14:00:00') },
      { id: 'point-2', bookingId: 'booking-2', lat: 40.7292, lng: -73.9952, timestamp: new Date('2024-12-21T14:05:00') },
      { id: 'point-3', bookingId: 'booking-2', lat: 40.7302, lng: -73.9962, timestamp: new Date('2024-12-21T14:10:00') },
    ],
    startTime: new Date('2024-12-21T14:00:00'),
  },
];

const mockTransactions: Transaction[] = [
  { id: 'trans-1', userId: 'provider-1', type: 'credit_purchase', amount: 50, credits: 10, createdAt: new Date('2024-12-15'), description: 'Purchased 10 credits' },
  { id: 'trans-2', userId: 'provider-1', type: 'booking_fee', amount: 20, bookingId: 'booking-1', createdAt: new Date('2024-12-20'), description: 'Earnings from booking' },
  { id: 'trans-3', userId: 'provider-2', type: 'credit_purchase', amount: 25, credits: 5, createdAt: new Date('2024-12-18'), description: 'Purchased 5 credits' },
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
    if (user && !user.isSuspended) {
      setCurrentUser(user);
    } else {
      throw new Error('Invalid credentials or account suspended');
    }
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
      isApproved: role === 'client', // Clients auto-approved, providers need approval
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

  const updateBookingStatus = (bookingId: string, status: Booking['status']) => {
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

  const startWalk = (bookingId: string) => {
    const newRoute: Route = {
      id: `route-${Date.now()}`,
      bookingId,
      points: [],
      startTime: new Date(),
    };
    setRoutes([...routes, newRoute]);
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'active', routeId: newRoute.id } : b));
  };

  const endWalk = (bookingId: string) => {
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