# Sales Helper App

A Next.js application for managing sales contacts, line items, and check-ins.

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
   - Supabase project URL and keys
   - Pipedrive API token

3. **Run development server:**
   ```bash
   npm run dev
   ```

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `PIPEDRIVE_API_TOKEN` - Pipedrive API token
- `PIPEDRIVE_SUBMIT_MODE` - 'mock' or 'live' (defaults to 'mock')

## Database Schema

The app uses three main tables:
- `contacts` - Customer contact information
- `line_items` - Sales line items linked to contacts
- `check_ins` - Customer check-in records

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
