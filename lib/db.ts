import { neon } from '@neondatabase/serverless';
import { logInfo, logError } from './log';
import { AppError } from './errors';

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
    const result = await sql`
      SELECT * FROM requests WHERE id = ${id}
    `;
    
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
    const result = await sql`
      DELETE FROM requests WHERE id = ${id} RETURNING *
    `;
    
    return result[0] || null;
  }, 'deleteRequest');
};

// Export the sql instance for backward compatibility
export { sql };
