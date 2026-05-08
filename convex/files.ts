import { mutation } from "./_generated/server";
import { getAuthIdentifier } from "./lib/auth";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getAuthIdentifier(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
