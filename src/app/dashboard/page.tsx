import { DashboardData } from "@/components/dashboard/dashboard-data";
import { TopBar } from "@/components/layout/topbar";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="p-4 pt-6 sm:p-6">
        <DashboardData />
      </main>
    </div>
  );
}
