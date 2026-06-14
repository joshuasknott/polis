import { AppShell } from "@/components/layout/shell";
import { TimelineData } from "@/components/timeline/timeline-data";

export const dynamic = "force-dynamic";

export default function TimelinePage() {
  return (
    <AppShell>
      <TimelineData />
    </AppShell>
  );
}
