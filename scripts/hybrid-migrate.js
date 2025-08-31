#!/usr/bin/env node

const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { migrate } = require('drizzle-orm/neon-http/migrator');
const { config } = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

// Function to split SQL into individual statements (for Drizzle-style migrations)
function splitDrizzleStatements(sqlContent) {
  return sqlContent
    .split('--> statement-breakpoint')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
}

// Function to split traditional SQL into individual statements
function splitTraditionalStatements(sqlContent) {
  // Remove comments
  const withoutComments = sqlContent
    .replace(/--.*$/gm, '') // Remove single line comments
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
  
  // Split by semicolon, but be careful with semicolons in strings
  const statements = withoutComments
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.match(/^\s*$/));
  
  return statements;
}

async function runHybridMigrations() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL or DATABASE_URL_UNPOOLED not set');
    process.exit(1);
  }

  const sql = neon(connectionString);
  const db = drizzle(sql);

  try {
    console.log('🔄 Running hybrid migrations...\n');

    // Step 1: Run Drizzle migrations (these use proper transaction handling)
    console.log('📝 Step 1: Running Drizzle migrations...');
    try {
      await migrate(db, { migrationsFolder: './drizzle' });
      console.log('✅ Drizzle migrations completed successfully');
    } catch (error) {
      console.log('⚠️  No Drizzle migrations to run or error:', error.message);
    }

    // Step 2: Run legacy migrations (these need to be converted to Drizzle)
    console.log('\n📝 Step 2: Running legacy migrations...');
    
    // Ensure migrations table exists
    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;

    // Get executed migrations
    const executed = await sql`SELECT version FROM schema_migrations ORDER BY version`;
    const executedVersions = new Set(executed.map(row => row.version));

    // Read legacy migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && !file.startsWith('0000_')) // Skip Drizzle migrations
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      const version = parseInt(file.split('_')[0]);
      const name = file.replace(/^\d+_/, '').replace(/\.sql$/, '');

      if (executedVersions.has(version)) {
        console.log(`⏭️  Legacy migration ${version} (${name}) already applied`);
        continue;
      }

      // Skip mock tables migration since we have true database separation
      if (name === 'create_mock_tables') {
        console.log(`⏭️  Legacy migration ${version} (${name}) skipped - mock tables no longer needed`);
        await sql`INSERT INTO schema_migrations (version, name) VALUES (${version}, ${name})`;
        continue;
      }

      console.log(`📝 Applying legacy migration ${version}: ${name}`);

      const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Check if this is a Drizzle-style migration (has statement-breakpoint)
      const isDrizzleStyle = migrationSql.includes('--> statement-breakpoint');
      const statements = isDrizzleStyle 
        ? splitDrizzleStatements(migrationSql)
        : splitTraditionalStatements(migrationSql);
      
      // Execute migration in a transaction
      try {
        await sql`BEGIN`;
        
        // Execute each statement individually
        for (const statement of statements) {
          if (statement.trim()) {
            console.log(`  Executing: ${statement.substring(0, 50)}...`);
            await sql.unsafe(statement);
          }
        }
        
        // Insert migration record INSIDE the transaction
        await sql`INSERT INTO schema_migrations (version, name) VALUES (${version}, ${name})`;
        
        // Commit the entire transaction
        await sql`COMMIT`;
        
        console.log(`✅ Legacy migration ${version} applied successfully`);
        appliedCount++;
        
      } catch (error) {
        // Rollback the entire transaction (including migration record)
        await sql`ROLLBACK`;
        console.error(`❌ Legacy migration ${version} failed:`, error.message);
        console.error('Full error:', error);
        throw error;
      }
    }

    if (appliedCount === 0) {
      console.log('✨ No legacy migrations to apply');
    } else {
      console.log(`\n🎉 Applied ${appliedCount} legacy migrations successfully`);
    }

    console.log('\n✅ Hybrid migration system completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runHybridMigrations();
