import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { SettingsContent } from "@/components/settings/settings-content";
import { getProviderStatus } from "@/lib/ai/providers";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const providerStatus = getProviderStatus();

  return (
    <AppShell user={session.user}>
      <SettingsContent
        user={{
          name: session.user.name || "",
          email: session.user.email || "",
        }}
        aiConfigured={providerStatus.configured}
        providerName={providerStatus.provider}
        modelName={providerStatus.model}
        hasEmbeddings={providerStatus.hasEmbeddings}
      />
    </AppShell>
  );
}
