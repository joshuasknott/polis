"use client";

import { Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AssistantContent } from "./assistant-content";

export function AssistantData() {
  const modules = useQuery(api.modules.list);
  const sources = useQuery(api.sources.list, {});
  const sessions = useQuery(api.cothinker.listSessions, {});

  if (modules === undefined || sources === undefined || sessions === undefined) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Loading CoThinker context…</p>
      </div>
    );
  }

  return (
    <AssistantContent
      modules={modules.map((moduleItem) => ({
        id: moduleItem._id,
        title: moduleItem.title,
      }))}
      sources={sources.map((source) => ({
        id: source._id,
        title: source.title,
        moduleId: source.moduleId,
      }))}
      conversations={sessions.map((session) => ({
        id: session._id,
        title: session.title,
        mode: session.stage ?? session.scope,
        messageCount: 0,
        createdAt: new Date(session.createdAt).toISOString(),
      }))}
      aiConfigured={false}
      providerName="Runtime AI paused"
    />
  );
}
