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
        // Update existing request
        let result;
        
        // Update fields individually to avoid dynamic query issues
        if (parsed.contact !== undefined) {
          result = await updateRequestContact(parsed.id, parsed.contact);
        }
        
        if (parsed.line_items !== undefined) {
          result = await updateRequestLineItems(parsed.id, parsed.line_items);
        }
        
        if (parsed.comment !== undefined) {
          result = await updateRequestComment(parsed.id, parsed.comment);
        }
        
        if (!result) {
          throw new NotFoundError('Request not found');
        }
        
        logInfo('Request updated successfully', { 
          correlationId,
          request_id: result.request_id, 
          inline_update: true 
        });
        
        return Response.json({ ok: true, data: result });
        
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
