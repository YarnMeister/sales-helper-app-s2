/**
 * Reset Flow Metrics Tables
 * Destructively drops and recreates flow metrics related tables
 * Preserves requests and site_visits tables
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import pg from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

const { Pool } = pg;

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function resetFlowMetricsTables() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL or DATABASE_URL_UNPOOLED not set');
    process.exit(1);
  }

  console.log('Using connection:', connectionString.substring(0, 30) + '...');

  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Resetting flow metrics tables...');

    const db = drizzle(pool);

    // Drop flow metrics related tables (destructive)
    console.log('🗑️  Dropping flow metrics related tables...');
    
    await db.execute(sql`DROP TABLE IF EXISTS canonical_stage_mappings CASCADE`);
    console.log('   ✅ Dropped canonical_stage_mappings');
    
    await db.execute(sql`DROP TABLE IF EXISTS flow_metrics_config CASCADE`);
    console.log('   ✅ Dropped flow_metrics_config');

    // Create new flow_metrics_config table with JSONB structure
    console.log('🏗️  Creating new flow_metrics_config table...');
    
    await db.execute(sql`
      CREATE TABLE flow_metrics_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        metric_key TEXT NOT NULL UNIQUE,
        display_title TEXT NOT NULL,
        config JSONB NOT NULL DEFAULT '{}'::jsonb,
        sort_order INTEGER DEFAULT 0 NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    console.log('   ✅ Created flow_metrics_config table');

    // Create indexes
    console.log('📊 Creating indexes...');
    
    await db.execute(sql`CREATE UNIQUE INDEX idx_fmc_metric_key ON flow_metrics_config(metric_key)`);
    await db.execute(sql`CREATE INDEX idx_fmc_sort_order ON flow_metrics_config(sort_order)`);
    await db.execute(sql`CREATE INDEX idx_fmc_is_active ON flow_metrics_config(is_active)`);
    await db.execute(sql`CREATE INDEX idx_fmc_config_gin ON flow_metrics_config USING GIN(config)`);
    await db.execute(sql`CREATE INDEX idx_fmc_created_at ON flow_metrics_config(created_at)`);
    
    console.log('   ✅ Created all indexes');

    // Add validation function for JSONB config
    console.log('🔍 Creating validation function...');
    
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION validate_metric_config_jsonb(config_data JSONB)
      RETURNS BOOLEAN AS $$
      BEGIN
          RETURN config_data ? 'pipeline' 
             AND config_data ? 'startStage'
             AND config_data ? 'endStage'
             AND (config_data->'pipeline') ? 'id'
             AND (config_data->'pipeline') ? 'name'
             AND (config_data->'startStage') ? 'id'
             AND (config_data->'startStage') ? 'name'
             AND (config_data->'endStage') ? 'id'
             AND (config_data->'endStage') ? 'name';
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('   ✅ Created validation function');

    // Add constraint
    await db.execute(sql`
      ALTER TABLE flow_metrics_config
        ADD CONSTRAINT check_valid_metric_config 
        CHECK (validate_metric_config_jsonb(config))
    `);
    console.log('   ✅ Added validation constraint');

    console.log('✅ Flow metrics tables reset successfully!');
    console.log('📋 New table structure:');
    console.log('   - flow_metrics_config (with JSONB config column)');
    console.log('   - All indexes and constraints created');
    console.log('   - Validation function for JSONB structure');

  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    console.error('   Cause:', error.cause?.message || 'Unknown');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetFlowMetricsTables();
