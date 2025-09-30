import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';


// Mock the database functions
vi.mock('../../lib/db', () => ({
  sql: vi.fn(),
  logInfo: vi.fn(),
  logError: vi.fn()
}));

// Central mock for the repository used by routes
const repoMethods = {
  getMappingsWithConfig: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn(),
  delete: vi.fn(),
};

// The route files import the repository with different relative paths; mock both
vi.mock('../../../../lib/database/repositories/flow-metrics-repository', () => ({
  CanonicalStageMappingsRepository: vi.fn(() => repoMethods),
}));
vi.mock('../../../../../lib/database/repositories/flow-metrics-repository', () => ({
  CanonicalStageMappingsRepository: vi.fn(() => repoMethods),
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


// Import routes after mocks so they receive mocked dependencies
import { GET, POST } from '../../app/api/admin/canonical-mappings/route';
import { PATCH, DELETE } from '../../app/api/admin/canonical-mappings/[id]/route';

describe('Canonical Mappings API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    // Reset repo method mocks
    Object.values(repoMethods).forEach((fn) => (fn as any).mockReset());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/admin/canonical-mappings', () => {
    it('should fetch all canonical stage mappings successfully', async () => {
      const mockMappings = [
        {
          id: '1',
          canonicalStage: 'Order Conversion',
          startStage: 'Order Received - Johan',
          endStage: 'Quality Control',
          createdAt: '2025-08-25T13:33:46.718Z',
          updatedAt: '2025-08-25T13:33:46.718Z'
        }
      ];

      const { CanonicalStageMappingsRepository } = await import('../../lib/database/repositories/flow-metrics-repository');
      vi.spyOn((CanonicalStageMappingsRepository as any).prototype, 'getMappingsWithConfig').mockResolvedValue({ success: true, data: mockMappings } as any);

      const request = new NextRequest('http://localhost:3000/api/admin/canonical-mappings');
      const response = await GET(request);

      expect(response).toEqual({
        data: {
          success: true,
          data: mockMappings,
          message: 'Successfully fetched canonical stage mappings'
        },
        options: undefined
      });
    });

    it('should handle repository errors gracefully', async () => {
      const { CanonicalStageMappingsRepository } = await import('../../lib/database/repositories/flow-metrics-repository');
      vi.spyOn((CanonicalStageMappingsRepository as any).prototype, 'getMappingsWithConfig').mockResolvedValue({ success: false, error: { message: 'Database connection failed' } } as any);

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
        metric_config_id: 'mc1',
        canonical_stage: 'Quote to Order',
        start_stage: 'Quote Sent',
        end_stage: 'Order Received - Johan',
        avg_min_days: null,
        avg_max_days: null,
        metric_comment: null,
      };

      const createdMapping = {
        id: '2',
        metricConfigId: 'mc1',
        canonicalStage: 'Quote to Order',
        startStage: 'Quote Sent',
        endStage: 'Order Received - Johan',
        createdAt: '2025-08-25T13:51:04.738Z',
        updatedAt: '2025-08-25T13:51:04.738Z'
      };

      const { CanonicalStageMappingsRepository } = await import('../../lib/database/repositories/flow-metrics-repository');
      const createSpy = vi.spyOn((CanonicalStageMappingsRepository as any).prototype, 'create').mockResolvedValue({ success: true, data: createdMapping } as any);

      const request = new NextRequest('http://localhost:3000/api/admin/canonical-mappings', {
        method: 'POST',
        body: JSON.stringify(newMapping)
      });

      const response = await POST(request);

      expect(createSpy).toHaveBeenCalled();
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
        // Missing canonical_stage and metric_config_id
        start_stage: 'Quote Sent',
        end_stage: 'Order Received - Johan'
      } as any;

      const request = new NextRequest('http://localhost:3000/api/admin/canonical-mappings', {
        method: 'POST',
        body: JSON.stringify(invalidMapping)
      });

      const response = await POST(request);

      expect(response).toEqual({
        data: {
          success: false,
          error: 'canonical_stage is required'
        },
        options: { status: 400 }
      });
    });

    it('should handle repository errors during creation', async () => {
      const newMapping = {
        metric_config_id: 'mc1',
        canonical_stage: 'Quote to Order',
        start_stage: 'Quote Sent',
        end_stage: 'Order Received - Johan'
      };

      const { CanonicalStageMappingsRepository } = await import('../../lib/database/repositories/flow-metrics-repository');
      vi.spyOn((CanonicalStageMappingsRepository as any).prototype, 'create').mockRejectedValue(new Error('Insert failed'));

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
        canonicalStage: 'Order Conversion',
        startStage: 'Order Received - Johan',
        endStage: 'Quality Control',
        createdAt: '2025-08-25T13:33:46.718Z',
        updatedAt: '2025-08-25T13:54:57.483Z'
      };

      const { CanonicalStageMappingsRepository } = await import('../../lib/database/repositories/flow-metrics-repository');
      const updateSpy = vi.spyOn((CanonicalStageMappingsRepository as any).prototype, 'update').mockResolvedValue({ success: true, data: updatedMapping } as any);

      const request = new NextRequest(`http://localhost:3000/api/admin/canonical-mappings/${mappingId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      const response = await PATCH(request, { params: { id: mappingId } });

      expect(updateSpy).toHaveBeenCalled();
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

      const { CanonicalStageMappingsRepository } = await import('../../lib/database/repositories/flow-metrics-repository');
      vi.spyOn((CanonicalStageMappingsRepository as any).prototype, 'update').mockResolvedValue({ success: false, error: { type: 'not_found', message: 'Not found' } as any } as any);

      const request = new NextRequest(`http://localhost:3000/api/admin/canonical-mappings/${mappingId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      const response = await PATCH(request, { params: { id: mappingId } });

      expect(response).toEqual({
        data: {
          success: false,
          error: 'Failed to update canonical stage mapping',
          message: 'Not found'
        },
        options: { status: 404 }
      });
    });

    it('should validate required fields for update', async () => {
      const mappingId = '1';
      const invalidUpdateData = {
        canonical_stage: 'Order Conversion'
        // Missing start_stage and end_stage
      } as any;

      const request = new NextRequest(`http://localhost:3000/api/admin/canonical-mappings/${mappingId}`, {
        method: 'PATCH',
        body: JSON.stringify(invalidUpdateData)
      });

      const response = await PATCH(request, { params: { id: mappingId } });

      expect(response).toEqual({
        data: {
          success: false,
          error: 'Both start and end stages are required (either as IDs or names)'
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
        canonicalStage: 'Order Conversion',
        startStage: 'Order Received - Johan',
        endStage: 'Quality Control',
        createdAt: '2025-08-25T13:33:46.718Z',
        updatedAt: '2025-08-25T13:33:46.718Z'
      };

      const { CanonicalStageMappingsRepository } = await import('../../lib/database/repositories/flow-metrics-repository');
      const findSpy = vi.spyOn((CanonicalStageMappingsRepository as any).prototype, 'findById').mockResolvedValue({ success: true, data: deletedMapping } as any);
      const deleteSpy = vi.spyOn((CanonicalStageMappingsRepository as any).prototype, 'delete').mockResolvedValue({ success: true, data: true } as any);

      const request = new NextRequest(`http://localhost:3000/api/admin/canonical-mappings/${mappingId}`, {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: mappingId } });

      expect(findSpy).toHaveBeenCalledWith(mappingId);
      expect(deleteSpy).toHaveBeenCalledWith(mappingId);
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

      const { CanonicalStageMappingsRepository } = await import('../../lib/database/repositories/flow-metrics-repository');
      vi.spyOn((CanonicalStageMappingsRepository as any).prototype, 'findById').mockResolvedValue({ success: true, data: null } as any);

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
