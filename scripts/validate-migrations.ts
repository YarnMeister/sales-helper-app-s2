#!/usr/bin/env tsx
/**
 * Migration Validation Script
 * 
 * Pre-deployment validation checks for migrations.
 * Ensures migration integrity before build/deploy.
 * 
 * Checks:
 * 1. Journal file exists and is valid JSON
 * 2. All migrations in journal have corresponding SQL files
 * 3. No orphaned SQL files (not in journal)
 * 4. Basic idempotency checks (CREATE/DROP statements)
 * 
 * Usage:
 *   npm run db:validate-migrations
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = './lib/database/migrations';
const JOURNAL_PATH = join(MIGRATIONS_DIR, 'meta', '_journal.json');

interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

interface Journal {
  version: string;
  dialect: string;
  entries: JournalEntry[];
}

function validateMigrations() {
  console.log('🔍 Validating migrations...\n');
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check 1: Journal exists
  if (!existsSync(JOURNAL_PATH)) {
    errors.push('❌ Journal file not found: lib/database/migrations/meta/_journal.json');
    console.error('🚨 VALIDATION FAILED:\n');
    errors.forEach(e => console.error(`   ${e}`));
    console.error('\n💡 Run `npm run db:generate` to create initial migration\n');
    process.exit(1);
  }
  
  // Check 2: Journal is valid JSON
  let journal: Journal;
  try {
    const journalContent = readFileSync(JOURNAL_PATH, 'utf-8');
    journal = JSON.parse(journalContent);
  } catch (error: any) {
    errors.push(`❌ Journal file is invalid JSON: ${error.message}`);
    console.error('🚨 VALIDATION FAILED:\n');
    errors.forEach(e => console.error(`   ${e}`));
    process.exit(1);
  }
  
  console.log(`📋 Journal version: ${journal.version}`);
  console.log(`📋 Dialect: ${journal.dialect}`);
  console.log(`📋 Migrations in journal: ${journal.entries.length}\n`);
  
  // Check 3: All journal entries have corresponding SQL files
  for (const entry of journal.entries) {
    const sqlFile = join(MIGRATIONS_DIR, `${entry.tag}.sql`);
    if (!existsSync(sqlFile)) {
      errors.push(`❌ Missing SQL file for journal entry: ${entry.tag}.sql`);
    }
  }
  
  // Check 4: No orphaned SQL files
  const sqlFiles = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .map(f => f.replace('.sql', ''));
  
  const journalTags = journal.entries.map(e => e.tag);
  
  for (const sqlFile of sqlFiles) {
    if (!journalTags.includes(sqlFile)) {
      warnings.push(`⚠️  Orphaned SQL file (not in journal): ${sqlFile}.sql`);
    }
  }
  
  // Check 5: Basic idempotency checks
  for (const entry of journal.entries) {
    const sqlFile = join(MIGRATIONS_DIR, `${entry.tag}.sql`);
    if (existsSync(sqlFile)) {
      const content = readFileSync(sqlFile, 'utf-8');
      
      // Check for CREATE without IF NOT EXISTS
      if (content.match(/CREATE\s+(TABLE|INDEX|TYPE|FUNCTION)/i) && 
          !content.match(/IF\s+NOT\s+EXISTS/i)) {
        warnings.push(`⚠️  ${entry.tag}.sql: CREATE statement without IF NOT EXISTS (may not be idempotent)`);
      }
      
      // Check for DROP without IF EXISTS
      if (content.match(/DROP\s+(TABLE|INDEX|TYPE|FUNCTION)/i) && 
          !content.match(/IF\s+EXISTS/i)) {
        warnings.push(`⚠️  ${entry.tag}.sql: DROP statement without IF EXISTS (may not be idempotent)`);
      }
    }
  }
  
  // Report results
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:\n');
    warnings.forEach(w => console.log(`   ${w}`));
    console.log('');
  }
  
  if (errors.length > 0) {
    console.error('🚨 VALIDATION FAILED:\n');
    errors.forEach(e => console.error(`   ${e}`));
    console.error('\n💡 Fix errors before deploying\n');
    process.exit(1);
  }
  
  console.log('✅ Migration validation passed!\n');
  console.log('Summary:');
  console.log(`   - ${journal.entries.length} migrations in journal`);
  console.log(`   - ${sqlFiles.length} SQL files`);
  console.log(`   - ${warnings.length} warnings`);
  console.log(`   - 0 errors\n`);
}

validateMigrations();

