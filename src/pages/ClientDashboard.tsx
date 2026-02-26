import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RatingModal } from '@/components/RatingModal';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDogs, fetchProviders, fetchReviews } from '@/utils/supabase/helpers';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, Dog, Booking, Review } from '@/types';
import {
  LogOut, Search, Dog as DogIcon, User, Calendar, Star,
  DollarSign, Navigation, Clock, MapPin
} from 'lucide-react';
import { format } from 'date-fns';

const ClientDashboard = () => {
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const user = currentUser as Profile;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<Profile | null>(null);
  const [selectedDog, setSelectedDog] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('60');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);
  const [showProviderReviews, setShowProviderReviews] = useState(false);
  const [selectedProviderForReviews, setSelectedProviderForReviews] = useState<Profile | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [myDogs, setMyDogs] = useState<Dog[]>([]);
  const [loadingDogs, setLoadingDogs] = useState(false);
  const [providers, setProviders] = useState<Profile[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [providerReviews, setProviderReviews] = useState<Review[]>([]);
  const [bookingError, setBookingError] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);
  const [loadingBreadcrumbs, setLoadingBreadcrumbs] = useState(false);
  const [activeWalkBreadcrumbs, setActiveWalkBreadcrumbs] = useState<any[]>([]);

  // Fetch dogs for current user
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    const fetchMyDogs = async () => {
      setLoadingDogs(true);
      try {
        const { data, error } = await fetchDogs(currentUser.id);
        if (error) {
          console.error('Error fetching dogs:', error);
        } else {
          setMyDogs(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoadingDogs(false);
      }
    };

    fetchMyDogs();
  }, [currentUser?.id]);

  // Fetch providers
  useEffect(() => {
    const fetchProvidersData = async () => {
      setLoadingProviders(true);
      try {
        const { data, error } = await fetchProviders();
        if (error) {
          console.error('Error fetching providers:', error);
        } else {
          setProviders(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchProvidersData();
  }, []);

  // Fetch bookings for current user
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    const fetchUserBookings = async () => {
      setLoadingBookings(true);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('client_id', currentUser.id)
          .order('scheduled_at', { ascending: true, nullsFirst: false });

        if (error) {
          console.error('Error fetching bookings:', error);
        } else {
          setBookings(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchUserBookings();
  }, [currentUser?.id]);

  // Fetch reviews when provider is selected
  useEffect(() => {
    const fetchProviderReviewsData = async () => {
      if (!selectedProviderForReviews) return;

      try {
        const { data, error } = await fetchReviews(selectedProviderForReviews.id);
        if (error) {
          console.error('Error fetching reviews:', error);
        } else {
          setProviderReviews(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      }
    };

    if (selectedProviderForReviews) {
      fetchProviderReviewsData();
    }
  }, [selectedProviderForReviews?.id]);

  // Fetch breadcrumbs for active walk
  useEffect(() => {
    const activeBooking = bookings.find(b => b.status === 'active');
    if (!activeBooking?.id) {
      setActiveWalkBreadcrumbs([]);
      return;
    }

    const fetchBreadcrumbs = async () => {
      setLoadingBreadcrumbs(true);
      try {
        const { data, error } = await supabase
          .from('walk_breadcrumbs')
          .select('*')
          .eq('walk_session_id', activeBooking.id)
          .order('created_at', { ascending: false })
          .limit(10); // Show last 10 breadcrumbs

        if (error) {
          console.error('Error fetching breadcrumbs:', error);
        } else {
          setActiveWalkBreadcrumbs(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoadingBreadcrumbs(false);
      }
    };

    fetchBreadcrumbs();

    // Refresh breadcrumbs every 30 seconds for active walk
    const refreshInterval = setInterval(fetchBreadcrumbs, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [bookings]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleRateBooking = (booking: Booking) => {
    setRatingBooking(booking);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!ratingBooking || !rating) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          booking_id: ratingBooking.id,
          reviewer_id: currentUser.id,
          provider_id: ratingBooking.provider_id,
          rating,
          comment,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error submitting review:', error);
        alert('Failed to submit review');
      } else {
        setShowRatingModal(false);
        setRatingBooking(null);
        alert('Review submitted successfully!');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to submit review');
    }
  };

  const handleViewProviderReviews = (provider: Profile) => {
    setSelectedProviderForReviews(provider);
    setShowProviderReviews(true);
  };

  const handleBookService = async () => {
    if (!selectedDog || !selectedProvider || !selectedDate || !selectedTime || !selectedDuration) {
      setBookingError('Please fill in all fields');
      return;
    }

    try {
      const price = parseFloat(selectedDuration) * (selectedProvider.hourly_rate || 0) / 60;
      const platformFee = price * 0.15; // 15% platform fee
      const providerPayout = price - platformFee;
      const scheduledDateTime = `${selectedDate}T${selectedTime}`;

      const { error } = await supabase
        .from('bookings')
        .insert({
          client_id: currentUser.id,
          provider_id: selectedProvider.id,
          dog_ids: [selectedDog],
          scheduled_at: scheduledDateTime,
          scheduled_date: selectedDate,
          duration: parseInt(selectedDuration),
          status: 'pending',
          price: price,
          platform_fee: platformFee,
          provider_payout: providerPayout,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating booking:', error);
        setBookingError('Failed to create booking');
      } else {
        setShowBookingModal(false);
        setSelectedDog('');
        setSelectedDate('');
        setSelectedTime('');
        setSelectedDuration('60');
        setBookingError('');
        alert('Booking created successfully!');

        // Refresh bookings
        const { data, error: fetchError } = await supabase
          .from('bookings')
          .select('*')
          .eq('client_id', currentUser.id)
          .order('scheduled_at', { ascending: true, nullsFirst: false });

        if (!fetchError) {
          setBookings(data || []);
        }
      }
    } catch (err) {
      console.error('Booking error:', err);
      setBookingError('Failed to create booking');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Filter and search providers
  const filteredProviders = providers.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.location?.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalProviders = filteredProviders.length;
  const totalPages = Math.ceil(totalProviders / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedProviders = filteredProviders.slice(startIndex, endIndex);

  // Map function to calculate distance (Johannesburg)
  const clientLocation = { lat: -26.2041, lng: 28.0473 };
  const calculateDistance = (provider: Profile) => {
    if (!provider.location) return null;
    const R = 6371;
    const dLat = (provider.location.lat - clientLocation.lat) * Math.PI / 180;
    const dLon = (provider.location.lng - clientLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(clientLocation.lat * Math.PI / 180) * Math.cos(provider.location.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  // Filter bookings by status
  const activeBookings = bookings.filter(b => b.status === 'active');
  const upcomingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const completedBookings = bookings.filter(b => b.status === 'completed');

  const [showBookingModal, setShowBookingModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DogIcon className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Dogs</h1>
              <p className="text-sm text-green-700 font-medium">by Jolly Walker</p>
              <p className="text-xs text-gray-600">Welcome, {user?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Admin Dashboard link for admins */}
            {isAdmin && (
              <Link to="/admin" className="text-sm text-green-700 hover:underline font-semibold">
                Admin Dashboard
              </Link>
            )}
            <Link to="/provider" className="text-sm text-green-700 hover:underline">
              Provider Dashboard
            </Link>
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
        {/* Empty State - No Dogs */}
        {myDogs.length === 0 && (
          <Card className="mb-8 border-dashed border-2 border-gray-300 bg-gray-50">
            <CardContent className="py-12">
              <div className="text-center">
                <DogIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Dogs Yet!</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Register your furry friend to start booking walks and adventures.
                </p>
                <Link to="/profile">
                  <Button className="bg-green-700 hover:bg-green-800">
                    <DogIcon className="w-4 h-4 mr-2" />
                    Add Your First Dog
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Dogs</CardTitle>
              <DogIcon className="h-4 w-4 text-blue-700" />
            </CardHeader>
            <CardContent>
              {loadingDogs ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-700 border-t-transparent mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading...</p>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold">{myDogs.length}</div>
                  <p className="text-xs text-gray-600">Registered dogs</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Walks</CardTitle>
              <Calendar className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              {loadingBookings ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-700 border-t-transparent mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading...</p>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold">{upcomingBookings.length}</div>
                  <p className="text-xs text-gray-600">Scheduled walks</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Walks</CardTitle>
              <Star className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {loadingBookings ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-700 border-t-transparent mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading...</p>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold">{completedBookings.length}</div>
                  <p className="text-xs text-gray-600">Completed walks</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Walks</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {loadingBookings ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-700 border-t-transparent mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading...</p>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold">{bookings.length}</div>
                  <p className="text-xs text-gray-600">All time walks</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Walk Alert */}
        {activeBookings.length > 0 && (
          <Card className="mb-8 border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">🐕 Walk in Progress!</CardTitle>
              <CardDescription>Your furry friend is on an adventure</CardDescription>
            </CardHeader>
            <CardContent>
              {activeBookings.map((booking) => {
                const provider = providers.find(p => p.id === booking.provider_id);
                return (
                  <div key={booking.id}>
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-green-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{provider?.full_name}</p>
                          <p className="text-sm text-gray-600">
                            {booking.scheduled_at && format(new Date(booking.scheduled_at), 'PPP')} at {booking.scheduled_at && format(new Date(booking.scheduled_at), 'HH:mm')}
                          </p>
                          <p className="text-sm text-gray-600">• R{booking.total_fee?.toFixed(2) || 'N/A'}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-green-700 hover:bg-green-800"
                        disabled
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        GPS Tracking Active
                      </Button>
                    </div>

                    {/* Last Known Locations */}
                    <div className="bg-white rounded-lg border border-green-200 p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-700" />
                        Last Known Locations
                      </h4>
                      {loadingBreadcrumbs ? (
                        <div className="text-center py-4 text-gray-500">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-700 border-t-transparent mx-auto mb-2"></div>
                          <p className="text-sm">Loading location data...</p>
                        </div>
                      ) : activeWalkBreadcrumbs.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No location data yet. Walk just started!</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {activeWalkBreadcrumbs.map((crumb, index) => (
                            <div key={crumb.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {index === 0 ? 'Latest' : `-${index}`}
                                </Badge>
                                <span className="text-gray-600">
                                  Lat: {crumb.lat?.toFixed(6)}, Lng: {crumb.lng?.toFixed(6)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {crumb.created_at && format(new Date(crumb.created_at), 'HH:mm:ss')}
                                </span>
                                {index === 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    asChild
                                  >
                                    <a
                                      href={`https://www.google.com/maps?q=${crumb.lat},${crumb.lng}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      View on Google Maps
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

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
                  const provider = providers.find(p => p.id === booking.provider_id);
                  return (
                    <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">{provider?.full_name}</p>
                        <p className="text-sm text-gray-600">
                          {booking.scheduled_at && format(new Date(booking.scheduled_at), 'PPP')} at {booking.scheduled_at && format(new Date(booking.scheduled_at), 'HH:mm')}
                        </p>
                        <p className="text-sm text-gray-600">• R{booking.total_fee?.toFixed(2) || 'N/A'}</p>
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
        <Card>
          <CardHeader>
            <CardTitle>Find a Walker</CardTitle>
            <CardDescription>Search for dog walkers near you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name, location or service..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            
            {loadingProviders ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-700 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Loading walkers...</p>
              </div>
            ) : displayedProviders.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No providers found. Try adjusting your search.</p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {displayedProviders.map((provider) => {
                    const distance = calculateDistance(provider);
                    return (
                      <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{provider.full_name}</CardTitle>
                              <CardDescription>
                                {provider.location?.address}
                              </CardDescription>
                              {distance && (
                                <Badge variant="outline" className="ml-0 mt-1">{distance} km</Badge>
                              )}
                              {provider.bio && (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{provider.bio}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 mt-4">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="font-semibold">{provider.avg_rating || 'N/A'}</span>
                              <span className="text-sm text-gray-600">({provider.review_count || 0} reviews)</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4 text-blue-700" />
                              <span className="font-semibold">R{provider.hourly_rate || 0}/hour</span>
                            </div>
                          </div>
                          {provider.services && provider.services.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {provider.services.map((service) => (
                                <Badge key={service} variant="secondary" className="text-xs">
                                  {service}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
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
                                <DialogTitle>Book {provider.full_name}</DialogTitle>
                                <DialogDescription>Schedule a dog walk</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="select-dog">Select Dog</Label>
                                  <Select value={selectedDog} onValueChange={setSelectedDog}>
                                    <SelectTrigger id="select-dog">
                                      <SelectValue placeholder="Choose a dog" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {myDogs.map((dog) => (
                                        <SelectItem key={dog.id} value={dog.id}>
                                          {dog.name} ({dog.breed})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="booking-date">Date</Label>
                                  <Input
                                    id="booking-date"
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="booking-time">Time</Label>
                                  <Input
                                    id="booking-time"
                                    type="time"
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="booking-duration">Duration</Label>
                                  <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                                    <SelectTrigger id="booking-duration">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="30">30 minutes</SelectItem>
                                      <SelectItem value="60">1 hour</SelectItem>
                                      <SelectItem value="90">1.5 hours</SelectItem>
                                      <SelectItem value="120">2 hours</SelectItem>
                                      <SelectItem value="180">3 hours</SelectItem>
                                      <SelectItem value="240">4 hours</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {bookingError && (
                                  <div className="text-red-600 text-sm">{bookingError}</div>
                                )}
                                {selectedDate && selectedTime && selectedDuration && (
                                  <div className="p-4 bg-green-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Estimated Cost:</p>
                                    <p className="text-2xl font-bold text-green-900">
                                      R{((provider.hourly_rate || 0) * parseInt(selectedDuration) / 60).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {format(new Date(selectedDate), 'PPP')} at {selectedTime}
                                    </p>
                                  </div>
                                )}
                                <Button
                                  onClick={handleBookService}
                                  className="w-full bg-green-700 hover:bg-green-800"
                                  disabled={!selectedDog || !selectedDate || !selectedTime || !selectedDuration}
                                >
                                  Confirm Booking
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => handleViewProviderReviews(provider)}
                          >
                            <Star className="w-4 h-4 mr-2" />
                            View Reviews ({provider.review_count || '0'})
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <Button
                          key={i}
                          variant={currentPage === i + 1 ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(i + 1)}
                          className="text-green-700"
                        >
                          {i + 1}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rating Modal */}
      {ratingBooking && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setRatingBooking(null);
          }}
          onSubmit={handleRatingSubmit}
          userName={`Provider ${ratingBooking.provider_id?.slice(0, 8)}...`}
          isProvider={true}
        />
      )}

      {/* Provider Reviews Modal */}
      {showProviderReviews && selectedProviderForReviews && (
        <Dialog open={showProviderReviews} onOpenChange={setShowProviderReviews}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reviews for {selectedProviderForReviews.full_name}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              {providerReviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No reviews yet</div>
              ) : (
                <div className="space-y-4">
                  {providerReviews.map((review) => (
                    <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">{format(new Date(review.created_at || ''), 'PPP')}</span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ClientDashboard;