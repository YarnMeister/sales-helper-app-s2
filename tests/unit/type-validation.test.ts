import { describe, it, expect } from 'vitest';
import type {
  Contact,
  Product,
  LineItem,
  SalesRequest,
  RequestStatus
} from '../../app/types';

describe('Type Validation', () => {
  describe('Contact Validation', () => {
    it('should validate required Contact fields', () => {
      const validateContact = (contact: any): contact is Contact => {
        return (
          typeof contact === 'object' &&
          contact !== null &&
          typeof contact.personId === 'number' &&
          typeof contact.name === 'string' &&
          contact.name.length > 0 &&
          typeof contact.mineGroup === 'string' &&
          contact.mineGroup.length > 0 &&
          typeof contact.mineName === 'string' &&
          contact.mineName.length > 0
        );
      };

      const validContact = {
        personId: 123,
        name: 'John Doe',
        mineGroup: 'Group A',
        mineName: 'Mine 1'
      };

      const invalidContacts = [
        null,
        undefined,
        {},
        { personId: 'invalid' },
        { personId: 123, name: '' },
        { personId: 123, name: 'John', mineGroup: '' },
        { personId: 123, name: 'John', mineGroup: 'Group A' } // missing mineName
      ];

      expect(validateContact(validContact)).toBe(true);
      invalidContacts.forEach(contact => {
        expect(validateContact(contact)).toBe(false);
      });
    });

    it('should validate optional Contact fields when present', () => {
      const validateContactOptionalFields = (contact: Contact): boolean => {
        const emailValid = !contact.email || (typeof contact.email === 'string' && contact.email.includes('@'));
        const phoneValid = !contact.phone || typeof contact.phone === 'string';
        const orgIdValid = !contact.orgId || typeof contact.orgId === 'number';
        const orgNameValid = !contact.orgName || typeof contact.orgName === 'string';
        const jobTitleValid = !contact.jobTitle || typeof contact.jobTitle === 'string';

        return emailValid && phoneValid && orgIdValid && orgNameValid && jobTitleValid;
      };

      const validContacts: Contact[] = [
        {
          personId: 123,
          name: 'John Doe',
          mineGroup: 'Group A',
          mineName: 'Mine 1'
        },
        {
          personId: 123,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          orgId: 456,
          orgName: 'Test Org',
          jobTitle: 'Manager',
          mineGroup: 'Group A',
          mineName: 'Mine 1'
        }
      ];

      const invalidContact: Contact = {
        personId: 123,
        name: 'John Doe',
        email: 'invalid-email', // Missing @
        mineGroup: 'Group A',
        mineName: 'Mine 1'
      };

      validContacts.forEach(contact => {
        expect(validateContactOptionalFields(contact)).toBe(true);
      });

      expect(validateContactOptionalFields(invalidContact)).toBe(false);
    });
  });

  describe('Product Validation', () => {
    it('should validate required Product fields', () => {
      const validateProduct = (product: any): product is Product => {
        return (
          typeof product === 'object' &&
          product !== null &&
          typeof product.id === 'string' &&
          product.id.length > 0 &&
          typeof product.name === 'string' &&
          product.name.length > 0 &&
          typeof product.category === 'string' &&
          product.category.length > 0 &&
          typeof product.subcategory === 'string' &&
          product.subcategory.length > 0
        );
      };

      const validProduct = {
        id: 'prod-123',
        name: 'Test Product',
        category: 'Electronics',
        subcategory: 'Computers'
      };

      const invalidProducts = [
        null,
        undefined,
        {},
        { id: '', name: 'Test', category: 'Electronics', subcategory: 'Computers' },
        { id: 'prod-123', name: '', category: 'Electronics', subcategory: 'Computers' },
        { id: 'prod-123', name: 'Test', category: '', subcategory: 'Computers' },
        { id: 'prod-123', name: 'Test', category: 'Electronics', subcategory: '' }
      ];

      expect(validateProduct(validProduct)).toBe(true);
      invalidProducts.forEach(product => {
        expect(validateProduct(product)).toBe(false);
      });
    });

    it('should validate optional Product fields when present', () => {
      const validateProductOptionalFields = (product: Product): boolean => {
        const descriptionValid = !product.description || typeof product.description === 'string';
        const priceValid = !product.price || (typeof product.price === 'number' && product.price >= 0);
        const unitValid = !product.unit || typeof product.unit === 'string';
        const availabilityValid = !product.availability || typeof product.availability === 'string';

        return descriptionValid && priceValid && unitValid && availabilityValid;
      };

      const validProducts: Product[] = [
        {
          id: 'prod-123',
          name: 'Test Product',
          category: 'Electronics',
          subcategory: 'Computers'
        },
        {
          id: 'prod-123',
          name: 'Test Product',
          category: 'Electronics',
          subcategory: 'Computers',
          description: 'A great product',
          price: 99.99,
          unit: 'each',
          availability: 'in-stock'
        }
      ];

      const invalidProduct: Product = {
        id: 'prod-123',
        name: 'Test Product',
        category: 'Electronics',
        subcategory: 'Computers',
        price: -10 // Invalid negative price
      };

      validProducts.forEach(product => {
        expect(validateProductOptionalFields(product)).toBe(true);
      });

      expect(validateProductOptionalFields(invalidProduct)).toBe(false);
    });
  });

  describe('LineItem Validation', () => {
    it('should validate required LineItem fields', () => {
      const validateLineItem = (item: any): item is LineItem => {
        return (
          typeof item === 'object' &&
          item !== null &&
          typeof item.id === 'string' &&
          item.id.length > 0 &&
          typeof item.productId === 'string' &&
          item.productId.length > 0 &&
          typeof item.productName === 'string' &&
          item.productName.length > 0 &&
          typeof item.quantity === 'number' &&
          item.quantity > 0 &&
          typeof item.unit === 'string' &&
          item.unit.length > 0
        );
      };

      const validLineItem = {
        id: 'line-123',
        productId: 'prod-123',
        productName: 'Test Product',
        quantity: 5,
        unit: 'each'
      };

      const invalidLineItems = [
        null,
        undefined,
        {},
        { id: '', productId: 'prod-123', productName: 'Test', quantity: 5, unit: 'each' },
        { id: 'line-123', productId: '', productName: 'Test', quantity: 5, unit: 'each' },
        { id: 'line-123', productId: 'prod-123', productName: '', quantity: 5, unit: 'each' },
        { id: 'line-123', productId: 'prod-123', productName: 'Test', quantity: 0, unit: 'each' },
        { id: 'line-123', productId: 'prod-123', productName: 'Test', quantity: -1, unit: 'each' },
        { id: 'line-123', productId: 'prod-123', productName: 'Test', quantity: 5, unit: '' }
      ];

      expect(validateLineItem(validLineItem)).toBe(true);
      invalidLineItems.forEach(item => {
        expect(validateLineItem(item)).toBe(false);
      });
    });

    it('should validate LineItem price consistency', () => {
      const validateLineItemPrices = (item: LineItem): boolean => {
        if (item.unitPrice !== undefined && item.totalPrice !== undefined) {
          const expectedTotal = item.unitPrice * item.quantity;
          return Math.abs(expectedTotal - item.totalPrice) < 0.01; // Allow for floating point precision
        }
        return true; // If prices are not provided, validation passes
      };

      const validLineItems: LineItem[] = [
        {
          id: 'line-1',
          productId: 'prod-1',
          productName: 'Product 1',
          quantity: 2,
          unit: 'each'
          // No prices provided
        },
        {
          id: 'line-2',
          productId: 'prod-2',
          productName: 'Product 2',
          quantity: 3,
          unit: 'each',
          unitPrice: 10.00,
          totalPrice: 30.00
        }
      ];

      const invalidLineItem: LineItem = {
        id: 'line-3',
        productId: 'prod-3',
        productName: 'Product 3',
        quantity: 2,
        unit: 'each',
        unitPrice: 10.00,
        totalPrice: 25.00 // Should be 20.00
      };

      validLineItems.forEach(item => {
        expect(validateLineItemPrices(item)).toBe(true);
      });

      expect(validateLineItemPrices(invalidLineItem)).toBe(false);
    });
  });

  describe('SalesRequest Validation', () => {
    it('should validate required SalesRequest fields', () => {
      const validateSalesRequest = (request: any): request is SalesRequest => {
        return (
          typeof request === 'object' &&
          request !== null &&
          typeof request.id === 'string' &&
          request.id.length > 0 &&
          typeof request.qrId === 'string' &&
          request.qrId.length > 0 &&
          typeof request.contactPersonId === 'number' &&
          typeof request.contactName === 'string' &&
          request.contactName.length > 0 &&
          typeof request.contactEmail === 'string' &&
          request.contactEmail.length > 0 &&
          Array.isArray(request.lineItems) &&
          typeof request.status === 'string' &&
          typeof request.createdAt === 'string' &&
          typeof request.updatedAt === 'string'
        );
      };

      const validRequest = {
        id: 'req-123',
        qrId: 'qr-456',
        contactPersonId: 123,
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        lineItems: [],
        status: 'draft',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };

      const invalidRequests = [
        null,
        undefined,
        {},
        { ...validRequest, id: '' },
        { ...validRequest, contactPersonId: 'invalid' },
        { ...validRequest, contactName: '' },
        { ...validRequest, lineItems: 'not-array' }
      ];

      expect(validateSalesRequest(validRequest)).toBe(true);
      invalidRequests.forEach(request => {
        expect(validateSalesRequest(request)).toBe(false);
      });
    });

    it('should validate RequestStatus enum values', () => {
      const validStatuses: RequestStatus[] = ['draft', 'submitted', 'processing', 'completed', 'cancelled'];
      const invalidStatuses = ['pending', 'approved', 'rejected', '', null, undefined, 123];

      const isValidStatus = (status: any): status is RequestStatus => {
        return validStatuses.includes(status);
      };

      validStatuses.forEach(status => {
        expect(isValidStatus(status)).toBe(true);
      });

      invalidStatuses.forEach(status => {
        expect(isValidStatus(status)).toBe(false);
      });
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate SalesRequest business rules', () => {
      const validateSalesRequestBusinessRules = (request: SalesRequest): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        // Must have at least one line item for submitted requests
        if (request.status !== 'draft' && request.lineItems.length === 0) {
          errors.push('Submitted requests must have at least one line item');
        }

        // Total value should match sum of line item totals
        if (request.totalValue !== undefined) {
          const calculatedTotal = request.lineItems.reduce((sum, item) => {
            return sum + (item.totalPrice || 0);
          }, 0);

          if (Math.abs(calculatedTotal - request.totalValue) > 0.01) {
            errors.push('Total value does not match sum of line items');
          }
        }

        // Submitted requests should have submittedAt timestamp
        if (request.status === 'submitted' && !request.submittedAt) {
          errors.push('Submitted requests must have submittedAt timestamp');
        }

        // Contact email should be valid format
        if (request.contactEmail && !request.contactEmail.includes('@')) {
          errors.push('Contact email must be valid format');
        }

        return {
          valid: errors.length === 0,
          errors
        };
      };

      const validRequest: SalesRequest = {
        id: 'req-123',
        qrId: 'qr-456',
        contactPersonId: 123,
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        lineItems: [
          {
            id: 'line-1',
            productId: 'prod-1',
            productName: 'Product 1',
            quantity: 2,
            unit: 'each',
            unitPrice: 10.00,
            totalPrice: 20.00
          }
        ],
        totalValue: 20.00,
        status: 'submitted',
        submittedAt: '2023-01-01T12:00:00Z',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T12:00:00Z'
      };

      const invalidRequest: SalesRequest = {
        id: 'req-124',
        qrId: 'qr-457',
        contactPersonId: 124,
        contactName: 'Jane Smith',
        contactEmail: 'invalid-email',
        lineItems: [],
        totalValue: 100.00, // Doesn't match empty line items
        status: 'submitted', // But no submittedAt
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T12:00:00Z'
      };

      const validResult = validateSalesRequestBusinessRules(validRequest);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toEqual([]);

      const invalidResult = validateSalesRequestBusinessRules(invalidRequest);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Submitted requests must have at least one line item');
      expect(invalidResult.errors).toContain('Total value does not match sum of line items');
      expect(invalidResult.errors).toContain('Submitted requests must have submittedAt timestamp');
      expect(invalidResult.errors).toContain('Contact email must be valid format');
    });
  });
});
