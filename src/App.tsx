import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AppProvider, useApp } from "./contexts/AppContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import FullScreenAuthLoading from "@/components/FullScreenAuthLoading";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CompleteProfile from "./pages/CompleteProfile";
import AdminDashboard from "./pages/AdminDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import MyDogs from "./pages/MyDogs";
import BookingPage from "./pages/BookingPage";
import MyBookings from "./pages/MyBookings";
import LiveWalk from "./pages/LiveWalk";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();

  // Require login
  if (!currentUser || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Enforce role access
  if (!allowedRoles.includes(currentUser.role || '')) {
    const redirectTo =
      currentUser.role === 'admin' ? '/admin' :
      currentUser.role === 'provider' ? '/provider' :
      currentUser.role === 'client' ? '/client' : '/login';

    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

const ProfileCompletionGuard = ({ children }: { children: React.ReactNode }) => {
  const { needsProfileCompletion } = useAuth();
  const location = useLocation();

  if (needsProfileCompletion && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

const AuthRedirectHandler = () => {
  const { needsRedirectToLanding, logout, clearRedirectFlag } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (needsRedirectToLanding) {
      logout();
      navigate('/', { replace: true });
      clearRedirectFlag();
    }
  }, [needsRedirectToLanding, navigate, logout, clearRedirectFlag]);

  return null;
};

const AppContent = () => {
  const { initializing } = useAuth();

  if (initializing) {
    return <FullScreenAuthLoading />;
  }

  return (
    <>
      <AuthRedirectHandler />
      <ProfileCompletionGuard>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />

          {/* Client pages */}
          <Route
            path="/my-dogs"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <MyDogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/book"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/live-walk/:bookingId"
            element={
              <ProtectedRoute allowedRoles={['client', 'provider']}>
                <LiveWalk />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Admin Only */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Routes - Provider Only */}
          <Route 
            path="/provider" 
            element={
              <ProtectedRoute allowedRoles={['provider']}>
                <ProviderDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Routes - Client Only */}
          <Route 
            path="/client" 
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <ClientDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Routes - Any Logged In User */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'provider', 'client']}>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/index" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ProfileCompletionGuard>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;