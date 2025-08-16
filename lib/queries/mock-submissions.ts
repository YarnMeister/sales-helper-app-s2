import { sql } from '@/lib/db';

// Create mock submission record
export const createMockSubmission = async (data: {
  requestId: string;
  payload: any;
  simulatedDealId: number;
}) => {
  const result = await sql`
    INSERT INTO mock_pipedrive_submissions (
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
};

// Get mock submissions
export const getMockSubmissions = async (limit: number = 10) => {
  const result = await sql`
    SELECT * FROM mock_pipedrive_submissions 
    ORDER BY created_at DESC 
    LIMIT ${limit}
  `;
  
  return result;
};

// Get mock submission by request ID
export const getMockSubmissionByRequestId = async (requestId: string) => {
  const result = await sql`
    SELECT * FROM mock_pipedrive_submissions 
    WHERE request_id = ${requestId}
    ORDER BY created_at DESC 
    LIMIT 1
  `;
  
  return result[0] || null;
};

// Get mock submission by simulated deal ID
export const getMockSubmissionByDealId = async (dealId: number) => {
  const result = await sql`
    SELECT * FROM mock_pipedrive_submissions 
    WHERE simulated_deal_id = ${dealId}
  `;
  
  return result[0] || null;
};
