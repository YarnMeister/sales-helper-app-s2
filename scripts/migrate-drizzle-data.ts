#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function migrateDrizzleData() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL or DATABASE_URL_UNPOOLED not set');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    console.log('🔄 Migrating data to Drizzle schema...\n');

    // 1. Insert default flow metrics configuration
    console.log('📝 Inserting default flow metrics configuration...');
    
    const defaultMetrics = [
      {
        metric_key: 'lead-conversion',
        display_title: 'Lead Conversion Time',
        canonical_stage: 'Lead Conversion',
        sort_order: 1,
        is_active: true
      },
      {
        metric_key: 'quote-conversion',
        display_title: 'Quote Conversion Time',
        canonical_stage: 'Quote Conversion',
        sort_order: 2,
        is_active: true
      },
      {
        metric_key: 'order-conversion',
        display_title: 'Order Conversion Time',
        canonical_stage: 'Order Conversion',
        sort_order: 3,
        is_active: true
      },
      {
        metric_key: 'procurement',
        display_title: 'Procurement Lead Time',
        canonical_stage: 'Procurement',
        sort_order: 4,
        is_active: true
      },
      {
        metric_key: 'manufacturing',
        display_title: 'Manufacturing Lead Time',
        canonical_stage: 'Manufacturing',
        sort_order: 5,
        is_active: true
      },
      {
        metric_key: 'delivery',
        display_title: 'Delivery Lead Time',
        canonical_stage: 'Delivery',
        sort_order: 6,
        is_active: true
      }
    ];

    for (const metric of defaultMetrics) {
      try {
        await sql`
          INSERT INTO flow_metrics_config (metric_key, display_title, canonical_stage, sort_order, is_active)
          VALUES (${metric.metric_key}, ${metric.display_title}, ${metric.canonical_stage}, ${metric.sort_order}, ${metric.is_active})
          ON CONFLICT (metric_key) DO NOTHING
        `;
        console.log(`✅ Inserted metric: ${metric.display_title}`);
      } catch (error) {
        console.log(`⏭️  Metric already exists: ${metric.display_title}`);
      }
    }

    // 2. Insert default canonical stage mappings
    console.log('\n📝 Inserting default canonical stage mappings...');
    
    const defaultMappings = [
      {
        canonical_stage: 'Order Conversion',
        start_stage: 'Order Received - Johan',
        end_stage: 'Quality Control'
      }
    ];

    for (const mapping of defaultMappings) {
      try {
        // Get the metric config ID for Order Conversion
        const [metricConfig] = await sql`
          SELECT id FROM flow_metrics_config 
          WHERE canonical_stage = ${mapping.canonical_stage}
          LIMIT 1
        `;

        if (metricConfig) {
          await sql`
            INSERT INTO canonical_stage_mappings (canonical_stage, start_stage, end_stage, metric_config_id)
            VALUES (${mapping.canonical_stage}, ${mapping.start_stage}, ${mapping.end_stage}, ${metricConfig.id})
            ON CONFLICT DO NOTHING
          `;
          console.log(`✅ Inserted mapping: ${mapping.canonical_stage}`);
        } else {
          console.log(`⚠️  No metric config found for: ${mapping.canonical_stage}`);
        }
      } catch (error) {
        console.log(`⏭️  Mapping already exists: ${mapping.canonical_stage}`);
      }
    }

    // 3. Verify data was inserted
    console.log('\n🔍 Verifying data migration...');
    
    const metricsCount = await sql`SELECT COUNT(*) FROM flow_metrics_config`;
    const mappingsCount = await sql`SELECT COUNT(*) FROM canonical_stage_mappings`;
    
    console.log(`📊 Flow metrics config: ${metricsCount[0].count} records`);
    console.log(`📊 Canonical stage mappings: ${mappingsCount[0].count} records`);

    if (parseInt(metricsCount[0].count) > 0 && parseInt(mappingsCount[0].count) > 0) {
      console.log('\n🎉 Data migration completed successfully!');
      console.log('✅ Default metrics and mappings are now available');
    } else {
      console.log('\n❌ Data migration verification failed');
      console.log('Some expected data is missing');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Data migration failed:', error instanceof Error ? error.message : String(error));
    console.error('Full error:', error);
    process.exit(1);
  }
}

migrateDrizzleData();
