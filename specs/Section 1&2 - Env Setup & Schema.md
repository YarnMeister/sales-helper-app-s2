Sales Helper App - Enhanced Implementation Guide
Section 1: Environment Setup & Foundation

1.1 Environment Configuration

Goal: Establish robust environment management with proper validation and environment-aware configuration

Cursor Prompt:
Create comprehensive environment configuration system for the Sales Helper App.

First, create `.env.example` with all required variables:

# Environment Configuration
APP_ENV=test

# Test Database (Supabase)
SUPABASE_URL_TEST=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_TEST=your_test_service_role_key

# Production Database (Supabase) 
SUPABASE_URL_PROD=https://your-prod-project.supabase.co
SUPABASE_SERVICE_ROLE_PROD=your_prod_service_role_key

# Pipedrive Configuration
PIPEDRIVE_API_TOKEN=your_pipedrive_api_token
PIPEDRIVE_BASE_URL=https://api.pipedrive.com/v1
PIPEDRIVE_SUBMIT_MODE=mock

Create `/lib/env.ts` with complete environment validation:

import { z } from 'zod';
import { log } from './log';

// Environment schema validation
const EnvSchema = z.object({
  APP_ENV: z.enum(['test', 'prod']).default('test'),
  SUPABASE_URL_TEST: z.string().url(),
  SUPABASE_SERVICE_ROLE_TEST: z.string().min(1),
  SUPABASE_URL_PROD: z.string().url(),
  SUPABASE_SERVICE_ROLE_PROD: z.string().min(1),
  PIPEDRIVE_API_TOKEN: z.string().min(1),
  PIPEDRIVE_BASE_URL: z.string().url().default('https://api.pipedrive.com/v1'),
  PIPEDRIVE_SUBMIT_MODE: z.enum(['live', 'mock']).default('mock'),
});

// Validate and parse environment variables
const validateEnv = () => {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Environment validation failed:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
};

// Export validated environment configuration
export const env = validateEnv();

// Environment-aware Supabase credentials
export const getSupabaseConfig = () => {
  const isProduction = env.APP_ENV === 'prod';
  
  return {
    url: isProduction ? env.SUPABASE_URL_PROD : env.SUPABASE_URL_TEST,
    serviceRoleKey: isProduction ? env.SUPABASE_SERVICE_ROLE_PROD : env.SUPABASE_SERVICE_ROLE_TEST,
    environment: env.APP_ENV
  };
};

// Validate environment on module load
export const validateEnvironment = () => {
  try {
    const config = getSupabaseConfig();
    log(`Environment validated successfully`, { 
      environment: config.environment,
      pipedriveMode: env.PIPEDRIVE_SUBMIT_MODE 
    });
    return true;
  } catch (error) {
    log(`Environment validation failed`, { error: (error as Error).message });
    throw error;
  }
};

Create `/scripts/env-check.js` for environment validation:

#!/usr/bin/env node

/**
 * Environment validation script
 * Usage: npm run env:check
 */

const path = require('path');
const { config } = require('dotenv');

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env') });

