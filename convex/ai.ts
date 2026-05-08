import { queryGeneric as query } from "convex/server";

export const providerPlaceholders = query({
  args: {},
  handler: async () => {
    return [
      { provider: "z.ai", status: "planned" },
    ];
  },
});
