import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

export const getByUserId = query({
  args: { userId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const modules = await ctx.db.query("modules").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();

    const results = [];
    for (const mod of modules) {
      const sourceCount = (await ctx.db.query("sources").withIndex("by_moduleId", (q) => q.eq("moduleId", mod._id)).collect()).length;
      const essayCount = (await ctx.db.query("essays").withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", mod._id)).collect()).length;
      results.push({
        id: mod._id,
        code: mod.code,
        title: mod.title,
        description: mod.description,
        academicYear: mod.academicYear,
        semester: mod.semester,
        colour: mod.colour,
        _creationTime: mod._creationTime,
        _sourceCount: sourceCount,
        _essayCount: essayCount,
      });
    }

    return results;
  },
});

export const getById = query({
  args: { userId: v.string(), moduleId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, moduleId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const mod = await ctx.db.get(moduleId as any) as any;
    if (!mod || mod.userId !== userId) return null;

    const folders = await ctx.db.query("folders").withIndex("by_moduleId", (q) => q.eq("moduleId", moduleId)).order("asc").collect();
    const sourceCount = (await ctx.db.query("sources").withIndex("by_moduleId", (q) => q.eq("moduleId", moduleId)).collect()).length;
    const essayCount = (await ctx.db.query("essays").withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", moduleId)).collect()).length;

    return {
      id: mod._id,
      code: mod.code,
      title: mod.title,
      description: mod.description,
      academicYear: mod.academicYear,
      semester: mod.semester,
      colour: mod.colour,
      _creationTime: mod._creationTime,
      _sourceCount: sourceCount,
      _essayCount: essayCount,
      folders: folders.map((f) => ({
        id: f._id,
        name: f.name,
        type: f.type,
        displayOrder: f.displayOrder,
      })),
    };
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    code: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    semester: v.optional(v.string()),
    colour: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    return ctx.db.insert("modules", {
      userId: args.userId,
      code: args.code,
      title: args.title,
      description: args.description || "",
      academicYear: args.academicYear || "",
      semester: args.semester || "",
      colour: args.colour || "#1e3a5f",
    });
  },
});

export const update = mutation({
  args: {
    moduleId: v.string(),
    code: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    semester: v.optional(v.string()),
    colour: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { moduleId, serverSecret, ...data }) => {
    requireServerSecret(serverSecret);
    await ctx.db.patch(moduleId as any, data);
  },
});

export const createWithFolders = mutation({
  args: {
    userId: v.string(),
    code: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    semester: v.optional(v.string()),
    colour: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const moduleId = await ctx.db.insert("modules", {
      userId: args.userId,
      code: args.code,
      title: args.title,
      description: args.description || "",
      academicYear: args.academicYear || "",
      semester: args.semester || "",
      colour: args.colour || "#1e3a5f",
    });

    const folderDefs = [
      { name: "Module Info", type: "module_info", displayOrder: 0 },
      { name: "Readings", type: "readings", displayOrder: 1 },
      { name: "Lecture and Seminar Material", type: "lectures", displayOrder: 2 },
      { name: "Source Notes", type: "source_notes", displayOrder: 3 },
      { name: "Essay Plans", type: "essay_plans", displayOrder: 4 },
      { name: "Drafts and Feedback", type: "drafts", displayOrder: 5 },
      { name: "Final Submission", type: "final_submission", displayOrder: 6 },
    ];

    for (const fd of folderDefs) {
      await ctx.db.insert("folders", {
        moduleId,
        name: fd.name,
        type: fd.type,
        displayOrder: fd.displayOrder,
      });
    }

    return moduleId;
  },
});
