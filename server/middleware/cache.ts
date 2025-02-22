import { createClient } from 'redis';
import type { Request, Response, NextFunction } from 'express';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Skip caching in development mode
const redisClient = isDevelopment ? null : createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries: number) => Math.min(retries * 50, 1000)
  }
});

if (redisClient) {
  redisClient.on('error', (err) => console.error('Redis Cache Error', err));
}

export const cacheMiddleware = (duration: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests and development mode
    if (req.method !== 'GET' || isDevelopment || !redisClient) {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      const originalJson = res.json;
      res.json = (body: any) => {
        redisClient.setEx(key, duration, JSON.stringify(body));
        return originalJson.call(res, body);
      };

      next();
    } catch (err) {
      console.error('Cache Middleware Error:', err);
      next();
    }
  };
};

// Cache invalidation helper
export const invalidateCache = async (pattern: string) => {
  if (!redisClient) return;

  try {
    const keys = await redisClient.keys(`cache:${pattern}`);
    if (keys.length) {
      await redisClient.del(keys);
    }
  } catch (err) {
    console.error('Cache Invalidation Error:', err);
  }
};