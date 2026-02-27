import { Loader2 } from "lucide-react";

export default function FullScreenAuthLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-card ring-1 ring-border shadow-sm">
          <Loader2 className="h-7 w-7 text-primary animate-spin" aria-hidden="true" />
        </div>
        <div className="text-sm font-medium text-muted-foreground">Loading…</div>
      </div>
    </div>
  );
}
