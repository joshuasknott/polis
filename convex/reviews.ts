import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { getAuthIdentifier } from "./lib/auth";
import { api } from "./_generated/api";
import {
  reviewStatus,
  reviewFindingCategory,
  judgementSeverity,
} from "./lib/validators";

export const listForDraft = query({
  args: { draftId: v.id("drafts") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("reviewRuns")
      .withIndex("by_draft_and_status", (q) =>
        q.eq("draftId", args.draftId),
      )
      .order("desc")
      .take(20);
  },
});

export const get = query({
  args: { reviewRunId: v.id("reviewRuns") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const run = await ctx.db.get(args.reviewRunId);
    if (!run || run.tokenIdentifier !== tokenIdentifier) return null;
    return run;
  },
});

export const getWithFindings = query({
  args: { reviewRunId: v.id("reviewRuns") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const run = await ctx.db.get(args.reviewRunId);
    if (!run || run.tokenIdentifier !== tokenIdentifier) return null;

    const findings = await ctx.db
      .query("reviewFindings")
      .withIndex("by_reviewRun", (q) =>
        q.eq("reviewRunId", args.reviewRunId),
      )
      .take(100);

    return { ...run, findings };
  },
});

export const getReviewContext = query({
  args: {
    assignmentId: v.id("assignments"),
    draftId: v.id("drafts"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier)
      return null;

    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.tokenIdentifier !== tokenIdentifier) return null;
    if (draft.assignmentId !== args.assignmentId) return null;

    const arguments_ = await ctx.db
      .query("arguments")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("asc")
      .take(100);

    const evidence: Doc<"evidenceLinks">[] = [];
    for (const arg of arguments_) {
      const links = await ctx.db
        .query("evidenceLinks")
        .withIndex("by_argument", (q) => q.eq("argumentId", arg._id))
        .take(100);
      evidence.push(...links);
    }

    const sourceLinks = await ctx.db
      .query("assignmentSources")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .take(200);

    const sources: Doc<"sources">[] = [];
    for (const link of sourceLinks) {
      const source = await ctx.db.get(link.sourceId);
      if (source) sources.push(source);
    }

    return {
      assignment,
      draft,
      arguments: arguments_,
      evidence,
      sources,
    };
  },
});

export const listRunsForAssignment = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) return [];

    const drafts = await ctx.db
      .query("drafts")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("desc")
      .take(50);

    const runs: Doc<"reviewRuns">[] = [];
    for (const draft of drafts) {
      const draftRuns = await ctx.db
        .query("reviewRuns")
        .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
        .order("desc")
        .take(20);
      runs.push(...draftRuns);
    }

    return runs.sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
  },
});

