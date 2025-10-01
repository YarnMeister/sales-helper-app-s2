import { NextRequest } from 'next/server';

/**
 * Verify that the request is from Vercel Cron
 * Checks for the Authorization header with the cron secret
 */
export function verifyVercelCronAuth(request: NextRequest): boolean {
  // In development, allow all requests
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Check for Vercel cron authorization header
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  
  if (!process.env.CRON_SECRET) {
    console.warn('⚠️ CRON_SECRET not configured - cron endpoints are unprotected');
    return true; // Allow in case secret is not configured yet
  }

  return authHeader === expectedAuth;
}

/**
 * Get sync status from database
 */
export async function getCurrentSyncStatus(): Promise<{
  isRunning: boolean;
  lastSync?: Date;
  syncType?: string;
}> {
  // This will be implemented when we create the repository
  // For now, return a simple status
  return {
    isRunning: false,
    lastSync: undefined,
    syncType: undefined
  };
}
