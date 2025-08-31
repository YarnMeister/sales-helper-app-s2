import { logInfo, logError } from './log';
import { AppError } from './errors';
import { getRequestsTableName } from './db-utils';
import { getDatabaseConnection, withDbErrorHandling } from './database/core/connection';

// Get database connection from core infrastructure
const sql = getDatabaseConnection();

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
    // Get current request to merge updates
    const current = await sql`SELECT * FROM requests WHERE id = ${id}`;
    if (current.length === 0) {
      throw new Error('Request not found');
    }
    
    const currentRequest = current[0];
    const updatedData = {
      contact: updates.contact !== undefined ? updates.contact : currentRequest.contact,
      line_items: updates.line_items !== undefined ? updates.line_items : currentRequest.line_items,
      comment: updates.comment !== undefined ? updates.comment : currentRequest.comment,
      salesperson_first_name: updates.salesperson_first_name !== undefined ? updates.salesperson_first_name : currentRequest.salesperson_first_name,
      salesperson_selection: updates.salesperson_selection !== undefined ? updates.salesperson_selection : currentRequest.salesperson_selection,
      status: updates.status !== undefined ? updates.status : currentRequest.status,
      pipedrive_deal_id: updates.pipedrive_deal_id !== undefined ? updates.pipedrive_deal_id : currentRequest.pipedrive_deal_id
    };
    
    logInfo('Executing update query', { 
      id,
      fields: Object.keys(updates),
      hasContact: updates.contact !== undefined,
      hasLineItems: updates.line_items !== undefined,
      hasComment: updates.comment !== undefined,
      currentLineItemsCount: currentRequest.line_items?.length || 0,
      updatedLineItemsCount: updatedData.line_items?.length || 0
    });
    
    // Debug: Log the data being updated
    console.log('🔍 About to update, current line_items:', currentRequest.line_items);
    console.log('🔍 Updated data line_items:', updatedData.line_items);
    
    const result = await sql`
      UPDATE requests 
      SET 
        contact = ${JSON.stringify(updatedData.contact)},
        line_items = ${JSON.stringify(updatedData.line_items)},
        comment = ${updatedData.comment},
        salesperson_first_name = ${updatedData.salesperson_first_name},
        salesperson_selection = ${updatedData.salesperson_selection},
        status = ${updatedData.status},
        pipedrive_deal_id = ${updatedData.pipedrive_deal_id},
        updated_at = ${new Date().toISOString()}
      WHERE id = ${id} 
      RETURNING *
    `;
    
    console.log('🔍 Result after update:', result[0]);
    
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



// Canonical Stage Mappings Functions
export const getCanonicalStageMappings = async () => {
  return withDbErrorHandling(async () => {
    logInfo('Fetching canonical stage mappings');
    const result = await sql`
      SELECT 
        id,
        canonical_stage,
        start_stage,
        end_stage,
        start_stage_id,
        end_stage_id,
        created_at,
        updated_at
      FROM canonical_stage_mappings 
      ORDER BY canonical_stage
    `;
    return result;
  }, 'getCanonicalStageMappings');
};

