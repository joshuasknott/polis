import {
  query,
  mutation,
  internalMutation,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { getAuthIdentifier } from "./lib/auth";
import {
  moduleFactField,
  extractionProvenance,
} from "./lib/validators";

async function assertModuleOwnership(
  ctx: QueryCtx,
  tokenIdentifier: string,
  moduleId: Id<"modules">,
): Promise<Doc<"modules">> {
  const mod = await ctx.db.get(moduleId);
  if (!mod || mod.tokenIdentifier !== tokenIdentifier) {
    throw new Error("Not found");
  }
  return mod;
}

export const listPendingSpecs = query({
  args: {
    moduleId: v.id("modules"),
    includeRubric: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    await assertModuleOwnership(ctx, tokenIdentifier, args.moduleId);

    const specs = await ctx.db
      .query("assessmentSpecs")
      .withIndex("by_module_and_status", (q) =>
        q.eq("moduleId", args.moduleId).eq("status", "extracted"),
      )
      .order("desc")
      .take(100);

    if (!args.includeRubric) return specs;

    const results: (Doc<"assessmentSpecs"> & {
      rubricCriteria: Doc<"extractedRubricCriteria">[];
    })[] = [];
    for (const spec of specs) {
      const criteria = await ctx.db
        .query("extractedRubricCriteria")
        .withIndex("by_assessmentSpec_and_sortOrder", (q) =>
          q.eq("assessmentSpecId", spec._id),
        )
        .order("asc")
        .take(30);
      results.push({ ...spec, rubricCriteria: criteria });
    }
    return results;
  },
});

export const listPendingFacts = query({
  args: {
    moduleId: v.id("modules"),
    field: v.optional(moduleFactField),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    await assertModuleOwnership(ctx, tokenIdentifier, args.moduleId);

    if (args.field) {
      return await ctx.db
        .query("moduleFacts")
        .withIndex("by_module_and_field_and_status", (q) =>
          q
            .eq("moduleId", args.moduleId)
            .eq("field", args.field!)
            .eq("status", "extracted"),
        )
        .order("desc")
        .take(50);
    }

    return await ctx.db
      .query("moduleFacts")
      .withIndex("by_module_and_status", (q) =>
        q.eq("moduleId", args.moduleId).eq("status", "extracted"),
      )
      .order("desc")
      .take(100);
  },
});

export const listPendingTopics = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    await assertModuleOwnership(ctx, tokenIdentifier, args.moduleId);

    const topics = await ctx.db
      .query("weeklyTopics")
      .withIndex("by_module_and_sortOrder", (q) =>
        q.eq("moduleId", args.moduleId),
      )
      .order("asc")
      .take(100);

    return topics.filter(
      (t) => t.status === "extracted" || t.status === undefined,
    );
  },
});

export const listPendingReadings = query({
  args: {
    moduleId: v.id("modules"),
    kind: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    await assertModuleOwnership(ctx, tokenIdentifier, args.moduleId);

    const readings = await ctx.db
      .query("requiredReadings")
      .withIndex("by_module_and_sortOrder", (q) =>
        q.eq("moduleId", args.moduleId),
      )
      .order("asc")
      .take(200);

    const pending = readings.filter(
      (r) => r.status === "extracted" || r.status === undefined,
    );

    if (args.kind) {
      return pending.filter((r) => r.kind === args.kind);
    }
    return pending;
  },
});

export const getSpecDetail = query({
  args: { specId: v.id("assessmentSpecs") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const spec = await ctx.db.get(args.specId);
    if (!spec || spec.tokenIdentifier !== tokenIdentifier) return null;

    const rubricCriteria = await ctx.db
      .query("extractedRubricCriteria")
      .withIndex("by_assessmentSpec_and_sortOrder", (q) =>
        q.eq("assessmentSpecId", args.specId),
      )
      .order("asc")
      .take(30);

    return { spec, rubricCriteria };
  },
});

