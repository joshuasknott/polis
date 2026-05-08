import { AppShell } from "@/components/layout/shell";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import {
  mockConversations,
  mockEssayProject,
  mockModules,
  mockSources,
  mockUser,
} from "@/lib/data/mock-data";

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent
        user={mockUser}
        modules={mockModules}
        sources={mockSources}
        conversations={mockConversations}
        deadlines={[{
          id: mockEssayProject.id,
          moduleId: mockEssayProject.moduleId,
          title: mockEssayProject.title,
          question: mockEssayProject.question,
          wordCount: mockEssayProject.wordCount,
          thesis: mockEssayProject.thesis,
          status: mockEssayProject.status,
        }]}
      />
    </AppShell>
  );
}
