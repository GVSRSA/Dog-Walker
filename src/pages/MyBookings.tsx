import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import RoleNavbar from '@/components/RoleNavbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Booking, Profile, Dog } from '@/types';
import { CalendarDays, MapPin, PawPrint } from 'lucide-react';
import { format } from 'date-fns';

export default function MyBookings() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [providers, setProviders] = useState<Record<string, Profile>>({});
  const [dogs, setDogs] = useState<Record<string, Dog>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.id) return;
      setLoading(true);

      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', currentUser.id)
        .order('scheduled_at', { ascending: true, nullsFirst: false });

      const b = (bookingsData || []) as Booking[];
      setBookings(b);

      const providerIds = Array.from(new Set(b.map((x) => x.provider_id).filter(Boolean))) as string[];
      const dogIds = Array.from(new Set(b.map((x) => x.dog_id).filter(Boolean))) as string[];

      if (providerIds.length) {
        const { data: pData } = await supabase.from('profiles').select('*').in('id', providerIds);
        const map: Record<string, Profile> = {};
        (pData || []).forEach((p: any) => (map[p.id] = p as Profile));
        setProviders(map);
      } else {
        setProviders({});
      }

      if (dogIds.length) {
        const { data: dData } = await supabase.from('dogs').select('*').in('id', dogIds);
        const map: Record<string, Dog> = {};
        (dData || []).forEach((d: any) => (map[d.id] = d as Dog));
        setDogs(map);
      } else {
        setDogs({});
      }

      setLoading(false);
    };

    fetchData();
  }, [currentUser?.id]);

  const active = useMemo(() => bookings.filter((b) => b.status === 'active'), [bookings]);
  const upcoming = useMemo(() => bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed'), [bookings]);
  const completed = useMemo(() => bookings.filter((b) => b.status === 'completed'), [bookings]);

  const Empty = () => (
    <Card className="rounded-2xl border-dashed border-slate-300 bg-white">
      <CardContent className="py-14">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 ring-1 ring-blue-100">
            <CalendarDays className="h-7 w-7 text-blue-700" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">No bookings yet</h2>
          <p className="mt-2 text-sm font-medium text-slate-600">Book an approved walker and track the walk live.</p>
          <Button asChild className="mt-6 rounded-full bg-blue-700 hover:bg-blue-800">
            <Link to="/book">Find walkers</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const BookingRow = ({ booking }: { booking: Booking }) => {
    const provider = booking.provider_id ? providers[booking.provider_id] : undefined;
    const dog = booking.dog_id ? dogs[booking.dog_id] : undefined;

    const scheduled = booking.scheduled_at ? new Date(booking.scheduled_at) : null;

    const statusTone =
      booking.status === 'active'
        ? 'bg-emerald-100 text-emerald-900'
        : booking.status === 'confirmed'
          ? 'bg-blue-100 text-blue-900'
          : booking.status === 'pending'
            ? 'bg-amber-100 text-amber-900'
            : booking.status === 'completed'
              ? 'bg-slate-100 text-slate-900'
              : 'bg-rose-100 text-rose-900';

    return (
      <Card className="rounded-2xl border-slate-200 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">{provider?.full_name || 'Walker'}</CardTitle>
              <CardDescription className="mt-1">
                {dog ? (
                  <span className="inline-flex items-center gap-2">
                    <PawPrint className="h-4 w-4 text-slate-500" />
                    {dog.name}
                  </span>
                ) : (
                  '—'
                )}
              </CardDescription>
            </div>
            <Badge className={`rounded-full ${statusTone} hover:${statusTone}`}>{booking.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-500" />
              <span className="font-semibold text-slate-700">When:</span>
              <span>{scheduled ? format(scheduled, 'PPP p') : '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-500" />
              <span className="font-semibold text-slate-700">Total:</span>
              <span>R{Number(booking.total_fee || 0).toFixed(2)}</span>
            </div>
          </div>

          {booking.status === 'active' && booking.id && (
            <Button asChild className="w-full rounded-full bg-emerald-700 hover:bg-emerald-800">
              <Link to={`/live-walk/${booking.id}`}>View live map</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar activeKey="bookings" />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">My Bookings</h1>
            <p className="mt-1 text-sm font-medium text-slate-600">Track upcoming and active walks.</p>
          </div>
          <Button asChild className="rounded-full bg-blue-700 hover:bg-blue-800">
            <Link to="/book">New booking</Link>
          </Button>
        </div>

        {loading ? (
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="py-10 text-center text-sm font-medium text-slate-600">Loading bookings…</CardContent>
          </Card>
        ) : bookings.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-8">
            {active.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-emerald-900">Active</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {active.map((b) => (
                    <BookingRow key={b.id} booking={b} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-blue-900">Upcoming</h2>
              {upcoming.length === 0 ? (
                <Card className="rounded-2xl border-slate-200 bg-white">
                  <CardContent className="py-8 text-center text-sm font-medium text-slate-600">No upcoming bookings.</CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((b) => (
                    <BookingRow key={b.id} booking={b} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-slate-900">Completed</h2>
              {completed.length === 0 ? (
                <Card className="rounded-2xl border-slate-200 bg-white">
                  <CardContent className="py-8 text-center text-sm font-medium text-slate-600">No completed walks yet.</CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {completed.map((b) => (
                    <BookingRow key={b.id} booking={b} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
