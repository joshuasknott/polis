import type { Doc } from "../../convex/_generated/dataModel";
import type { Assignment, Argument, EvidenceLink, Draft, Review, EvidenceStrength, ProductionStage, Judgement } from "./types";

export function mapModule(
  mod: Doc<"modules"> & { sourceCount?: number; assignmentCount?: number },
) {
  return {
    id: mod._id,
    workspaceId: "",
    title: mod.title,
    code: mod.code,
    academicYear: "",
    semester: "",
    description: mod.description ?? "",
    color: mod.colour ?? "var(--color-border)",
    sourceCount: mod.sourceCount ?? 0,
    noteCount: 0,
    assignmentCount: mod.assignmentCount ?? 0,
    lastActivityAt: new Date(mod.updatedAt).toISOString(),
  };
}

export function mapFolder(folder: Doc<"folders">, sourceCount: number) {
  return {
    id: folder._id,
    name: folder.name,
    type: folder.type,
    sortOrder: folder.sortOrder,
    sourceCount,
  };
}

export function mapSource(source: Doc<"sources">) {
  return {
    id: source._id,
    moduleId: source.moduleId,
    folderId: source.folderId ?? "",
    title: source.title,
    author: source.authors ?? "Author unknown",
    year: source.year ?? 0,
    type: source.type as import("./types").SourceType,
    status: source.status as import("./types").ProcessingStatus,
    tags: [] as string[],
    citation: source.citation ?? "",
    pageCount: 0,
    uploadedAt: new Date(source.createdAt).toISOString(),
    summary: source.summary ?? "",
    mainArgument: "",
    keyConcepts: [] as string[],
  };
}

export function mapFullAssignment(
  assignment: Doc<"assignments">,
  selectedSourceIds: string[],
): Assignment {
  return {
    id: assignment._id,
    moduleId: assignment.moduleId,
    title: assignment.title,
    question: assignment.question ?? "",
    wordLimit: assignment.wordLimit ?? 2000,
    dueDate: assignment.dueDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    rubric: (assignment.rubric ?? []) as Array<{ name: string; description: string; weight: number }>,
    selectedSourceIds,
    stage: (assignment.stage ?? "ingest") as ProductionStage,
    createdAt: new Date(assignment.createdAt).toISOString(),
  };
}

export function mapAssignment(assignment: Doc<"assignments">) {
  return {
    id: assignment._id,
    title: assignment.title,
    status: assignment.stage,
  };
}

export function mapEvidenceLink(
  link: Doc<"evidenceLinks">,
  sourceTitle: string,
): EvidenceLink {
  return {
    id: link._id,
    argumentId: link.argumentId,
    sourceId: link.sourceId,
    sourceTitle,
    quote: link.quote ?? "",
    pageRange: link.pageRange ?? "",
    usage: link.usage ?? "",
    strength: (link.strength as EvidenceStrength) ?? "moderate",
  };
}

export function mapArgument(
  arg: Doc<"arguments">,
  evidenceLinks: EvidenceLink[],
  counterargumentNodes?: Doc<"argumentNodes">[],
): Argument {
  return {
    id: arg._id,
    assignmentId: arg.assignmentId,
    claim: arg.claim,
    synthesis: arg.synthesis ?? "",
    counterarguments: (counterargumentNodes ?? [])
      .filter((n) => n.argumentId === arg._id)
      .map((n) => n.content),
    sortOrder: arg.sortOrder,
    evidenceLinks,
  };
}

export function mapDraft(draft: Doc<"drafts">): Draft {
  return {
    id: draft._id,
    assignmentId: draft.assignmentId,
    version: draft.version,
    content: draft.content ?? "",
    wordCount: draft.wordCount ?? 0,
    createdAt: new Date(draft.createdAt).toISOString(),
    updatedAt: new Date(draft.updatedAt).toISOString(),
  };
}

export function mapReview(
  run: Doc<"reviewRuns">,
  findings: Doc<"reviewFindings">[],
): Review {
  const byCategory = (cat: string) =>
    findings.filter((f) => f.category === cat).map((f) => f.content);

  return {
    id: run._id,
    draftId: run.draftId,
    strengths: byCategory("strength"),
    weaknesses: byCategory("weakness"),
    missingEvidence: byCategory("missing_evidence"),
    unsupportedClaims: byCategory("unsupported_claim"),
    revisionPriorities: byCategory("revision_priority"),
    rubricAlignment: run.rubricAlignment ?? "",
    overallFeedback: run.overallFeedback ?? "",
  };
}

export function mapJudgement(
  option: Doc<"judgementOptions">,
  decisions: Doc<"judgementDecisions">[],
): Judgement {
  const relatedDecisions = decisions.filter(
    (d) => d.judgementOptionId === option._id,
  );
  return {
    id: option._id,
    assignmentId: option.assignmentId,
    type: option.type as import("./types").JudgementType,
    findings: relatedDecisions.map((d) => d.content),
    severity: relatedDecisions.length > 0
      ? (relatedDecisions[0].severity as import("./types").JudgementSeverity)
      : "info",
    createdAt: new Date(option.createdAt).toISOString(),
  };
}

export function mapSectionPlan(plan: Doc<"sectionPlans">) {
  return {
    id: plan._id,
    assignmentId: plan.assignmentId,
    label: plan.label,
    wordBudget: plan.wordBudget,
    argumentIds: plan.argumentIds ?? [],
    counterargumentPlan: plan.counterargumentPlan ?? "",
    rebuttalPlan: plan.rebuttalPlan ?? "",
    sortOrder: plan.sortOrder,
  };
}
