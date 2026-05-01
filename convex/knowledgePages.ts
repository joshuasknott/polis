import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

const knowledgePageTypeValidator = v.union(
  v.literal("source_brief"),
  v.literal("concept"),
  v.literal("theory"),
  v.literal("author"),
  v.literal("case"),
  v.literal("debate"),
  v.literal("comparison"),
  v.literal("contradiction"),
  v.literal("synthesis"),
  v.literal("essay_pack"),
);

function now() {
  return new Date().toISOString();
}

function view(page: any) {
  return {
    id: page._id,
    userId: page.userId,
    moduleId: page.moduleId,
    title: page.title,
    type: page.type,
    content: page.content,
    linkedSourceIds: page.linkedSourceIds || [],
    linkedPageIds: page.linkedPageIds || [],
    tags: page.tags || [],
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    _creationTime: page._creationTime,
  };
}

async function requireModule(ctx: any, userId: string, moduleId: string) {
  const mod = await ctx.db.get(moduleId as any) as any;
  if (!mod || mod.userId !== userId) throw new Error("Module not found");
  return mod;
}

export const listByModule = query({
  args: { userId: v.string(), moduleId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, moduleId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const mod = await ctx.db.get(moduleId as any) as any;
    if (!mod || mod.userId !== userId) return [];
    const pages = await ctx.db
      .query("knowledgePages")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", moduleId))
      .order("desc")
      .take(1000);
    return pages.map(view);
  },
});

export const getById = query({
  args: { userId: v.string(), pageId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, pageId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const page = await ctx.db.get(pageId as any) as any;
    if (!page || page.userId !== userId) return null;
    return view(page);
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    moduleId: v.string(),
    title: v.string(),
    type: knowledgePageTypeValidator,
    content: v.string(),
    linkedSourceIds: v.optional(v.array(v.string())),
    linkedPageIds: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    await requireModule(ctx, args.userId, args.moduleId);
    const timestamp = now();
    const pageId = await ctx.db.insert("knowledgePages", {
      userId: args.userId,
      moduleId: args.moduleId,
      title: args.title,
      type: args.type,
      content: args.content,
      linkedSourceIds: args.linkedSourceIds || [],
      linkedPageIds: args.linkedPageIds || [],
      tags: args.tags || [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const page = await ctx.db.get(pageId);
    return view(page);
  },
});

export const update = mutation({
  args: {
    userId: v.string(),
    pageId: v.string(),
    title: v.optional(v.string()),
    type: v.optional(knowledgePageTypeValidator),
    content: v.optional(v.string()),
    linkedSourceIds: v.optional(v.array(v.string())),
    linkedPageIds: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { userId, pageId, serverSecret, ...data }) => {
    requireServerSecret(serverSecret);
    const page = await ctx.db.get(pageId as any) as any;
    if (!page || page.userId !== userId) throw new Error("Knowledge page not found");
    const patch: Record<string, unknown> = { updatedAt: now() };
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) patch[key] = val;
    }
    await ctx.db.patch(pageId as any, patch);
    const updated = await ctx.db.get(pageId as any);
    return view(updated);
  },
});

export const remove = mutation({
  args: { userId: v.string(), pageId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, pageId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const page = await ctx.db.get(pageId as any) as any;
    if (!page || page.userId !== userId) throw new Error("Knowledge page not found");
    await ctx.db.delete(pageId as any);
    return true;
  },
});

export const createSourceBrief = mutation({
  args: {
    userId: v.string(),
    sourceId: v.string(),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { userId, sourceId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const source = await ctx.db.get(sourceId as any) as any;
    if (!source || source.userId !== userId) throw new Error("Source not found");
    await requireModule(ctx, userId, source.moduleId);

    const existingPages = await ctx.db
      .query("knowledgePages")
      .withIndex("by_userId_moduleId_type", (q) => q.eq("userId", userId).eq("moduleId", source.moduleId).eq("type", "source_brief"))
      .take(1000);
    const existing = existingPages.find((page) => page.linkedSourceIds.includes(sourceId));
    if (existing) return view(existing);

    const author = source.author || source.authors || "Unknown";
    const concepts = Array.isArray(source.tags)
      ? source.tags.join(", ")
      : source.concepts || "Add key concepts after reading.";
    const content = `# Source Brief: ${source.title}

## Core Argument
${source.keyArguments || source.summary || "Add the source's core argument here."}

## Key Concepts
${concepts}

## Useful Evidence
${source.summary || "Add useful evidence, methods, findings, or examples from the source."}

## Relevant Quotes / Page References
Add only quotes and page references that are present in the source. Do not invent page numbers.

## Critique / Limitations
Add limitations, assumptions, methods issues, or contested points.

## Relevance to Assessment
Link this source to the module assessment question and explain where it helps.

## Possible Essay Uses
- Use as evidence for a claim.
- Use as a counterpoint if another source disagrees.
- Use to define or nuance a concept.

## Citation
${source.citation || `${author}${source.year ? ` (${source.year})` : ""}`}`;

    const timestamp = now();
    const pageId = await ctx.db.insert("knowledgePages", {
      userId,
      moduleId: source.moduleId,
      title: `Source brief: ${source.title}`,
      type: "source_brief",
      content,
      linkedSourceIds: [sourceId],
      linkedPageIds: [],
      tags: tagsFromSource(source),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const page = await ctx.db.get(pageId);
    return view(page);
  },
});

function tagsFromSource(source: any) {
  if (Array.isArray(source.tags)) return source.tags;
  if (source.concepts) return source.concepts.split(",").map((concept: string) => concept.trim()).filter(Boolean);
  return [];
}
