import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Dog, User, Heart, Briefcase, ArrowRight } from 'lucide-react';

type RegisterStep = 'selection' | 'form';

const Register = () => {
  const [step, setStep] = useState<RegisterStep>('selection');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'client' | 'provider'>('client');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'provider') {
      setRole('provider');
      setStep('form');
    } else if (roleParam === 'client') {
      setRole('client');
      setStep('form');
    }
  }, [searchParams]);

  const handleSelectRole = (selectedRole: 'client' | 'provider') => {
    setRole(selectedRole);
    setStep('form');
  };

  const handleBack = () => {
    setStep('selection');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName) {
      setError('Full name is required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const profile = await register(email, password, fullName, role);
      
      if (profile) {
        // Redirect to appropriate dashboard based on role
        if (role === 'provider') {
          navigate('/provider');
        } else {
          navigate('/client');
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err: any) {
      // Show actual Supabase error messages
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSelectionStep = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <Dog className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl">Choose Your Path</CardTitle>
          <CardDescription className="text-lg">Select how you'd like to use Dog Walker by Jolly Walker</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pet Parent Card */}
            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500 group"
              onClick={() => handleSelectRole('client')}
            >
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Heart className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Sign up as a Pet Parent</h3>
                    <p className="text-gray-600 mb-4">
                      Find trusted dog walkers in your area and book walks for your furry friends
                    </p>
                    <ul className="text-left text-sm text-gray-600 space-y-2">
                      <li className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-3 h-3 text-blue-600" />
                        </div>
                        <span>Book walks for your pets</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-3 h-3 text-blue-600" />
                        </div>
                        <span>Track live GPS routes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-3 h-3 text-blue-600" />
                        </div>
                        <span>Read provider reviews</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-3 h-3 text-blue-600" />
                        </div>
                        <span>Pay securely through app</span>
                      </li>
                    </ul>
                  </div>
                  <Button 
                    className="w-full bg-blue-700 hover:bg-blue-800 group-hover:scale-105 transition-transform"
                    onClick={() => handleSelectRole('client')}
                  >
                    Get Started as Pet Parent
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Jolly Walker Card */}
            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-green-500 group"
              onClick={() => handleSelectRole('provider')}
            >
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Briefcase className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Sign up as a Jolly Walker</h3>
                    <p className="text-gray-600 mb-4">
                      Offer your dog walking services and earn money doing what you love
                    </p>
                    <ul className="text-left text-sm text-gray-600 space-y-2">
                      <li className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="w-3 h-3 text-green-600" />
                        </div>
                        <span>Set your own rates & schedule</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="w-3 h-3 text-green-600" />
                        </div>
                        <span>Accept bookings on your terms</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="w-3 h-3 text-green-600" />
                        </div>
                        <span>Build your reputation</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="w-3 h-3 text-green-600" />
                        </div>
                        <span>Receive secure payments</span>
                      </li>
                    </ul>
                  </div>
                  <Button 
                    className="w-full bg-green-700 hover:bg-green-800 group-hover:scale-105 transition-transform"
                    onClick={() => handleSelectRole('provider')}
                  >
                    Become a Jolly Walker
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="text-green-700 hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFormStep = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            ← Back to selection
          </Button>
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              role === 'client' 
                ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
                : 'bg-gradient-to-br from-green-400 to-green-600'
            }`}>
              {role === 'client' ? (
                <Heart className="w-8 h-8 text-white" />
              ) : (
                <Briefcase className="w-8 h-8 text-white" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl">
            {role === 'client' ? 'Create Pet Parent Account' : 'Create Jolly Walker Account'}
          </CardTitle>
          <CardDescription>
            {role === 'client' 
              ? 'Join as a Pet Parent to book walks for your dogs'
              : 'Join as a Jolly Walker to offer your services'
            }
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
                placeholder="•••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="•••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className={`w-full ${role === 'client' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-green-700 hover:bg-green-800'}`} 
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className={role === 'client' ? 'text-blue-700 hover:underline font-medium' : 'text-green-700 hover:underline font-medium'}>
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return step === 'selection' ? renderSelectionStep() : renderFormStep();
};

export default Register;