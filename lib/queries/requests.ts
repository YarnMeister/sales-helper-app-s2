import { sql } from '@/lib/db';
import { Request, RequestStatus, SalespersonSelection } from '@/lib/types/database';

// Get requests with filtering
export const getRequests = async (params: {
  status?: RequestStatus;
  mineGroup?: string;
  mineName?: string;
  personId?: string;
  salesperson?: SalespersonSelection | 'all';
  showAll?: boolean;
  limit?: number;
}) => {
  const { status, mineGroup, mineName, personId, salesperson, showAll = false, limit = 50 } = params;
  
  // Build conditions dynamically
  let conditions: any[] = [];
  
  // Filter by salesperson unless showAll is true
  if (!showAll && salesperson && salesperson !== 'all') {
    conditions.push(sql`salesperson_selection = ${salesperson}`);
  }
  
  if (status) {
    conditions.push(sql`status = ${status}`);
  }
  if (mineGroup) {
    conditions.push(sql`mine_group = ${mineGroup}`);
  }
  if (mineName) {
    conditions.push(sql`mine_name = ${mineName}`);
  }
  if (personId) {
    conditions.push(sql`contact->>'personId' = ${personId}`);
  }
  
  // Use a simple approach with individual queries
  if (conditions.length === 0) {
    return await sql`SELECT * FROM requests ORDER BY created_at DESC LIMIT ${limit}`;
  } else if (conditions.length === 1) {
    return await sql`SELECT * FROM requests WHERE ${conditions[0]} ORDER BY created_at DESC LIMIT ${limit}`;
  } else if (conditions.length === 2) {
    return await sql`SELECT * FROM requests WHERE ${conditions[0]} AND ${conditions[1]} ORDER BY created_at DESC LIMIT ${limit}`;
  } else if (conditions.length === 3) {
    return await sql`SELECT * FROM requests WHERE ${conditions[0]} AND ${conditions[1]} AND ${conditions[2]} ORDER BY created_at DESC LIMIT ${limit}`;
  } else if (conditions.length === 4) {
    return await sql`SELECT * FROM requests WHERE ${conditions[0]} AND ${conditions[1]} AND ${conditions[2]} AND ${conditions[3]} ORDER BY created_at DESC LIMIT ${limit}`;
  } else if (conditions.length === 5) {
    return await sql`SELECT * FROM requests WHERE ${conditions[0]} AND ${conditions[1]} AND ${conditions[2]} AND ${conditions[3]} AND ${conditions[4]} ORDER BY created_at DESC LIMIT ${limit}`;
  } else {
    // Fallback for more than 5 conditions
    return await sql`SELECT * FROM requests ORDER BY created_at DESC LIMIT ${limit}`;
  }
};

// Get request by ID
export const getRequestById = async (id: string) => {
  const result = await sql`SELECT * FROM requests WHERE id = ${id}`;
  return result[0] || null;
};

// Get request by request_id
export const getRequestByRequestId = async (requestId: string) => {
  const result = await sql`SELECT * FROM requests WHERE request_id = ${requestId}`;
  return result[0] || null;
};

// Create new request
export const createRequest = async (data: {
  requestId: string;
  salespersonSelection?: SalespersonSelection;
  mineGroup?: string;
  mineName?: string;
  contact?: any;
  lineItems?: any[];
  comment?: string;
}) => {
  const result = await sql`
    INSERT INTO requests (
      request_id,
      salesperson_selection,
      mine_group,
      mine_name,
      contact,
      line_items,
      comment,
      status
    ) VALUES (
      ${data.requestId},
      ${data.salespersonSelection},
      ${data.mineGroup},
      ${data.mineName},
      ${data.contact ? JSON.stringify(data.contact) : null},
      ${JSON.stringify(data.lineItems || [])},
      ${data.comment},
      ${'draft'}
    )
    RETURNING *
  `;
  
  return result[0];
};

// Update request contact
export const updateRequestContact = async (id: string, contact: any) => {
  const result = await sql`
    UPDATE requests 
    SET contact = ${JSON.stringify(contact)}, updated_at = ${new Date().toISOString()}
    WHERE id = ${id} 
    RETURNING *
  `;
  
  return result[0];
};

// Update request line items
export const updateRequestLineItems = async (id: string, lineItems: any[]) => {
  const result = await sql`
    UPDATE requests 
    SET line_items = ${JSON.stringify(lineItems)}, updated_at = ${new Date().toISOString()}
    WHERE id = ${id} 
    RETURNING *
  `;
  
  return result[0];
};

// Update request comment
export const updateRequestComment = async (id: string, comment: string) => {
  console.log('🔍 updateRequestComment called with:', { id, comment });
  
  // First, get the current state
  const current = await sql`SELECT * FROM requests WHERE id = ${id}`;
  console.log('🔍 Current state before update:', current[0]);
  
  const result = await sql`
    UPDATE requests 
    SET comment = ${comment}, updated_at = ${new Date().toISOString()}
    WHERE id = ${id} 
    RETURNING *
  `;
  
  console.log('🔍 Result after update:', result[0]);
  
  return result[0];
};

// Update request status and pipedrive deal ID
export const updateRequestSubmission = async (id: string, dealId: number) => {
  const result = await sql`
    UPDATE requests 
    SET status = ${'submitted'}, pipedrive_deal_id = ${dealId}, updated_at = ${new Date().toISOString()}
    WHERE id = ${id} 
    RETURNING *
  `;
  
  return result[0];
};

// Delete request
export const deleteRequest = async (id: string) => {
  const result = await sql`
    DELETE FROM requests WHERE id = ${id} RETURNING id
  `;
  
  return result[0];
};
