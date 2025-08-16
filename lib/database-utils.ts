import { query } from './db';
import { 
  Request, 
  RequestInsert, 
  RequestUpdate, 
  ContactJSON, 
  LineItem,
  TABLES,
  validateRequest,
  validateContact,
  validateLineItem,
  isRequestSubmittable,
  getMissingRequirements
} from './types/database';

// Request operations
export const createRequest = async (data: RequestInsert): Promise<Request> => {
  const sql = `
    INSERT INTO requests (
      salesperson_first_name, 
      salesperson_selection,
      mine_group, 
      mine_name, 
      contact, 
      line_items, 
      comment,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const params = [
    data.salesperson_first_name,
    data.salesperson_selection,
    data.mine_group,
    data.mine_name,
    JSON.stringify(data.contact),
    JSON.stringify(data.line_items || []),
    data.comment,
    data.status || 'draft'
  ];

  const result = await query(sql, params);
  
  if (result.rows.length === 0) {
    throw new Error('Failed to create request');
  }
  
  const request = result.rows[0];
  if (!validateRequest(request)) throw new Error('Invalid request data returned');
  
  return request;
};

export const getRequest = async (id: string): Promise<Request | null> => {
  const result = await query(
    'SELECT * FROM requests WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return null; // Not found
  }
  
  const request = result.rows[0];
  if (!validateRequest(request)) throw new Error('Invalid request data returned');
  
  return request;
};

export const getRequestByRequestId = async (requestId: string): Promise<Request | null> => {
  const result = await query(
    'SELECT * FROM requests WHERE request_id = $1',
    [requestId]
  );

  if (result.rows.length === 0) {
    return null; // Not found
  }
  
  const request = result.rows[0];
  if (!validateRequest(request)) throw new Error('Invalid request data returned');
  
  return request;
};

export const updateRequest = async (id: string, data: RequestUpdate): Promise<Request> => {
  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (data.contact !== undefined) {
    updates.push(`contact = $${paramIndex}`);
    params.push(JSON.stringify(data.contact));
    paramIndex++;
  }
  
  if (data.line_items !== undefined) {
    updates.push(`line_items = $${paramIndex}`);
    params.push(JSON.stringify(data.line_items));
    paramIndex++;
  }
  
  if (data.comment !== undefined) {
    updates.push(`comment = $${paramIndex}`);
    params.push(data.comment);
    paramIndex++;
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  updates.push(`updated_at = now()`);
  
  const sql = `
    UPDATE requests 
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  params.push(id);

  const result = await query(sql, params);
  
  if (result.rows.length === 0) {
    throw new Error('Request not found');
  }

  const request = result.rows[0];
  if (!validateRequest(request)) throw new Error('Invalid request data returned');
  
  return request;
};

export const deleteRequest = async (id: string): Promise<void> => {
  const result = await query(
    'DELETE FROM requests WHERE id = $1',
    [id]
  );

  if (result.rowCount === 0) {
    throw new Error('Request not found');
  }
};

