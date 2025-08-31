import { sql } from '@/lib/db';

// Create mock submission record
export const createMockSubmission = async (data: {
  requestId: string;
  payload: any;
  simulatedDealId: number;
}) => {
  // Only create mock submissions in development/test environments
  // In production, this function should not be called
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  
  if (!isDevelopment && !isTest) {
    console.warn('createMockSubmission called in production environment - this should not happen');
    return null;
  }
  
  try {
    const result = await sql`
      INSERT INTO pipedrive_submissions (
        request_id, 
        payload, 
        simulated_deal_id
      ) VALUES (
        ${data.requestId},
        ${JSON.stringify(data.payload)},
        ${data.simulatedDealId}
      )
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error('Failed to create mock submission:', error instanceof Error ? error.message : String(error));
    return null;
  }
};

// Get mock submissions
export const getMockSubmissions = async (limit: number = 10) => {
  // Always use production table names since we have separate databases
  const result = await sql`
    SELECT * FROM pipedrive_submissions 
    ORDER BY created_at DESC 
    LIMIT ${limit}
  `;
  return result;
};

// Get mock submission by request ID
export const getMockSubmissionByRequestId = async (requestId: string) => {
  // Always use production table names since we have separate databases
  const result = await sql`
    SELECT * FROM pipedrive_submissions 
    WHERE request_id = ${requestId}
    ORDER BY created_at DESC 
    LIMIT 1
  `;
  return result[0] || null;
};

// Get mock submission by simulated deal ID
export const getMockSubmissionByDealId = async (dealId: number) => {
  // Always use production table names since we have separate databases
  const result = await sql`
    SELECT * FROM pipedrive_submissions 
    WHERE simulated_deal_id = ${dealId}
  `;
  return result[0] || null;
};
