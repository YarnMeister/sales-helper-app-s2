
Phase 1: Setup & Schema Definition
// 1. Complete schema definition
// lib/database/schema.ts
export const canonicalStageMappings = pgTable('canonical_stage_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  metricConfigId: uuid('metric_config_id').references(() => flowMetricsConfig.id),
  canonicalStage: text('canonical_stage').notNull(),
  startStage: text('start_stage'),
  endStage: text('end_stage'),
  startStageId: integer('start_stage_id'),
  endStageId: integer('end_stage_id'),
  avgMinDays: integer('avg_min_days'),
  avgMaxDays: integer('avg_max_days'),
  metricComment: text('metric_comment'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. Database connection
// lib/database/connection.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

Phase 2: Migration Generation
# 1. Generate initial migration from existing schema
npm run db:generate

# 2. Review generated migration
# 3. Apply migration
npm run db:migrate

# 4. Verify data integrity
npm run db:verify

Phase 3: Data Migration
// 1. Create data migration script
// scripts/migrate-data.ts
import { db } from '../lib/database/connection';
import { flowMetricsConfig, canonicalStageMappings } from '../lib/database/schema';

const migrateData = async () => {
  // Insert default metrics
  await db.insert(flowMetricsConfig).values([
    {
      metricKey: 'lead-conversion',
      displayTitle: 'Lead Conversion Time',
      canonicalStage: 'Lead Conversion',
      sortOrder: 1,
      isActive: true,
    },
    // ... other metrics
  ]);

  // Insert stage mappings
  await db.insert(canonicalStageMappings).values([
    {
      canonicalStage: 'Order Conversion',
      startStage: 'Order Received - Johan',
      endStage: 'Quality Control',
    },
  ]);
};

Immediate Actions
Create emergency fix migration to restore data
Add migration verification to prevent future silent failures
Document current schema for Drizzle migration
Short Term (This Week)
Install Drizzle and create initial schema
Generate baseline migration from current database
Test with development branch
Medium Term (Next 2 Weeks)
Migrate core tables to Drizzle schema
Update API endpoints to use Drizzle
Add comprehensive testing for migrations