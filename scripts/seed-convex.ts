import { ConvexHttpClient } from "convex/browser";
import { config } from "dotenv";
import { api } from "../convex/_generated/api";

config({ path: ".env.local" });
config();

async function main() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");

  const client = new ConvexHttpClient(url);
  const result = await client.mutation(api.seed.seed, {
    ...(process.env.CONVEX_SERVER_SECRET
      ? { serverSecret: process.env.CONVEX_SERVER_SECRET }
      : {}),
  });

  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
