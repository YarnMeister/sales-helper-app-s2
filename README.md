# Sales Helper App

A Next.js application for managing sales contacts, line items, and check-ins using Neon Postgres and Upstash Redis.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp env.example .env.local
   ```
   
   Then edit `.env.local` with your actual values:
   - Neon Postgres DATABASE_URL
   - Upstash Redis REDIS_URL
   - Pipedrive API token

3. **Run development server:**
   ```bash
   npm run dev
   ```

## Environment Variables

- `APP_ENV` - Environment ('development' or 'production')
- `DATABASE_URL` - Neon Postgres connection string
- `REDIS_URL` - Upstash Redis connection string
- `PIPEDRIVE_API_TOKEN` - Pipedrive API token
- `PIPEDRIVE_BASE_URL` - Pipedrive API base URL
- `PIPEDRIVE_SUBMIT_MODE` - 'mock' or 'live' (defaults to 'mock')
- `SLACK_BOT_TOKEN` - Optional Slack bot token for alerts
- `SLACK_CHANNEL` - Slack channel for notifications (defaults to '#out-of-office')

## Environment-Based Behavior

The app uses different strategies for local development vs production to prevent test data from affecting production users:

### **Pipedrive Submissions**
- **Control**: `PIPEDRIVE_SUBMIT_MODE` environment variable
- **Development**: `PIPEDRIVE_SUBMIT_MODE=mock` → Saves to `mock_pipedrive_submissions` table
- **Production**: `PIPEDRIVE_SUBMIT_MODE=live` → Submits to actual Pipedrive API
- **No environment variable changes needed** - uses existing configuration

### **Slack Notifications**
- **Control**: `NODE_ENV` environment variable
- **Development**: `NODE_ENV=development` → Posts to `#sales-helper-test` channel
- **Production**: `NODE_ENV=production` → Posts to `SLACK_CHANNEL` (defaults to '#out-of-office')
- **No environment variable changes needed** - automatic based on deployment environment

### **Database Tables (Requests & Site Visits)**
- **Control**: `NODE_ENV` environment variable
- **Development**: `NODE_ENV=development` → Uses `mock_requests` and `mock_site_visits` tables
- **Production**: `NODE_ENV=production` → Uses `requests` and `site_visits` tables
- **No environment variable changes needed** - automatic based on deployment environment

### **Contacts & Line Items**
- **Read-only reference tables** - No environment-based switching
- **Shared between environments** - Used for product catalog and contact lookup

## Database Schema

The app uses a flat JSONB structure:
- `requests` - Main requests table with JSONB contact and line_items
- `mock_requests` - Development requests table (identical structure)
- `site_visits` - Site visit check-ins for Slack notifications
- `mock_site_visits` - Development site visits table (identical structure)
- `mock_pipedrive_submissions` - Testing support table for Pipedrive submissions

## Development

- `npm run dev` - Start development server with environment check and migrations
- `npm run build` - Build for production with environment check and migrations
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run database migrations
- `npm run env:check` - Validate environment configuration
# Trigger deployment
