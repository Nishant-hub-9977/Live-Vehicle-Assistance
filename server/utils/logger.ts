import winston from 'winston';

// Custom log format with proper object stringification
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} ${level}: ${typeof message === 'object' ? JSON.stringify(message) : message} ${metaString}`;
  })
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
    })
  ]
});

// Add console logging for development with better formatting
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ level, message, timestamp, ...meta }) => {
        if (meta.stack) {
          return `${timestamp} ${level}: ${message}\n${meta.stack}`;
        }
        const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
        return `${timestamp} ${level}: ${message}${metaString}`;
      })
    )
  }));
}

// Export helper functions with proper type checking
export const logError = (error: Error, context: Record<string, any> = {}) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context
  });
};

export const logInfo = (message: string | Record<string, any>, context: Record<string, any> = {}) => {
  logger.info({
    message: typeof message === 'string' ? message : JSON.stringify(message),
    ...context
  });
};

export const logDebug = (message: string | Record<string, any>, context: Record<string, any> = {}) => {
  logger.debug({
    message: typeof message === 'string' ? message : JSON.stringify(message),
    ...context
  });
};