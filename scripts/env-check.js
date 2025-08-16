#!/usr/bin/env node

const path = require('path');
const { config } = require('dotenv');

// Load environment variables from .env.local first, then .env
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function checkEnvironment() {
  console.log('🔍 Validating environment configuration...\n');
  
  try {
    // Check if required environment variables exist
    const requiredVars = [
      'DATABASE_URL',
      'REDIS_URL', 
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
      new URL(process.env.REDIS_URL);
    } catch {
      throw new Error('Invalid REDIS_URL format');
    }
    
    console.log('✅ Environment validation successful!');
    console.log('\n📋 Configuration Summary:');
    console.log(`   Environment: ${process.env.APP_ENV || 'development'}`);
    console.log(`   Pipedrive Mode: ${process.env.PIPEDRIVE_SUBMIT_MODE || 'mock'}`);
    console.log(`   Database: ${maskUrl(process.env.DATABASE_URL)}`);
    console.log(`   Cache: ${maskUrl(process.env.REDIS_URL)}`);
    console.log(`   Slack Alerts: ${process.env.SLACK_ALERT_WEBHOOK ? 'Enabled' : 'Disabled'}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Environment validation failed:');
    console.error(error.message);
    console.log('\n💡 Check your .env.local file against .env.example');
    console.log('   Make sure you have:');
    console.log('   - DATABASE_URL (Neon connection string)');
    console.log('   - REDIS_URL (Upstash Redis connection string)');
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
