# Production Change Log - Sales Helper App Rewrite

## Overview
This document tracks all environment variables, database changes, and configuration updates required for the Sales Helper App rewrite from legacy multi-table architecture to flat JSONB schema.

---

## 🔧 Environment Variables Changes

### ✅ Step 1: Environment Setup (Completed)
**Date:** August 15, 2025  
**Branch:** `feature/env-setup-schema`

#### New Environment Variables Required:
```bash
# Environment Configuration
APP_ENV=test|prod

# Test Database (Supabase)
SUPABASE_URL_TEST=https://adxfosjzxrafojefntdx.supabase.co
SUPABASE_SERVICE_ROLE_TEST=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeGZvc2p6eHJhZm9qZWZudGR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDEyMTE0NSwiZXhwIjoyMDY5Njk3MTQ1fQ.DBxceHuwu7rp3vrFHp5pxd0BheHOE6iAC0vOCFvTepY

# Production Database (Supabase) - NEEDS PRODUCTION CREDENTIALS
SUPABASE_URL_PROD=https://your-prod-project.supabase.co
SUPABASE_SERVICE_ROLE_PROD=your_prod_service_role_key

# Pipedrive Configuration
PIPEDRIVE_API_TOKEN=80aeac071ca30ee2f8c1caf59459e08f2017e32e
PIPEDRIVE_BASE_URL=https://api.pipedrive.com/v1
PIPEDRIVE_SUBMIT_MODE=mock|live
```

#### Legacy Variables to Remove (After Migration):
```bash
# These will be removed once database client migration is complete
NEXT_PUBLIC_SUPABASE_URL=https://adxfosjzxrafojefntdx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeGZvc2p6eHJhZm9qZWZudGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMjExNDUsImV4cCI6MjA2OTY5NzE0NX0.E1IIS7pnB8XRDSXDBNmAZ8PpVb8f7cP_keSanuyQmt8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeGZvc2p6eHJhZm9qZWZudGR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDEyMTE0NSwiZXhwIjoyMDY5Njk3MTQ1fQ.DBxceHuwu7rp3vrFHp5pxd0BheHOE6iAC0vOCFvTepY
```

#### Changes Made:
- ✅ Added new environment validation system with Zod schemas
- ✅ Created environment-aware configuration (`/lib/env.ts`)
- ✅ Added structured logging (`/lib/log.ts`)
- ✅ Implemented error handling classes (`/lib/errors.ts`)
- ✅ Created environment check script (`/scripts/env-check.js`)
- ✅ Updated package.json scripts with environment validation
- ✅ Added build-time environment validation
- ✅ Created `.env.example` template file
- ✅ Fixed env-check script to work with Node.js without TypeScript compilation
- ✅ Validated environment configuration successfully
- ✅ Tested error handling with missing environment variables

#### Production Deployment Notes:
- **Environment Variables:** Need to add all new variables to Vercel dashboard
- **Validation:** Build will fail until all required variables are set
- **Backward Compatibility:** None - clean rewrite approach

---

## 🗄️ Database Schema Changes

### ✅ Step 2: Database Foundation & Schema (Completed)
**Date:** August 15, 2025  
**Branch:** `feature/env-setup-schema`

#### New Tables to Create:
```sql
-- Core requests table with flat JSONB structure
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Generated columns for fast filtering
  contact_person_id_int INTEGER GENERATED ALWAYS AS ((contact->>'personId')::int) STORED,
  contact_org_id_int    INTEGER GENERATED ALWAYS AS ((contact->>'orgId')::int) STORED,
  contact_mine_group    TEXT GENERATED ALWAYS AS (contact->>'mineGroup') STORED,
  contact_mine_name     TEXT GENERATED ALWAYS AS (contact->>'mineName') STORED
);

-- Support tables
CREATE TABLE IF NOT EXISTS kv_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mock submissions for testing
CREATE TABLE IF NOT EXISTS mock_pipedrive_submissions (
  id BIGSERIAL PRIMARY KEY,
  request_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  simulated_deal_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Indexes to Create:
```sql
-- Btree indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_mine_group ON requests(contact_mine_group);
CREATE INDEX IF NOT EXISTS idx_requests_mine_name ON requests(contact_mine_name);
CREATE INDEX IF NOT EXISTS idx_requests_person_id ON requests(contact_person_id_int);
CREATE INDEX IF NOT EXISTS idx_requests_org_id ON requests(contact_org_id_int);
CREATE INDEX IF NOT EXISTS idx_requests_salesperson ON requests(salesperson_selection);

