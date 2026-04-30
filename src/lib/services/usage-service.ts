import "server-only";
import { prisma } from "@/lib/db";

interface PricingTier {
  inputPerMillion: number;
  outputPerMillion: number;
}

const PRICING: Record<string, PricingTier> = {
  "gpt-4o": { inputPerMillion: 2.50, outputPerMillion: 10.00 },
  "gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.60 },
  "gpt-4.1": { inputPerMillion: 2.00, outputPerMillion: 8.00 },
  "gpt-4.1-mini": { inputPerMillion: 0.40, outputPerMillion: 1.60 },
  "gpt-4.1-nano": { inputPerMillion: 0.10, outputPerMillion: 0.40 },
  "claude-sonnet-4-20250514": { inputPerMillion: 3.00, outputPerMillion: 15.00 },
  "claude-3-5-haiku-latest": { inputPerMillion: 0.80, outputPerMillion: 4.00 },
  "gemini-2.5-pro": { inputPerMillion: 1.25, outputPerMillion: 10.00 },
  "gemini-2.5-flash": { inputPerMillion: 0.15, outputPerMillion: 0.60 },
  "text-embedding-3-small": { inputPerMillion: 0.02, outputPerMillion: 0 },
};

function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const pricing = PRICING[model];
  if (!pricing) return 0;
  return (tokensIn / 1_000_000) * pricing.inputPerMillion + (tokensOut / 1_000_000) * pricing.outputPerMillion;
}

export async function logUsage(params: {
  userId: string;
  provider: string;
  model: string;
  type: "chat" | "embedding";
  tokensIn: number;
  tokensOut: number;
}): Promise<void> {
  const costEstimate = estimateCost(params.model, params.tokensIn, params.tokensOut);

  await prisma.usageLog.create({
    data: {
      userId: params.userId,
      provider: params.provider,
      model: params.model,
      type: params.type,
      tokensIn: params.tokensIn,
      tokensOut: params.tokensOut,
      costEstimate,
    },
  });
}

export async function getUserUsageStats(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [allTime, thisMonth, recentLogs, retrievalStats] = await Promise.all([
    prisma.usageLog.aggregate({
      where: { userId },
      _sum: { tokensIn: true, tokensOut: true, costEstimate: true },
      _count: true,
    }),
    prisma.usageLog.aggregate({
      where: { userId, createdAt: { gte: startOfMonth } },
      _sum: { tokensIn: true, tokensOut: true, costEstimate: true },
      _count: true,
    }),
    prisma.usageLog.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.retrievalLog.groupBy({
      by: ["mode"],
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      _count: { mode: true },
    }),
  ]);

  const byType = await prisma.usageLog.groupBy({
    by: ["type"],
    where: { userId, createdAt: { gte: startOfMonth } },
    _sum: { tokensIn: true, tokensOut: true, costEstimate: true },
    _count: true,
  });

  const byModel = await prisma.usageLog.groupBy({
    by: ["model"],
    where: { userId, createdAt: { gte: startOfMonth } },
    _sum: { tokensIn: true, tokensOut: true, costEstimate: true },
    _count: true,
  });

  return {
    allTime: {
      tokensIn: allTime._sum.tokensIn || 0,
      tokensOut: allTime._sum.tokensOut || 0,
      costEstimate: allTime._sum.costEstimate || 0,
      count: allTime._count,
    },
    thisMonth: {
      tokensIn: thisMonth._sum.tokensIn || 0,
      tokensOut: thisMonth._sum.tokensOut || 0,
      costEstimate: thisMonth._sum.costEstimate || 0,
      count: thisMonth._count,
    },
    byType: byType.map((b) => ({
      type: b.type,
      tokensIn: b._sum.tokensIn || 0,
      tokensOut: b._sum.tokensOut || 0,
      costEstimate: b._sum.costEstimate || 0,
      count: b._count,
    })),
    byModel: byModel.map((b) => ({
      model: b.model,
      tokensIn: b._sum.tokensIn || 0,
      tokensOut: b._sum.tokensOut || 0,
      costEstimate: b._sum.costEstimate || 0,
      count: b._count,
    })),
    retrievalBreakdown: retrievalStats.map((r) => ({
      mode: r.mode,
      count: r._count.mode,
    })),
    recentLogs: recentLogs.map((l) => ({
      id: l.id,
      provider: l.provider,
      model: l.model,
      type: l.type,
      tokensIn: l.tokensIn,
      tokensOut: l.tokensOut,
      costEstimate: l.costEstimate,
      createdAt: l.createdAt.toISOString(),
    })),
  };
}
