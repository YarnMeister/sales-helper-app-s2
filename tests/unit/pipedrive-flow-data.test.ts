import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/pipedrive/deal-flow/route';
import { GET } from '../../app/api/pipedrive/deal-flow-data/route';
import { fetchDealFlow } from '../../lib/pipedrive';
import { insertDealFlowData, insertDealMetadata, getDealFlowData } from '../../lib/db';

// Mock the Pipedrive API
vi.mock('../../lib/pipedrive', () => ({
  fetchDealFlow: vi.fn()
}));

// Mock the database functions
vi.mock('../../lib/db', () => ({
  insertDealFlowData: vi.fn(),
  insertDealMetadata: vi.fn(),
  getDealFlowData: vi.fn(),
  logInfo: vi.fn(),
  logError: vi.fn()
}));

// Mock NextResponse
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: vi.fn((data, options) => ({ data, options }))
    }
  };
});

describe('Pipedrive Flow Data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/pipedrive/deal-flow', () => {
    it('should fetch and store deal flow data successfully', async () => {
      const dealId = 1467;
      const mockPipedriveResponse = {
        data: [
          {
            id: 12345,
            object: 'dealChange',
            data: {
              field_key: 'stage_id',
              item_id: dealId,
              new_value: 5,
              additional_data: {
                new_value_formatted: 'Quality Control'
              }
            },
            timestamp: '2025-08-11T12:28:28.000Z'
          },
          {
            id: 12344,
            object: 'dealChange',
            data: {
              field_key: 'stage_id',
              item_id: dealId,
              new_value: 3,
              additional_data: {
                new_value_formatted: 'Order Received - Johan'
              }
            },
            timestamp: '2025-08-07T11:16:49.000Z'
          }
        ]
      };

      const mockProcessedData = [
        {
          pipedrive_event_id: 12345,
          deal_id: dealId,
          pipeline_id: 1,
          stage_id: 5,
          stage_name: 'Quality Control',
          entered_at: '2025-08-11T12:28:28.000Z'
        },
        {
          pipedrive_event_id: 12344,
          deal_id: dealId,
          pipeline_id: 1,
          stage_id: 3,
          stage_name: 'Order Received - Johan',
          entered_at: '2025-08-07T11:16:49.000Z'
        }
      ];

      const mockStoredData = [
        {
          id: '1',
          pipedrive_event_id: 12345,
          deal_id: dealId,
          pipeline_id: 1,
          stage_id: 5,
          stage_name: 'Quality Control',
          entered_at: '2025-08-11T12:28:28.000Z',
          left_at: null,
          duration_seconds: null,
          created_at: '2025-08-25T13:33:46.718Z',
          updated_at: '2025-08-25T13:33:46.718Z'
        },
        {
          id: '2',
          pipedrive_event_id: 12344,
          deal_id: dealId,
          pipeline_id: 1,
          stage_id: 3,
          stage_name: 'Order Received - Johan',
          entered_at: '2025-08-07T11:16:49.000Z',
          left_at: '2025-08-11T12:28:28.000Z',
          duration_seconds: 349899,
          created_at: '2025-08-25T13:33:46.718Z',
          updated_at: '2025-08-25T13:33:46.718Z'
        }
      ];

      vi.mocked(fetchDealFlow).mockResolvedValue(mockPipedriveResponse.data);
      vi.mocked(insertDealFlowData).mockResolvedValue(mockStoredData);
      vi.mocked(insertDealMetadata).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/pipedrive/deal-flow', {
        method: 'POST',
        body: JSON.stringify({ deal_id: dealId })
      });

      const response = await POST(request);

      expect(fetchDealFlow).toHaveBeenCalledWith(dealId);
      expect(insertDealFlowData).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            deal_id: dealId,
            stage_name: 'Quality Control',
            stage_id: 5
          }),
          expect.objectContaining({
            deal_id: dealId,
            stage_name: 'Order Received - Johan',
            stage_id: 3
          })
        ])
      );
      expect(response).toEqual({
        data: {
          success: true,
          message: `Successfully fetched flow data for deal ${dealId}`,
          data: mockStoredData
        },
        options: undefined
      });
    });

    it('should handle Pipedrive API errors gracefully', async () => {
      const dealId = 999999;

      // Mock Pipedrive API error
      vi.mocked(fetchDealFlow).mockRejectedValue(new Error('Deal not found'));

      const request = new NextRequest('http://localhost:3000/api/pipedrive/deal-flow', {
        method: 'POST',
        body: JSON.stringify({ deal_id: dealId })
      });

      const response = await POST(request);

      expect(response).toEqual({
        data: {
          success: false,
          error: 'Error, the requested deal could not be fetched',
          message: 'Deal not found'
        },
        options: { status: 500 }
      });
    });

    it('should handle missing dealId in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/pipedrive/deal-flow', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const response = await POST(request);

      expect(response).toEqual({
        data: {
          success: false,
          error: 'deal_id is required'
        },
        options: { status: 400 }
      });
    });

    it('should filter only dealChange events with stage_id field_key', async () => {
      const dealId = 1467;
      const mockPipedriveResponse = {
        data: [
          {
            id: 12345,
            object: 'dealChange',
            data: {
              field_key: 'stage_id',
              item_id: dealId,
              new_value: 5,
              additional_data: {
                new_value_formatted: 'Quality Control'
              }
            },
            timestamp: '2025-08-11T12:28:28.000Z'
          },
          {
            id: 12346,
            object: 'note',
            data: {
              content: 'Some note content'
            },
            timestamp: '2025-08-11T12:30:00.000Z'
          },
          {
            id: 12347,
            object: 'dealChange',
            data: {
              field_key: 'title',
              item_id: dealId,
              new_value: 'Updated Deal Title'
            },
            timestamp: '2025-08-11T12:35:00.000Z'
          }
        ]
      };

      vi.mocked(fetchDealFlow).mockResolvedValue(mockPipedriveResponse.data);
      vi.mocked(insertDealFlowData).mockResolvedValue([]);
      vi.mocked(insertDealMetadata).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/pipedrive/deal-flow', {
        method: 'POST',
        body: JSON.stringify({ deal_id: dealId })
      });

      await POST(request);

      expect(insertDealFlowData).toHaveBeenCalledWith([
        expect.objectContaining({
          deal_id: dealId,
          stage_name: 'Quality Control',
          stage_id: 5
        })
      ]);
      // Should not include note or title change events
    });
  });

  describe('GET /api/pipedrive/deal-flow-data', () => {
    it('should fetch all deal flow data successfully', async () => {
      const mockFlowData = [
        {
          id: '1',
          pipedrive_event_id: 12345,
          deal_id: 1467,
          pipeline_id: 1,
          stage_id: 5,
          stage_name: 'Quality Control',
          entered_at: '2025-08-11T12:28:28.000Z',
          left_at: null,
          duration_seconds: null,
          created_at: '2025-08-25T13:33:46.718Z'
        },
        {
          id: '2',
          pipedrive_event_id: 12344,
          deal_id: 1467,
          pipeline_id: 1,
          stage_id: 3,
          stage_name: 'Order Received - Johan',
          entered_at: '2025-08-07T11:16:49.000Z',
          left_at: '2025-08-11T12:28:28.000Z',
          duration_seconds: 349899,
          created_at: '2025-08-25T13:33:46.718Z'
        }
      ];

      vi.mocked(getDealFlowData).mockResolvedValue(mockFlowData);

      const request = new NextRequest('http://localhost:3000/api/pipedrive/deal-flow-data');
      const response = await GET(request);

      expect(getDealFlowData).toHaveBeenCalledWith(undefined);
      expect(response).toEqual({
        data: {
          success: true,
          data: mockFlowData,
          message: 'Successfully fetched deal flow data'
        },
        options: undefined
      });
    });

    it('should fetch deal flow data for specific deal ID', async () => {
      const dealId = 1467;
      const mockFlowData = [
        {
          id: '1',
          pipedrive_event_id: 12345,
          deal_id: dealId,
          pipeline_id: 1,
          stage_id: 5,
          stage_name: 'Quality Control',
          entered_at: '2025-08-11T12:28:28.000Z',
          left_at: null,
          duration_seconds: null,
          created_at: '2025-08-25T13:33:46.718Z'
        }
      ];

      vi.mocked(getDealFlowData).mockResolvedValue(mockFlowData);

      const request = new NextRequest(`http://localhost:3000/api/pipedrive/deal-flow-data?deal_id=${dealId}`);
      const response = await GET(request);

      expect(getDealFlowData).toHaveBeenCalledWith(dealId);
      expect(response).toEqual({
        data: {
          success: true,
          data: mockFlowData,
          message: 'Successfully fetched deal flow data'
        },
        options: undefined
      });
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(getDealFlowData).mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/pipedrive/deal-flow-data');
      const response = await GET(request);

      expect(response).toEqual({
        data: {
          success: false,
          error: 'Failed to fetch deal flow data',
          message: 'Database connection failed'
        },
        options: { status: 500 }
      });
    });
  });

  describe('Database Functions', () => {
    describe('insertDealFlowData', () => {
      it('should insert new flow data and handle duplicates', async () => {
        const flowData = [
          {
            pipedrive_event_id: 12345,
            deal_id: 1467,
            pipeline_id: 1,
            stage_id: 5,
            stage_name: 'Quality Control',
            entered_at: '2025-08-11T12:28:28.000Z'
          }
        ];

        const mockInsertResult = [
          {
            id: '1',
            pipedrive_event_id: 12345,
            deal_id: 1467,
            stage_name: 'Quality Control',
            created_at: '2025-08-25T13:33:46.718Z'
          }
        ];

        vi.mocked(insertDealFlowData).mockResolvedValue(mockInsertResult);

        const result = await insertDealFlowData(flowData);

        expect(result).toEqual(mockInsertResult);
      });
    });

    describe('getDealFlowData', () => {
      it('should fetch all deal flow data when no dealId provided', async () => {
        const mockData = [
          {
            id: '1',
            deal_id: 1467,
            stage_name: 'Quality Control',
            entered_at: '2025-08-11T12:28:28.000Z'
          }
        ];

        vi.mocked(getDealFlowData).mockResolvedValue(mockData);

        const result = await getDealFlowData();

        expect(result).toEqual(mockData);
      });

      it('should fetch deal flow data for specific dealId', async () => {
        const dealId = 1467;
        const mockData = [
          {
            id: '1',
            deal_id: dealId,
            stage_name: 'Quality Control',
            entered_at: '2025-08-11T12:28:28.000Z'
          }
        ];

        vi.mocked(getDealFlowData).mockResolvedValue(mockData);

        const result = await getDealFlowData(dealId);

        expect(result).toEqual(mockData);
      });
    });
  });
});
