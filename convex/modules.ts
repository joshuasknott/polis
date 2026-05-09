import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    return await ctx.db
      .query("modules")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .order("desc")
      .take(100);
  },
});

export const get = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const mod = await ctx.db.get(args.moduleId);
    if (!mod || mod.tokenIdentifier !== tokenIdentifier) return null;
    return mod;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    semester: v.optional(v.string()),
    colour: v.optional(v.string()),
    themes: v.optional(v.array(v.string())),
    concepts: v.optional(v.array(v.string())),
    learningOutcomes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const now = Date.now();

    const moduleId = await ctx.db.insert("modules", {
      ...args,
      tokenIdentifier,
      contextVersion: 1,
      contextUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const defaultFolders = [
      { name: "Module Info", type: "module_info" as const, sortOrder: 0 },
      { name: "Readings", type: "readings" as const, sortOrder: 1 },
      {
        name: "Lecture and Seminar Material",
        type: "lecture_material" as const,
        sortOrder: 2,
      },
      {
        name: "Source Notes",
        type: "source_notes" as const,
        sortOrder: 3,
      },
      {
        name: "Assignments",
        type: "assignments" as const,
        sortOrder: 4,
      },
      {
        name: "Drafts and Reviews",
        type: "drafts_reviews" as const,
        sortOrder: 5,
      },
      {
        name: "Submissions",
        type: "submissions" as const,
        sortOrder: 6,
      },
    ];

    for (const f of defaultFolders) {
      await ctx.db.insert("folders", {
        tokenIdentifier,
        moduleId,
        name: f.name,
        type: f.type,
        sortOrder: f.sortOrder,
        createdAt: now,
        updatedAt: now,
      });
    }

    return moduleId;
  },
});

export const update = mutation({
  args: {
    moduleId: v.id("modules"),
    title: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    semester: v.optional(v.string()),
    colour: v.optional(v.string()),
    themes: v.optional(v.array(v.string())),
    concepts: v.optional(v.array(v.string())),
    learningOutcomes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { moduleId, ...updates } = args;
    const mod = await ctx.db.get(moduleId);
    if (!mod || mod.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const contextFields = ["themes", "concepts", "learningOutcomes"] as const;
    const hasContextUpdate = contextFields.some(
      (f) => updates[f] !== undefined,
    );

    await ctx.db.patch(moduleId, {
      ...updates,
      ...(hasContextUpdate
        ? {
            contextVersion: (mod.contextVersion ?? 0) + 1,
            contextUpdatedAt: Date.now(),
          }
        : {}),
      updatedAt: Date.now(),
    });
    return moduleId;
  },
});

export const remove = mutation({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const mod = await ctx.db.get(args.moduleId);
    if (!mod || mod.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.moduleId);
    return args.moduleId;
  },
});

export const listWithCounts = query({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const mods = await ctx.db
      .query("modules")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .order("desc")
      .take(100);

    const results = [];
    for (const mod of mods) {
      const sourceCount = (
        await ctx.db
          .query("sources")
          .withIndex("by_module", (q) => q.eq("moduleId", mod._id))
          .take(1000)
      ).length;

      const assignmentCount = (
        await ctx.db
          .query("assignments")
          .withIndex("by_module", (q) => q.eq("moduleId", mod._id))
          .take(1000)
      ).length;

      results.push({
        ...mod,
        sourceCount,
        assignmentCount,
      });
    }
    return results;
  },
});

export const getWorkspaceBundle = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const mod = await ctx.db.get(args.moduleId);
    if (!mod || mod.tokenIdentifier !== tokenIdentifier) return null;

    const folders = await ctx.db
      .query("folders")
      .withIndex("by_module_and_sortOrder", (q) =>
        q.eq("moduleId", args.moduleId),
      )
      .order("asc")
      .take(100);

    const sources = await ctx.db
      .query("sources")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .order("desc")
      .take(200);

    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .order("desc")
      .take(100);

    return {
      module: mod,
      folders,
      sources,
      assignments,
    };
  },
});
