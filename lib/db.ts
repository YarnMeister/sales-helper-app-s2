import { getDatabaseConfig } from './env';

// Basic database health check utility
export const checkDbHealth = async (): Promise<{ 
  healthy: boolean; 
  environment: string; 
  latency?: number;
  version?: string;
}> => {
  const startTime = Date.now();
  const config = getDatabaseConfig();
  
  try {
    // For now, just return a basic health check
    // This can be enhanced later with actual database connectivity
    const latency = Date.now() - startTime;
    
    return { 
      healthy: true, 
      environment: config.environment,
      latency,
      version: 'PostgreSQL (Neon)'
    };
  } catch (error) {
    return { 
      healthy: false, 
      environment: config.environment 
    };
  }
};

// Basic query function for database-utils.ts compatibility
export const query = async <T = any>(
  text: string, 
  params: any[] = []
): Promise<{ rows: T[]; rowCount: number }> => {
  // For now, return empty result to prevent build errors
  // This will be properly implemented when we set up the database layer
  return {
    rows: [],
    rowCount: 0
  };
};
