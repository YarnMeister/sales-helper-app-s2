#!/usr/bin/env node

const path = require('path');
const { config } = require('dotenv');

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env') });

async function checkEnvironment() {
  console.log('🔍 Validating environment configuration...\n');
  
  try {
    // Import and validate environment
    const { validateEnvironment, env, getDatabaseConfig, getCacheConfig } = require('../lib/env.ts');
    
    validateEnvironment();
    
    const dbConfig = getDatabaseConfig();
    const cacheConfig = getCacheConfig();
    
    console.log('✅ Environment validation successful!');
    console.log('\n📋 Configuration Summary:');
    console.log(`   Environment: ${env.APP_ENV}`);
    console.log(`   Pipedrive Mode: ${env.PIPEDRIVE_SUBMIT_MODE}`);
    console.log(`   Database: ${maskUrl(dbConfig.url)}`);
    console.log(`   Cache: ${maskUrl(cacheConfig.url)}`);
    console.log(`   Slack Alerts: ${env.SLACK_ALERT_WEBHOOK ? 'Enabled' : 'Disabled'}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Environment validation failed:');
    console.error(error.message);
    console.log('\n💡 Check your .env file against .env.example');
    process.exit(1);
  }
}

function maskUrl(url) {
  if (!url) return 'Not configured';
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.username ? '***:***@' : ''}${urlObj.host}${urlObj.pathname}`;
  } catch {
    return 'Invalid URL';
  }
}

checkEnvironment();
