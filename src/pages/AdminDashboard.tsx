import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, Booking, Review } from '@/types';
import { 
  DollarSign, Users, ShoppingCart, TrendingUp, 
  CheckCircle, XCircle, Shield, User, Star, Dog
} from 'lucide-react';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all profiles
  useEffect(() => {
    const fetchAllProfiles = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching profiles:', error);
        } else {
          setProfiles(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllProfiles();
  }, []);

  // Fetch all bookings
useEffect(() => {
  const fetchAllBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('scheduled_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching bookings:', error);
        } else {
          setBookings(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllBookings();
  }, []);

  // Fetch all reviews
  useEffect(() => {
    const fetchAllReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching reviews:', error);
        } else {
          setReviews(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      }
    };

    fetchAllReviews();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId);

      if (error) {
        console.error('Error approving user:', error);
        alert('Failed to approve user');
      } else {
        // Refresh profiles
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!fetchError) {
          setProfiles(data || []);
        }
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to approve user');
    }
  };

  const handleSuspend = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: true })
        .eq('id', userId);

      if (error) {
        console.error('Error suspending user:', error);
        alert('Failed to suspend user');
      } else {
        // Refresh profiles
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!fetchError) {
          setProfiles(data || []);
        }
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to suspend user');
    }
  };

  // Calculate average rating for a user
  const getAverageRating = (userId: string): number => {
    const userReviews = reviews.filter(r => r.provider_id === userId);
    if (userReviews.length === 0) return 0;
    const sum = userReviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / userReviews.length;
  };

  // Get reviews for a user
  const getUserReviews = (userId: string): Review[] => {
    return reviews.filter(r => r.provider_id === userId);
  };

  // Calculate platform revenue
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.platform_fee || 0), 0);

  // Filter users
  const pendingProviders = profiles.filter(p => p.role === 'provider' && !p.is_approved);
  const activeProviders = profiles.filter(p => p.role === 'provider' && p.is_approved && !p.is_suspended);
  const activeBookings = bookings.filter(b => b.status === 'active');
  const completedBookings = bookings.filter(b => b.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={currentTab === 'overview' ? 'default' : 'outline'}
            onClick={() => setSearchParams({ tab: 'overview' })}
            className={currentTab === 'overview' ? 'bg-green-700 hover:bg-green-800' : 'text-green-700 border-green-300 hover:bg-green-50'}
          >
            Overview
          </Button>
          <Button
            variant={currentTab === 'users' ? 'default' : 'outline'}
            onClick={() => setSearchParams({ tab: 'users' })}
            className={currentTab === 'users' ? 'bg-green-700 hover:bg-green-800' : 'text-green-700 border-green-300 hover:bg-green-50'}
          >
            Users ({pendingProviders.length > 0 && pendingProviders.length})
          </Button>
          <Button
            variant={currentTab === 'bookings' ? 'default' : 'outline'}
            onClick={() => setSearchParams({ tab: 'bookings' })}
            className={currentTab === 'bookings' ? 'bg-green-700 hover:bg-green-800' : 'text-green-700 border-green-300 hover:bg-green-50'}
          >
            Bookings
          </Button>
          <Button
            variant={currentTab === 'safety' ? 'default' : 'outline'}
            onClick={() => setSearchParams({ tab: 'safety' })}
            className={currentTab === 'safety' ? 'bg-green-700 hover:bg-green-800' : 'text-green-700 border-green-300 hover:bg-green-50'}
          >
            Safety
          </Button>
        </div>

        {currentTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-700" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R{totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-gray-600">Platform commission</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profiles.length}</div>
                  <p className="text-xs text-gray-600">{activeProviders.length} active providers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bookings.length}</div>
                  <p className="text-xs text-gray-600">{activeBookings.length} active now</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingProviders.length}</div>
                  <p className="text-xs text-gray-600">Providers awaiting review</p>
                </CardContent>
              </Card>
            </div>

            {/* Pending Providers */}
            {pendingProviders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Provider Approvals</CardTitle>
                  <CardDescription>Review and approve new service providers</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">
                      <Dog className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingProviders.map((provider) => (
                        <div key={provider.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-semibold">{provider.full_name}</p>
                            <p className="text-sm text-gray-600">{provider.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(provider.id)}
                              className="bg-green-700 hover:bg-green-800"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleSuspend(provider.id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {currentTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage platform users and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <Dog className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading users...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.full_name}</TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell>
                          <Badge variant={
                            profile.role === 'admin' ? 'default' : 
                            profile.role === 'provider' ? 'secondary' : 'outline'
                          }>
                            {profile.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Badge variant={profile.is_approved ? 'default' : 'outline'}>
                              {profile.is_approved ? 'Approved' : 'Pending'}
                            </Badge>
                            {profile.is_suspended && (
                              <Badge variant="destructive">Suspended</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {profile.role === 'provider' && !profile.is_approved && (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(profile.id)}
                              className="bg-green-700 hover:bg-green-800"
                            >
                              Approve
                            </Button>
                          )}
                          {profile.is_approved && !profile.is_suspended && profile.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleSuspend(profile.id)}
                            >
                              Suspend
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {currentTab === 'bookings' && (
          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>View and manage all platform bookings</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <Dog className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading bookings...
                </div>
              ) : bookings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No bookings found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => {
                      const client = profiles.find(p => p.id === booking.client_id);
                      const provider = profiles.find(p => p.id === booking.provider_id);
                      return (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.id.slice(0, 8)}...</TableCell>
                              <TableCell>{client?.full_name}</TableCell>
                              <TableCell>{provider?.full_name}</TableCell>
                              <TableCell>{format(new Date(booking.scheduled_at), 'PPP')}</TableCell>
                                  <TableCell>R{booking.total_fee?.toFixed(2) || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={
                              booking.status === 'completed' ? 'default' :
                              booking.status === 'active' ? 'secondary' :
                              booking.status === 'pending' ? 'outline' : 'destructive'
                            }>
                              {booking.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {currentTab === 'safety' && (
          <Card>
            <CardHeader>
              <CardTitle>Safety Dashboard</CardTitle>
              <CardDescription>Monitor users with low ratings and take action</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Low Rated Providers */}
                <div>
                  <h3 className="font-semibold mb-4">Providers with Rating Below 3.0</h3>
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">
                      <Dog className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading...
                    </div>
                  ) : profiles.filter(u => {
                    const avgRating = getAverageRating(u.id);
                    return avgRating > 0 && avgRating < 3.0 && u.role === 'provider';
                  }).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No providers with low ratings</p>
                  ) : (
                    <div className="space-y-3">
                      {profiles.filter(u => {
                        const avgRating = getAverageRating(u.id);
                        return avgRating > 0 && avgRating < 3.0 && u.role === 'provider';
                      }).map((user) => {
                        const avgRating = getAverageRating(user.id);
                        const userReviews = getUserReviews(user.id);
                        return (
                          <div key={user.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div>
                              <p className="font-semibold text-red-900">{user.full_name}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              <p className="text-sm text-gray-600">{user.location?.address || 'No location set'}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Star className="w-4 h-4 text-red-500" />
                                <span className="text-red-700 font-semibold">{avgRating.toFixed(1)} / 5.0</span>
                                <span className="text-gray-600">({userReviews.length} reviews)</span>
                              </div>
                              <div className="mt-2 text-sm text-gray-600">
                                {userReviews.slice(-2).map(review => (
                                  <p key={review.id} className="italic">"{review.comment}"</p>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {user.is_suspended ? (
                                <Badge variant="destructive">Suspended</Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleSuspend(user.id)}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Suspend User
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Low Rated Clients */}
                <div>
                  <h3 className="font-semibold mb-4">Clients with Rating Below 3.0</h3>
                  {profiles.filter(u => {
                    const avgRating = getAverageRating(u.id);
                    return avgRating > 0 && avgRating < 3.0 && u.role === 'client';
                  }).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No clients with low ratings</p>
                  ) : (
                    <div className="space-y-3">
                      {profiles.filter(u => {
                        const avgRating = getAverageRating(u.id);
                        return avgRating > 0 && avgRating < 3.0 && u.role === 'client';
                      }).map((user) => {
                        const avgRating = getAverageRating(user.id);
                        const userReviews = getUserReviews(user.id);
                        return (
                          <div key={user.id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div>
                              <p className="font-semibold text-amber-900">{user.full_name}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              <p className="text-sm text-gray-600">{user.location?.address || 'No location set'}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Star className="w-4 h-4 text-amber-500" />
                                <span className="text-amber-700 font-semibold">{avgRating.toFixed(1)} / 5.0</span>
                                <span className="text-gray-600">({userReviews.length} reviews)</span>
                              </div>
                              <div className="mt-2 text-sm text-gray-600">
                                {userReviews.slice(-2).map(review => (
                                  <p key={review.id} className="italic">"{review.comment}"</p>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {user.is_suspended ? (
                                <Badge variant="destructive">Suspended</Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSuspend(user.id)}
                                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Suspend User
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;