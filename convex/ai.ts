import { query } from "./_generated/server";

export const providerPlaceholders = query({
  args: {},
  handler: async () => {
    return [{ provider: "z.ai", status: "planned" }];
  },
});
