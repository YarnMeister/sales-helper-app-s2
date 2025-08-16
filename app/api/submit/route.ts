import { NextRequest } from 'next/server';
import { getDb, withDbErrorHandling } from '@/lib/db';
import { createDeal, addProductsToDeal } from '@/lib/pipedrive';
import { errorToResponse, ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

const SubmitRequest = z.object({
  id: z.string().uuid().optional(),
  requestId: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, requestId } = SubmitRequest.parse(body);
    
    if (!id && !requestId) {
      throw new ValidationError('Must provide either id or requestId');
    }
    
    return await withDbErrorHandling(async () => {
      const db = getDb();
      const client = await db.connect();
      
      try {
        // Find the request
        let sql = 'SELECT * FROM requests WHERE ';
        const params: any[] = [];
        
        if (id) {
          sql += 'id = $1';
          params.push(id);
        } else {
          sql += 'request_id = $1';
          params.push(requestId);
        }
        
        const result = await client.query(sql, params);
        const requestData = result.rows[0];
        
        if (!requestData) {
          throw new NotFoundError('Request not found');
        }
        
        // Validate request has contact and line items
        if (!requestData.contact) {
          throw new ValidationError('Request must have a contact before submission');
        }
        
        if (!requestData.line_items || requestData.line_items.length === 0) {
          throw new ValidationError('Request must have at least one line item before submission');
        }
        
        const submitMode = process.env.PIPEDRIVE_SUBMIT_MODE || 'real';
        
        if (submitMode === 'mock') {
          // Mock submission
          const mockDealId = Math.floor(100000 + Math.random() * 900000);
          
          // Insert mock submission record
          await client.query(
            'INSERT INTO mock_pipedrive_submissions (request_id, payload, simulated_deal_id) VALUES ($1, $2, $3)',
            [
              requestData.request_id,
              JSON.stringify({
                contact: requestData.contact,
                line_items: requestData.line_items,
                comment: requestData.comment
              }),
              mockDealId
            ]
          );
          
          // Update request status
          await client.query(
            'UPDATE requests SET status = $1, pipedrive_deal_id = $2 WHERE id = $3',
            ['submitted', mockDealId, requestData.id]
          );
          
          return Response.json({ 
            ok: true, 
            dealId: mockDealId, 
            dealUrl: `#mock-deal-${mockDealId}`,
            mode: 'mock' 
          });
          
        } else {
          // Real Pipedrive submission
          const dealTitle = `[${requestData.request_id}] - [${requestData.contact.mineGroup || 'Unknown'}] - [${requestData.contact.mineName || 'Unknown'}]`;
          
          const dealData = {
            title: dealTitle,
            pipeline_id: 9, // Your pipeline ID
            stage_id: 57,   // Your stage ID
            person_id: requestData.contact.personId,
            org_id: requestData.contact.orgId,
            user_id: 123456 // Your user ID
          };
          
          const deal = await createDeal(dealData);
          
          // Add line items to deal
          const products = requestData.line_items.map((item: any) => ({
            product_id: item.pipedriveProductId,
            quantity: item.quantity,
            item_price: item.price || 0
          }));
          
          await addProductsToDeal(deal.id, products);
          
          // Update request status
          await client.query(
            'UPDATE requests SET status = $1, pipedrive_deal_id = $2 WHERE id = $3',
            ['submitted', deal.id, requestData.id]
          );
          
          return Response.json({ 
            ok: true, 
            dealId: deal.id, 
            dealUrl: `https://yourcompany.pipedrive.com/deal/${deal.id}`,
            mode: 'real' 
          });
        }
        
      } finally {
        client.release();
      }
    }, 'POST /api/submit');
    
  } catch (e) {
    if (e instanceof z.ZodError) {
      return errorToResponse(new ValidationError('Invalid submission data'));
    }
    return errorToResponse(e);
  }
}
