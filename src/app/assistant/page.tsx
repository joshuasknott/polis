import { AppShell } from "@/components/layout/shell";
import { AssistantContent } from "@/components/assistant/assistant-content";
import { mockConversations, mockModules, mockSources } from "@/lib/data/mock-data";

export default function AssistantPage() {
  return (
    <AppShell>
      <AssistantContent
        modules={mockModules.map((m) => ({ id: m.id, title: m.title }))}
        sources={mockSources.map((s) => ({ id: s.id, title: s.title, moduleId: s.moduleId }))}
        conversations={mockConversations.map((c) => ({
          id: c.id,
          title: c.title,
          mode: c.mode,
          messageCount: c.messages.length,
          createdAt: c.createdAt,
        }))}
        aiConfigured={false}
        providerName="Convex migration"
      />
    </AppShell>
  );
}
