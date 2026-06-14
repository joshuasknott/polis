import { AppShell } from "@/components/layout/shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function TimelineLoading() {
  return (
    <AppShell>
      <div className="max-w-4xl space-y-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <Skeleton className="h-7 w-12 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <Skeleton className="h-5 w-2/3 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
