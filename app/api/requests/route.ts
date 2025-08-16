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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const mineGroup = searchParams.get('mineGroup');
    const mineName = searchParams.get('mineName');
    const personId = searchParams.get('personId');
    const salesperson = searchParams.get('salesperson'); // PRD: Luyanda, James, Stefan
    const showAll = searchParams.get('showAll') === 'true'; // PRD: Toggle for showing all requests
    const limit = parseInt(searchParams.get('limit') || '50');
    
    return await withTiming('GET /api/requests', async () => {
      const result = await getRequests({
        status,
        mineGroup,
        mineName,
        personId,
        salesperson,
        showAll,
        limit
      });
      
      console.log('Requests fetched successfully', { 
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
    return errorToResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestUpsert.parse(body);
    
    return await withTiming('POST /api/requests', async () => {
      // PRD: Support inline updates for contact, line_items, comment
      if (parsed.id) {
        // Update existing request
        const updates: any = {
          updated_at: new Date().toISOString()
        };
        
        if (parsed.contact !== undefined) {
          updates.contact = parsed.contact;
        }
        if (parsed.line_items !== undefined) {
          updates.line_items = parsed.line_items;
        }
        if (parsed.comment !== undefined) {
          updates.comment = parsed.comment;
        }
        
        // Update fields individually to avoid dynamic query issues
        let result;
        
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
        
        console.log('Request updated successfully', { 
          request_id: result.request_id, 
          inline_update: true 
        });
        
        return Response.json({ ok: true, data: result });
        
      } else {
        // Create new request
        const requestId = await generateRequestId();
        
        const result = await createRequest({
          requestId,
          salespersonSelection: parsed.salespersonSelection,
          mineGroup: parsed.mineGroup,
          mineName: parsed.mineName,
          contact: parsed.contact,
          lineItems: parsed.line_items,
          comment: parsed.comment
        });
        
        console.log('Request created successfully', { 
          request_id: result.request_id, 
          inline_update: false 
        });
        
        return Response.json({ ok: true, data: result });
      }
    });
    
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      throw new ValidationError('Missing request ID');
    }
    
    return await withTiming('DELETE /api/requests', async () => {
      const result = await deleteRequest(id);
      
      if (!result) {
        throw new NotFoundError('Request not found');
      }
      
      console.log('Request deleted successfully', { id });
      return Response.json({ ok: true });
    });
    
  } catch (e) {
    return errorToResponse(e);
  }
}
