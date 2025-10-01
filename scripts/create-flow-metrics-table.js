#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');
const path = require('path');

config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function createTable() {
  const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
  
  console.log('Creating flow_metrics table with clean structure...\n');
  
  try {
    // Create the table
    await sql.query(`
      CREATE TABLE flow_metrics (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        metric_key TEXT NOT NULL UNIQUE,
        display_title TEXT NOT NULL,
        config JSONB NOT NULL DEFAULT '{}'::jsonb,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        
        -- Inline CHECK constraint for cross-pipeline JSONB structure
        CONSTRAINT check_valid_metric_config CHECK (
          config = '{}'::jsonb OR (
            (config ? 'startStage') AND (config ? 'endStage') AND
            ((config->'startStage') ? 'id') AND
            ((config->'startStage') ? 'name') AND
            ((config->'startStage') ? 'pipelineId') AND
            ((config->'startStage') ? 'pipelineName') AND
            ((config->'endStage') ? 'id') AND
            ((config->'endStage') ? 'name') AND
            ((config->'endStage') ? 'pipelineId') AND
            ((config->'endStage') ? 'pipelineName')
          )
        )
      )
    `);
    console.log('✅ Table created');
    
    // Create indexes
    await sql.query('CREATE INDEX idx_flow_metrics_metric_key ON flow_metrics(metric_key)');
    console.log('✅ Index on metric_key created');
    
    await sql.query('CREATE INDEX idx_flow_metrics_is_active ON flow_metrics(is_active)');
    console.log('✅ Index on is_active created');
    
    await sql.query('CREATE INDEX idx_flow_metrics_sort_order ON flow_metrics(sort_order)');
    console.log('✅ Index on sort_order created');
    
    await sql.query('CREATE INDEX idx_flow_metrics_gin ON flow_metrics USING GIN(config)');
    console.log('✅ GIN index on config created');
    
    // Verify
    const check = await sql`SELECT * FROM information_schema.columns WHERE table_name = 'flow_metrics' ORDER BY ordinal_position`;
    console.log('\n📋 Table structure:');
    console.table(check);
    
    console.log('\n🎉 flow_metrics table created successfully with correct structure!');
    console.log('Now try saving a metric in the app.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

createTable();
