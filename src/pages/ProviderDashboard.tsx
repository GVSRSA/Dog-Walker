import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RoleNavbar from '@/components/RoleNavbar';
import PackWalkStarter from '@/components/PackWalkStarter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RatingModal } from '@/components/RatingModal';
import { useAuth } from '@/contexts/AuthContext';
import { fetchBookings } from '@/utils/supabase/helpers';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, Booking } from '@/types';
import {
  MapPin,
  Clock,
  DollarSign,
  Star,
  ShoppingCart,
  Play,
  Square,
  CreditCard,
} from 'lucide-react';
import { format } from 'date-fns';

const ProviderDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const provider = currentUser as Profile;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState(10);
  const [trackingInterval, setTrackingInterval] = useState<NodeJS.Timeout | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  async function refreshBookings() {
    if (!currentUser?.id) return;
    const { data, error } = await fetchBookings(currentUser.id, 'provider');
    if (error) {
      console.error('Error fetching bookings:', error);
      return;
    }
    setBookings(data || []);
  }

  // Fetch bookings for provider
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    const fetchProviderBookings = async () => {
      setLoadingBookings(true);
      try {
        await refreshBookings();
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchProviderBookings();
  }, [currentUser?.id]);

  const handleRateBooking = (booking: Booking) => {
    setRatingBooking(booking);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!ratingBooking || !rating) return;

    try {
      const { error } = await supabase.from('reviews').insert({
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

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId);

      if (error) {
        console.error('Error confirming booking:', error);
        alert('Failed to confirm booking');
      } else {
        await refreshBookings();
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to confirm booking');
    }
  };

  const handleStartWalk = async (bookingId: string) => {
    try {
      // If this booking is part of a pack walk, send provider to session tracking
      const { data: bData, error: bErr } = await supabase
        .from('bookings')
        .select('id, walk_session_id')
        .eq('id', bookingId)
        .single();

      if (bErr) throw bErr;

      if (bData?.walk_session_id) {
        await supabase.from('bookings').update({ status: 'in_progress' }).eq('id', bookingId);
        await refreshBookings();
        navigate(`/live-walk/${bData.walk_session_id}`);
        return;
      }

      const { error } = await supabase.from('bookings').update({ status: 'active' }).eq('id', bookingId);

      if (error) {
        console.error('Error starting walk:', error);
        alert('Failed to start walk');
        return;
      }

      setActiveBookingId(bookingId);
      setIsWalking(true);

      const trackLocation = async () => {
        if (!('geolocation' in navigator)) {
          console.log('[GPS] Geolocation not supported');
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            try {
              const { error: insertError } = await supabase.from('walk_breadcrumbs').insert({
                walk_session_id: bookingId,
                lat: latitude,
                lng: longitude,
              });

              if (insertError) {
                console.error('[GPS] Failed to save breadcrumb:', insertError);
              } else {
                console.log('[GPS] Breadcrumb saved:', { latitude, longitude, bookingId });
              }
            } catch (err) {
              console.error('[GPS] Error saving breadcrumb:', err);
            }
          },
          (error) => {
            console.log('[GPS] Failed to get location:', error.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      };

      trackLocation();

      const intervalId = setInterval(trackLocation, 10 * 1000);
      setTrackingInterval(intervalId);

      await refreshBookings();
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to start walk');
    }
  };

  const handleEndWalk = async (bookingId: string) => {
    try {
      if (trackingInterval !== null) {
        clearInterval(trackingInterval);
        setTrackingInterval(null);
      }

      const { error } = await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId);

      if (error) {
        console.error('Error ending walk:', error);
        alert('Failed to end walk');
      } else {
        setActiveBookingId(null);
        setIsWalking(false);
        await refreshBookings();
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to end walk');
    }
  };

  // Cleanup interval on component unmount or when walk stops
  useEffect(() => {
    return () => {
      if (trackingInterval !== null) {
        console.log('[GPS] Cleaning up tracking interval');
        clearInterval(trackingInterval);
        setTrackingInterval(null);
      }
    };
  }, [trackingInterval]);

  const handlePurchaseCredits = async () => {
    try {
      const cost = creditAmount * 50;

      const { error } = await supabase.from('transactions').insert({
        user_id: currentUser.id,
        amount: cost,
        credits: creditAmount,
        type: 'purchase',
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error purchasing credits:', error);
        alert('Failed to purchase credits');
      } else {
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({
            credit_balance: (provider?.credit_balance || 0) + creditAmount,
          })
          .eq('id', currentUser.id);

        if (balanceError) {
          console.error('Error updating credit balance:', balanceError);
        } else {
          alert('Successfully purchased credits!');
          setShowPurchaseModal(false);
          setCreditAmount(10);
        }
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to purchase credits');
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
  const inProgressBookings = bookings.filter((b) => b.status === 'in_progress');
  const activeBookings = bookings.filter((b) => b.status === 'active');
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.provider_payout || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <RoleNavbar />

      <div className="container mx-auto px-4 py-8">
        <section id="earnings" className="scroll-mt-24">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
                <CreditCard className="h-4 w-4 text-green-700" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{provider?.credit_balance || 0}</div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPurchaseModal(true)}
                  className="mt-2 text-green-700 border-green-300 hover:bg-green-50"
                >
                  Buy More
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rating</CardTitle>
                <Star className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{provider?.avg_rating?.toFixed(1) || 'No ratings yet'}</div>
                <p className="text-xs text-gray-600">{provider?.review_count || 0} reviews</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hourly Rate</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-700" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R{provider?.hourly_rate || 0}</div>
                <p className="text-xs text-gray-600">per hour</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-700" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R{totalEarnings.toFixed(2)}</div>
                <p className="text-xs text-gray-600">{completedBookings.length} completed</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Bookings Section */}
          <section id="walks" className="scroll-mt-24 lg:col-span-2 space-y-6">
            <PackWalkStarter providerId={currentUser.id} bookings={bookings} onCreated={refreshBookings} />

            {/* Pending Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Bookings</CardTitle>
                <CardDescription>Accept new booking requests</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBookings ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-700 border-t-transparent mx-auto mb-2"></div>
                    Loading bookings...
                  </div>
                ) : pendingBookings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No pending bookings</p>
                ) : (
                  <div className="space-y-4">
                    {pendingBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold">Client ID: {booking.client_id.slice(0, 8)}...</p>
                          <p className="text-sm text-gray-600">
                            {booking.scheduled_at && format(new Date(booking.scheduled_at), 'PPP')} at{' '}
                            {booking.scheduled_at && format(new Date(booking.scheduled_at), 'HH:mm')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-green-700">R{booking.total_fee?.toFixed(2) || 'N/A'}</p>
                          <Button
                            size="sm"
                            onClick={() => handleConfirmBooking(booking.id)}
                            disabled={isWalking}
                            className="bg-green-700 hover:bg-green-800"
                          >
                            Confirm
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Confirmed Bookings */}
            {confirmedBookings.length > 0 && (
              <Card className="border-green-300 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-900">Confirmed Bookings</CardTitle>
                  <CardDescription>Ready to start walks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {confirmedBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                        <div>
                          <p className="font-semibold">Client ID: {booking.client_id.slice(0, 8)}...</p>
                          <p className="text-sm text-gray-600">
                            {booking.scheduled_at && format(new Date(booking.scheduled_at), 'PPP')} at{' '}
                            {booking.scheduled_at && format(new Date(booking.scheduled_at), 'HH:mm')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-green-700">R{booking.total_fee?.toFixed(2) || 'N/A'}</p>
                          <Button
                            size="sm"
                            onClick={() => handleStartWalk(booking.id)}
                            disabled={isWalking}
                            className="bg-green-700 hover:bg-green-800"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Start Walk
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* In-progress pack bookings */}
            {inProgressBookings.length > 0 && (
              <Card className="border-violet-300 bg-violet-50">
                <CardHeader>
                  <CardTitle className="text-violet-900">Pack Walk (In Progress)</CardTitle>
                  <CardDescription>These bookings are attached to an active walk session.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inProgressBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                        <div>
                          <p className="font-semibold">Client ID: {booking.client_id?.slice(0, 8)}...</p>
                          <p className="text-sm text-gray-600">Session: {booking.walk_session_id?.slice(0, 8)}...</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {booking.walk_session_id && (
                            <Button
                              size="sm"
                              onClick={() => navigate(`/live-walk/${booking.walk_session_id}`)}
                              className="bg-violet-700 hover:bg-violet-800"
                            >
                              View Live
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (!booking.walk_session_id) return;
                              await supabase.from('bookings').update({ status: 'completed' }).eq('id', booking.id);
                              await refreshBookings();
                            }}
                            className="rounded-full"
                          >
                            Mark complete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Walks */}
            {activeBookings.length > 0 && (
              <Card className="border-green-300 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-900">Active Walk in Progress</CardTitle>
                  <CardDescription>GPS tracking is active</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Walking for client {booking.client_id.slice(0, 8)}...</p>
                        <p className="text-sm text-gray-600">Tracking location...</p>
                      </div>
                      <Button size="sm" onClick={() => handleEndWalk(booking.id)} className="bg-red-600 hover:bg-red-700">
                        <Square className="w-4 h-4 mr-1" />
                        End Walk
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Booking History */}
            <Card>
              <CardHeader>
                <CardTitle>Booking History</CardTitle>
                <CardDescription>Your past walks</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBookings ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-700 border-t-transparent mx-auto mb-2"></div>
                    Loading bookings...
                  </div>
                ) : completedBookings.length === 0 && bookings.filter((b) => b.status === 'cancelled').length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No booking history</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Earnings</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...completedBookings, ...bookings.filter((b) => b.status === 'cancelled')].map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">ID: {booking.client_id?.slice(0, 8)}...</TableCell>
                          <TableCell>{booking.scheduled_at && format(new Date(booking.scheduled_at), 'PPP')}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>R{booking.provider_payout?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>
                            <Badge variant={booking.status === 'completed' ? 'default' : 'outline'}>{booking.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {booking.status === 'completed' && (
                              <Button size="sm" onClick={() => handleRateBooking(booking)} className="bg-amber-600 hover:bg-amber-700">
                                <Star className="w-4 h-4 mr-2" />
                                Rate Client
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
          </section>

          {/* Schedule Section */}
          <section id="schedule" className="scroll-mt-24 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
                <CardDescription>Set your working hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="monday">Monday</Label>
                  <Switch id="monday" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="tuesday">Tuesday</Label>
                  <Switch id="tuesday" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="wednesday">Wednesday</Label>
                  <Switch id="wednesday" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="thursday">Thursday</Label>
                  <Switch id="thursday" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="friday">Friday</Label>
                  <Switch id="friday" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="saturday">Saturday</Label>
                  <Switch id="saturday" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sunday">Sunday</Label>
                  <Switch id="sunday" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="availability-start">Start Time</Label>
                    <Input id="availability-start" name="availability-start" type="time" defaultValue="08:00" />
                  </div>
                  <div>
                    <Label htmlFor="availability-end">End Time</Label>
                    <Input id="availability-end" name="availability-end" type="time" defaultValue="18:00" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      {/* Purchase Credits Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Purchase Credits</CardTitle>
              <CardDescription>Buy credits to accept more bookings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[5, 10, 20].map((amount) => (
                  <Button
                    key={amount}
                    variant={creditAmount === amount ? 'default' : 'outline'}
                    onClick={() => setCreditAmount(amount)}
                    className={
                      creditAmount === amount
                        ? 'bg-green-700 hover:bg-green-800'
                        : 'text-green-700 border-green-300 hover:bg-green-50'
                    }
                  >
                    {amount} credits
                  </Button>
                ))}
              </div>
              <div className="text-center p-4 bg-green-100 rounded-lg">
                <p className="text-2xl font-bold text-green-900">R{(creditAmount * 50).toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total cost</p>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 text-green-700 border-green-300 hover:bg-green-50"
                >
                  Cancel
                </Button>
                <Button onClick={handlePurchaseCredits} className="flex-1 bg-green-700 hover:bg-green-800">
                  Purchase
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setRatingBooking(null);
        }}
        onSubmit={handleRatingSubmit}
        userName={`Client ${ratingBooking?.client_id?.slice(0, 8)}...`}
        isProvider={false}
      />
    </div>
  );
};

export default ProviderDashboard;