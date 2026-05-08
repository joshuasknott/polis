import { queryGeneric as query } from "convex/server";
import { v } from "convex/values";

export const listForSource = query({
  args: { sourceId: v.id("sources") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sourceNotes")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .order("desc")
      .collect();
  },
});
