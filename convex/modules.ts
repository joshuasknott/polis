import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

function makeWorkspaceCode(title: string) {
  const initials = title
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-z0-9]/g, ""))
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]!.toUpperCase())
    .join("");
  return initials || "WS";
}

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
    const now = Date.now();
    const code = args.code?.trim() || makeWorkspaceCode(args.title);

    const moduleId = await ctx.db.insert("modules", {
      ...args,
      code,
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
        name: "Lecture Material",
        type: "lecture_material" as const,
        sortOrder: 2,
      },
      {
        name: "Briefs/Rubrics",
        type: "briefs_rubrics" as const,
        sortOrder: 3,
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

    await ctx.runMutation(internal.cleanup.deleteModuleData, {
      moduleId: args.moduleId,
    });
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
        contextVersion: mod.contextVersion ?? 1,
        contextUpdatedAt: mod.contextUpdatedAt ?? mod.createdAt,
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

    const importBatches = await ctx.db
      .query("importBatches")
      .withIndex("by_module_and_createdAt", (q) =>
        q.eq("moduleId", args.moduleId),
      )
      .order("desc")
      .take(20);

    const importedFiles: Doc<"importedFiles">[] = [];
    for (const batch of importBatches) {
      const files = await ctx.db
        .query("importedFiles")
        .withIndex("by_batch", (q) => q.eq("batchId", batch._id))
        .order("asc")
        .take(200);
      importedFiles.push(...files);
    }

    const aiActions = await ctx.db
      .query("aiActions")
      .withIndex("by_module_and_createdAt", (q) =>
        q.eq("moduleId", args.moduleId),
      )
      .order("desc")
      .take(100);

    const relevanceSignals = await ctx.db
      .query("sourceRelevanceSignals")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .order("desc")
      .take(100);

    const gapSignals = await ctx.db
      .query("sourceGapSignals")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .order("desc")
      .take(100);

    return {
      module: {
        ...mod,
        contextVersion: mod.contextVersion ?? 1,
        contextUpdatedAt: mod.contextUpdatedAt ?? mod.createdAt,
      },
      folders,
      sources,
      assignments,
      importBatches,
      importedFiles,
      aiActions,
      relevanceSignals,
      gapSignals,
    };
  },
});
