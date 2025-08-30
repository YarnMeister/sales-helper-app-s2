#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const fs = require('fs').promises;
const path = require('path');

async function migrateTestDatabase() {
  console.log('🧪 Running migrations on TEST database...\n');

  // Load environment variables
  require('dotenv').config({ path: '.env.local' });

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Read all migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort(); // This will sort them in the correct order

    console.log(`📁 Found ${migrationFiles.length} migration files`);

    // Create migrations table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Get already executed migrations
    const executedMigrations = await sql`
      SELECT name FROM migrations ORDER BY id
    `;
    const executedNames = executedMigrations.map(row => row.name);

    console.log(`📊 Already executed: ${executedNames.length} migrations`);

    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedNames.includes(file)) {
        console.log(`🔄 Running migration: ${file}`);
        
        const migrationPath = path.join(migrationsDir, file);
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');
        
        // Execute the migration
        await sql.unsafe(migrationSQL);
        
        // Record the migration
        await sql`
          INSERT INTO migrations (name) VALUES (${file})
        `;
        
        console.log(`✅ Completed: ${file}`);
      } else {
        console.log(`⏭️  Skipping: ${file} (already executed)`);
      }
    }

    console.log('\n🎉 Test database migration completed successfully!');
    
    // Show final status
    const finalMigrations = await sql`
      SELECT name, executed_at FROM migrations ORDER BY id
    `;
    
    console.log('\n📋 Migration history:');
    finalMigrations.forEach(migration => {
      console.log(`   ${migration.name} - ${migration.executed_at}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrateTestDatabase().catch(console.error);
