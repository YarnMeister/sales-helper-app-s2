#!/usr/bin/env tsx
/**
 * Test that testDatabaseConnection() works correctly
 */

import { testDatabaseConnection } from '../lib/database/core/connection';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function test() {
  console.log('🔍 Testing database connection function...\n');

  try {
    const result = await testDatabaseConnection();
    
    if (result === true) {
      console.log('✅ testDatabaseConnection() returned true');
      console.log('✅ Database connection is working correctly!');
      process.exit(0);
    } else {
      console.log('❌ testDatabaseConnection() returned false');
      console.log('❌ Database connection failed!');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('❌ Error:', error?.message || error);
    process.exit(1);
  }
}

test();

