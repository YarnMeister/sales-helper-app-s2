import { NextRequest } from 'next/server';
import { addLineItemAtomic } from '@/lib/database/adapters/legacy-adapter';
import { ensureDatabaseInitialized } from '@/lib/database/init';
import { errorToResponse, ValidationError } from '@/lib/errors';
import { logInfo, logError, generateCorrelationId } from '@/lib/log';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Ensure repository system is initialized
  ensureDatabaseInitialized();

  const correlationId = generateCorrelationId();
  let body: any;

  try {
    body = await request.json();

    const { requestId, lineItem } = body;

    if (!requestId) {
      throw new ValidationError('Request ID is required');
    }

    if (!lineItem) {
      throw new ValidationError('Line item data is required');
    }

    logInfo('Line item atomic add started', {
      correlationId,
      requestId,
      itemCode: lineItem.code,
      itemName: lineItem.name,
      userAgent: request.headers.get('user-agent')
    });

    const result = await addLineItemAtomic(requestId, lineItem);

    logInfo('Line item added successfully', {
      correlationId,
      requestId,
      newLineItemsCount: result.line_items?.length || 0
    });

    return Response.json({
      ok: true,
      data: result,
      message: 'Line item added successfully'
    });

  } catch (e) {
    logError('Error adding line item', {
      correlationId,
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
      data: body
    });
    return errorToResponse(e);
  }
}