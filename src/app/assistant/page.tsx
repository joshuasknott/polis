import { AppShell } from "@/components/layout/shell";
import { AssistantData } from "@/components/assistant/assistant-data";

export const dynamic = "force-dynamic";

export default function AssistantPage() {
  return (
    <AppShell>
      <AssistantData />
    </AppShell>
  );
}