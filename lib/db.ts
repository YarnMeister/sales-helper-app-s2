import { logInfo, logError } from './log';
import { AppError } from './errors';
import { getRequestsTableName } from './db-utils';
import { getDatabaseConnection, withDbErrorHandling } from './database/core/connection';
import { createStandardConnection } from './database/connection-standard';
import { flowMetricsConfig } from './database/schema';
import { eq, asc } from 'drizzle-orm';

// Get database connection from core infrastructure
const sql = getDatabaseConnection() as any;

// CRUD operations for requests
export const createRequest = async (data: {
  request_id?: string;
  salesperson_first_name?: string;
  salesperson_selection?: string;
  mine_group?: string;
  mine_name?: string;
  contact?: any;
  line_items?: any[];
  comment?: string;
}) => {
  return withDbErrorHandling(async () => {
    const result = await sql`
      INSERT INTO requests (
        request_id,
        salesperson_first_name,
        salesperson_selection, 
        mine_group,
        mine_name,
        contact,
        line_items,
        comment,
        status
      ) VALUES (
        ${data.request_id || null},
        ${data.salesperson_first_name || null},
        ${data.salesperson_selection || null},
        ${data.mine_group || null},
        ${data.mine_name || null},
        ${JSON.stringify(data.contact || null)},
        ${JSON.stringify(data.line_items || [])},
        ${data.comment || null},
        'draft'
      )
      RETURNING *
    `;
    return result[0];
  }, 'createRequest');
};

// Atomic line item operations to prevent race conditions
export const addLineItemAtomic = async (requestId: string, newItem: any) => {
  return withDbErrorHandling(async () => {
    logInfo('Adding line item atomically', {
      requestId,
      itemCode: newItem.code,
      itemName: newItem.name
    });

    const result = await sql`
      UPDATE requests
      SET
        line_items = line_items || ${JSON.stringify([newItem])},
        updated_at = ${new Date().toISOString()}
      WHERE id = ${requestId}
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error('Request not found');
    }

    logInfo('Line item added successfully', {
      requestId,
      newLineItemsCount: result[0].line_items?.length || 0
    });

    return result[0];
  }, 'addLineItemAtomic');
};

export const updateRequest = async (id: string, updates: {
  contact?: any;
  line_items?: any[];
  comment?: string;
  salesperson_first_name?: string;
  salesperson_selection?: string;
  status?: string;
  pipedrive_deal_id?: number;
}) => {
  return withDbErrorHandling(async () => {
    logInfo('Starting atomic update', {
      id,
      fields: Object.keys(updates),
      hasContact: updates.contact !== undefined,
      hasLineItems: updates.line_items !== undefined,
      hasComment: updates.comment !== undefined,
      lineItemsCount: Array.isArray(updates.line_items) ? updates.line_items.length : 'undefined'
    });

    // Use atomic UPDATE with CASE statements to prevent race conditions
    const result = await sql`
      UPDATE requests
      SET
        contact = CASE
          WHEN ${updates.contact !== undefined} THEN ${JSON.stringify(updates.contact)}
          ELSE contact
        END,
        line_items = CASE
          WHEN ${updates.line_items !== undefined} THEN ${JSON.stringify(updates.line_items)}
          ELSE line_items
        END,
        comment = CASE
          WHEN ${updates.comment !== undefined} THEN ${updates.comment}
          ELSE comment
        END,
        salesperson_first_name = CASE
          WHEN ${updates.salesperson_first_name !== undefined} THEN ${updates.salesperson_first_name}
          ELSE salesperson_first_name
        END,
        salesperson_selection = CASE
          WHEN ${updates.salesperson_selection !== undefined} THEN ${updates.salesperson_selection}
          ELSE salesperson_selection
        END,
        status = CASE
          WHEN ${updates.status !== undefined} THEN ${updates.status}
          ELSE status
        END,
        pipedrive_deal_id = CASE
          WHEN ${updates.pipedrive_deal_id !== undefined} THEN ${updates.pipedrive_deal_id}
          ELSE pipedrive_deal_id
        END,
        updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error('Request not found or update failed');
    }

    logInfo('Atomic update completed', {
      id,
      resultLineItemsCount: result[0].line_items?.length || 0
    });

    return result[0];
  }, 'updateRequest');
};

export const getRequestById = async (id: string) => {
  return withDbErrorHandling(async () => {
    const result = await sql`SELECT * FROM requests WHERE id = ${id}`;
    
    return result[0] || null;
  }, 'getRequestById');
};

