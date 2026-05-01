import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

function createClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  return new ConvexHttpClient(url);
}

const client = createClient();

function withServerSecret(args: Record<string, unknown> = {}) {
  const serverSecret = process.env.CONVEX_SERVER_SECRET;
  return serverSecret ? { ...args, serverSecret } : args;
}

export const convexServer = {
  query: ((functionReference: any, args?: Record<string, unknown>) =>
    client.query(functionReference, withServerSecret(args))) as ConvexHttpClient["query"],
  mutation: ((functionReference: any, args?: Record<string, unknown>) =>
    client.mutation(functionReference, withServerSecret(args))) as ConvexHttpClient["mutation"],
  action: ((functionReference: any, args?: Record<string, unknown>) =>
    client.action(functionReference, withServerSecret(args))) as ConvexHttpClient["action"],
};
export { api };
