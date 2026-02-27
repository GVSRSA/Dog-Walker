import { Navigation, Square, Crosshair } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type WalkControlsMode = 'start' | 'end';

export default function WalkControls({
  mode,
  disabled,
  pinging,
  onPrimary,
  onForcePing,
}: {
  mode: WalkControlsMode;
  disabled: boolean;
  pinging: boolean;
  onPrimary: () => void | Promise<void>;
  onForcePing: () => void | Promise<void>;
}) {
  const isEnding = mode === 'end';

  return (
    <Card className="rounded-2xl border-slate-200 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Navigation className="h-4 w-4 text-emerald-700" />
          Walk controls
        </CardTitle>
        <CardDescription>
          {disabled
            ? 'This walk is completed.'
            : isEnding
              ? 'Walk is in progress. End it when you’re done so clients are charged and you can send a summary.'
              : 'Tap Start to begin sharing location. For testing, Force GPS Ping inserts one breadcrumb immediately.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={onPrimary}
          disabled={disabled}
          className={
            isEnding
              ? 'w-full rounded-full bg-rose-600 hover:bg-rose-700'
              : 'w-full rounded-full bg-emerald-700 hover:bg-emerald-800'
          }
        >
          {isEnding ? (
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

        <Button
          variant="outline"
          onClick={onForcePing}
          disabled={pinging || disabled}
          className="w-full rounded-full border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
        >
          <Crosshair className="mr-2 h-4 w-4" />
          {pinging ? 'Pinging…' : 'Force GPS Ping'}
        </Button>

        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
          <p className="text-xs font-semibold text-slate-700">Keep this tab open while walking so clients can follow the pack in real time.</p>
        </div>
      </CardContent>
    </Card>
  );
}