-- JSONB GIN for containment queries
CREATE INDEX IF NOT EXISTS idx_requests_line_items_gin ON requests USING GIN (line_items jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_requests_contact_gin ON requests USING GIN (contact jsonb_path_ops);

-- Support table indexes
CREATE INDEX IF NOT EXISTS idx_kv_updated ON kv_cache(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_mock_req ON mock_pipedrive_submissions(request_id);
```

#### Functions to Create:
```sql
-- Request ID generation function
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

-- Contact JSONB validation function
CREATE OR REPLACE FUNCTION validate_contact_jsonb(contact_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN contact_data ? 'personId' 
       AND contact_data ? 'name'
       AND contact_data ? 'mineGroup'
       AND contact_data ? 'mineName';
END;
$$ LANGUAGE plpgsql;
```

#### Triggers to Create:
```sql
-- Auto-generate request IDs
CREATE TRIGGER trg_generate_request_id 
    BEFORE INSERT ON requests 
    FOR EACH ROW 
    WHEN (NEW.request_id IS NULL)
    EXECUTE FUNCTION generate_request_id();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_requests_updated BEFORE UPDATE ON requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

#### Legacy Tables to Remove (After Migration):
```sql
-- These will be dropped once migration is complete
-- DROP TABLE IF EXISTS quote_requests CASCADE;
-- DROP TABLE IF EXISTS line_items CASCADE;
-- DROP TABLE IF EXISTS contacts CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
```

#### Changes Made:
- ✅ Created migration directory structure (`/supabase/migrations/`)
- ✅ Created `20250815000001_requests_flat_schema.sql` with new JSONB schema
- ✅ Created `20250815000002_support_tables.sql` with support tables
- ✅ Created migration log tracking system (`MIGRATION_LOG.md`)
- ✅ Analyzed legacy table dependencies (`legacy-table-dependencies.md`)
- ✅ Prepared manual migration execution plan
- ✅ Included comprehensive validation steps

#### Production Deployment Notes:
- **Database Migration:** Manual execution via Supabase Dashboard SQL Editor
- **Data Migration:** Test environment wipe and recreate, production data export/transform
- **Downtime:** Expected 7-12 hours for complete rewrite
- **Rollback:** Keep legacy tables until new system is validated

---

## 🔄 API Changes

### 🔄 Step 3: API Layer Implementation (Pending)
**Date:** TBD  
**Branch:** TBD

#### New API Endpoints:
- `POST /api/requests` - Create/update requests with JSONB data
- `GET /api/requests` - List requests with filtering
- `POST /api/submit` - Submit requests to Pipedrive
- `GET /api/contacts` - Cached contact data from Pipedrive
- `GET /api/products` - Cached product data from Pipedrive

#### Legacy Endpoints to Remove:
- `POST /api/quotes` - Replaced by `/api/requests`
- `GET /api/quotes` - Replaced by `/api/requests`
- `POST /api/line-items` - No longer needed (embedded in requests)
- `GET /api/contacts` - Replaced by new cached version

---

## 🎨 UI Changes

### 🔄 Step 6: UI Updates & Integration (Pending)
**Date:** TBD  
**Branch:** TBD

#### New Components:
- `RequestCard` - Displays flat JSONB data
- `ContactSelector` - Uses cached contact data
- `ProductSelector` - Uses cached product data
- `Navigation` - Updated navigation structure

#### Legacy Components to Remove:
- `EditDraftPage` - Replaced by inline editing
- `AddLineItemsPage` - Replaced by embedded line items
- `AddContactPage` - Replaced by contact selector

---

## 🧪 Testing Changes

### 🔄 Step 4: Testing Infrastructure (Pending)
**Date:** TBD  
**Branch:** TBD

#### New Test Files:
- `/tests/unit/schema.test.ts` - Schema validation tests
- `/tests/unit/db.test.ts` - Database utility tests
- `/tests/integration/db-integration.test.ts` - Database integration tests
- `/tests/e2e/flat-schema.spec.ts` - E2E tests for new schema

#### Legacy Test Files to Remove:
- Tests for old multi-table schema
- Tests for legacy API endpoints

---

## 📊 Monitoring Changes

### 🔄 Step 7: Post Implementation (Pending)
**Date:** TBD  
**Branch:** TBD

#### New Health Endpoints:
- `/api/health` - Basic health check
- `/api/health/detailed` - Detailed system health
- `/api/health/prd` - PRD-specific health metrics

#### New Monitoring Scripts:
- `/scripts/pre-deploy-check.js` - Pre-deployment validation
- `/scripts/post-deploy-monitor.js` - Post-deployment monitoring
- `/scripts/monitoring-dashboard.js` - Performance monitoring
- `/scripts/prd-monitoring-report.js` - PRD-specific monitoring

=

