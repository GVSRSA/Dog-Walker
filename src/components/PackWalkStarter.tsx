import { useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Booking } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarDays, Users, Zap } from 'lucide-react';

function isToday(value?: string | null) {
  if (!value) return false;
  const today = new Date();

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map((x) => Number(x));
    return today.getFullYear() === y && today.getMonth() + 1 === m && today.getDate() === d;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return (
    parsed.getFullYear() === today.getFullYear() &&
    parsed.getMonth() === today.getMonth() &&
    parsed.getDate() === today.getDate()
  );
}

export default function PackWalkStarter({ providerId, bookings, onCreated }: {
  providerId: string;
  bookings: Booking[];
  onCreated: () => Promise<void> | void;
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);

  const todaysConfirmed = useMemo(() => {
    return bookings
      .filter((b) => b.provider_id === providerId)
      .filter((b) => b.status === 'confirmed')
      .filter((b) => isToday(b.scheduled_date));
  }, [bookings, providerId]);

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([id]) => id), [selected]);

  const allSelected = todaysConfirmed.length > 0 && selectedIds.length === todaysConfirmed.length;

  const toggleAll = (next: boolean) => {
    const map: Record<string, boolean> = {};
    todaysConfirmed.forEach((b) => (map[b.id] = next));
    setSelected(map);
  };

  const toggleOne = (id: string, next: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: next }));
  };

  const createPackWalk = async () => {
    if (selectedIds.length === 0) return;

    setCreating(true);
    try {
      // Create a single walk session
      const { data: session, error: sessionError } = await supabase
        .from('walk_sessions')
        .insert({
          walker_id: providerId,
          status: 'active',
        })
        .select('id')
        .single();

      if (sessionError) throw sessionError;

      const sessionId = session.id as string;

      // Attach selected bookings to that session + flip to in_progress
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'in_progress', walk_session_id: sessionId })
        .in('id', selectedIds);

      if (updateError) throw updateError;

      toast({
        title: 'Pack walk started',
        description: `Created session ${sessionId.slice(0, 8)}… and started ${selectedIds.length} booking(s).`,
      });

      setSelected({});
      await onCreated();
    } catch (e: any) {
      toast({
        title: 'Could not start pack walk',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="rounded-3xl border-slate-200 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-violet-700" />
              Pack Walk
            </CardTitle>
            <CardDescription>Select today's confirmed bookings to start one shared session.</CardDescription>
          </div>
          <Badge className="rounded-full bg-violet-100 text-violet-900 hover:bg-violet-100">{todaysConfirmed.length} today</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {todaysConfirmed.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <p className="text-sm font-semibold text-slate-800">No confirmed bookings for today.</p>
            <p className="mt-1 text-sm text-slate-600">When you have confirmed walks scheduled for today, they'll appear here for selection.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
              <div className="flex items-center gap-3">
                <Checkbox checked={allSelected} onCheckedChange={(v) => toggleAll(Boolean(v))} />
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Select all</p>
                  <p className="text-xs font-semibold text-slate-600">Only confirmed bookings scheduled for today</p>
                </div>
              </div>
              <div className="text-xs font-semibold text-slate-600">Selected: {selectedIds.length}</div>
            </div>

            <div className="space-y-3">
              {todaysConfirmed.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={Boolean(selected[b.id])}
                      onCheckedChange={(v) => toggleOne(b.id, Boolean(v))}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-extrabold text-slate-900">Booking {b.id.slice(0, 8)}…</p>
                        <Badge className="rounded-full bg-emerald-100 text-emerald-900 hover:bg-emerald-100">Confirmed</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                          {b.scheduled_at ? format(new Date(b.scheduled_at), 'PPP p') : b.scheduled_date}
                        </span>
                        <span>Client {b.client_id?.slice(0, 8)}…</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">R{Number(b.total_fee || 0).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <Separator className="bg-slate-200" />

            <Button
              onClick={createPackWalk}
              disabled={creating || selectedIds.length === 0}
              className="w-full rounded-full bg-violet-700 hover:bg-violet-800"
            >
              <Zap className="mr-2 h-4 w-4" />
              Start Pack Walk with Selected
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}