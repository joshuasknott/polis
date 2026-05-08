import { AppShell } from "@/components/layout/shell";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import {
  mockModules,
  mockUser,
} from "@/lib/data/mock-data";

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent
        user={mockUser}
        modules={mockModules}
      />
    </AppShell>
  );
}
