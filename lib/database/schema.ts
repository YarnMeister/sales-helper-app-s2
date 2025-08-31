import { pgTable, uuid, text, integer, boolean, timestamp, date, bigint, jsonb, pgEnum, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Custom enums
export const requestStatusEnum = pgEnum('request_status', ['draft', 'submitted', 'approved', 'rejected']);

// Requests table
export const requests = pgTable('requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: text('request_id').unique(),
  status: requestStatusEnum('status').notNull().default('draft'),
  salespersonFirstName: text('salesperson_first_name'),
  salespersonSelection: text('salesperson_selection'),
  mineGroup: text('mine_group'),
  mineName: text('mine_name'),
  contact: jsonb('contact'),
  lineItems: jsonb('line_items').notNull().default('[]'),
  comment: text('comment'),
  pipedriveDealId: integer('pipedrive_deal_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  salespersonSelectionCheck: check('requests_salesperson_selection_check', 
    sql`${table.salespersonSelection} = ANY (ARRAY['Luyanda', 'James', 'Stefan'])`),
}));

// Site visits table
export const siteVisits = pgTable('site_visits', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date').notNull().defaultNow(),
  salesperson: text('salesperson').notNull(),
  plannedMines: text('planned_mines').array().notNull(),
  mainPurpose: text('main_purpose').notNull(),
  availability: text('availability').notNull(),
  comments: text('comments'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  availabilityCheck: check('check_availability_valid', 
    sql`${table.availability} = ANY (ARRAY['Later this morning', 'In the afternoon', 'Tomorrow'])`),
  purposeCheck: check('check_purpose_valid', 
    sql`${table.mainPurpose} = ANY (ARRAY['Quote follow-up', 'Delivery', 'Site check', 'Installation support', 'General sales visit'])`),
  salespersonCheck: check('check_salesperson_valid', 
    sql`${table.salesperson} = ANY (ARRAY['James', 'Luyanda', 'Stefan'])`),
}));

// Pipedrive submissions table
export const pipedriveSubmissions = pgTable('pipedrive_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: text('request_id').notNull(),
  payload: jsonb('payload').notNull(),
  simulatedDealId: integer('simulated_deal_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Flow metrics config table
export const flowMetricsConfig = pgTable('flow_metrics_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  metricKey: text('metric_key').unique().notNull(),
  displayTitle: text('display_title').notNull(),
  canonicalStage: text('canonical_stage').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Canonical stage mappings table
export const canonicalStageMappings = pgTable('canonical_stage_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  canonicalStage: text('canonical_stage').notNull(),
  startStage: text('start_stage'),
  endStage: text('end_stage'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  metricConfigId: uuid('metric_config_id').references(() => flowMetricsConfig.id),
  startStageId: bigint('start_stage_id', { mode: 'number' }),
  endStageId: bigint('end_stage_id', { mode: 'number' }),
  avgMinDays: integer('avg_min_days'),
  avgMaxDays: integer('avg_max_days'),
  metricComment: text('metric_comment'),
});

// Pipedrive deal flow data table
export const pipedriveDealFlowData = pgTable('pipedrive_deal_flow_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: bigint('deal_id', { mode: 'number' }).notNull(),
  pipelineId: bigint('pipeline_id', { mode: 'number' }).notNull(),
  stageId: bigint('stage_id', { mode: 'number' }).notNull(),
  stageName: text('stage_name').notNull(),
  enteredAt: timestamp('entered_at', { withTimezone: true }).notNull(),
  leftAt: timestamp('left_at', { withTimezone: true }),
  durationSeconds: bigint('duration_seconds', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  pipedriveEventId: bigint('pipedrive_event_id', { mode: 'number' }).unique().notNull(),
});

// Pipedrive metric data table
export const pipedriveMetricData = pgTable('pipedrive_metric_data', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  title: text('title').notNull(),
  pipelineId: bigint('pipeline_id', { mode: 'number' }).notNull(),
  stageId: bigint('stage_id', { mode: 'number' }).notNull(),
  status: text('status').notNull(),
  firstFetchedAt: timestamp('first_fetched_at', { withTimezone: true }).defaultNow(),
  lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }).defaultNow(),
});

// Schema migrations table (for Drizzle)
export const schemaMigrations = pgTable('schema_migrations', {
  version: integer('version').primaryKey(),
  name: text('name').notNull(),
  executedAt: timestamp('executed_at', { withTimezone: true }).notNull().defaultNow(),
});

// Export all tables for easy access
export const tables = {
  requests,
  siteVisits,
  pipedriveSubmissions,
  flowMetricsConfig,
  canonicalStageMappings,
  pipedriveDealFlowData,
  pipedriveMetricData,
  schemaMigrations,
};
