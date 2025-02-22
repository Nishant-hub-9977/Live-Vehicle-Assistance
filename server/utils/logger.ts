import winston from 'winston';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.json()
);

// Create separate loggers for different severity levels
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { 
    service: 'roadside-assistance',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // Combined logs
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
      tailable: true
    }),
    // Separate access logs for API requests
    new winston.transports.File({
      filename: 'logs/access.log',
      level: 'info',
      maxsize: 5242880,
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Add console logging for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ level, message, timestamp, stack }) => {
        if (stack) {
          return `${timestamp} ${level}: ${message}\n${stack}`;
        }
        return `${timestamp} ${level}: ${message}`;
      })
    )
  }));
}

// Export helper functions for consistent logging
export const logError = (error: Error, context: Record<string, any> = {}) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context
  });
};

export const logInfo = (message: string, context: Record<string, any> = {}) => {
  logger.info({
    message,
    ...context
  });
};

export const logDebug = (message: string, context: Record<string, any> = {}) => {
  logger.debug({
    message,
    ...context
  });
};