import "server-only";
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

export async function getUserProviderConnection(userId: string, provider: string) {
  return prisma.aIProviderConnection.findUnique({
    where: {
      userId_provider: { userId, provider },
    },
  });
}

export async function getUserProviderConnections(userId: string) {
  return prisma.aIProviderConnection.findMany({
    where: { userId },
  });
}

export async function saveProviderApiKey(
  userId: string,
  provider: string,
  apiKey: string,
  modelPreference?: string
) {
  const encryptedKey = encrypt(apiKey);

  return prisma.aIProviderConnection.upsert({
    where: {
      userId_provider: { userId, provider },
    },
    create: {
      userId,
      provider,
      encryptedApiKey: encryptedKey,
      status: "connected",
      modelPreference: modelPreference || null,
    },
    update: {
      encryptedApiKey: encryptedKey,
      status: "connected",
      modelPreference: modelPreference || null,
    },
  });
}

export async function removeProviderApiKey(userId: string, provider: string) {
  return prisma.aIProviderConnection.deleteMany({
    where: { userId, provider },
  });
}

export async function getDecryptedApiKey(userId: string, provider: string): Promise<string | null> {
  const conn = await getUserProviderConnection(userId, provider);
  if (!conn?.encryptedApiKey || conn.status !== "connected") return null;

  try {
    return decrypt(conn.encryptedApiKey);
  } catch {
    return null;
  }
}

export async function getModelPreference(userId: string, provider: string): Promise<string | null> {
  const conn = await getUserProviderConnection(userId, provider);
  return conn?.modelPreference || null;
}

export async function updateConnectionStatus(
  userId: string,
  provider: string,
  status: string
) {
  return prisma.aIProviderConnection.updateMany({
    where: { userId, provider },
    data: { status },
  });
}
