#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');
const path = require('path');

config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function check() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED;
  const sql = neon(connectionString);

  // Check for all functions with similar names
  const allFuncs = await sql`
    SELECT 
      p.oid,
      p.proname,
      pg_catalog.pg_get_function_arguments(p.oid) as arguments,
      pg_catalog.pg_get_function_result(p.oid) as result_type,
      p.prosrc as source_code
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname LIKE '%validate%metric%'
    AND n.nspname = 'public'
  `;
  
  console.log('All validation functions:');
  for (const func of allFuncs) {
    console.log('\n---');
    console.log('Name:', func.proname);
    console.log('Arguments:', func.arguments);
    console.log('Returns:', func.result_type);
    console.log('Source (first 200 chars):', func.source_code.substring(0, 200));
  }
  
  // Try dropping and recreating
  console.log('\n\n=== Attempting DROP and CREATE ===');
  try {
    await sql.unsafe('DROP FUNCTION IF EXISTS validate_metric_config_jsonb(jsonb) CASCADE');
    console.log('✅ Dropped old function');
    
    const createSql = `CREATE FUNCTION validate_metric_config_jsonb(config_data JSONB)
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
$$ LANGUAGE plpgsql`;

    await sql.unsafe(createSql);
    console.log('✅ Created new function');
    
    // Verify
    const check = await sql`SELECT prosrc FROM pg_proc WHERE proname = 'validate_metric_config_jsonb'`;
    console.log('\nNew function source:');
    console.log(check[0].prosrc);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

check();
