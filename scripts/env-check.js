#!/usr/bin/env node

const path = require('path');
const { config } = require('dotenv');

// Only load .env files in development
if (process.env.NODE_ENV !== 'production') {
  config({ path: path.resolve(process.cwd(), '.env.local') });
  config({ path: path.resolve(process.cwd(), '.env') });
}

async function checkEnvironment() {
  console.log('🔍 Validating environment configuration...\n');
  
  try {
    // Check if required environment variables exist
    const requiredVars = [
      'DATABASE_URL',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'PIPEDRIVE_API_TOKEN'
    ];
    
    const missingVars = [];
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    // Check if URLs are valid
    try {
      new URL(process.env.DATABASE_URL);
    } catch {
      throw new Error('Invalid DATABASE_URL format');
    }
    
    try {
      new URL(process.env.UPSTASH_REDIS_REST_URL);
    } catch {
      throw new Error('Invalid UPSTASH_REDIS_REST_URL format');
    }
    
    console.log('✅ Environment validation successful!');
    console.log('\n📋 Configuration Summary:');
    console.log(`   Environment: ${process.env.APP_ENV || 'development'}`);
    console.log(`   Pipedrive Mode: ${process.env.PIPEDRIVE_SUBMIT_MODE || 'mock'}`);
    console.log(`   Database: ${maskUrl(process.env.DATABASE_URL)}`);
    console.log(`   Cache: ${maskUrl(process.env.UPSTASH_REDIS_REST_URL)}`);
    console.log(`   Slack Bot: ${process.env.SLACK_BOT_TOKEN ? 'Enabled' : 'Disabled'}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Environment validation failed:');
    console.error(error.message);
    console.log('\n💡 Check your .env.local file against .env.example');
    console.log('   Make sure you have:');
    console.log('   - DATABASE_URL (Neon connection string)');
    console.log('   - UPSTASH_REDIS_REST_URL (Upstash Redis REST URL)');
    console.log('   - UPSTASH_REDIS_REST_TOKEN (Upstash Redis REST token)');
    console.log('   - PIPEDRIVE_API_TOKEN (your Pipedrive API token)');
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
