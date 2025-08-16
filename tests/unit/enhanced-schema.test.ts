import { describe, it, expect } from 'vitest';
import { contactFactory, lineItemFactory, requestFactory } from '../_factories';
import { assertValidContact, assertValidLineItem, assertValidLineItems, assertSubmittable } from '../_utils/test-helpers';

describe('Enhanced Schema Validation', () => {
  describe('ContactJSON', () => {
    it('should validate factory-generated contact data', () => {
      const contact = contactFactory.build();
      assertValidContact(contact);
    });
    
    it('should validate contact with specific mine group', () => {
      const contact = contactFactory.buildForMineGroup('Anglo American');
      assertValidContact(contact);
      expect(contact.mineGroup).toBe('Anglo American');
    });
    
    it('should validate contact with specific mine', () => {
      const contact = contactFactory.buildForMine('Anglo American', 'Zibulo Mine');
      assertValidContact(contact);
      expect(contact.mineGroup).toBe('Anglo American');
      expect(contact.mineName).toBe('Zibulo Mine');
    });
    
    it('should reject contact with invalid personId', () => {
      const contact = contactFactory.build({ personId: 'not-a-number' as any });
      expect(() => assertValidContact(contact)).toThrow();
    });
    
    it('should reject contact with invalid email', () => {
      const contact = contactFactory.build({ email: 'not-an-email' });
      expect(() => assertValidContact(contact)).toThrow();
    });
  });
  
  describe('LineItem', () => {
    it('should validate factory-generated line item data', () => {
      const lineItem = lineItemFactory.build();
      assertValidLineItem(lineItem);
    });
    
    it('should validate line item for specific category', () => {
      const lineItem = lineItemFactory.buildForCategory('Safety Equipment');
      assertValidLineItem(lineItem);
      expect(lineItem.category).toBe('Safety Equipment');
    });
    
    it('should validate line item with specific quantity', () => {
      const lineItem = lineItemFactory.buildWithQuantity(5);
      assertValidLineItem(lineItem);
      expect(lineItem.quantity).toBe(5);
    });
    
    it('should reject line item with invalid quantity', () => {
      const lineItem = lineItemFactory.build({ quantity: 0 });
      expect(() => assertValidLineItem(lineItem)).toThrow();
    });
    
    it('should apply default values correctly', () => {
      const minimal = { pipedriveProductId: 123, name: 'Test', category: 'Safety Equipment' };
      const lineItem = lineItemFactory.build(minimal);
      expect(lineItem.price).toBeGreaterThanOrEqual(0);
      expect(lineItem.quantity).toBeGreaterThan(0);
      expect(lineItem.shortDescription).toBeTypeOf('string');
    });
  });
  
  describe('RequestUpsert', () => {
    it('should validate complete factory-generated request data', () => {
      const request = requestFactory.build();
      expect(request.contact).toBeDefined();
      expect(request.line_items).toBeInstanceOf(Array);
      expect(request.line_items.length).toBeGreaterThan(0);
    });
    
    it('should validate minimal request data', () => {
      const request = requestFactory.buildMinimal();
      expect(request.line_items).toEqual([]);
      expect(request.contact).toBeUndefined();
      expect(request.comment).toBeUndefined();
    });
    
    it('should validate request without contact', () => {
      const request = requestFactory.buildWithoutContact();
      expect(request.contact).toBeUndefined();
      expect(request.line_items.length).toBeGreaterThan(0);
    });
    
    it('should validate request without line items', () => {
      const request = requestFactory.buildWithoutLineItems();
      expect(request.contact).toBeDefined();
      expect(request.line_items).toEqual([]);
    });
    
    it('should validate request ready for submission', () => {
      const request = requestFactory.buildReadyToSubmit();
      assertSubmittable(request);
    });
  });
  
  describe('Data Consistency', () => {
    it('should generate consistent test data across multiple calls', () => {
      const contact1 = contactFactory.build();
      const contact2 = contactFactory.build();
      
      // Should be different due to sequence
      expect(contact1.personId).not.toBe(contact2.personId);
      expect(contact1.email).not.toBe(contact2.email);
    });
    
    it('should generate valid hierarchical data', () => {
      const request = requestFactory.build();
      
      if (request.contact && request.line_items.length > 0) {
        expect(request.contact.mineGroup).toBeDefined();
        expect(request.contact.mineName).toBeDefined();
        expect(request.line_items[0].category).toBeDefined();
        expect(request.line_items[0].name).toBeDefined();
      }
    });
  });
});