export const getCanonicalStageMapping = async (canonicalStage: string) => {
  return withDbErrorHandling(async () => {
    logInfo('Fetching canonical stage mapping', { canonicalStage });
    const result = await sql`
      SELECT 
        id,
        canonical_stage,
        start_stage,
        end_stage,
        start_stage_id,
        end_stage_id,
        created_at,
        updated_at
      FROM canonical_stage_mappings 
      WHERE canonical_stage = ${canonicalStage}
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    return result[0] || null;
  }, 'getCanonicalStageMapping');
};

export const getDealsForCanonicalStage = async (canonicalStage: string, period?: string) => {
  return withDbErrorHandling(async () => {
    logInfo('Fetching deals for canonical stage', { canonicalStage, period });
    
    // Get the mapping for this canonical stage
    const mapping = await getCanonicalStageMapping(canonicalStage);
    if (!mapping) {
      logInfo('No mapping found for canonical stage', { canonicalStage });
      return [];
    }
    
    // Use stage IDs if available, otherwise fall back to stage names
    const startStageFilter = mapping.start_stage_id 
      ? sql`stage_id = ${mapping.start_stage_id}` 
      : sql`stage_name = ${mapping.start_stage}`;
    
    const endStageFilter = mapping.end_stage_id 
      ? sql`stage_id = ${mapping.end_stage_id}` 
      : sql`stage_name = ${mapping.end_stage}`;
    
    // Calculate cutoff date based on period
    let cutoffDateFilter = sql``;
    if (period) {
      const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '1m' ? 30 : period === '3m' ? 90 : 0;

      if (days > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDateFilter = sql`AND s.start_date >= ${cutoffDate.toISOString()}`;
      }
    }
    
    // Get all deals that have both start and end stages
    // Use entered_at for both start and end dates (not left_at)
    const result = await sql`
      WITH deal_stages AS (
        SELECT 
          deal_id,
          stage_id,
          stage_name,
          entered_at,
          ROW_NUMBER() OVER (PARTITION BY deal_id, stage_id ORDER BY entered_at) as rn
        FROM pipedrive_deal_flow_data
        WHERE (${startStageFilter}) OR (${endStageFilter})
      ),
      start_stages AS (
        SELECT deal_id, entered_at as start_date
        FROM deal_stages 
        WHERE (${startStageFilter}) AND rn = 1
      ),
      end_stages AS (
        SELECT deal_id, entered_at as end_date
        FROM deal_stages 
        WHERE (${endStageFilter}) AND rn = 1
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
      ORDER BY s.start_date DESC
    `;
    
    return result;
  }, 'getDealsForCanonicalStage');
};

// New functions for stage ID-based canonical stage mappings
export const updateCanonicalStageMapping = async (
  id: string,
  data: {
    canonical_stage?: string;
    start_stage_id?: number | null;
    end_stage_id?: number | null;
    start_stage?: string;
    end_stage?: string;
  }
) => {
  return withDbErrorHandling(async () => {
    logInfo('Updating canonical stage mapping', { id, data });
    
    const result = await sql`
      UPDATE canonical_stage_mappings 
      SET 
        canonical_stage = COALESCE(${data.canonical_stage}, canonical_stage),
        start_stage_id = ${data.start_stage_id},
        end_stage_id = ${data.end_stage_id},
        start_stage = COALESCE(${data.start_stage}, start_stage),
        end_stage = COALESCE(${data.end_stage}, end_stage),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      throw new Error('Canonical stage mapping not found');
    }
    
    return result[0];
  }, 'updateCanonicalStageMapping');
};

export const createCanonicalStageMapping = async (data: {
  canonical_stage: string;
  start_stage_id?: number | null;
  end_stage_id?: number | null;
  start_stage?: string;
  end_stage?: string;
}) => {
  return withDbErrorHandling(async () => {
    logInfo('Creating canonical stage mapping', { data });
    
    const result = await sql`
      INSERT INTO canonical_stage_mappings (
        canonical_stage,
        start_stage_id,
        end_stage_id,
        start_stage,
        end_stage
      ) VALUES (
        ${data.canonical_stage},
        ${data.start_stage_id},
        ${data.end_stage_id},
        ${data.start_stage || ''},
        ${data.end_stage || ''}
      )
      RETURNING *
    `;
    
    return result[0];
  }, 'createCanonicalStageMapping');
};

// Enhanced Flow Metrics Configuration Functions
export const getFlowMetricsConfig = async () => {
  return withDbErrorHandling(async () => {
    logInfo('Fetching flow metrics configuration');
    const result = await sql`
      SELECT 
        fmc.*,
        csm.start_stage_id,
        csm.end_stage_id,
        csm.avg_min_days,
        csm.avg_max_days,
        csm.metric_comment
      FROM flow_metrics_config fmc
      LEFT JOIN canonical_stage_mappings csm ON csm.metric_config_id = fmc.id
      ORDER BY fmc.sort_order, fmc.display_title
    `;
    return result;
  }, 'getFlowMetricsConfig');
};

