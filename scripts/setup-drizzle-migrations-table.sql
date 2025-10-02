-- Setup Drizzle migrations tracking table
-- Run this in BOTH dev and production databases before deploying WebSocket migration system

-- Create drizzle schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS drizzle;

-- Create migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);

-- Insert migration tracking records for existing migrations
-- These match the migrations in lib/database/migrations/
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at)
VALUES 
  (1, 'd7083e0e8b6819b0bc50d329bf2eb45dfc6f8020bd7b70091f4286cafd68772a', 1756871102169),
  (2, 'd2c32f54f776a6e6a4f0339136a1b3c979cd4dbf79bc2e8a46ec90ca38ea8eba', 1756872000000)
ON CONFLICT (id) DO NOTHING;

-- Verify setup
SELECT 
  'drizzle.__drizzle_migrations' as table_name,
  id, 
  hash, 
  created_at,
  to_timestamp(created_at / 1000) as created_at_readable
FROM drizzle.__drizzle_migrations 
ORDER BY id;

