import { AppShell } from "@/components/layout/shell";
import { EssayRedirectData } from "@/components/assignments/essay-redirect-data";

export default async function EssayPage({
  params,
}: {
  params: Promise<{ essayId: string }>;
}) {
  const { essayId } = await params;

  return (
    <AppShell>
      <EssayRedirectData essayId={essayId} />
    </AppShell>
  );
}
