import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { UsageContent } from "@/components/settings/usage-content";

export default async function UsagePage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  return (
    <AppShell user={session.user}>
      <UsageContent />
    </AppShell>
  );
}
