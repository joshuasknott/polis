import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { SettingsContent } from "@/components/settings/settings-content";
import { getProviderStatus } from "@/lib/ai/providers";
import { getUserProviderConnections } from "@/lib/services/apikey-service";
import { prisma } from "@/lib/db";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const providerStatus = getProviderStatus();
  const connections = await getUserProviderConnections(session.user.id);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      university: true,
      course: true,
      yearOfStudy: true,
      preferences: true,
      passwordHash: true,
    },
  });

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { provider: true },
  });

  return (
    <AppShell user={session.user}>
      <SettingsContent
        user={{
          name: user?.name || session.user.name || "",
          email: user?.email || session.user.email || "",
          university: user?.university || "",
          course: user?.course || "",
          yearOfStudy: user?.yearOfStudy || null,
        }}
        preferences={user?.preferences as Record<string, string> || {}}
        aiConfigured={providerStatus.configured}
        providerName={providerStatus.provider}
        modelName={providerStatus.model}
        hasEmbeddings={providerStatus.hasEmbeddings}
        connections={connections.map((c) => ({
          provider: c.provider,
          status: c.status,
          modelPreference: c.modelPreference,
          hasKey: !!c.encryptedApiKey,
        }))}
        linkedProviders={accounts.map((a) => a.provider)}
        hasPassword={!!user?.passwordHash}
      />
    </AppShell>
  );
}
