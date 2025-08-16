export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

export interface LogMetadata {
  [key: string]: unknown;
  correlationId?: string;
  requestId?: string;
  duration?: number;
  operation?: string;
  context?: string;
}

export const log = (
  level: LogLevel, 
  msg: string, 
  meta?: LogMetadata
) => {
  const timestamp = new Date().toISOString();
  const environment = process.env.APP_ENV || 'unknown';
  
  // Performance threshold warnings
  if (meta?.duration && typeof meta.duration === 'number') {
    if (meta.duration > 1000) {
      level = 'WARN';
      msg = `SLOW OPERATION: ${msg}`;
    } else if (meta.duration > 500) {
      level = 'INFO';
      msg = `SLOWER OPERATION: ${msg}`;
    }
  }
  
  // Format: [SH:environment] LEVEL timestamp message {metadata}
  console.log(`[SH:${environment}] ${level} ${timestamp} ${msg}`, meta ?? {});
};

// Convenience methods for different log levels
export const logError = (msg: string, meta?: LogMetadata) => log('ERROR', msg, meta);
export const logWarn = (msg: string, meta?: LogMetadata) => log('WARN', msg, meta);
export const logInfo = (msg: string, meta?: LogMetadata) => log('INFO', msg, meta);
export const logDebug = (msg: string, meta?: LogMetadata) => log('DEBUG', msg, meta);

// Performance monitoring helper
export const withPerformanceLogging = async <T>(
  operation: string,
  context: string,
  fn: () => Promise<T>,
  meta?: Omit<LogMetadata, 'duration' | 'operation' | 'context'>
): Promise<T> => {
  const startTime = Date.now();
  const correlationId = Math.random().toString(36).substring(2, 15);
  
  try {
    logInfo(`Operation started: ${operation}`, { 
      operation, 
      context, 
      correlationId,
      ...meta 
    });
    
    const result = await fn();
    const duration = Date.now() - startTime;
    
    logInfo(`Operation completed: ${operation}`, { 
      operation, 
      context, 
      correlationId,
      duration,
      ...meta 
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logError(`Operation failed: ${operation}`, { 
      operation, 
      context, 
      correlationId,
      duration,
      error: error instanceof Error ? error.message : String(error),
      ...meta 
    });
    
    throw error;
  }
};

// Generate correlation ID for request tracing
export const generateCorrelationId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};
