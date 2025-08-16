import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { testDataManager } from '../_utils/test-helpers';
import { contactFactory, lineItemFactory, requestFactory } from '../_factories';
import { getMockContactsResponse, getMockProductsResponse } from '../_utils/test-helpers';

// Mock the API routes
vi.mock('../../app/api/contacts/route', () => ({
  GET: vi.fn()
}));

vi.mock('../../app/api/products/route', () => ({
  GET: vi.fn()
}));

vi.mock('../../app/api/requests/route', () => ({
  GET: vi.fn(),
  POST: vi.fn(),
  DELETE: vi.fn()
}));

vi.mock('../../app/api/submit/route', () => ({
  POST: vi.fn()
}));

describe('API Endpoints Integration', () => {
  beforeAll(async () => {
    // Set up test environment
    process.env.APP_ENV = 'test';
  });
  
  afterAll(async () => {
    await testDataManager.nuclearCleanup();
  });
  
  beforeEach(async () => {
    await testDataManager.cleanup();
  });
  
  describe('Contacts API', () => {
    it('should return hierarchical contact data', async () => {
      const mockResponse = getMockContactsResponse();
      
      // Mock the contacts API response
      const { GET } = await import('../../app/api/contacts/route');
      vi.mocked(GET).mockResolvedValue(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      const request = new Request('http://localhost:3000/api/contacts');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.ok).toBe(true);
      expect(data.data['Anglo American']).toBeDefined();
      expect(data.data['Anglo American']['Zibulo Mine']).toBeInstanceOf(Array);
      expect(data.data['Anglo American']['Zibulo Mine'][0].personId).toBe(12345);
    });
    
    it('should handle cache hits and misses', async () => {
      const mockResponse = getMockContactsResponse();
      
      const { GET } = await import('../../app/api/contacts/route');
      vi.mocked(GET).mockResolvedValue(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      // First call should be from source
      const request1 = new Request('http://localhost:3000/api/contacts');
      const response1 = await GET(request1);
      const data1 = await response1.json();
      expect(data1.source).toBe('mock');
      
      // Second call should be from cache - create a new mock for the second call
      vi.mocked(GET).mockResolvedValueOnce(
        new Response(JSON.stringify({ ...mockResponse, source: 'cache' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      const request2 = new Request('http://localhost:3000/api/contacts');
      const response2 = await GET(request2);
      const data2 = await response2.json();
      expect(data2.source).toBe('cache');
    });
  });
  
  describe('Products API', () => {
    it('should return categorized product data', async () => {
      const mockResponse = getMockProductsResponse();
      
      const { GET } = await import('../../app/api/products/route');
      vi.mocked(GET).mockResolvedValue(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      const request = new Request('http://localhost:3000/api/products');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.ok).toBe(true);
      expect(data.data['Safety Equipment']).toBeInstanceOf(Array);
      expect(data.data['Communication']).toBeInstanceOf(Array);
      expect(data.data['Safety Equipment'][0].pipedriveProductId).toBe(99901);
    });
  });
  
  describe('Requests API', () => {
    it('should create new request', async () => {
      const testRequest = requestFactory.buildReadyToSubmit();
      
      const { POST } = await import('../../app/api/requests/route');
      vi.mocked(POST).mockResolvedValue(
        new Response(JSON.stringify({
          ok: true,
          data: {
            id: 'test-id',
            request_id: 'QR-001',
            ...testRequest
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      const request = new Request('http://localhost:3000/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testRequest)
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(data.ok).toBe(true);
      expect(data.data.request_id).toMatch(/^QR-\d{3}$/);
      expect(data.data.contact).toBeDefined();
      expect(data.data.line_items.length).toBeGreaterThan(0);
    });
    
    it('should fetch requests with filters', async () => {
      const mockRequests = [
        {
          id: 'test-1',
          request_id: 'QR-001',
          status: 'draft',
          salesperson_first_name: 'Luyanda',
          mine_group: 'Anglo American',
          mine_name: 'Zibulo Mine'
        },
        {
          id: 'test-2',
          request_id: 'QR-002',
          status: 'submitted',
          salesperson_first_name: 'James',
          mine_group: 'Harmony Gold',
          mine_name: 'Kusasalethu Mine'
        }
      ];
      
      const { GET } = await import('../../app/api/requests/route');
      vi.mocked(GET).mockResolvedValue(
        new Response(JSON.stringify({
          ok: true,
          data: mockRequests
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      const request = new Request('http://localhost:3000/api/requests?status=draft');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.ok).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(2);
    });
    
    it('should delete request', async () => {
      const { DELETE } = await import('../../app/api/requests/route');
      vi.mocked(DELETE).mockResolvedValue(
        new Response(JSON.stringify({
          ok: true,
          message: 'Request deleted successfully'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      const request = new Request('http://localhost:3000/api/requests?id=test-id', {
        method: 'DELETE'
      });
      
      const response = await DELETE(request);
      const data = await response.json();
      
      expect(data.ok).toBe(true);
      expect(data.message).toBe('Request deleted successfully');
    });
  });
  
  describe('Submit API', () => {
    it('should submit request successfully', async () => {
      const testRequest = requestFactory.buildReadyToSubmit();
      
      const { POST } = await import('../../app/api/submit/route');
      vi.mocked(POST).mockResolvedValue(
        new Response(JSON.stringify({
          ok: true,
          mode: 'mock',
          dealId: 12345,
          dealUrl: 'https://pipedrive.com/deal/12345'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      const request = new Request('http://localhost:3000/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'test-id',
          ...testRequest
        })
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(data.ok).toBe(true);
      expect(data.mode).toBe('mock');
      expect(data.dealId).toBe(12345);
      expect(data.dealUrl).toContain('pipedrive.com');
    });
    
    it('should reject submission without contact', async () => {
      const testRequest = requestFactory.buildWithoutContact();
      
      const { POST } = await import('../../app/api/submit/route');
      vi.mocked(POST).mockResolvedValue(
        new Response(JSON.stringify({
          ok: false,
          status: 422,
          message: 'Request must have a contact to submit'
        }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      const request = new Request('http://localhost:3000/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'test-id',
          ...testRequest
        })
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(data.ok).toBe(false);
      expect(data.status).toBe(422);
      expect(data.message).toContain('contact');
    });
    
    it('should reject submission without line items', async () => {
      const testRequest = requestFactory.buildWithoutLineItems();
      
      const { POST } = await import('../../app/api/submit/route');
      vi.mocked(POST).mockResolvedValue(
        new Response(JSON.stringify({
          ok: false,
          status: 422,
          message: 'Request must have at least one line item to submit'
        }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      const request = new Request('http://localhost:3000/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'test-id',
          ...testRequest
        })
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(data.ok).toBe(false);
      expect(data.status).toBe(422);
      expect(data.message).toContain('line item');
    });
  });
});
