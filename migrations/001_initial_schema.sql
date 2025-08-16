-- Migration 001: Initial Schema (Neon Postgres)
-- This creates the flat JSONB schema for the Sales Helper App

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
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(request_id FROM 4) AS INTEGER)), 0) + 1
    INTO next_num
    FROM requests
    WHERE request_id ~ '^QR-[0-9]+$';
    
    NEW.request_id := 'QR-' || LPAD(next_num::TEXT, 3, '0');
    RETURN NEW;
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
