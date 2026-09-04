import { incrementCounter } from "@/server/observability/metrics";

type RateLimitPolicy = {
  windowMs: number;
  maxRequests: number;
};

type RateLimitInput = {
  scope: string;
  request: Request;
  userId?: string;
  policy: RateLimitPolicy;
};

type RateLimitState = {
  count: number;
  windowStartMs: number;
};

const rateLimitStateByKey = new Map<string, RateLimitState>();

export class RateLimitExceededError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Too many requests.");
    this.name = "RateLimitExceededError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();

    if (firstIp) {
      return `ip:${firstIp}`;
    }
  }

  const realIp = request.headers.get("x-real-ip") ?? request.headers.get("cf-connecting-ip");

  if (realIp) {
    return `ip:${realIp}`;
  }

  return "ip:unknown";
}

export function enforceRateLimit(input: RateLimitInput) {
  const now = Date.now();
  const { policy } = input;
  const key = `${input.scope}:${getClientIdentifier(input.request, input.userId)}`;

  if (!Number.isFinite(policy.windowMs) || policy.windowMs <= 0) {
    throw new Error("Rate limit policy windowMs must be a positive number.");
  }

  if (!Number.isFinite(policy.maxRequests) || policy.maxRequests <= 0) {
    throw new Error("Rate limit policy maxRequests must be a positive number.");
  }

  const current = rateLimitStateByKey.get(key);

  if (!current || now - current.windowStartMs >= policy.windowMs) {
    rateLimitStateByKey.set(key, {
      count: 1,
      windowStartMs: now
    });
    return;
  }

  if (current.count >= policy.maxRequests) {
    const elapsedMs = now - current.windowStartMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((policy.windowMs - elapsedMs) / 1000));
    incrementCounter("rate_limit.exceeded_total");
    incrementCounter(`rate_limit.exceeded_scope.${input.scope}`);
    throw new RateLimitExceededError(retryAfterSeconds);
  }

  current.count += 1;
  rateLimitStateByKey.set(key, current);
}

export const rateLimitPolicies = {
  authRegister: {
    windowMs: 60_000,
    maxRequests: 10
  },
  groupJoin: {
    windowMs: 60_000,
    maxRequests: 30
  },
  boardMark: {
    windowMs: 60_000,
    maxRequests: 120
  }
} satisfies Record<string, RateLimitPolicy>;

export function resetRateLimitStateForTests() {
  rateLimitStateByKey.clear();
}
