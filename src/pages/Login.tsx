import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Dog } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { users, setCurrentUser } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      
      // Find the user and set current user for role-based routing
      const user = users.find(u => u.email === email);
      if (user) {
        setCurrentUser(user);
        
        // Redirect based on user role
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'provider') {
          navigate('/provider');
        } else {
          navigate('/client');
        }
      } else {
        setError('User not found');
      }
    } catch (err) {
      setError('Invalid email or password');
    } finally {
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
                type="email"
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
                type="password"
                placeholder="•••••••"
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
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 mb-2">Demo accounts (any password works):</p>
            <div className="text-xs space-y-1">
              <button
                type="button"
                onClick={() => { setEmail('admin@paws.com'); setPassword('demo'); }}
                className="block w-full text-left text-purple-600 hover:underline py-1"
              >
                👨‍💼 Admin: admin@paws.com
              </button>
              <button
                type="button"
                onClick={() => { setEmail('sarah@paws.com'); setPassword('demo'); }}
                className="block w-full text-left text-green-700 hover:underline py-1"
              >
                🚶 Provider: sarah@paws.com
              </button>
              <button
                type="button"
                onClick={() => { setEmail('emily@paws.com'); setPassword('demo'); }}
                className="block w-full text-left text-blue-700 hover:underline py-1"
              >
                🐕 Client: emily@paws.com
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;