export const getActiveFlowMetricsConfig = async () => {
  return withDbErrorHandling(async () => {
    logInfo('Fetching active flow metrics configuration');
    const result = await sql`
      SELECT 
        fmc.*,
        csm.start_stage_id,
        csm.end_stage_id,
        csm.avg_min_days,
        csm.avg_max_days,
        csm.metric_comment
      FROM flow_metrics_config fmc
      LEFT JOIN canonical_stage_mappings csm ON csm.metric_config_id = fmc.id
      WHERE fmc.is_active = true
      ORDER BY fmc.sort_order, fmc.display_title
    `;
    return result;
  }, 'getActiveFlowMetricsConfig');
};

export const getFlowMetricConfig = async (metricKey: string) => {
  return withDbErrorHandling(async () => {
    logInfo('Fetching flow metric configuration', { metricKey });
    const result = await sql`
      SELECT 
        fmc.*,
        csm.start_stage_id,
        csm.end_stage_id,
        csm.avg_min_days,
        csm.avg_max_days,
        csm.metric_comment
      FROM flow_metrics_config fmc
      LEFT JOIN canonical_stage_mappings csm ON csm.metric_config_id = fmc.id
      WHERE fmc.metric_key = ${metricKey}
      LIMIT 1
    `;
    return result[0] || null;
  }, 'getFlowMetricConfig');
};

export const createFlowMetricConfig = async (data: {
  metric_key: string;
  display_title: string;
  canonical_stage: string;
  sort_order?: number;
  is_active?: boolean;
  start_stage_id?: number;
  end_stage_id?: number;
  avg_min_days?: number;
  avg_max_days?: number;
  metric_comment?: string;
}) => {
  return withDbErrorHandling(async () => {
    logInfo('Creating flow metric configuration', { metricKey: data.metric_key });
    
    // Insert the config first
    const configResult = await sql`
      INSERT INTO flow_metrics_config (
        metric_key, 
        display_title, 
        canonical_stage, 
        sort_order, 
        is_active
      ) VALUES (
        ${data.metric_key},
        ${data.display_title},
        ${data.canonical_stage},
        ${data.sort_order || 0},
        ${data.is_active !== false}
      )
      RETURNING *
    `;
    
    const config = configResult[0];
    
    // Insert mapping if stage IDs are provided
    if (data.start_stage_id && data.end_stage_id) {
      await sql`
        INSERT INTO canonical_stage_mappings (
          metric_config_id,
          canonical_stage,
          start_stage_id,
          end_stage_id,
          avg_min_days,
          avg_max_days,
          metric_comment
        ) VALUES (
          ${config.id},
          ${data.canonical_stage},
          ${data.start_stage_id},
          ${data.end_stage_id},
          ${data.avg_min_days || null},
          ${data.avg_max_days || null},
          ${data.metric_comment || null}
        )
      `;
    }
    
    // Return the config with mapping data
    const result = await sql`
      SELECT 
        fmc.*,
        csm.start_stage_id,
        csm.end_stage_id,
        csm.avg_min_days,
        csm.avg_max_days,
        csm.metric_comment
      FROM flow_metrics_config fmc
      LEFT JOIN canonical_stage_mappings csm ON csm.metric_config_id = fmc.id
      WHERE fmc.id = ${config.id}
    `;
    
    return result[0];
  }, 'createFlowMetricConfig');
};

