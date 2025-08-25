import { neon } from '@neondatabase/serverless';
import { logInfo, logError } from './log';
import { AppError } from './errors';
import { getRequestsTableName } from './db-utils';

// Get Neon connection
const sql = neon(process.env.DATABASE_URL!);

// Simple query wrapper with error handling
export const withDbErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> => {
  try {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    
    logInfo(`Database operation completed: ${context}`, { 
      duration,
      context 
    });
    
    return result;
  } catch (error) {
    logError(`Database error in ${context}`, { 
      error: error instanceof Error ? error.message : String(error),
      context 
    });
    
    throw new AppError(`Database operation failed: ${context} - ${error instanceof Error ? error.message : String(error)}`, { 
      originalError: error,
      context 
    });
  }
};

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
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      const result = await sql`
        INSERT INTO mock_requests (
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
    } else {
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
    }
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
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Get current request to merge updates
    const current = isDevelopment 
      ? await sql`SELECT * FROM mock_requests WHERE id = ${id}`
      : await sql`SELECT * FROM requests WHERE id = ${id}`;
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
    
    const result = isDevelopment 
      ? await sql`
        UPDATE mock_requests 
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
      `
      : await sql`
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
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const result = isDevelopment
      ? await sql`SELECT * FROM mock_requests WHERE id = ${id}`
      : await sql`SELECT * FROM requests WHERE id = ${id}`;
    
    return result[0] || null;
  }, 'getRequestById');
};

export const getRequests = async (filters: {
  status?: string;
  salesperson?: string;
  limit?: number;
}) => {
  return withDbErrorHandling(async () => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const tableName = isDevelopment ? 'mock_requests' : 'requests';
    
    // Simple implementation - can be enhanced later
    if (filters.status && filters.salesperson && filters.salesperson !== 'all') {
      return isDevelopment
        ? await sql`
          SELECT * FROM mock_requests 
          WHERE status = ${filters.status} 
          AND salesperson_first_name = ${filters.salesperson}
          ORDER BY created_at DESC 
          LIMIT ${filters.limit || 50}
        `
        : await sql`
          SELECT * FROM requests 
          WHERE status = ${filters.status} 
          AND salesperson_first_name = ${filters.salesperson}
          ORDER BY created_at DESC 
          LIMIT ${filters.limit || 50}
        `;
    } else if (filters.status) {
      return isDevelopment
        ? await sql`
          SELECT * FROM mock_requests 
          WHERE status = ${filters.status}
          ORDER BY created_at DESC 
          LIMIT ${filters.limit || 50}
        `
        : await sql`
          SELECT * FROM requests 
          WHERE status = ${filters.status}
          ORDER BY created_at DESC 
          LIMIT ${filters.limit || 50}
        `;
    } else if (filters.salesperson && filters.salesperson !== 'all') {
      return isDevelopment
        ? await sql`
          SELECT * FROM mock_requests 
          WHERE salesperson_first_name = ${filters.salesperson}
          ORDER BY created_at DESC 
          LIMIT ${filters.limit || 50}
        `
        : await sql`
          SELECT * FROM requests 
          WHERE salesperson_first_name = ${filters.salesperson}
          ORDER BY created_at DESC 
          LIMIT ${filters.limit || 50}
        `;
    } else {
      return isDevelopment
        ? await sql`
          SELECT * FROM mock_requests 
          ORDER BY created_at DESC 
          LIMIT ${filters.limit || 50}
        `
        : await sql`
          SELECT * FROM requests 
          ORDER BY created_at DESC 
          LIMIT ${filters.limit || 50}
        `;
    }
  }, 'getRequests');
};

export const deleteRequest = async (id: string) => {
  return withDbErrorHandling(async () => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const result = isDevelopment
      ? await sql`DELETE FROM mock_requests WHERE id = ${id} RETURNING *`
      : await sql`DELETE FROM requests WHERE id = ${id} RETURNING *`;
    
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
    
    let query = sql`SELECT * FROM pipedrive_deal_flow_data`;
    
    if (dealId) {
      query = sql`SELECT * FROM pipedrive_deal_flow_data WHERE deal_id = ${dealId}`;
    }
    
    const result = await sql`${query} ORDER BY entered_at DESC`;
    return result;
  }, 'getDealFlowData');
};

// Canonical Stage Mappings Functions
export const getCanonicalStageMappings = async () => {
  return withDbErrorHandling(async () => {
    logInfo('Fetching canonical stage mappings');
    const result = await sql`SELECT * FROM canonical_stage_mappings ORDER BY canonical_stage`;
    return result;
  }, 'getCanonicalStageMappings');
};

export const getCanonicalStageMapping = async (canonicalStage: string) => {
  return withDbErrorHandling(async () => {
    logInfo('Fetching canonical stage mapping', { canonicalStage });
    const result = await sql`
      SELECT * FROM canonical_stage_mappings 
      WHERE canonical_stage = ${canonicalStage}
    `;
    return result[0] || null;
  }, 'getCanonicalStageMapping');
};

export const getDealsForCanonicalStage = async (canonicalStage: string) => {
  return withDbErrorHandling(async () => {
    logInfo('Fetching deals for canonical stage', { canonicalStage });
    
    // Get the mapping for this canonical stage
    const mapping = await getCanonicalStageMapping(canonicalStage);
    if (!mapping) {
      logInfo('No mapping found for canonical stage', { canonicalStage });
      return [];
    }
    
    // Get all deals that have both start and end stages
    const result = await sql`
      WITH deal_stages AS (
        SELECT 
          deal_id,
          stage_name,
          entered_at,
          ROW_NUMBER() OVER (PARTITION BY deal_id, stage_name ORDER BY entered_at) as rn
        FROM pipedrive_deal_flow_data
        WHERE stage_name IN (${mapping.start_stage}, ${mapping.end_stage})
      ),
      start_stages AS (
        SELECT deal_id, entered_at as start_date
        FROM deal_stages 
        WHERE stage_name = ${mapping.start_stage} AND rn = 1
      ),
      end_stages AS (
        SELECT deal_id, entered_at as end_date
        FROM deal_stages 
        WHERE stage_name = ${mapping.end_stage} AND rn = 1
      )
      SELECT 
        s.deal_id,
        s.start_date,
        e.end_date,
        EXTRACT(EPOCH FROM (e.end_date - s.start_date))::BIGINT as duration_seconds
      FROM start_stages s
      JOIN end_stages e ON s.deal_id = e.deal_id
      WHERE e.end_date > s.start_date
      ORDER BY s.start_date DESC
    `;
    
    return result;
  }, 'getDealsForCanonicalStage');
};
