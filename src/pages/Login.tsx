import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Dog } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, currentUser, isAuthenticated, needsProfileCompletion } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    if (needsProfileCompletion) {
      navigate('/complete-profile', { replace: true });
      return;
    }

    if (currentUser.role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (currentUser.role === 'provider') {
      navigate('/provider', { replace: true });
    } else {
      navigate('/client', { replace: true });
    }
  }, [currentUser, isAuthenticated, needsProfileCompletion, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('[Login] Attempting login for:', email);
      const profile = await login(email, password);

      if (profile) {
        console.log('[Login] Login successful, navigating to dashboard for role:', profile.role);
        setIsLoading(false);

        if (needsProfileCompletion) {
          navigate('/complete-profile', { replace: true });
        } else if (profile.role === 'admin') {
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
    <div className="min-h-screen bg-emerald-50/60 flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-2xl border-emerald-100 shadow-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <Dog className="w-8 h-8 text-emerald-800" />
            </div>
          </div>
          <CardTitle className="text-2xl tracking-tight">Welcome Back</CardTitle>
          <CardDescription>Sign in with your email and password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
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
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-600">New here? </span>
            <Link to="/register" className="text-emerald-800 hover:underline font-semibold">
              Create an account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;