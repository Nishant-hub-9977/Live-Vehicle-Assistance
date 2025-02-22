import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error details
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    query: req.query,
    body: req.body,
    params: req.params,
  });

  // Handle validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Handle custom API errors
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code
    });
  }

  // Handle specific error types
  switch (err.name) {
    case 'UnauthorizedError':
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Please log in to access this resource'
      });

    case 'ForbiddenError':
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });

    case 'NotFoundError':
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'The requested resource could not be found'
      });

    default:
      // Default error response
      const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
      const isDevelopment = process.env.NODE_ENV !== 'production';

      res.status(statusCode).json({
        error: isDevelopment ? err.message : 'Internal Server Error',
        ...(isDevelopment && { stack: err.stack })
      });
  }
}