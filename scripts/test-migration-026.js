#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const { config } = require('dotenv');

config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

// Import the splitSqlStatements function
function splitSqlStatements(sqlContent) {
  const withoutComments = sqlContent
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  
  const statements = [];
  let currentStatement = '';
  let inFunction = false;
  
  for (let i = 0; i < withoutComments.length; i++) {
    const char = withoutComments[i];
    const nextChar = withoutComments[i + 1];
    
    if (char === '$' && nextChar === '$') {
      inFunction = !inFunction;
      currentStatement += char + nextChar;
      i++;
      continue;
    }
    
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
  
  const trimmed = currentStatement.trim();
  if (trimmed && !trimmed.match(/^\s*$/)) {
    statements.push(trimmed);
  }
  
  return statements;
}

async function test() {
  const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
  
  // Read migration 026
  const migrationSql = fs.readFileSync('migrations/026_flow_metrics_clean_rebuild.sql', 'utf8');
  console.log('=== MIGRATION 026 CONTENT ===\n');
  console.log(migrationSql);
  console.log('\n=== SPLIT STATEMENTS ===\n');
  
  const statements = splitSqlStatements(migrationSql);
  statements.forEach((stmt, i) => {
    console.log(`\n--- Statement ${i + 1} (${stmt.length} chars) ---`);
    console.log(stmt.substring(0, 200) + (stmt.length > 200 ? '...' : ''));
  });
  
  console.log(`\n\nTotal statements: ${statements.length}`);
  
  // Try executing the first statement (DROP TABLE)
  console.log('\n=== TESTING DROP TABLE ===');
  try {
    console.log('Before DROP - checking table exists...');
    const before = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'flow_metrics_config')`;
    console.log('Table exists before:', before[0].exists);
    
    console.log('\nExecuting DROP TABLE...');
    const result = await sql.unsafe(statements[0]);
    console.log('DROP result:', result);
    
    console.log('\nAfter DROP - checking table exists...');
    const after = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'flow_metrics_config')`;
    console.log('Table exists after:', after[0].exists);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
