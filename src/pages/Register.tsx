import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Dog, User, Heart, Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react';

type RegisterStep = 'selection' | 'form' | 'success';

const Register = () => {
  const [step, setStep] = useState<RegisterStep>('selection');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'client' | 'provider'>('client');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registeredRole, setRegisteredRole] = useState<'client' | 'provider' | null>(null);
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

  const handleGoToDashboard = () => {
    if (registeredRole === 'provider') {
      navigate('/provider');
    } else if (registeredRole === 'client') {
      navigate('/client');
    }
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
      console.log('[Register] Attempting registration for:', email);
      const profile = await register(email, password, fullName, role);

      if (profile) {
        console.log('[Register] Registration successful, navigating to dashboard');
        setRegisteredRole(role);
        setStep('success');

        // Clear loading state immediately and navigate to dashboard
        setIsLoading(false);

        // Navigate to appropriate dashboard
        try {
          if (role === 'provider') {
            console.log('[Register] Navigating to provider dashboard');
            navigate('/provider', { replace: true });
          } else {
            console.log('[Register] Navigating to client dashboard');
            navigate('/client', { replace: true });
          }
        } catch (navError) {
          console.error('[Register] Navigation failed:', navError);
          setError('Registration successful but navigation failed. Please use the button below.');
        }
      } else {
        setError('Registration failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('[Register] Registration error:', err);
      // Show actual Supabase error messages
      setError(err.message || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  const renderSelectionStep = () => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl rounded-2xl border-border shadow-sm">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center ring-1 ring-border">
              <Dog className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl tracking-tight">Choose Your Path</CardTitle>
          <CardDescription className="text-lg">
            Select how you'd like to use Dog Walker by Jolly Walker
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pet Parent Card */}
            <Card
              className="cursor-pointer rounded-2xl transition-all duration-300 border-2 border-border hover:border-primary/50 hover:shadow-xl group"
              onClick={() => handleSelectRole('client')}
            >
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center ring-1 ring-border group-hover:scale-[1.03] transition-transform duration-300">
                    <Heart className="w-8 h-8 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight text-foreground mb-2">
                      Sign up as a Pet Parent
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Find trusted dog walkers in your area and book walks for your furry friends
                    </p>
                    <ul className="text-left text-sm text-muted-foreground space-y-2">
                      {[
                        'Book walks for your pets',
                        'Track live GPS routes',
                        'Read provider reviews',
                        'Pay securely through app',
                      ].map((line) => (
                        <li key={line} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center ring-1 ring-border">
                            <User className="w-3 h-3 text-primary" />
                          </div>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    className="w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
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
              className="cursor-pointer rounded-2xl transition-all duration-300 border-2 border-border hover:border-primary/50 hover:shadow-xl group"
              onClick={() => handleSelectRole('provider')}
            >
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center ring-1 ring-border group-hover:scale-[1.03] transition-transform duration-300">
                    <Briefcase className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight text-foreground mb-2">
                      Sign up as a Jolly Walker
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Offer your dog walking services and earn money doing what you love
                    </p>
                    <ul className="text-left text-sm text-muted-foreground space-y-2">
                      {[
                        'Set your own rates & schedule',
                        'Accept bookings on your terms',
                        'Build your reputation',
                        'Receive secure payments',
                      ].map((line) => (
                        <li key={line} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center ring-1 ring-border">
                            <User className="w-3 h-3 text-primary" />
                          </div>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
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
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </div>
          <div className="mt-4 text-center text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground font-medium">
              ← Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-2xl border-border shadow-sm">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center ring-1 ring-border ${
                registeredRole === 'client' ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'
              }`}
            >
              <CheckCircle2 className="w-10 h-10" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground mb-2">
              Registration Successful!
            </h2>
            <p className="text-muted-foreground">Your account has been created. You can now access your dashboard.</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleGoToDashboard}
              className={`w-full rounded-xl ${
                registeredRole === 'client'
                  ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
              size="lg"
            >
              {registeredRole === 'client' ? 'Go to Pet Dashboard' : 'Go to Provider Dashboard'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <p className="text-xs text-muted-foreground">If the automatic redirect doesn't work, click the button above.</p>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Welcome to the Jolly Walker community, <span className="font-semibold text-foreground">{fullName}</span>!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFormStep = () => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-2xl border-border shadow-sm">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            ← Back to selection
          </Button>
          <div className="flex justify-center mb-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center ring-1 ring-border ${
                role === 'client' ? 'bg-accent text-accent-foreground' : 'bg-secondary'
              }`}
            >
              {role === 'client' ? (
                <Heart className="w-8 h-8" />
              ) : (
                <Briefcase className="w-8 h-8 text-primary" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl tracking-tight">
            {role === 'client' ? 'Create Pet Parent Account' : 'Create Jolly Walker Account'}
          </CardTitle>
          <CardDescription>
            {role === 'client' ? 'Join as a Pet Parent to book walks for your dogs' : 'Join as a Jolly Walker to offer your services'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/25 text-destructive px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>

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
                autoComplete="new-password"
                placeholder="•••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="•••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className={`w-full rounded-xl ${
                role === 'client'
                  ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {step === 'selection' && renderSelectionStep()}
      {step === 'form' && renderFormStep()}
      {step === 'success' && renderSuccessStep()}
    </>
  );
};

export default Register;