import { describe, it, expect } from 'vitest';
import type {
  Contact,
  Product,
  LineItem,
  SalesRequest,
  RequestFormData
} from '../../app/types';

describe('Type Compatibility', () => {
  describe('Contact to SalesRequest Compatibility', () => {
    it('should map Contact properties to SalesRequest', () => {
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

      // Simulate mapping Contact to SalesRequest fields
      const requestData: Partial<SalesRequest> = {
        contactPersonId: contact.personId,
        contactName: contact.name,
        contactEmail: contact.email,
        contactPhone: contact.phone,
        contactOrgId: contact.orgId,
        contactOrgName: contact.orgName,
        contactJobTitle: contact.jobTitle,
        mineGroup: contact.mineGroup,
        mineName: contact.mineName
      };

      expect(requestData.contactPersonId).toBe(contact.personId);
      expect(requestData.contactName).toBe(contact.name);
      expect(requestData.contactEmail).toBe(contact.email);
      expect(requestData.mineGroup).toBe(contact.mineGroup);
      expect(requestData.mineName).toBe(contact.mineName);
    });

    it('should handle minimal Contact data', () => {
      const contact: Contact = {
        personId: 123,
        name: 'John Doe',
        mineGroup: 'Group A',
        mineName: 'Mine 1'
      };

      const requestData: Partial<SalesRequest> = {
        contactPersonId: contact.personId,
        contactName: contact.name,
        contactEmail: contact.email, // undefined
        mineGroup: contact.mineGroup,
        mineName: contact.mineName
      };

      expect(requestData.contactPersonId).toBe(123);
      expect(requestData.contactName).toBe('John Doe');
      expect(requestData.contactEmail).toBeUndefined();
    });
  });

  describe('Product to LineItem Compatibility', () => {
    it('should map Product properties to LineItem', () => {
      const product: Product = {
        id: 'prod-123',
        name: 'Test Product',
        category: 'Electronics',
        subcategory: 'Computers',
        description: 'A test product',
        price: 99.99,
        unit: 'each'
      };

      // Simulate creating LineItem from Product
      const lineItem: Omit<LineItem, 'id' | 'quantity'> = {
        productId: product.id,
        productName: product.name,
        unit: product.unit || 'each',
        unitPrice: product.price,
        category: product.category,
        subcategory: product.subcategory
      };

      expect(lineItem.productId).toBe(product.id);
      expect(lineItem.productName).toBe(product.name);
      expect(lineItem.unit).toBe(product.unit);
      expect(lineItem.unitPrice).toBe(product.price);
      expect(lineItem.category).toBe(product.category);
    });

    it('should handle Product without optional fields', () => {
      const product: Product = {
        id: 'prod-123',
        name: 'Test Product',
        category: 'Electronics',
        subcategory: 'Computers'
      };

      const lineItem: Omit<LineItem, 'id' | 'quantity'> = {
        productId: product.id,
        productName: product.name,
        unit: product.unit || 'each',
        unitPrice: product.price,
        category: product.category,
        subcategory: product.subcategory
      };

      expect(lineItem.productId).toBe('prod-123');
      expect(lineItem.productName).toBe('Test Product');
      expect(lineItem.unit).toBe('each'); // Default value
      expect(lineItem.unitPrice).toBeUndefined();
    });
  });

  describe('RequestFormData to SalesRequest Compatibility', () => {
    it('should map RequestFormData to SalesRequest', () => {
      const formData: RequestFormData = {
        contact: {
          personId: 123,
          name: 'John Doe',
          email: 'john@example.com',
          mineGroup: 'Group A',
          mineName: 'Mine 1'
        },
        lineItems: [
          {
            id: 'line-1',
            productId: 'prod-1',
            productName: 'Laptop',
            quantity: 2,
            unit: 'each',
            unitPrice: 999.99,
            totalPrice: 1999.98
          }
        ],
        notes: 'Urgent delivery'
      };

      // Simulate creating SalesRequest from form data
      const salesRequest: Omit<SalesRequest, 'id' | 'qrId' | 'status' | 'createdAt' | 'updatedAt'> = {
        contactPersonId: formData.contact.personId,
        contactName: formData.contact.name,
        contactEmail: formData.contact.email,
        mineGroup: formData.contact.mineGroup,
        mineName: formData.contact.mineName,
        lineItems: formData.lineItems,
        notes: formData.notes,
        totalValue: formData.lineItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
      };

      expect(salesRequest.contactPersonId).toBe(123);
      expect(salesRequest.contactName).toBe('John Doe');
      expect(salesRequest.lineItems).toHaveLength(1);
      expect(salesRequest.totalValue).toBe(1999.98);
      expect(salesRequest.notes).toBe('Urgent delivery');
    });
  });

  describe('Type Narrowing and Guards', () => {
    it('should narrow Contact type with type guard', () => {
      const isContactWithEmail = (contact: Contact): contact is Contact & { email: string } => {
        return typeof contact.email === 'string' && contact.email.length > 0;
      };

      const contactWithEmail: Contact = {
        personId: 123,
        name: 'John Doe',
        email: 'john@example.com',
        mineGroup: 'Group A',
        mineName: 'Mine 1'
      };

      const contactWithoutEmail: Contact = {
        personId: 124,
        name: 'Jane Smith',
        mineGroup: 'Group A',
        mineName: 'Mine 1'
      };

      expect(isContactWithEmail(contactWithEmail)).toBe(true);
      expect(isContactWithEmail(contactWithoutEmail)).toBe(false);

      if (isContactWithEmail(contactWithEmail)) {
        // TypeScript should know email is defined here
        expect(contactWithEmail.email.includes('@')).toBe(true);
      }
    });

    it('should narrow LineItem type with price information', () => {
      const isLineItemWithPrice = (item: LineItem): item is LineItem & { unitPrice: number; totalPrice: number } => {
        return typeof item.unitPrice === 'number' && typeof item.totalPrice === 'number';
      };

      const itemWithPrice: LineItem = {
        id: 'line-1',
        productId: 'prod-1',
        productName: 'Laptop',
        quantity: 2,
        unit: 'each',
        unitPrice: 999.99,
        totalPrice: 1999.98
      };

      const itemWithoutPrice: LineItem = {
        id: 'line-2',
        productId: 'prod-2',
        productName: 'Mouse',
        quantity: 1,
        unit: 'each'
      };

      expect(isLineItemWithPrice(itemWithPrice)).toBe(true);
      expect(isLineItemWithPrice(itemWithoutPrice)).toBe(false);

      if (isLineItemWithPrice(itemWithPrice)) {
        expect(itemWithPrice.unitPrice * itemWithPrice.quantity).toBe(itemWithPrice.totalPrice);
      }
    });
  });

  describe('Utility Type Compatibility', () => {
    it('should work with Partial types', () => {
      const partialContact: Partial<Contact> = {
        personId: 123,
        name: 'John Doe'
        // Other fields are optional
      };

      const updateContact = (id: number, updates: Partial<Contact>): Contact => {
        // Simulate updating a contact
        const existingContact: Contact = {
          personId: id,
          name: 'Old Name',
          mineGroup: 'Group A',
          mineName: 'Mine 1'
        };

        return { ...existingContact, ...updates };
      };

      const updated = updateContact(123, partialContact);
      expect(updated.personId).toBe(123);
      expect(updated.name).toBe('John Doe');
      expect(updated.mineGroup).toBe('Group A'); // Preserved from existing
    });

    it('should work with Pick types', () => {
      type ContactSummary = Pick<Contact, 'personId' | 'name' | 'email'>;

      const createSummary = (contact: Contact): ContactSummary => {
        return {
          personId: contact.personId,
          name: contact.name,
          email: contact.email
        };
      };

      const fullContact: Contact = {
        personId: 123,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        mineGroup: 'Group A',
        mineName: 'Mine 1'
      };

      const summary = createSummary(fullContact);
      expect(summary.personId).toBe(123);
      expect(summary.name).toBe('John Doe');
      expect(summary.email).toBe('john@example.com');
      // phone, mineGroup, mineName should not be accessible
      expect('phone' in summary).toBe(false);
    });

    it('should work with Omit types', () => {
      type NewLineItem = Omit<LineItem, 'id'>;

      const createLineItem = (data: NewLineItem): LineItem => {
        return {
          id: `line-${Date.now()}`,
          ...data
        };
      };

      const newItemData: NewLineItem = {
        productId: 'prod-1',
        productName: 'Laptop',
        quantity: 1,
        unit: 'each'
      };

      const lineItem = createLineItem(newItemData);
      expect(lineItem.id).toMatch(/^line-\d+$/);
      expect(lineItem.productId).toBe('prod-1');
      expect(lineItem.quantity).toBe(1);
    });

    it('should work with Required types', () => {
      type CompleteContact = Required<Contact>;

      const validateCompleteContact = (contact: Contact): contact is CompleteContact => {
        return !!(
          contact.personId &&
          contact.name &&
          contact.email &&
          contact.phone &&
          contact.orgId &&
          contact.orgName &&
          contact.jobTitle &&
          contact.mineGroup &&
          contact.mineName
        );
      };

      const incompleteContact: Contact = {
        personId: 123,
        name: 'John Doe',
        mineGroup: 'Group A',
        mineName: 'Mine 1'
      };

      const completeContact: Contact = {
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

      expect(validateCompleteContact(incompleteContact)).toBe(false);
      expect(validateCompleteContact(completeContact)).toBe(true);
    });
  });

  describe('Array and Collection Compatibility', () => {
    it('should work with arrays of types', () => {
      const contacts: Contact[] = [
        {
          personId: 123,
          name: 'John Doe',
          mineGroup: 'Group A',
          mineName: 'Mine 1'
        },
        {
          personId: 124,
          name: 'Jane Smith',
          mineGroup: 'Group A',
          mineName: 'Mine 2'
        }
      ];

      const getContactNames = (contacts: Contact[]): string[] => {
        return contacts.map(contact => contact.name);
      };

      const names = getContactNames(contacts);
      expect(names).toEqual(['John Doe', 'Jane Smith']);
    });

    it('should work with Record types', () => {
      type ContactLookup = Record<number, Contact>;

      const contactLookup: ContactLookup = {
        123: {
          personId: 123,
          name: 'John Doe',
          mineGroup: 'Group A',
          mineName: 'Mine 1'
        },
        124: {
          personId: 124,
          name: 'Jane Smith',
          mineGroup: 'Group A',
          mineName: 'Mine 2'
        }
      };

      const getContactById = (lookup: ContactLookup, id: number): Contact | undefined => {
        return lookup[id];
      };

      const contact = getContactById(contactLookup, 123);
      expect(contact?.name).toBe('John Doe');

      const nonExistent = getContactById(contactLookup, 999);
      expect(nonExistent).toBeUndefined();
    });
  });
});
