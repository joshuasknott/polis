"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SourceLibraryContent } from "./source-library-content";
import { mapSource } from "@/lib/convex-ui-mappers";
import { Loader2 } from "lucide-react";

export function SourceLibraryData() {
  const sources = useQuery(api.sources.list, {});
  const modules = useQuery(api.modules.list);

  if (sources === undefined || modules === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Loading source library…</p>
      </div>
    );
  }

  const moduleMap = new Map(modules.map((m) => [m._id, m.title]));

  const mappedSources = sources.map((s) => ({
    ...mapSource(s),
    moduleName: moduleMap.get(s.moduleId) ?? "Unknown module",
    uploadedAt: new Date(s.createdAt).toISOString(),
    mainArgument: "",
    keyConcepts: [] as string[],
  }));
  const mappedModules = modules.map((m) => ({
    id: m._id,
    title: m.title,
    code: m.code,
  }));

  return <SourceLibraryContent sources={mappedSources} modules={mappedModules} />;
}