export const getExtractionForSource = query({
  args: { sourceId: v.id("sources") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) return null;

    const facts = await ctx.db
      .query("moduleFacts")
      .withIndex("by_module", (q) => q.eq("moduleId", source.moduleId))
      .take(100);

    const sourceFacts = facts.filter(
      (f) => f.provenance?.sourceId === args.sourceId,
    );

    return { source, facts: sourceFacts };
  },
});

export const getExtractionForFile = query({
  args: { importedFileId: v.id("importedFiles") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const file = await ctx.db.get(args.importedFileId);
    if (!file || file.tokenIdentifier !== tokenIdentifier) return null;

    const specs = await ctx.db
      .query("assessmentSpecs")
      .withIndex("by_importedFile", (q) =>
        q.eq("importedFileId", args.importedFileId),
      )
      .take(50);

    const facts = await ctx.db
      .query("moduleFacts")
      .withIndex("by_importedFile", (q) =>
        q.eq("importedFileId", args.importedFileId),
      )
      .take(100);

    const topics = await ctx.db
      .query("weeklyTopics")
      .withIndex("by_importedFile", (q) =>
        q.eq("importedFileId", args.importedFileId),
      )
      .take(100);

    const readings = await ctx.db
      .query("requiredReadings")
      .withIndex("by_importedFile", (q) =>
        q.eq("importedFileId", args.importedFileId),
      )
      .take(100);

    const specsWithRubric = await Promise.all(
      specs.map(async (spec) => {
        const criteria = await ctx.db
          .query("extractedRubricCriteria")
          .withIndex("by_assessmentSpec_and_sortOrder", (q) =>
            q.eq("assessmentSpecId", spec._id),
          )
          .order("asc")
          .take(30);
        return { ...spec, rubricCriteria: criteria };
      }),
    );

    return { file, specs: specsWithRubric, facts, topics, readings };
  },
});

export const getExtractionSummary = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    await assertModuleOwnership(ctx, tokenIdentifier, args.moduleId);

    const pendingSpecs = await ctx.db
      .query("assessmentSpecs")
      .withIndex("by_module_and_status", (q) =>
        q.eq("moduleId", args.moduleId).eq("status", "extracted"),
      )
      .take(100);

    const pendingFacts = await ctx.db
      .query("moduleFacts")
      .withIndex("by_module_and_status", (q) =>
        q.eq("moduleId", args.moduleId).eq("status", "extracted"),
      )
      .take(100);

    const allTopics = await ctx.db
      .query("weeklyTopics")
      .withIndex("by_module_and_sortOrder", (q) =>
        q.eq("moduleId", args.moduleId),
      )
      .take(100);
    const pendingTopics = allTopics.filter(
      (t) => t.status === "extracted" || t.status === undefined,
    );

    const allReadings = await ctx.db
      .query("requiredReadings")
      .withIndex("by_module_and_sortOrder", (q) =>
        q.eq("moduleId", args.moduleId),
      )
      .take(200);
    const pendingReadings = allReadings.filter(
      (r) => r.status === "extracted" || r.status === undefined,
    );

    return {
      pendingSpecs: pendingSpecs.length,
      pendingFacts: pendingFacts.length,
      pendingTopics: pendingTopics.length,
      pendingReadings: pendingReadings.length,
      specs: pendingSpecs,
      facts: pendingFacts,
    };
  },
});

