import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { SettingsContent } from "@/components/settings/settings-content";
import { getProviderStatus } from "@/lib/ai/providers";
import { convexServer, api } from "@/lib/convex-server";

function parsePreferences(preferences?: string) {
  if (!preferences) return {};
  try {
    return JSON.parse(preferences) as Record<string, string>;
  } catch {
    return {};
  }
}

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;
  const providerStatus = getProviderStatus();
  const [connections, profile, linkedProviders] = await Promise.all([
    convexServer.query(api.aiProviders.getByUserId, { userId }),
    convexServer.query(api.users.getProfile, { userId }),
    convexServer.query(api.users.getLinkedProviders, { userId }),
  ]);

  return (
    <AppShell user={session.user}>
      <SettingsContent
        user={{
          name: profile?.name || session.user.name || "",
          email: profile?.email || session.user.email || "",
          university: profile?.university || "",
          course: profile?.course || "",
          yearOfStudy: profile?.yearOfStudy ?? null,
        }}
        preferences={parsePreferences(profile?.preferences)}
        aiConfigured={providerStatus.configured}
        providerName={providerStatus.provider}
        modelName={providerStatus.model}
        hasEmbeddings={providerStatus.hasEmbeddings}
        connections={connections.map((c: any) => ({
          provider: c.provider as string,
          status: c.status || "disconnected",
          modelPreference: c.modelPreference ?? null,
          hasKey: !!c.encryptedApiKey,
        }))}
        linkedProviders={linkedProviders.map((a) => a.provider)}
        hasPassword={profile?.hasPassword ?? false}
      />
    </AppShell>
  );
}
