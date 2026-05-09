import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";
import {
  retrieveKeyword,
  type RetrievalScope,
  type RetrievalResult,
  type InsufficientEvidenceWarning,
} from "./lib/retrieval";

const SCOPE_VALIDATOR = v.union(
  v.literal("whole_module"),
  v.literal("current_folder"),
  v.literal("selected_sources"),
  v.literal("assignment"),
  v.literal("source"),
);

export const searchKeyword = query({
  args: {
    query: v.string(),
    scope: SCOPE_VALIDATOR,
    moduleId: v.optional(v.id("modules")),
    folderId: v.optional(v.id("folders")),
    sourceIds: v.optional(v.array(v.id("sources"))),
    assignmentId: v.optional(v.id("assignments")),
    sourceId: v.optional(v.id("sources")),
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);

    if (!args.query.trim()) {
      return { results: [] as RetrievalResult[], evidenceWarnings: [] as InsufficientEvidenceWarning[] };
    }

    return await retrieveKeyword(
      ctx,
      args.query,
      args.scope as RetrievalScope,
      {
        moduleId: args.moduleId,
        folderId: args.folderId,
        sourceIds: args.sourceIds,
        assignmentId: args.assignmentId,
        sourceId: args.sourceId,
      },
      tokenIdentifier,
      args.maxResults ?? 20,
    );
  },
});

export const searchModule = query({
  args: {
    query: v.string(),
    moduleId: v.id("modules"),
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);

    if (!args.query.trim()) {
      return { results: [] as RetrievalResult[], evidenceWarnings: [] as InsufficientEvidenceWarning[] };
    }

    return await retrieveKeyword(
      ctx,
      args.query,
      "whole_module",
      { moduleId: args.moduleId },
      tokenIdentifier,
      args.maxResults ?? 20,
    );
  },
});

export const searchFolder = query({
  args: {
    query: v.string(),
    moduleId: v.id("modules"),
    folderId: v.id("folders"),
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const mod = await ctx.db.get(args.moduleId);
    if (!mod || mod.tokenIdentifier !== tokenIdentifier) {
      return { results: [] as RetrievalResult[], evidenceWarnings: [] as InsufficientEvidenceWarning[] };
    }

    if (!args.query.trim()) {
      return { results: [] as RetrievalResult[], evidenceWarnings: [] as InsufficientEvidenceWarning[] };
    }

    return await retrieveKeyword(
      ctx,
      args.query,
      "current_folder",
      { folderId: args.folderId },
      tokenIdentifier,
      args.maxResults ?? 20,
    );
  },
});

export const searchSources = query({
  args: {
    query: v.string(),
    sourceIds: v.array(v.id("sources")),
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);

    if (!args.query.trim() || args.sourceIds.length === 0) {
      return { results: [] as RetrievalResult[], evidenceWarnings: [] as InsufficientEvidenceWarning[] };
    }

    return await retrieveKeyword(
      ctx,
      args.query,
      "selected_sources",
      { sourceIds: args.sourceIds },
      tokenIdentifier,
      args.maxResults ?? 20,
    );
  },
});

export const searchAssignment = query({
  args: {
    query: v.string(),
    assignmentId: v.id("assignments"),
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      return { results: [] as RetrievalResult[], evidenceWarnings: [] as InsufficientEvidenceWarning[] };
    }

    if (!args.query.trim()) {
      return { results: [] as RetrievalResult[], evidenceWarnings: [] as InsufficientEvidenceWarning[] };
    }

    return await retrieveKeyword(
      ctx,
      args.query,
      "assignment",
      { assignmentId: args.assignmentId },
      tokenIdentifier,
      args.maxResults ?? 20,
    );
  },
});

export const searchSource = query({
  args: {
    query: v.string(),
    sourceId: v.id("sources"),
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);

    if (!args.query.trim()) {
      return { results: [] as RetrievalResult[], evidenceWarnings: [] as InsufficientEvidenceWarning[] };
    }

    return await retrieveKeyword(
      ctx,
      args.query,
      "source",
      { sourceId: args.sourceId },
      tokenIdentifier,
      args.maxResults ?? 20,
    );
  },
});
