import { query } from "./_generated/server";
import { v } from "convex/values";

export const providerPlaceholders = query({
  args: {},
  handler: async () => {
    return [{ provider: "z.ai", status: "planned" }];
  },
});