export const getRequests = async (filters: {
  status?: string;
  salesperson?: string;
  limit?: number;
}) => {
  return withDbErrorHandling(async () => {
    // Simple implementation - can be enhanced later
    if (filters.status && filters.salesperson && filters.salesperson !== 'all') {
      return await sql`
        SELECT * FROM requests 
        WHERE status = ${filters.status} 
        AND salesperson_first_name = ${filters.salesperson}
        ORDER BY created_at DESC 
        LIMIT ${filters.limit || 50}
      `;
    } else if (filters.status) {
      return await sql`
        SELECT * FROM requests 
        WHERE status = ${filters.status}
        ORDER BY created_at DESC 
        LIMIT ${filters.limit || 50}
      `;
    } else if (filters.salesperson && filters.salesperson !== 'all') {
      return await sql`
        SELECT * FROM requests 
        WHERE salesperson_first_name = ${filters.salesperson}
        ORDER BY created_at DESC 
        LIMIT ${filters.limit || 50}
      `;
    } else {
      return await sql`
        SELECT * FROM requests 
        ORDER BY created_at DESC 
        LIMIT ${filters.limit || 50}
      `;
    }
  }, 'getRequests');
};

export const deleteRequest = async (id: string) => {
  return withDbErrorHandling(async () => {
    const result = await sql`DELETE FROM requests WHERE id = ${id} RETURNING *`;
    
    return result[0] || null;
  }, 'deleteRequest');
};

// Export the sql instance for backward compatibility
export { sql };

