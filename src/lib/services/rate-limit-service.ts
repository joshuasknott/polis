import "server-only";

interface RateLimitEntry {
  requests: number;
  tokens: number;
  windowStart: number;
}

const limits = new Map<string, RateLimitEntry>();

const MAX_REQUESTS_PER_HOUR = parseInt(process.env.AI_RATE_LIMIT_REQUESTS || "50");
const MAX_TOKENS_PER_DAY = parseInt(process.env.AI_RATE_LIMIT_TOKENS || "500000");
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: { requests: number; tokens: number };
  resetAt: number;
  reason?: string;
}

export function checkRateLimit(userId: string, estimatedTokens: number = 0): RateLimitResult {
  const now = Date.now();
  let entry = limits.get(userId);

  if (!entry || now - entry.windowStart > HOUR_MS) {
    entry = { requests: 0, tokens: 0, windowStart: now };
    limits.set(userId, entry);
  }

  if (entry.requests >= MAX_REQUESTS_PER_HOUR) {
    return {
      allowed: false,
      remaining: { requests: 0, tokens: MAX_TOKENS_PER_DAY - entry.tokens },
      resetAt: entry.windowStart + HOUR_MS,
      reason: `Rate limit: ${MAX_REQUESTS_PER_HOUR} requests per hour exceeded`,
    };
  }

  if (entry.tokens + estimatedTokens > MAX_TOKENS_PER_DAY) {
    return {
      allowed: false,
      remaining: { requests: MAX_REQUESTS_PER_HOUR - entry.requests, tokens: 0 },
      resetAt: entry.windowStart + DAY_MS,
      reason: `Token limit: ${MAX_TOKENS_PER_DAY} tokens per day exceeded`,
    };
  }

  return {
    allowed: true,
    remaining: {
      requests: MAX_REQUESTS_PER_HOUR - entry.requests - 1,
      tokens: MAX_TOKENS_PER_DAY - entry.tokens - estimatedTokens,
    },
    resetAt: entry.windowStart + HOUR_MS,
  };
}

export function recordUsage(userId: string, tokensUsed: number): void {
  const entry = limits.get(userId);
  if (entry) {
    entry.requests++;
    entry.tokens += tokensUsed;
  }
}

export function getRateLimitStatus(userId: string): {
  requestsUsed: number;
  requestsLimit: number;
  tokensUsed: number;
  tokensLimit: number;
} {
  const entry = limits.get(userId);
  return {
    requestsUsed: entry?.requests || 0,
    requestsLimit: MAX_REQUESTS_PER_HOUR,
    tokensUsed: entry?.tokens || 0,
    tokensLimit: MAX_TOKENS_PER_DAY,
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of limits.entries()) {
    if (now - entry.windowStart > DAY_MS) {
      limits.delete(key);
    }
  }
}, HOUR_MS);
