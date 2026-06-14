import { query, mutation, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { getAuthIdentifier } from "./lib/auth";
import { recommendationStatus, sourceCatalog } from "./lib/validators";

async function getOwnedAssignment(
  ctx: QueryCtx,
  assignmentId: Id<"assignments">,
  tokenIdentifier: string,
): Promise<Doc<"assignments"> | null> {
  const assignment = await ctx.db.get(assignmentId);
  if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) return null;
  return assignment;
}

export const listForAssignment = query({
  args: {
    assignmentId: v.id("assignments"),
    status: v.optional(recommendationStatus),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await getOwnedAssignment(ctx, args.assignmentId, tokenIdentifier);
    if (!assignment) return [];

    if (args.status) {
      return await ctx.db
        .query("sourceRecommendations")
        .withIndex("by_assignment_and_status", (q) =>
          q.eq("assignmentId", args.assignmentId).eq("status", args.status!),
        )
        .order("desc")
        .take(100);
    }

    return await ctx.db
      .query("sourceRecommendations")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("desc")
      .take(100);
  },
});

export const listForRun = query({
  args: { gapAnalysisRunId: v.id("gapAnalysisRuns") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const run = await ctx.db.get(args.gapAnalysisRunId);
    if (!run || run.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("sourceRecommendations")
      .withIndex("by_gapAnalysisRun", (q) =>
        q.eq("gapAnalysisRunId", args.gapAnalysisRunId),
      )
      .order("desc")
      .take(100);
  },
});

export const getByCatalogId = query({
  args: {
    catalog: sourceCatalog,
    catalogId: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const rec = await ctx.db
      .query("sourceRecommendations")
      .withIndex("by_catalog_and_catalogId", (q) =>
        q.eq("catalog", args.catalog).eq("catalogId", args.catalogId),
      )
      .first();
    if (!rec || rec.tokenIdentifier !== tokenIdentifier) return null;
    return rec;
  },
});

export interface RecommendationInput {
  catalog: "crossref" | "openalex" | "semantic_scholar";
  catalogId: string;
  title: string;
  authors?: string;
  year?: number;
  venue?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  matchReason?: string;
  raw?: unknown;
}

export const saveRecommendations = mutation({
  args: {
    assignmentId: v.id("assignments"),
    gapAnalysisRunId: v.optional(v.id("gapAnalysisRuns")),
    recommendations: v.array(
      v.object({
        catalog: sourceCatalog,
        catalogId: v.string(),
        title: v.string(),
        authors: v.optional(v.string()),
        year: v.optional(v.number()),
        venue: v.optional(v.string()),
        doi: v.optional(v.string()),
        url: v.optional(v.string()),
        abstract: v.optional(v.string()),
        matchReason: v.optional(v.string()),
        raw: v.optional(v.any()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await getOwnedAssignment(ctx, args.assignmentId, tokenIdentifier);
    if (!assignment) throw new Error("Not found");

    const now = Date.now();
    const inserted: Id<"sourceRecommendations">[] = [];
    let skippedDuplicates = 0;

    for (const rec of args.recommendations) {
      const existing = await ctx.db
        .query("sourceRecommendations")
        .withIndex("by_catalog_and_catalogId", (q) =>
          q.eq("catalog", rec.catalog).eq("catalogId", rec.catalogId),
        )
        .first();

      if (existing) {
        skippedDuplicates++;
        continue;
      }

      const id = await ctx.db.insert("sourceRecommendations", {
        tokenIdentifier,
        assignmentId: args.assignmentId,
        gapAnalysisRunId: args.gapAnalysisRunId,
        catalog: rec.catalog,
        catalogId: rec.catalogId,
        title: rec.title,
        authors: rec.authors,
        year: rec.year,
        venue: rec.venue,
        doi: rec.doi,
        url: rec.url,
        abstract: rec.abstract,
        status: "recommended",
        matchReason: rec.matchReason,
        raw: rec.raw,
        createdAt: now,
        updatedAt: now,
      });
      inserted.push(id as Id<"sourceRecommendations">);
    }

    return { inserted: inserted.length, skippedDuplicates, total: args.recommendations.length };
  },
});

export const updateStatus = mutation({
  args: {
    recommendationId: v.id("sourceRecommendations"),
    status: recommendationStatus,
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const rec = await ctx.db.get(args.recommendationId);
    if (!rec || rec.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.recommendationId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.recommendationId;
  },
});

export const dismiss = mutation({
  args: { recommendationId: v.id("sourceRecommendations") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const rec = await ctx.db.get(args.recommendationId);
    if (!rec || rec.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }
    await ctx.db.patch(args.recommendationId, {
      status: "dismissed",
      updatedAt: Date.now(),
    });
    return args.recommendationId;
  },
});

export const markAdded = mutation({
  args: { recommendationId: v.id("sourceRecommendations") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const rec = await ctx.db.get(args.recommendationId);
    if (!rec || rec.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }
    await ctx.db.patch(args.recommendationId, {
      status: "added",
      updatedAt: Date.now(),
    });
    return args.recommendationId;
  },
});

export const removeForAssignment = mutation({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await getOwnedAssignment(ctx, args.assignmentId, tokenIdentifier);
    if (!assignment) throw new Error("Not found");

    const BATCH = 100;
    let deleted = 0;
    let hasMore = true;
    while (hasMore) {
      const recs = await ctx.db
        .query("sourceRecommendations")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", args.assignmentId))
        .take(BATCH);
      if (recs.length === 0) break;
      for (const r of recs) {
        await ctx.db.delete(r._id);
        deleted++;
      }
      hasMore = recs.length === BATCH;
    }
    return { deleted };
  },
});
