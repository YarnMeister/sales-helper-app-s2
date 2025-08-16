import { NextResponse } from 'next/server'
import { validateEnvironment } from '@/lib/env'
import { checkDbHealth } from '@/lib/db'
import { cache } from '@/lib/cache'

export async function GET() {
  try {
    // Validate environment
    validateEnvironment()
    
    // Check database health
    const dbHealth = await checkDbHealth()
    
    // Test cache connection
    const cacheStats = await cache.getStats()
    
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
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    }, { status: 500 })
  }
}
