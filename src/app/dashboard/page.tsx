import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import {
  getUserModules,
  getUserSources,
  getUserConversations,
  getUpcomingDeadlines,
} from "@/lib/services/data-service";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const [modules, sources, conversations, deadlines] = await Promise.all([
    getUserModules(session.user.id),
    getUserSources(session.user.id),
    getUserConversations(session.user.id),
    getUpcomingDeadlines(session.user.id),
  ]);

  return (
    <AppShell user={session.user}>
      <DashboardContent
        user={{
          id: session.user.id,
          name: session.user.name || "Student",
          email: session.user.email || "",
          university: "",
          course: "",
          yearOfStudy: 0,
          createdAt: new Date().toISOString(),
        }}
        modules={modules.map((m) => ({
          id: m.id,
          workspaceId: "",
          title: m.title,
          code: m.code,
          academicYear: m.academicYear,
          semester: m.semester,
          description: m.description,
          sourceCount: m._count.sources,
          noteCount: 0,
          essayProjectCount: m._count.essays,
          lastActivityAt: m.updatedAt.toISOString(),
          color: m.colour,
        }))}
        sources={sources.map((s) => ({
          id: s.id,
          moduleId: s.moduleId,
          folderId: s.folderId || "",
          title: s.title,
          author: s.authors,
          year: s.year,
          type: s.type as "journal_article",
          status: s.status === "ready" ? "processed" : "processing",
          tags: s.concepts ? s.concepts.split(",").map((c) => c.trim()) : [],
          citation: `${s.authors} (${s.year})`,
          pageCount: Math.max(1, Math.ceil((s.wordCount || 0) / 300)),
          uploadedAt: s.createdAt.toISOString(),
          summary: s.summary || "",
          mainArgument: s.keyArguments || "",
          keyConcepts: s.concepts ? s.concepts.split(",").map((c) => c.trim()) : [],
        }))}
        conversations={conversations.map((c) => ({
          id: c.id,
          moduleId: c.moduleId || "",
          title: c.title,
          scope: "whole_module" as const,
          mode: c.mode as "source_grounded",
          messages: [],
          createdAt: c.createdAt.toISOString(),
        }))}
        deadlines={deadlines.map((d) => ({
          id: d.id,
          moduleId: d.moduleId,
          title: d.title,
          question: d.question || "",
          wordCount: d.targetWordCount,
          thesis: d.thesis || "",
          status: d.status,
        }))}
      />
    </AppShell>
  );
}
