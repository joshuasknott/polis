"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface EssayRedirectDataProps {
  essayId: string;
}

export function EssayRedirectData({ essayId }: EssayRedirectDataProps) {
  const router = useRouter();
  const assignment = useQuery(api.assignments.get, {
    assignmentId: essayId as Id<"assignments">,
  });

  useEffect(() => {
    if (assignment === undefined) return;

    if (assignment === null) {
      router.replace("/dashboard");
      return;
    }

    router.replace(`/modules/${assignment.moduleId}/assignments/${assignment._id}`);
  }, [assignment, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm">Opening assignment workspace…</p>
    </div>
  );
}
