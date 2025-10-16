#!/usr/bin/env tsx
/**
 * Verify that the Drizzle ORM fix works correctly
 * This tests the actual production code path
 */

import { createStandardConnection } from '../lib/database/connection-standard';
import { flowMetricsConfig } from '../lib/database/schema';
import { eq } from 'drizzle-orm';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function verifyFix() {
  console.log('🔍 Verifying Drizzle ORM fix...\n');

  try {
    const { db } = createStandardConnection();
    
    // This is the exact query from lib/db.ts that we fixed
    const result = await db
      .select()
      .from(flowMetricsConfig)
      .where(eq(flowMetricsConfig.isActive, true))
      .orderBy(flowMetricsConfig.sortOrder, flowMetricsConfig.displayTitle);

    console.log('✅ Query executed successfully!');
    console.log(`📊 Found ${result.length} active metrics:\n`);
    
    result.forEach((metric, index) => {
      console.log(`${index + 1}. ${metric.displayTitle} (${metric.metricKey})`);
      console.log(`   ID: ${metric.id} (type: ${typeof metric.id})`);
      console.log(`   Sort Order: ${metric.sortOrder}`);
      console.log('');
    });

    if (result.length === 4) {
      console.log('✅ SUCCESS: All 4 metrics returned correctly!');
      console.log('✅ The Drizzle ORM fix is working as expected.');
      process.exit(0);
    } else {
      console.log(`❌ FAILURE: Expected 4 metrics but got ${result.length}`);
      process.exit(1);
    }

  } catch (error: any) {
    console.error('❌ Error:', error?.message || error);
    console.error('\nStack trace:', error?.stack);
    process.exit(1);
  }
}

verifyFix();

