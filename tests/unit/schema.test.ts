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
    
    it('should accept line item with null code', () => {
      const itemWithNullCode = {
        pipedriveProductId: 123,
        name: "Test Product",
        code: null,
        price: 100,
        quantity: 2
      };
      
      expect(() => LineItem.parse(itemWithNullCode)).not.toThrow();
    });
    
    it('should accept line item with undefined code', () => {
      const itemWithUndefinedCode = {
        pipedriveProductId: 123,
        name: "Test Product",
        code: undefined,
        price: 100,
        quantity: 2
      };
      
      expect(() => LineItem.parse(itemWithUndefinedCode)).not.toThrow();
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
    
    it('should validate contact with null email and phone (from Pipedrive)', () => {
      const contactWithNulls = {
        personId: 789,
        name: "Shreeya Pandya",
        email: null,
        phone: null,
        mineGroup: "Seriti",
        mineName: "Kriel"
      };
      
      expect(() => ContactJSON.parse(contactWithNulls)).not.toThrow();
    });
    
    it('should validate contact with null email only', () => {
      const contactWithNullEmail = {
        personId: 101,
        name: "Jane Smith",
        email: null,
        phone: "+27123456789",
        mineGroup: "Anglo American",
        mineName: "Zibulo Mine"
      };
      
      expect(() => ContactJSON.parse(contactWithNullEmail)).not.toThrow();
    });
    
    it('should validate contact with null phone only', () => {
      const contactWithNullPhone = {
        personId: 102,
        name: "Bob Johnson",
        email: "bob@example.com",
        phone: null,
        mineGroup: "Exxaro",
        mineName: "Grootegeluk"
      };
      
      expect(() => ContactJSON.parse(contactWithNullPhone)).not.toThrow();
    });
    
    it('should validate contact with undefined email and phone', () => {
      const contactWithUndefined = {
        personId: 103,
        name: "Alice Brown",
        mineGroup: "Sibanye",
        mineName: "Driefontein"
      };
      
      expect(() => ContactJSON.parse(contactWithUndefined)).not.toThrow();
    });
    
    it('should reject contact with empty string email (invalid email format)', () => {
      const contactWithEmptyEmail = {
        personId: 104,
        name: "Charlie Wilson",
        email: "",
        phone: "",
        mineGroup: "Harmony",
        mineName: "Kusasalethu"
      };
      
      expect(() => ContactJSON.parse(contactWithEmptyEmail)).toThrow();
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
    
    it('should reject contact with invalid email format when not null', () => {
      const contactWithInvalidEmail = {
        personId: 105,
        name: "Invalid Email",
        email: "not-an-email",
        phone: null,
        mineGroup: "Test Group",
        mineName: "Test Mine"
      };
      
      expect(() => ContactJSON.parse(contactWithInvalidEmail)).toThrow();
    });
    
    it('should reject contact with empty name', () => {
      const contactWithEmptyName = {
        personId: 106,
        name: "",
        email: null,
        phone: null,
        mineGroup: "Test Group",
        mineName: "Test Mine"
      };
      
      expect(() => ContactJSON.parse(contactWithEmptyName)).toThrow();
    });
    
    it('should reject contact with whitespace-only name', () => {
      const contactWithWhitespaceName = {
        personId: 107,
        name: "   ",
        email: null,
        phone: null,
        mineGroup: "Test Group",
        mineName: "Test Mine"
      };
      
      expect(() => ContactJSON.parse(contactWithWhitespaceName)).toThrow();
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
