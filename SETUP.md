# Setup Guide - Sales Helper App

## Environment Configuration

### 1. Neon Postgres Setup ✅

Your Neon database is already configured. Update your `.env.local` with:

```bash
# Neon Postgres Database
DATABASE_URL=postgres://neondb_owner:npg_4IuSMeiaL3sH@ep-weathered-lake-abmkdukv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_4IuSMeiaL3sH@ep-weathered-lake-abmkdukv.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

### 2. Upstash Redis Setup

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the `REDIS_URL` from your database dashboard
4. Update your `.env.local`:

```bash
REDIS_URL=rediss://default:your_token@your_host.upstash.io:6379
```

### 3. Pipedrive Setup

1. Get your Pipedrive API token from your Pipedrive account
2. Update your `.env.local`:

```bash
PIPEDRIVE_API_TOKEN=your_actual_pipedrive_token
PIPEDRIVE_BASE_URL=https://api.pipedrive.com/v1
PIPEDRIVE_SUBMIT_MODE=mock  # Change to 'live' for production
```

### 4. Optional: Slack Alerts

If you want Slack notifications:

```bash
SLACK_ALERT_WEBHOOK=https://hooks.slack.com/services/your/webhook/url
```

## Complete .env.local Example

```bash
# Environment Configuration
APP_ENV=development

# Neon Postgres Database
DATABASE_URL=postgres://neondb_owner:npg_4IuSMeiaL3sH@ep-weathered-lake-abmkdukv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_4IuSMeiaL3sH@ep-weathered-lake-abmkdukv.eu-west-2.aws.neon.tech/neondb?sslmode=require

# Upstash Redis Cache
REDIS_URL=rediss://default:your_token@your_host.upstash.io:6379

# Pipedrive Configuration
PIPEDRIVE_API_TOKEN=your_pipedrive_api_token
PIPEDRIVE_BASE_URL=https://api.pipedrive.com/v1
PIPEDRIVE_SUBMIT_MODE=mock

# Optional: Slack Alerts
SLACK_ALERT_WEBHOOK=https://hooks.slack.com/services/your/webhook/url
```

## Testing Your Setup

1. **Check environment:**
   ```bash
   npm run env:check
   ```

2. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## Vercel Deployment

Add these environment variables to your Vercel project:

- `APP_ENV`
- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `REDIS_URL`
- `PIPEDRIVE_API_TOKEN`
- `PIPEDRIVE_BASE_URL`
- `PIPEDRIVE_SUBMIT_MODE`
- `SLACK_ALERT_WEBHOOK` (optional)
