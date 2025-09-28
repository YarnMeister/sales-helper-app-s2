import { sql } from '@/lib/db';
import { RequestStatus, SalespersonSelection } from '@/types/shared/database';

// Define Request interface locally to avoid import issues
interface Request {
  id: string;
  requestId: string;
  status: RequestStatus;
  salespersonFirstName?: string;
  salespersonSelection?: SalespersonSelection;
  mineGroup?: string;
  mineName?: string;
  contact: any;
  lineItems: any[];
  comment?: string;
  pipedriveDealId?: number;
  createdAt: string;
  updatedAt: string;
}

// DEPRECATED: This function has been replaced by getRequests in lib/db.ts
// The simplified version in lib/db.ts handles the core filtering needs
// This function is kept for backward compatibility but will be removed in a future update.
export const getRequests = async (params: {
  status?: RequestStatus;
  mineGroup?: string;
  mineName?: string;
  personId?: string;
  salesperson?: SalespersonSelection | 'all';
  showAll?: boolean;
  limit?: number;
}) => {
  // For now, delegate to the new implementation in lib/db.ts
  // This maintains backward compatibility while we transition
  const { getRequests: newGetRequests } = await import('@/lib/db');
  return newGetRequests({
    status: params.status,
    salesperson: params.salesperson,
    limit: params.limit
  });
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

// DEPRECATED: These functions have been replaced by the single updateRequest function in lib/db.ts
// The individual update functions are no longer needed and will be removed in a future update.

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
  const result = await sql`DELETE FROM requests WHERE id = ${id} RETURNING id`;
  return result[0];
};
