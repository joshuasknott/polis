import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

function now() {
  return new Date().toISOString();
}

function view(profile: any) {
  return {
    id: profile._id,
    userId: profile.userId,
    moduleId: profile.moduleId,
    summary: profile.summary || "",
    keyThemes: profile.keyThemes || [],
    keyConcepts: profile.keyConcepts || [],
    keyTheories: profile.keyTheories || [],
    keyCases: profile.keyCases || [],
    assessmentSummary: profile.assessmentSummary || "",
    importantReadings: profile.importantReadings || [],
    academicExpectations: profile.academicExpectations || "",
    updatedAt: profile.updatedAt,
    _creationTime: profile._creationTime,
  };
}

async function requireModule(ctx: any, userId: string, moduleId: string) {
  const mod = await ctx.db.get(moduleId as any) as any;
  if (!mod || mod.userId !== userId) throw new Error("Module not found");
}

export const getByModule = query({
  args: { userId: v.string(), moduleId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, moduleId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const mod = await ctx.db.get(moduleId as any) as any;
    if (!mod || mod.userId !== userId) return null;
    const profiles = await ctx.db
      .query("moduleProfiles")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", moduleId))
      .take(1);
    return profiles.length > 0 ? view(profiles[0]) : null;
  },
});

export const upsert = mutation({
  args: {
    userId: v.string(),
    moduleId: v.string(),
    summary: v.optional(v.string()),
    keyThemes: v.optional(v.array(v.string())),
    keyConcepts: v.optional(v.array(v.string())),
    keyTheories: v.optional(v.array(v.string())),
    keyCases: v.optional(v.array(v.string())),
    assessmentSummary: v.optional(v.string()),
    importantReadings: v.optional(v.array(v.string())),
    academicExpectations: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { userId, moduleId, serverSecret, ...data }) => {
    requireServerSecret(serverSecret);
    await requireModule(ctx, userId, moduleId);
    const existing = await ctx.db
      .query("moduleProfiles")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", moduleId))
      .take(1);
    const patch: Record<string, unknown> = { updatedAt: now() };
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) patch[key] = val;
    }
    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, patch);
      const updated = await ctx.db.get(existing[0]._id);
      return view(updated);
    }
    const profileId = await ctx.db.insert("moduleProfiles", {
      userId,
      moduleId,
      summary: "",
      keyThemes: [],
      keyConcepts: [],
      keyTheories: [],
      keyCases: [],
      assessmentSummary: "",
      importantReadings: [],
      academicExpectations: "",
      updatedAt: now(),
      ...patch,
    });
    const profile = await ctx.db.get(profileId);
    return view(profile);
  },
});

export const updateFields = mutation({
  args: {
    userId: v.string(),
    moduleId: v.string(),
    summary: v.optional(v.string()),
    keyThemes: v.optional(v.array(v.string())),
    keyConcepts: v.optional(v.array(v.string())),
    keyTheories: v.optional(v.array(v.string())),
    keyCases: v.optional(v.array(v.string())),
    assessmentSummary: v.optional(v.string()),
    importantReadings: v.optional(v.array(v.string())),
    academicExpectations: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { userId, moduleId, serverSecret, ...data }) => {
    requireServerSecret(serverSecret);
    await requireModule(ctx, userId, moduleId);
    const existing = await ctx.db
      .query("moduleProfiles")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", moduleId))
      .take(1);
    if (existing.length === 0) throw new Error("Module profile not found");
    const patch: Record<string, unknown> = { updatedAt: now() };
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) patch[key] = val;
    }
    await ctx.db.patch(existing[0]._id, patch);
    const updated = await ctx.db.get(existing[0]._id);
    return view(updated);
  },
});
