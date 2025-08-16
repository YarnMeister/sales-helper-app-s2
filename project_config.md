# Project Configuration - Sales Helper App

## Context
Before each new change, read `specs/Archive/original-product-req-doc.md` as context only to get an overall idea of the app. For actual changes focus only on the current prompt details.

## Process for Each New Prompt
For each new prompt, before making changes, review the instructions below and confirm:
1. are they clear
2. any gaps  
3. call out any parts we can skip
4. Keep in mind this is a 2nd generation rewrite, Greenfield's but based on learning from original app.

## Development Journal

### Environment Setup
- **Commit:** `90577db` - Setup simplified greenfield environment configuration
- **Branch:** `setup-environment`
- **Files:** package.json, env.example, lib/env.ts, lib/supabase.ts, lib/database.ts, tsconfig.json, next.config.js, README.md, .gitignore
- **Status:** ✅ Complete
- **Production Notes:** Basic Next.js + Supabase setup ready

### Database Schema Implementation  
- **Commit:** `eac900d` - Implement comprehensive database schema with full validation
- **Branch:** `setup-database-schema`
- **Files:** supabase/migrations/*.sql, lib/types/database.ts, lib/database-utils.ts, supabase/README.md
- **Status:** ✅ Complete
- **Production Notes:** Migrations ready, requires Supabase project setup and CLI installation

### Neon + Upstash Direct Implementation
- **Commit:** `bf9b075` - Migrate from Supabase to Neon + Upstash direct implementation
- **Branch:** `neon-upstash-direct`
- **Files:** lib/env.ts, lib/supabase.ts → lib/db.ts, lib/cache.ts, lib/database-utils.ts, migrations/*.sql, scripts/*.js, package.json, README.md
- **Status:** ✅ Complete
- **Production Notes:** Direct Neon Postgres + Upstash Redis setup, 7 simplified environment variables, migration system ready
- **Vercel URLs:** 
  - Production: https://sales-helper-app-s2-uqms-jan-jr-2762s-projects.vercel.app/
  - Main Branch: https://sales-helper-app-s2-uqms-git-main-jan-jr-2762s-projects.vercel.app/
