import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dog, MapPin, CreditCard, Shield, Users, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, needsProfileCompletion } = useAuth();

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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary ring-1 ring-border">
            <Dog className="w-6 h-6 text-primary" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-extrabold tracking-tight text-foreground">Dog Walker</span>
            <span className="text-xs text-primary font-semibold">by Jolly Walker</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link to="/login">
            <Button variant="ghost" className="rounded-full text-foreground/80 hover:bg-accent hover:text-accent-foreground">
              Log In
            </Button>
          </Link>
          <Link to="/register">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 sm:py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
            Trusted Dog Walking
            <span className="text-primary block">& Pet Services</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground">
            Connect with certified dog walkers across South Africa. Track your pup's adventure in real-time
            while they get the exercise they deserve.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="w-full sm:w-auto rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/register?role=client">I'm a Pet Parent</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto rounded-full border-border bg-card text-foreground hover:bg-accent"
            >
              <Link to="/register?role=provider">I'm a Walker</Link>
            </Button>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-14">
          <Link to="/register?role=client" className="block">
            <Card className="group hover:shadow-xl transition-shadow cursor-pointer border-2 border-border hover:border-primary/40 rounded-2xl">
              <CardHeader>
                <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-border">
                  <Dog className="w-8 h-8 text-accent-foreground" />
                </div>
                <CardTitle className="text-2xl tracking-tight">For Pet Parents</CardTitle>
                <CardDescription className="text-base">
                  Book trusted walkers and track your dog's live location
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Live GPS tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Verified walkers
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Flexible scheduling
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          <Link to="/register?role=provider" className="block">
            <Card className="group hover:shadow-xl transition-shadow cursor-pointer border-2 border-border hover:border-primary/40 rounded-2xl">
              <CardHeader>
                <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-border">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl tracking-tight">For Walkers</CardTitle>
                <CardDescription className="text-base">
                  Earn money walking dogs in your neighborhood
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    Flexible payments
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Set your own hours
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Insured bookings
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-card/60 py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-center text-foreground mb-12">
            Why Choose Dog Walker?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-border">
                <MapPin className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-2">Real-Time Tracking</h3>
              <p className="text-muted-foreground">
                Watch your dog's walk in real-time on an interactive map with GPS coordinates across South Africa
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-border">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-2">Verified Providers</h3>
              <p className="text-muted-foreground">
                All walkers are background checked, insured, and reviewed by pet parents throughout South Africa
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-border">
                <CreditCard className="w-10 h-10 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-2">Secure Payments</h3>
              <p className="text-muted-foreground">
                Safe payments in South African Rands with automatic platform commission tracking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-secondary/60 py-10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium text-foreground/80">&copy; 2024 Dog Walker by Jolly Walker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;