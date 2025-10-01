/**
 * Initialize Drizzle migration tracking
 * Marks the baseline migration as already applied
 * Safe to run - won't affect existing tables
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function initTracking() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🔄 Initializing Drizzle migration tracking...\n');
    
    // Step 1: Create tracking table
    console.log('1. Creating __drizzle_migrations table...');
    await sql`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT
      )
    `;
    console.log('   ✓ Table created');
    
    // Step 2: Read the baseline migration to get its hash
    const journal = JSON.parse(
      readFileSync('./lib/database/migrations/meta/_journal.json', 'utf-8')
    );
    
    if (journal.entries.length === 0) {
      console.log('\n⚠️  No migrations in journal - nothing to mark as applied');
      return;
    }
    
    const baselineMigration = journal.entries[0];
    console.log(`\n2. Marking baseline migration as applied: ${baselineMigration.tag}`);
    
    // Step 3: Mark baseline as applied
    await sql`
      INSERT INTO __drizzle_migrations (hash, created_at)
      VALUES (${baselineMigration.tag}, ${baselineMigration.when})
      ON CONFLICT DO NOTHING
    `;
    console.log('   ✓ Baseline marked as applied');
    
    // Step 4: Verify
    const applied = await sql`SELECT * FROM __drizzle_migrations`;
    console.log(`\n✅ Initialization complete!`);
    console.log(`   Applied migrations: ${applied.length}`);
    applied.forEach(m => {
      console.log(`   - ${m.hash}`);
    });
    
    console.log('\n📝 Next: Run "npm run dev" - it should start without errors');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    process.exit(1);
  }
}

initTracking();

