import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { convexServer, api } from "@/lib/convex-server";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;
  const [modules, sources, conversations, deadlines] = await Promise.all([
    convexServer.query(api.modules.getByUserId, { userId }),
    convexServer.query(api.sources.getByUserId, { userId }),
    convexServer.query(api.conversations.getByUserId, { userId }),
    convexServer.query(api.essays.getUpcoming, { userId }),
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
        modules={modules.map((m: any) => ({
          id: m.id as string,
          workspaceId: "",
          title: m.title as string,
          code: m.code as string,
          academicYear: m.academicYear || "",
          semester: m.semester || "",
          description: m.description || "",
          sourceCount: m._sourceCount,
          noteCount: 0,
          essayProjectCount: m._essayCount,
          lastActivityAt: new Date(m._creationTime).toISOString(),
          color: m.colour || "#1e3a5f",
        }))}
        sources={sources.map((s: any) => ({
          id: s.id as string,
          moduleId: s.moduleId as string,
          folderId: s.folderId || "",
          title: s.title as string,
          author: s.authors || "",
          year: s.year || 2026,
          type: s.type as "journal_article",
          status: s.status === "ready" ? "processed" : "processing",
          tags: s.concepts ? s.concepts.split(",").map((c: string) => c.trim()) : [],
          citation: `${s.authors} (${s.year})`,
          pageCount: Math.max(1, Math.ceil((s.wordCount || 0) / 300)),
          uploadedAt: new Date(s._creationTime).toISOString(),
          summary: s.summary || "",
          mainArgument: s.keyArguments || "",
          keyConcepts: s.concepts ? s.concepts.split(",").map((c: string) => c.trim()) : [],
        }))}
        conversations={conversations.map((c) => ({
          id: c.id,
          moduleId: c.moduleId || "",
          title: c.title,
          scope: "whole_module" as const,
          mode: c.mode as "source_grounded",
          messages: [],
          createdAt: new Date(c._creationTime).toISOString(),
        }))}
        deadlines={deadlines.map((d: any) => ({
          id: d.id as string,
          moduleId: d.moduleId as string,
          title: d.title as string,
          question: d.question || "",
          wordCount: d.targetWordCount,
          thesis: d.thesis || "",
          status: d.status as string,
        }))}
      />
    </AppShell>
  );
}
