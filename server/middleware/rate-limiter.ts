import { RateLimiterMemory } from 'rate-limiter-flexible';
import type { Request, Response, NextFunction } from 'express';

// Use in-memory rate limiting for development
const isDevelopment = process.env.NODE_ENV !== 'production';

const rateLimiter = new RateLimiterMemory({
  points: isDevelopment ? 1000 : 100, // More lenient for development
  duration: 1, // Per second
  blockDuration: 60, // Block for 1 minute if exceeded
});

export async function rateLimiterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    const retryAfter = Math.ceil(rejRes.msBeforeNext / 1000) || 60;
    res.set('Retry-After', String(retryAfter));
    res.status(429).json({ 
      error: 'Too Many Requests',
      message: `Please try again in ${retryAfter} seconds`,
      retryAfter
    });
  }
}