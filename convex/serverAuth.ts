export function requireServerSecret(serverSecret?: string) {
  const expected = process.env.CONVEX_SERVER_SECRET;
  if (expected && serverSecret !== expected) {
    throw new Error("Unauthorized Convex server operation");
  }
}
