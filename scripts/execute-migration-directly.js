#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const { config } = require('dotenv');

config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function execute() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED;
  const sql = neon(connectionString);

  // Read the exact migration file
  const migrationSql = fs.readFileSync('migrations/022_flow_metrics_cross_pipeline_support.sql', 'utf8');
  
  console.log('Migration file content (function part):');
  const funcStart = migrationSql.indexOf('CREATE OR REPLACE FUNCTION');
  const funcEnd = migrationSql.indexOf('$$ LANGUAGE plpgsql;', funcStart) + '$$ LANGUAGE plpgsql;'.length;
  const functionDef = migrationSql.substring(funcStart, funcEnd);
  console.log(functionDef);
  console.log('\n');
  
  // Execute it
  try {
    console.log('Executing the CREATE FUNCTION statement...');
    await sql.unsafe(functionDef);
    console.log('✅ Executed');
    
    // Verify
    const result = await sql`SELECT prosrc FROM pg_proc WHERE proname = 'validate_metric_config_jsonb'`;
    console.log('\nFunction source from database:');
    console.log(result[0].prosrc);
    
    // Test with actual config
    const testConfig = {
      startStage: { id: 69, name: 'Test', pipelineId: 11, pipelineName: 'Pipeline' },
      endStage: { id: 73, name: 'Test2', pipelineId: 11, pipelineName: 'Pipeline' }
    };
    
    const validation = await sql`SELECT validate_metric_config_jsonb(${JSON.stringify(testConfig)}::jsonb) as is_valid`;
    console.log('\nValidation test result:', validation[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

execute();
