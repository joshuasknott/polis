import { AppShell } from "@/components/layout/shell";
import { DashboardData } from "@/components/dashboard/dashboard-data";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardData />
    </AppShell>
  );
}