export const listRequests = async (options?: {
  status?: string;
  salesperson?: string;
  mineGroup?: string;
  limit?: number;
  offset?: number;
}): Promise<Request[]> => {
  let sql = `
    SELECT * FROM requests 
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIndex = 1;

  if (options?.status) {
    sql += ` AND status = $${paramIndex}`;
    params.push(options.status);
    paramIndex++;
  }
  
  if (options?.salesperson) {
    sql += ` AND salesperson_selection = $${paramIndex}`;
    params.push(options.salesperson);
    paramIndex++;
  }
  
  if (options?.mineGroup) {
    sql += ` AND contact_mine_group = $${paramIndex}`;
    params.push(options.mineGroup);
    paramIndex++;
  }
  
  sql += ` ORDER BY created_at DESC`;
  
  if (options?.limit) {
    sql += ` LIMIT $${paramIndex}`;
    params.push(options.limit);
    paramIndex++;
  }
  
  if (options?.offset) {
    sql += ` OFFSET $${paramIndex}`;
    params.push(options.offset);
  }

  const result = await query(sql, params);

  // Validate all requests
  const validRequests = result.rows.filter(validateRequest);
  if (validRequests.length !== result.rows.length) {
    console.warn('Some requests failed validation');
  }
  
  return validRequests;
};

// Contact operations
export const updateRequestContact = async (requestId: string, contact: ContactJSON): Promise<Request> => {
  if (!validateContact(contact)) {
    throw new Error('Invalid contact data');
  }

  return updateRequest(requestId, { contact });
};

// Line items operations
export const updateRequestLineItems = async (requestId: string, lineItems: LineItem[]): Promise<Request> => {
  if (!lineItems.every(validateLineItem)) {
    throw new Error('Invalid line items data');
  }

  return updateRequest(requestId, { line_items: lineItems });
};

export const addLineItemToRequest = async (requestId: string, lineItem: LineItem): Promise<Request> => {
  if (!validateLineItem(lineItem)) {
    throw new Error('Invalid line item data');
  }

  const request = await getRequest(requestId);
  if (!request) throw new Error('Request not found');

  const updatedLineItems = [...request.line_items, lineItem];
  return updateRequest(requestId, { line_items: updatedLineItems });
};

export const removeLineItemFromRequest = async (requestId: string, lineItemIndex: number): Promise<Request> => {
  const request = await getRequest(requestId);
  if (!request) throw new Error('Request not found');

  if (lineItemIndex < 0 || lineItemIndex >= request.line_items.length) {
    throw new Error('Invalid line item index');
  }

  const updatedLineItems = request.line_items.filter((_, index) => index !== lineItemIndex);
  return updateRequest(requestId, { line_items: updatedLineItems });
};

// KV Cache operations - Now using Redis instead of database
export const getCacheValue = async (key: string): Promise<any | null> => {
  const { cache } = await import('./cache');
  const result = await cache.get(key);
  return result?.data || null;
};

export const setCacheValue = async (key: string, value: any): Promise<void> => {
  const { cache } = await import('./cache');
  await cache.set(key, value);
};

export const deleteCacheValue = async (key: string): Promise<void> => {
  const { cache } = await import('./cache');
  await cache.bust(key);
};

// Mock submissions operations
export const createMockSubmission = async (data: {
  request_id: string;
  payload: any;
  simulated_deal_id: number;
  status?: string;
}): Promise<void> => {
  const sql = `
    INSERT INTO mock_pipedrive_submissions (
      request_id, payload, simulated_deal_id, status
    ) VALUES ($1, $2, $3, $4)
  `;
  
  const params = [
    data.request_id,
    JSON.stringify(data.payload),
    data.simulated_deal_id,
    data.status || 'Submitted'
  ];

  await query(sql, params);
};

export const getMockSubmissions = async (requestId?: string): Promise<any[]> => {
  let sql = `
    SELECT * FROM mock_pipedrive_submissions 
    ORDER BY created_at DESC
  `;
  const params: any[] = [];

  if (requestId) {
    sql = `
      SELECT * FROM mock_pipedrive_submissions 
      WHERE request_id = $1
      ORDER BY created_at DESC
    `;
    params.push(requestId);
  }

  const result = await query(sql, params);
  return result.rows || [];
};

// Validation helpers
export const validateRequestForSubmission = (request: Request): {
  isValid: boolean;
  missingRequirements: string[];
  message: string;
} => {
  const missingRequirements = getMissingRequirements(request);
  const isValid = isRequestSubmittable(request);

  let message = '';
  if (missingRequirements.length > 0) {
    if (missingRequirements.length === 1) {
      message = `Add ${missingRequirements[0]} to submit`;
    } else if (missingRequirements.length === 2) {
      message = `Add ${missingRequirements.join(' and ')} to submit`;
    } else {
      message = `Add ${missingRequirements.slice(0, -1).join(', ')}, and ${missingRequirements[missingRequirements.length - 1]} to submit`;
    }
  } else if (request.status !== 'draft') {
    message = `Cannot submit ${request.status} request`;
  }

  return {
    isValid,
    missingRequirements,
    message
  };
};
