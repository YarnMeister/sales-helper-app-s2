import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestUpsert } from '../../lib/schema';

// Mock the database client
vi.mock('../../lib/db', () => ({
  getDb: vi.fn(),
  generateRequestId: vi.fn().mockResolvedValue('QR-001'),
  withDbErrorHandling: vi.fn((operation) => operation())
}));

// Mock the error handling
vi.mock('../../lib/errors', () => ({
  errorToResponse: vi.fn(),
  ValidationError: class ValidationError extends Error {
    status = 422;
    code = 'ERR_VALIDATION';
  },
  NotFoundError: class NotFoundError extends Error {
    status = 404;
    code = 'ERR_NOT_FOUND';
  }
}));

describe('Requests API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RequestUpsert Schema Validation', () => {
    it('should validate request data correctly', () => {
      const validData = {
        salespersonSelection: 'Luyanda',
        mineGroup: 'Northern Mines',
        mineName: 'Diamond Mine A',
        contact: {
          personId: 123,
          name: 'Test Contact',
          mineGroup: 'Northern Mines',
          mineName: 'Diamond Mine A'
        },
        line_items: [{
          pipedriveProductId: 456,
          name: 'Test Product',
          quantity: 2
        }]
      };
      
      const result = RequestUpsert.safeParse(validData);
      expect(result.success).toBe(true);
    });
    
    it('should reject invalid request data', () => {
      const invalidData = {
        contact: {
          personId: 'not-a-number', // Should be number
          name: '' // Should not be empty
        }
      };
      
      const result = RequestUpsert.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should support PRD inline update pattern', () => {
      const inlineUpdate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        contact: { 
          personId: 123, 
          name: 'Updated Contact',
          mineGroup: 'Northern Mines',
          mineName: 'Diamond Mine A'
        },
        comment: 'Updated comment',
        salespersonSelection: 'Luyanda' // Required field
      };
      
      const result = RequestUpsert.safeParse(inlineUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate salesperson selection from PRD requirements', () => {
      const validSalespeople = ['Luyanda', 'James', 'Stefan'];
      
      validSalespeople.forEach(salesperson => {
        const data = {
          salespersonSelection: salesperson,
          mineGroup: 'Test Mine',
          mineName: 'Test Mine Name'
        };
        
        const result = RequestUpsert.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid salesperson selection', () => {
      const data = {
        salespersonSelection: 'InvalidName',
        mineGroup: 'Test Mine',
        mineName: 'Test Mine Name'
      };
      
      const result = RequestUpsert.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate mobile-first contact requirements', () => {
      const validContact = {
        personId: 123,
        name: 'Test Contact',
        mineGroup: 'Northern Mines', // Required for mobile-first
        mineName: 'Diamond Mine A'   // Required for mobile-first
      };
      
      const data = {
        contact: validContact,
        salespersonSelection: 'Luyanda'
      };
      
      const result = RequestUpsert.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject contact without required mobile-first fields', () => {
      const invalidContact = {
        personId: 123,
        name: 'Test Contact'
        // Missing mineGroup and mineName
      };
      
      const data = {
        contact: invalidContact,
        salespersonSelection: 'Luyanda'
      };
      
      const result = RequestUpsert.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate line items correctly', () => {
      const validLineItem = {
        pipedriveProductId: 456,
        name: 'Test Product',
        quantity: 2,
        price: 100.50
      };
      
      const data = {
        line_items: [validLineItem],
        salespersonSelection: 'Luyanda'
      };
      
      const result = RequestUpsert.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid line items', () => {
      const invalidLineItem = {
        pipedriveProductId: -1, // Should be positive
        name: '', // Should not be empty
        quantity: 0 // Should be positive
      };
      
      const data = {
        line_items: [invalidLineItem],
        salespersonSelection: 'Luyanda'
      };
      
      const result = RequestUpsert.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate comment length limit', () => {
      const longComment = 'a'.repeat(2001); // Exceeds 2000 character limit
      
      const data = {
        comment: longComment,
        salespersonSelection: 'Luyanda'
      };
      
      const result = RequestUpsert.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid comment length', () => {
      const validComment = 'a'.repeat(2000); // Exactly at limit
      
      const data = {
        comment: validComment,
        salespersonSelection: 'Luyanda'
      };
      
      const result = RequestUpsert.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
