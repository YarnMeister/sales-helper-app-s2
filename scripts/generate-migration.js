#!/usr/bin/env node

/**
 * Non-interactive Drizzle migration generation script
 * This script generates migrations without requiring user input
 */

import { generate } from 'drizzle-kit';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../.env.local') });
config({ path: path.join(__dirname, '../.env') });

async function generateMigration() {
  console.log('🔄 Generating Drizzle migration...');
  
  try {
    // Set environment variables for non-interactive mode
    process.env.DRIZZLE_KIT_NON_INTERACTIVE = 'true';
    process.env.DRIZZLE_KIT_VERBOSE = 'false';
    
    const result = await generate({
      schema: './lib/database/schema.ts',
      out: './lib/database/migrations',
      dialect: 'postgresql',
      dbCredentials: {
        url: process.env.DATABASE_URL,
      },
      verbose: false,
      strict: true,
    });
    
    console.log('✅ Migration generated successfully!');
    console.log('📁 Check the migrations folder for new files');
    
  } catch (error) {
    console.error('❌ Failed to generate migration:', error.message);
    process.exit(1);
  }
}

// Run the migration generation
generateMigration().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
