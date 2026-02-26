import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RatingModal } from '@/components/RatingModal';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LogOut, 
  MapPin, 
  Search, 
  Dog, 
  User, 
  Calendar, 
  Star, 
  DollarSign, 
  Navigation, 
  Clock, 
  Heart 
  Plus,
  Minus 
  UserCog
} from 'lucide-react';

const { fetchDogs, fetchProfile, fetchProviders, fetchReviews } from '@/utils/supabase/helpers';
const { supabase } from '@/integrations/supabase/client';

const ClientDashboard = () => {
  // Get current user from Auth
  const currentUser = useAuth().currentUser;
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<Profile | null>(null);
  const [selectedDog, setSelectedDog] = useState<string>('null');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('60');
  const [selectedDuration, setSelectedDuration] = useState('60');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);
  const [showProviderReviews, setShowProviderReviews] = useState(false);
  const [selectedProviderForReviews, setSelectedProviderForReviews] = useState<Profile | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [myDogs, setMyDogs] = useState<Dog[]>([]);
  const [loadingDogs, setLoadingDogs] = useState(false);
  const [providers, setProviders] = useState<Profile[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providerReviews, setProviderReviews] = useState<Review[]>([]);
  
  // Fetch dogs for current user
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;
    
    const fetchMyDogs = async () => {
      setLoadingDogs(true);
      try {
        const { data, error } = await fetchDogs(currentUser.id);
        if (error) {
          console.error('Error fetching dogs:', error);
        }
        setMyDogs(data || []);
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
    const fetchProviders = async () => {
      setLoadingProviders(true);
      try {
        const { data, error } = await fetchProviders();
        if (error) {
          console.error('Error fetching providers:', error);
        }
        setProviders(data || []);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoadingProviders(false);
      }
    };
    
    fetchProviders();
  }, []);

  // Fetch reviews when provider is selected
  useEffect(() => {
    const fetchProviderReviews = async () => {
      if (!selectedProviderForReviews) return;
    
    const fetchProviderReviews = async () => {
      try {
        const { data, error } = await fetchReviews(selectedProviderForReviews.id);
        if (error) {
          console.error('Error fetching reviews:', error);
        }
        setProviderReviews(data || []);
      } catch (err) {
        console.error('Error:', err);
      }
    };
    
    if (selectedProviderForReviews) {
      fetchProviderReviews();
    }
  }, [selectedProviderForReviews?.id]);
  
  const handleLogout = () => {
    const { logout } = useAuth();
    logout();
    navigate('/');
  };

  const handleRateBooking = (booking: Booking) => {
    setRatingBooking(booking);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = (rating: number, comment: string) => {
    if (!rating) return;
    const { submitReview } = useApp();
    submitReview({
      bookingId: booking.id,
      fromUserId: currentUser?.id,
      toUserId: booking.providerId,
      rating,
      comment,
    });
    setShowRatingModal(false);
    setRatingBooking(null);
  };

  const handleViewProviderReviews = (provider: Profile) => {
    setSelectedProviderForReviews(provider);
    setShowProviderReviews(true);
  };

  const handleBookService = () => {
    // TODO: Implement actual booking logic
    console.log('Book service clicked');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Filter and search providers
  const filteredProviders = providers.filter(p => {
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.location?.address?.toLowerCase().includes(searchTerm.toLowerCase())
  });

  // Pagination
  const totalProviders = filteredProviders.length;
  const totalPages = Math.ceil(totalProviders / itemsPerPage);
  const startIndex = (currentPage -1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedProviders = filteredProviders.slice(startIndex, endIndex);

  // Map function to calculate distance (Johannesburg)
  const clientLocation = { lat: -26.2041, lng: 28.0473 };
  const calculateDistance = (provider: any) => {
    if (!provider.location) return null;
    const R = 6371;
    const dLat = (provider.location.lat - clientLocation.lat) * Math.PI / 180;
    const dLon = (provider.location.lng - clientLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(clientLocation.lat * Math.PI / 180) * Math.cos(provider.location.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  return (
    <div className=\"min-h-screen bg-gray-50">
      {/* Header */}
      <header className=\"bg-white border-b sticky top-0 z-10\">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Dog className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">My Dogs</p>
            <p className="text-sm text-green-700 font-medium">by Jolly Walker</p>
            <p className="text-xs text-gray-600">Welcome, {currentUser?.full_name}</p>
          </div>
        </div>
        </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle>My Dogs</CardTitle>
              <Dogs count</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDogs ? (
                <div className="flex items-center justify-center p-4">
                  <Dogs className="h-6 w-6 text-blue-500 animate-spin" />
                <p>Loading dogs...</p>
              </div>
              ) : (
                <div className="flex flex-row items-center justify-between">
                  <div className="text-2xl font-bold">{myDogs.length}</div>
                  <p className="text-sm text-gray-600">Registered dogs</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle>Total Walks</CardTitle>
                <Clock className="h-4 w-4 text-gray-700" />
              </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentUser?.total_walks || 0}</div>
              <p className="text-sm text-gray-600">Total walks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle>Rating</CardTitle>
              <Star className="h-4 w-4 text-amber-500" />
              </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentUser?.avg_rating?.toFixed(1) || 'No ratings yet'}</div>
              <p className="text-sm text-gray-600">Average rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle>Credits</CardTitle>
              <User className="h-4 w-4 text-blue-700" />
              </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentUser?.credit_balance || 0}</div>
              <p className="text-sm text-gray-600">Available credits</p>
            </CardContent>
          </Card>
        </div>

        {/* Search Providers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Find a Walker</CardTitle>
            <CardDescription>Search for dog walkers near you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by name or location..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>

              {/* Loading providers */}
              {loadingProviders ? (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <div className="flex justify-center p-12">
                      <Dogs className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-center text-gray-600">Loading walkers...</p>
                  </div>
                  <div className="col-span-2">
                    <div className="flex justify-center p-12">
                      <Dogs className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-center text-gray-600">Loading walkers...</p>
                  </div>
                  <div className="col-span-3">
                    <div className="flex justify-center p-12">
                      <Dogs className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                    <p className="text-center text-gray-600">Loading walkers...</p>
                  </div>
                </div>
              </div>
            </div>
            ) : filteredProviders.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No providers found. Try adjusting your search.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
                {displayedProviders.map((provider) => {
                  const distance = calculateDistance(provider);
                  return (
                    <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{provider.name}</CardTitle>
                            <CardDescription>
                              {provider.neighborhood && <span className="text-green-700 font-medium">{provider.neighborhood}</span> • {provider.location?.address}</CardDescription>
                            </div>
                            {distance && (
                              <Badge variant="outline" className="ml-2">
                                {distance} km
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="font-semibold">{provider.avg_rating || 0}</span>
                              <span className="text-gray-600">({provider.review_count || 0} reviews)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-blue-700" />
                              <span className="font-semibold">{provider.hourlyRate}/hour</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-4">
                            {provider.services?.map((service: string) => (
                              <Badge key={service} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                        <div className="flex items-center mt-4">
                          <Dialog>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button className="w-full bg-green-700 hover:bg-green-800">
                                  Book Now
                                </Button>
                              <DialogTrigger>
                                <DialogContent>
                                  <DialogTitle>Book {provider.name}</DialogTitle>
                                  <DialogDescription>Schedule a dog walk</DialogDescription>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Select Dog</Label>
                                      <Select value={selectedDog} onValueChange={setSelectedDog}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Choose a dog">
                                          Choose a dog
                                        <SelectItem value="null">Choose a dog</SelectValue>
                                          <SelectContent>
                                            {myDogs.map((dog: any) => (
                                              <SelectItem key={dog.id} value={dog.id}>
                                                {dog.name} ({dog.breed})
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </Select>
                                    </div>

                                    <div>
                                      <Label>Date</Label>
                                      <Input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="flex-1"
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
                                      <Input
                                        type="number"
                                        value={selectedDuration}
                                        onChange={(e) => setSelectedDuration(e.target.value)}
                                      />
                                    </div>
                                    <div>
                                    <Button
                                      onClick={handleBookService}
                                      className="w-full bg-green-700 hover:bg-green-800"
                                      disabled={!selectedDog || !selectedDate || !selectedTime || !selectedDuration}
                                    >
                                      Book Now
                                    </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              </Dialog>
                            </div>
                          </CardContent>
                          </Card>
                        </Dialog>

                        <Button
                          variant="outline"
                          className="w-full text-green-700 border-green-300 hover:bg-green-50"
                          onClick={() => handleViewProviderReviews(provider)}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          View Reviews ({provider.review_count || '0'})
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
              </div>
            )}

            {/* Pagination */}
            {totalProviders > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{Math.min(startIndex + 1, totalProviders)}</span> to{' '}</span>
                    <span className="font-semibold">{Math.min(endIndex, totalProviders)}</span> of{' '}</span>
                    <span className="font-semibold">{totalProviders}</span> providers
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1)}
                      disabled={currentPage === 1}
                      className="text-green-700 border-green-300 hover:bg-green-50 disabled:opacity-50"
                    >
                      Previous
                    </Button>
                    <div className="text-xs text-gray-600">Go to page</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages)}
                      disabled={currentPage === totalPages}
                      className="text-green-700 border-green-300 hover:bg-green-50 disabled:opacity-50"
                    >
                      Next
                    </Button>
                    <div className="text-xs text-gray-600">Next page</div>
                  </div>
                  </div>
                </div>

                {/* Page numbers */}
                <div className="flex flex-wrap items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum;
                      if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i < 5 ? i + 1 : '...';
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = i < 2 ? i === 0 ? 1 : '...';
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = i < 0 ? 1 : '...';
                    }
                    if (pageNum === '...') {
                      return <span key={i} className="px-3 py-2">
                        ...
                      </span>;
                    }
                    if (pageNum === '...') {
                      return <span key={i} className="px-3 py-2">
                        ...
                      </span>;
                    }
                    return (
                      <Button
                        key={i}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum as number)}
                        className="text-green-700 border-green-300 hover:bg-green-50"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  {totalProviders > 7 && (
                    <span key={Math.min(totalPages, 7)} className="px-3 py-2">
                      ...
                    </span>
                  )}
                  {totalPages > 1 && (
                    <span key={totalPages - 7} className="px-3 py-2">
                      {totalPages}
                      <span className="px-3 py-2">
                        ...
                      </span>
                  )}
                  {currentPage >= totalPages && (
                    <Button
                      key={totalPages}
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="text-green-700 border-green-300 hover:bg-green-50"
                      disabled={currentPage === totalPages}
                      {totalPages}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      </div>
      </div>
    </div>
  );
};

export default ClientDashboard;