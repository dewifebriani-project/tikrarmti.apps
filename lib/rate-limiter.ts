import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback for rate limiting when Redis is not available
const inMemoryCache = new Map<string, { count: number; timestamp: number }>();

// Try to create Redis client, fallback to null if not configured
let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
  }
} catch (error) {
  console.warn("Redis not configured, falling back to in-memory rate limiting");
}

// Create a new ratelimiter that allows 10 requests per 10 seconds
export const ratelimit = redis ? new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
}) : null;

// For registration and login endpoints - more restrictive
export const authRateLimit = redis ? new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 requests per minute
  analytics: true,
}) : null;

// For general API endpoints
export const generalApiRateLimit = redis ? new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"), // 100 requests per minute
  analytics: true,
}) : null;

// In-memory rate limiter fallback
function checkInMemoryLimit(
  identifier: string,
  window: number,
  max: number
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const key = identifier;
  const record = inMemoryCache.get(key);

  if (!record || now - record.timestamp > window * 1000) {
    inMemoryCache.set(key, { count: 1, timestamp: now });
    return {
      success: true,
      limit: max,
      remaining: max - 1,
      reset: Math.ceil((now + window * 1000) / 1000),
    };
  }

  if (record.count >= max) {
    return {
      success: false,
      limit: max,
      remaining: 0,
      reset: Math.ceil((record.timestamp + window * 1000) / 1000),
    };
  }

  record.count++;
  return {
    success: true,
    limit: max,
    remaining: max - record.count,
    reset: Math.ceil((record.timestamp + window * 1000) / 1000),
  };
}

// Universal rate limit checker with fallback
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null,
  endpoint?: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  let result;

  if (redis && limiter) {
    // Use Redis rate limiter
    result = await limiter.limit(identifier);
  } else {
    // Use in-memory fallback
    const window = 10; // Default window in seconds
    const max = 10; // Default max requests
    result = checkInMemoryLimit(identifier, window, max);
  }

  // Log rate limit exceeded events
  if (!result.success && endpoint) {
    try {
      const { logSecurity } = await import('./logger');
      await logSecurity.rateLimitExceeded(
        identifier,
        endpoint,
        undefined // user_agent would need to be passed separately
      );
    } catch (error) {
      // Don't fail rate limiting if logging fails
      console.warn('Failed to log rate limit event:', error);
    }
  }

  return result;
}

// Get client IP from request
export function getClientIP(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const ip = request.headers.get("x-client-ip");

  if (forwarded) {
    return forwarded.split(",")[0];
  }

  if (realIP) {
    return realIP;
  }

  if (ip) {
    return ip;
  }

  // Fallback to a default if no IP found
  return "127.0.0.1";
}