// Pipedrive Flow Data Functions
export const insertDealFlowData = async (flowData: any[]) => {
  return withDbErrorHandling(async () => {
    logInfo('Inserting deal flow data', { 
      dealId: flowData[0]?.deal_id,
      recordCount: flowData.length 
    });
    
    // Insert records one by one, skipping duplicates based on pipedrive_event_id
    const results = [];
    for (const data of flowData) {
      try {
        // First try to insert the record
        const insertResult = await sql`
          INSERT INTO pipedrive_deal_flow_data (
            pipedrive_event_id,
            deal_id,
            pipeline_id,
            stage_id,
            stage_name,
            entered_at,
            left_at,
            duration_seconds
          ) VALUES (
            ${data.pipedrive_event_id},
            ${data.deal_id},
            ${data.pipeline_id},
            ${data.stage_id},
            ${data.stage_name},
            ${data.entered_at},
            ${data.left_at || null},
            ${data.duration_seconds || null}
          )
          ON CONFLICT (pipedrive_event_id) DO NOTHING
          RETURNING *
        `;
        
        if (insertResult.length > 0) {
          // New record was inserted
          results.push(insertResult[0]);
          logInfo('Inserted new record', { 
            pipedrive_event_id: data.pipedrive_event_id,
            deal_id: data.deal_id,
            stage_name: data.stage_name 
          });
        } else {
          // Record already exists, fetch it
          const existingResult = await sql`
            SELECT * FROM pipedrive_deal_flow_data 
            WHERE pipedrive_event_id = ${data.pipedrive_event_id}
          `;
          if (existingResult.length > 0) {
            results.push(existingResult[0]);
            logInfo('Found existing record', { 
              pipedrive_event_id: data.pipedrive_event_id,
              deal_id: data.deal_id,
              stage_name: data.stage_name 
            });
          }
        }
      } catch (error) {
        // Log the error but continue processing other records
        logInfo('Error processing record', { 
          pipedrive_event_id: data.pipedrive_event_id,
          deal_id: data.deal_id,
          stage_name: data.stage_name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    return results;
  }, 'insertDealFlowData');
};

export const insertDealMetadata = async (dealMetadata: any) => {
  return withDbErrorHandling(async () => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      // For now, just log in development since we don't have mock tables for this
      logInfo('Development mode: Would insert deal metadata', { 
        dealId: dealMetadata.id,
        title: dealMetadata.title 
      });
      return dealMetadata;
    } else {
      const result = await sql`
        INSERT INTO pipedrive_metric_data (
          id,
          title,
          pipeline_id,
          stage_id,
          status
        ) VALUES (
          ${dealMetadata.id},
          ${dealMetadata.title},
          ${dealMetadata.pipeline_id},
          ${dealMetadata.stage_id},
          ${dealMetadata.status}
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          pipeline_id = EXCLUDED.pipeline_id,
          stage_id = EXCLUDED.stage_id,
          status = EXCLUDED.status,
          last_fetched_at = NOW()
        RETURNING *
      `;
      return result[0];
    }
  }, 'insertDealMetadata');
};

export const getDealFlowData = async (dealId?: number) => {
  return withDbErrorHandling(async () => {
    logInfo('Fetching deal flow data', { dealId });
    
    let result;
    if (dealId) {
      result = await sql`SELECT * FROM pipedrive_deal_flow_data WHERE deal_id = ${dealId} ORDER BY entered_at::timestamp DESC`;
    } else {
      result = await sql`SELECT * FROM pipedrive_deal_flow_data ORDER BY entered_at::timestamp DESC`;
    }
    
    return result;
  }, 'getDealFlowData');
};



/**
 * Get deals for a specific metric based on flow_metrics_config
 *
 * This function replaces the old canonical stage mapping approach.
 * It uses the JSONB config in flow_metrics_config table to determine
 * start and end stages, then calculates lead times from pipedrive_deal_flow_data.
 *
 * @param metricKey - The metric_key from flow_metrics_config table
 * @param period - Time period filter: '7d', '14d', '1m', '3m'
 * @returns Array of deals with start_date, end_date, and duration_seconds
 */
export const getDealsForMetric = async (metricKey: string, period?: string) => {
  return withDbErrorHandling(async () => {
    logInfo('Fetching deals for metric', { metricKey, period });

    // Get the metric config (JSONB contains start/end stage info)
    const metricConfigResult = await sql`
      SELECT config
      FROM flow_metrics_config
      WHERE metric_key = ${metricKey}
      AND is_active = true
      LIMIT 1
    `;

    if (!metricConfigResult || metricConfigResult.length === 0) {
      logInfo('No active config found for metric', { metricKey });
      return [];
    }

    const config = metricConfigResult[0].config;

    // Validate config structure
    if (!config?.startStage?.id || !config?.endStage?.id) {
      logInfo('Invalid config structure for metric', { metricKey, config });
      return [];
    }

    const startStageId = config.startStage.id;
    const endStageId = config.endStage.id;

    logInfo('Using stage IDs from config', {
      metricKey,
      startStageId,
      endStageId,
      startStageName: config.startStage.name,
      endStageName: config.endStage.name
    });

    // Calculate period cutoff (filter by end_date - when deal completed the stage)
    let cutoffDateFilter = sql``;
    if (period) {
      const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '1m' ? 30 : period === '3m' ? 90 : 0;

      if (days > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDateFilter = sql`AND e.end_date >= ${cutoffDate.toISOString()}`;
      }
    }

    // Get all deals that have both start and end stages
    // Use entered_at for both start and end dates (when deal entered each stage)
    const result = await sql`
      WITH deal_stages AS (
        SELECT
          deal_id,
          stage_id,
          stage_name,
          entered_at,
          ROW_NUMBER() OVER (PARTITION BY deal_id, stage_id ORDER BY entered_at) as rn
        FROM pipedrive_deal_flow_data
        WHERE stage_id IN (${startStageId}, ${endStageId})
      ),
      start_stages AS (
        SELECT deal_id, entered_at as start_date
        FROM deal_stages
        WHERE stage_id = ${startStageId} AND rn = 1
      ),
      end_stages AS (
        SELECT deal_id, entered_at as end_date
        FROM deal_stages
        WHERE stage_id = ${endStageId} AND rn = 1
      )
      SELECT
        s.deal_id,
        s.start_date,
        e.end_date,
        EXTRACT(EPOCH FROM (e.end_date - s.start_date))::BIGINT as duration_seconds
      FROM start_stages s
      JOIN end_stages e ON s.deal_id = e.deal_id
      WHERE e.end_date > s.start_date
      ${cutoffDateFilter}
      ORDER BY e.end_date DESC
    `;

    logInfo('Deals fetched for metric', {
      metricKey,
      dealCount: result.length,
      period
    });

    return result as any[];
  }, 'getDealsForMetric');
};

// Flow Metrics Configuration Functions
export const getFlowMetricsConfig = async () => {
  return withDbErrorHandling(async () => {
    logInfo('Fetching flow metrics configuration');
    const result = await sql`
      SELECT * FROM flow_metrics_config
      ORDER BY sort_order, display_title
    `;
    return result;
  }, 'getFlowMetricsConfig');
};

export const getActiveFlowMetricsConfig = async (): Promise<any[]> => {
  return withDbErrorHandling(async () => {
    logInfo('Fetching active flow metrics configuration');

    // Use Drizzle ORM instead of raw SQL to avoid HTTP driver truncation issues
    const { db } = createStandardConnection();
    const result = await db
      .select()
      .from(flowMetricsConfig)
      .where(eq(flowMetricsConfig.isActive, true))
      .orderBy(asc(flowMetricsConfig.sortOrder), asc(flowMetricsConfig.displayTitle));

    // Convert camelCase to snake_case for backward compatibility
    const formattedResult = result.map((m: any) => ({
      id: m.id,
      metric_key: m.metricKey,
      display_title: m.displayTitle,
      config: m.config,
      sort_order: m.sortOrder,
      is_active: m.isActive,
      created_at: m.createdAt,
      updated_at: m.updatedAt
    }));

    logInfo('Active flow metrics configuration result', {
      totalCount: formattedResult.length,
      metrics: formattedResult.map((m: any) => ({
        id: m.id,
        title: m.display_title,
        metric_key: m.metric_key,
        is_active: m.is_active,
        sort_order: m.sort_order
      }))
    });

    return formattedResult;
  }, 'getActiveFlowMetricsConfig');
};

export const getFlowMetricConfig = async (metricKeyOrId: string) => {
  return withDbErrorHandling(async () => {
    logInfo('Fetching flow metric configuration', { metricKeyOrId });

    // Check if it's a UUID (id) or a metric_key
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(metricKeyOrId);

    const result = await sql`
      SELECT * FROM flow_metrics_config
      WHERE ${isUuid ? sql`id = ${metricKeyOrId}` : sql`metric_key = ${metricKeyOrId}`}
      LIMIT 1
    `;
    return result[0] || null;
  }, 'getFlowMetricConfig');
};

export const createFlowMetricConfig = async (data: {
  metric_key: string;
  display_title: string;
  config?: any; // JSONB config
  sort_order?: number;
  is_active?: boolean;
}) => {
  return withDbErrorHandling(async () => {
    logInfo('Creating flow metric configuration', { metricKey: data.metric_key });

    // Insert the config with JSONB support
    const configResult = await sql`
      INSERT INTO flow_metrics_config (
        metric_key,
        display_title,
        config,
        sort_order,
        is_active
      ) VALUES (
        ${data.metric_key},
        ${data.display_title},
        ${data.config ? JSON.stringify(data.config) : '{}'}::jsonb,
        ${data.sort_order || 0},
        ${data.is_active !== false}
      )
      RETURNING *
    `;

    // Return the created config
    return configResult[0];
  }, 'createFlowMetricConfig');
};

export const updateFlowMetricConfig = async (
  id: string,
  data: {
    display_title?: string;
    config?: any;
    sort_order?: number;
    is_active?: boolean;
  }
) => {
  return withDbErrorHandling(async () => {
    logInfo('Updating flow metric configuration', { id });

    await sql`
      UPDATE flow_metrics_config
      SET
        display_title = COALESCE(${data.display_title}, display_title),
        config = COALESCE(${data.config ? JSON.stringify(data.config) : null}::jsonb, config),
        sort_order = COALESCE(${data.sort_order}, sort_order),
        is_active = COALESCE(${data.is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
    `;

    // Return the updated record
    const result = await sql`
      SELECT * FROM flow_metrics_config
      WHERE id = ${id}
      LIMIT 1
    `;

    return result[0];
  }, 'updateFlowMetricConfig');
};

export const deleteFlowMetricConfig = async (id: string) => {
  return withDbErrorHandling(async () => {
    logInfo('Deleting flow metric configuration', { id });

    // Delete the config
    const result = await sql`
      DELETE FROM flow_metrics_config
      WHERE id = ${id}
      RETURNING *
    `;

    return result[0];
  }, 'deleteFlowMetricConfig');
};

export const reorderFlowMetrics = async (reorderData: Array<{ id: string; sort_order: number }>) => {
  return withDbErrorHandling(async () => {
    logInfo('Reordering flow metrics', { count: reorderData.length });

    // Update sort orders in batch
    for (const item of reorderData) {
      await sql`
        UPDATE flow_metrics_config
        SET sort_order = ${item.sort_order}
        WHERE id = ${item.id}
      `;
    }

    return { success: true, updated: reorderData.length };
  }, 'reorderFlowMetrics');
};