export const _writeModuleFact = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    moduleId: v.id("modules"),
    field: moduleFactField,
    value: v.string(),
    uncertain: v.optional(v.boolean()),
    batchId: v.optional(v.id("importBatches")),
    importedFileId: v.optional(v.id("importedFiles")),
    provenance: extractionProvenance,
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("moduleFacts", {
      tokenIdentifier: args.tokenIdentifier,
      moduleId: args.moduleId,
      batchId: args.batchId,
      importedFileId: args.importedFileId,
      field: args.field,
      value: args.value,
      uncertain: args.uncertain,
      status: "extracted",
      provenance: args.provenance,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const _writeAssessmentSpec = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    moduleId: v.id("modules"),
    title: v.string(),
    question: v.optional(v.string()),
    deadline: v.optional(v.string()),
    weight: v.optional(v.number()),
    wordLimit: v.optional(v.number()),
    referencingRule: v.optional(v.string()),
    submissionFormat: v.optional(v.string()),
    uncertain: v.optional(v.boolean()),
    batchId: v.optional(v.id("importBatches")),
    importedFileId: v.optional(v.id("importedFiles")),
    provenance: extractionProvenance,
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const specId = await ctx.db.insert("assessmentSpecs", {
      tokenIdentifier: args.tokenIdentifier,
      moduleId: args.moduleId,
      batchId: args.batchId,
      importedFileId: args.importedFileId,
      title: args.title,
      question: args.question,
      deadline: args.deadline,
      weight: args.weight,
      wordLimit: args.wordLimit,
      referencingRule: args.referencingRule,
      submissionFormat: args.submissionFormat,
      uncertain: args.uncertain,
      status: "extracted",
      provenance: args.provenance,
      createdAt: now,
      updatedAt: now,
    });
    return specId;
  },
});

