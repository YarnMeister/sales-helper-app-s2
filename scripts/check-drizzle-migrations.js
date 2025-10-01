import { createStandardConnection, sql } from '../lib/database/connection-standard.js';

async function checkMigrations() {
  const { sqlClient } = createStandardConnection();
  
  // Check if table exists
  const tables = await sqlClient`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = '__drizzle_migrations'
  `;

  if (tables.length === 0) {
    console.log('❌ __drizzle_migrations table does not exist');
    return;
  }

  console.log('✅ __drizzle_migrations table exists');

  // Check contents
  const migrations = await sqlClient`SELECT * FROM __drizzle_migrations ORDER BY id`;
  
  console.log(`\nMigrations applied: ${migrations.length}`);
  migrations.forEach(m => {
    console.log(`  - ${m.hash} (created: ${new Date(Number(m.created_at)).toISOString()})`);
  });
}

checkMigrations();

