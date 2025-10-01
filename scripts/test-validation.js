#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function testValidation() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const sql = neon(connectionString);

  const testConfig = {
    startStage: {
      id: 69,
      name: 'Order Received - General',
      pipelineId: 11,
      pipelineName: 'New Orders - General Items '
    },
    endStage: {
      id: 73,
      name: 'Order Quality Control',
      pipelineId: 11,
      pipelineName: 'New Orders - General Items '
    },
    thresholds: { minDays: 1, maxDays: 2 },
    comment: ''
  };

  console.log('Testing validation function with config:');
  console.log(JSON.stringify(testConfig, null, 2));
  console.log('\n');

  try {
    // Test the validation function directly
    const result = await sql`SELECT validate_metric_config_jsonb(${JSON.stringify(testConfig)}::jsonb) as is_valid`;
    console.log('Validation result:', result[0]);

    // Check what keys are detected
    const keysCheck = await sql`
      SELECT 
        ${JSON.stringify(testConfig)}::jsonb ? 'startStage' as has_start_stage,
        ${JSON.stringify(testConfig)}::jsonb ? 'endStage' as has_end_stage,
        (${JSON.stringify(testConfig)}::jsonb->'startStage') ? 'id' as start_has_id,
        (${JSON.stringify(testConfig)}::jsonb->'startStage') ? 'name' as start_has_name,
        (${JSON.stringify(testConfig)}::jsonb->'startStage') ? 'pipelineId' as start_has_pipeline_id,
        (${JSON.stringify(testConfig)}::jsonb->'startStage') ? 'pipelineName' as start_has_pipeline_name
    `;
    console.log('\nKey checks:', keysCheck[0]);

    // Show the actual function definition
    const funcDef = await sql`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'validate_metric_config_jsonb'
    `;
    console.log('\nFunction definition:');
    console.log(funcDef[0].definition);

  } catch (error) {
    console.error('Error:', error);
  }
}

testValidation();
