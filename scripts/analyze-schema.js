#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function analyzeSchema() {
  try {
    console.log('🔍 Analyzing current database schema...\n');
    
    const tables = [
      'requests',
      'site_visits', 
      'pipedrive_submissions',
      'flow_metrics_config',
      'canonical_stage_mappings',
      'pipedrive_deal_flow_data',
      'pipedrive_metric_data',
      'schema_migrations'
    ];
    
    for (const tableName of tables) {
      console.log(`📋 Table: ${tableName}`);
      console.log('─'.repeat(50));
      
      // Check if table exists
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        )
      `;
      
      if (!tableExists[0].exists) {
        console.log(`❌ Table ${tableName} does not exist\n`);
        continue;
      }
      
      // Get table structure
      const columns = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
        ORDER BY ordinal_position
      `;
      
      console.log('Columns:');
      columns.forEach(col => {
        let type = col.data_type;
        if (col.character_maximum_length) {
          type += `(${col.character_maximum_length})`;
        } else if (col.numeric_precision) {
          type += `(${col.numeric_precision}${col.numeric_scale ? ',' + col.numeric_scale : ''})`;
        }
        
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        
        console.log(`  ${col.column_name} ${type} ${nullable}${defaultVal}`);
      });
      
      // Get indexes
      const indexes = await sql`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = ${tableName}
        AND schemaname = 'public'
        ORDER BY indexname
      `;
      
      if (indexes.length > 0) {
        console.log('\nIndexes:');
        indexes.forEach(idx => {
          console.log(`  ${idx.indexname}: ${idx.indexdef}`);
        });
      }
      
      // Get constraints
      const constraints = await sql`
        SELECT 
          conname,
          contype,
          pg_get_constraintdef(oid) as definition
        FROM pg_constraint 
        WHERE conrelid = ${tableName}::regclass
        ORDER BY conname
      `;
      
      if (constraints.length > 0) {
        console.log('\nConstraints:');
        constraints.forEach(con => {
          console.log(`  ${con.conname} (${con.contype}): ${con.definition}`);
        });
      }
      
      // Get table comments
      const comments = await sql`
        SELECT 
          a.attname as colname,
          d.description
        FROM pg_description d
        JOIN pg_attribute a ON d.objoid = a.attrelid AND d.objsubid = a.attnum
        JOIN pg_class c ON a.attrelid = c.oid
        WHERE c.relname = ${tableName}
        AND a.attnum > 0
        AND NOT a.attisdropped
        ORDER BY a.attnum
      `;
      
      if (comments.length > 0) {
        console.log('\nComments:');
        comments.forEach(com => {
          console.log(`  ${com.colname}: ${com.description}`);
        });
      }
      
      console.log('\n');
    }
    
  } catch (error) {
    console.error('❌ Error analyzing schema:', error);
  }
}

analyzeSchema();