export const updateFlowMetricConfig = async (
  id: string, 
  data: {
    display_title?: string;
    canonical_stage?: string;
    sort_order?: number;
    is_active?: boolean;
    start_stage_id?: number;
    end_stage_id?: number;
    avg_min_days?: number;
    avg_max_days?: number;
    metric_comment?: string;
  }
) => {
  return withDbErrorHandling(async () => {
    logInfo('Updating flow metric configuration', { id });
    
    // Update the config
    if (data.display_title || data.canonical_stage !== undefined || data.sort_order !== undefined || data.is_active !== undefined) {
      await sql`
        UPDATE flow_metrics_config 
        SET 
          display_title = COALESCE(${data.display_title}, display_title),
          canonical_stage = COALESCE(${data.canonical_stage}, canonical_stage),
          sort_order = COALESCE(${data.sort_order}, sort_order),
          is_active = COALESCE(${data.is_active}, is_active)
        WHERE id = ${id}
      `;
    }
    
    // Update or create the mapping if provided
    if (data.start_stage_id !== undefined || data.end_stage_id !== undefined || 
        data.avg_min_days !== undefined || data.avg_max_days !== undefined || 
        data.metric_comment !== undefined) {
      // Check if mapping exists
      const existingMapping = await sql`
        SELECT id FROM canonical_stage_mappings WHERE metric_config_id = ${id}
      `;
      
      if (existingMapping.length > 0) {
        // Update existing mapping
        await sql`
          UPDATE canonical_stage_mappings 
          SET 
            start_stage_id = COALESCE(${data.start_stage_id}, start_stage_id),
            end_stage_id = COALESCE(${data.end_stage_id}, end_stage_id),
            avg_min_days = COALESCE(${data.avg_min_days}, avg_min_days),
            avg_max_days = COALESCE(${data.avg_max_days}, avg_max_days),
            metric_comment = COALESCE(${data.metric_comment}, metric_comment)
          WHERE metric_config_id = ${id}
        `;
      } else {
        // Create new mapping
        await sql`
          INSERT INTO canonical_stage_mappings (
            metric_config_id,
            canonical_stage,
            start_stage_id,
            end_stage_id,
            avg_min_days,
            avg_max_days,
            metric_comment
          ) VALUES (
            ${id},
            (SELECT canonical_stage FROM flow_metrics_config WHERE id = ${id}),
            ${data.start_stage_id || null},
            ${data.end_stage_id || null},
            ${data.avg_min_days || null},
            ${data.avg_max_days || null},
            ${data.metric_comment || null}
          )
        `;
      }
    }
    
    // Return the updated record
    const result = await sql`
      SELECT 
        fmc.*,
        csm.start_stage_id,
        csm.end_stage_id,
        csm.avg_min_days,
        csm.avg_max_days,
        csm.metric_comment
      FROM flow_metrics_config fmc
      LEFT JOIN canonical_stage_mappings csm ON csm.metric_config_id = fmc.id
      WHERE fmc.id = ${id}
      LIMIT 1
    `;
    
    return result[0];
  }, 'updateFlowMetricConfig');
};

export const deleteFlowMetricConfig = async (id: string) => {
  return withDbErrorHandling(async () => {
    logInfo('Deleting flow metric configuration', { id });
    
    // Delete the mapping first (due to foreign key constraint)
    await sql`DELETE FROM canonical_stage_mappings WHERE metric_config_id = ${id}`;
    
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

export const updateFlowMetricComment = async (id: string, comment: string) => {
  return withDbErrorHandling(async () => {
    logInfo('Updating flow metric comment', { id, commentLength: comment.length });
    
    // Check if mapping exists
    const existingMapping = await sql`
      SELECT id FROM canonical_stage_mappings WHERE metric_config_id = ${id}
    `;
    
    if (existingMapping.length > 0) {
      // Update existing mapping
      await sql`
        UPDATE canonical_stage_mappings 
        SET metric_comment = ${comment}
        WHERE metric_config_id = ${id}
      `;
    } else {
      // Create new mapping with just the comment
      await sql`
        INSERT INTO canonical_stage_mappings (
          metric_config_id,
          canonical_stage,
          metric_comment
        ) VALUES (
          ${id},
          (SELECT canonical_stage FROM flow_metrics_config WHERE id = ${id}),
          ${comment}
        )
      `;
    }
    
    // Return the updated record
    const result = await sql`
      SELECT 
        fmc.*,
        csm.start_stage_id,
        csm.end_stage_id,
        csm.avg_min_days,
        csm.avg_max_days,
        csm.metric_comment
      FROM flow_metrics_config fmc
      LEFT JOIN canonical_stage_mappings csm ON csm.metric_config_id = fmc.id
      WHERE fmc.id = ${id}
      LIMIT 1
    `;
    
    return result[0];
  }, 'updateFlowMetricComment');
};
