import { NextResponse } from 'next/server'
import { validateEnvironment } from '@/lib/env'
import { checkDbHealth } from '@/lib/db-utils'
import { cache, warmCache } from '@/lib/cache'
import { logInfo, logError, generateCorrelationId } from '@/lib/log'

export async function GET() {
  const correlationId = generateCorrelationId();
  
  try {
    logInfo('Health check started', { correlationId });
    
    // Validate environment
    validateEnvironment()
    
    // Check database health
    const dbHealth = await checkDbHealth()
    
    // Test cache connection
    const cacheStats = await cache.getStats()
    
    // Warm cache in background (don't wait for it)
    warmCache().catch(error => {
      logError('Background cache warming failed', { 
        correlationId,
        error: (error as Error).message 
      });
    });
    
    logInfo('Health check completed successfully', { 
      correlationId,
      status: 'healthy',
      environment: process.env.APP_ENV || 'development'
    });
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.APP_ENV || 'development',
      database: {
        healthy: dbHealth.healthy,
        environment: dbHealth.environment,
        latency: dbHealth.latency,
        version: dbHealth.version
      },
      cache: {
        memory_usage: cacheStats.memory_usage,
        connected_clients: cacheStats.connected_clients,
        total_commands_processed: cacheStats.total_commands_processed
      },
      deployment: {
        type: 'preview',
        branch: process.env.VERCEL_GIT_COMMIT_REF || 'unknown',
        commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'
      }
    })
  } catch (error) {
    logError('Health check failed', { 
      correlationId,
      error: (error as Error).message 
    });
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    }, { status: 500 })
  }
}
