import { NextRequest } from 'next/server';
import { withTiming } from '@/lib/db-utils';
import { getMockSubmissions } from '@/lib/queries/mock-submissions';
import { errorToResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    return await withTiming('GET /api/mock-submissions', async () => {
      const result = await getMockSubmissions(10);
      
      return Response.json({ 
        ok: true, 
        data: result,
        count: result.length
      });
    });
    
  } catch (e) {
    return errorToResponse(e);
  }
}
