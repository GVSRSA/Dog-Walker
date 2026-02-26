import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RoleNavbar from '@/components/RoleNavbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { WalkBreadcrumb, WalkSession } from '@/types';
import { MapPin, Navigation, Satellite, Square, Users, NotebookText, Droplets } from 'lucide-react';
import { format } from 'date-fns';

export default function LiveWalk() {
  const { bookingId } = useParams();
  const sessionId = bookingId;
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [session, setSession] = useState<WalkSession | null>(null);
  const [trail, setTrail] = useState<WalkBreadcrumb[]>([]);
  const [isSharing, setIsSharing] = useState(false);

  const [showSummary, setShowSummary] = useState(false);
  const [notes, setNotes] = useState('');
  const [didPee, setDidPee] = useState(false);
  const [didPoop, setDidPoop] = useState(false);
  const [savingSummary, setSavingSummary] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const insertCooldownRef = useRef<number>(0);

  const isProvider = currentUser?.role === 'provider';
  const isClient = currentUser?.role === 'client';

  const isCompleted = session?.status === 'completed';

  const mapSrc = useMemo(() => {
    if (!session?.current_lat || !session?.current_lng) return null;
    const lat = Number(session.current_lat);
    const lng = Number(session.current_lng);
    return `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
  }, [session?.current_lat, session?.current_lng]);

  // Initial load: session + latest breadcrumbs
  useEffect(() => {
    if (!sessionId) return;

    const load = async () => {
      const [{ data: s, error: sErr }, { data: crumbs, error: cErr }] = await Promise.all([
        supabase.from('walk_sessions').select('*').eq('id', sessionId).single(),
        supabase
          .from('walk_breadcrumbs')
          .select('*')
          .eq('walk_session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (sErr) {
        console.error('[live-walk] Failed to load session:', sErr);
      }
      if (cErr) {
        console.error('[live-walk] Failed to load breadcrumbs:', cErr);
      }

      setSession((s as any) || null);
      setTrail(((crumbs as any) || []) as WalkBreadcrumb[]);
    };

    load();
  }, [sessionId]);

  // Client: subscribe to session updates (to follow the pack in real-time)
  useEffect(() => {
    if (!sessionId || !isClient) return;

    const channel = supabase
      .channel(`walk_sessions:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'walk_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          setSession(payload.new as WalkSession);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, isClient]);

  // Client: also subscribe to breadcrumbs so the recent list updates
  useEffect(() => {
    if (!sessionId || !isClient) return;

    const channel = supabase
      .channel(`walk_breadcrumbs:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'walk_breadcrumbs',
          filter: `walk_session_id=eq.${sessionId}`,
        },
        (payload) => {
          const crumb = payload.new as WalkBreadcrumb;
          setTrail((prev) => [crumb, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, isClient]);

  const pushLocation = async (latitude: number, longitude: number) => {
    if (!sessionId) return;

    // Update the session's current position (for the client to subscribe to)
    await supabase
      .from('walk_sessions')
      .update({ current_lat: latitude, current_lng: longitude })
      .eq('id', sessionId);

    // Insert breadcrumb (for history / trail)
    await supabase.from('walk_breadcrumbs').insert({
      walk_session_id: sessionId,
      lat: latitude,
      lng: longitude,
    });
  };

  // Provider: use watchPosition while sharing
  useEffect(() => {
    if (!sessionId || !isProvider || !isSharing) return;
    if (!('geolocation' in navigator)) return;

    const now = Date.now();
    insertCooldownRef.current = now;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Throttle to ~1 update / 5 seconds (watchPosition can be very chatty)
        const t = Date.now();
        if (t - insertCooldownRef.current < 5000) return;
        insertCooldownRef.current = t;

        await pushLocation(latitude, longitude);
        setSession((prev) => (prev ? { ...prev, current_lat: latitude, current_lng: longitude } : prev));
      },
      () => {
        // ignore (permission denied / unavailable)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [sessionId, isProvider, isSharing]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  const endWalk = async () => {
    if (!sessionId) return;

    try {
      setIsSharing(false);

      const { error: sessionErr } = await supabase
        .from('walk_sessions')
        .update({ status: 'completed', ended_at: new Date().toISOString() })
        .eq('id', sessionId);
      if (sessionErr) throw sessionErr;

      const { error: bookingsErr } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('walk_session_id', sessionId);
      if (bookingsErr) throw bookingsErr;

      setSession((prev) => (prev ? { ...prev, status: 'completed', ended_at: new Date().toISOString() } : prev));
      setShowSummary(true);

      toast({ title: 'Walk ended', description: 'All linked bookings were marked completed. Add a quick summary for owners.' });
    } catch (e: any) {
      toast({ title: 'Could not end walk', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const saveSummary = async () => {
    if (!sessionId) return;

    setSavingSummary(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          walk_notes: notes.trim() || null,
          did_pee: didPee,
          did_poop: didPoop,
        })
        .eq('walk_session_id', sessionId);

      if (error) throw error;

      toast({ title: 'Summary sent', description: 'Owners can now see notes + potty updates in their Past Walks.' });
      navigate('/provider', { replace: true });
    } catch (e: any) {
      toast({ title: 'Could not save summary', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSavingSummary(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNavbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Live Walk</h1>
          <p className="mt-1 text-sm font-medium text-slate-600">Real-time pack location updates.</p>
        </div>

        {!sessionId ? (
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="py-10 text-center text-sm font-medium text-slate-600">Missing session ID.</CardContent>
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
                      {session?.current_lat && session?.current_lng ? (
                        <span>
                          Last known • Lat {Number(session.current_lat).toFixed(5)} / Lng {Number(session.current_lng).toFixed(5)}
                        </span>
                      ) : (
                        'Waiting for the first GPS ping…'
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-full bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
                      {isClient ? 'Client view' : isProvider ? 'Provider view' : 'Live'}
                    </Badge>
                    {session?.status && (
                      <Badge className="rounded-full bg-slate-100 text-slate-900 hover:bg-slate-100">{session.status}</Badge>
                    )}
                  </div>
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
                  <div className="grid h-[360px] place-items-center text-sm font-medium text-slate-600 sm:h-[460px]">No location yet.</div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              {isProvider && !showSummary && (
                <Card className="rounded-2xl border-slate-200 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Navigation className="h-4 w-4 text-emerald-700" />
                      Walk controls
                    </CardTitle>
                    <CardDescription>
                      {isCompleted
                        ? 'This walk is completed.'
                        : 'Tap Start to begin sharing location. When you\'re done, End Walk to close the session.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => {
                        if (isCompleted) return;
                        if (isSharing) {
                          void endWalk();
                        } else {
                          setIsSharing(true);
                        }
                      }}
                      disabled={isCompleted}
                      className={
                        isSharing
                          ? 'w-full rounded-full bg-rose-600 hover:bg-rose-700'
                          : 'w-full rounded-full bg-emerald-700 hover:bg-emerald-800'
                      }
                    >
                      {isSharing ? (
                        <>
                          <Square className="mr-2 h-4 w-4" />
                          End Walk
                        </>
                      ) : (
                        <>
                          <Navigation className="mr-2 h-4 w-4" />
                          Start Walk
                        </>
                      )}
                    </Button>

                    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                      <p className="text-xs font-semibold text-slate-700">
                        Keep this tab open while walking so clients can follow the pack in real time.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isProvider && showSummary && (
                <Card className="rounded-2xl border-slate-200 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <NotebookText className="h-4 w-4 text-violet-700" />
                      Walk Summary
                    </CardTitle>
                    <CardDescription>Send a quick update to the owners for all dogs in this session.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="walk-notes">Notes for the Owners</Label>
                      <Textarea
                        id="walk-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g., Great walk today! We practiced loose-leash walking and had lots of sniff time."
                        className="min-h-[110px] rounded-2xl"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <Checkbox checked={didPee} onCheckedChange={(v) => setDidPee(Boolean(v))} />
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <Droplets className="h-4 w-4 text-blue-700" />
                          Pee
                        </span>
                      </label>
                      <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <Checkbox checked={didPoop} onCheckedChange={(v) => setDidPoop(Boolean(v))} />
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <Droplets className="h-4 w-4 text-amber-700" />
                          Poop
                        </span>
                      </label>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        onClick={saveSummary}
                        disabled={savingSummary}
                        className="flex-1 rounded-full bg-violet-700 hover:bg-violet-800"
                      >
                        {savingSummary ? 'Saving…' : 'Send Summary'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate('/provider', { replace: true })}
                        className="flex-1 rounded-full border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                      >
                        Skip
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-2xl border-slate-200 bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-violet-700" />
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

              <Card className="rounded-2xl border-slate-200 bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4 text-blue-700" />
                    Session
                  </CardTitle>
                  <CardDescription>Session ID {sessionId.slice(0, 8)}…</CardDescription>
                </CardHeader>
                <CardContent className="text-sm font-medium text-slate-700">
                  {session?.started_at ? (
                    <p>
                      Started {format(new Date(session.started_at), 'PPP p')}
                      {session.ended_at ? ` • Ended ${format(new Date(session.ended_at), 'PPP p')}` : ''}
                    </p>
                  ) : (
                    <p>—</p>
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