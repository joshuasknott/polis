import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

export const getByModuleId = query({
  args: { userId: v.string(), moduleId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, moduleId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const mod = await ctx.db.get(moduleId as any) as any;
    if (!mod || mod.userId !== userId) return [];
    const folders = await ctx.db.query("folders").withIndex("by_moduleId", (q) => q.eq("moduleId", moduleId)).collect();
    return folders
      .map((f) => ({ id: f._id, name: f.name, type: f.type, displayOrder: f.displayOrder ?? 0 }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

export const create = mutation({
  args: {
    moduleId: v.string(),
    name: v.string(),
    type: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    userId: v.string(),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const mod = await ctx.db.get(args.moduleId as any) as any;
    if (!mod || mod.userId !== args.userId) throw new Error("Module not found");
    return ctx.db.insert("folders", {
      moduleId: args.moduleId,
      name: args.name,
      type: args.type || "custom",
      displayOrder: args.displayOrder ?? 0,
    });
  },
});
