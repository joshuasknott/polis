"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { DashboardContent } from "./dashboard-content";
import { mapModule } from "@/lib/convex-ui-mappers";
import { Loader2 } from "lucide-react";

export function DashboardData() {
  const { isLoaded, isSignedIn } = useAuth();
  const result = useQuery(
    api.modules.listWithCounts,
    isLoaded && isSignedIn ? {} : "skip",
  );

  if (result === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Loading workspaces…</p>
      </div>
    );
  }

  if (result.length === 0) {
    return (
      <DashboardContent modules={[]} />
    );
  }

  const modules = result.map((mod) =>
    mapModule(mod as typeof mod & { sourceCount: number; assignmentCount: number }),
  );

  return <DashboardContent modules={modules} />;
}
