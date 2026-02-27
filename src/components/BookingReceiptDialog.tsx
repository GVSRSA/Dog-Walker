import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Receipt, Star } from 'lucide-react';

import type { Booking, Dog, Profile } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

function formatZAR(value: number) {
  return `R${value.toFixed(2)}`;
}

export default function BookingReceiptDialog({
  booking,
  provider,
  dog,
}: {
  booking: Booking;
  provider?: Profile | null;
  dog?: Dog | null;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(booking.rating ?? 0);
  const [savingRating, setSavingRating] = useState(false);

  const dateLabel = useMemo(() => {
    const raw = booking.ended_at || booking.scheduled_at || booking.scheduled_date;
    if (!raw) return '—';
    try {
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? String(raw) : format(d, 'PPP');
    } catch {
      return String(raw);
    }
  }, [booking.ended_at, booking.scheduled_at, booking.scheduled_date]);

  const spent = Number(booking.total_fee ?? 0);
  const platformFee = Number(booking.platform_fee ?? 0);
  const providerPayout = Number(booking.provider_payout ?? 0);

  const notes = (booking.walk_notes || '').trim();
  const didPee = Boolean(booking.did_pee);
  const didPoop = Boolean(booking.did_poop);

  const canRate = booking.status === 'completed' && Boolean(booking.provider_id);

  async function submitRating() {
    if (!canRate || rating < 1 || rating > 5) return;
    setSavingRating(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ rating })
        .eq('id', booking.id);

      if (error) {
        toast({
          title: 'Could not submit rating',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Rating saved',
        description: `Thanks — you rated ${provider?.full_name || 'your walker'} ${rating}/5.`,
      });
      setOpen(false);
    } finally {
      setSavingRating(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setRating(booking.rating ?? 0);
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
        >
          <Receipt className="mr-2 h-4 w-4 text-violet-700" />
          Receipt
        </Button>
      </DialogTrigger>

      <DialogContent className="overflow-hidden rounded-3xl border-slate-200 p-0">
        <div className="bg-violet-700 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-white">
              <Receipt className="h-4 w-4" />
              Walk receipt
            </DialogTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-violet-50/90">
              <span className="rounded-full bg-white/10 px-3 py-1">{provider?.full_name || 'Walker'}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">{dog?.name || 'Dog'}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">{dateLabel}</span>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-4 p-6">
          <Card className="rounded-2xl border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Total</p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{formatZAR(spent)}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-100">
                <span className="text-xs font-bold text-slate-600">Platform fee</span>
                <span className="text-sm font-extrabold text-slate-900">{formatZAR(platformFee)}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-100">
                <span className="text-xs font-bold text-slate-600">Provider payout</span>
                <span className="text-sm font-extrabold text-slate-900">{formatZAR(providerPayout)}</span>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
            <p className="text-sm font-extrabold text-slate-900">Walk report</p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Badge
                className={`rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${
                  didPee ? 'bg-sky-50 text-sky-900 ring-sky-100' : 'bg-slate-50 text-slate-600 ring-slate-100'
                }`}
              >
                💧 {didPee ? 'Pee' : 'No pee'}
              </Badge>
              <Badge
                className={`rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${
                  didPoop
                    ? 'bg-amber-50 text-amber-900 ring-amber-100'
                    : 'bg-slate-50 text-slate-600 ring-slate-100'
                }`}
              >
                💩 {didPoop ? 'Poop' : 'No poop'}
              </Badge>
            </div>
          </div>

          <Card className="rounded-2xl border-slate-200 bg-white p-4">
            <p className="text-sm font-extrabold text-slate-900">Notes from your walker</p>
            <p className={`mt-2 text-sm font-medium ${notes ? 'text-slate-700' : 'text-slate-500'}`}>
              {notes || 'No notes were added for this walk.'}
            </p>
          </Card>

          {canRate && (
            <Card className="rounded-2xl border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Rate your walker</p>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    Tap a star, then submit to update this booking.
                  </p>
                </div>
                <div className="rounded-full bg-violet-50 px-3 py-1 text-xs font-extrabold text-violet-800 ring-1 ring-violet-100">
                  {booking.rating ? `Saved: ${booking.rating}/5` : 'Not rated yet'}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="rounded-xl p-1 transition-transform hover:scale-110 focus:outline-none"
                    aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                >
                  Not now
                </Button>
                <Button
                  type="button"
                  onClick={submitRating}
                  disabled={savingRating || rating < 1 || rating > 5}
                  className="flex-1 rounded-full bg-violet-700 hover:bg-violet-800"
                >
                  {savingRating ? 'Submitting…' : 'Submit rating'}
                </Button>
              </div>
            </Card>
          )}

          <Separator />
          <Button onClick={() => setOpen(false)} className="w-full rounded-full bg-slate-900 hover:bg-slate-800">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}