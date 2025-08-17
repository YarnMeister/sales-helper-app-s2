import { NextRequest } from 'next/server';
import { withTiming } from '@/lib/db-utils';
import { getRequestById, getRequestByRequestId, updateRequestSubmission } from '@/lib/queries/requests';
import { createMockSubmission } from '@/lib/queries/mock-submissions';
import { createDeal, addProductsToDeal, addNoteToDeal } from '@/lib/pipedrive';
import { errorToResponse, ValidationError, NotFoundError } from '@/lib/errors';
import { logInfo, logError, generateCorrelationId } from '@/lib/log';
import { z } from 'zod';

const SubmitRequest = z.object({
  id: z.string().uuid().optional(),
  requestId: z.string().optional()
});

export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  
  try {
    const body = await req.json();
    const { id, requestId } = SubmitRequest.parse(body);
    
    if (!id && !requestId) {
      throw new ValidationError('Must provide either id or requestId');
    }
    
    logInfo('Submit API request started', { 
      correlationId,
      id,
      requestId,
      userAgent: req.headers.get('user-agent')
    });
    
    return await withTiming('POST /api/submit', async () => {
      // Find the request
      let requestData;
      
      if (id) {
        requestData = await getRequestById(id);
      } else {
        requestData = await getRequestByRequestId(requestId!);
      }
      
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
        
        logInfo('Processing mock submission', { 
          correlationId,
          requestId: requestData.request_id,
          mockDealId 
        });
        
        // Insert mock submission record
        await createMockSubmission({
          requestId: requestData.request_id,
          payload: {
            contact: requestData.contact,
            line_items: requestData.line_items,
            comment: requestData.comment
          },
          simulatedDealId: mockDealId
        });
        
        // Update request status
        await updateRequestSubmission(requestData.id, mockDealId);
        
        logInfo('Mock submission successful', { 
          correlationId,
          request_id: requestData.request_id, 
          mock_deal_id: mockDealId 
        });
        
        return Response.json({ 
          ok: true, 
          dealId: mockDealId, 
          dealUrl: `#mock-deal-${mockDealId}`,
          mode: 'mock' 
        });
        
      } else {
        // Real Pipedrive submission
        logInfo('Processing real Pipedrive submission', { 
          correlationId,
          requestId: requestData.request_id
        });
        
        // Build deal title with all line items (improved format)
        const lineItemsSummary = requestData.line_items.map((item: any) => {
          const shortDesc = item.shortDescription || item.name;
          return `[${shortDesc} x ${item.quantity}]`;
        }).join(' ');
        
        const dealTitle = `[${requestData.request_id}][${requestData.contact.mineGroup || 'Unknown'}] [${requestData.contact.mineName || 'Unknown'}] ${lineItemsSummary}`;
        
        const dealData = {
          title: dealTitle,
          pipeline_id: 9, // Your pipeline ID
          stage_id: 57,   // Your stage ID
          person_id: requestData.contact.personId,
          org_id: requestData.contact.orgId || null,
          user_id: 22265724, // Ruan's actual user ID from Pipedrive
          // Custom fields for tracking (matching legacy specs)
          '4ad64c7e225ef479139742cdb9bf93f956298f69': requestData.request_id, // Request ID
          '1fe134689b48d31c77a75af4a44d8a613da61df3': '47', // Salesperson (James)
          'a6321f3f56ba1e30978e1176bef2ca18dab2066b': '38'  // Assigned Person (Ruan)
        };
        
        const deal = await createDeal(dealData);
        
        // Add line items to deal
        const products = requestData.line_items.map((item: any) => ({
          product_id: item.pipedriveProductId,
          quantity: item.quantity,
          item_price: item.price || 0
        }));
        
        await addProductsToDeal(deal.id, products);
        
        // Add comment as note to deal if comment exists
        if (requestData.comment && requestData.comment.trim()) {
          try {
            await addNoteToDeal({
              content: requestData.comment,
              deal_id: deal.id,
              user_id: 22265724 // Ruan's user ID
            });
            
            logInfo('Comment added as note to deal', { 
              correlationId,
              request_id: requestData.request_id, 
              deal_id: deal.id,
              comment_length: requestData.comment.length
            });
          } catch (noteError) {
            // Log error but don't fail the submission
            logError('Failed to add comment as note to deal', { 
              correlationId,
              request_id: requestData.request_id, 
              deal_id: deal.id,
              error: noteError instanceof Error ? noteError.message : String(noteError)
            });
          }
        }
        
        // Update request status
        await updateRequestSubmission(requestData.id, deal.id);
        
        logInfo('Real submission successful', { 
          correlationId,
          request_id: requestData.request_id, 
          deal_id: deal.id 
        });
        
        return Response.json({ 
          ok: true, 
          dealId: deal.id, 
          dealUrl: `https://rtse.pipedrive.com/deal/${deal.id}`,
          mode: 'real' 
        });
      }
    });
    
  } catch (e) {
    logError('Submission failed', { 
      correlationId,
      error: e instanceof Error ? e.message : String(e)
    });
    
    if (e instanceof z.ZodError) {
      return errorToResponse(new ValidationError('Invalid submission data'));
    }
    return errorToResponse(e);
  }
}
