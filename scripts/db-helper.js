#!/usr/bin/env node

/**
 * Simple database helper for import scripts
 * This provides the database functions needed by the import scripts
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Database connection
const connectionString = process.env.DATABASE_URL;
const sql = neon(connectionString);

/**
 * Insert deal flow data into database
 */
async function insertDealFlowData(flowData) {
  if (!flowData || flowData.length === 0) return [];
  
  console.log(`📊 Inserting ${flowData.length} flow records for deal ${flowData[0].deal_id}`);
  
  const results = [];
  for (const data of flowData) {
    try {
      // Insert the record with conflict handling
      const insertResult = await sql`
        INSERT INTO pipedrive_deal_flow_data (
          pipedrive_event_id,
          deal_id,
          pipeline_id,
          stage_id,
          stage_name,
          entered_at,
          left_at,
          duration_seconds
        ) VALUES (
          ${data.pipedrive_event_id},
          ${data.deal_id},
          ${data.pipeline_id},
          ${data.stage_id},
          ${data.stage_name},
          ${data.entered_at},
          ${data.left_at || null},
          ${data.duration_seconds || null}
        )
        ON CONFLICT (pipedrive_event_id) DO NOTHING
        RETURNING *
      `;
      
      if (insertResult.length > 0) {
        // New record was inserted
        results.push(insertResult[0]);
        console.log(`✅ Inserted flow record: ${data.pipedrive_event_id} for deal ${data.deal_id}`);
      } else {
        // Record already exists, fetch it
        const existingResult = await sql`
          SELECT * FROM pipedrive_deal_flow_data 
          WHERE pipedrive_event_id = ${data.pipedrive_event_id}
        `;
        if (existingResult.length > 0) {
          results.push(existingResult[0]);
          console.log(`⏭️  Skipped existing flow record: ${data.pipedrive_event_id} for deal ${data.deal_id}`);
        }
      }
    } catch (error) {
      console.log(`❌ Error inserting flow record: ${data.pipedrive_event_id} for deal ${data.deal_id}: ${error.message}`);
    }
  }
  return results;
}

/**
 * Insert deal metadata into database
 */
async function insertDealMetadata(dealMetadata) {
  try {
    console.log(`📊 Inserting metadata for deal ${dealMetadata.id}`);
    
    const result = await sql`
      INSERT INTO pipedrive_metric_data (
        id,
        title,
        pipeline_id,
        stage_id,
        status
      ) VALUES (
        ${dealMetadata.id},
        ${dealMetadata.title},
        ${dealMetadata.pipeline_id},
        ${dealMetadata.stage_id},
        ${dealMetadata.status}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        pipeline_id = EXCLUDED.pipeline_id,
        stage_id = EXCLUDED.stage_id,
        status = EXCLUDED.status,
        last_fetched_at = NOW()
      RETURNING *
    `;
    
    console.log(`✅ Inserted/updated metadata for deal ${dealMetadata.id}`);
    return result[0];
  } catch (error) {
    console.log(`❌ Error inserting metadata for deal ${dealMetadata.id}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  insertDealFlowData,
  insertDealMetadata
};
