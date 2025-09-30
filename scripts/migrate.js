#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const { config } = require('dotenv');

// Load environment variables from .env.local first, then .env
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

// Function to split SQL into individual statements
function splitSqlStatements(sqlContent) {
  // Remove comments
  const withoutComments = sqlContent
    .replace(/--.*$/gm, '') // Remove single line comments
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
  
  // Split by semicolon, but respect $$ delimiters for functions
  const statements = [];
  let currentStatement = '';
  let inFunction = false;
  
  for (let i = 0; i < withoutComments.length; i++) {
    const char = withoutComments[i];
    const nextChar = withoutComments[i + 1];
    
    // Check for $$ delimiter
    if (char === '$' && nextChar === '$') {
      inFunction = !inFunction;
      currentStatement += char + nextChar;
      i++; // Skip next character
      continue;
    }
    
    // If we hit a semicolon outside of a function, end the statement
    if (char === ';' && !inFunction) {
      currentStatement += char;
      const trimmed = currentStatement.trim();
      if (trimmed && !trimmed.match(/^\s*$/)) {
        statements.push(trimmed);
      }
      currentStatement = '';
      continue;
    }
    
    currentStatement += char;
  }
  
  // Add any remaining statement
  const trimmed = currentStatement.trim();
  if (trimmed && !trimmed.match(/^\s*$/)) {
    statements.push(trimmed);
  }
  
  return statements;
}

async function runMigrations() {
  // Use unpooled connection for migrations to avoid pgbouncer limitations
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL or DATABASE_URL_UNPOOLED not set');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    console.log('🔄 Running database migrations...\n');

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

    // Read migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      const version = parseInt(file.split('_')[0]);
      const name = file.replace(/^\d+_/, '').replace(/\.sql$/, '');

      if (executedVersions.has(version)) {
        console.log(`⏭️  Migration ${version} (${name}) already applied`);
        continue;
      }

      // Skip mock tables migration since we have true database separation
      if (name === 'create_mock_tables') {
        console.log(`⏭️  Migration ${version} (${name}) skipped - mock tables no longer needed`);
        // Mark as executed without actually running it
        await sql`INSERT INTO schema_migrations (version, name) VALUES (${version}, ${name})`;
        continue;
      }

      console.log(`📝 Applying migration ${version}: ${name}`);

      const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      const statements = splitSqlStatements(migrationSql);
      
      // Execute migration in a transaction
      try {
        await sql`BEGIN`;
        
        // Execute each statement individually
        for (const statement of statements) {
          if (statement.trim()) {
            console.log(`  Executing: ${statement.substring(0, 50)}...`);
            
            // Handle different types of statements appropriately
            const upperStatement = statement.trim().toUpperCase();
            
            if (upperStatement.startsWith('CREATE TABLE')) {
              // For CREATE TABLE, use sql.unsafe() but verify table was created
              await sql.unsafe(statement);
              // Extract table name and verify it exists
              const tableNameMatch = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
              if (tableNameMatch) {
                const tableName = tableNameMatch[1];
                const tableExists = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = ${tableName})`;
                if (!tableExists[0].exists) {
                  throw new Error(`Table ${tableName} was not created successfully`);
                }
              }
            } else if (upperStatement.startsWith('INSERT INTO')) {
              // For INSERT, use sql.unsafe() and verify at least one row was affected
              const result = await sql.unsafe(statement);
              if (!result || result.length === 0) {
                throw new Error(`INSERT statement did not insert any rows: ${statement.substring(0, 100)}`);
              }
            } else if (upperStatement.startsWith('SELECT')) {
              // For SELECT, use sql.unsafe() and verify we got a result
              const result = await sql.unsafe(statement);
              if (result === undefined || result === null) {
                throw new Error(`SELECT statement failed: ${statement.substring(0, 100)}`);
              }
            } else {
              // For other statements, use sql.unsafe() and hope for the best
              await sql.unsafe(statement);
            }
          }
        }
        
        // Insert migration record INSIDE the transaction
        await sql`INSERT INTO schema_migrations (version, name) VALUES (${version}, ${name})`;
        
        // Commit the entire transaction
        await sql`COMMIT`;
        
        console.log(`✅ Migration ${version} applied successfully`);
        appliedCount++;
        
      } catch (error) {
        // Rollback the entire transaction (including migration record)
        await sql`ROLLBACK`;
        console.error(`❌ Migration ${version} failed:`, error.message);
        console.error('Full error:', error);
        throw error;
      }
    }

    if (appliedCount === 0) {
      console.log('✨ Database is up to date');
    } else {
      console.log(`\n🎉 Applied ${appliedCount} migrations successfully`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigrations();
