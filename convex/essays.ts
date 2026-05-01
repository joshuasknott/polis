import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

export const getByUserId = query({
  args: { userId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const essays = await ctx.db.query("essays").withIndex("by_userId", (q) => q.eq("userId", userId)).order("desc").collect();

    const results = [];
    for (const essay of essays) {
      const mod = await ctx.db.get(essay.moduleId as any) as any;
      results.push({
        id: essay._id,
        moduleId: essay.moduleId,
        title: essay.title,
        question: essay.question,
        thesis: essay.thesis,
        targetWordCount: essay.targetWordCount,
        status: essay.status,
        _creationTime: essay._creationTime,
        module: mod ? { title: mod.title, code: mod.code } : null,
      });
    }
    return results;
  },
});

export const getByModuleId = query({
  args: { userId: v.string(), moduleId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, moduleId, serverSecret }) => {
    requireServerSecret(serverSecret);
    return ctx.db.query("essays").withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", moduleId)).order("desc").collect();
  },
});

export const getUpcoming = query({
  args: { userId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const allEssays = await ctx.db.query("essays").withIndex("by_userId_status", (q) => q.eq("userId", userId).eq("status", "planning")).order("desc").collect();
    const essays = allEssays.slice(0, 5);

    const results = [];
    for (const essay of [...essays]) {
      const mod = await ctx.db.get(essay.moduleId as any) as any;
      results.push({
        id: essay._id,
        moduleId: essay.moduleId,
        title: essay.title,
        question: essay.question,
        status: essay.status,
        module: mod ? { title: mod.title } : null,
        _creationTime: essay._creationTime,
      });
    }
    return results;
  },
});

export const getById = query({
  args: { userId: v.string(), essayId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, essayId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const essay = await ctx.db.get(essayId as any) as any;
    if (!essay || essay.userId !== userId) return null;

    const mod = await ctx.db.get(essay.moduleId as any) as any;
    const sections = await ctx.db.query("essaySections").withIndex("by_essayId", (q) => q.eq("essayId", essayId)).order("asc").collect();
    const evidence = await ctx.db.query("evidenceItems").withIndex("by_essayId", (q) => q.eq("essayId", essayId)).collect();

    const evidenceWithSources = [];
    for (const ev of evidence) {
      const source = ev.sourceId ? await ctx.db.get(ev.sourceId as any) as any : null;
      const chunk = ev.sourceChunkId ? await ctx.db.get(ev.sourceChunkId as any) as any : null;
      evidenceWithSources.push({
        id: ev._id,
        essayId: ev.essayId,
        sectionId: ev.sectionId,
        sourceId: ev.sourceId,
        sourceChunkId: ev.sourceChunkId,
        claim: ev.claim,
        evidenceText: ev.evidenceText,
        explanation: ev.explanation,
        citation: ev.citation,
        tags: ev.tags,
        source: source ? { title: source.title, authors: source.authors, year: source.year } : null,
        sourceChunk: chunk ? { text: chunk.text } : null,
      });
    }

    return {
      id: essay._id,
      userId: essay.userId,
      moduleId: essay.moduleId,
      title: essay.title,
      question: essay.question,
      thesis: essay.thesis,
      targetWordCount: essay.targetWordCount,
      status: essay.status,
      draftContent: essay.draftContent,
      _creationTime: essay._creationTime,
      module: mod ? { title: mod.title, code: mod.code } : null,
      sections: sections.map((s) => ({
        id: s._id,
        essayId: s.essayId,
        title: s.title,
        purpose: s.purpose,
        targetWordCount: s.targetWordCount,
        displayOrder: s.displayOrder,
        notes: s.notes,
      })),
      evidence: evidenceWithSources,
    };
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    moduleId: v.string(),
    title: v.string(),
    question: v.optional(v.string()),
    thesis: v.optional(v.string()),
    targetWordCount: v.optional(v.number()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const mod = await ctx.db.get(args.moduleId as any) as any;
    if (!mod || mod.userId !== args.userId) throw new Error("Module not found");
    return ctx.db.insert("essays", {
      userId: args.userId,
      moduleId: args.moduleId,
      title: args.title,
      question: args.question,
      thesis: args.thesis,
      targetWordCount: args.targetWordCount ?? 3000,
      status: "planning",
    });
  },
});

export const update = mutation({
  args: {
    essayId: v.string(),
    title: v.optional(v.string()),
    question: v.optional(v.string()),
    thesis: v.optional(v.string()),
    targetWordCount: v.optional(v.number()),
    status: v.optional(v.string()),
    draftContent: v.optional(v.string()),
    userId: v.string(),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { essayId, userId, serverSecret, ...data }) => {
    requireServerSecret(serverSecret);
    const essay = await ctx.db.get(essayId as any) as any;
    if (!essay || essay.userId !== userId) throw new Error("Essay not found");
    const patch: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) patch[key] = val;
    }
    await ctx.db.patch(essayId as any, patch);
  },
});

export const createSection = mutation({
  args: {
    essayId: v.string(),
    title: v.string(),
    purpose: v.optional(v.string()),
    targetWordCount: v.optional(v.number()),
    displayOrder: v.optional(v.number()),
    notes: v.optional(v.string()),
    userId: v.string(),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const essay = await ctx.db.get(args.essayId as any) as any;
    if (!essay || essay.userId !== args.userId) throw new Error("Essay not found");
    return ctx.db.insert("essaySections", {
      essayId: args.essayId,
      title: args.title,
      purpose: args.purpose,
      targetWordCount: args.targetWordCount ?? 0,
      displayOrder: args.displayOrder ?? 0,
      notes: args.notes,
    });
  },
});

export const updateSection = mutation({
  args: {
    sectionId: v.string(),
    title: v.optional(v.string()),
    purpose: v.optional(v.string()),
    targetWordCount: v.optional(v.number()),
    displayOrder: v.optional(v.number()),
    notes: v.optional(v.string()),
    userId: v.string(),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { sectionId, userId, serverSecret, ...data }) => {
    requireServerSecret(serverSecret);
    const section = await ctx.db.get(sectionId as any) as any;
    const essay = section ? await ctx.db.get(section.essayId as any) as any : null;
    if (!essay || essay.userId !== userId) throw new Error("Section not found");
    const patch: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) patch[key] = val;
    }
    await ctx.db.patch(sectionId as any, patch);
  },
});

export const addEvidence = mutation({
  args: {
    essayId: v.string(),
    sectionId: v.optional(v.string()),
    sourceId: v.optional(v.string()),
    sourceChunkId: v.optional(v.string()),
    claim: v.string(),
    evidenceText: v.optional(v.string()),
    explanation: v.optional(v.string()),
    citation: v.optional(v.string()),
    tags: v.optional(v.string()),
    userId: v.string(),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const essay = await ctx.db.get(args.essayId as any) as any;
    if (!essay || essay.userId !== args.userId) throw new Error("Essay not found");
    if (args.sourceId) {
      const source = await ctx.db.get(args.sourceId as any) as any;
      if (!source || source.userId !== args.userId) throw new Error("Source not found");
    }
    const { userId, serverSecret, ...data } = args;
    return ctx.db.insert("evidenceItems", data);
  },
});

export const removeEvidence = mutation({
  args: { evidenceId: v.string(), userId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { evidenceId, userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const evidence = await ctx.db.get(evidenceId as any) as any;
    const essay = evidence ? await ctx.db.get(evidence.essayId as any) as any : null;
    if (!essay || essay.userId !== userId) throw new Error("Evidence not found");
    await ctx.db.delete(evidenceId as any);
  },
});
