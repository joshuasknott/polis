import { AppShell } from "@/components/layout/shell";
import { SettingsContent } from "@/components/settings/settings-content";
import { mockProviders, mockUser } from "@/lib/data/mock-data";

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsContent
        user={{
          name: mockUser.name,
          email: mockUser.email,
          university: mockUser.university,
          course: mockUser.course,
          yearOfStudy: mockUser.yearOfStudy,
        }}
        preferences={{}}
        aiConfigured={false}
        providerName="z.ai"
        modelName="Planned"
        hasEmbeddings={false}
        connections={mockProviders.map((c) => ({
          provider: c.provider,
          status: c.status,
          modelPreference: c.modelPreference,
          hasKey: false,
        }))}
        linkedProviders={[]}
        hasPassword={false}
      />
    </AppShell>
  );
}
