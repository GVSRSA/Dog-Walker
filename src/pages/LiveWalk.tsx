import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RoleNavbar from '@/components/RoleNavbar';
import WalkControls from '@/components/WalkControls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { WalkBreadcrumb, WalkSession } from '@/types';
import { MapPin, Satellite, Users, NotebookText, Droplets, Receipt, Wallet } from 'lucide-react';
import { format } from 'date-fns';

const FALLBACK_CENTER = {
  // Cape Town CBD (hardcoded fallback so the map is never a blank screen)
  lat: -33.9249,
  lng: 18.4241,
};

function parseProfileLocationToLatLng(value?: unknown): { lat: number; lng: number } | null {
  if (!value) return null;

  // Some apps store location as a JSON string. If we can parse lat/lng, use it.
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      const lat = Number((parsed as any)?.lat);
      const lng = Number((parsed as any)?.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    } catch {
      // ignore
    }

    // Simple "lat,lng" string
    const m = value.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }

  return null;
}

function formatZAR(amount: number) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `R${safe.toFixed(2)}`;
}

export default function LiveWalk() {
  const { bookingId } = useParams();
  const sessionId = bookingId;
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [session, setSession] = useState<WalkSession | null>(null);
  const [trail, setTrail] = useState<WalkBreadcrumb[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [pinging, setPinging] = useState(false);

  const [showSummary, setShowSummary] = useState(false);
  const [notes, setNotes] = useState('');
  const [didPee, setDidPee] = useState(false);
  const [didPoop, setDidPoop] = useState(false);
  const [savingSummary, setSavingSummary] = useState(false);

  const [showReceipt, setShowReceipt] = useState(false);
  const [receipt, setReceipt] = useState<{ spent: number; newBalance: number } | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const insertCooldownRef = useRef<number>(0);
  const permissionToastRef = useRef(false);

  const isProvider = currentUser?.role === 'provider';
  const isClient = currentUser?.role === 'client';

  const isCompleted = session?.status === 'completed';

  const [targetDurationMinutes, setTargetDurationMinutes] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const defaultCenter = useMemo(() => {
    // If the profile contains a parsable lat/lng, center there; otherwise fallback to a city center.
    const fromProfile = parseProfileLocationToLatLng((currentUser as any)?.location);
    return fromProfile || FALLBACK_CENTER;
  }, [currentUser]);

  const mapCenter = useMemo(() => {
    const lat = session?.current_lat;
    const lng = session?.current_lng;
    if (lat == null || lng == null) return defaultCenter;

    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return defaultCenter;

    return { lat: parsedLat, lng: parsedLng };
  }, [session?.current_lat, session?.current_lng, defaultCenter]);

  const mapSrc = useMemo(() => {
    return `https://www.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=16&output=embed`;
  }, [mapCenter.lat, mapCenter.lng]);

  const hasGpsFix = useMemo(() => {
    return session?.current_lat != null && session?.current_lng != null;
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

      // Sync UI toggle with session state so refresh/resume shows the correct button.
      setIsSharing((s as any)?.status === 'active');
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

  // Provider: also subscribe to session updates so the UI reflects resumed/in-progress status.
  useEffect(() => {
    if (!sessionId || !isProvider) return;

    const channel = supabase
      .channel(`walk_sessions_provider:${sessionId}`)
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
  }, [sessionId, isProvider]);

  // Keep local isSharing in sync if session status changes (e.g. resumed from another device).
  useEffect(() => {
    if (!isProvider) return;
    setIsSharing(session?.status === 'active');
  }, [session?.status, isProvider]);

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

  // Load expected duration for this session (max booking duration linked to session)
  useEffect(() => {
    if (!sessionId) return;

    const loadDuration = async () => {
      const { data, error } = await supabase.from('bookings').select('duration').eq('walk_session_id', sessionId);

      if (error) {
        console.error('[live-walk] Failed to load booking durations:', error);
        return;
      }

      const minutes = Math.max(
        0,
        ...(data || [])
          .map((r: any) => Number(r?.duration ?? 0))
          .filter((n: number) => Number.isFinite(n) && n > 0)
      );

      setTargetDurationMinutes(minutes > 0 ? minutes : null);
    };

    loadDuration();
  }, [sessionId]);

  // Live timer: initialize from session start + target duration
  useEffect(() => {
    if (!session?.started_at || !targetDurationMinutes) {
      setRemainingSeconds(null);
      return;
    }

    const startedAtMs = new Date(session.started_at).getTime();
    if (Number.isNaN(startedAtMs)) {
      setRemainingSeconds(null);
      return;
    }

    const totalSeconds = Math.round(targetDurationMinutes * 60);

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAtMs) / 1000);
      setRemainingSeconds(Math.max(0, totalSeconds - elapsed));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [session?.started_at, targetDurationMinutes]);

  const timerLabel = useMemo(() => {
    if (!targetDurationMinutes || remainingSeconds == null) return null;
    const mm = Math.floor(remainingSeconds / 60);
    const ss = remainingSeconds % 60;
    return `${mm}:${String(ss).padStart(2, '0')} / ${targetDurationMinutes}m`;
  }, [remainingSeconds, targetDurationMinutes]);

  const pushLocation = async (latitude: number, longitude: number) => {
    if (!sessionId) return;

    // Update the session's current position (for the client to subscribe to)
    const { error: sessionUpdateErr } = await supabase
      .from('walk_sessions')
      .update({ current_lat: latitude, current_lng: longitude })
      .eq('id', sessionId);

    if (sessionUpdateErr) {
      console.error('[live-walk] Failed to update session coords:', sessionUpdateErr);
      throw sessionUpdateErr;
    }

    // Insert breadcrumb (for history / trail)
    const { error: crumbErr } = await supabase.from('walk_breadcrumbs').insert({
      walk_session_id: sessionId,
      lat: latitude,
      lng: longitude,
    });

    if (crumbErr) {
      console.error('[live-walk] Failed to insert breadcrumb:', crumbErr);
      throw crumbErr;
    }

    setSession((prev) => (prev ? { ...prev, current_lat: latitude, current_lng: longitude } : prev));
  };

  const forceGpsPing = async () => {
    if (!sessionId) return;

    setPinging(true);
    try {
      if ('geolocation' in navigator) {
        const coords = await new Promise<{ lat: number; lng: number }>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
          );
        });

        await pushLocation(coords.lat, coords.lng);
        toast({ title: 'GPS ping sent', description: 'Inserted one breadcrumb using your current device location.' });
      } else {
        // No geolocation available: insert a deterministic (but slightly jittered) fallback
        const jitter = () => (Math.random() - 0.5) * 0.002; // ~200m
        await pushLocation(defaultCenter.lat + jitter(), defaultCenter.lng + jitter());
        toast({
          title: 'GPS ping sent (fallback)',
          description: 'Geolocation is unavailable, so we inserted a test coordinate near the default map center.',
        });
      }

      // Refresh the latest crumbs immediately so the UI updates even if realtime is delayed
      const { data: crumbs } = await supabase
        .from('walk_breadcrumbs')
        .select('*')
        .eq('walk_session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(10);
      setTrail(((crumbs as any) || []) as WalkBreadcrumb[]);
    } catch (e: any) {
      console.error('[live-walk] Force GPS ping failed:', e);
      toast({ title: 'Could not send GPS ping', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setPinging(false);
    }
  };

  // Provider: use watchPosition while sharing
  useEffect(() => {
    console.log('[live-walk] watchPosition effect', { sessionId, isProvider, isSharing });

    if (!sessionId || !isProvider || !isSharing) return;

    if (!('geolocation' in navigator)) {
      if (!permissionToastRef.current) {
        permissionToastRef.current = true;
        toast({
          title: 'Geolocation unavailable',
          description: 'This browser/device does not support GPS. Use "Force GPS Ping" for testing.',
          variant: 'destructive',
        });
      }
      return;
    }

    // Allow the very first callback to insert immediately
    insertCooldownRef.current = 0;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Throttle to ~1 update / 5 seconds (watchPosition can be very chatty)
        const t = Date.now();
        if (t - insertCooldownRef.current < 5000) return;
        insertCooldownRef.current = t;

        try {
          await pushLocation(latitude, longitude);
        } catch {
          // pushLocation already logs + throws; ignore to keep watching
        }
      },
      (err) => {
        console.warn('[live-walk] watchPosition error', err);
        if (!permissionToastRef.current) {
          permissionToastRef.current = true;
          toast({
            title: 'GPS permission required',
            description: err?.message || 'Please allow location permissions for this site so clients can follow the live walk.',
            variant: 'destructive',
          });
        }
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

    // Safety check: do nothing if the walk is already marked completed in local state.
    if (session?.status === 'completed') {
      toast({ title: 'Already ended', description: 'This walk has already been completed.' });
      return;
    }

    try {
      setIsSharing(false);

      // Safety check: only the walker can complete a session, and only once.
      const { data: current, error: fetchErr } = await supabase
        .from('walk_sessions')
        .select('status')
        .eq('id', sessionId)
        .single();
      if (fetchErr) throw fetchErr;
      if ((current as any)?.status === 'completed') {
        setSession((prev) => (prev ? { ...prev, status: 'completed' } : prev));
        toast({ title: 'Already ended', description: 'This walk has already been completed.' });
        return;
      }

      // IMPORTANT: mark linked bookings as completed FIRST so the AFTER UPDATE trigger fires.
      const { error: bookingsErr } = await supabase
        .from('bookings')
        .update({ status: 'completed', ended_at: new Date().toISOString() })
        .eq('walk_session_id', sessionId)
        .neq('status', 'completed');
      if (bookingsErr) throw bookingsErr;

      // Then close the session
      const { error: sessionErr } = await supabase
        .from('walk_sessions')
        .update({ status: 'completed', ended_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('status', 'active');
      if (sessionErr) throw sessionErr;

      setSession((prev) => (prev ? { ...prev, status: 'completed', ended_at: new Date().toISOString() } : prev));
      setShowSummary(true);

      toast({ title: 'Walk ended', description: 'All linked bookings were marked completed. Add a quick summary for owners.' });
    } catch (e: any) {
      toast({ title: 'Could not end walk', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const showClientReceipt = async () => {
    if (!sessionId || !isClient) return;

    try {
      const [{ data: bookings, error: bookingErr }, { data: myProfile, error: profileErr }] = await Promise.all([
        supabase.from('bookings').select('total_fee').eq('walk_session_id', sessionId),
        supabase.from('profiles').select('credit_balance').eq('id', currentUser?.id).single(),
      ]);

      if (bookingErr) throw bookingErr;
      if (profileErr) throw profileErr;

      const spent = (bookings || []).reduce((sum, b: any) => sum + Number(b?.total_fee ?? 0), 0);
      const newBalance = Number((myProfile as any)?.credit_balance ?? 0);

      setReceipt({ spent, newBalance });
      setShowReceipt(true);
    } catch (e: any) {
      toast({
        title: 'Could not load receipt',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
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

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="overflow-hidden rounded-3xl border-slate-200 p-0">
          <div className="bg-violet-700 px-6 py-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-white">
                <Receipt className="h-4 w-4" />
                Walk Receipt
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="space-y-4 p-6">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="text-sm font-semibold text-slate-700">Summary</p>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                You spent {formatZAR(receipt?.spent ?? 0)}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Your new balance is <span className="text-slate-900">{formatZAR(receipt?.newBalance ?? 0)}</span>
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-slate-100">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-700" />
                <span className="text-sm font-semibold text-slate-700">Balance</span>
              </div>
              <span className="text-sm font-extrabold text-slate-900">{formatZAR(receipt?.newBalance ?? 0)}</span>
            </div>
            <Button onClick={() => setShowReceipt(false)} className="w-full rounded-full bg-slate-900 hover:bg-slate-800">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Live Walk</h1>
              <p className="mt-1 text-sm font-medium text-slate-600">Real-time pack location updates.</p>
            </div>
            {timerLabel && (
              <Badge className="rounded-full bg-violet-100 text-violet-900 hover:bg-violet-100">Live Timer: {timerLabel}</Badge>
            )}
          </div>
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
                      {hasGpsFix ? (
                        <span>
                          Last known • Lat {Number(session?.current_lat).toFixed(5)} / Lng {Number(session?.current_lng).toFixed(5)}
                        </span>
                      ) : (
                        <span>Waiting for GPS ping… Showing a default map center so the screen isn't blank.</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-full bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
                      {isClient ? 'Client view' : isProvider ? 'Provider view' : 'Live'}
                    </Badge>
                    <Badge className="rounded-full bg-slate-100 text-slate-900 hover:bg-slate-100">{hasGpsFix ? 'GPS: live' : 'GPS: pending'}</Badge>
                    {session?.status && (
                      <Badge className="rounded-full bg-slate-100 text-slate-900 hover:bg-slate-100">{session.status}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <iframe
                  title="Live map"
                  src={mapSrc}
                  className="h-[360px] w-full border-0 sm:h-[460px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </CardContent>
            </Card>

            <div className="space-y-6">
              {isProvider && !showSummary && (
                <WalkControls
                  mode={session?.status === 'active' ? 'end' : 'start'}
                  disabled={isCompleted}
                  pinging={pinging}
                  onPrimary={async () => {
                    if (isCompleted) return;

                    if (session?.status === 'active') {
                      await endWalk();
                      return;
                    }

                    // Flip sharing on and immediately request location once to trigger browser permissions.
                    permissionToastRef.current = false;
                    setIsSharing(true);
                    await forceGpsPing();
                  }}
                  onForcePing={forceGpsPing}
                />
              )}

              {isClient && isCompleted && (
                <Card className="rounded-2xl border-slate-200 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Receipt className="h-4 w-4 text-violet-700" />
                      Receipt
                    </CardTitle>
                    <CardDescription>See what you were charged after the walk ends.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={showClientReceipt} className="w-full rounded-full bg-violet-700 hover:bg-violet-800">
                      View receipt
                    </Button>
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
                      <Button onClick={saveSummary} disabled={savingSummary} className="flex-1 rounded-full bg-violet-700 hover:bg-violet-800">
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
                    <MapPin className="h-4 w-4 text-emerald-700" />
                    Recent pings
                  </CardTitle>
                  <CardDescription>Latest GPS pings inserted for this session.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trail.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600 ring-1 ring-slate-100">
                      No breadcrumbs yet. Use Force GPS Ping to insert one.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {trail.map((crumb) => (
                        <div key={crumb.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {Number(crumb.lat).toFixed(5)}, {Number(crumb.lng).toFixed(5)}
                            </p>
                            <p className="text-xs font-semibold text-slate-600">{format(new Date(crumb.created_at), 'PPpp')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isClient && (
                    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                      <p className="text-sm font-semibold text-slate-700">What you're seeing</p>
                      <p className="mt-1 text-sm text-slate-600">
                        The walker's device sends GPS pings every few seconds. You'll see the latest trail here and the map will follow the most recent location.
                      </p>
                    </div>
                  )}

                  {!isClient && (
                    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                      <p className="text-sm font-semibold text-slate-700">Tip</p>
                      <p className="mt-1 text-sm text-slate-600">
                        If GPS permissions are blocked, click Force GPS Ping to test inserts into <span className="font-semibold">walk_breadcrumbs</span> for this session.
                      </p>
                    </div>
                  )}

                  <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-700" />
                      <p className="text-sm font-bold text-emerald-900">Session ID</p>
                    </div>
                    <p className="mt-1 break-all text-xs font-semibold text-emerald-900/80">{sessionId}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}