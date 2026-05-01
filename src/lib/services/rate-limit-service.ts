const userRequests = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  reason?: string;
}

export function checkRateLimit(userId: string, maxRequests: number = 2000, windowMs: number = 3600000): RateLimitResult {
  const now = Date.now();
  const record = userRequests.get(userId);

  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs;
    userRequests.set(userId, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt, reason: "Rate limit exceeded" };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

export function recordUsage(userId: string, estimatedTokens: number): void {
  // In-memory rate limiting only — usage analytics logged via Convex usage service
}
