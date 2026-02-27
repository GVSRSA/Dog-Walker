import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Receipt } from 'lucide-react';

import type { Booking, Dog, Profile } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

          <Separator />
          <Button onClick={() => setOpen(false)} className="w-full rounded-full bg-slate-900 hover:bg-slate-800">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
