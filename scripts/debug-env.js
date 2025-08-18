#!/usr/bin/env node

console.log('=== Environment Diagnostic ===\n');

// Check if dotenv is loading files
const path = require('path');
const fs = require('fs');

const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

console.log('1. Environment files:');
console.log(`   .env.local exists: ${fs.existsSync(envLocalPath)}`);
console.log(`   .env exists: ${fs.existsSync(envPath)}`);

if (fs.existsSync(envLocalPath)) {
  console.log(`   .env.local content preview:`);
  const content = fs.readFileSync(envLocalPath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  lines.forEach(line => {
    const [key] = line.split('=');
    console.log(`     ${key}=***`);
  });
}

console.log('\n2. Before dotenv load:');
console.log(`   SLACK_CHANNEL_LIVE: ${process.env.SLACK_CHANNEL_LIVE || 'undefined'}`);
console.log(`   SLACK_CHANNEL_MOCK: ${process.env.SLACK_CHANNEL_MOCK || 'undefined'}`);
console.log(`   EXTERNAL_SUBMIT_MODE: ${process.env.EXTERNAL_SUBMIT_MODE || 'undefined'}`);

// Load dotenv
const { config } = require('dotenv');
const result1 = config({ path: envLocalPath });
const result2 = config({ path: envPath });

console.log('\n3. Dotenv loading results:');
console.log(`   .env.local loaded: ${!result1.error}`);
if (result1.error) console.log(`   .env.local error: ${result1.error.message}`);
console.log(`   .env loaded: ${!result2.error}`);
if (result2.error) console.log(`   .env error: ${result2.error.message}`);

console.log('\n4. After dotenv load:');
console.log(`   SLACK_CHANNEL_LIVE: ${process.env.SLACK_CHANNEL_LIVE || 'undefined'}`);
console.log(`   SLACK_CHANNEL_MOCK: ${process.env.SLACK_CHANNEL_MOCK || 'undefined'}`);
console.log(`   EXTERNAL_SUBMIT_MODE: ${process.env.EXTERNAL_SUBMIT_MODE || 'undefined'}`);

console.log('\n5. All environment variables:');
Object.keys(process.env)
  .filter(key => key.includes('SLACK') || key.includes('SUBMIT') || key.includes('EXTERNAL'))
  .sort()
  .forEach(key => {
    console.log(`   ${key}: ${process.env[key]}`);
  });
