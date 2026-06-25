import type { Doc } from "../../convex/_generated/dataModel";
import type {
  Assignment,
  Argument,
  EvidenceLink,
  Draft,
  DraftBlockType,
  DraftSegment,
  Review,
  EvidenceStrength,
  ProductionStage,
  EvidenceRole,
  Judgement,
  SourceFile,
  SourceStatus,
  SourceType,
  ClaimProvenance,
  ProvenanceLabel,
  ProvenanceSummary,
  ProvenanceWarning,
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
    contextVersion: mod.contextVersion ?? 1,
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

export function mapSource(source: Doc<"sources">): SourceFile & { errorMessage: string } {
  return {
    id: source._id,
    moduleId: source.moduleId,
    folderId: source.folderId ?? null,
    title: source.title,
    author: source.authors ?? "Author unknown",
    year: source.year ?? 0,
    type: source.type as SourceType,
    status: source.status as SourceStatus,
    tags: [] as string[],
    citation: source.citation ?? "",
    pageCount: 0,
    uploadedAt: new Date(source.createdAt).toISOString(),
    summary: source.summary ?? "",
    mainArgument: "",
    keyConcepts: [] as string[],
    errorMessage: source.errorMessage ?? "",
  };
}

export interface WorkspaceSourceItem extends SourceFile {
  errorMessage: string;
  batchId: string;
  importedFileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  classificationLabel: SourceType;
  reviewStatus: SourceStatus;
  needsReview: boolean;
  isProcessing: boolean;
  hasError: boolean;
  uploadedAtMs: number;
}

export function mapWorkspaceSource(source: Doc<"sources">): WorkspaceSourceItem {
  const status = source.status as SourceStatus;
  return {
    ...mapSource(source),
    batchId: source.batchId ?? "",
    importedFileId: source.importedFileId ?? "",
    fileName: source.fileName ?? "",
    fileType: source.fileType ?? "",
    fileSize: source.fileSize ?? 0,
    classificationLabel: source.type as SourceType,
    reviewStatus: status,
    needsReview: status === "needs_review",
    isProcessing:
      status === "uploading" ||
      status === "queued" ||
      status === "extracting" ||
      status === "chunking" ||
      status === "processing",
    hasError: status === "failed",
    uploadedAtMs: source.createdAt,
  };
}

export interface WorkspaceImportBatch {
  id: string;
  name: string;
  status: string;
  totalFiles: number;
  processedFiles: number;
  autoAcceptedFiles: number;
  needsReviewFiles: number;
  failedFiles: number;
  createdAt: string;
  createdAtMs: number;
}

export interface WorkspaceImportedFile {
  id: string;
  batchId: string;
  moduleId: string;
  sourceId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  extractionStatus: string;
  classificationStatus: string;
  labels: string[];
  primaryLabel: string;
  confidence: number | null;
  rationale: string;
  classificationError: string;
  extractionError: string;
  reviewedLabel: string;
  rawRetainedAt: string | null;
  removedAt: string | null;
  createdAt: string;
  createdAtMs: number;
}

export interface WorkspaceAiAction {
  id: string;
  batchId: string;
  importedFileId: string;
  sourceId: string;
  operation: string;
  status: string;
  title: string;
  summary: string;
  confidence: number | null;
  autoApplied: boolean;
  reversible: boolean;
  revertedAt: string | null;
  errorMessage: string;
  createdAt: string;
  createdAtMs: number;
}

export interface WorkspaceSourceSignal {
  id: string;
  sourceId: string;
  assignmentId: string;
  title: string;
  content: string;
  signalType: string;
  severity: string;
  confidence: number;
  status: string;
  suggestedAction: string;
  createdAt: string;
  createdAtMs: number;
}

export function mapImportBatch(batch: Doc<"importBatches">): WorkspaceImportBatch {
  return {
    id: batch._id,
    name: batch.name ?? "Import batch",
    status: batch.status,
    totalFiles: batch.totalFiles,
    processedFiles: batch.processedFiles ?? 0,
    autoAcceptedFiles: batch.autoAcceptedFiles ?? 0,
    needsReviewFiles: batch.needsReviewFiles ?? 0,
    failedFiles: batch.failedFiles ?? 0,
    createdAt: new Date(batch.createdAt).toISOString(),
    createdAtMs: batch.createdAt,
  };
}

export function mapImportedFile(file: Doc<"importedFiles">): WorkspaceImportedFile {
  return {
    id: file._id,
    batchId: file.batchId,
    moduleId: file.moduleId,
    sourceId: file.sourceId ?? "",
    fileName: file.fileName ?? "Untitled upload",
    fileType: file.fileType ?? "",
    fileSize: file.fileSize ?? 0,
    extractionStatus: file.extractionStatus,
    classificationStatus: file.classificationStatus,
    labels: file.labels ?? [],
    primaryLabel: file.primaryLabel ?? "",
    confidence: file.confidence ?? null,
    rationale: file.rationale ?? "",
    classificationError: file.classificationError ?? "",
    extractionError: file.extractionError ?? "",
    reviewedLabel: file.reviewedLabel ?? "",
    rawRetainedAt: file.rawRetainedAt
      ? new Date(file.rawRetainedAt).toISOString()
      : null,
    removedAt: file.removedAt ? new Date(file.removedAt).toISOString() : null,
    createdAt: new Date(file.createdAt).toISOString(),
    createdAtMs: file.createdAt,
  };
}

export function mapAiAction(action: Doc<"aiActions">): WorkspaceAiAction {
  return {
    id: action._id,
    batchId: action.batchId ?? "",
    importedFileId: action.importedFileId ?? "",
    sourceId: action.sourceId ?? "",
    operation: action.operation,
    status: action.status,
    title: action.title,
    summary: action.summary ?? "",
    confidence: action.confidence ?? null,
    autoApplied: action.autoApplied ?? false,
    reversible: action.reversible ?? false,
    revertedAt: action.revertedAt ? new Date(action.revertedAt).toISOString() : null,
    errorMessage: action.errorMessage ?? "",
    createdAt: new Date(action.createdAt).toISOString(),
    createdAtMs: action.createdAt,
  };
}

export function mapRelevanceSignal(
  signal: Doc<"sourceRelevanceSignals">,
): WorkspaceSourceSignal {
  return {
    id: signal._id,
    sourceId: signal.sourceId,
    assignmentId: signal.assignmentId ?? "",
    title: signal.title,
    content: signal.rationale,
    signalType: signal.signalType,
    severity: "info",
    confidence: signal.confidence,
    status: signal.status,
    suggestedAction: "",
    createdAt: new Date(signal.createdAt).toISOString(),
    createdAtMs: signal.createdAt,
  };
}

export function mapGapSignal(
  signal: Doc<"sourceGapSignals">,
): WorkspaceSourceSignal {
  return {
    id: signal._id,
    sourceId: signal.sourceId ?? "",
    assignmentId: signal.assignmentId ?? "",
    title: signal.title,
    content: signal.content,
    signalType: signal.gapCategory ?? "scope_gap",
    severity: signal.severity,
    confidence: signal.confidence,
    status: signal.status,
    suggestedAction: signal.suggestedAction ?? "",
    createdAt: new Date(signal.createdAt).toISOString(),
    createdAtMs: signal.createdAt,
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
    status: (assignment.stage ?? "ingest") as ProductionStage,
    createdAt: new Date(assignment.createdAt).toISOString(),
  };
}

export interface CommandCenterAssignment {
  id: string;
  moduleId: string;
  title: string;
  question: string;
  wordLimit: number;
  dueDate: string;
  rubric: Array<{ name: string; description: string; weight: number }>;
  rubricWeightTotal: number;
  selectedSourceCount: number;
  stage: ProductionStage;
  hasQuestion: boolean;
  hasRubric: boolean;
  hasDueDate: boolean;
  hasWordLimit: boolean;
  hasSources: boolean;
  missingContext: string[];
  createdAt: string;
}

export function mapCommandCenterAssignment(
  assignment: Doc<"assignments"> & { selectedSourceCount?: number },
): CommandCenterAssignment {
  const rubric = (assignment.rubric ?? []) as Array<{
    name: string;
    description: string;
    weight: number;
  }>;
  const hasQuestion = !!(assignment.question && assignment.question.trim().length > 0);
  const hasRubric = rubric.length > 0;
  const hasDueDate = !!assignment.dueDate;
  const hasWordLimit = !!(assignment.wordLimit && assignment.wordLimit > 0);
  const hasSources = (assignment.selectedSourceCount ?? 0) > 0;

  const missingContext: string[] = [];
  if (!hasQuestion) missingContext.push("Add the coursework question");
  if (!hasDueDate) missingContext.push("Set a deadline");
  if (!hasWordLimit) missingContext.push("Confirm the word limit");
  if (!hasRubric) missingContext.push("Attach the marking rubric");
  if (!hasSources) missingContext.push("Select relevant sources");

  return {
    id: assignment._id,
    moduleId: assignment.moduleId,
    title: assignment.title,
    question: assignment.question ?? "",
    wordLimit: assignment.wordLimit ?? 0,
    dueDate: assignment.dueDate ?? "",
    rubric,
    rubricWeightTotal: rubric.reduce((sum, criterion) => sum + (criterion.weight || 0), 0),
    selectedSourceCount: assignment.selectedSourceCount ?? 0,
    stage: (assignment.stage ?? "ingest") as ProductionStage,
    hasQuestion,
    hasRubric,
    hasDueDate,
    hasWordLimit,
    hasSources,
    missingContext,
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

export function mapDraftBlock(block: Doc<"draftBlocks">): DraftSegment {
  return {
    id: block._id,
    draftId: block.draftId,
    blockType: (block.blockType as DraftBlockType) ?? "body",
    content: block.content ?? "",
    argumentId: block.argumentId ?? null,
    sortOrder: block.sortOrder ?? 0,
    label: (block.label as ProvenanceLabel) ?? null,
    sourceId: block.sourceId ?? null,
    sourceChunkId: block.sourceChunkId ?? null,
    evidenceLinkId: block.evidenceLinkId ?? null,
    quote: block.quote ?? null,
    pageRange: block.pageRange ?? null,
    aiGenerated: block.aiGenerated ?? false,
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

export function mapClaimProvenance(
  record: Doc<"claimProvenance">,
): ClaimProvenance {
  return {
    id: record._id,
    draftId: record.draftId,
    draftBlockId: record.draftBlockId ?? null,
    claimText: record.claimText,
    spanStart: record.spanStart ?? null,
    spanEnd: record.spanEnd ?? null,
    label: record.label as ProvenanceLabel,
    effectiveLabel: (record.effectiveLabel ?? record.label) as ProvenanceLabel,
    sourceId: record.sourceId ?? null,
    sourceChunkId: record.sourceChunkId ?? null,
    evidenceLinkId: record.evidenceLinkId ?? null,
    requiredReadingId: record.requiredReadingId ?? null,
    quote: record.quote ?? null,
    claimedPageStart: record.claimedPageStart ?? null,
    claimedPageEnd: record.claimedPageEnd ?? null,
    isCatalogRecommendation: record.isCatalogRecommendation ?? false,
    evidenceStrength: (record.evidenceStrength ?? null) as EvidenceStrength | null,
    validationWarnings: (record.validationWarnings ?? []) as ProvenanceWarning[],
    notes: record.notes ?? null,
    createdAt: new Date(record.createdAt).toISOString(),
    updatedAt: new Date(record.updatedAt).toISOString(),
  };
}

export function mapProvenanceSummary(
  raw: Omit<ProvenanceSummary, "byLabel" | "byEffectiveLabel"> & {
    byLabel: Record<string, number>;
    byEffectiveLabel: Record<string, number>;
  },
): ProvenanceSummary {
  const empty = () => ({
    quoted: 0,
    paraphrased: 0,
    source_supported: 0,
    interpretation: 0,
    generated: 0,
    unsupported: 0,
  });
  const byLabel = empty();
  const byEffectiveLabel = empty();
  for (const key of Object.keys(raw.byLabel)) {
    if (key in byLabel) {
      (byLabel as Record<string, number>)[key] = raw.byLabel[key];
    }
  }
  for (const key of Object.keys(raw.byEffectiveLabel)) {
    if (key in byEffectiveLabel) {
      (byEffectiveLabel as Record<string, number>)[key] = raw.byEffectiveLabel[key];
    }
  }
  return {
    total: raw.total,
    byLabel,
    byEffectiveLabel,
    rejectedCitations: raw.rejectedCitations,
    totalWarnings: raw.totalWarnings,
    criticalCount: raw.criticalCount,
    warningCount: raw.warningCount,
    infoCount: raw.infoCount,
    warningCountsByCode: raw.warningCountsByCode,
  };
}
