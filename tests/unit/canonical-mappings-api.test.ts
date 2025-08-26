import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/admin/canonical-mappings/route';
import { PATCH, DELETE } from '../../app/api/admin/canonical-mappings/[id]/route';

// Mock the database functions
vi.mock('../../../../lib/db', () => ({
  sql: vi.fn(),
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

describe('Canonical Mappings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/admin/canonical-mappings', () => {
    it('should fetch all canonical stage mappings successfully', async () => {
      const mockMappings = [
        {
          id: '1',
          canonical_stage: 'Order Conversion',
          start_stage: 'Order Received - Johan',
          end_stage: 'Quality Control',
          created_at: '2025-08-25T13:33:46.718Z',
          updated_at: '2025-08-25T13:33:46.718Z'
        }
      ];

      const { sql } = await import('../../lib/db');
      (sql as any).mockResolvedValue(mockMappings);

      const request = new NextRequest('http://localhost:3000/api/admin/canonical-mappings');
      const response = await GET(request);

      expect(sql).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM canonical_stage_mappings')
      );
      expect(response).toEqual({
        data: {
          success: true,
          data: mockMappings,
          message: 'Successfully fetched canonical stage mappings'
        },
        options: undefined
      });
    });

    it('should handle database errors gracefully', async () => {
      const { sql } = await import('../../lib/db');
      (sql as any).mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/canonical-mappings');
      const response = await GET(request);

      expect(response).toEqual({
        data: {
          success: false,
          error: 'Failed to fetch canonical stage mappings',
          message: 'Database connection failed'
        },
        options: { status: 500 }
      });
    });
  });

  describe('POST /api/admin/canonical-mappings', () => {
    it('should create a new canonical stage mapping successfully', async () => {
      const newMapping = {
        canonical_stage: 'Quote to Order',
        start_stage: 'Quote Sent',
        end_stage: 'Order Received - Johan'
      };

      const createdMapping = {
        id: '2',
        ...newMapping,
        created_at: '2025-08-25T13:51:04.738Z',
        updated_at: '2025-08-25T13:51:04.738Z'
      };

      const { sql } = await import('../../lib/db');
      (sql as any).mockResolvedValue([createdMapping]);

      const request = new NextRequest('http://localhost:3000/api/admin/canonical-mappings', {
        method: 'POST',
        body: JSON.stringify(newMapping)
      });

      const response = await POST(request);

      expect(sql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO canonical_stage_mappings'),
        'Quote to Order',
        'Quote Sent',
        'Order Received - Johan'
      );
      expect(response).toEqual({
        data: {
          success: true,
          data: createdMapping,
          message: 'Successfully created canonical stage mapping'
        },
        options: undefined
      });
    });

    it('should validate required fields', async () => {
      const invalidMapping = {
        canonical_stage: 'Quote to Order'
        // Missing start_stage and end_stage
      };

      const request = new NextRequest('http://localhost:3000/api/admin/canonical-mappings', {
        method: 'POST',
        body: JSON.stringify(invalidMapping)
      });

      const response = await POST(request);

      expect(response).toEqual({
        data: {
          success: false,
          error: 'canonical_stage, start_stage, and end_stage are required'
        },
        options: { status: 400 }
      });
    });

    it('should handle database errors during creation', async () => {
      const newMapping = {
        canonical_stage: 'Quote to Order',
        start_stage: 'Quote Sent',
        end_stage: 'Order Received - Johan'
      };

      const { sql } = await import('../../lib/db');
      (sql as any).mockRejectedValue(new Error('Insert failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/canonical-mappings', {
        method: 'POST',
        body: JSON.stringify(newMapping)
      });

      const response = await POST(request);

      expect(response).toEqual({
        data: {
          success: false,
          error: 'Failed to create canonical stage mapping',
          message: 'Insert failed'
        },
        options: { status: 500 }
      });
    });
  });

  describe('PATCH /api/admin/canonical-mappings/[id]', () => {
    it('should update an existing canonical stage mapping successfully', async () => {
      const mappingId = '1';
      const updateData = {
        canonical_stage: 'Order Conversion',
        start_stage: 'Order Received - Johan',
        end_stage: 'Quality Control'
      };

      const updatedMapping = {
        id: mappingId,
        ...updateData,
        created_at: '2025-08-25T13:33:46.718Z',
        updated_at: '2025-08-25T13:54:57.483Z'
      };

      const { sql } = await import('../../lib/db');
      (sql as any).mockResolvedValue([updatedMapping]);

      const request = new NextRequest(`http://localhost:3000/api/admin/canonical-mappings/${mappingId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      const response = await PATCH(request, { params: { id: mappingId } });

      expect(sql).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE canonical_stage_mappings'),
        'Order Conversion',
        'Order Received - Johan',
        'Quality Control',
        mappingId
      );
      expect(response).toEqual({
        data: {
          success: true,
          data: updatedMapping,
          message: 'Successfully updated canonical stage mapping'
        },
        options: undefined
      });
    });

    it('should return 404 when mapping not found', async () => {
      const mappingId = '999';
      const updateData = {
        canonical_stage: 'Order Conversion',
        start_stage: 'Order Received - Johan',
        end_stage: 'Quality Control'
      };

      const { sql } = await import('../../lib/db');
      (sql as any).mockResolvedValue([]);

      const request = new NextRequest(`http://localhost:3000/api/admin/canonical-mappings/${mappingId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      const response = await PATCH(request, { params: { id: mappingId } });

      expect(response).toEqual({
        data: {
          success: false,
          error: 'Canonical stage mapping not found'
        },
        options: { status: 404 }
      });
    });

    it('should validate required fields for update', async () => {
      const mappingId = '1';
      const invalidUpdateData = {
        canonical_stage: 'Order Conversion'
        // Missing start_stage and end_stage
      };

      const request = new NextRequest(`http://localhost:3000/api/admin/canonical-mappings/${mappingId}`, {
        method: 'PATCH',
        body: JSON.stringify(invalidUpdateData)
      });

      const response = await PATCH(request, { params: { id: mappingId } });

      expect(response).toEqual({
        data: {
          success: false,
          error: 'canonical_stage, start_stage, and end_stage are required'
        },
        options: { status: 400 }
      });
    });
  });

  describe('DELETE /api/admin/canonical-mappings/[id]', () => {
    it('should delete a canonical stage mapping successfully', async () => {
      const mappingId = '1';
      const deletedMapping = {
        id: mappingId,
        canonical_stage: 'Order Conversion',
        start_stage: 'Order Received - Johan',
        end_stage: 'Quality Control',
        created_at: '2025-08-25T13:33:46.718Z',
        updated_at: '2025-08-25T13:33:46.718Z'
      };

      const { sql } = await import('../../lib/db');
      (sql as any).mockResolvedValue([deletedMapping]);

      const request = new NextRequest(`http://localhost:3000/api/admin/canonical-mappings/${mappingId}`, {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: mappingId } });

      expect(sql).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM canonical_stage_mappings'),
        mappingId
      );
      expect(response).toEqual({
        data: {
          success: true,
          data: deletedMapping,
          message: 'Successfully deleted canonical stage mapping'
        },
        options: undefined
      });
    });

    it('should return 404 when mapping not found for deletion', async () => {
      const mappingId = '999';

      const { sql } = await import('../../lib/db');
      (sql as any).mockResolvedValue([]);

      const request = new NextRequest(`http://localhost:3000/api/admin/canonical-mappings/${mappingId}`, {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: mappingId } });

      expect(response).toEqual({
        data: {
          success: false,
          error: 'Canonical stage mapping not found'
        },
        options: { status: 404 }
      });
    });
  });
});
