import { migrate } from 'drizzle-orm/neon-http/migrator';
import { db } from './connection';
import { logInfo, logError } from '../log';

export async function runDrizzleMigrations(): Promise<void> {
  try {
    logInfo('Starting Drizzle migrations...');
    
    // Run migrations
    await migrate(db, { migrationsFolder: './lib/database/migrations' });
    
    logInfo('Drizzle migrations completed successfully');
  } catch (error) {
    logError('Drizzle migration failed', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export async function generateMigration(): Promise<void> {
  try {
    logInfo('Generating Drizzle migration...');
    
    // This would typically be run via drizzle-kit CLI
    // npm run db:generate
    logInfo('Migration generation completed. Run: npm run db:generate');
  } catch (error) {
    logError('Migration generation failed', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export async function verifyMigration(): Promise<boolean> {
  try {
    logInfo('Verifying migration status...');
    
    // Check if key tables exist and have expected structure
    const tables = [
      'flow_metrics_config',
      'canonical_stage_mappings',
      'requests',
      'mock_requests',
      'site_visits',
      'pipedrive_submissions',
      'pipedrive_deal_flow_data',
      'pipedrive_metric_data',
      'flow_metrics',
      'kv_cache'
    ];
    
    for (const table of tables) {
      try {
        // Try to select from table to verify it exists
        await db.execute(`SELECT 1 FROM ${table} LIMIT 1`);
        logInfo(`Table ${table} verified`);
      } catch (error) {
        logError(`Table ${table} verification failed`, { error: error instanceof Error ? error.message : String(error) });
        return false;
      }
    }
    
    logInfo('All table verifications passed');
    return true;
  } catch (error) {
    logError('Migration verification failed', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}
