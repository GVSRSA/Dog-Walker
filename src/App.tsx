import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AppProvider, useApp } from "./contexts/AppContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
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

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();

  // Not logged in
  if (!currentUser || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but not allowed for this route
  if (!allowedRoles.includes(currentUser.role || '')) {
    // Redirect to appropriate dashboard based on role
    const redirectTo = 
      currentUser.role === 'admin' ? '/admin' :
      currentUser.role === 'provider' ? '/provider' :
      currentUser.role === 'client' ? '/client' : '/login';
    
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

const ProfileCompletionGuard = ({ children }: { children: React.ReactNode }) => {
  const { needsProfileCompletion, isAuthenticated } = useAuth();
  const location = useLocation();

  // If user needs profile completion and is not already on the complete profile page
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
      console.log('[AuthRedirectHandler] Redirecting to landing page due to invalid session');
      // Perform logout and navigate once
      logout();
      navigate('/', { replace: true });
      // Clear the flag to prevent continuous redirects
      clearRedirectFlag();
    }
  }, [needsRedirectToLanding, navigate, logout, clearRedirectFlag]);

  return null;
};

const AppContent = () => {
  return (
    <>
      <AuthRedirectHandler />
      <ProfileCompletionGuard>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          
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