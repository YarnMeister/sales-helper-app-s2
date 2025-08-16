import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { createDeal, addProductsToDeal } from '@/lib/pipedrive';
import { errorToResponse, ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

const SubmitRequest = z.object({
  id: z.string().uuid().optional(),
  requestId: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, requestId } = SubmitRequest.parse(body);
    
    if (!id && !requestId) {
      throw new ValidationError('Must provide either id or requestId');
    }
    
    const db = getDb();
    let query = db.from('requests').select('*');
    
    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('request_id', requestId);
    }
    
    const { data: request, error } = await query.single();
    
    if (error || !request) {
      throw new NotFoundError('Request not found');
    }
    
    // Validate request has contact and line items
    if (!request.contact) {
      throw new ValidationError('Request must have a contact before submission');
    }
    
    if (!request.line_items || request.line_items.length === 0) {
      throw new ValidationError('Request must have at least one line item before submission');
    }
    
    const submitMode = process.env.PIPEDRIVE_SUBMIT_MODE || 'real';
    
    if (submitMode === 'mock') {
      // Mock submission
      const mockDealId = Math.floor(100000 + Math.random() * 900000);
      
      const { error: mockError } = await db
        .from('mock_pipedrive_submissions')
        .insert({
          request_id: request.request_id,
          payload: {
            contact: request.contact,
            line_items: request.line_items,
            comment: request.comment
          },
          simulated_deal_id: mockDealId
        });
      
      if (mockError) {
        throw mockError;
      }
      
      // Update request status
      await db
        .from('requests')
        .update({ 
          status: 'submitted',
          pipedrive_deal_id: mockDealId 
        })
        .eq('id', request.id);
      
      return Response.json({ 
        ok: true, 
        dealId: mockDealId, 
        dealUrl: `#mock-deal-${mockDealId}`,
        mode: 'mock' 
      });
      
    } else {
      // Real Pipedrive submission
      const dealTitle = `[${request.request_id}] - [${request.contact.mineGroup || 'Unknown'}] - [${request.contact.mineName || 'Unknown'}]`;
      
      const dealData = {
        title: dealTitle,
        pipeline_id: 9, // Your pipeline ID
        stage_id: 57,   // Your stage ID
        person_id: request.contact.personId,
        org_id: request.contact.orgId,
        user_id: 123456 // Your user ID
      };
      
      const deal = await createDeal(dealData);
      
      // Add line items to deal
      const products = request.line_items.map(item => ({
        product_id: item.pipedriveProductId,
        quantity: item.quantity,
        item_price: item.price || 0
      }));
      
      await addProductsToDeal(deal.id, products);
      
      // Update request status
      await db
        .from('requests')
        .update({ 
          status: 'submitted',
          pipedrive_deal_id: deal.id 
        })
        .eq('id', request.id);
      
      return Response.json({ 
        ok: true, 
        dealId: deal.id, 
        dealUrl: `https://yourcompany.pipedrive.com/deal/${deal.id}`,
        mode: 'real' 
      });
    }
    
  } catch (e) {
    if (e instanceof z.ZodError) {
      return errorToResponse(new ValidationError('Invalid submission data'));
    }
    return errorToResponse(e);
  }
}