async function checkEnvironment() {
  console.log('🔍 Validating environment configuration...\n');
  
  try {
    // Import and validate environment
    const { validateEnvironment, env, getSupabaseConfig } = require('../lib/env.ts');
    
    validateEnvironment();
    
    const supabaseConfig = getSupabaseConfig();
    
    console.log('✅ Environment validation successful!');
    console.log('\n📋 Configuration Summary:');
    console.log(`   Environment: ${supabaseConfig.environment}`);
    console.log(`   Pipedrive Mode: ${env.PIPEDRIVE_SUBMIT_MODE}`);
    console.log(`   Supabase URL: ${supabaseConfig.url}`);
    console.log(`   Service Role Key: ${'*'.repeat(20)}...${supabaseConfig.serviceRoleKey.slice(-4)}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Environment validation failed:');
    console.error(error.message);
    console.log('\n💡 Check your .env file against .env.example');
    process.exit(1);
  }
}

checkEnvironment();

Update `package.json` scripts section:

{
  "scripts": {
    "env:check": "node scripts/env-check.js",
    "test:unit": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "dev": "next dev",
    "dev:mock": "APP_ENV=test PIPEDRIVE_SUBMIT_MODE=mock npm run dev",
    "build": "npm run env:check && next build",
    "start": "npm run env:check && next start"
  }
}

Install required dependencies:
npm install zod @supabase/supabase-js dotenv
npm install -D vitest @playwright/test @types/node

Make the env-check script executable:
chmod +x scripts/env-check.js

Manual Validation Steps:

 Run npm run env:check and verify it validates environment variables correctly
 Test with missing env vars to ensure proper error messages
 Verify APP_ENV=test vs APP_ENV=prod selects different DB credentials
 Confirm all new dependencies are installed and importable
 Test environment switching by changing APP_ENV and running validation
 Verify that build and start scripts now validate environment first

Checkbox: - [x] 1.1 Environment Configuration Complete

1.2 Database Foundation & Schema
Goal: Create flat JSONB schema with proper indexing for performance and mobile-first considerations
Cursor Prompt:
Create database schema migrations for the new flat JSONB structure with PRD-specific requirements.

Create `/supabase/migrations/20250815000001_requests_flat_schema.sql` with exactly this content:

CREATE TYPE request_status AS ENUM ('draft','submitted','failed');

CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT UNIQUE,                       -- QR-001
  status request_status NOT NULL DEFAULT 'draft',
  salesperson_first_name TEXT,
  salesperson_selection TEXT CHECK (salesperson_selection IN ('Luyanda', 'James', 'Stefan')), -- Mobile-first PRD requirement
  mine_group TEXT,
  mine_name TEXT,
  contact JSONB,                                -- ContactJSON
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,-- [LineItem]
  comment TEXT,
  pipedrive_deal_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Request ID generation function with proper sequential logic
CREATE OR REPLACE FUNCTION generate_request_id()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(request_id FROM 4) AS INTEGER)), 0) + 1
    INTO next_num
    FROM requests
    WHERE request_id ~ '^QR-[0-9]+$';
    
    RETURN 'QR-' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Add trigger for auto-generation of request IDs
CREATE TRIGGER trg_generate_request_id 
    BEFORE INSERT ON requests 
    FOR EACH ROW 
    WHEN (NEW.request_id IS NULL)
    EXECUTE FUNCTION generate_request_id();

-- JSONB validation function for mobile-first contact requirements
CREATE OR REPLACE FUNCTION validate_contact_jsonb(contact_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN contact_data ? 'personId' 
       AND contact_data ? 'name'
       AND contact_data ? 'mineGroup'
       AND contact_data ? 'mineName';
END;
$$ LANGUAGE plpgsql;

-- Generated columns for fast filtering
ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS contact_person_id_int INTEGER GENERATED ALWAYS AS ((contact->>'personId')::int) STORED,
  ADD COLUMN IF NOT EXISTS contact_org_id_int    INTEGER GENERATED ALWAYS AS ((contact->>'orgId')::int) STORED,
  ADD COLUMN IF NOT EXISTS contact_mine_group    TEXT GENERATED ALWAYS AS (contact->>'mineGroup') STORED,
  ADD COLUMN IF NOT EXISTS contact_mine_name     TEXT GENERATED ALWAYS AS (contact->>'mineName') STORED;

-- Btree indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_status     ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_mine_group ON requests(contact_mine_group);
CREATE INDEX IF NOT EXISTS idx_requests_mine_name  ON requests(contact_mine_name);
CREATE INDEX IF NOT EXISTS idx_requests_person_id  ON requests(contact_person_id_int);
CREATE INDEX IF NOT EXISTS idx_requests_org_id     ON requests(contact_org_id_int);
CREATE INDEX IF NOT EXISTS idx_requests_salesperson ON requests(salesperson_selection);

-- JSONB GIN for containment queries
CREATE INDEX IF NOT EXISTS idx_requests_line_items_gin ON requests USING GIN (line_items jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_requests_contact_gin ON requests USING GIN (contact jsonb_path_ops);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_requests_updated ON requests;
CREATE TRIGGER trg_requests_updated BEFORE UPDATE ON requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

Create `/supabase/migrations/20250815000002_support_tables.sql` with:

CREATE TABLE IF NOT EXISTS kv_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kv_updated ON kv_cache(updated_at DESC);

-- Mock submissions for testing
CREATE TABLE IF NOT EXISTS mock_pipedrive_submissions (
  id BIGSERIAL PRIMARY KEY,
  request_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  simulated_deal_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mock_req ON mock_pipedrive_submissions(request_id);

Apply these migrations to both test and prod databases using environment-aware commands:
supabase migration up --db-url $SUPABASE_URL_TEST
supabase migration up --db-url $SUPABASE_URL_PROD
Manual Validation Steps:

 Run supabase migration up and verify no errors for both environments
 Check that all tables exist: requests, kv_cache, mock_pipedrive_submissions
 Verify all indexes are created correctly, including new salesperson index
 Test generated columns work by inserting sample JSONB data
 Confirm trigger updates updated_at on row updates
 Test automatic request ID generation via trigger
 Verify contact JSONB validation function works correctly
 Test environment switching with different database connections
 Verify schema consistency between test and prod environments
 Test salesperson_selection constraint with valid/invalid values

Checkbox: - [x] 1.2 Database Foundation & Schema Complete

Section 1.3 Convert to Neon (Postgres) and Upstash Redis (contacts/products KV)

Neon + Upstash Migration Plan - Sales Helper App
Overview
Migrate from Supabase to Neon (Postgres) + Upstash (Redis) while keeping the flat JSONB schema and all existing functionality. This simplifies the environment surface, improves caching, and maintains perfect Vercel integration.

1. Environment Configuration Update
Cursor Prompt:
Update the environment configuration to use Neon Postgres and Upstash Redis instead of Supabase.

Update `/lib/env.ts` to use the new simplified environment variables:

import { z } from 'zod';
import { log } from './log';

// Simplified environment schema for Neon + Upstash
const EnvSchema = z.object({
  APP_ENV: z.enum(['test', 'prod']).default('test'),
  
  // Neon Postgres - single DATABASE_URL for both environments
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),
  
  // Upstash Redis
  REDIS_URL: z.string().url('Invalid REDIS_URL'),
  
  // Pipedrive Configuration (unchanged)
  PIPEDRIVE_API_TOKEN: z.string().min(1),
  PIPEDRIVE_BASE_URL: z.string().url().default('https://api.pipedrive.com/v1'),
  PIPEDRIVE_SUBMIT_MODE: z.enum(['live', 'mock']).default('mock'),
  
  // Optional: Slack alerting
  SLACK_ALERT_WEBHOOK: z.string().url().optional(),
});

// Validate and parse environment variables
const validateEnv = () => {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Environment validation failed:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
};

// Export validated environment configuration
export const env = validateEnv();

// Database configuration helper
export const getDatabaseConfig = () => {
  return {
    url: env.DATABASE_URL,
    environment: env.APP_ENV
  };
};

// Cache configuration helper
export const getCacheConfig = () => {
  return {
    url: env.REDIS_URL,
    environment: env.APP_ENV
  };
};

// Validate environment on module load
export const validateEnvironment = () => {
  try {
    const dbConfig = getDatabaseConfig();
    const cacheConfig = getCacheConfig();
    
    log(`Environment validated successfully`, { 
      environment: env.APP_ENV,
      pipedriveMode: env.PIPEDRIVE_SUBMIT_MODE,
      hasDatabase: !!dbConfig.url,
      hasCache: !!cacheConfig.url
    });
    return true;
  } catch (error) {
    log(`Environment validation failed`, { error: (error as Error).message });
    throw error;
  }
};

Update `.env.example` with new simplified structure:

# Environment Configuration
APP_ENV=test

# Neon Postgres Database
DATABASE_URL=postgresql://user:pass@neon-host/db?sslmode=require

# Upstash Redis Cache
REDIS_URL=rediss://:<token>@<host>:<port>

# Pipedrive Configuration
PIPEDRIVE_API_TOKEN=your_pipedrive_api_token
PIPEDRIVE_BASE_URL=https://api.pipedrive.com/v1
PIPEDRIVE_SUBMIT_MODE=mock

# Optional: Slack Alerts
SLACK_ALERT_WEBHOOK=https://hooks.slack.com/services/your/webhook/url

Update `/scripts/env-check.js` for new environment structure:

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
Manual Validation:

 Environment variables simplified to 7 total variables
 DATABASE_URL supports both test and prod via Neon branching
 REDIS_URL configured for Upstash connection
 Environment validation catches missing/invalid URLs
 URL masking works in env-check script
 All existing Pipedrive configuration preserved


2. Database Connection with Neon Postgres
Cursor Prompt:
Replace Supabase client with native Postgres connection using pg library for Neon.

Install required dependencies:
npm install pg @types/pg
npm uninstall @supabase/supabase-js

Create `/lib/db.ts` with native Postgres connection:

import { Pool, PoolClient } from 'pg';
import { getDatabaseConfig } from './env';
import { log } from './log';
import { AppError } from './errors';

// Create connection pool
let pool: Pool | null = null;

export const getDbPool = (): Pool => {
  if (!pool) {
    const config = getDatabaseConfig();
    
    pool = new Pool({
      connectionString: config.url,
      ssl: config.url.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Handle pool errors
    pool.on('error', (err) => {
      log('Database pool error', { error: err.message });
    });
    
    log(`Database pool created for ${config.environment} environment`);
  }
  
  return pool;
};

// Get a client from the pool
export const getDbClient = async (): Promise<PoolClient> => {
  const pool = getDbPool();
  return await pool.connect();
};

// Execute a query with automatic connection management
export const query = async <T = any>(
  text: string, 
  params: any[] = []
): Promise<{ rows: T[]; rowCount: number }> => {
  const client = await getDbClient();
  
  try {
    const startTime = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - startTime;
    
    log(`Query executed`, { 
      query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      rowCount: result.rowCount 
    });
    
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0
    };
  } finally {
    client.release();
  }
};

// Utility for consistent error handling in database operations
export const withDbErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> => {
  try {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    
    log(`Database operation completed: ${context}`, { 
      duration: `${duration}ms`,
      context 
    });
    
    return result;
  } catch (error) {
    log(`Database error in ${context}`, { 
      error: error instanceof Error ? error.message : String(error),
      context 
    });
    
    if (error instanceof Error) {
      throw new AppError(`Database operation failed: ${context} - ${error.message}`, { 
        originalError: error,
        context 
      });
    }
    
    throw new AppError(`Database operation failed: ${context}`, { 
      originalError: error,
      context 
    });
  }
};

// Generate next sequential request ID using database function
export const generateRequestId = async (): Promise<string> => {
  return withDbErrorHandling(async () => {
    const result = await query('SELECT generate_request_id() as request_id');
    const newId = result.rows[0]?.request_id;
    
    if (!newId) {
      throw new Error('Failed to generate request ID');
    }
    
    log(`Generated new request ID: ${newId}`);
    return newId;
  }, 'generateRequestId');
};

// Validate contact JSONB using database function
export const validateContactJsonb = async (contact: any): Promise<boolean> => {
  return withDbErrorHandling(async () => {
    const result = await query(
      'SELECT validate_contact_jsonb($1) as is_valid',
      [JSON.stringify(contact)]
    );
    
    const isValid = result.rows[0]?.is_valid || false;
    
    log(`Contact JSONB validation result: ${isValid}`, { contact });
    
    return isValid;
  }, 'validateContactJsonb');
};

// Database health check utility
export const checkDbHealth = async (): Promise<{ 
  healthy: boolean; 
  environment: string; 
  latency?: number;
  version?: string;
}> => {
  return withDbErrorHandling(async () => {
    const startTime = Date.now();
    const config = getDatabaseConfig();
    
    // Check connection and get database version
    const result = await query('SELECT version() as version, now() as timestamp');
    const latency = Date.now() - startTime;
    
    const version = result.rows[0]?.version?.split(' ')[1] || 'Unknown';
    
    log(`Database health check passed`, { 
      latency: `${latency}ms`,
      environment: config.environment,
      version
    });
    
    return { 
      healthy: true, 
      environment: config.environment,
      latency,
      version
    };
  }, 'checkDbHealth');
};

// Graceful shutdown
export const closeDbPool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    log('Database pool closed');
  }
};

// Export for Next.js API routes cleanup
process.on('SIGTERM', closeDbPool);
process.on('SIGINT', closeDbPool);
Manual Validation:

 Connection pool created successfully with Neon DATABASE_URL
 SSL configuration works for both local and remote connections
 Query function executes SQL with parameter binding
 Error handling wraps database operations consistently
 Health check returns database version and latency
 Connection pool management handles cleanup properly
 Generate request ID function works with existing SQL
 JSONB validation function executes correctly


3. Database Migrations Setup
Cursor Prompt:
Create explicit SQL migration system to replace Supabase CLI magic with versioned migrations.

Create `/migrations/001_initial_schema.sql` with the same schema from the original plan:

-- Migration 001: Initial Schema (Neon Postgres)
-- This migrates the flat JSONB schema from the original Supabase plan

-- Create request status enum
CREATE TYPE request_status AS ENUM ('draft','submitted','failed');

-- Create requests table with flat JSONB structure
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT UNIQUE,                       -- QR-001
  status request_status NOT NULL DEFAULT 'draft',
  salesperson_first_name TEXT,
  salesperson_selection TEXT CHECK (salesperson_selection IN ('Luyanda', 'James', 'Stefan')),
  mine_group TEXT,
  mine_name TEXT,
  contact JSONB,                                -- ContactJSON
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,-- [LineItem]
  comment TEXT,
  pipedrive_deal_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Request ID generation function with proper sequential logic
CREATE OR REPLACE FUNCTION generate_request_id()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(request_id FROM 4) AS INTEGER)), 0) + 1
    INTO next_num
    FROM requests
    WHERE request_id ~ '^QR-[0-9]+$';
    
    RETURN 'QR-' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Add trigger for auto-generation of request IDs
CREATE OR REPLACE TRIGGER trg_generate_request_id 
    BEFORE INSERT ON requests 
    FOR EACH ROW 
    WHEN (NEW.request_id IS NULL)
    EXECUTE FUNCTION generate_request_id();

-- JSONB validation function for mobile-first contact requirements
CREATE OR REPLACE FUNCTION validate_contact_jsonb(contact_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN contact_data ? 'personId' 
       AND contact_data ? 'name'
       AND contact_data ? 'mineGroup'
       AND contact_data ? 'mineName';
END;
$$ LANGUAGE plpgsql;

-- Generated columns for fast filtering (Postgres 12+ feature)
ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS contact_person_id_int INTEGER GENERATED ALWAYS AS ((contact->>'personId')::int) STORED,
  ADD COLUMN IF NOT EXISTS contact_org_id_int    INTEGER GENERATED ALWAYS AS ((contact->>'orgId')::int) STORED,
  ADD COLUMN IF NOT EXISTS contact_mine_group    TEXT GENERATED ALWAYS AS (contact->>'mineGroup') STORED,
  ADD COLUMN IF NOT EXISTS contact_mine_name     TEXT GENERATED ALWAYS AS (contact->>'mineName') STORED;

-- B-tree indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_status     ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_mine_group ON requests(contact_mine_group);
CREATE INDEX IF NOT EXISTS idx_requests_mine_name  ON requests(contact_mine_name);
CREATE INDEX IF NOT EXISTS idx_requests_person_id  ON requests(contact_person_id_int);
CREATE INDEX IF NOT EXISTS idx_requests_org_id     ON requests(contact_org_id_int);
CREATE INDEX IF NOT EXISTS idx_requests_salesperson ON requests(salesperson_selection);

-- JSONB GIN indexes for containment queries
CREATE INDEX IF NOT EXISTS idx_requests_line_items_gin ON requests USING GIN (line_items jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_requests_contact_gin ON requests USING GIN (contact jsonb_path_ops);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at() 
RETURNS TRIGGER AS $$
BEGIN 
    NEW.updated_at = now(); 
    RETURN NEW; 
END; 
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_requests_updated ON requests;
CREATE TRIGGER trg_requests_updated 
    BEFORE UPDATE ON requests
    FOR EACH ROW 
    EXECUTE FUNCTION set_updated_at();

Create `/migrations/002_support_tables.sql`:

-- Migration 002: Support Tables
-- KV cache table (will be replaced by Redis but kept for migration compatibility)
CREATE TABLE IF NOT EXISTS kv_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kv_updated ON kv_cache(updated_at DESC);

-- Mock submissions for testing
CREATE TABLE IF NOT EXISTS mock_pipedrive_submissions (
  id BIGSERIAL PRIMARY KEY,
  request_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  simulated_deal_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mock_req ON mock_pipedrive_submissions(request_id);

-- Migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert migration records
INSERT INTO schema_migrations (version, name) VALUES 
  (1, 'initial_schema'),
  (2, 'support_tables')
ON CONFLICT (version) DO NOTHING;

Create `/scripts/migrate.js` for running migrations:

#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Running database migrations...\n');

    // Ensure migrations table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Get executed migrations
    const { rows: executed } = await pool.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    );
    const executedVersions = new Set(executed.map(row => row.version));

    // Read migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      const version = parseInt(file.split('_')[0]);
      const name = file.replace(/^\d+_/, '').replace(/\.sql$/, '');

      if (executedVersions.has(version)) {
        console.log(`⏭️  Migration ${version} (${name}) already applied`);
        continue;
      }

      console.log(`📝 Applying migration ${version}: ${name}`);

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Execute migration in a transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
          [version, name]
        );
        await client.query('COMMIT');
        
        console.log(`✅ Migration ${version} applied successfully`);
        appliedCount++;
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    if (appliedCount === 0) {
      console.log('✨ Database is up to date');
    } else {
      console.log(`\n🎉 Applied ${appliedCount} migrations successfully`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

Update `package.json` scripts:

{
  "scripts": {
    "db:migrate": "node scripts/migrate.js",
    "db:status": "node scripts/migration-status.js",
    "db:reset": "node scripts/reset-db.js",
    "env:check": "node scripts/env-check.js",
    "dev": "npm run env:check && next dev",
    "build": "npm run env:check && npm run db:migrate && next build",
    "start": "npm run env:check && next start"
  }
}

Make scripts executable:
chmod +x scripts/migrate.js
Manual Validation:

 Migration files contain exact same schema as original Supabase plan
 Generated columns work correctly in Postgres
 JSONB indexes created for performance
 Migration script executes SQL files in order
 Migration tracking prevents duplicate execution
 Transaction rollback works on migration failure
 All database functions (generate_request_id, validate_contact_jsonb) work
 Build script runs migrations before deployment


4. Upstash Redis Cache Implementation
Cursor Prompt:
Replace the Supabase-based cache with Upstash Redis for contacts and products caching.

Install Redis client:
npm install @upstash/redis

Create `/lib/cache.ts` with Upstash Redis integration:

import { Redis } from '@upstash/redis';
import { getCacheConfig } from './env';
import { log } from './log';

// Create Redis client
let redis: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redis) {
    const config = getCacheConfig();
    
    redis = new Redis({
      url: config.url,
      automaticDeserialization: true, // Automatically parse JSON
    });
    
    log(`Redis client created for ${config.environment} environment`);
  }
  
  return redis;
};

// Cache configuration
const CACHE_MAX_AGE_SECONDS = 24 * 60 * 60; // 24 hours
const STALE_WHILE_REVALIDATE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  stale: boolean;
  source: 'redis' | 'fresh';
}

export class KVCache {
  private redis = getRedisClient();
  
  async get<T = any>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const startTime = Date.now();
      
      // Get data and TTL in a pipeline for efficiency
      const pipeline = this.redis.pipeline();
      pipeline.get(key);
      pipeline.ttl(key);
      
      const [data, ttl] = await pipeline.exec() as [T | null, number];
      
      const latency = Date.now() - startTime;
      
      if (data === null) {
        log(`Cache miss`, { key, latency: `${latency}ms` });
        return null;
      }
      
      const now = Date.now();
      const timestamp = (data as any)?.timestamp || now;
      const age = now - timestamp;
      const isStale = ttl < 0 || age > CACHE_MAX_AGE_SECONDS * 1000;
      
      log(`Cache ${isStale ? 'stale hit' : 'hit'}`, { 
        key, 
        latency: `${latency}ms`,
        age_hours: age / (1000 * 60 * 60),
        ttl_seconds: ttl
      });
      
      return {
        data: (data as any)?.data || data,
        timestamp,
        ttl,
        stale: isStale,
        source: 'redis'
      };
    } catch (error) {
      log('Cache get error', { key, error: (error as Error).message });
      return null;
    }
  }
  
  async set<T = any>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const cacheValue = {
        data: value,
        timestamp: Date.now()
      };
      
      const ttl = ttlSeconds || CACHE_MAX_AGE_SECONDS;
      
      await this.redis.setex(key, ttl, cacheValue);
      
      log('Cache set', { 
        key, 
        ttl_seconds: ttl,
        size_estimate: JSON.stringify(cacheValue).length 
      });
    } catch (error) {
      log('Cache set error', { key, error: (error as Error).message });
      throw error;
    }
  }
  
  async bust(key: string): Promise<void> {
    try {
      const result = await this.redis.del(key);
      
      log('Cache busted', { key, existed: result > 0 });
    } catch (error) {
      log('Cache bust error', { key, error: (error as Error).message });
    }
  }
  
  async bustPattern(pattern: string): Promise<number> {
    try {
      // Use scan to find keys matching pattern
      const keys: string[] = [];
      let cursor = 0;
      
      do {
        const result = await this.redis.scan(cursor, { match: pattern, count: 100 });
        cursor = result[0];
        keys.push(...result[1]);
      } while (cursor !== 0);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      
      log('Cache pattern busted', { pattern, count: keys.length });
      return keys.length;
    } catch (error) {
      log('Cache pattern bust error', { pattern, error: (error as Error).message });
      return 0;
    }
  }
  
  async getStats(): Promise<{
    memory_usage: string;
    connected_clients: number;
    total_commands_processed: number;
  }> {
    try {
      const info = await this.redis.info();
      
      // Parse Redis INFO response
      const stats = {
        memory_usage: 'Unknown',
        connected_clients: 0,
        total_commands_processed: 0
      };
      
      if (typeof info === 'string') {
        const lines = info.split('\r\n');
        for (const line of lines) {
          if (line.startsWith('used_memory_human:')) {
            stats.memory_usage = line.split(':')[1];
          } else if (line.startsWith('connected_clients:')) {
            stats.connected_clients = parseInt(line.split(':')[1], 10);
          } else if (line.startsWith('total_commands_processed:')) {
            stats.total_commands_processed = parseInt(line.split(':')[1], 10);
          }
        }
      }
      
      return stats;
    } catch (error) {
      log('Cache stats error', { error: (error as Error).message });
      return {
        memory_usage: 'Error',
        connected_clients: 0,
        total_commands_processed: 0
      };
    }
  }
}

// Export singleton instance
export const cache = new KVCache();

// PRD-specific hierarchical transformation for contacts (unchanged)
export const transformContactsHierarchy = (persons: any[], organizations: any[]) => {
  const orgMap = new Map(organizations.map(org => [org.id, org]));
  
  const grouped = persons.reduce((acc, person) => {
    const org = orgMap.get(person.org_id?.value);
    // PRD requirement: Group by Mine Group > Mine Name > Persons
    const mineGroup = org?.['your_mine_group_field_id'] || 'Unknown Group';
    const mineName = person.org_id?.name || 'Unknown Mine';
    
    if (!acc[mineGroup]) acc[mineGroup] = {};
    if (!acc[mineGroup][mineName]) acc[mineGroup][mineName] = [];
    
    acc[mineGroup][mineName].push({
      personId: person.id,
      name: person.name,
      email: person.email?.[0]?.value || null,
      phone: person.phone?.[0]?.value || null,
      orgId: person.org_id?.value,
      orgName: person.org_id?.name,
      mineGroup,
      mineName
    });
    
    return acc;
  }, {});
  
  return grouped;
};

// PRD-specific hierarchical transformation for products (unchanged)
export const transformProductsHierarchy = (products: any[]) => {
  const categoryMap = {
    '1': 'Safety Equipment',
    '2': 'Mining Tools',
    '3': 'Personal Protective Equipment',
    '4': 'Machinery Parts'
  };
  
  return products.reduce((acc, product) => {
    const category = categoryMap[product.category] || 'Other';
    
    if (!acc[category]) acc[category] = [];
    
    acc[category].push({
      pipedriveProductId: product.id,
      name: product.name,
      code: product.code,
      price: product.price || 0,
      shortDescription: product.description || ''
    });
    
    return acc;
  }, {});
};

// Cache key constants
export const CACHE_KEYS = {
  CONTACTS: 'contacts:hierarchical:v1',
  PRODUCTS: 'products:categorized:v1',
} as const;
Manual Validation:

 Redis client connects successfully to Upstash
 Cache get/set operations work with TTL
 Stale data detection works correctly
 Pattern-based cache busting functions
 Pipeline operations improve performance
 Cache statistics provide monitoring data
 Hierarchical transforms preserve existing logic
 Error handling prevents cache failures from breaking app


5. API Updates for Neon + Redis
Cursor Prompt:
Update the API endpoints to use the new Neon database and Redis cache instead of Supabase.

Update `/app/api/contacts/route.ts` to use Redis cache:

import { NextRequest } from 'next/request';
import { cache, transformContactsHierarchy, CACHE_KEYS } from '@/lib/cache';
import { fetchContacts } from '@/lib/pipedrive';
import { errorToResponse, ExternalError } from '@/lib/errors';
import { log } from '@/lib/log';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    // Try cache first unless force refresh
    if (!forceRefresh) {
      const cached = await cache.get(CACHE_KEYS.CONTACTS);
      
      if (cached && !cached.stale) {
        log('Serving fresh contacts from Redis cache');
        return Response.json({ 
          ok: true, 
          data: cached.data, 
          stale: false,
          source: 'redis'
        });
      }
    }
    
    try {
      // Fetch fresh data from Pipedrive
      log('Fetching fresh contacts from Pipedrive');
      const { persons, organizations } = await fetchContacts();
      
      // PRD requirement: Transform to hierarchical Mine Group > Mine Name structure
      const hierarchicalData = transformContactsHierarchy(persons, organizations);
      
      // Update Redis cacheRetryJContinueEdittsx     await cache.set(CACHE_KEYS.CONTACTS, hierarchicalData, 24 * 60 * 60); // 24 hours
     
     return Response.json({ 
       ok: true, 
       data: hierarchicalData, 
       stale: false,
       source: 'pipedrive'
     });
     
   } catch (pipedriveError) {
     log('Pipedrive fetch failed, checking for stale cache', { error: pipedriveError });
     
     // Fallback to stale cache if available
     const staleCache = await cache.get(CACHE_KEYS.CONTACTS);
     if (staleCache) {
       log('Serving stale contacts from Redis cache due to Pipedrive failure');
       return Response.json({ 
         ok: true, 
         data: staleCache.data, 
         stale: true,
         source: 'redis_fallback',
         error: 'Pipedrive temporarily unavailable'
       });
     }
     
     // No cache available, return error
     throw new ExternalError('Unable to fetch contacts and no cached data available');
   }
   
 } catch (e) {
   return errorToResponse(e);
 }
}

Update `/app/api/products/route.ts` to use Redis cache:

import { NextRequest } from 'next/request';
import { cache, transformProductsHierarchy, CACHE_KEYS } from '@/lib/cache';
import { fetchProducts } from '@/lib/pipedrive';
import { errorToResponse, ExternalError } from '@/lib/errors';
import { log } from '@/lib/log';

export async function GET(request: NextRequest) {
 try {
   const { searchParams } = new URL(request.url);
   const forceRefresh = searchParams.get('refresh') === 'true';
   
   // Try cache first unless force refresh
   if (!forceRefresh) {
     const cached = await cache.get(CACHE_KEYS.PRODUCTS);
     
     if (cached && !cached.stale) {
       log('Serving fresh products from Redis cache');
       return Response.json({ 
         ok: true, 
         data: cached.data, 
         stale: false,
         source: 'redis'
       });
     }
   }
   
   try {
     // Fetch fresh data from Pipedrive
     log('Fetching fresh products from Pipedrive');
     const products = await fetchProducts();
     
     // PRD requirement: Transform to categorized structure
     const categorizedData = transformProductsHierarchy(products);
     
     // Update Redis cache
     await cache.set(CACHE_KEYS.PRODUCTS, categorizedData, 24 * 60 * 60); // 24 hours
     
     return Response.json({ 
       ok: true, 
       data: categorizedData, 
       stale: false,
       source: 'pipedrive'
     });
     
   } catch (pipedriveError) {
     log('Pipedrive fetch failed, checking for stale cache', { error: pipedriveError });
     
     // Fallback to stale cache if available
     const staleCache = await cache.get(CACHE_KEYS.PRODUCTS);
     if (staleCache) {
       log('Serving stale products from Redis cache due to Pipedrive failure');
       return Response.json({ 
         ok: true, 
         data: staleCache.data, 
         stale: true,
         source: 'redis_fallback',
         error: 'Pipedrive temporarily unavailable'
       });
     }
     
     // No cache available, return error
     throw new ExternalError('Unable to fetch products and no cached data available');
   }
   
 } catch (e) {
   return errorToResponse(e);
 }
}

Update `/app/api/requests/route.ts` to use Neon Postgres:

import { NextRequest } from 'next/request';
import { query, generateRequestId, withDbErrorHandling } from '@/lib/db';
import { RequestUpsert } from '@/lib/schema';
import { errorToResponse, ValidationError, NotFoundError } from '@/lib/errors';
import { log } from '@/lib/log';
import { z } from 'zod';

export async function GET(request: NextRequest) {
 try {
   const { searchParams } = new URL(request.url);
   const status = searchParams.get('status');
   const mineGroup = searchParams.get('mineGroup');
   const mineName = searchParams.get('mineName');
   const personId = searchParams.get('personId');
   const salesperson = searchParams.get('salesperson');
   const showAll = searchParams.get('showAll') === 'true';
   const limit = parseInt(searchParams.get('limit') || '50');
   
   let sql = `
     SELECT * FROM requests 
     WHERE 1=1
   `;
   const params: any[] = [];
   let paramIndex = 1;

   // PRD requirement: Filter by salesperson unless showAll is true
   if (!showAll && salesperson && salesperson !== 'all') {
     sql += ` AND salesperson_first_name = $${paramIndex}`;
     params.push(salesperson);
     paramIndex++;
   }
   
   if (status) {
     sql += ` AND status = $${paramIndex}`;
     params.push(status);
     paramIndex++;
   }
   
   if (mineGroup) {
     sql += ` AND contact_mine_group = $${paramIndex}`;
     params.push(mineGroup);
     paramIndex++;
   }
   
   if (mineName) {
     sql += ` AND contact_mine_name = $${paramIndex}`;
     params.push(mineName);
     paramIndex++;
   }
   
   if (personId) {
     sql += ` AND contact_person_id_int = $${paramIndex}`;
     params.push(parseInt(personId));
     paramIndex++;
   }
   
   sql += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
   params.push(limit);

   const result = await query(sql, params);
   
   // PRD requirement: Control "New Request" button visibility
   const showNewButton = !showAll;
   
   return Response.json({ 
     ok: true, 
     data: result.rows,
     showNewButton,
     filters: { salesperson, showAll }
   });
   
 } catch (e) {
   return errorToResponse(e);
 }
}

export async function POST(request: NextRequest) {
 try {
   const body = await request.json();
   const parsed = RequestUpsert.parse(body);
   
   if (parsed.id) {
     // Update existing request
     const updates: string[] = [];
     const params: any[] = [];
     let paramIndex = 1;

     if (parsed.contact !== undefined) {
       updates.push(`contact = $${paramIndex}`);
       params.push(JSON.stringify(parsed.contact));
       paramIndex++;
     }
     
     if (parsed.line_items !== undefined) {
       updates.push(`line_items = $${paramIndex}`);
       params.push(JSON.stringify(parsed.line_items));
       paramIndex++;
     }
     
     if (parsed.comment !== undefined) {
       updates.push(`comment = $${paramIndex}`);
       params.push(parsed.comment);
       paramIndex++;
     }

     if (updates.length === 0) {
       throw new ValidationError('No fields to update');
     }

     updates.push(`updated_at = now()`);
     
     const sql = `
       UPDATE requests 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *
     `;
     params.push(parsed.id);

     const result = await query(sql, params);
     
     if (result.rows.length === 0) {
       throw new NotFoundError('Request not found');
     }

     log('Request updated successfully', { id: parsed.id });
     return Response.json({ ok: true, data: result.rows[0] });
     
   } else {
     // Create new request
     const sql = `
       INSERT INTO requests (
         salesperson_first_name, 
         mine_group, 
         mine_name, 
         contact, 
         line_items, 
         comment,
         status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *
     `;
     
     const params = [
       parsed.salespersonFirstName,
       parsed.mineGroup,
       parsed.mineName,
       JSON.stringify(parsed.contact),
       JSON.stringify(parsed.line_items || []),
       parsed.comment,
       'draft'
     ];

     const result = await query(sql, params);
     
     log('Request created successfully', { request_id: result.rows[0].request_id });
     return Response.json({ ok: true, data: result.rows[0] });
   }
   
 } catch (e) {
   if (e instanceof z.ZodError) {
     return errorToResponse(new ValidationError('Invalid request data', e.errors));
   }
   return errorToResponse(e);
 }
}

export async function DELETE(request: NextRequest) {
 try {
   const { searchParams } = new URL(request.url);
   const id = searchParams.get('id');
   
   if (!id) {
     throw new ValidationError('Missing request ID');
   }
   
   const result = await query('DELETE FROM requests WHERE id = $1', [id]);
   
   if (result.rowCount === 0) {
     throw new NotFoundError('Request not found');
   }
   
   log('Request deleted successfully', { id });
   return Response.json({ ok: true });
   
 } catch (e) {
   return errorToResponse(e);
 }
}

Update `/app/api/cache/route.ts` to use Redis cache management:

import { NextRequest } from 'next/request';
import { cache, CACHE_KEYS } from '@/lib/cache';
import { errorToResponse, ValidationError } from '@/lib/errors';
import { log } from '@/lib/log';
import { z } from 'zod';

const BustRequest = z.object({
 keys: z.array(z.string())
});

export async function GET() {
 try {
   // Get cache statistics
   const stats = await cache.getStats();
   
   // Get information about our specific cache keys
   const cacheInfo = await Promise.all([
     cache.get(CACHE_KEYS.CONTACTS),
     cache.get(CACHE_KEYS.PRODUCTS)
   ]);
   
   const [contactsCache, productsCache] = cacheInfo;
   
   const keyInfo = [
     {
       key: CACHE_KEYS.CONTACTS,
       exists: !!contactsCache,
       stale: contactsCache?.stale || false,
       age_hours: contactsCache ? (Date.now() - contactsCache.timestamp) / (1000 * 60 * 60) : null,
       ttl_seconds: contactsCache?.ttl || null
     },
     {
       key: CACHE_KEYS.PRODUCTS,
       exists: !!productsCache,
       stale: productsCache?.stale || false,
       age_hours: productsCache ? (Date.now() - productsCache.timestamp) / (1000 * 60 * 60) : null,
       ttl_seconds: productsCache?.ttl || null
     }
   ];
   
   return Response.json({ 
     ok: true, 
     stats,
     keys: keyInfo
   });
   
 } catch (e) {
   return errorToResponse(e);
 }
}

export async function POST(request: NextRequest) {
 try {
   const body = await request.json();
   const { keys } = BustRequest.parse(body);
   
   const bustedKeys: string[] = [];
   
   for (const key of keys) {
     if (key.includes('*')) {
       // Pattern-based bust
       const count = await cache.bustPattern(key);
       bustedKeys.push(`${key} (${count} keys)`);
     } else {
       // Single key bust
       await cache.bust(key);
       bustedKeys.push(key);
     }
   }
   
   log('Cache keys busted', { keys: bustedKeys });
   return Response.json({ ok: true, busted: bustedKeys });
   
 } catch (e) {
   if (e instanceof z.ZodError) {
     return errorToResponse(new ValidationError('Invalid cache bust request'));
   }
   return errorToResponse(e);
 }
}

Update `/app/api/health/detailed/route.ts` to include Neon and Redis health:

import { NextRequest } from 'next/request';
import { checkDbHealth } from '@/lib/db';
import { cache } from '@/lib/cache';
import { errorToResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
 const checks = {
   timestamp: new Date().toISOString(),
   environment: process.env.APP_ENV || 'unknown',
   version: process.env.npm_package_version || 'unknown',
   database: { healthy: false, details: {} },
   cache: { healthy: false, details: {} },
   pipedrive_mode: process.env.PIPEDRIVE_SUBMIT_MODE || 'real'
 };
 
 try {
   // Database health check (Neon)
   try {
     const dbHealth = await checkDbHealth();
     checks.database = {
       healthy: dbHealth.healthy,
       details: {
         environment: dbHealth.environment,
         latency_ms: dbHealth.latency,
         version: dbHealth.version
       }
     };
   } catch (error) {
     checks.database = {
       healthy: false,
       details: { error: (error as Error).message }
     };
   }
   
   // Cache health check (Upstash Redis)
   try {
     const cacheStats = await cache.getStats();
     checks.cache = {
       healthy: true,
       details: {
         memory_usage: cacheStats.memory_usage,
         connected_clients: cacheStats.connected_clients,
         total_commands: cacheStats.total_commands_processed
       }
     };
   } catch (error) {
     checks.cache = {
       healthy: false,
       details: { error: (error as Error).message }
     };
   }
   
   // Request statistics
   try {
     const statsResult = await query(`
       SELECT 
         COUNT(*) as total_requests,
         COUNT(*) FILTER (WHERE status = 'submitted') as submitted_requests,
         COUNT(*) FILTER (WHERE status = 'draft') as draft_requests,
         COUNT(*) FILTER (WHERE status = 'failed') as failed_requests
       FROM requests
     `);
     
     const stats = statsResult.rows[0];
     const total = parseInt(stats.total_requests);
     const submitted = parseInt(stats.submitted_requests);
     
     checks.stats = {
       total_requests: total,
       submitted_requests: submitted,
       draft_requests: parseInt(stats.draft_requests),
       failed_requests: parseInt(stats.failed_requests),
       submission_rate: total > 0 ? Math.round((submitted / total) * 100) : 0
     };
   } catch (error) {
     checks.stats = { error: (error as Error).message };
   }
   
   // Overall health
   const allHealthy = checks.database.healthy && checks.cache.healthy;
   
   return Response.json({
     ok: allHealthy,
     status: allHealthy ? 'healthy' : 'degraded',
     checks
   }, {
     status: allHealthy ? 200 : 503
   });
   
 } catch (error) {
   return errorToResponse(error);
 }
}
Manual Validation:

 Contacts API uses Redis cache with proper fallback
 Products API leverages Redis caching correctly
 Requests API executes raw SQL queries with Neon
 Cache management API provides Redis statistics
 Health check monitors both Neon and Redis
 Generated columns improve query performance
 JSONB operations work correctly with Postgres
 Error handling preserves existing behavior


6. Updated Testing for Neon + Redis
Cursor Prompt:
Update test configurations and utilities to work with Neon Postgres and Upstash Redis.

Update `/tests/setup.ts` for new database structure:

import { beforeAll, afterAll } from 'vitest';
import { query, closeDbPool } from '../lib/db';
import { cache } from '../lib/cache';

beforeAll(async () => {
  // Ensure test database is clean
  await query('DELETE FROM requests WHERE created_at < NOW() - INTERVAL \'2 hours\'');
  await query('DELETE FROM mock_pipedrive_submissions WHERE created_at < NOW() - INTERVAL \'2 hours\'');
  
  // Clear test cache keys
  await cache.bustPattern('test:*');
  
  console.log('Test environment prepared');
});

afterAll(async () => {
  // Clean up test data
  await query('DELETE FROM requests WHERE created_at > NOW() - INTERVAL \'1 hour\'');
  await query('DELETE FROM mock_pipedrive_submissions WHERE created_at > NOW() - INTERVAL \'1 hour\'');
  
  // Clear test cache
  await cache.bustPattern('test:*');
  
  // Close database connections
  await closeDbPool();
  
  console.log('Test environment cleaned up');
});

Update `/tests/_utils/db-cleanup.ts` for Neon:

import { query } from '../../lib/db';
import { cache } from '../../lib/cache';
import { log } from '../../lib/log';

export const cleanupTestData = async (maxAgeMinutes: number = 120) => {
  try {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    
    // Clean test requests
    const requestsResult = await query(
      'DELETE FROM requests WHERE created_at < $1',
      [cutoff.toISOString()]
    );
    
    // Clean mock submissions
    const mockResult = await query(
      'DELETE FROM mock_pipedrive_submissions WHERE created_at < $1',
      [cutoff.toISOString()]
    );
    
    // Clean test cache entries
    await cache.bustPattern('test:*');
    
    log('Test data cleanup completed', {
      requests_deleted: requestsResult.rowCount,
      mock_submissions_deleted: mockResult.rowCount
    });
    
  } catch (error) {
    log('Test cleanup failed', { error: (error as Error).message });
  }
};

export const seedTestRequest = async (requestData = {}) => {
  const testRequest = {
    salesperson_first_name: 'Test User',
    mine_group: 'Test Group',
    mine_name: 'Test Mine',
    contact: {
      personId: 12345,
      name: 'Test Contact',
      mineGroup: 'Test Group',
      mineName: 'Test Mine'
    },
    line_items: [{
      pipedriveProductId: 99901,
      name: 'Test Product',
      quantity: 1,
      price: 100
    }],
    comment: 'Test comment',
    status: 'draft',
    ...requestData
  };
  
  const result = await query(`
    INSERT INTO requests (
      salesperson_first_name, mine_group, mine_name, 
      contact, line_items, comment, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    testRequest.salesperson_first_name,
    testRequest.mine_group,
    testRequest.mine_name,
    JSON.stringify(testRequest.contact),
    JSON.stringify(testRequest.line_items),
    testRequest.comment,
    testRequest.status
  ]);
  
  if (result.rows.length === 0) {
    throw new Error('Failed to seed test request');
  }
  
  return result.rows[0];
};

Update `/tests/integration/db-integration.test.ts` for Neon:

import { describe, it, expect, beforeAll } from 'vitest';
import { query, checkDbHealth, generateRequestId } from '../../lib/db';
import { cache } from '../../lib/cache';
import { validateEnvironment } from '../../lib/env';

describe('Database Integration (Neon)', () => {
  beforeAll(() => {
    // Ensure environment is properly configured
    validateEnvironment();
  });
  
  it('should connect to Neon database', async () => {
    const health = await checkDbHealth();
    expect(health.healthy).toBe(true);
    expect(health.latency).toBeGreaterThan(0);
    expect(health.version).toBeDefined();
  });
  
  it('should generate unique request IDs using database function', async () => {
    const ids = await Promise.all([
      generateRequestId(),
      generateRequestId(),
      generateRequestId()
    ]);
    
    // All should be unique
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
    
    // All should follow format
    ids.forEach(id => {
      expect(id).toMatch(/^QR-\d{3}$/);
    });
  });
  
  it('should test JSONB operations with generated columns', async () => {
    // Insert request with contact JSONB
    const contact = {
      personId: 12345,
      name: 'Test Contact',
      mineGroup: 'Test Group',
      mineName: 'Test Mine'
    };
    
    const result = await query(`
      INSERT INTO requests (salesperson_first_name, contact, line_items, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id, contact_person_id_int, contact_mine_group, contact_mine_name
    `, ['Test User', JSON.stringify(contact), JSON.stringify([]), 'draft']);
    
    const row = result.rows[0];
    
    // Generated columns should extract values correctly
    expect(row.contact_person_id_int).toBe(12345);
    expect(row.contact_mine_group).toBe('Test Group');
    expect(row.contact_mine_name).toBe('Test Mine');
    
    // Clean up
    await query('DELETE FROM requests WHERE id = $1', [row.id]);
  });
  
  it('should test salesperson constraint', async () => {
    // Valid salesperson should work
    const validResult = await query(`
      INSERT INTO requests (salesperson_selection, status, line_items)
      VALUES ($1, $2, $3)
      RETURNING id
    `, ['Luyanda', 'draft', JSON.stringify([])]);
    
    expect(validResult.rows.length).toBe(1);
    
    // Clean up
    await query('DELETE FROM requests WHERE id = $1', [validResult.rows[0].id]);
    
    // Invalid salesperson should fail
    await expect(
      query(`
        INSERT INTO requests (salesperson_selection, status, line_items)
        VALUES ($1, $2, $3)
      `, ['InvalidName', 'draft', JSON.stringify([])])
    ).rejects.toThrow();
  });
});

describe('Cache Integration (Upstash)', () => {
  it('should connect to Upstash Redis', async () => {
    const stats = await cache.getStats();
    expect(stats).toBeDefined();
    expect(typeof stats.connected_clients).toBe('number');
  });
  
  it('should set and get cache values', async () => {
    const testKey = `test:cache-${Date.now()}`;
    const testValue = { data: 'test', timestamp: Date.now() };
    
    await cache.set(testKey, testValue, 60); // 1 minute TTL
    const result = await cache.get(testKey);
    
    expect(result).toBeTruthy();
    expect(result?.data).toEqual(testValue);
    expect(result?.stale).toBe(false);
    
    // Clean up
    await cache.bust(testKey);
  });
  
  it('should handle cache misses gracefully', async () => {
    const result = await cache.get('non-existent-key');
    expect(result).toBeNull();
  });
  
  it('should bust cache entries correctly', async () => {
    const testKey = `test:bust-${Date.now()}`;
    
    await cache.set(testKey, { test: 'data' }, 60);
    let result = await cache.get(testKey);
    expect(result).toBeTruthy();
    
    await cache.bust(testKey);
    result = await cache.get(testKey);
    expect(result).toBeNull();
  });
  
  it('should bust cache patterns', async () => {
    const baseKey = `test:pattern-${Date.now()}`;
    
    // Set multiple keys with pattern
    await Promise.all([
      cache.set(`${baseKey}:1`, { id: 1 }, 60),
      cache.set(`${baseKey}:2`, { id: 2 }, 60),
      cache.set(`${baseKey}:3`, { id: 3 }, 60)
    ]);
    
    // Bust pattern
    const bustedCount = await cache.bustPattern(`${baseKey}:*`);
    expect(bustedCount).toBe(3);
    
    // Verify all keys are gone
    const results = await Promise.all([
      cache.get(`${baseKey}:1`),
      cache.get(`${baseKey}:2`),
      cache.get(`${baseKey}:3`)
    ]);
    
    results.forEach(result => {
      expect(result).toBeNull();
    });
  });
});

Update `vitest.config.ts` for new environment:

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000, // Increased for network operations
    env: {
      // Ensure test environment
      APP_ENV: 'test',
      PIPEDRIVE_SUBMIT_MODE: 'mock'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
Manual Validation:

 Test setup connects to Neon test database successfully
 Cache tests work with Upstash Redis
 Database integration tests pass with new SQL queries
 Generated columns tested and working correctly
 Test cleanup removes data from both database and cache
 JSONB operations tested with native Postgres
 Constraint testing works with raw SQL
 Environment isolation maintained between test and prod


7. Deployment Configuration for Vercel
Cursor Prompt:
Update deployment configuration for Vercel with Neon and Upstash integration.

Update `package.json` for new deployment process:

{
  "scripts": {
    "dev": "npm run env:check && npm run db:migrate && next dev",
    "build": "npm run env:check && npm run db:migrate && next build",
    "start": "npm run env:check && next start",
    "db:migrate": "node scripts/migrate.js",
    "db:status": "node scripts/migration-status.js",
    "env:check": "node scripts/env-check.js",
    "test:unit": "vitest run",
    "test:integration": "npm run db:migrate && vitest run tests/integration",
    "test:e2e": "npm run db:migrate && playwright test",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "deploy:preview": "vercel --env APP_ENV=test --env PIPEDRIVE_SUBMIT_MODE=mock",
    "deploy:prod": "vercel --prod --env APP_ENV=prod --env PIPEDRIVE_SUBMIT_MODE=real"
  },
  "dependencies": {
    "pg": "^8.11.3",
    "@upstash/redis": "^1.25.1",
    "zod": "^3.22.4",
    "next": "14.0.0",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/pg": "^8.10.7",
    "vitest": "^1.0.0",
    "@playwright/test": "^1.40.0",
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18"
  }
}

Create `vercel.json` for deployment configuration:

{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "APP_ENV": "@app_env",
    "DATABASE_URL": "@database_url", 
    "REDIS_URL": "@redis_url",
    "PIPEDRIVE_API_TOKEN": "@pipedrive_api_token",
    "PIPEDRIVE_BASE_URL": "@pipedrive_base_url",
    "PIPEDRIVE_SUBMIT_MODE": "@pipedrive_submit_mode",
    "SLACK_ALERT_WEBHOOK": "@slack_alert_webhook"
  },
  "build": {
    "env": {
      "APP_ENV": "@app_env",
      "DATABASE_URL": "@database_url",
      "REDIS_URL": "@redis_url"
    }
  }
}

Create `.github/workflows/test.yml` for CI/CD:

name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup test environment
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: ${{ secrets.REDIS_URL_TEST }}
        APP_ENV: test
        PIPEDRIVE_SUBMIT_MODE: mock
        PIPEDRIVE_API_TOKEN: test_token
        PIPEDRIVE_BASE_URL: https://api.pipedrive.com/v1
      run: |
        npm run env:check
        npm run db:migrate
    
    - name: Run unit tests
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: ${{ secrets.REDIS_URL_TEST }}
        APP_ENV: test
        PIPEDRIVE_SUBMIT_MODE: mock
        PIPEDRIVE_API_TOKEN: test_token
        PIPEDRIVE_BASE_URL: https://api.pipedrive.com/v1
      run: npm run test:unit
    
    - name: Run integration tests
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: ${{ secrets.REDIS_URL_TEST }}
        APP_ENV: test
        PIPEDRIVE_SUBMIT_RetryJContinueEdityaml       PIPEDRIVE_SUBMIT_MODE: mock
       PIPEDRIVE_API_TOKEN: test_token
       PIPEDRIVE_BASE_URL: https://api.pipedrive.com/v1
     run: npm run test:integration
   
   - name: Install Playwright
     run: npx playwright install --with-deps
   
   - name: Run E2E tests
     env:
       DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
       REDIS_URL: ${{ secrets.REDIS_URL_TEST }}
       APP_ENV: test
       PIPEDRIVE_SUBMIT_MODE: mock
       PIPEDRIVE_API_TOKEN: test_token
       PIPEDRIVE_BASE_URL: https://api.pipedrive.com/v1
     run: npm run test:e2e

 build:
   runs-on: ubuntu-latest
   needs: test
   
   steps:
   - uses: actions/checkout@v4
   
   - name: Setup Node.js
     uses: actions/setup-node@v4
     with:
       node-version: '18'
       cache: 'npm'
   
   - name: Install dependencies
     run: npm ci
   
   - name: Build application
     env:
       DATABASE_URL: ${{ secrets.DATABASE_URL_TEST }}
       REDIS_URL: ${{ secrets.REDIS_URL_TEST }}
       APP_ENV: test
       PIPEDRIVE_API_TOKEN: test_token
       PIPEDRIVE_BASE_URL: https://api.pipedrive.com/v1
       PIPEDRIVE_SUBMIT_MODE: mock
     run: npm run build

Create `/scripts/migration-status.js` for deployment checks:

#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function checkMigrationStatus() {
 const pool = new Pool({
   connectionString: process.env.DATABASE_URL,
   ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
 });

 try {
   console.log('🔍 Checking migration status...\n');

   // Get executed migrations
   const { rows: executed } = await pool.query(
     'SELECT version, name, executed_at FROM schema_migrations ORDER BY version'
   );

   // Read available migration files
   const migrationsDir = path.join(__dirname, '..', 'migrations');
   const files = fs.readdirSync(migrationsDir)
     .filter(file => file.endsWith('.sql'))
     .sort();

   const available = files.map(file => {
     const version = parseInt(file.split('_')[0]);
     const name = file.replace(/^\d+_/, '').replace(/\.sql$/, '');
     return { version, name, file };
   });

   console.log('📊 Migration Status:');
   console.log('==================');

   for (const migration of available) {
     const executedMigration = executed.find(e => e.version === migration.version);
     
     if (executedMigration) {
       console.log(`✅ ${migration.version}: ${migration.name} (executed: ${executedMigration.executed_at})`);
     } else {
       console.log(`⏳ ${migration.version}: ${migration.name} (pending)`);
     }
   }

   const pendingCount = available.length - executed.length;
   
   if (pendingCount > 0) {
     console.log(`\n⚠️  ${pendingCount} migrations pending`);
     console.log('Run: npm run db:migrate');
     process.exit(1);
   } else {
     console.log('\n✨ Database is up to date');
     process.exit(0);
   }

 } catch (error) {
   console.error('❌ Migration status check failed:', error.message);
   process.exit(1);
 } finally {
   await pool.end();
 }
}

checkMigrationStatus();

Create `/scripts/reset-db.js` for development:

#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

async function resetDatabase() {
 if (process.env.APP_ENV === 'prod') {
   console.error('❌ Cannot reset production database');
   process.exit(1);
 }

 const pool = new Pool({
   connectionString: process.env.DATABASE_URL,
   ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
 });

 try {
   console.log('🔄 Resetting test database...\n');

   // Drop all tables (in dependency order)
   await pool.query('DROP TABLE IF EXISTS mock_pipedrive_submissions CASCADE');
   await pool.query('DROP TABLE IF EXISTS kv_cache CASCADE');
   await pool.query('DROP TABLE IF EXISTS requests CASCADE');
   await pool.query('DROP TABLE IF EXISTS schema_migrations CASCADE');
   
   // Drop functions and types
   await pool.query('DROP FUNCTION IF EXISTS generate_request_id() CASCADE');
   await pool.query('DROP FUNCTION IF EXISTS validate_contact_jsonb(JSONB) CASCADE');
   await pool.query('DROP FUNCTION IF EXISTS set_updated_at() CASCADE');
   await pool.query('DROP TYPE IF EXISTS request_status CASCADE');

   console.log('✅ Database reset complete');
   console.log('Run: npm run db:migrate to recreate schema');

 } catch (error) {
   console.error('❌ Database reset failed:', error.message);
   process.exit(1);
 } finally {
   await pool.end();
 }
}

resetDatabase();

Create `/docs/DEPLOYMENT_NEON.md` for deployment guide:

# Sales Helper App - Neon + Upstash Deployment Guide

## Environment Setup

### 1. Neon Database Setup

1. Create Neon account and project
2. Create database branches:
  - `main` branch for production
  - `dev` branch for development/testing

3. Get connection strings:
Production
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
Development (use dev branch)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require&options=endpoint%3Dep-xxx-dev

### 2. Upstash Redis Setup

1. Create Upstash account and Redis database
2. Get connection URL:
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379

### 3. Vercel Configuration

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard:

**Production Environment:**
APP_ENV=prod
DATABASE_URL=postgresql://user:pass@neon-prod-host/db?sslmode=require
REDIS_URL=rediss://:<token>@<host>:<port>
PIPEDRIVE_API_TOKEN=your_real_token
PIPEDRIVE_BASE_URL=https://api.pipedrive.com/v1
PIPEDRIVE_SUBMIT_MODE=real
SLACK_ALERT_WEBHOOK=https://hooks.slack.com/services/your/webhook

**Preview Environment:**
APP_ENV=test
DATABASE_URL=postgresql://user:pass@neon-dev-host/db?sslmode=require
REDIS_URL=rediss://:<token>@<host>:<port>
PIPEDRIVE_API_TOKEN=your_test_token
PIPEDRIVE_BASE_URL=https://api.pipedrive.com/v1
PIPEDRIVE_SUBMIT_MODE=mock

## Deployment Process

### Automatic Deployment

1. **Preview Deployments**: Triggered on every push to feature branches
2. **Production Deployment**: Triggered on push to `main` branch

### Manual Deployment

```bash
# Deploy preview
npm run deploy:preview

# Deploy production
npm run deploy:prod
Pre-deployment Checklist

Environment Validation:
bashnpm run env:check

Database Migration:
bashnpm run db:migrate
npm run db:status

Test Suite:
bashnpm run test:all

Build Verification:
bashnpm run build


Checkbox: - [ ] 1.3 Convert to Neon and Upstash Redis complete

Section 2: Core Schema & Validation
2.1 Schema Contracts & Validation
Goal: Establish type-safe data contracts with Zod validation and standardized error handling
Cursor Prompt:
Create comprehensive schema validation system for the Sales Helper App with mobile-first PRD requirements.

First, create `/lib/log.ts` for structured logging:

export const log = (msg: string, meta?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  const environment = process.env.APP_ENV || 'unknown';
  console.log(`[SH:${environment}] ${timestamp} ${msg}`, meta ?? {});
};

Create `/lib/errors.ts` for standardized error handling:

export class AppError extends Error { 
  status = 500; 
  code = "ERR_APP"; 
  data?: unknown; 
  
  constructor(message: string, data?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.data = data;
  }
}

export class ValidationError extends AppError { 
  status = 422; 
  code = "ERR_VALIDATION";
  
  constructor(message: string, data?: unknown) {
    super(message, data);
  }
}

export class NotFoundError extends AppError { 
  status = 404; 
  code = "ERR_NOT_FOUND";
  
  constructor(message: string = "Resource not found", data?: unknown) {
    super(message, data);
  }
}

export class ExternalError extends AppError { 
  status = 502; 
  code = "ERR_EXTERNAL";
  
  constructor(message: string, data?: unknown) {
    super(message, data);
  }
}

export function errorToResponse(err: unknown) {
  const e = err as AppError;
  const body = { 
    ok: false, 
    code: (e as any).code || "ERR_UNKNOWN", 
    message: e.message || "An unknown error occurred",
    data: (e as any).data 
  };
  return new Response(JSON.stringify(body), { 
    status: (e as any).status || 500, 
    headers: { "content-type": "application/json" }
  });
}

Create `/lib/schema.ts` with comprehensive Zod schemas including PRD-specific validations:

import { z } from "zod";

// Salesperson enum matching database constraint and PRD requirements
export const SalespersonSelection = z.enum(['Luyanda', 'James', 'Stefan'], {
  errorMap: () => ({ message: "Salesperson must be one of: Luyanda, James, Stefan" })
});

// Line item schema with validation
export const LineItem = z.object({
  pipedriveProductId: z.number().int().positive("Product ID must be a positive integer"),
  name: z.string().min(1, "Product name is required"),
  code: z.string().optional(),
  category: z.string().optional(),
  price: z.number().nonnegative("Price cannot be negative").default(0),
  quantity: z.number().int().positive("Quantity must be a positive integer").default(1),
  shortDescription: z.string().optional(),
  customDescription: z.string().optional(),
}).refine(
  (data) => data.name.trim().length > 0,
  { message: "Product name cannot be empty or whitespace only", path: ["name"] }
);

// Contact information schema with mobile-first PRD requirements
export const ContactJSON = z.object({
  personId: z.number().int().positive("Person ID must be a positive integer"),
  name: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().optional(),
  orgId: z.number().int().positive("Organization ID must be a positive integer").optional(),
  orgName: z.string().optional(),
  mineGroup: z.string().min(1, "Mine group is required for mobile-first workflow"),
  mineName: z.string().min(1, "Mine name is required for mobile-first workflow"),
}).refine(
  (data) => data.name.trim().length > 0,
  { message: "Contact name cannot be empty or whitespace only", path: ["name"] }
).refine(
  (data) => data.mineGroup && data.mineGroup.trim().length > 0,
  { message: "Mine group is required and cannot be empty", path: ["mineGroup"] }
).refine(
  (data) => data.mineName && data.mineName.trim().length > 0,
  { message: "Mine name is required and cannot be empty", path: ["mineName"] }
);

// Request upsert schema for API operations with mobile-first validations
export const RequestUpsert = z.object({
  id: z.string().uuid("Invalid UUID format").optional(),
  salespersonFirstName: z.string().min(1, "Salesperson first name is required").optional(),
  salespersonSelection: SalespersonSelection.optional(),
  mineGroup: z.string().optional(),
  mineName: z.string().optional(),
  contact: ContactJSON.nullable().optional(),
  line_items: z.array(LineItem).default([]),
  comment: z.string().max(2000, "Comment cannot exceed 2000 characters").optional(),
}).refine(
  (data) => {
    if (data.salespersonFirstName && data.salespersonFirstName.trim().length === 0) {
      return false;
    }
    return true;
  },
  { message: "Salesperson name cannot be empty or whitespace only", path: ["salespersonFirstName"] }
).refine(
  (data) => {
    // For mobile-first workflow, require either salespersonSelection or salespersonFirstName
    return data.salespersonSelection || data.salespersonFirstName;
  },
  { message: "Either salesperson selection or salesperson first name is required", path: ["salespersonSelection"] }
);

// Database record schema for type safety
export const RequestRecord = z.object({
  id: z.string().uuid(),
  request_id: z.string().regex(/^QR-\d{3}$/, "Invalid request ID format"),
  status: z.enum(['draft', 'submitted', 'failed']),
  salesperson_first_name: z.string().nullable(),
  salesperson_selection: SalespersonSelection.nullable(),
  mine_group: z.string().nullable(),
  mine_name: z.string().nullable(),
  contact: ContactJSON.nullable(),
  line_items: z.array(LineItem),
  comment: z.string().nullable(),
  pipedrive_deal_id: z.number().int().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Export types
export type TSalespersonSelection = z.infer<typeof SalespersonSelection>;
export type TLineItem = z.infer<typeof LineItem>;
export type TContactJSON = z.infer<typeof ContactJSON>;
export type TRequestUpsert = z.infer<typeof RequestUpsert>;
export type TRequestRecord = z.infer<typeof RequestRecord>;

// Schema validation helpers
export const validateLineItem = (data: unknown) => {
  try {
    return { success: true as const, data: LineItem.parse(data) };
  } catch (error) {
    return { success: false as const, error: error as z.ZodError };
  }
};

export const validateContact = (data: unknown) => {
  try {
    return { success: true as const, data: ContactJSON.parse(data) };
  } catch (error) {
    return { success: false as const, error: error as z.ZodError };
  }
};

export const validateRequestUpsert = (data: unknown) => {
  try {
    return { success: true as const, data: RequestUpsert.parse(data) };
  } catch (error) {
    return { success: false as const, error: error as z.ZodError };
  }
};

export const validateSalespersonSelection = (data: unknown) => {
  try {
    return { success: true as const, data: SalespersonSelection.parse(data) };
  } catch (error) {
    return { success: false as const, error: error as z.ZodError };
  }
};

Create unit tests in `/tests/unit/schema.test.ts`:

import { describe, it, expect } from 'vitest';
import { 
  LineItem, 
  ContactJSON, 
  RequestUpsert,
  SalespersonSelection,
  validateLineItem,
  validateContact,
  validateRequestUpsert,
  validateSalespersonSelection 
} from '../../lib/schema';

describe('Schema validation', () => {
  describe('SalespersonSelection', () => {
    it('should validate valid salesperson names', () => {
      expect(() => SalespersonSelection.parse('Luyanda')).not.toThrow();
      expect(() => SalespersonSelection.parse('James')).not.toThrow();
      expect(() => SalespersonSelection.parse('Stefan')).not.toThrow();
    });
    
    it('should reject invalid salesperson names', () => {
      expect(() => SalespersonSelection.parse('InvalidName')).toThrow();
      expect(() => SalespersonSelection.parse('')).toThrow();
    });
  });

  describe('LineItem', () => {
    it('should validate valid line item', () => {
      const validItem = {
        pipedriveProductId: 123,
        name: "Test Product",
        price: 100,
        quantity: 2
      };
      
      expect(() => LineItem.parse(validItem)).not.toThrow();
    });
    
    it('should reject invalid line item', () => {
      const invalidItem = {
        pipedriveProductId: -1,
        name: "",
        price: -100,
        quantity: 0
      };
      
      expect(() => LineItem.parse(invalidItem)).toThrow();
    });
  });

  describe('ContactJSON', () => {
    it('should validate valid contact with required mobile-first fields', () => {
      const validContact = {
        personId: 456,
        name: "John Doe",
        email: "john@example.com",
        mineGroup: "Northern Mines",
        mineName: "Diamond Mine A"
      };
      
      expect(() => ContactJSON.parse(validContact)).not.toThrow();
    });
    
    it('should reject contact missing mobile-first required fields', () => {
      const invalidContact = {
        personId: 456,
        name: "John Doe",
        email: "john@example.com"
        // Missing mineGroup and mineName
      };
      
      expect(() => ContactJSON.parse(invalidContact)).toThrow();
    });
  });

  describe('RequestUpsert', () => {
    it('should validate with salesperson selection', () => {
      const validRequest = {
        salespersonSelection: 'Luyanda',
        line_items: []
      };
      
      expect(() => RequestUpsert.parse(validRequest)).not.toThrow();
    });
    
    it('should validate with salesperson first name', () => {
      const validRequest = {
        salespersonFirstName: 'John',
        line_items: []
      };
      
      expect(() => RequestUpsert.parse(validRequest)).not.toThrow();
    });
    
    it('should reject without any salesperson info', () => {
      const invalidRequest = {
        line_items: []
      };
      
      expect(() => RequestUpsert.parse(invalidRequest)).toThrow();
    });
  });

  describe('Validation helpers', () => {
    it('should return success for valid data', () => {
      const result = validateLineItem({
        pipedriveProductId: 123,
        name: "Test Product"
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Test Product");
      }
    });
    
    it('should return error for invalid data', () => {
      const result = validateLineItem({
        pipedriveProductId: "invalid",
        name: ""
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });
    
    it('should validate salesperson selection correctly', () => {
      const validResult = validateSalespersonSelection('James');
      expect(validResult.success).toBe(true);
      
      const invalidResult = validateSalespersonSelection('InvalidName');
      expect(invalidResult.success).toBe(false);
    });
  });
});
Manual Validation Steps:

 Import schemas in a test file and verify TypeScript types work
 Test Zod validation with valid/invalid data samples
 Verify error classes extend properly and have correct status codes
 Test errorToResponse returns proper JSON format with all fields
 Confirm logging works with structured metadata and environment info
 Run unit tests and verify all schema validations pass
 Test validation helper functions with both valid and invalid data
 Verify custom validation messages are clear and helpful
 Test mobile-first ContactJSON requirements (mineGroup, mineName)
 Verify SalespersonSelection enum validation works correctly
 Test RequestUpsert validation for mobile-first salesperson requirements

Checkbox: - [ ] 2.1 Schema Contracts & Validation Complete

2.2 Database Client & Utilities
Goal: Create environment-aware database client with integrated configuration and robust utilities
Cursor Prompt:
Create enhanced database client utilities that integrate with environment configuration and provide consistent database access patterns.

Create `/lib/db.ts`:

import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './env';
import { log } from './log';
import { AppError } from './errors';

// Create environment-aware database client
export const getDb = () => {
  const config = getSupabaseConfig();
  
  log(`Creating Supabase client for ${config.environment} environment`, {
    url: config.url,
    environment: config.environment
  });
  
  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Utility for consistent error handling in database operations
export const withDbErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> => {
  try {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    
    log(`Database operation completed: ${context}`, { 
      duration: `${duration}ms`,
      context 
    });
    
    return result;
  } catch (error) {
    log(`Database error in ${context}`, { 
      error: error instanceof Error ? error.message : String(error),
      context 
    });
    
    if (error instanceof Error) {
      throw new AppError(`Database operation failed: ${context} - ${error.message}`, { 
        originalError: error,
        context 
      });
    }
    
    throw new AppError(`Database operation failed: ${context}`, { 
      originalError: error,
      context 
    });
  }
};

// Generate next sequential request ID using database function
export const generateRequestId = async (): Promise<string> => {
  return withDbErrorHandling(async () => {
    const db = getDb();
    
    // Use the database function for consistent ID generation
    const { data, error } = await db
      .rpc('generate_request_id');
      
    if (error) {
      throw error;
    }
    
    const newId = data as string;
    
    log(`Generated new request ID: ${newId}`);
    
    return newId;
  }, 'generateRequestId');
};

// Validate contact JSONB using database function
export const validateContactJsonb = async (contact: any): Promise<boolean> => {
  return withDbErrorHandling(async () => {
    const db = getDb();
    
    const { data, error } = await db
      .rpc('validate_contact_jsonb', { contact_data: contact });
      
    if (error) {
      throw error;
    }
    
    const isValid = data as boolean;
    
    log(`Contact JSONB validation result: ${isValid}`, { contact });
    
    return isValid;
  }, 'validateContactJsonb');
};

// Database health check utility
export const checkDbHealth = async (): Promise<{ healthy: boolean; environment: string; latency?: number }> => {
  return withDbErrorHandling(async () => {
    const startTime = Date.now();
    const db = getDb();
    const config = getSupabaseConfig();
    
    // Simple query to check connectivity
    const { error } = await db
      .from('requests')
      .select('id')
      .limit(1);
      
    const latency = Date.now() - startTime;
    
    if (error) {
      log(`Database health check failed`, { 
        error: error.message,
        environment: config.environment 
      });
      return { 
        healthy: false, 
        environment: config.environment 
      };
    }
    
    log(`Database health check passed`, { 
      latency: `${latency}ms`,
      environment: config.environment 
    });
    
    return { 
      healthy: true, 
      environment: config.environment,
      latency 
    };
  }, 'checkDbHealth');
};

// KV cache utilities for better performance
export const kvGet = async <T = any>(key: string): Promise<T | null> => {
  return withDbErrorHandling(async () => {
    const db = getDb();
    
    const { data, error } = await db
      .from('kv_cache')
      .select('value')
      .eq('key', key)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw error;
    }
    
    return data?.value as T;
  }, `kvGet:${key}`);
};

export const kvSet = async (key: string, value: any): Promise<void> => {
  return withDbErrorHandling(async () => {
    const db = getDb();
    
    const { error } = await db
      .from('kv_cache')
      .upsert({ 
        key, 
        value,
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      throw error;
    }
    
    log(`KV cache updated`, { key });
  }, `kvSet:${key}`);
};

Update unit tests in `/tests/unit/db.test.ts`:

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getDb, 
  generateRequestId, 
  validateContactJsonb,
  checkDbHealth,
  kvGet,
  kvSet,
  withDbErrorHandling 
} from '../../lib/db';

describe('Database utilities', () => {
  it('should create database client with correct environment', () => {
    const db = getDb();
    expect(db).toBeDefined();
  });
  
  it('should generate sequential request IDs using database function', async () => {
    const id1 = await generateRequestId();
    expect(id1).toMatch(/^QR-\d{3}$/);
    
    const id2 = await generateRequestId();
    expect(id2).toMatch(/^QR-\d{3}$/);
    
    // Should be sequential
    const num1 = parseInt(id1.split('-')[1]);
    const num2 = parseInt(id2.split('-')[1]);
    expect(num2).toBe(num1 + 1);
  });
  
  it('should validate contact JSONB using database function', async () => {
    const validContact = {
      personId: 123,
      name: 'John Doe',
      mineGroup: 'Northern Mines',
      mineName: 'Diamond Mine A'
    };
    
    const invalidContact = {
      name: 'John Doe'
      // Missing required fields
    };
    
    const validResult = await validateContactJsonb(validContact);
    expect(validResult).toBe(true);
    
    const invalidResult = await validateContactJsonb(invalidContact);
    expect(invalidResult).toBe(false);
  });
  
  it('should perform database health check', async () => {
    const health = await checkDbHealth();
    expect(health).toHaveProperty('healthy');
    expect(health).toHaveProperty('environment');
    expect(['test', 'prod']).toContain(health.environment);
  });
  
  it('should handle database errors properly', async () => {
    const operation = async () => {
      throw new Error('Test database error');
    };
    
    await expect(
      withDbErrorHandling(operation, 'test-operation')
    ).rejects.toThrow('Database operation failed: test-operation');
  });
  
  describe('KV Cache', () => {
    it('should set and get values', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test', number: 42 };
      
      await kvSet(testKey, testValue);
      const retrieved = await kvGet(testKey);
      
      expect(retrieved).toEqual(testValue);
    });
    
    it('should return null for non-existent keys', async () => {
      const result = await kvGet('non-existent-key');
      expect(result).toBeNull();
    });
  });
});

Also create a database integration test in `/tests/integration/db-integration.test.ts`:

import { describe, it, expect } from 'vitest';
import { getDb, checkDbHealth, generateRequestId, validateContactJsonb } from '../../lib/db';
import { validateEnvironment } from '../../lib/env';

describe('Database Integration', () => {
  beforeAll(() => {
    // Ensure environment is properly configured
    validateEnvironment();
  });
  
  it('should connect to correct database based on environment', async () => {
    const health = await checkDbHealth();
    expect(health.healthy).toBe(true);
    expect(health.latency).toBeGreaterThan(0);
  });
  
  it('should generate unique request IDs using database function', async () => {
    const ids = await Promise.all([
      generateRequestId(),
      generateRequestId(),
      generateRequestId()
    ]);
    
    // All should be unique
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
    
    // All should follow format
    ids.forEach(id => {
      expect(id).toMatch(/^QR-\d{3}$/);
    });
  });
  
  it('should validate contact JSONB with database function', async () => {
    const validContact = {
      personId: 123,
      name: 'Test Contact',
      mineGroup: 'Test Mine Group',
      mineName: 'Test Mine Name'
    };
    
    const result = await validateContactJsonb(validContact);
    expect(result).toBe(true);
  });
  
  it('should test salesperson constraint in database', async () => {
    const db = getDb();
    
    // Test valid salesperson
    const validData = {
      salesperson_selection: 'Luyanda',
      status: 'draft' as const,
      line_items: []
    };
    
    const { error: validError } = await db
      .from('requests')
      .insert(validData)
      .select()
      .single();
    
    expect(validError).toBeNull();
    
    // Test invalid salesperson (should fail constraint)
    const invalidData = {
      salesperson_selection: 'InvalidName',
      status: 'draft' as const,
      line_items: []
    };
    
    const { error: invalidError } = await db
      .from('requests')
      .insert(invalidData)
      .select()
      .single();
    
    expect(invalidError).toBeDefined();
    expect(invalidError?.message).toContain('check constraint');
  });
});