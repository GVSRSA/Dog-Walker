import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "./contexts/AppContext";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { currentUser } = useApp();
  const location = useLocation();

  // Not logged in
  if (!currentUser) {
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

const AppContent = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
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
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;