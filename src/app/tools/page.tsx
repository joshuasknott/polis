import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { ToolsContent } from "@/components/tools/tools-content";

export default async function ToolsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  return (
    <AppShell user={session.user}>
      <ToolsContent />
    </AppShell>
  );
}
