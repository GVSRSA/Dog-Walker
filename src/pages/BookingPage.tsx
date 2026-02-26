import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleNavbar from '@/components/RoleNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { fetchDogs, fetchProviders } from '@/utils/supabase/helpers';
import type { Dog, Profile } from '@/types';
import { CalendarDays, Dog as DogIcon, MapPin, Search, Star } from 'lucide-react';
import { format } from 'date-fns';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function BookingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [dogs, setDogs] = useState<Dog[]>([]);
  const [providers, setProviders] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');

  const [selectedProvider, setSelectedProvider] = useState<Profile | null>(null);
  const [selectedDogId, setSelectedDogId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!currentUser?.id) return;
      setLoading(true);

      const [{ data: dogsData }, { data: providersData }] = await Promise.all([
        fetchDogs(currentUser.id),
        fetchProviders(),
      ]);

      setDogs(dogsData || []);
      setProviders(providersData || []);
      setLoading(false);
    };

    load();
  }, [currentUser?.id]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return providers;
    return providers.filter((p) => {
      return (
        p.full_name?.toLowerCase().includes(s) ||
        (p.location?.address || '').toLowerCase().includes(s) ||
        (p.services || []).some((x) => x.toLowerCase().includes(s))
      );
    });
  }, [providers, search]);

  const cost = useMemo(() => {
    if (!selectedProvider) return 0;
    const minutes = Number.parseInt(duration || '60', 10);
    const providerRate = Number(selectedProvider.walk_rate ?? selectedProvider.hourly_rate ?? 0);
    return (minutes / 60) * providerRate;
  }, [selectedProvider, duration]);

  const handleBook = async () => {
    setError('');

    if (!selectedProvider || !selectedDogId || !date || !time) {
      setError('Please complete all fields.');
      return;
    }

    // Re-check approval server-side (don't trust stale UI data)
    const { data: provider, error: providerError } = await supabase
      .from('profiles')
      .select('is_approved,is_suspended')
      .eq('id', selectedProvider.id)
      .single();

    if (providerError) {
      setError('Could not verify provider approval. Please try again.');
      return;
    }

    if (!provider?.is_approved || provider?.is_suspended) {
      setError('This walker is not approved (or is currently unavailable). Please choose another.');
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to book.');
      return;
    }

    if (!UUID_RE.test(selectedDogId)) {
      setError('Selected dog ID is not a valid UUID. Please re-select your dog.');
      return;
    }

    // Re-verify the selected dog belongs to the logged-in user (matches RLS expectations)
    const { data: dogRow, error: dogVerifyError } = await supabase
      .from('dogs')
      .select('id,owner_id')
      .eq('id', selectedDogId)
      .maybeSingle();

    if (dogVerifyError || !dogRow) {
      console.error('[BookingPage] Could not verify selected dog', { dogVerifyError, selectedDogId, userId: user.id });
      setError('Could not verify the selected dog. Please re-select and try again.');
      return;
    }

    if (dogRow.owner_id !== user.id) {
      console.error('[BookingPage] Dog owner mismatch', { selectedDogId, owner_id: dogRow.owner_id, userId: user.id });
      setError('That dog does not belong to your account. Please re-select and try again.');
      return;
    }

    const minutes = Number.parseInt(duration || '60', 10);
    const providerRate = Number(selectedProvider.walk_rate ?? selectedProvider.hourly_rate ?? 0);
    const totalFee = (minutes / 60) * providerRate;

    const platformFee = totalFee * 0.15;
    const providerPayout = totalFee - platformFee;
    const scheduledAt = `${date}T${time}`;

    const payload = {
      client_id: user.id,
      provider_id: selectedProvider.id,
      dog_id: selectedDogId,
      status: 'pending',
      scheduled_at: scheduledAt,
      scheduled_date: date,
      duration: minutes,
      total_fee: totalFee,
      platform_fee: platformFee,
      provider_payout: providerPayout,
    };

    console.log('[BookingPage] Creating booking', {
      client_id: payload.client_id,
      provider_id: payload.provider_id,
      dog_id: payload.dog_id,
      duration: payload.duration,
      scheduled_at: payload.scheduled_at,
    });

    const { error: insertError } = await supabase.from('bookings').insert(payload);

    if (insertError) {
      console.error('[BookingPage] Booking insert failed', insertError);
      setError(`${insertError.message}${insertError.code ? ` (code: ${insertError.code})` : ''}`);
      return;
    }

    navigate('/my-bookings', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Book a Walker</h1>
          <p className="mt-1 text-sm font-medium text-slate-600">Only approved walkers show up here.</p>
        </div>

        <Card className="mb-6 rounded-2xl border-slate-200 bg-white">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, neighborhood, or service…"
                className="rounded-full pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="py-10 text-center text-sm font-medium text-slate-600">Loading walkers…</CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-slate-300 bg-white">
            <CardContent className="py-14 text-center">
              <p className="text-sm font-semibold text-slate-700">No approved walkers match your search.</p>
              <p className="mt-1 text-sm text-slate-600">Try a different name or location.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Card key={p.id} className="rounded-2xl border-slate-200 bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{p.full_name}</CardTitle>
                      <CardDescription className="mt-1">
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-500" />
                          {p.location?.address || '—'}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className="rounded-full bg-emerald-100 text-emerald-900 hover:bg-emerald-100">Approved</Badge>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span className="font-extrabold text-slate-900">{(p.avg_rating || 0).toFixed(1)}</span>
                      <span className="font-medium text-slate-600">({p.review_count || 0})</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-extrabold text-slate-900">R{p.walk_rate ?? p.hourly_rate ?? 0}</span>
                      <span className="font-medium text-slate-600">/hour</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full rounded-full bg-emerald-700 hover:bg-emerald-800"
                        onClick={() => {
                          setSelectedProvider(p);
                          setError('');
                        }}
                        disabled={dogs.length === 0}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        Book
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>Book {p.full_name}</DialogTitle>
                        <DialogDescription>Pick a dog and choose a time.</DialogDescription>
                      </DialogHeader>

                      {dogs.length === 0 ? (
                        <Card className="rounded-2xl border-dashed border-slate-300">
                          <CardContent className="py-10 text-center">
                            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
                              <DogIcon className="h-6 w-6 text-emerald-700" />
                            </div>
                            <p className="text-sm font-semibold text-slate-800">You need a dog profile first.</p>
                            <Button
                              className="mt-4 rounded-full bg-emerald-700 hover:bg-emerald-800"
                              onClick={() => navigate('/my-dogs')}
                            >
                              Add your first dog
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <Label>Dog</Label>
                            <Select value={selectedDogId} onValueChange={setSelectedDogId}>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Choose a dog" />
                              </SelectTrigger>
                              <SelectContent>
                                {dogs.map((d) => (
                                  <SelectItem key={d.id} value={d.id}>
                                    {d.name} ({d.breed})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-2">
                            <Label>Date</Label>
                            <Input
                              type="date"
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="rounded-xl"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Time</Label>
                            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl" />
                          </div>

                          <div className="grid gap-2">
                            <Label>Duration</Label>
                            <Select value={duration} onValueChange={setDuration}>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="60">1 hour</SelectItem>
                                <SelectItem value="90">1.5 hours</SelectItem>
                                <SelectItem value="120">2 hours</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {date && time && (
                            <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                              <p className="text-sm font-semibold text-emerald-900">Estimated total</p>
                              <p className="mt-1 text-2xl font-extrabold tracking-tight text-emerald-900">R{cost.toFixed(2)}</p>
                              <p className="mt-1 text-xs font-semibold text-emerald-900/80">
                                {format(new Date(date), 'PPP')} at {time}
                              </p>
                            </div>
                          )}

                          {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}

                          <div className="rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-slate-700 ring-1 ring-slate-100">
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                              <span className="text-slate-500">client_id:</span>
                              <span className="break-all">{currentUser?.id || '—'}</span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                              <span className="text-slate-500">dog_id:</span>
                              <span className="break-all">{selectedDogId || '—'}</span>
                            </div>
                          </div>

                          <Button
                            onClick={handleBook}
                            className="rounded-xl bg-emerald-700 hover:bg-emerald-800"
                            disabled={!selectedProvider || !selectedDogId || !date || !time}
                          >
                            Confirm booking
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {dogs.length === 0 && (
                    <p className="mt-3 text-xs font-semibold text-slate-600">
                      Add a dog profile to book.
                      <Button variant="link" className="h-auto px-1 text-emerald-800" onClick={() => navigate('/my-dogs')}>
                        Go to My Dogs
                      </Button>
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}