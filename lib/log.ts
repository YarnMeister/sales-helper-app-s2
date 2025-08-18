import { NextResponse } from 'next/server';

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
  fn: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();
  
  logInfo(`Starting ${operation}`, { context, correlationId });
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    // CRITICAL: Preserve Response and NextResponse objects completely
    if (result instanceof Response || result instanceof NextResponse) {
      logInfo(`${operation} completed`, { 
        context, 
        correlationId,
        duration,
        status: result.status,
        success: true 
      });
      return result; // Return the Response object as-is
    }
    
    // For non-Response objects, log and return normally
    logInfo(`${operation} completed`, { 
      context, 
      correlationId,
      duration,
      success: true 
    });
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(`${operation} failed`, { 
      context,
      correlationId,
      duration,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};

// Generate correlation ID for request tracing
export const generateCorrelationId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};
