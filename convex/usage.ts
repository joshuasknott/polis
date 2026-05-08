import { query } from "./_generated/server";
import { getAuthIdentifier } from "./lib/auth";

export const listEvents = query({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    return await ctx.db
      .query("usageEvents")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .order("desc")
      .take(100);
  },
});
