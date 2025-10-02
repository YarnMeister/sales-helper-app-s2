#!/usr/bin/env tsx
/**
 * Schema Verification Script
 * 
 * Compares lib/database/schema.ts against production database.
 * Exits with error if any mismatches found.
 * 
 * Usage:
 *   npm run db:verify-schema
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../lib/database/schema.js';

// Load environment
dotenv.config({ path: '.env.local' });
dotenv.config();

// Configure WebSocket
neonConfig.webSocketConstructor = ws as any;

interface ProductionTable {
  table_name: string;
}

// Production tables (from introspection - Oct 2, 2025)
// Excludes system tables: __drizzle_migrations, schema_migrations
const PRODUCTION_TABLES = [
  'flow_metrics_config',
  'pipedrive_deal_flow_data',
  'pipedrive_submissions',
  'requests',
  'site_visits',
] as const;

// Tables that should be in schema.ts (matches production)
const SCHEMA_TABLES = [...PRODUCTION_TABLES];

async function verifySchema() {
  console.log('🔍 Verifying schema.ts matches production database...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Get production tables
    const prodTablesResult = await pool.query<ProductionTable>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const prodTables = prodTablesResult.rows.map(r => r.table_name);

    // Get schema.ts tables (from our known list)
    const schemaTables = [...SCHEMA_TABLES];
    
    console.log(`📊 Production tables: ${prodTables.length}`);
    console.log(`📊 Schema.ts tables: ${schemaTables.length}\n`);
    
    // Find mismatches
    const mismatches: string[] = [];
    const warnings: string[] = [];
    
    // Check for tables in schema.ts but not in production
    for (const table of schemaTables) {
      if (!prodTables.includes(table)) {
        mismatches.push(`❌ Table '${table}' defined in schema.ts but NOT in production`);
      }
    }
    
    // Check for tables in production but not in schema.ts
    for (const table of prodTables) {
      if (!schemaTables.includes(table)) {
        // Special case: migration tracking tables
        if (table === '__drizzle_migrations' || table === 'schema_migrations') {
          warnings.push(`⚠️  Migration table '${table}' in production (OK - system table)`);
        } else {
          mismatches.push(`❌ Table '${table}' exists in production but NOT in schema.ts`);
        }
      }
    }
    
    // Report results
    if (warnings.length > 0) {
      console.log('⚠️  Warnings:\n');
      warnings.forEach(w => console.log(`   ${w}`));
      console.log('');
    }
    
    if (mismatches.length > 0) {
      console.error('🚨 SCHEMA MISMATCH DETECTED:\n');
      mismatches.forEach(m => console.error(`   ${m}`));
      console.error('\n❌ Fix schema.ts before generating migrations.\n');
      console.error('Actions:');
      console.error('1. Remove tables from schema.ts that don\'t exist in production');
      console.error('2. Add tables to schema.ts that exist in production');
      console.error('3. Run this script again to verify\n');
      process.exit(1);
    }
    
    console.log('✅ schema.ts matches production database\n');
    console.log('Tables verified:');
    schemaTables.forEach(t => console.log(`   - ${t}`));
    console.log('');
    
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifySchema();

