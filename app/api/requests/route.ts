import { NextRequest } from 'next/server';
import { generateRequestId, withTiming } from '@/lib/db-utils';
import { 
  getRequests, 
  getRequestById, 
  createRequest, 
  updateRequestContact, 
  updateRequestLineItems, 
  updateRequestComment,
  deleteRequest 
} from '@/lib/queries/requests';
import { RequestUpsert } from '@/lib/schema';
import { errorToResponse, ValidationError, NotFoundError } from '@/lib/errors';
import { logInfo, logError, generateCorrelationId } from '@/lib/log';
import { RequestStatus, SalespersonSelection } from '@/lib/types/database';

export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const mineGroup = searchParams.get('mineGroup');
  const mineName = searchParams.get('mineName');
  const personId = searchParams.get('personId');
  const salesperson = searchParams.get('salesperson'); // PRD: Luyanda, James, Stefan
  const showAll = searchParams.get('showAll') === 'true'; // PRD: Toggle for showing all requests
  const limit = parseInt(searchParams.get('limit') || '50');
  
  try {
    logInfo('Requests API GET request started', { 
      correlationId,
      filters: { status, mineGroup, mineName, personId, salesperson, showAll, limit },
      userAgent: request.headers.get('user-agent')
    });
    
    return await withTiming('GET /api/requests', async () => {
      const result = await getRequests({
        status: (status as RequestStatus) || undefined,
        mineGroup: mineGroup || undefined,
        mineName: mineName || undefined,
        personId: personId || undefined,
        salesperson: (salesperson as SalespersonSelection | 'all') || undefined,
        showAll,
        limit
      });
      
      logInfo('Requests fetched successfully', { 
        correlationId,
        count: result.length, 
        filters: { status, mineGroup, mineName, personId, salesperson, showAll } 
      });
      
      // PRD requirement: Control "New Request" button visibility
      const showNewButton = !showAll;
      
      return Response.json({ 
        ok: true, 
        data: result,
        showNewButton,
        filters: { salesperson, showAll }
      });
    });
    
  } catch (e) {
    logError('Error fetching requests', { 
      correlationId,
      error: e instanceof Error ? e.message : String(e),
      filters: { status, mineGroup, mineName, personId, salesperson, showAll } 
    });
    return errorToResponse(e);
  }
}

export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();
  let body: any;
  
  try {
    body = await request.json();
    const parsed = RequestUpsert.parse(body);
    
    logInfo('Requests API POST request started', { 
      correlationId,
      operation: parsed.id ? 'update' : 'create',
      requestId: parsed.id,
      userAgent: request.headers.get('user-agent')
    });
    
        return await withTiming('POST /api/requests', async () => {
      // PRD: Support inline updates for contact, line_items, comment
      if (parsed.id) {
        // Update existing request - SINGLE UPDATE OPERATION
        const { sql } = await import('@/lib/db');
        
        // Build the SET clause dynamically based on what was sent
        let setClause = 'updated_at = $1';
        const values: any[] = [new Date().toISOString()];
        let paramIndex = 2;
        
        if (parsed.contact !== undefined) {
          setClause += `, contact = $${paramIndex}`;
          values.push(JSON.stringify(parsed.contact));
          paramIndex++;
        }
        if (parsed.line_items !== undefined) {
          setClause += `, line_items = $${paramIndex}`;
          values.push(JSON.stringify(parsed.line_items));
          paramIndex++;
        }
        if (parsed.comment !== undefined) {
          setClause += `, comment = $${paramIndex}`;
          values.push(parsed.comment);
          paramIndex++;
        }
        if (parsed.salespersonFirstName !== undefined) {
          setClause += `, salesperson_first_name = $${paramIndex}`;
          values.push(parsed.salespersonFirstName);
          paramIndex++;
        }
        if (parsed.salespersonSelection !== undefined) {
          setClause += `, salesperson_selection = $${paramIndex}`;
          values.push(parsed.salespersonSelection);
          paramIndex++;
        }
        
        // Add the ID as the last parameter
        values.push(parsed.id);
        
        const query = `UPDATE requests SET ${setClause} WHERE id = $${paramIndex} RETURNING *`;
        const result = await sql.unsafe(query, ...values);
        
        if (!result || result.length === 0) {
          throw new NotFoundError('Request not found');
        }
        
        logInfo('Request updated successfully', { 
          correlationId,
          request_id: result[0].request_id, 
          updated_fields: Object.keys(parsed).filter(key => key !== 'id') 
        });
        
        return Response.json({ ok: true, data: result[0] });
        
      } else {
        // Create new request
        const requestId = await generateRequestId();
        
        const result = await createRequest({
          requestId,
          salespersonSelection: parsed.salespersonSelection || (parsed.salespersonFirstName as any),
          mineGroup: parsed.mineGroup,
          mineName: parsed.mineName,
          contact: parsed.contact,
          lineItems: parsed.line_items,
          comment: parsed.comment
        });
        
        logInfo('Request created successfully', { 
          correlationId,
          request_id: result.request_id, 
          inline_update: false 
        });
        
        return Response.json({ ok: true, data: result });
      }
    });
    
  } catch (e) {
    logError('Error saving request', { 
      correlationId,
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
      data: body 
    });
    return errorToResponse(e);
  }
}

export async function DELETE(request: NextRequest) {
  const correlationId = generateCorrelationId();
  
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    throw new ValidationError('Missing request ID');
  }
  
  try {
    logInfo('Requests API DELETE request started', { 
      correlationId,
      requestId: id,
      userAgent: request.headers.get('user-agent')
    });
    
    return await withTiming('DELETE /api/requests', async () => {
      const result = await deleteRequest(id);
      
      if (!result) {
        throw new NotFoundError('Request not found');
      }
      
      logInfo('Request deleted successfully', { correlationId, id });
      return Response.json({ ok: true });
    });
    
  } catch (e) {
    logError('Error deleting request', { 
      correlationId,
      error: e instanceof Error ? e.message : String(e),
      requestId: id 
    });
    return errorToResponse(e);
  }
}
