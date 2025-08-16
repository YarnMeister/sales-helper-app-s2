import { describe, it, expect } from 'vitest';
import { 
  LineItem, 
  ContactJSON, 
  RequestUpsert,
  SalespersonSelection
} from '../../lib/schema';

describe('Schema validation', () => {
  describe('SalespersonSelection', () => {
    it('should validate valid salesperson names', () => {
      expect(() => SalespersonSelection.parse('Luyanda')).not.toThrow();
      expect(() => SalespersonSelection.parse('James')).not.toThrow();
      expect(() => SalespersonSelection.parse('Stefan')).not.toThrow();
    });
    
    it('should reject invalid salesperson names', () => {
      expect(() => SalespersonSelection.parse('InvalidName')).toThrow();
      expect(() => SalespersonSelection.parse('')).toThrow();
    });
  });

  describe('LineItem', () => {
    it('should validate valid line item', () => {
      const validItem = {
        pipedriveProductId: 123,
        name: "Test Product",
        price: 100,
        quantity: 2
      };
      
      expect(() => LineItem.parse(validItem)).not.toThrow();
    });
    
    it('should reject invalid line item', () => {
      const invalidItem = {
        pipedriveProductId: -1,
        name: "",
        price: -100,
        quantity: 0
      };
      
      expect(() => LineItem.parse(invalidItem)).toThrow();
    });
  });

  describe('ContactJSON', () => {
    it('should validate valid contact with required mobile-first fields', () => {
      const validContact = {
        personId: 456,
        name: "John Doe",
        email: "john@example.com",
        mineGroup: "Northern Mines",
        mineName: "Diamond Mine A"
      };
      
      expect(() => ContactJSON.parse(validContact)).not.toThrow();
    });
    
    it('should reject contact missing mobile-first required fields', () => {
      const invalidContact = {
        personId: 456,
        name: "John Doe",
        email: "john@example.com"
        // Missing mineGroup and mineName
      };
      
      expect(() => ContactJSON.parse(invalidContact)).toThrow();
    });
  });

  describe('RequestUpsert', () => {
    it('should validate with salesperson selection', () => {
      const validRequest = {
        salespersonSelection: 'Luyanda',
        line_items: []
      };
      
      expect(() => RequestUpsert.parse(validRequest)).not.toThrow();
    });
    
    it('should validate with salesperson first name', () => {
      const validRequest = {
        salespersonFirstName: 'John',
        line_items: []
      };
      
      expect(() => RequestUpsert.parse(validRequest)).not.toThrow();
    });
    
    it('should reject without any salesperson info', () => {
      const invalidRequest = {
        line_items: []
      };
      
      expect(() => RequestUpsert.parse(invalidRequest)).toThrow();
    });
  });
});
