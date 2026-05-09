import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";
import { assertSupportedUpload } from "./ingestion/lib";

const UPLOAD_RATE_WINDOW_MS = 60 * 1000;
const UPLOAD_RATE_LIMIT = 20;

export const generateUploadUrl = mutation({
  args: {
    fileName: v.string(),
    fileType: v.optional(v.string()),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    assertSupportedUpload(args);

    const now = Date.now();
    const windowStart = Math.floor(now / UPLOAD_RATE_WINDOW_MS) * UPLOAD_RATE_WINDOW_MS;
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_tokenIdentifier_and_provider", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier).eq("provider", "file-upload"),
      )
      .first();

    if (existing && existing.windowStart === windowStart) {
      if (existing.requestCount >= UPLOAD_RATE_LIMIT) {
        throw new Error("Upload rate limit exceeded. Please wait before uploading more files.");
      }
      await ctx.db.patch(existing._id, {
        requestCount: existing.requestCount + 1,
        tokenCount: existing.tokenCount + args.fileSize,
      });
    } else if (existing) {
      await ctx.db.patch(existing._id, {
        windowStart,
        requestCount: 1,
        tokenCount: args.fileSize,
      });
    } else {
      await ctx.db.insert("rateLimits", {
        tokenIdentifier,
        windowStart,
        requestCount: 1,
        tokenCount: args.fileSize,
        provider: "file-upload",
      });
    }

    return await ctx.storage.generateUploadUrl();
  },
});
