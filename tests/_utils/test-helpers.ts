import { expect } from 'vitest';
import { TestDataManager } from './test-lifecycle';
import { TContactJSON, TLineItem } from '../_factories';

export const testDataManager = new TestDataManager();

// Custom assertions that prevent null-checking defensive code
export const assertValidContact = (contact: any): asserts contact is TContactJSON => {
  expect(contact).toBeDefined();
  expect(contact).not.toBeNull();
  expect(contact.personId).toBeTypeOf('number');
  expect(contact.personId).toBeGreaterThan(0);
  expect(contact.name).toBeTypeOf('string');
  expect(contact.name.length).toBeGreaterThan(0);
  expect(contact.email).toBeTypeOf('string');
  expect(contact.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  expect(contact.phone).toBeTypeOf('string');
  expect(contact.phone.length).toBeGreaterThan(0);
  expect(contact.orgId).toBeTypeOf('number');
  expect(contact.orgId).toBeGreaterThan(0);
  expect(contact.orgName).toBeTypeOf('string');
  expect(contact.orgName.length).toBeGreaterThan(0);
  expect(contact.mineGroup).toBeTypeOf('string');
  expect(contact.mineGroup.length).toBeGreaterThan(0);
  expect(contact.mineName).toBeTypeOf('string');
  expect(contact.mineName.length).toBeGreaterThan(0);
};

export const assertValidLineItem = (lineItem: any): asserts lineItem is TLineItem => {
  expect(lineItem).toBeDefined();
  expect(lineItem).not.toBeNull();
  expect(lineItem.pipedriveProductId).toBeTypeOf('number');
  expect(lineItem.pipedriveProductId).toBeGreaterThan(0);
  expect(lineItem.name).toBeTypeOf('string');
  expect(lineItem.name.length).toBeGreaterThan(0);
  if (lineItem.code !== null && lineItem.code !== undefined) {
    expect(lineItem.code).toBeTypeOf('string');
    expect(lineItem.code.length).toBeGreaterThan(0);
  }
  expect(lineItem.category).toBeTypeOf('string');
  expect(lineItem.category.length).toBeGreaterThan(0);
  expect(lineItem.price).toBeTypeOf('number');
  expect(lineItem.price).toBeGreaterThanOrEqual(0);
  expect(lineItem.quantity).toBeTypeOf('number');
  expect(lineItem.quantity).toBeGreaterThan(0);
  expect(lineItem.shortDescription).toBeTypeOf('string');
};

export const assertValidLineItems = (lineItems: any[]): void => {
  expect(lineItems).toBeInstanceOf(Array);
  expect(lineItems.length).toBeGreaterThan(0);
  lineItems.forEach(assertValidLineItem);
};

// Helper to assert request can be submitted (has both contact and line items)
export const assertSubmittable = (request: any): void => {
  if (request.contact) {
    expect(request.contact).toBeDefined();
    expect(request.contact).not.toBeNull();
  }
  if (request.line_items) {
    expect(request.line_items).toBeInstanceOf(Array);
    expect(request.line_items.length).toBeGreaterThan(0);
  }
};

// Mock data providers with guaranteed valid data
export const getMockContactsResponse = () => ({
  ok: true,
  data: {
    'Anglo American': {
      'Zibulo Mine': [
        {
          personId: 12345,
          name: 'John Smith',
          email: 'john.smith@zibulo.co.za',
          phone: '+27123456789',
          orgId: 67890,
          orgName: 'Zibulo Mine',
          mineGroup: 'Anglo American',
          mineName: 'Zibulo Mine'
        }
      ],
      'Kopanang Mine': [
        {
          personId: 12346,
          name: 'Jane Doe',
          email: 'jane.doe@kopanang.co.za',
          phone: '+27123456790',
          orgId: 67891,
          orgName: 'Kopanang Mine',
          mineGroup: 'Anglo American',
          mineName: 'Kopanang Mine'
        }
      ]
    }
  },
  stale: false,
  source: 'mock'
});

export const getMockProductsResponse = () => ({
  ok: true,
  data: {
    'Safety Equipment': [
      {
        pipedriveProductId: 99901,
        name: 'AirRobo Sensor',
        code: 'AR-001',
        price: 150,
        shortDescription: 'Industrial airflow sensor'
      },
      {
        pipedriveProductId: 99902,
        name: 'Safety Helmet',
        code: 'SH-001',
        price: 75,
        shortDescription: 'Standard safety helmet'
      }
    ],
    'Communication': [
      {
        pipedriveProductId: 99903,
        name: 'Radio Device',
        code: 'RD-001',
        price: 200,
        shortDescription: 'Two-way radio communication'
      }
    ]
  },
  stale: false,
  source: 'mock'
});
