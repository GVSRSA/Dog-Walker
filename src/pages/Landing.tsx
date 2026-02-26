import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dog, MapPin, CreditCard, Shield, Users, Clock } from 'lucide-react';

const Landing = () => {
  const handleLoginClick = () => {
    console.log('Navigating to Login...');
  };

  const handleGetStartedClick = () => {
    console.log('Navigating to Register...');
  };

  const handleClientRegisterClick = () => {
    console.log('Navigating to Register as Client...');
  };

  const handleProviderRegisterClick = () => {
    console.log('Navigating to Register as Provider...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Dog className="w-8 h-8 text-green-700" />
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-800">Dog Walker</span>
            <span className="text-xs text-green-600 font-medium">by Jolly Walker</span>
          </div>
        </div>
        <div className="flex gap-4">
          <Link to="/login" onClick={handleLoginClick}>
            <Button variant="ghost" className="text-green-700 hover:text-green-800">Log In</Button>
          </Link>
          <Link to="/register" onClick={handleGetStartedClick}>
            <Button className="bg-green-700 hover:bg-green-800">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
          Trusted Dog Walking
          <span className="text-green-700 block">& Pet Services</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Connect with certified dog walkers across South Africa. Track your pup's adventure in real-time
          while they get the exercise they deserve.
        </p>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-16">
          <Link to="/register?role=client" onClick={handleClientRegisterClick}>
            <Card className="hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-green-300">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Dog className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">For Pet Parents</CardTitle>
                <CardDescription className="text-base">
                  Book trusted walkers and track your dog's live location
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Live GPS tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    Verified walkers
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Flexible scheduling
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          <Link to="/register?role=provider" onClick={handleProviderRegisterClick}>
            <Card className="hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-green-300">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">For Walkers</CardTitle>
                <CardDescription className="text-base">
                  Earn money walking dogs in your neighborhood
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-green-500" />
                    Flexible payments
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    Set your own hours
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    Insured bookings
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose Dog Walker?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Tracking</h3>
              <p className="text-gray-600">
                Watch your dog's walk in real-time on an interactive map with GPS coordinates across South Africa
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Providers</h3>
              <p className="text-gray-600">
                All walkers are background checked, insured, and reviewed by pet parents throughout South Africa
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                Safe payments in South African Rands with automatic platform commission tracking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 Dog Walker by Jolly Walker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;