export const _writeRubricCriterion = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    assessmentSpecId: v.id("assessmentSpecs"),
    name: v.string(),
    description: v.optional(v.string()),
    weight: v.optional(v.number()),
    sortOrder: v.number(),
    provenance: v.optional(extractionProvenance),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("extractedRubricCriteria", {
      tokenIdentifier: args.tokenIdentifier,
      assessmentSpecId: args.assessmentSpecId,
      name: args.name,
      description: args.description,
      weight: args.weight,
      sortOrder: args.sortOrder,
      status: "extracted",
      provenance: args.provenance,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const _writeWeeklyTopic = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    moduleId: v.id("modules"),
    weekNumber: v.optional(v.number()),
    title: v.string(),
    description: v.optional(v.string()),
    sortOrder: v.number(),
    batchId: v.optional(v.id("importBatches")),
    importedFileId: v.optional(v.id("importedFiles")),
    sourceId: v.optional(v.id("sources")),
    provenance: v.optional(extractionProvenance),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("weeklyTopics", {
      tokenIdentifier: args.tokenIdentifier,
      moduleId: args.moduleId,
      weekNumber: args.weekNumber,
      title: args.title,
      description: args.description,
      sortOrder: args.sortOrder,
      batchId: args.batchId,
      importedFileId: args.importedFileId,
      sourceId: args.sourceId,
      status: "extracted",
      provenance: args.provenance,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const _writeRequiredReading = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    moduleId: v.id("modules"),
    title: v.string(),
    authors: v.optional(v.string()),
    year: v.optional(v.number()),
    citation: v.optional(v.string()),
    url: v.optional(v.string()),
    kind: v.optional(v.string()),
    weekNumber: v.optional(v.number()),
    sortOrder: v.number(),
    batchId: v.optional(v.id("importBatches")),
    importedFileId: v.optional(v.id("importedFiles")),
    sourceId: v.optional(v.id("sources")),
    provenance: v.optional(extractionProvenance),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("requiredReadings", {
      tokenIdentifier: args.tokenIdentifier,
      moduleId: args.moduleId,
      title: args.title,
      authors: args.authors,
      year: args.year,
      citation: args.citation,
      url: args.url,
      kind: args.kind,
      weekNumber: args.weekNumber,
      sortOrder: args.sortOrder,
      batchId: args.batchId,
      importedFileId: args.importedFileId,
      sourceId: args.sourceId,
      status: "extracted",
      provenance: args.provenance,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const _supersedeForSource = internalMutation({
  args: {
    moduleId: v.id("modules"),
    sourceId: v.id("sources"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const oldSpecs = await ctx.db
      .query("assessmentSpecs")
      .withIndex("by_module_and_status", (q) =>
        q.eq("moduleId", args.moduleId).eq("status", "extracted"),
      )
      .take(100);
    for (const spec of oldSpecs) {
      if (spec.provenance?.sourceId === args.sourceId) {
        await ctx.db.patch(spec._id, { status: "rejected", updatedAt: now });
      }
    }

    const oldFacts = await ctx.db
      .query("moduleFacts")
      .withIndex("by_module_and_status", (q) =>
        q.eq("moduleId", args.moduleId).eq("status", "extracted"),
      )
      .take(100);
    for (const fact of oldFacts) {
      if (fact.provenance?.sourceId === args.sourceId) {
        await ctx.db.patch(fact._id, { status: "superseded", updatedAt: now });
      }
    }

    const oldTopics = await ctx.db
      .query("weeklyTopics")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .take(100);
    for (const topic of oldTopics) {
      if (
        (topic.status === "extracted" || topic.status === undefined) &&
        topic.sourceId === args.sourceId
      ) {
        await ctx.db.patch(topic._id, {
          status: "superseded",
          updatedAt: now,
        });
      }
    }

    const oldReadings = await ctx.db
      .query("requiredReadings")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .take(100);
    for (const reading of oldReadings) {
      if (
        (reading.status === "extracted" || reading.status === undefined) &&
        reading.sourceId === args.sourceId
      ) {
        await ctx.db.patch(reading._id, {
          status: "superseded",
          updatedAt: now,
        });
      }
    }
  },
});

function parseListValue(value: string): string[] {
  const trimmed = value.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => (typeof item === "string" ? item : String(item)))
        .filter((s) => s.length > 0);
    }
  } catch {}
  const lines = trimmed
    .split(/\n+/)
    .map((line) =>
      line.replace(/^[\d]+[.)]\s*/, "").replace(/^[-*•]\s*/, "").trim(),
    )
    .filter((line) => line.length > 0);
  if (lines.length > 1) return lines;
  return trimmed
    .split(/[;|]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export const applyAssessmentSpec = mutation({
  args: {
    specId: v.id("assessmentSpecs"),
    assignmentId: v.optional(v.id("assignments")),
    overrides: v.optional(
      v.object({
        title: v.optional(v.string()),
        question: v.optional(v.string()),
        wordLimit: v.optional(v.number()),
        dueDate: v.optional(v.string()),
        rubric: v.optional(
          v.array(
            v.object({
              name: v.string(),
              description: v.string(),
              weight: v.number(),
            }),
          ),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const spec = await ctx.db.get(args.specId);
    if (!spec || spec.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const overrides = args.overrides ?? {};

    let rubric:
      | { name: string; description: string; weight: number }[]
      | undefined = overrides.rubric;

    if (!rubric) {
      const criteria = await ctx.db
        .query("extractedRubricCriteria")
        .withIndex("by_assessmentSpec_and_sortOrder", (q) =>
          q.eq("assessmentSpecId", args.specId),
        )
        .order("asc")
        .take(30);

      if (criteria.length > 0) {
        rubric = criteria.map((c) => ({
          name: c.name,
          description: c.description ?? "",
          weight: c.weight ?? 0,
        }));
      }
    }

    const title = overrides.title ?? spec.title;
    const question =
      overrides.question ??
      spec.question ??
      undefined;
    const wordLimit = overrides.wordLimit ?? spec.wordLimit ?? undefined;
    const dueDate = overrides.dueDate ?? spec.deadline ?? undefined;

    let assignmentId: Id<"assignments">;

    if (args.assignmentId) {
      const existing = await ctx.db.get(args.assignmentId);
      if (!existing || existing.tokenIdentifier !== tokenIdentifier) {
        throw new Error("Assignment not found");
      }
      if (existing.moduleId !== spec.moduleId) {
        throw new Error("Assignment and spec must be in the same module");
      }

      await ctx.db.patch(args.assignmentId, {
        title,
        ...(question !== undefined ? { question } : {}),
        ...(wordLimit !== undefined ? { wordLimit } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
        ...(rubric ? { rubric } : {}),
        updatedAt: Date.now(),
      });
      assignmentId = args.assignmentId;
    } else {
      const mod = await ctx.db.get(spec.moduleId);
      if (!mod || mod.tokenIdentifier !== tokenIdentifier) {
        throw new Error("Module not found");
      }

      const now = Date.now();
      assignmentId = await ctx.db.insert("assignments", {
        tokenIdentifier,
        moduleId: spec.moduleId,
        title,
        question,
        wordLimit,
        dueDate,
        rubric,
        stage: "ingest",
        contextVersion: mod.contextVersion ?? 1,
        contextUpdatedAt: mod.contextUpdatedAt ?? now,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(args.specId, {
      assignmentId,
      status: "applied",
      updatedAt: Date.now(),
    });

    const criteria = await ctx.db
      .query("extractedRubricCriteria")
      .withIndex("by_assessmentSpec_and_sortOrder", (q) =>
        q.eq("assessmentSpecId", args.specId),
      )
      .order("asc")
      .take(30);
    for (const c of criteria) {
      await ctx.db.patch(c._id, { status: "applied", updatedAt: Date.now() });
    }

    return assignmentId;
  },
});

export const editAssessmentSpec = mutation({
  args: {
    specId: v.id("assessmentSpecs"),
    title: v.optional(v.string()),
    question: v.optional(v.string()),
    deadline: v.optional(v.string()),
    weight: v.optional(v.number()),
    wordLimit: v.optional(v.number()),
    referencingRule: v.optional(v.string()),
    submissionFormat: v.optional(v.string()),
    uncertain: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { specId, ...updates } = args;
    const spec = await ctx.db.get(specId);
    if (!spec || spec.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const patch: Record<string, unknown> = {
      updatedAt: Date.now(),
      status: "needs_review" as const,
    };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(specId, patch);
    return specId;
  },
});

export const rejectAssessmentSpec = mutation({
  args: { specId: v.id("assessmentSpecs") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const spec = await ctx.db.get(args.specId);
    if (!spec || spec.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.specId, {
      status: "rejected",
      updatedAt: Date.now(),
    });

    const criteria = await ctx.db
      .query("extractedRubricCriteria")
      .withIndex("by_assessmentSpec", (q) =>
        q.eq("assessmentSpecId", args.specId),
      )
      .take(30);
    for (const c of criteria) {
      await ctx.db.patch(c._id, { status: "rejected", updatedAt: Date.now() });
    }

    return args.specId;
  },
});

export const applyModuleFact = mutation({
  args: { factId: v.id("moduleFacts") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const fact = await ctx.db.get(args.factId);
    if (!fact || fact.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const mod = await ctx.db.get(fact.moduleId);
    if (!mod || mod.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Module not found");
    }

    const now = Date.now();
    const patch: Record<string, unknown> = { updatedAt: now };

    switch (fact.field) {
      case "title":
        patch.title = fact.value;
        break;
      case "code":
        patch.code = fact.value;
        break;
      case "academic_year":
        patch.academicYear = fact.value;
        break;
      case "semester":
        patch.semester = fact.value;
        break;
      case "description":
        patch.description = fact.value;
        break;
      case "themes":
        patch.themes = parseListValue(fact.value);
        break;
      case "concepts":
        patch.concepts = parseListValue(fact.value);
        break;
      case "learning_outcomes":
        patch.learningOutcomes = parseListValue(fact.value);
        break;
      default:
        break;
    }

    const contextFields = new Set([
      "themes",
      "concepts",
      "learning_outcomes",
    ]);
    if (contextFields.has(fact.field)) {
      patch.contextVersion = (mod.contextVersion ?? 0) + 1;
      patch.contextUpdatedAt = now;
    }

    await ctx.db.patch(fact.moduleId, patch);
    await ctx.db.patch(args.factId, { status: "applied", updatedAt: now });

    return fact.moduleId;
  },
});

export const rejectModuleFact = mutation({
  args: { factId: v.id("moduleFacts") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const fact = await ctx.db.get(args.factId);
    if (!fact || fact.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.factId, {
      status: "rejected",
      updatedAt: Date.now(),
    });
    return args.factId;
  },
});

export const applyWeeklyTopic = mutation({
  args: { topicId: v.id("weeklyTopics") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const topic = await ctx.db.get(args.topicId);
    if (!topic || topic.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.topicId, {
      status: "applied",
      updatedAt: Date.now(),
    });
    return args.topicId;
  },
});

export const rejectWeeklyTopic = mutation({
  args: { topicId: v.id("weeklyTopics") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const topic = await ctx.db.get(args.topicId);
    if (!topic || topic.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.topicId, {
      status: "rejected",
      updatedAt: Date.now(),
    });
    return args.topicId;
  },
});

export const applyRequiredReading = mutation({
  args: {
    readingId: v.id("requiredReadings"),
    createSource: v.optional(v.boolean()),
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const reading = await ctx.db.get(args.readingId);
    if (!reading || reading.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    let sourceId = reading.sourceId;

    if (args.createSource && !sourceId) {
      const now = Date.now();
      sourceId = await ctx.db.insert("sources", {
        tokenIdentifier,
        moduleId: reading.moduleId,
        folderId: args.folderId,
        title: reading.title,
        authors: reading.authors,
        year: reading.year,
        type: "book",
        status: "placeholder",
        citation: reading.citation,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(args.readingId, {
      status: "applied",
      ...(sourceId ? { sourceId } : {}),
      updatedAt: Date.now(),
    });
    return args.readingId;
  },
});

export const rejectRequiredReading = mutation({
  args: { readingId: v.id("requiredReadings") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const reading = await ctx.db.get(args.readingId);
    if (!reading || reading.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.readingId, {
      status: "rejected",
      updatedAt: Date.now(),
    });
    return args.readingId;
  },
});

export const rejectAllForFile = mutation({
  args: { importedFileId: v.id("importedFiles") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const file = await ctx.db.get(args.importedFileId);
    if (!file || file.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const now = Date.now();

    const specs = await ctx.db
      .query("assessmentSpecs")
      .withIndex("by_importedFile", (q) =>
        q.eq("importedFileId", args.importedFileId),
      )
      .take(50);
    for (const spec of specs) {
      if (spec.status === "extracted") {
        await ctx.db.patch(spec._id, { status: "rejected", updatedAt: now });
      }
    }

    const facts = await ctx.db
      .query("moduleFacts")
      .withIndex("by_importedFile", (q) =>
        q.eq("importedFileId", args.importedFileId),
      )
      .take(100);
    for (const fact of facts) {
      if (fact.status === "extracted") {
        await ctx.db.patch(fact._id, { status: "rejected", updatedAt: now });
      }
    }

    const topics = await ctx.db
      .query("weeklyTopics")
      .withIndex("by_importedFile", (q) =>
        q.eq("importedFileId", args.importedFileId),
      )
      .take(100);
    for (const topic of topics) {
      if (topic.status === "extracted" || topic.status === undefined) {
        await ctx.db.patch(topic._id, { status: "rejected", updatedAt: now });
      }
    }

    const readings = await ctx.db
      .query("requiredReadings")
      .withIndex("by_importedFile", (q) =>
        q.eq("importedFileId", args.importedFileId),
      )
      .take(100);
    for (const reading of readings) {
      if (reading.status === "extracted" || reading.status === undefined) {
        await ctx.db.patch(reading._id, {
          status: "rejected",
          updatedAt: now,
        });
      }
    }

    return args.importedFileId;
  },
});
