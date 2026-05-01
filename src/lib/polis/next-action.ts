import { normalizeSourceStatus } from "@/lib/polis/status";
import type { ContextPack, Draft, KnowledgePage, Plan, SourceFile } from "@/lib/types";

interface NextActionInput {
  sources: Array<Pick<SourceFile, "status">>;
  knowledgePages: KnowledgePage[];
  contextPack: ContextPack | null;
  plan: Plan | null;
  draft: Draft | null;
}

export function getPolisNextAction({ sources, knowledgePages, contextPack, plan, draft }: NextActionInput) {
  const processedSources = sources.filter((source) => normalizeSourceStatus(source.status) === "processed").length;
  const sourceBriefs = knowledgePages.filter((page) => page.type === "source_brief").length;

  if (sources.length === 0) {
    return { label: "Add your first source.", section: "sources" as const };
  }

  if (processedSources === 0 || sourceBriefs === 0) {
    return { label: "Create source briefs for your readings.", section: "knowledge" as const };
  }

  if (!contextPack) {
    return { label: "Build a context pack for this assessment.", section: "context" as const };
  }

  if (!plan) {
    return { label: "Create a plan from your context pack.", section: "plan" as const };
  }

  if (!draft) {
    return { label: "Start drafting from your plan.", section: "draft" as const };
  }

  if (draft.status !== "final") {
    return { label: "Review and revise your draft.", section: "final" as const };
  }

  return { label: "Prepare final export.", section: "final" as const };
}
