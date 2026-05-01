import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { AssistantContent } from "@/components/assistant/assistant-content";
import { convexServer, api } from "@/lib/convex-server";
import { getProviderStatus } from "@/lib/ai/providers";

export default async function AssistantPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;
  const [modules, sources, conversations] = await Promise.all([
    convexServer.query(api.modules.getByUserId, { userId }),
    convexServer.query(api.sources.getByUserId, { userId }),
    convexServer.query(api.conversations.getByUserId, { userId }),
  ]);

  const providerStatus = getProviderStatus();

  return (
    <AppShell user={session.user}>
      <AssistantContent
        modules={modules.map((m) => ({ id: m.id, title: m.title }))}
        sources={sources.map((s) => ({ id: s.id, title: s.title, moduleId: s.moduleId }))}
        conversations={conversations.map((c: any) => ({
          id: c.id as string,
          title: c.title as string,
          mode: (c.mode as string) || "source_grounded",
          messageCount: c._messageCount as number,
          createdAt: new Date(c._creationTime as number).toISOString(),
        }))}
        aiConfigured={providerStatus.configured}
        providerName={providerStatus.provider}
      />
    </AppShell>
  );
}
