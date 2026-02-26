import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RatingModal } from '@/components/RatingModal';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LogOut, MapPin, Search, Dog, Calendar, 
  Star, DollarSign, Navigation, Clock, User
} from 'lucide-react';

const ClientDashboard = () => {
  const { bookings, users, createBooking, currentUser, routes, getProviderProfile } = useApp();
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [selectedDog, setSelectedDog] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('60');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [viewingRoute, setViewingRoute] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingBooking, setRatingBooking] = useState<any>(null);

  const client = currentUser as any;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleRateBooking = (booking: any) => {
    setRatingBooking(booking);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = (rating: number, comment: string) => {
    if (!ratingBooking) return;
    
    useApp().submitReview({
      bookingId: ratingBooking.id,
      fromUserId: client.id,
      toUserId: ratingBooking.providerId,
      rating,
      comment,
    });
    
    setShowRatingModal(false);
    setRatingBooking(null);
  };

  const handleBookService = () => {

  };

  const providers = users.filter(u => u.role === 'provider' && u.isApproved && !u.isSuspended).map(u => u as any);
  const filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location?.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const myBookings = bookings.filter(b => b.clientId === client?.id);
  const activeBookings = myBookings.filter(b => b.status === 'active');
  const upcomingBookings = myBookings.filter(b => b.status === 'pending');
  const completedBookings = myBookings.filter(b => b.status === 'completed');

  // Simulate client location for distance calculation (Johannesburg)
  const clientLocation = { lat: -26.2041, lng: 28.0473 };

  const calculateDistance = (provider: any) => {
    if (!provider.location) return null;
    const R = 6371; // Earth's radius in kilometers (SA standard)
    const dLat = (provider.location.lat - clientLocation.lat) * Math.PI / 180;
    const dLon = (provider.location.lng - clientLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(clientLocation.lat * Math.PI / 180) * Math.cos(provider.location.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Dog className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dog Walker</h1>
              <p className="text-sm text-green-700 font-medium">by Jolly Walker</p>
              <p className="text-xs text-gray-600">Welcome, {client?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/profile">
              <Button variant="ghost" size="icon">
                <User className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Active Walk Alert */}
        {activeBookings.length > 0 && (
          <Card className="mb-8 border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">🎾 Walk in Progress!</CardTitle>
              <CardDescription>Your furry friend is on an adventure</CardDescription>
            </CardHeader>
            <CardContent>
              {activeBookings.map((booking) => {
                const provider = getProviderProfile(booking.providerId);
                const route = routes.find(r => r.id === booking.routeId);
                return (
                  <div key={booking.id} className="space-y-4">
                    <p className="font-semibold">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Walking with {provider?.name}
                    </p>
                    <Button
                      onClick={() => setViewingRoute(booking.routeId)}
                      className="bg-green-700 hover:bg-green-800"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      View Live Map
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Dogs</CardTitle>
              <Dog className="h-4 w-4 text-blue-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{client?.dogs?.length || 0}</div>
              <p className="text-xs text-gray-600">Registered pets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Walks</CardTitle>
              <Calendar className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingBookings.length}</div>
              <p className="text-xs text-gray-600">Scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Walks</CardTitle>
              <Star className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedBookings.length}</div>
              <p className="text-xs text-gray-600">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Booking History */}
        {completedBookings.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Booking History</CardTitle>
              <CardDescription>Your completed walks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedBookings.map((booking) => {
                  const provider = getProviderProfile(booking.providerId);
                  return (
                    <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">{provider?.name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.scheduledDate).toLocaleDateString()} at {new Date(booking.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                        <p className="text-sm text-gray-600">{booking.duration} minutes • R{booking.price.toFixed(2)}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleRateBooking(booking)}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Rate
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Providers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Find a Walker</CardTitle>
            <CardDescription>Search for dog walkers near you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProviders.map((provider) => {
                const distance = calculateDistance(provider);
                return (
                  <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{provider.name}</CardTitle>
                          <CardDescription>
                            {provider.neighborhood && <span className="text-green-700 font-medium">{provider.neighborhood}</span>}
                            {provider.neighborhood && provider.location?.address && ' • '}
                            {provider.location?.address}
                          </CardDescription>
                        </div>
                        {distance && (
                          <Badge variant="outline" className="ml-2">
                            {distance} km
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-semibold">{provider.rating}</span>
                          <span className="text-gray-600">({provider.totalWalks} walks)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span>R{provider.hourlyRate}/hour</span>
                        </div>
                        {provider.bio && (
                          <p className="text-sm text-gray-600 line-clamp-2">{provider.bio}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {provider.services?.map((service: string) => (
                            <Badge key={service} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full bg-green-700 hover:bg-green-800"
                            onClick={() => setSelectedProvider(provider)}
                          >
                            Book Now
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Book {provider.name}</DialogTitle>
                            <DialogDescription>Schedule a dog walk</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Select Dog</Label>
                              <Select value={selectedDog} onValueChange={setSelectedDog}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a dog" />
                                </SelectTrigger>
                                <SelectContent>
                                  {client?.dogs?.map((dog: any) => (
                                    <SelectItem key={dog.id} value={dog.id}>
                                      {dog.name} ({dog.breed})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Date</Label>
                              <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </div>
                            <div>
                              <Label>Time</Label>
                              <Input
                                type="time"
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Duration</Label>
                              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="30">30 minutes</SelectItem>
                                  <SelectItem value="60">60 minutes</SelectItem>
                                  <SelectItem value="90">90 minutes</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {selectedDate && selectedTime && selectedDuration && (
                              <div className="p-4 bg-green-50 rounded-lg">
                                <p className="text-sm text-gray-600">Estimated Cost:</p>
                                <p className="text-2xl font-bold text-green-900">
                                  R{((provider.hourlyRate * parseInt(selectedDuration)) / 60).toFixed(2)}
                                </p>
                              </div>
                            )}
                            <Button
                              onClick={handleBookService}
                              className="w-full bg-green-700 hover:bg-green-800"
                              disabled={!selectedDog || !selectedDate || !selectedTime}
                            >
                              Confirm Booking
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Map Modal */}
      {viewingRoute && (
        <Dialog open={!!viewingRoute} onOpenChange={() => setViewingRoute(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Live Dog Tracking</DialogTitle>
              <DialogDescription>See where your furry friend is right now</DialogDescription>
            </DialogHeader>
            <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
              {/* Simulated Map */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
                <svg className="w-full h-full" viewBox="0 0 400 300">
                  {/* Grid lines */}
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ccc" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Roads */}
                  <line x1="0" y1="100" x2="400" y2="100" stroke="#fff" strokeWidth="8" />
                  <line x1="0" y1="200" x2="400" y2="200" stroke="#fff" strokeWidth="8" />
                  <line x1="100" y1="0" x2="100" y2="300" stroke="#fff" strokeWidth="6" />
                  <line x1="200" y1="0" x2="200" y2="300" stroke="#fff" strokeWidth="6" />
                  <line x1="300" y1="0" x2="300" y2="300" stroke="#fff" strokeWidth="6" />
                  
                  {/* Parks */}
                  <rect x="220" y="220" width="80" height="60" fill="#86efac" rx="8" />
                  <rect x="20" y="20" width="60" height="60" fill="#86efac" rx="8" />
                  
                  {/* Route path */}
                  <polyline
                    points="150,150 180,130 220,140 260,120 280,150 300,180"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="4"
                    strokeDasharray="10,5"
                    className="animate-pulse"
                  />
                  
                  {/* Current position marker */}
                  <circle cx="300" cy="180" r="12" fill="#f97316" className="animate-bounce" />
                  <circle cx="300" cy="180" r="6" fill="#fff" />
                  
                  {/* Start point */}
                  <circle cx="150" cy="150" r="8" fill="#22c55e" />
                </svg>
              </div>
              
              {/* Overlay info */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-semibold text-sm">Live tracking active</span>
                </div>
              </div>
              
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <Dog className="w-5 h-5 text-orange-500" />
                  <span className="font-semibold">Pup is on the move!</span>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Status</p>
                  <p className="font-semibold">Active Walk</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Time Elapsed</p>
                  <p className="font-semibold">12 min</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setRatingBooking(null);
        }}
        onSubmit={handleRatingSubmit}
        userName={ratingBooking ? getProviderProfile(ratingBooking.providerId)?.name || '' : ''}
        isProvider={true}
      />
    </div>
  );
};

export default ClientDashboard;