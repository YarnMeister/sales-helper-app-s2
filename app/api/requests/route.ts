import { NextRequest } from 'next/server';
import { generateRequestId, withTiming } from '@/lib/db-utils';
import { 
  createRequest, 
  updateRequest, 
  getRequestById, 
  getRequests, 
  deleteRequest 
} from '@/lib/db';
import { RequestUpsert } from '@/lib/schema';
import { errorToResponse, ValidationError, NotFoundError } from '@/lib/errors';
import { logInfo, logError, generateCorrelationId } from '@/lib/log';
import { RequestStatus, SalespersonSelection } from '@/lib/types/database';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

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
        salesperson: (salesperson as SalespersonSelection | 'all') || undefined,
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
      userAgent: request.headers.get('user-agent'),
      body: body  // Log the full request body
    });
    
        return await withTiming('POST /api/requests', async () => {
          // PRD: Support inline updates for contact, line_items, comment
    if (parsed.id) {
      // Update existing request using single updateRequest function
      const updates: any = {};
      
      // Only include fields that were explicitly sent in the request body
      // (not fields added by Zod defaults)
      if (body.contact !== undefined) {
        updates.contact = parsed.contact;
      }
      
      if (body.line_items !== undefined) {
        updates.line_items = parsed.line_items;
      }
      
      if (body.comment !== undefined) {
        updates.comment = parsed.comment;
        console.log('🔍 API: Will update comment:', parsed.comment);
      }
      
      if (body.salespersonFirstName !== undefined) {
        updates.salesperson_first_name = parsed.salespersonFirstName;
      }
      
      if (body.salespersonSelection !== undefined) {
        updates.salesperson_selection = parsed.salespersonSelection;
      }
        
        console.log('🔍 API: Final updates object:', updates);
        const result = await updateRequest(parsed.id, updates);
        console.log('🔍 API: updateRequest returned:', result);
        
        logInfo('Request updated successfully', { 
          correlationId,
          request_id: result.request_id, 
          inline_update: true 
        });
        
        return Response.json({ ok: true, data: result });
        
      } else {
        // Create new request
        // Use client-provided request_id if available, otherwise fall back to database generation
        let requestId = parsed.request_id;
        if (!requestId) {
          requestId = await generateRequestId();
          logInfo('Using database-generated request ID', { correlationId, request_id: requestId });
        } else {
          logInfo('Using client-provided request ID', { correlationId, request_id: requestId });
        }
        
        const result = await createRequest({
          request_id: requestId,
          salesperson_first_name: parsed.salespersonFirstName,
          salesperson_selection: parsed.salespersonSelection,
          mine_group: parsed.mineGroup,
          mine_name: parsed.mineName,
          contact: parsed.contact,
          line_items: parsed.line_items,
          comment: parsed.comment
        });
        
        logInfo('Request created successfully', { 
          correlationId,
          request_id: result.request_id, 
          inline_update: false,
          idSource: parsed.request_id ? 'client' : 'database'
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
