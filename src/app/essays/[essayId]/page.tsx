import { redirect } from "next/navigation";
import { getAssignmentById } from "@/lib/data/mock-data";

export default async function EssayPage({
  params,
}: {
  params: Promise<{ essayId: string }>;
}) {
  const { essayId } = await params;
  const assignment = getAssignmentById(essayId);

  if (assignment) {
    redirect(`/modules/${assignment.moduleId}/assignments/${assignment.id}`);
  }

  redirect("/dashboard");
}
