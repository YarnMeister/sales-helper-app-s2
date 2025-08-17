import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../../app/api/site-visits/route';

// Mock the database
vi.mock('@/lib/db', () => ({
  sql: vi.fn()
}));

// Mock logging
vi.mock('@/lib/log', () => ({
  generateCorrelationId: vi.fn(() => 'test-correlation-id'),
  withPerformanceLogging: vi.fn((fn) => fn),
  logInfo: vi.fn(),
  logError: vi.fn()
}));

describe('Site Visits API', () => {
  let mockSql: any;

  beforeEach(async () => {
    mockSql = vi.mocked(await import('@/lib/db')).sql;
    vi.clearAllMocks();
  });

  describe('POST /api/site-visits', () => {
    it('should create a new site visit successfully', async () => {
      const mockData = {
        salesperson: 'James',
        planned_mines: ['Mine Alpha'],
        main_purpose: 'Quote follow-up',
        availability: 'Later this morning',
        comments: 'Test comment'
      };

      const mockInsertResult = [{
        id: 'test-id-123',
        date: '2025-01-17',
        salesperson: 'James',
        planned_mines: ['Mine Alpha'],
        main_purpose: 'Quote follow-up',
        availability: 'Later this morning',
        comments: 'Test comment',
        created_at: '2025-01-17T10:00:00Z',
        updated_at: '2025-01-17T10:00:00Z'
      }];

      mockSql.mockResolvedValueOnce(mockInsertResult);

      const request = new NextRequest('http://localhost:3000/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(mockInsertResult[0]);
      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO site_visits')
      );
    });

    it('should validate required fields', async () => {
      const invalidData = {
        salesperson: 'James',
        // missing planned_mines
        main_purpose: 'Quote follow-up',
        availability: 'Later this morning'
      };

      const request = new NextRequest('http://localhost:3000/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('planned_mines');
    });

    it('should validate salesperson values', async () => {
      const invalidData = {
        salesperson: 'InvalidName',
        planned_mines: ['Mine Alpha'],
        main_purpose: 'Quote follow-up',
        availability: 'Later this morning'
      };

      const request = new NextRequest('http://localhost:3000/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid enum value');
    });

    it('should validate purpose values', async () => {
      const invalidData = {
        salesperson: 'James',
        planned_mines: ['Mine Alpha'],
        main_purpose: 'Invalid Purpose',
        availability: 'Later this morning'
      };

      const request = new NextRequest('http://localhost:3000/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid enum value');
    });

    it('should validate availability values', async () => {
      const invalidData = {
        salesperson: 'James',
        planned_mines: ['Mine Alpha'],
        main_purpose: 'Quote follow-up',
        availability: 'Invalid Time'
      };

      const request = new NextRequest('http://localhost:3000/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid enum value');
    });

    it('should handle database errors gracefully', async () => {
      mockSql.mockRejectedValueOnce(new Error('Database connection failed'));

      const mockData = {
        salesperson: 'James',
        planned_mines: ['Mine Alpha'],
        main_purpose: 'Quote follow-up',
        availability: 'Later this morning'
      };

      const request = new NextRequest('http://localhost:3000/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockData)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });
  });

  describe('GET /api/site-visits', () => {
    it('should fetch site visits without filters', async () => {
      const mockVisits = [
        {
          id: 'test-id-1',
          date: '2025-01-17',
          salesperson: 'James',
          planned_mines: ['Mine Alpha'],
          main_purpose: 'Quote follow-up',
          availability: 'Later this morning',
          comments: 'Test comment',
          created_at: '2025-01-17T10:00:00Z',
          updated_at: '2025-01-17T10:00:00Z'
        }
      ];

      mockSql.mockResolvedValueOnce(mockVisits);

      const request = new NextRequest('http://localhost:3000/api/site-visits');
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(mockVisits);
      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM site_visits')
      );
    });

    it('should filter by salesperson', async () => {
      const mockVisits = [
        {
          id: 'test-id-1',
          date: '2025-01-17',
          salesperson: 'James',
          planned_mines: ['Mine Alpha'],
          main_purpose: 'Quote follow-up',
          availability: 'Later this morning',
          comments: 'Test comment',
          created_at: '2025-01-17T10:00:00Z',
          updated_at: '2025-01-17T10:00:00Z'
        }
      ];

      mockSql.mockResolvedValueOnce(mockVisits);

      const request = new NextRequest('http://localhost:3000/api/site-visits?salesperson=James');
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(mockVisits);
      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('WHERE salesperson =')
      );
    });

    it('should filter by date', async () => {
      const mockVisits = [
        {
          id: 'test-id-1',
          date: '2025-01-17',
          salesperson: 'James',
          planned_mines: ['Mine Alpha'],
          main_purpose: 'Quote follow-up',
          availability: 'Later this morning',
          comments: 'Test comment',
          created_at: '2025-01-17T10:00:00Z',
          updated_at: '2025-01-17T10:00:00Z'
        }
      ];

      mockSql.mockResolvedValueOnce(mockVisits);

      const request = new NextRequest('http://localhost:3000/api/site-visits?date=2025-01-17');
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(mockVisits);
      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('WHERE date =')
      );
    });

    it('should filter by both salesperson and date', async () => {
      const mockVisits = [
        {
          id: 'test-id-1',
          date: '2025-01-17',
          salesperson: 'James',
          planned_mines: ['Mine Alpha'],
          main_purpose: 'Quote follow-up',
          availability: 'Later this morning',
          comments: 'Test comment',
          created_at: '2025-01-17T10:00:00Z',
          updated_at: '2025-01-17T10:00:00Z'
        }
      ];

      mockSql.mockResolvedValueOnce(mockVisits);

      const request = new NextRequest('http://localhost:3000/api/site-visits?salesperson=James&date=2025-01-17');
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(mockVisits);
      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('WHERE salesperson =')
      );
      expect(mockSql).toHaveBeenCalledWith(
        expect.stringContaining('AND date =')
      );
    });

    it('should handle database errors gracefully', async () => {
      mockSql.mockRejectedValueOnce(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/site-visits');
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });
  });
});
