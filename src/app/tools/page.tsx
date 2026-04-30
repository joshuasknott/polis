import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { ToolsContent } from "@/components/tools/tools-content";

export default async function ToolsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  return (
    <AppShell user={session.user}>
      <ToolsContent />
    </AppShell>
  );
}
