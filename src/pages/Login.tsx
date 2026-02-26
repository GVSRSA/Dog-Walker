import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Dog } from 'lucide-react';
import type { Profile } from '@/types';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('[Login] Attempting login for:', email);
      const profile = await login(email, password);
      
      if (profile) {
        console.log('[Login] Login successful, navigating to dashboard for role:', profile.role);
        
        // Clear loading state immediately
        setIsLoading(false);
        
        // Navigate to appropriate dashboard immediately
        if (profile.role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (profile.role === 'provider') {
          navigate('/provider', { replace: true });
        } else {
          navigate('/client', { replace: true });
        }
      } else {
        setError('Login failed. Please check your credentials.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('[Login] Login error:', err);
      setError(err.message || 'Invalid email or password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Dog className="w-8 h-8 text-green-700" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your Dog Walker account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-green-700 hover:bg-green-800" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link to="/register" className="text-green-700 hover:underline font-medium">
              Sign up
            </Link>
          </div>
          <div className="mt-4 text-center text-sm">
            <Link to="/" className="text-gray-600 hover:text-green-700 font-medium">
              ← Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;