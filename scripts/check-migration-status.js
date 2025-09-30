#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');
const path = require('path');

config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function checkStatus() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const sql = neon(connectionString);

  // Print DB identity
  const who = await sql`select inet_server_addr() as ip, inet_server_port() as port, current_database() as db`;
  console.log('DB identity:', who[0]);

  // List all migrations
  const migrations = await sql`SELECT version, name, executed_at FROM schema_migrations ORDER BY version`;
  console.log('\nAll migration records:');
  console.table(migrations);

  // Global constraint(s) by name
  const named = await sql`
    SELECT n.nspname as schema, t.relname as table, c.conname as constraint_name, pg_get_constraintdef(c.oid) as check_clause
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.contype = 'c' AND c.conname = 'check_valid_metric_config'
  `;
  console.log('\nConstraints named check_valid_metric_config:');
  console.table(named);

  // Constraints on public.flow_metrics_config
  const tableCons = await sql`
    SELECT n.nspname as schema, t.relname as table, c.conname as constraint_name, pg_get_constraintdef(c.oid) as check_clause
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.contype = 'c' AND n.nspname = 'public' AND t.relname = 'flow_metrics_config'
  `;
  console.log('\nConstraints on public.flow_metrics_config:');
  console.table(tableCons);

  // Function presence
  const func = await sql`SELECT proname FROM pg_proc WHERE proname = 'validate_metric_config_jsonb'`;
  console.log('\nFunction present?', func.length > 0);
}

checkStatus();