export const createRun = mutation({
  args: {
    draftId: v.id("drafts"),
    status: v.optional(reviewStatus),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const now = Date.now();
    return await ctx.db.insert("reviewRuns", {
      tokenIdentifier,
      draftId: args.draftId,
      status: args.status ?? "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateRun = mutation({
  args: {
    reviewRunId: v.id("reviewRuns"),
    status: v.optional(reviewStatus),
    overallFeedback: v.optional(v.string()),
    rubricAlignment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { reviewRunId, ...updates } = args;
    const run = await ctx.db.get(reviewRunId);
    if (!run || run.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(reviewRunId, { ...updates, updatedAt: Date.now() });
    return reviewRunId;
  },
});

export const createRunWithFindings = mutation({
  args: {
    draftId: v.id("drafts"),
    overallFeedback: v.string(),
    rubricAlignment: v.string(),
    findings: v.array(
      v.object({
        category: v.string(),
        content: v.string(),
        severity: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const now = Date.now();
    const runId = await ctx.db.insert("reviewRuns", {
      tokenIdentifier,
      draftId: args.draftId,
      status: "completed",
      overallFeedback: args.overallFeedback,
      rubricAlignment: args.rubricAlignment,
      createdAt: now,
      updatedAt: now,
    });

    for (const finding of args.findings) {
      await ctx.db.insert("reviewFindings", {
        tokenIdentifier,
        reviewRunId: runId,
        ...finding,
        createdAt: now,
      });
    }

    return runId;
  },
});

export const removeRun = mutation({
  args: { reviewRunId: v.id("reviewRuns") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const run = await ctx.db.get(args.reviewRunId);
    if (!run || run.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.reviewRunId);
    return args.reviewRunId;
  },
});

export const createFinding = mutation({
  args: {
    reviewRunId: v.id("reviewRuns"),
    category: reviewFindingCategory,
    content: v.string(),
    severity: v.optional(judgementSeverity),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const run = await ctx.db.get(args.reviewRunId);
    if (!run || run.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    return await ctx.db.insert("reviewFindings", {
      ...args,
      tokenIdentifier,
      createdAt: Date.now(),
    });
  },
});

export const listFindings = query({
  args: {
    reviewRunId: v.id("reviewRuns"),
    category: v.optional(reviewFindingCategory),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const run = await ctx.db.get(args.reviewRunId);
    if (!run || run.tokenIdentifier !== tokenIdentifier) return [];

    if (args.category) {
      return await ctx.db
        .query("reviewFindings")
        .withIndex("by_reviewRun_and_category", (q) =>
          q.eq("reviewRunId", args.reviewRunId).eq("category", args.category!),
        )
        .take(100);
    }

    return await ctx.db
      .query("reviewFindings")
      .withIndex("by_reviewRun", (q) =>
        q.eq("reviewRunId", args.reviewRunId),
      )
      .take(100);
  },
});

export const removeFinding = mutation({
  args: { findingId: v.id("reviewFindings") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const finding = await ctx.db.get(args.findingId);
    if (!finding || finding.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.findingId);
    return args.findingId;
  },
});

export const updateFinding = mutation({
  args: {
    findingId: v.id("reviewFindings"),
    category: v.optional(reviewFindingCategory),
    content: v.optional(v.string()),
    severity: v.optional(judgementSeverity),
    resolved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { findingId, ...updates } = args;
    const finding = await ctx.db.get(findingId);
    if (!finding || finding.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(findingId, {
      ...updates,
      ...(args.resolved ? { resolvedAt: Date.now() } : {}),
    });
    return findingId;
  },
});

interface ReviewContext {
  assignment: Doc<"assignments">;
  draft: Doc<"drafts">;
  arguments: Doc<"arguments">[];
  evidence: Doc<"evidenceLinks">[];
  sources: Doc<"sources">[];
}

interface ReviewFinding {
  category: string;
  content: string;
  severity: string;
}

function generateTemplateReview(context: ReviewContext): {
  findings: ReviewFinding[];
  overallFeedback: string;
  rubricAlignment: string;
} {
  const { assignment, draft, arguments: argsList, evidence, sources } = context;
  const findings: ReviewFinding[] = [];
  const wordLimit = assignment.wordLimit ?? 2000;
  const wordCount = draft.wordCount ?? 0;
  const content = draft.content ?? "";
  const rubric = assignment.rubric ?? [];

  const wordRatio = wordLimit > 0 ? wordCount / wordLimit : 0;

  if (wordRatio >= 0.9 && wordRatio <= 1.1) {
    findings.push({
      category: "strength",
      content: `Word count is within the target range (${wordCount} of ${wordLimit} words, ${Math.round(wordRatio * 100)}%)`,
      severity: "info",
    });
  } else if (wordRatio < 0.5) {
    findings.push({
      category: "weakness",
      content: `Draft is significantly under the word limit (${wordCount} of ${wordLimit} words, ${Math.round(wordRatio * 100)}%). Expand each section to develop your arguments.`,
      severity: "warning",
    });
    findings.push({
      category: "revision_priority",
      content: "Expand the draft to approach the word limit — address each argument section in depth",
      severity: "warning",
    });
  } else if (wordRatio < 0.9) {
    findings.push({
      category: "weakness",
      content: `Draft is under the word limit (${wordCount} of ${wordLimit} words). Consider adding depth to your analysis.`,
      severity: "info",
    });
  } else {
    findings.push({
      category: "weakness",
      content: `Draft exceeds the word limit by ${Math.round((wordRatio - 1) * 100)}%. Edit for conciseness.`,
      severity: "warning",
    });
    findings.push({
      category: "revision_priority",
      content: "Reduce the draft to fit within the word limit",
      severity: "warning",
    });
  }

  if (argsList.length === 0) {
    findings.push({
      category: "weakness",
      content:
        "No structured arguments found in the argument map. Build arguments in the Build stage before drafting.",
      severity: "warning",
    });
    findings.push({
      category: "revision_priority",
      content:
        "Create structured arguments linked to evidence before continuing to draft",
      severity: "warning",
    });
  } else {
    findings.push({
      category: "strength",
      content: `The draft is structured around ${argsList.length} main argument${argsList.length > 1 ? "s" : ""}`,
      severity: "info",
    });
  }

  const argsWithoutEvidence = argsList.filter(
    (arg) => !evidence.some((ev) => ev.argumentId === arg._id),
  );

  for (const arg of argsWithoutEvidence) {
    const claim =
      arg.claim.length > 80
        ? arg.claim.substring(0, 77) + "\u2026"
        : arg.claim;
    findings.push({
      category: "missing_evidence",
      content: `The argument "${claim}" has no supporting evidence linked`,
      severity: "warning",
    });
    findings.push({
      category: "unsupported_claim",
      content: `Claim "${claim}" lacks source-backed evidence — add evidence links or acknowledge as interpretation`,
      severity: "warning",
    });
  }

  if (argsWithoutEvidence.length === 0 && argsList.length > 0) {
    findings.push({
      category: "strength",
      content: "All arguments have supporting evidence linked from the source base",
      severity: "info",
    });
  }

  const usedSourceIds = new Set(
    evidence.map((ev) => ev.sourceId as string),
  );
  const unusedSources = sources.filter((s) => !usedSourceIds.has(s._id));

  if (unusedSources.length > 0 && sources.length > 0) {
    findings.push({
      category: "weakness",
      content: `${unusedSources.length} selected source${unusedSources.length > 1 ? "s are" : " is"} not cited in the evidence base. Consider using all selected sources or removing unused ones.`,
      severity: "info",
    });
  }

  if (content.length === 0) {
    findings.push({
      category: "weakness",
      content: "The draft is empty. Begin writing based on the argument structure and evidence.",
      severity: "warning",
    });
    findings.push({
      category: "revision_priority",
      content: "Begin writing your draft — use the argument map and evidence links as a guide",
      severity: "warning",
    });
  } else {
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim());
    if (paragraphs.length < 3 && content.length > 50) {
      findings.push({
        category: "weakness",
        content:
          "The draft has very few paragraphs. Consider expanding each argument into a full section with introduction and conclusion.",
        severity: "info",
      });
    }

    const citationPatterns =
      content.match(/\(\w+,?\s*\d{4}\)/g) ||
      [];
    if (evidence.length > 0 && citationPatterns.length === 0 && content.length > 100) {
      findings.push({
        category: "weakness",
        content:
          "No in-text citations detected in author-date format. Ensure all evidence is properly cited.",
        severity: "warning",
      });
      findings.push({
        category: "revision_priority",
        content:
          "Add in-text citations for all referenced sources (e.g., Author, Year)",
        severity: "warning",
      });
    }
  }

  const weakEvidenceCount = evidence.filter((ev) => ev.strength === "weak").length;
  if (weakEvidenceCount > 0) {
    for (let i = 0; i < weakEvidenceCount; i++) {
      findings.push({
        category: "unsupported_claim",
        content: `Evidence marked as "weak" — consider finding stronger source support or acknowledge the limitation`,
        severity: "info",
      });
    }
  }

  if (rubric.length > 0) {
    rubric.map((criterion) => {
      const hasEvidence = evidence.length > 0;
      const hasContent = content.length > 100;
      if (hasContent && hasEvidence)
        return `${criterion.name}: Partially addressed \u2014 review against the criterion description to ensure full coverage`;
      if (hasContent)
        return `${criterion.name}: Content present but lacks supporting evidence`;
      return `${criterion.name}: Not yet addressed`;
    });
    findings.push({
      category: "revision_priority",
      content:
        "Review each rubric criterion and ensure the draft explicitly addresses all requirements",
      severity: "info",
    });
  }

  if (argsList.length > 1 && content.length > 200) {
    findings.push({
      category: "strength",
      content:
        "The draft addresses multiple arguments, which supports a balanced and thorough analysis",
      severity: "info",
    });
  }

  const hasStrongEvidence = evidence.some((ev) => ev.strength === "strong");
  if (hasStrongEvidence) {
    findings.push({
      category: "strength",
      content:
        "Strong evidence links are present, which supports credible and well-grounded claims",
      severity: "info",
    });
  }

  let rubricAlignment = "";
  if (rubric.length === 0) {
    rubricAlignment =
      "No rubric criteria defined for this assignment.";
  } else {
    rubricAlignment = rubric
      .map((c) => {
        const hasContent = content.length > 0;
        const hasEvidence = evidence.length > 0;
        if (hasContent && hasEvidence)
          return `${c.name}: Partially addressed \u2014 review content against: ${c.description}`;
        if (hasContent)
          return `${c.name}: Content present but needs evidence \u2014 ${c.description}`;
        return `${c.name}: Not yet addressed \u2014 ${c.description}`;
      })
      .join(". ");
  }

  const strengthCount = findings.filter(
    (f) => f.category === "strength",
  ).length;
  const weaknessCount = findings.filter(
    (f) => f.category === "weakness",
  ).length;
  const overallFeedback =
    weaknessCount === 0
      ? `The draft shows ${strengthCount > 1 ? "several" : "a"} positive element${strengthCount !== 1 ? "s" : ""}. Continue refining for clarity and depth.`
      : `The draft has ${weaknessCount} area${weaknessCount > 1 ? "s" : ""} to address. Focus on the revision priorities to strengthen the submission before finalising.`;

  return { findings, overallFeedback, rubricAlignment };
}

export const runReview = action({
  args: {
    assignmentId: v.id("assignments"),
    draftId: v.id("drafts"),
  },
  handler: async (ctx, args) => {
    const context: ReviewContext | null = await ctx.runQuery(
      api.reviews.getReviewContext,
      {
        assignmentId: args.assignmentId,
        draftId: args.draftId,
      },
    );
    if (!context) throw new Error("Review context not found");

    const result = generateTemplateReview(context);

    const runId: Id<"reviewRuns"> = await ctx.runMutation(
      api.reviews.createRunWithFindings,
      {
        draftId: args.draftId,
        overallFeedback: result.overallFeedback,
        rubricAlignment: result.rubricAlignment,
        findings: result.findings,
      },
    );

    return runId;
  },
});
