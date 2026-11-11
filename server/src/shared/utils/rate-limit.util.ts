import { RedisService } from 'src/shared/modules/redis/redis.service';

/**
 * Counts one request against `key` within a fixed window.
 * Returns null when the request is allowed, or the number of seconds the
 * caller must wait (retryAfter) when the limit has been exceeded.
 */
export async function consumeRateLimit(
  redisService: RedisService,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<number | null> {
  const count = await redisService.incr(key, windowSeconds);

  if (count <= limit) {
    return null;
  }

  const ttl = await redisService.ttl(key);
  return Math.max(ttl, 1);
}
