import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { AssistantContent } from "@/components/assistant/assistant-content";
import { getUserModules, getUserSources, getUserConversations } from "@/lib/services/data-service";
import { getProviderStatus } from "@/lib/ai/providers";

export default async function AssistantPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const [modules, sources, conversations] = await Promise.all([
    getUserModules(session.user.id),
    getUserSources(session.user.id),
    getUserConversations(session.user.id),
  ]);

  const providerStatus = getProviderStatus();

  return (
    <AppShell user={session.user}>
      <AssistantContent
        modules={modules.map((m) => ({ id: m.id, title: m.title }))}
        sources={sources.map((s) => ({ id: s.id, title: s.title, moduleId: s.moduleId }))}
        conversations={conversations.map((c) => ({
          id: c.id,
          title: c.title,
          mode: c.mode,
          messageCount: c._count.messages,
          createdAt: c.createdAt.toISOString(),
        }))}
        aiConfigured={providerStatus.configured}
        providerName={providerStatus.provider}
      />
    </AppShell>
  );
}
