import type { QueryCtx, MutationCtx } from "../_generated/server";

export async function getAuthIdentifier(
  ctx: QueryCtx | MutationCtx,
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity.tokenIdentifier;
}
