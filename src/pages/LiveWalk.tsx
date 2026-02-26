import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import RoleNavbar from '@/components/RoleNavbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Navigation, Satellite } from 'lucide-react';
import { format } from 'date-fns';

type Breadcrumb = {
  id: string;
  walk_session_id: string;
  lat: number;
  lng: number;
  created_at: string;
};

export default function LiveWalk() {
  const { bookingId } = useParams();
  const { currentUser } = useAuth();

  const [latest, setLatest] = useState<Breadcrumb | null>(null);
  const [trail, setTrail] = useState<Breadcrumb[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const isProvider = currentUser?.role === 'provider';
  const isClient = currentUser?.role === 'client';

  const mapSrc = useMemo(() => {
    if (!latest) return null;
    const lat = Number(latest.lat);
    const lng = Number(latest.lng);
    return `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
  }, [latest]);

  useEffect(() => {
    if (!bookingId) return;

    const loadLatest = async () => {
      const { data } = await supabase
        .from('walk_breadcrumbs')
        .select('*')
        .eq('walk_session_id', bookingId)
        .order('created_at', { ascending: false })
        .limit(1);

      const crumb = (data?.[0] || null) as Breadcrumb | null;
      setLatest(crumb);
      setTrail(crumb ? [crumb] : []);
    };

    loadLatest();
  }, [bookingId]);

  // Client: realtime subscription for new breadcrumbs
  useEffect(() => {
    if (!bookingId || !isClient) return;

    const channel = supabase
      .channel(`walk_breadcrumbs:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'walk_breadcrumbs',
          filter: `walk_session_id=eq.${bookingId}`,
        },
        (payload) => {
          const crumb = payload.new as Breadcrumb;
          setLatest(crumb);
          setTrail((prev) => [crumb, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, isClient]);

  // Provider: push location every 10 seconds
  useEffect(() => {
    if (!bookingId || !isProvider || !isSharing) return;

    const pushOnce = async () => {
      if (!('geolocation' in navigator)) return;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          await supabase.from('walk_breadcrumbs').insert({
            walk_session_id: bookingId,
            lat: latitude,
            lng: longitude,
          });
        },
        () => {
          // ignore (permission denied / unavailable)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    pushOnce();

    intervalRef.current = window.setInterval(pushOnce, 10_000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [bookingId, isProvider, isSharing]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar activeKey="bookings" />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Live Walk</h1>
          <p className="mt-1 text-sm font-medium text-slate-600">Real-time location updates.</p>
        </div>

        {!bookingId ? (
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="py-10 text-center text-sm font-medium text-slate-600">Missing booking ID.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Satellite className="h-5 w-5 text-emerald-700" />
                      Map
                    </CardTitle>
                    <CardDescription>
                      {latest ? (
                        <span>
                          Last update {format(new Date(latest.created_at), 'HH:mm:ss')} • Lat {Number(latest.lat).toFixed(5)} / Lng{' '}
                          {Number(latest.lng).toFixed(5)}
                        </span>
                      ) : (
                        'Waiting for the first GPS ping…'
                      )}
                    </CardDescription>
                  </div>
                  <Badge className="rounded-full bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
                    {isClient ? 'Client view' : isProvider ? 'Provider view' : 'Live'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {mapSrc ? (
                  <iframe
                    title="Live map"
                    src={mapSrc}
                    className="h-[360px] w-full border-0 sm:h-[460px]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="grid h-[360px] place-items-center text-sm font-medium text-slate-600 sm:h-[460px]">
                    No location yet.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              {isProvider && (
                <Card className="rounded-2xl border-slate-200 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Navigation className="h-4 w-4 text-emerald-700" />
                      Share location
                    </CardTitle>
                    <CardDescription>Pushes coordinates to the walk every 10 seconds.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => setIsSharing((v) => !v)}
                      className={
                        isSharing
                          ? 'w-full rounded-full bg-rose-600 hover:bg-rose-700'
                          : 'w-full rounded-full bg-emerald-700 hover:bg-emerald-800'
                      }
                    >
                      {isSharing ? 'Stop sharing' : 'Start sharing'}
                    </Button>
                    <p className="text-xs font-semibold text-slate-600">
                      Keep this tab open while walking so clients can follow live.
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-2xl border-slate-200 bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4 text-blue-700" />
                    Recent updates
                  </CardTitle>
                  <CardDescription>Latest 10 breadcrumbs</CardDescription>
                </CardHeader>
                <CardContent>
                  {trail.length === 0 ? (
                    <p className="text-sm font-medium text-slate-600">No breadcrumbs yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {trail.map((c, idx) => (
                        <div key={c.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                          <div className="text-sm">
                            <p className="font-extrabold text-slate-900">{idx === 0 ? 'Latest' : `-${idx}`}</p>
                            <p className="mt-0.5 text-xs font-semibold text-slate-600">
                              {Number(c.lat).toFixed(5)}, {Number(c.lng).toFixed(5)}
                            </p>
                          </div>
                          <p className="text-xs font-semibold text-slate-500">{format(new Date(c.created_at), 'HH:mm:ss')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
