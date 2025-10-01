import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, pgEnum, index, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const requestStatusEnum = pgEnum('request_status', ['draft', 'submitted', 'approved', 'rejected']);

// Base tables
export const flowMetricsConfig = pgTable('flow_metrics_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  metricKey: text('metric_key').notNull().unique(),
  displayTitle: text('display_title').notNull(),
  canonicalStage: text('canonical_stage').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  metricKeyIdx: uniqueIndex('idx_fmc_metric_key').on(table.metricKey),
  sortOrderIdx: index('idx_fmc_sort_order').on(table.sortOrder),
  isActiveIdx: index('idx_fmc_is_active').on(table.isActive),
}));

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
}, (table) => ({
  canonicalStageIdx: index('idx_csm_canonical_stage').on(table.canonicalStage),
  startStageIdx: index('idx_csm_start_stage').on(table.startStage),
  endStageIdx: index('idx_csm_end_stage').on(table.endStage),
  startStageIdIdx: index('idx_csm_start_stage_id').on(table.startStageId),
  endStageIdIdx: index('idx_csm_end_stage_id').on(table.endStageId),
  metricConfigIdIdx: index('idx_csm_metric_config_id').on(table.metricConfigId),
}));

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
  requestIdIdx: uniqueIndex('idx_requests_request_id').on(table.requestId),
  createdAtIdx: index('idx_requests_created_at').on(table.createdAt),
  statusIdx: index('idx_requests_status').on(table.status),
  mineGroupIdx: index('idx_requests_mine_group').on(table.mineGroup),
  mineNameIdx: index('idx_requests_mine_name').on(table.mineName),
  salespersonIdx: index('idx_requests_salesperson').on(table.salespersonSelection),
  lineItemsGinIdx: index('idx_requests_line_items_gin').on(table.lineItems),
  contactGinIdx: index('idx_requests_contact_gin').on(table.contact),
}));

// mock_requests table removed - doesn't exist in production

export const siteVisits = pgTable('site_visits', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: timestamp('date', { mode: 'date' }).notNull().defaultNow(),
  salesperson: text('salesperson').notNull(),
  plannedMines: text('planned_mines').array().notNull(),
  mainPurpose: text('main_purpose').notNull(),
  availability: text('availability').notNull(),
  comments: text('comments'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }), // No default in production
}, (table) => ({
  dateIdx: index('idx_site_visits_date').on(table.date),
  salespersonIdx: index('idx_site_visits_salesperson').on(table.salesperson),
  createdAtIdx: index('idx_site_visits_created_at').on(table.createdAt),
}));

export const pipedriveSubmissions = pgTable('pipedrive_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: text('request_id').notNull(),
  payload: jsonb('payload').notNull(),
  simulatedDealId: integer('simulated_deal_id'), // Nullable in production
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  requestIdIdx: index('idx_pipedrive_submissions_request_id').on(table.requestId),
  simulatedDealIdIdx: index('idx_pipedrive_submissions_simulated_deal_id').on(table.simulatedDealId),
}));

export const pipedriveDealFlowData = pgTable('pipedrive_deal_flow_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: integer('deal_id').notNull(),
  pipelineId: integer('pipeline_id').notNull(),
  stageId: integer('stage_id').notNull(),
  stageName: text('stage_name').notNull(),
  enteredAt: timestamp('entered_at', { withTimezone: true }).notNull(),
  leftAt: timestamp('left_at', { withTimezone: true }),
  durationSeconds: integer('duration_seconds'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  pipedriveEventId: integer('pipedrive_event_id').notNull().unique(),
}, (table) => ({
  dealIdIdx: index('idx_pipedrive_deal_flow_data_deal_id').on(table.dealId),
  stageIdIdx: index('idx_pipedrive_deal_flow_data_stage_id').on(table.stageId),
  pipelineIdIdx: index('idx_pipedrive_deal_flow_data_pipeline_id').on(table.pipelineId),
  enteredAtIdx: index('idx_pipedrive_deal_flow_data_entered_at').on(table.enteredAt),
}));

export const pipedriveMetricData = pgTable('pipedrive_metric_data', {
  id: integer('id').primaryKey().notNull(),
  title: text('title').notNull(),
  pipelineId: integer('pipeline_id').notNull(),
  stageId: integer('stage_id').notNull(),
  status: text('status').notNull(),
  firstFetchedAt: timestamp('first_fetched_at', { withTimezone: true }).defaultNow(),
  lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  pipelineIdIdx: index('idx_pipedrive_metric_data_pipeline_id').on(table.pipelineId),
  stageIdIdx: index('idx_pipedrive_metric_data_stage_id').on(table.stageId),
  statusIdx: index('idx_pipedrive_metric_data_status').on(table.status),
}));

// flow_metrics table removed - doesn't exist in production

// kv_cache table removed - doesn't exist in production

export const schemaMigrations = pgTable('schema_migrations', {
  version: integer('version').primaryKey(),
  name: text('name').notNull(),
  executedAt: timestamp('executed_at').notNull().defaultNow(),
});

// Relations (matching production foreign keys)
export const flowMetricsConfigRelations = relations(flowMetricsConfig, ({ many }) => ({
  stageMappings: many(canonicalStageMappings),
}));

export const canonicalStageMappingsRelations = relations(canonicalStageMappings, ({ one }) => ({
  metricConfig: one(flowMetricsConfig, {
    fields: [canonicalStageMappings.metricConfigId],
    references: [flowMetricsConfig.id],
  }),
}));

export const requestsRelations = relations(requests, ({ many }) => ({
  pipedriveSubmissions: many(pipedriveSubmissions),
}));

export const pipedriveSubmissionsRelations = relations(pipedriveSubmissions, ({ one }) => ({
  request: one(requests, {
    fields: [pipedriveSubmissions.requestId],
    references: [requests.requestId],
  }),
}));

// Export types
export type FlowMetricsConfig = typeof flowMetricsConfig.$inferSelect;
export type NewFlowMetricsConfig = typeof flowMetricsConfig.$inferInsert;
export type CanonicalStageMapping = typeof canonicalStageMappings.$inferSelect;
export type NewCanonicalStageMapping = typeof canonicalStageMappings.$inferInsert;
export type Request = typeof requests.$inferSelect;
export type NewRequest = typeof requests.$inferInsert;
export type SiteVisit = typeof siteVisits.$inferSelect;
export type NewSiteVisit = typeof siteVisits.$inferInsert;
export type PipedriveSubmission = typeof pipedriveSubmissions.$inferSelect;
export type NewPipedriveSubmission = typeof pipedriveSubmissions.$inferInsert;
export type PipedriveDealFlowData = typeof pipedriveDealFlowData.$inferSelect;
export type NewPipedriveDealFlowData = typeof pipedriveDealFlowData.$inferInsert;
export type PipedriveMetricData = typeof pipedriveMetricData.$inferSelect;
export type NewPipedriveMetricData = typeof pipedriveMetricData.$inferInsert;
export type SchemaMigration = typeof schemaMigrations.$inferSelect;
export type NewSchemaMigration = typeof schemaMigrations.$inferInsert;
