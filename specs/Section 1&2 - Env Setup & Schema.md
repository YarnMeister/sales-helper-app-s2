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