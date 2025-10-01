#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');
const path = require('path');

config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function debug() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const sql = neon(connectionString);

  // Find all versions of the function
  const allFuncs = await sql`
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_functiondef(p.oid) as definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'validate_metric_config_jsonb'
  `;
  
  console.log('All versions of validate_metric_config_jsonb:');
  console.log(JSON.stringify(allFuncs, null, 2));
  
  // Try to manually execute the CREATE FUNCTION
  console.log('\n\nTrying to manually execute CREATE FUNCTION...');
  try {
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION validate_metric_config_jsonb(config_data JSONB)
      RETURNS BOOLEAN AS $$
      BEGIN
          IF config_data = '{}'::jsonb THEN
              RETURN TRUE;
          END IF;
          
          RETURN config_data ? 'startStage'
             AND config_data ? 'endStage'
             AND (config_data->'startStage') ? 'id'
             AND (config_data->'startStage') ? 'name'
             AND (config_data->'startStage') ? 'pipelineId'
             AND (config_data->'startStage') ? 'pipelineName'
             AND (config_data->'endStage') ? 'id'
             AND (config_data->'endStage') ? 'name'
             AND (config_data->'endStage') ? 'pipelineId'
             AND (config_data->'endStage') ? 'pipelineName';
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Function created successfully');
    
    // Verify it worked
    const updated = await sql`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'validate_metric_config_jsonb'
    `;
    console.log('\nUpdated function:');
    console.log(updated[0].definition);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debug();
