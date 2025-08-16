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

## Database Schema

The app uses a flat JSONB structure:
- `requests` - Main requests table with JSONB contact and line_items
- `mock_pipedrive_submissions` - Testing support table

## Development

- `npm run dev` - Start development server with environment check and migrations
- `npm run build` - Build for production with environment check and migrations
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run database migrations
- `npm run env:check` - Validate environment configuration
