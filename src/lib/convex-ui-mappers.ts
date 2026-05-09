import type { Doc } from "../../convex/_generated/dataModel";
import type {
  Assignment,
  Argument,
  EvidenceLink,
  Draft,
  Review,
  EvidenceStrength,
  ProductionStage,
  EvidenceRole,
} from "./types";

export function mapModule(
  mod: Doc<"modules"> & { sourceCount?: number; assignmentCount?: number },
) {
  return {
    id: mod._id,
    workspaceId: "",
    title: mod.title,
    code: mod.code,
    academicYear: mod.academicYear ?? "",
    semester: mod.semester ?? "",
    description: mod.description ?? "",
    color: mod.colour ?? "var(--color-border)",
    sourceCount: mod.sourceCount ?? 0,
    noteCount: 0,
    assignmentCount: mod.assignmentCount ?? 0,
    lastActivityAt: new Date(mod.updatedAt).toISOString(),
    themes: mod.themes ?? [],
    concepts: mod.concepts ?? [],
    learningOutcomes: mod.learningOutcomes ?? [],
    contextVersion: mod.contextVersion,
  };
}

export function mapFolder(folder: Doc<"folders">, sourceCount: number) {
  return {
    id: folder._id,
    moduleId: folder.moduleId,
    parentFolderId: folder.parentFolderId ?? null,
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
    folderId: source.folderId ?? null,
    title: source.title,
    author: source.authors ?? "",
    year: source.year ?? null,
    type: source.type,
    status: source.status,
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
    wordLimit: assignment.wordLimit ?? null,
    dueDate: assignment.dueDate ?? null,
    rubric: (assignment.rubric ?? []) as Array<{
      name: string;
      description: string;
      weight: number;
    }>,
    selectedSourceIds,
    stage: assignment.stage as ProductionStage,
    contextVersion: assignment.contextVersion ?? null,
    createdAt: new Date(assignment.createdAt).toISOString(),
  };
}

export function mapAssignment(assignment: Doc<"assignments"> & { selectedSourceCount?: number }) {
  return {
    id: assignment._id,
    moduleId: assignment.moduleId,
    title: assignment.title,
    question: assignment.question ?? "",
    wordLimit: assignment.wordLimit ?? 0,
    dueDate: assignment.dueDate ?? "",
    rubric: (assignment.rubric ?? []) as Array<{ name: string; description: string; weight: number }>,
    selectedSourceIds: [],
    selectedSourceCount: assignment.selectedSourceCount ?? 0,
    stage: (assignment.stage ?? "ingest") as ProductionStage,
    createdAt: new Date(assignment.createdAt).toISOString(),
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
    usage: (link.usage as EvidenceRole) ?? "",
    strength: link.strength as EvidenceStrength,
  };
}

export function mapArgument(
  arg: Doc<"arguments">,
  evidenceLinks: EvidenceLink[],
): Argument {
  return {
    id: arg._id,
    assignmentId: arg.assignmentId,
    claim: arg.claim,
    synthesis: arg.synthesis ?? "",
    counterarguments: [],
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
