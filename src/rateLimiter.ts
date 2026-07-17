import { Request, Response, NextFunction } from 'express';
import redis from './redis';

const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || '10');
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
const WINDOW_SECONDS = WINDOW_MS / 1000;

// sliding window rate limiter using redis sorted sets
// each request is stored as a score (timestamp) in a sorted set per IP
async function isRateLimited(identifier: string): Promise<{ limited: boolean; count: number; resetIn: number }> {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const key = `rate:${identifier}`;

  // remove requests outside the current window
  await redis.zRemRangeByScore(key, 0, windowStart);

  // count how many requests are left in the window
  const count = await redis.zCard(key);

  if (count >= MAX_REQUESTS) {
    // figure out when their oldest request expires
    const oldest = await redis.zRange(key, 0, 0);
    const oldestScore = oldest.length > 0 ? await redis.zScore(key, oldest[0]) : now;
    const resetIn = Math.ceil(((oldestScore || now) + WINDOW_MS - now) / 1000);

    return { limited: true, count, resetIn };
  }

  // add this request to the window
  await redis.zAdd(key, { score: now, value: `${now}` });
  await redis.expire(key, WINDOW_SECONDS);

  return { limited: false, count: count + 1, resetIn: 0 };
}

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  // use API key if provided, otherwise fall back to IP
  const identifier = (req.headers['x-api-key'] as string) || req.ip || 'unknown';

  isRateLimited(identifier).then(({ limited, count, resetIn }) => {
    // always send back rate limit headers so clients know where they stand
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - count));

    if (limited) {
      res.setHeader('Retry-After', resetIn);
      res.status(429).json({
        error: 'too many requests',
        retryAfter: `${resetIn} seconds`,
      });
      return;
    }

    next();
  }).catch(next);
}