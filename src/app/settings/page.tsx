import { currentUser } from "@clerk/nextjs/server";
import { AppShell } from "@/components/layout/shell";
import { SettingsContent } from "@/components/settings/settings-content";

function metadataString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function metadataNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

export default async function SettingsPage() {
  const user = await currentUser();

  return (
    <AppShell>
      <SettingsContent
        user={{
          name: user?.fullName ?? user?.username ?? "",
          email: user?.primaryEmailAddress?.emailAddress ?? "",
          university: metadataString(user?.publicMetadata.university),
          course: metadataString(user?.publicMetadata.course),
          yearOfStudy: metadataNumber(user?.publicMetadata.yearOfStudy),
        }}
        preferences={{}}
        linkedProviders={[]}
        hasPassword={false}
      />
    </AppShell>
  );
}
