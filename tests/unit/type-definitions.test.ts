import { describe, it, expect } from 'vitest';
import type {
  Contact,
  Product,
  LineItem,
  SalesRequest,
  ContactsHierarchy,
  ProductCategory,
  RequestStatus,
  ContactSelectionState,
  ProductSelectionState,
  RequestFormData,
  SubmissionResult
} from '../../app/types';

describe('Type Definitions', () => {
  describe('Contact Type', () => {
    it('should have required properties', () => {
      const contact: Contact = {
        personId: 123,
        name: 'John Doe',
        mineGroup: 'Group A',
        mineName: 'Mine 1'
      };

      expect(contact.personId).toBe(123);
      expect(contact.name).toBe('John Doe');
      expect(contact.mineGroup).toBe('Group A');
      expect(contact.mineName).toBe('Mine 1');
    });

    it('should allow optional properties', () => {
      const contact: Contact = {
        personId: 123,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        orgId: 456,
        orgName: 'Test Org',
        jobTitle: 'Manager',
        mineGroup: 'Group A',
        mineName: 'Mine 1'
      };

      expect(contact.email).toBe('john@example.com');
      expect(contact.phone).toBe('+1234567890');
      expect(contact.orgId).toBe(456);
      expect(contact.orgName).toBe('Test Org');
      expect(contact.jobTitle).toBe('Manager');
    });

    it('should work without optional properties', () => {
      const contact: Contact = {
        personId: 123,
        name: 'John Doe',
        mineGroup: 'Group A',
        mineName: 'Mine 1'
      };

      expect(contact.email).toBeUndefined();
      expect(contact.phone).toBeUndefined();
      expect(contact.orgId).toBeUndefined();
      expect(contact.orgName).toBeUndefined();
      expect(contact.jobTitle).toBeUndefined();
    });
  });

  describe('Product Type', () => {
    it('should have required properties', () => {
      const product: Product = {
        id: 'prod-123',
        name: 'Test Product',
        category: 'Electronics',
        subcategory: 'Computers'
      };

      expect(product.id).toBe('prod-123');
      expect(product.name).toBe('Test Product');
      expect(product.category).toBe('Electronics');
      expect(product.subcategory).toBe('Computers');
    });

    it('should allow optional properties', () => {
      const product: Product = {
        id: 'prod-123',
        name: 'Test Product',
        category: 'Electronics',
        subcategory: 'Computers',
        description: 'A test product',
        price: 99.99,
        unit: 'each',
        availability: 'in-stock'
      };

      expect(product.description).toBe('A test product');
      expect(product.price).toBe(99.99);
      expect(product.unit).toBe('each');
      expect(product.availability).toBe('in-stock');
    });
  });

  describe('LineItem Type', () => {
    it('should have required properties', () => {
      const lineItem: LineItem = {
        id: 'line-123',
        productId: 'prod-123',
        productName: 'Test Product',
        quantity: 5,
        unit: 'each'
      };

      expect(lineItem.id).toBe('line-123');
      expect(lineItem.productId).toBe('prod-123');
      expect(lineItem.productName).toBe('Test Product');
      expect(lineItem.quantity).toBe(5);
      expect(lineItem.unit).toBe('each');
    });

    it('should allow optional properties', () => {
      const lineItem: LineItem = {
        id: 'line-123',
        productId: 'prod-123',
        productName: 'Test Product',
        quantity: 5,
        unit: 'each',
        unitPrice: 19.99,
        totalPrice: 99.95,
        notes: 'Special requirements',
        category: 'Electronics',
        subcategory: 'Computers'
      };

      expect(lineItem.unitPrice).toBe(19.99);
      expect(lineItem.totalPrice).toBe(99.95);
      expect(lineItem.notes).toBe('Special requirements');
      expect(lineItem.category).toBe('Electronics');
      expect(lineItem.subcategory).toBe('Computers');
    });
  });

  describe('SalesRequest Type', () => {
    it('should have required properties', () => {
      const request: SalesRequest = {
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

      expect(request.id).toBe('req-123');
      expect(request.qrId).toBe('qr-456');
      expect(request.contactPersonId).toBe(123);
      expect(request.contactName).toBe('John Doe');
      expect(request.contactEmail).toBe('john@example.com');
      expect(request.lineItems).toEqual([]);
      expect(request.status).toBe('draft');
    });

    it('should allow optional properties', () => {
      const request: SalesRequest = {
        id: 'req-123',
        qrId: 'qr-456',
        contactPersonId: 123,
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '+1234567890',
        contactOrgId: 456,
        contactOrgName: 'Test Org',
        contactJobTitle: 'Manager',
        mineGroup: 'Group A',
        mineName: 'Mine 1',
        lineItems: [],
        totalValue: 199.99,
        currency: 'USD',
        notes: 'Urgent request',
        status: 'submitted',
        submittedAt: '2023-01-01T12:00:00Z',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T12:00:00Z'
      };

      expect(request.contactPhone).toBe('+1234567890');
      expect(request.totalValue).toBe(199.99);
      expect(request.currency).toBe('USD');
      expect(request.notes).toBe('Urgent request');
      expect(request.submittedAt).toBe('2023-01-01T12:00:00Z');
    });
  });

  describe('ContactsHierarchy Type', () => {
    it('should structure contacts by mine group and mine name', () => {
      const hierarchy: ContactsHierarchy = {
        'Group A': {
          'Mine 1': [
            {
              personId: 123,
              name: 'John Doe',
              mineGroup: 'Group A',
              mineName: 'Mine 1'
            }
          ],
          'Mine 2': [
            {
              personId: 124,
              name: 'Jane Smith',
              mineGroup: 'Group A',
              mineName: 'Mine 2'
            }
          ]
        },
        'Group B': {
          'Mine 3': [
            {
              personId: 125,
              name: 'Bob Johnson',
              mineGroup: 'Group B',
              mineName: 'Mine 3'
            }
          ]
        }
      };

      expect(hierarchy['Group A']['Mine 1']).toHaveLength(1);
      expect(hierarchy['Group A']['Mine 1'][0].name).toBe('John Doe');
      expect(hierarchy['Group B']['Mine 3']).toHaveLength(1);
      expect(hierarchy['Group B']['Mine 3'][0].name).toBe('Bob Johnson');
    });
  });

  describe('ProductCategory Type', () => {
    it('should structure products by category and subcategory', () => {
      const categories: ProductCategory = {
        'Electronics': {
          'Computers': [
            {
              id: 'prod-1',
              name: 'Laptop',
              category: 'Electronics',
              subcategory: 'Computers'
            }
          ],
          'Phones': [
            {
              id: 'prod-2',
              name: 'Smartphone',
              category: 'Electronics',
              subcategory: 'Phones'
            }
          ]
        },
        'Tools': {
          'Hand Tools': [
            {
              id: 'prod-3',
              name: 'Hammer',
              category: 'Tools',
              subcategory: 'Hand Tools'
            }
          ]
        }
      };

      expect(categories['Electronics']['Computers']).toHaveLength(1);
      expect(categories['Electronics']['Computers'][0].name).toBe('Laptop');
      expect(categories['Tools']['Hand Tools']).toHaveLength(1);
      expect(categories['Tools']['Hand Tools'][0].name).toBe('Hammer');
    });
  });

  describe('RequestStatus Type', () => {
    it('should accept valid status values', () => {
      const validStatuses: RequestStatus[] = ['draft', 'submitted', 'processing', 'completed', 'cancelled'];

      validStatuses.forEach(status => {
        const request: Partial<SalesRequest> = { status };
        expect(request.status).toBe(status);
      });
    });
  });

  describe('ContactSelectionState Type', () => {
    it('should track contact selection state', () => {
      const selectionState: ContactSelectionState = {
        selectedContact: {
          personId: 123,
          name: 'John Doe',
          mineGroup: 'Group A',
          mineName: 'Mine 1'
        },
        expandedGroups: ['Group A'],
        expandedMines: ['Group A:Mine 1']
      };

      expect(selectionState.selectedContact?.personId).toBe(123);
      expect(selectionState.expandedGroups).toContain('Group A');
      expect(selectionState.expandedMines).toContain('Group A:Mine 1');
    });

    it('should allow null selected contact', () => {
      const selectionState: ContactSelectionState = {
        selectedContact: null,
        expandedGroups: [],
        expandedMines: []
      };

      expect(selectionState.selectedContact).toBeNull();
      expect(selectionState.expandedGroups).toEqual([]);
      expect(selectionState.expandedMines).toEqual([]);
    });
  });

  describe('ProductSelectionState Type', () => {
    it('should track product selection state', () => {
      const selectionState: ProductSelectionState = {
        selectedProducts: [
          {
            id: 'prod-1',
            name: 'Laptop',
            category: 'Electronics',
            subcategory: 'Computers'
          }
        ],
        expandedCategories: ['Electronics'],
        expandedSubcategories: ['Electronics:Computers']
      };

      expect(selectionState.selectedProducts).toHaveLength(1);
      expect(selectionState.selectedProducts[0].name).toBe('Laptop');
      expect(selectionState.expandedCategories).toContain('Electronics');
      expect(selectionState.expandedSubcategories).toContain('Electronics:Computers');
    });
  });

  describe('RequestFormData Type', () => {
    it('should represent form data structure', () => {
      const formData: RequestFormData = {
        contact: {
          personId: 123,
          name: 'John Doe',
          mineGroup: 'Group A',
          mineName: 'Mine 1'
        },
        lineItems: [
          {
            id: 'line-1',
            productId: 'prod-1',
            productName: 'Laptop',
            quantity: 2,
            unit: 'each'
          }
        ],
        notes: 'Urgent delivery required'
      };

      expect(formData.contact.personId).toBe(123);
      expect(formData.lineItems).toHaveLength(1);
      expect(formData.lineItems[0].quantity).toBe(2);
      expect(formData.notes).toBe('Urgent delivery required');
    });

    it('should allow optional notes', () => {
      const formData: RequestFormData = {
        contact: {
          personId: 123,
          name: 'John Doe',
          mineGroup: 'Group A',
          mineName: 'Mine 1'
        },
        lineItems: []
      };

      expect(formData.notes).toBeUndefined();
    });
  });

  describe('SubmissionResult Type', () => {
    it('should represent successful submission', () => {
      const result: SubmissionResult = {
        success: true,
        requestId: 'req-123',
        message: 'Request submitted successfully'
      };

      expect(result.success).toBe(true);
      expect(result.requestId).toBe('req-123');
      expect(result.message).toBe('Request submitted successfully');
      expect(result.error).toBeUndefined();
    });

    it('should represent failed submission', () => {
      const result: SubmissionResult = {
        success: false,
        error: 'Validation failed',
        message: 'Please check your input'
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.message).toBe('Please check your input');
      expect(result.requestId).toBeUndefined();
    });
  });
});
