import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CompleteProfile = () => {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'client' | 'provider'>('client');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setNeedsProfileCompletion } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName) {
      setError('Full name is required');
      return;
    }

    setIsLoading(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Not authenticated');
      }

      console.log('[CompleteProfile] Creating profile for user:', user.id);

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: fullName,
          role,
        })
        .select('id, email, role, full_name, created_at, is_approved, is_suspended')
        .single();

      if (profileError) {
        console.error('[CompleteProfile] Profile creation failed:', profileError);
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      console.log('[CompleteProfile] Profile created successfully:', { id: profile.id, role: profile.role });

      // Clear the flag and navigate to appropriate dashboard
      setNeedsProfileCompletion(false);
      setIsLoading(false);

      if (role === 'provider') {
        navigate('/provider', { replace: true });
      } else {
        navigate('/client', { replace: true });
      }
    } catch (err: any) {
      console.error('[CompleteProfile] Error:', err);
      setError(err.message || 'Failed to complete profile');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            We found your account, but you need to complete your profile to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">I am a...</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={role === 'client' ? 'default' : 'outline'}
                  onClick={() => setRole('client')}
                  className={role === 'client' ? 'bg-blue-700 hover:bg-blue-800' : ''}
                >
                  Pet Parent
                </Button>
                <Button
                  type="button"
                  variant={role === 'provider' ? 'default' : 'outline'}
                  onClick={() => setRole('provider')}
                  className={role === 'provider' ? 'bg-green-700 hover:bg-green-800' : ''}
                >
                  Jolly Walker
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className={`w-full ${role === 'client' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-green-700 hover:bg-green-800'}`}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Profile...' : 'Complete Profile'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button
              type="button"
              onClick={() => {
                supabase.auth.signOut();
                navigate('/', { replace: true });
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              Sign out and try again
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;