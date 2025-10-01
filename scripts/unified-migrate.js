/**
 * Unified Migration System
 *
 * This script provides a bulletproof migration system that:
 * 1. Always uses consistent database connections via connection-standard module
 * 2. Supports both migration-based and schema-first approaches
 * 3. Automatically syncs migration tracking with actual database state
 * 4. Prevents the db:push vs db:migrate split
 */

import { migrate } from 'drizzle-orm/neon-http/migrator';
import { sql } from 'drizzle-orm';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Use standard connection module for consistency
import { createStandardConnection } from '../lib/database/connection-standard.js';

class UnifiedMigrationSystem {
  constructor() {
    // Use standard connection module
    const connection = createStandardConnection();
    this.sqlClient = connection.sqlClient;
    this.db = connection.db;
    this.connectionString = connection.connectionString;
    this.migrationsFolder = './migrations'; // Use root migrations folder (022-026), not legacy lib/database/migrations
  }

  /**
   * Initialize migration tracking table if it doesn't exist
   */
  async initializeMigrationTracking() {
    try {
      await this.db.execute(sql`
        CREATE TABLE IF NOT EXISTS __drizzle_migrations (
          id SERIAL PRIMARY KEY,
          hash TEXT NOT NULL,
          created_at BIGINT NOT NULL
        )
      `);
      console.log('✅ Migration tracking table initialized');
    } catch (error) {
      console.error('❌ Failed to initialize migration tracking:', error.message);
      throw error;
    }
  }

  /**
   * Get list of applied migrations from database
   */
  async getAppliedMigrations() {
    try {
      const result = await this.db.execute(sql`
        SELECT hash FROM __drizzle_migrations ORDER BY id
      `);
      return result.rows.map(row => row.hash);
    } catch (error) {
      if (error.message?.includes('relation "__drizzle_migrations" does not exist')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get list of available migrations from files
   */
  getAvailableMigrations() {
    const journalPath = join(this.migrationsFolder, 'meta', '_journal.json');
    
    if (!existsSync(journalPath)) {
      console.log('⚠️  No migrations journal found');
      return [];
    }

    const journal = JSON.parse(readFileSync(journalPath, 'utf8'));
    return journal.entries || [];
  }

  /**
   * Sync migration tracking with actual database state
   * This prevents the db:push vs db:migrate split
   */
  async syncMigrationTracking() {
    console.log('🔄 Syncing migration tracking with database state...');
    
    const appliedMigrations = await this.getAppliedMigrations();
    const availableMigrations = this.getAvailableMigrations();
    
    // Check if database has tables that aren't tracked in migrations
    const hasUnTrackedTables = await this.checkForUntrackedTables();
    
    if (hasUnTrackedTables && appliedMigrations.length === 0) {
      console.log('📋 Database has tables but no migration tracking');
      console.log('   This suggests db:push was used previously');
      
      // Mark all available migrations as applied to sync state
      for (const migration of availableMigrations) {
        await this.markMigrationAsApplied(migration.tag);
        console.log(`✅ Marked ${migration.tag} as applied (sync)`);
      }
      
      console.log('🔄 Migration tracking synced with database state');
    }
  }

  /**
   * Check if database has tables that aren't tracked in migrations
   */
  async checkForUntrackedTables() {
    try {
      const result = await this.db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name NOT IN ('__drizzle_migrations')
      `);
      return result.rows.length > 0;
    } catch (error) {
      console.warn('⚠️  Could not check for untracked tables:', error.message);
      return false;
    }
  }

  /**
   * Mark a migration as applied without running it
   */
  async markMigrationAsApplied(migrationHash) {
    await this.db.execute(sql`
      INSERT INTO __drizzle_migrations (hash, created_at) 
      VALUES (${migrationHash}, ${Date.now()})
      ON CONFLICT (hash) DO NOTHING
    `);
  }

  /**
   * Run pending migrations using Drizzle's built-in migrator
   */
  async runPendingMigrations() {
    console.log('🔄 Running pending migrations...');

    // Check if there are actually pending migrations
    const appliedMigrations = await this.getAppliedMigrations();
    const availableMigrations = this.getAvailableMigrations();

    const pendingMigrations = availableMigrations.filter(migration =>
      !appliedMigrations.includes(migration.tag)
    );

    if (pendingMigrations.length === 0) {
      console.log('✅ Database is up to date - no migrations needed');
      return;
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migrations:`);
    pendingMigrations.forEach(m => console.log(`   - ${m.tag}`));

    try {
      await migrate(this.db, { migrationsFolder: this.migrationsFolder });
      console.log('✅ All migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Main migration method - bulletproof approach
   */
  async migrate(options = {}) {
    const { force = false, syncOnly = false } = options;
    
    try {
      console.log('🚀 Starting unified migration process...');
      console.log(`   Connection: ${this.connectionString.substring(0, 30)}...`);
      
      // Step 1: Initialize migration tracking
      await this.initializeMigrationTracking();
      
      // Step 2: Sync migration tracking with database state
      await this.syncMigrationTracking();
      
      // Step 3: Run pending migrations (unless sync-only)
      if (!syncOnly) {
        await this.runPendingMigrations();
      }
      
      console.log('✅ Unified migration process completed successfully');
      
    } catch (error) {
      console.error('❌ Unified migration failed:', error.message);
      if (!force) {
        process.exit(1);
      }
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    force: args.includes('--force'),
    syncOnly: args.includes('--sync-only'),
  };
  
  const migrationSystem = new UnifiedMigrationSystem();
  await migrationSystem.migrate(options);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { UnifiedMigrationSystem };
