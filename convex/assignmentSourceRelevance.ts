import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

const relevanceTypeValidator = v.union(
  v.literal("core"),
  v.literal("supporting"),
  v.literal("opposing"),
  v.literal("theoretical"),
  v.literal("empirical_case"),
  v.literal("methodological"),
  v.literal("background"),
  v.literal("not_relevant"),
);

function now() {
  return new Date().toISOString();
}

function view(row: any) {
  return {
    id: row._id,
    userId: row.userId,
    assignmentId: row.assignmentId,
    moduleId: row.moduleId,
    sourceId: row.sourceId,
    relevanceType: row.relevanceType,
    relevanceNote: row.relevanceNote || "",
    usefulEvidence: row.usefulEvidence || "",
    usefulQuotes: row.usefulQuotes || "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    _creationTime: row._creationTime,
  };
}

export const listByAssignment = query({
  args: { userId: v.string(), assignmentId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, assignmentId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const assignment = await ctx.db.get(assignmentId as any) as any;
    if (!assignment || assignment.userId !== userId) return [];
    const rows = await ctx.db
      .query("assignmentSourceRelevance")
      .withIndex("by_assignmentId", (q) => q.eq("assignmentId", assignmentId))
      .order("desc")
      .take(500);
    return rows.filter((row) => row.userId === userId).map(view);
  },
});

export const upsert = mutation({
  args: {
    userId: v.string(),
    assignmentId: v.string(),
    moduleId: v.string(),
    sourceId: v.string(),
    relevanceType: relevanceTypeValidator,
    relevanceNote: v.optional(v.string()),
    usefulEvidence: v.optional(v.string()),
    usefulQuotes: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { userId, assignmentId, moduleId, sourceId, serverSecret, ...data }) => {
    requireServerSecret(serverSecret);
    const assignment = await ctx.db.get(assignmentId as any) as any;
    if (!assignment || assignment.userId !== userId) throw new Error("Assignment not found");
    const existing = await ctx.db
      .query("assignmentSourceRelevance")
      .withIndex("by_userId_assignmentId_sourceId", (q) =>
        q.eq("userId", userId).eq("assignmentId", assignmentId).eq("sourceId", sourceId)
      )
      .take(1);
    const patch: Record<string, unknown> = { updatedAt: now(), ...data };
    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, patch);
      const updated = await ctx.db.get(existing[0]._id);
      return view(updated);
    }
    const timestamp = now();
    const rowId = await ctx.db.insert("assignmentSourceRelevance", {
      userId,
      assignmentId,
      moduleId,
      sourceId,
      relevanceType: "background",
      relevanceNote: "",
      usefulEvidence: "",
      usefulQuotes: "",
      createdAt: timestamp,
      updatedAt: timestamp,
      ...patch,
    });
    const row = await ctx.db.get(rowId);
    return view(row);
  },
});

export const remove = mutation({
  args: { userId: v.string(), relevanceId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, relevanceId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const row = await ctx.db.get(relevanceId as any) as any;
    if (!row || row.userId !== userId) throw new Error("Relevance record not found");
    await ctx.db.delete(relevanceId as any);
    return true;
  },
});
