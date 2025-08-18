/** @type {import('next').NextConfig} */

// Load environment variables before Next.js config
const { config } = require('dotenv');
const path = require('path');

// Load .env.local and .env files
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

const nextConfig = {
  experimental: {
    // Remove deprecated appDir option
  },
  // Explicitly pass environment variables to Next.js
  env: {
    SLACK_CHANNEL_LIVE: process.env.SLACK_CHANNEL_LIVE,
    SLACK_CHANNEL_MOCK: process.env.SLACK_CHANNEL_MOCK,
    EXTERNAL_SUBMIT_MODE: process.env.EXTERNAL_SUBMIT_MODE,
  }
}

module.exports = nextConfig
