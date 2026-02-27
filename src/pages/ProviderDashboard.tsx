import { useMemo, useState, useEffect } from 'react';
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
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
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

function isToday(value?: string | null) {
  if (!value) return false;
  const today = new Date();

  // Date-only format (preferred)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map((x) => Number(x));
    return today.getFullYear() === y && today.getMonth() + 1 === m && today.getDate() === d;
  }

  // Timestamp / ISO string
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return (
    parsed.getFullYear() === today.getFullYear() &&
    parsed.getMonth() === today.getMonth() &&
    parsed.getDate() === today.getDate()
  );
}

const ProviderDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const provider = currentUser as Profile;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState(10);
  const [trackingInterval, setTrackingInterval] = useState<NodeJS.Timeout | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);
  const [dogNamesById, setDogNamesById] = useState<Record<string, string>>({});
  const [endWalkBookingId, setEndWalkBookingId] = useState<string | null>(null);
  const [endWalkNotes, setEndWalkNotes] = useState('');
  const [endWalkDidPee, setEndWalkDidPee] = useState(false);
  const [endWalkDidPoop, setEndWalkDidPoop] = useState(false);
  const [endingWalk, setEndingWalk] = useState(false);

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
      console.error('[provider-dashboard] Error fetching bookings:', error);
      return;
    }
    setBookings((data || []) as Booking[]);
  }

  // Keep provider dashboard in sync with live DB changes (e.g. manual status flips to in_progress)
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel(`provider_bookings:${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `provider_id=eq.${currentUser.id}`,
        },
        () => {
          refreshBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    const dogIds = Array.from(
      new Set(
        (bookings || [])
          .map((b) => b.dog_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    if (dogIds.length === 0) return;

    let cancelled = false;

    const loadDogNames = async () => {
      const { data, error } = await supabase.from('dogs').select('id,name').in('id', dogIds);
      if (cancelled) return;
      if (error) {
        console.error('[provider-dashboard] Error loading dogs:', error);
        return;
      }
      const map: Record<string, string> = {};
      (data || []).forEach((d: any) => {
        if (d?.id) map[d.id] = d?.name || 'Dog';
      });
      setDogNamesById(map);
    };

    loadDogNames();

    return () => {
      cancelled = true;
    };
  }, [bookings]);

  const dogLabel = useMemo(() => {
    return (dogId?: string | null) => {
      if (!dogId) return 'Dog';
      return dogNamesById[dogId] || 'Dog';
    };
  }, [dogNamesById]);

  const bookingDogName = useMemo(() => {
    return (booking: Booking) => booking?.dogs?.name || dogLabel(booking.dog_id);
  }, [dogLabel]);

  // Fetch bookings for provider
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    const fetchProviderBookings = async () => {
      setLoadingBookings(true);
      try {
        await refreshBookings();
      } catch (err) {
        console.error('[provider-dashboard] Error:', err);
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
        console.error('[provider-dashboard] Error submitting review:', error);
        toast({ title: 'Could not submit review', description: error.message, variant: 'destructive' });
      } else {
        setShowRatingModal(false);
        setRatingBooking(null);
        toast({ title: 'Review submitted', description: 'Thanks for the feedback.' });
      }
    } catch (err: any) {
      console.error('[provider-dashboard] Error:', err);
      toast({ title: 'Could not submit review', description: err?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    if (!bookingId) return;

    console.log('[provider-dashboard] Confirm booking clicked', { bookingId });
    setConfirmingId(bookingId);

    // Optimistic UI update so it moves immediately
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'confirmed' } : b)));

    try {
      // IMPORTANT: only flip the status for this single booking.
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);

      if (error) {
        console.error('[provider-dashboard] Confirm booking failed:', error);
        toast({
          title: 'Could not confirm booking',
          description: error.message,
          variant: 'destructive',
        });

        // Rollback optimistic change
        await refreshBookings();
        return;
      }

      toast({ title: 'Booking confirmed', description: 'It\'s now in your Daily Schedule.' });
      await refreshBookings();
    } catch (err: any) {
      console.error('[provider-dashboard] Confirm booking exception:', err);
      toast({
        title: 'Could not confirm booking',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
      await refreshBookings();
    } finally {
      setConfirmingId(null);
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

      const startedAt = new Date().toISOString();

      if (bData?.walk_session_id) {
        await supabase
          .from('bookings')
          .update({ status: 'in_progress', started_at: startedAt })
          .eq('id', bookingId);
        await refreshBookings();
        navigate(`/live-walk/${bData.walk_session_id}`);
        return;
      }

      // For solo walks, create a walk_session so LiveWalk can show the live timer + tracking
      const { data: createdSession, error: sessionErr } = await supabase
        .from('walk_sessions')
        .insert({ walker_id: currentUser.id, status: 'active' })
        .select('id')
        .single();

      if (sessionErr) throw sessionErr;

      const sessionId = createdSession.id as string;

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'in_progress', walk_session_id: sessionId, started_at: startedAt })
        .eq('id', bookingId);

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
                walk_session_id: sessionId,
                lat: latitude,
                lng: longitude,
              });

              if (insertError) {
                console.error('[GPS] Failed to save breadcrumb:', insertError);
              } else {
                console.log('[GPS] Breadcrumb saved:', { latitude, longitude, sessionId });
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
      navigate(`/live-walk/${sessionId}`);
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to start walk');
    }
  };

  const handleEndWalk = async (bookingId: string) => {
    // Open a short summary dialog so notes + potty updates are always persisted.
    setEndWalkBookingId(bookingId);
    setEndWalkNotes('');
    setEndWalkDidPee(false);
    setEndWalkDidPoop(false);
  };

  const confirmEndWalk = async () => {
    if (!endWalkBookingId) return;

    try {
      setEndingWalk(true);

      if (trackingInterval !== null) {
        clearInterval(trackingInterval);
        setTrackingInterval(null);
      }

      const endedAt = new Date().toISOString();

      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          ended_at: endedAt,
          walk_notes: endWalkNotes.trim() || null,
          did_pee: endWalkDidPee,
          did_poop: endWalkDidPoop,
        })
        .eq('id', endWalkBookingId);

      if (error) {
        console.error('Error ending walk:', error);
        alert('Failed to end walk');
        return;
      }

      setActiveBookingId(null);
      setIsWalking(false);
      setEndWalkBookingId(null);
      await refreshBookings();
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to end walk');
    } finally {
      setEndingWalk(false);
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
  const todaysConfirmedBookings = confirmedBookings.filter((b) => isToday(b.scheduled_date));
  const inProgressBookings = bookings.filter((b) => b.status === 'in_progress' && Boolean(b.walk_session_id));
  const activeBookings = bookings.filter((b) => (b.status === 'active' || b.status === 'in_progress') && !b.walk_session_id);
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  const totalEarnings = completedBookings.reduce((sum, b) => {
    const fee = typeof b.total_fee === 'number' ? b.total_fee : Number(b.total_fee);
    return sum + (Number.isFinite(fee) ? fee : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <RoleNavbar />

      <Dialog open={Boolean(endWalkBookingId)} onOpenChange={(open) => (!open ? setEndWalkBookingId(null) : null)}>
        <DialogContent className="overflow-hidden rounded-3xl border-slate-200 p-0">
          <div className="bg-rose-600 px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold text-white">End Walk Summary</DialogTitle>
              <DialogDescription className="text-rose-50/90">
                Add a quick note for the owner and mark potty updates.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="end-walk-notes">Notes for the Owner</Label>
              <Textarea
                id="end-walk-notes"
                value={endWalkNotes}
                onChange={(e) => setEndWalkNotes(e.target.value)}
                placeholder="e.g., Great 90m walk — lots of sniff time and calm leash work."
                className="min-h-[110px] rounded-2xl"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <Checkbox checked={endWalkDidPee} onCheckedChange={(v) => setEndWalkDidPee(Boolean(v))} />
                <span className="text-sm font-semibold text-slate-900">💧 Pee</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <Checkbox checked={endWalkDidPoop} onCheckedChange={(v) => setEndWalkDidPoop(Boolean(v))} />
                <span className="text-sm font-semibold text-slate-900">💩 Poop</span>
              </label>
            </div>

            <Separator />

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={confirmEndWalk}
                disabled={endingWalk}
                className="flex-1 rounded-full bg-rose-600 hover:bg-rose-700"
              >
                {endingWalk ? 'Ending…' : 'Complete walk'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEndWalkBookingId(null)}
                className="flex-1 rounded-full border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                <div className="text-2xl font-bold">{provider.avg_rating || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Walks</CardTitle>
                <Clock className="h-4 w-4 text-blue-700" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{provider.total_walks || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-700" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R{totalEarnings.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Bookings Section */}
          <section id="walks" className="scroll-mt-24 lg:col-span-2 space-y-6">
            <PackWalkStarter
              providerId={currentUser.id}
              bookings={bookings}
              onCreated={refreshBookings}
              onStarted={(sessionId) => navigate(`/live-walk/${sessionId}`)}
            />

            {/* New Requests */}
            <Card>
              <CardHeader>
                <CardTitle>New Requests</CardTitle>
                <CardDescription>Confirm bookings to add them to today's schedule.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBookings ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-700 border-t-transparent mx-auto mb-2"></div>
                    Loading bookings...
                  </div>
                ) : pendingBookings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No new requests</p>
                ) : (
                  <div className="space-y-4">
                    {pendingBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold">{bookingDogName(booking)}</p>
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
                            disabled={isWalking || confirmingId === booking.id}
                            className="bg-green-700 hover:bg-green-800"
                          >
                            {confirmingId === booking.id ? 'Confirming…' : 'Confirm Booking'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Schedule */}
            {todaysConfirmedBookings.length > 0 && (
              <Card className="border-green-300 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-900">Daily Schedule</CardTitle>
                  <CardDescription>Today's confirmed bookings (start them via the Pack Walk selector above).</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {todaysConfirmedBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{bookingDogName(booking)}</p>
                          <p className="text-sm text-gray-600">
                            {booking.scheduled_at ? (
                              <>
                                {format(new Date(booking.scheduled_at), 'PPP')} at {format(new Date(booking.scheduled_at), 'HH:mm')}
                              </>
                            ) : (
                              booking.scheduled_date
                            )}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">Booking {booking.id.slice(0, 8)}…</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="rounded-full bg-emerald-100 text-emerald-900 hover:bg-emerald-100">Confirmed</Badge>
                          <p className="font-bold text-green-700">R{booking.total_fee?.toFixed(2) || 'N/A'}</p>
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
                          <p className="font-semibold">{bookingDogName(booking)}</p>
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
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Walks (solo / manual in_progress without a session) */}
            {activeBookings.length > 0 && (
              <Card className="border-rose-300 bg-rose-50">
                <CardHeader>
                  <CardTitle className="text-rose-950">Walk In Progress</CardTitle>
                  <CardDescription>End the walk to complete the booking and trigger the credit debit.</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Walking {bookingDogName(booking)}</p>
                        <p className="text-sm text-rose-900/70">Status: {booking.status}</p>
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
                        <TableHead>Dog</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Earnings</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...completedBookings, ...bookings.filter((b) => b.status === 'cancelled')].map((booking) => {
                        const minutes = Number(booking.duration ?? 0);
                        const durationLabel = minutes > 0 ? `${minutes}m` : '—';
                        const earnings = Number(booking.total_fee ?? 0);

                        return (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">{bookingDogName(booking)}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-2">
                                <span>{booking.scheduled_at && format(new Date(booking.scheduled_at), 'PPP')}</span>
                                <Badge className="rounded-full bg-slate-100 text-slate-900 hover:bg-slate-100">
                                  {durationLabel}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>R{Number.isFinite(earnings) ? earnings.toFixed(2) : '0.00'}</TableCell>
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
                        );
                      })}
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
                  <Switch id="saturday" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sunday">Sunday</Label>
                  <Switch id="sunday" defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Manage your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue={provider.full_name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={provider.email} disabled />
                </div>
                <Button className="w-full bg-green-700 hover:bg-green-800">Update Profile</Button>
                <Button variant="outline" className="w-full" onClick={() => logout()}>
                  Logout
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>

        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          onSubmit={handleRatingSubmit}
          userName={(ratingBooking as any)?.client?.full_name || 'Client'}
          isProvider={true}
        />
      </div>
    </div>
  );
};

export default ProviderDashboard;