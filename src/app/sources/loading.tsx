import { AppShell } from "@/components/layout/shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function SourcesLoading() {
  return (
    <AppShell>
      <div className="max-w-6xl space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6 h-48 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div>
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-12 rounded-md" />
                  <Skeleton className="h-5 w-12 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
