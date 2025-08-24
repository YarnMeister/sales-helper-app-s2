## Section 4: Testing Infrastructure

### 4.1 Unit Test Framework
**Goal:** Establish comprehensive unit testing for all core functions

[Before we start, need to revisit to figure out "test data seeding" and make sure we don't break stuff again with fixtures][]

**Cursor Prompt:**
```
Create comprehensive unit testing infrastructure with proper test data management.

Create `/tests/_utils/test-data.ts`:

import { TRequestUpsert, TContactJSON, TLineItem } from '../../lib/schema';

export const createTestContact = (overrides: Partial<TContactJSON> = {}): TContactJSON => ({
  personId: 12345,
  name: 'John Doe',
  email: 'john.doe@testmine.com',
  phone: '+27123456789',
  orgId: 67890,
  orgName: 'Test Mine',
  mineGroup: 'Test Group',
  mineName: 'Test Mine',
  ...overrides
});

export const createTestLineItem = (overrides: Partial<TLineItem> = {}): TLineItem => ({
  pipedriveProductId: 99901,
  name: 'Test Product',
  code: 'TP-001',
  category: 'Safety Equipment',
  price: 150.0,
  quantity: 2,
  shortDescription: 'Test product description',
  ...overrides
});

export const createTestRequest = (overrides: Partial<TRequestUpsert> = {}): TRequestUpsert => ({
  salespersonFirstName: 'Test User',
  mineGroup: 'Test Group',
  mineName: 'Test Mine',
  contact: createTestContact(),
  line_items: [createTestLineItem()],
  comment: 'Test comment',
  ...overrides
});

export const createTestRequestForDB = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  request_id: 'QR-001',
  status: 'draft' as const,
  salesperson_first_name: 'Test User',
  mine_group: 'Test Group',
  mine_name: 'Test Mine',
  contact: createTestContact(),
  line_items: [createTestLineItem()],
  comment: 'Test comment',
  pipedrive_deal_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

Create `/tests/_utils/db-cleanup.ts`:

import { getDb } from '../../lib/db';
import { log } from '../../lib/log';

export const cleanupTestData = async (maxAgeMinutes: number = 120) => {
  const db = getDb();
  const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
  
  try {
    // Clean test requests
    const { error: requestsError } = await db
      .from('requests')
      .delete()
      .lt('created_at', cutoff.toISOString());
    
    if (requestsError) {
      log('Error cleaning test requests', { error: requestsError });
    }
    
    // Clean cache entries
    const { error: cacheError } = await db
      .from('kv_cache')
      .delete()
      .lt('updated_at', cutoff.toISOString());
    
    if (cacheError) {
      log('Error cleaning test cache', { error: cacheError });
    }
    
    // Clean mock submissions
    const { error: mockError } = await db
      .from('mock_pipedrive_submissions')
      .delete()
      .lt('created_at', cutoff.toISOString());
    
    if (mockError) {
      log('Error cleaning mock submissions', { error: mockError });
    }
    
    log('Test data cleanup completed');
    
  } catch (error) {
    log('Test cleanup failed', { error });
  }
};

export const seedTestRequest = async (requestData = {}) => {
  const db = getDb();
  const testRequest = createTestRequestForDB(requestData);
  
  const { data, error } = await db
    .from('requests')
    .insert(testRequest)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to seed test request: ${error.message}`);
  }
  
  return data;
};

Create `/tests/unit/schema.test.ts`:

import { describe, it, expect } from 'vitest';
import { RequestUpsert, ContactJSON, LineItem } from '../../lib/schema';
import { createTestContact, createTestLineItem, createTestRequest } from '../_utils/test-data';

describe('Schema Validation', () => {
  describe('ContactJSON', () => {
    it('should validate valid contact data', () => {
      const contact = createTestContact();
      const result = ContactJSON.safeParse(contact);
      expect(result.success).toBe(true);
    });
    
    it('should reject contact with invalid personId', () => {
      const contact = createTestContact({ personId: 'not-a-number' as any });
      const result = ContactJSON.safeParse(contact);
      expect(result.success).toBe(false);
    });
    
    it('should reject contact with invalid email', () => {
      const contact = createTestContact({ email: 'not-an-email' });
      const result = ContactJSON.safeParse(contact);
      expect(result.success).toBe(false);
    });
  });
  
  describe('LineItem', () => {
    it('should validate valid line item data', () => {
      const lineItem = createTestLineItem();
      const result = LineItem.safeParse(lineItem);
      expect(result.success).toBe(true);
    });
    
    it('should reject line item with invalid quantity', () => {
      const lineItem = createTestLineItem({ quantity: 0 });
      const result = LineItem.safeParse(lineItem);
      expect(result.success).toBe(false);
    });
    
    it('should apply default values correctly', () => {
      const minimal = { pipedriveProductId: 123, name: 'Test' };
      const result = LineItem.parse(minimal);
      expect(result.price).toBe(0);
      expect(result.quantity).toBe(1);
    });
  });
  
  describe('RequestUpsert', () => {
    it('should validate complete request data', () => {
      const request = createTestRequest();
      const result = RequestUpsert.safeParse(request);
      expect(result.success).toBe(true);
    });
    
    it('should handle minimal request data', () => {
      const minimal = {};
      const result = RequestUpsert.parse(minimal);
      expect(result.line_items).toEqual([]);
    });
  });
});

Create `/tests/unit/cache.test.ts`:

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KVCache } from '../../lib/cache';
import { cleanupTestData } from '../_utils/db-cleanup';

describe('KVCache', () => {
  let cache: KVCache;
  
  beforeEach(() => {
    cache = new KVCache();
  });
  
  afterEach(async () => {
    await cleanupTestData(5); // Clean data older than 5 minutes
  });
  
  it('should set and get cache values', async () => {
    const key = `test-cache-${Date.now()}`;
    const value = { test: 'data', timestamp: Date.now() };
    
    await cache.set(key, value);
    const result = await cache.get(key);
    
    expect(result).toBeTruthy();
    expect(result?.data).toEqual(value);
    expect(result?.stale).toBe(false);
  });
  
  it('should return null for non-existent keys', async () => {
    const result = await cache.get('non-existent-key');
    expect(result).toBeNull();
  });
  
  it('should bust cache entries', async () => {
    const key = `test-cache-${Date.now()}`;
    const value = { test: 'data' };
    
    await cache.set(key, value);
    await cache.bust(key);
    
    const result = await cache.get(key);
    expect(result).toBeNull();
  });
});

Create `/tests/unit/db.test.ts`:

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb, generateRequestId } from '../../lib/db';
import { cleanupTestData, seedTestRequest } from '../_utils/db-cleanup';

describe('Database utilities', () => {
  beforeEach(async () => {
    await cleanupTestData(5);
  });
  
  afterEach(async () => {
    await cleanupTestData(5);
  });
  
  it('should create database client', () => {
    const db = getDb();
    expect(db).toBeDefined();
  });
  
  it('should generate sequential request IDs', async () => {
    // Seed a known request ID
    await seedTestRequest({ request_id: 'QR-005' });
    
    const nextId = await generateRequestId();
    expect(nextId).toBe('QR-006');
  });
  
  it('should handle empty database for ID generation', async () => {
    // Clean all requests first
    const db = getDb();
    await db.from('requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const firstId = await generateRequestId();
    expect(firstId).toBe('QR-001');
  });
});

Update `/vitest.config.ts`:

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});

Create `/tests/setup.ts`:

import { beforeAll, afterAll } from 'vitest';
import { cleanupTestData } from './_utils/db-cleanup';

beforeAll(async () => {
  // Clean old test data before starting
  await cleanupTestData(120);
});

afterAll(async () => {
  // Clean test data after all tests
  await cleanupTestData(120);
});
```

**Manual Validation Steps:**
- [ ] Run `npm run test:unit` and verify all tests pass
- [ ] Check test data is properly isolated (no conflicts between tests)
- [ ] Verify test cleanup removes old data without affecting other tests
- [ ] Test schema validation catches both valid and invalid data correctly
- [ ] Test cache functions work with real database connections
- [ ] Test database utilities handle edge cases (empty DB, sequential IDs)
- [ ] Verify test setup and teardown functions properly

**Checkbox:** - [ ] 4.1 Unit Test Framework Complete

---

### 4.2 Integration Testing
**Goal:** Test API endpoints with real database interactions

**Cursor Prompt:**
```
Create integration tests that verify API endpoints work correctly with the database.

Create `/tests/_utils/test-server.ts`:

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

let server: any = null;
let app: any = null;

export const startTestServer = async (port: number = 3001) => {
  if (server) return;
  
  const dev = process.env.NODE_ENV !== 'production';
  app = next({ dev, quiet: true });
  const handle = app.getRequestHandler();
  
  await app.prepare();
  
  server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });
  
  return new Promise<void>((resolve) => {
    server.listen(port, () => {
      console.log(`Test server ready on http://localhost:${port}`);
      resolve();
    });
  });
};

export const stopTestServer = async () => {
  if (server) {
    await new Promise<void>((resolve) => {
      server.close(() => {
        server = null;
        resolve();
      });
    });
  }
  if (app) {
    await app.close();
    app = null;
  }
};

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = 'http://localhost:3001';
  const response = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  const data = await response.json();
  return { ...data, status: response.status, headers: response.headers };
};

Create `/tests/integration/requests-api.integration.test.ts`:

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestServer, stopTestServer, apiCall } from '../_utils/test-server';
import { cleanupTestData, seedTestRequest } from '../_utils/db-cleanup';
import { createTestRequestForDB, createTestContact, createTestLineItem } from '../_utils/test-data';

describe('Requests API Integration', () => {
  beforeAll(async () => {
    await startTestServer();
  });
  
  afterAll(async () => {
    await stopTestServer();
    await cleanupTestData(5);
  });
  
  beforeEach(async () => {
    await cleanupTestData(5);
  });
  
  it('should create new request via POST', async () => {
    const requestData = {
      salespersonFirstName: 'Integration Test',
      contact: {
        personId: 12345,
        name: 'Test Contact'
      },
      line_items: [{
        pipedriveProductId: 456,
        name: 'Test Product',
        quantity: 2
      }],
      comment: 'Integration test comment'
    };
    
    const response = await apiCall('/api/requests', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    
    expect(response.ok).toBe(true);
    expect(response.data.request_id).toMatch(/^QR-\d{3}$/);
    expect(response.data.status).toBe('draft');
    expect(response.data.salesperson_first_name).toBe('Integration Test');
  });
  
  it('should fetch requests via GET', async () => {
    // Seed test data
    await seedTestRequest({
      request_id: 'QR-TEST-001',
      salesperson_first_name: 'Test Fetch User'
    });
    
    const response = await apiCall('/api/requests');
    
    expect(response.ok).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
    
    const testRequest = response.data.find(r => r.request_id === 'QR-TEST-001');
    expect(testRequest).toBeTruthy();
    expect(testRequest.salesperson_first_name).toBe('Test Fetch User');
  });
  
  it('should filter requests by status', async () => {
    await seedTestRequest({ request_id: 'QR-DRAFT', status: 'draft' });
    await seedTestRequest({ request_id: 'QR-SUBMITTED', status: 'submitted' });
    
    const draftResponse = await apiCall('/api/requests?status=draft');
    const submittedResponse = await apiCall('/api/requests?status=submitted');
    
    expect(draftResponse.ok).toBe(true);
    expect(submittedResponse.ok).toBe(true);
    
    expect(draftResponse.data.some(r => r.request_id === 'QR-DRAFT')).toBe(true);
    expect(draftResponse.data.some(r => r.request_id === 'QR-SUBMITTED')).toBe(false);
    
    expect(submittedResponse.data.some(r => r.request_id === 'QR-SUBMITTED')).toBe(true);
    expect(submittedResponse.data.some(r => r.request_id === 'QR-DRAFT')).toBe(false);
  });
  
  it('should update existing request', async () => {
    const original = await seedTestRequest({
      request_id: 'QR-UPDATE-TEST',
      comment: 'Original comment'
    });
    
    const updateData = {
      id: original.id,
      comment: 'Updated comment'
    };
    
    const response = await apiCall('/api/requests', {
      method: 'POST',
      body: JSON.stringify(updateData)
    });
    
    expect(response.ok).toBe(true);
    expect(response.data.comment).toBe('Updated comment');
    expect(response.data.request_id).toBe('QR-UPDATE-TEST');
  });
  
  it('should delete request', async () => {
    const testRequest = await seedTestRequest({
      request_id: 'QR-DELETE-TEST'
    });
    
    const deleteResponse = await apiCall(`/api/requests?id=${testRequest.id}`, {
      method: 'DELETE'
    });
    
    expect(deleteResponse.ok).toBe(true);
    
    // Verify deletion
    const fetchResponse = await apiCall('/api/requests');
    const deletedRequest = fetchResponse.data.find(r => r.id === testRequest.id);
    expect(deletedRequest).toBeUndefined();
  });
});

Create `/tests/integration/prd-requirements.integration.test.ts`:

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestServer, stopTestServer, apiCall } from '../_utils/test-server';
import { cleanupTestData, seedTestRequest } from '../_utils/db-cleanup';
import { createTestContact, createTestLineItem, createTestRequestForDB } from '../_utils/test-data';

describe('PRD Requirements Tests', () => {
  beforeAll(async () => {
    await startTestServer();
  });
  
  afterAll(async () => {
    await stopTestServer();
    await cleanupTestData(5);
  });
  
  beforeEach(async () => {
    await cleanupTestData(5);
  });
  
  it('should hide New Request button when showAll=true', async () => {
    const response = await apiCall('/api/requests?showAll=true');
    expect(response.ok).toBe(true);
    expect(response.showNewButton).toBe(false);
  });
  
  it('should show New Request button when showAll=false or not provided', async () => {
    const defaultResponse = await apiCall('/api/requests');
    expect(defaultResponse.ok).toBe(true);
    expect(defaultResponse.showNewButton).toBe(true);
    
    const explicitFalseResponse = await apiCall('/api/requests?showAll=false');
    expect(explicitFalseResponse.ok).toBe(true);
    expect(explicitFalseResponse.showNewButton).toBe(true);
  });
  
  it('should enable Submit only when contact AND line_items exist', async () => {
    // Test PRD submit button logic - start with empty request
    const draftRequest = await seedTestRequest({ 
      request_id: 'QR-SUBMIT-TEST',
      contact: null, 
      line_items: []
    });
    
    let response = await apiCall(`/api/requests/${draftRequest.id}`);
    expect(response.data.canSubmit).toBe(false);
    
    // Add contact only
    await apiCall('/api/requests', {
      method: 'POST',
      body: JSON.stringify({
        id: draftRequest.id,
        contact: createTestContact()
      })
    });
    
    response = await apiCall(`/api/requests/${draftRequest.id}`);
    expect(response.data.canSubmit).toBe(false); // Still no line items
    
    // Add line items
    await apiCall('/api/requests', {
      method: 'POST', 
      body: JSON.stringify({
        id: draftRequest.id,
        line_items: [createTestLineItem()]
      })
    });
    
    response = await apiCall(`/api/requests/${draftRequest.id}`);
    expect(response.data.canSubmit).toBe(true); // Both present
  });
  
  it('should disable Submit when only contact exists', async () => {
    const draftRequest = await seedTestRequest({
      request_id: 'QR-CONTACT-ONLY',
      contact: createTestContact(),
      line_items: []
    });
    
    const response = await apiCall(`/api/requests/${draftRequest.id}`);
    expect(response.data.canSubmit).toBe(false);
  });
  
  it('should disable Submit when only line items exist', async () => {
    const draftRequest = await seedTestRequest({
      request_id: 'QR-ITEMS-ONLY', 
      contact: null,
      line_items: [createTestLineItem()]
    });
    
    const response = await apiCall(`/api/requests/${draftRequest.id}`);
    expect(response.data.canSubmit).toBe(false);
  });
  
  it('should support comment auto-save on focus loss', async () => {
    const draftRequest = await seedTestRequest({
      request_id: 'QR-COMMENT-TEST',
      comment: 'Original comment'
    });
    
    // Simulate comment update (auto-save behavior)
    const updateResponse = await apiCall('/api/requests', {
      method: 'POST',
      body: JSON.stringify({
        id: draftRequest.id,
        comment: 'Auto-saved comment'
      })
    });
    
    expect(updateResponse.ok).toBe(true);
    expect(updateResponse.data.comment).toBe('Auto-saved comment');
    
    // Verify comment persisted
    const fetchResponse = await apiCall(`/api/requests/${draftRequest.id}`);
    expect(fetchResponse.data.comment).toBe('Auto-saved comment');
  });
  
  it('should handle empty comment correctly', async () => {
    const draftRequest = await seedTestRequest({
      request_id: 'QR-EMPTY-COMMENT',
      comment: 'Some comment'
    });
    
    // Clear comment
    const updateResponse = await apiCall('/api/requests', {
      method: 'POST',
      body: JSON.stringify({
        id: draftRequest.id,
        comment: ''
      })
    });
    
    expect(updateResponse.ok).toBe(true);
    expect(updateResponse.data.comment).toBe('');
  });
  
  it('should maintain request status during updates', async () => {
    const draftRequest = await seedTestRequest({
      request_id: 'QR-STATUS-TEST',
      status: 'draft'
    });
    
    // Update comment should not change status
    const updateResponse = await apiCall('/api/requests', {
      method: 'POST',
      body: JSON.stringify({
        id: draftRequest.id,
        comment: 'Updated comment'
      })
    });
    
    expect(updateResponse.ok).toBe(true);
    expect(updateResponse.data.status).toBe('draft');
  });
});

Create `/tests/integration/submit-api.integration.test.ts`:

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startTestServer, stopTestServer, apiCall } from '../_utils/test-server';
import { cleanupTestData, seedTestRequest } from '../_utils/db-cleanup';
import { getDb } from '../../lib/db';

describe('Submit API Integration', () => {
  beforeAll(async () => {
    await startTestServer();
    // Ensure we're in mock mode for tests
    process.env.PIPEDRIVE_SUBMIT_MODE = 'mock';
  });
  
  afterAll(async () => {
    await stopTestServer();
    await cleanupTestData(5);
  });
  
  beforeEach(async () => {
    await cleanupTestData(5);
  });
  
  it('should submit request in mock mode', async () => {
    const testRequest = await seedTestRequest({
      request_id: 'QR-SUBMIT-TEST',
      status: 'draft',
      contact: {
        personId: 12345,
        name: 'Test Contact'
      },
      line_items: [{
        pipedriveProductId: 456,
        name: 'Test Product',
        quantity: 1
      }]
    });
    
    const response = await apiCall('/api/submit', {
      method: 'POST',
      body: JSON.stringify({ id: testRequest.id })
    });
    
    expect(response.ok).toBe(true);
    expect(response.mode).toBe('mock');
    expect(response.dealId).toBeDefined();
    expect(response.dealUrl).toContain('mock-deal');
    
    // Verify mock submission was recorded
    const db = getDb();
    const { data: mockSubmission } = await db
      .from('mock_pipedrive_submissions')
      .select('*')
      .eq('request_id', 'QR-SUBMIT-TEST')
      .single();
    
    expect(mockSubmission).toBeTruthy();
    expect(mockSubmission.simulated_deal_id).toBe(response.dealId);
    
    // Verify request status updated
    const { data: updatedRequest } = await db
      .from('requests')
      .select('*')
      .eq('id', testRequest.id)
      .single();
    
    expect(updatedRequest.status).toBe('submitted');
    expect(updatedRequest.pipedrive_deal_id).toBe(response.dealId);
  });
  
  it('should reject submission without contact', async () => {
    const testRequest = await seedTestRequest({
      request_id: 'QR-NO-CONTACT',
      contact: null,
      line_items: [{
        pipedriveProductId: 456,
        name: 'Test Product',
        quantity: 1
      }]
    });
    
    const response = await apiCall('/api/submit', {
      method: 'POST',
      body: JSON.stringify({ id: testRequest.id })
    });
    
    expect(response.ok).toBe(false);
    expect(response.status).toBe(422);
    expect(response.message).toContain('contact');
  });
  
  it('should reject submission without line items', async () => {
    const testRequest = await seedTestRequest({
      request_id: 'QR-NO-ITEMS',
      contact: {
        personId: 12345,
        name: 'Test Contact'
      },
      line_items: []
    });
    
    const response = await apiCall('/api/submit', {
      method: 'POST',
      body: JSON.stringify({ id: testRequest.id })
    });
    
    expect(response.ok).toBe(false);
    expect(response.status).toBe(422);
    expect(response.message).toContain('line item');
  });
});

Create `/tests/integration/cache-api.integration.test.ts`:

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { startTestServer, stopTestServer, apiCall } from '../_utils/test-server';
import { cleanupTestData } from '../_utils/db-cleanup';

// Mock Pipedrive API calls
vi.mock('../../lib/pipedrive', () => ({
  fetchContacts: vi.fn().mockResolvedValue({
    persons: [
      {
        id: 1,
        name: 'Test Person',
        email: [{ value: 'test@example.com' }],
        phone: [{ value: '+1234567890' }],
        org_id: { value: 1, name: 'Test Org' }
      }
    ],
    organizations: [
      {
        id: 1,
        name: 'Test Org',
        your_mine_group_field_id: 'Test Group'
      }
    ]
  }),
  fetchProducts: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: 'Test Product',
      category: '1',
      price: 100,
      code: 'TP-001'
    }
  ])
}));

describe('Cache API Integration', () => {
  beforeAll(async () => {
    await startTestServer();
  });
  
  afterAll(async () => {
    await stopTestServer();
    await cleanupTestData(5);
  });
  
  beforeEach(async () => {
    await cleanupTestData(5);
  });
  
  it('should cache and serve contacts data', async () => {
    // First call should fetch from Pipedrive and cache
    const firstResponse = await apiCall('/api/contacts');
    
    expect(firstResponse.ok).toBe(true);
    expect(firstResponse.stale).toBe(false);
    expect(firstResponse.source).toBe('pipedrive');
    expect(firstResponse.data).toBeDefined();
    
    // Second call should serve from cache
    const secondResponse = await apiCall('/api/contacts');
    
    expect(secondResponse.ok).toBe(true);
    expect(secondResponse.stale).toBe(false);
    expect(secondResponse.source).toBe('cache');
  });
  
  it('should cache and serve products data', async () => {
    // First call should fetch from Pipedrive and cache
    const firstResponse = await apiCall('/api/products');
    
    expect(firstResponse.ok).toBe(true);
    expect(firstResponse.stale).toBe(false);
    expect(firstResponse.source).toBe('pipedrive');
    expect(firstResponse.data).toBeDefined();
    
    // Second call should serve from cache
    const secondResponse = await apiCall('/api/products');
    
    expect(secondResponse.ok).toBe(true);
    expect(secondResponse.stale).toBe(false);
    expect(secondResponse.source).toBe('cache');
  });
  
  it('should bust cache and refetch data', async () => {
    // Cache initial data
    await apiCall('/api/contacts');
    
    // Bust cache
    const bustResponse = await apiCall('/api/cache/bust', {
      method: 'POST',
      body: JSON.stringify({ keys: ['contacts:v1'] })
    });
    
    expect(bustResponse.ok).toBe(true);
    
    // Next call should fetch fresh data
    const freshResponse = await apiCall('/api/contacts');
    
    expect(freshResponse.ok).toBe(true);
    expect(freshResponse.source).toBe('pipedrive');
  });
  
  it('should list cached keys', async () => {
    // Cache some data
    await apiCall('/api/contacts');
    await apiCall('/api/products');
    
    // List cache keys
    const cacheResponse = await apiCall('/api/cache');
    
    expect(cacheResponse.ok).toBe(true);
    expect(cacheResponse.data).toBeDefined();
    expect(cacheResponse.data.some(item => item.key === 'contacts:v1')).toBe(true);
    expect(cacheResponse.data.some(item => item.key === 'products:v1')).toBe(true);
  });
});
```

**Manual Validation Steps:**
- [ ] Run `npm run test:integration` and verify all tests pass
- [ ] Test GET /api/contacts returns hierarchical data (Mine Group → Mine → Contacts)
- [ ] Test GET /api/products returns categorized data (Category → Products)
- [ ] Test cache behavior: first call fetches from Pipedrive, second serves from cache
- [ ] Test offline tolerance: disconnect internet, verify stale cache served with proper flags
- [ ] Test cache busting: POST to /api/cache with keys array
- [ ] Test GET /api/cache shows all cached keys with timestamps and ages
- [ ] Test health endpoint shows current environment and mode
- [ ] Verify response format includes `stale` and `source` fields
- [ ] Test PRD-specific requirements: showAll parameter, submit button logic, comment auto-save

**Checkbox:** - [ ] 4.2 Integration Testing Complete

---

### 4.3 End-to-End Testing
**Goal:** Create comprehensive E2E test for the complete submission workflow

**Cursor Prompt:**
```
Create Playwright E2E tests for the complete submission workflow.

Create `/playwright.config.ts`:

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run serially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3010',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 }, // Mobile-first viewport
      },
    },
  ],
  webServer: {
    command: 'npm run dev:mock',
    port: 3010,
    reuseExistingServer: !process.env.CI,
    timeout: 30 * 1000,
    env: {
      APP_ENV: 'test',
      PIPEDRIVE_SUBMIT_MODE: 'mock',
    },
  },
});

Create `/tests/e2e/pages/main-page.ts`:

import { Page, Locator, expect } from '@playwright/test';

export class MainPage {
  readonly page: Page;
  readonly newRequestButton: Locator;
  readonly requestsList: Locator;
  readonly addContactButton: Locator;
  readonly addLineItemButton: Locator;
  readonly addCommentButton: Locator;
  readonly submitButton: Locator;
  readonly statusBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newRequestButton = page.getByTestId('sh-main-new-request-button');
    this.requestsList = page.getByTestId('sh-main-requests-list');
    this.addContactButton = page.getByTestId('sh-request-add-contact-button');
    this.addLineItemButton = page.getByTestId('sh-request-add-lineitem-button');
    this.addCommentButton = page.getByTestId('sh-request-add-comment-button');
    this.submitButton = page.getByTestId('sh-request-submit-button');
    this.statusBadge = page.getByTestId('sh-request-status-badge');
  }

  async goto() {
    await this.page.goto('/');
  }

  async createNewRequest() {
    await this.newRequestButton.click();
    // Wait for new request to appear in the list
    await this.page.waitForTimeout(1000);
  }

  async getFirstDraftRequest() {
    const firstDraft = this.requestsList.locator('[data-status="draft"]').first();
    await expect(firstDraft).toBeVisible();
    return firstDraft;
  }

  async addContact(mineGroup: string, mineName: string, contactName: string) {
    await this.addContactButton.click();
    
    // Wait for contacts page to load
    await this.page.waitForLoadState('networkidle');
    
    // Select mine group
    const mineGroupAccordion = this.page.getByTestId(`sh-contacts-group-${mineGroup.replace(/\s+/g, '-').toLowerCase()}`);
    await mineGroupAccordion.click();
    
    // Select mine name
    const mineNameAccordion = this.page.getByTestId(`sh-contacts-mine-${mineName.replace(/\s+/g, '-').toLowerCase()}`);
    await mineNameAccordion.click();
    
    // Select contact
    const contactOption = this.page.getByTestId(`sh-contacts-person-${contactName.replace(/\s+/g, '-').toLowerCase()}`);
    await contactOption.click();
    
    // Save selection
    const saveButton = this.page.getByTestId('sh-contacts-save-button');
    await saveButton.click();
    
    // Wait to return to main page
    await this.page.waitForURL('/');
  }

  async addLineItem(category: string, productName: string, quantity: number = 1) {
    await this.addLineItemButton.click();
    
    // Wait for products page to load
    await this.page.waitForLoadState('networkidle');
    
    // Select category
    const categoryAccordion = this.page.getByTestId(`sh-products-category-${category.replace(/\s+/g, '-').toLowerCase()}`);
    await categoryAccordion.click();
    
    // Select product
    const productOption = this.page.getByTestId(`sh-products-item-${productName.replace(/\s+/g, '-').toLowerCase()}`);
    await productOption.click();
    
    // Set quantity if different from 1
    if (quantity !== 1) {
      const quantityInput = this.page.getByTestId(`sh-products-quantity-${productName.replace(/\s+/g, '-').toLowerCase()}`);
      await quantityInput.fill(quantity.toString());
    }
    
    // Save selection
    const saveButton = this.page.getByTestId('sh-products-save-button');
    await saveButton.click();
    
    // Wait to return to main page
    await this.page.waitForURL('/');
  }

  async addComment(comment: string) {
    await this.addCommentButton.click();
    
    // Type in comment input
    const commentInput = this.page.getByTestId('sh-request-comment-input');
    await commentInput.fill(comment);
    
    // Click outside to save (lose focus)
    await this.page.click('body');
    await this.page.waitForTimeout(500);
  }

  async submitRequest() {
    await this.submitButton.click();
    
    // Wait for submission to complete
    await this.page.waitForTimeout(2000);
  }

  async verifySubmissionSuccess(requestId: string) {
    // Check status changed to submitted
    await expect(this.statusBadge).toContainText('Submitted');
    
    // Check "See Deal" button appears
    const seeDealButton = this.page.getByTestId('sh-request-see-deal-button');
    await expect(seeDealButton).toBeVisible();
    
    // Verify mock submission in database
    const response = await this.page.request.get(`/api/requests?status=submitted`);
    const data = await response.json();
    
    const submittedRequest = data.data.find((r: any) => r.request_id === requestId);
    expect(submittedRequest).toBeTruthy();
    expect(submittedRequest.status).toBe('submitted');
    expect(submittedRequest.pipedrive_deal_id).toBeTruthy();
  }
}

Create `/tests/e2e/specs/submit-workflow.e2e.spec.ts`:

import { test, expect } from '@playwright/test';
import { MainPage } from '../pages/main-page';

test.describe('Complete Submit Workflow', () => {
  let mainPage: MainPage;
  
  test.beforeEach(async ({ page }) => {
    mainPage = new MainPage(page);
    
    // Clean up any existing test data
    await page.request.delete('/api/test-cleanup');
    
    // Mock Pipedrive data for consistent testing
    await page.route('**/api/contacts', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            'Test Group': {
              'Test Mine': [
                {
                  personId: 12345,
                  name: 'John Doe',
                  email: 'john@testmine.com',
                  phone: '+27123456789',
                  orgId: 67890,
                  orgName: 'Test Mine',
                  mineGroup: 'Test Group',
                  mineName: 'Test Mine'
                }
              ]
            }
          },
          stale: false,
          source: 'mock'
        })
      });
    });
    
    await page.route('**/api/products', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            'Safety Equipment': [
              {
                pipedriveProductId: 99901,
                name: 'Safety Helmet',
                code: 'SH-001',
                price: 150,
                shortDescription: 'Industrial safety helmet'
              }
            ]
          },
          stale: false,
          source: 'mock'
        })
      });
    });
    
    await mainPage.goto();
  });
  
  test('should complete full submission workflow', async ({ page }) => {
    // Step 1: Create new request
    await mainPage.createNewRequest();
    
    // Step 2: Add contact
    await mainPage.addContact('Test Group', 'Test Mine', 'John Doe');
    
    // Verify contact was added
    const contactDisplay = page.getByTestId('sh-request-contact-display');
    await expect(contactDisplay).toContainText('John Doe');
    await expect(contactDisplay).toContainText('Test Mine');
    
    // Step 3: Add line item
    await mainPage.addLineItem('Safety Equipment', 'Safety Helmet', 2);
    
    // Verify line item was added
    const lineItemDisplay = page.getByTestId('sh-request-lineitems-display');
    await expect(lineItemDisplay).toContainText('Safety Helmet');
    await expect(lineItemDisplay).toContainText('Qty: 2');
    
    // Step 4: Add comment
    await mainPage.addComment('Test comment for E2E submission');
    
    // Verify comment was added
    const commentDisplay = page.getByTestId('sh-request-comment-display');
    await expect(commentDisplay).toContainText('Test comment for E2E submission');
    
    // Step 5: Verify submit button is enabled
    await expect(mainPage.submitButton).toBeEnabled();
    
    // Step 6: Submit request
    await mainPage.submitRequest();
    
    // Step 7: Verify submission success
    const requestId = await page.getByTestId('sh-request-id').textContent();
    await mainPage.verifySubmissionSuccess(requestId!);
    
    // Step 8: Verify mock submission was recorded
    const mockResponse = await page.request.get('/api/mock-submissions');
    const mockData = await mockResponse.json();
    
    const mockSubmission = mockData.data.find((s: any) => s.request_id === requestId);
    expect(mockSubmission).toBeTruthy();
    expect(mockSubmission.status).toBe('Submitted');
  });
  
  test('should prevent submission without contact', async ({ page }) => {
    // Create new request
    await mainPage.createNewRequest();
    
    // Add only line item (no contact)
    await mainPage.addLineItem('Safety Equipment', 'Safety Helmet');
    
    // Submit button should be disabled
    await expect(mainPage.submitButton).toBeDisabled();
  });
  
  test('should prevent submission without line items', async ({ page }) => {
    // Create new request
    await mainPage.createNewRequest();
    
    // Add only contact (no line items)
    await mainPage.addContact('Test Group', 'Test Mine', 'John Doe');
    
    // Submit button should be disabled
    await expect(mainPage.submitButton).toBeDisabled();
  });
  
  test('should allow editing and resubmission', async ({ page }) => {
    // Complete first submission
    await mainPage.createNewRequest();
    await mainPage.addContact('Test Group', 'Test Mine', 'John Doe');
    await mainPage.addLineItem('Safety Equipment', 'Safety Helmet');
    await mainPage.submitRequest();
    
    // Verify initial submission
    await expect(mainPage.statusBadge).toContainText('Submitted');
    
    // Edit the submitted request (add comment)
    await mainPage.addComment('Updated comment after submission');
    
    // Should be able to submit again
    await expect(mainPage.submitButton).toBeEnabled();
    await mainPage.submitRequest();
    
    // Verify updated submission
    const commentDisplay = page.getByTestId('sh-request-comment-display');
    await expect(commentDisplay).toContainText('Updated comment after submission');
  });
  
  test('should test PRD comment auto-save behavior', async ({ page }) => {
    // Create new request
    await mainPage.createNewRequest();
    
    // Add comment
    await mainPage.addCommentButton.click();
    const commentInput = page.getByTestId('sh-request-comment-input');
    await commentInput.fill('Auto-save test comment');
    
    // Simulate focus loss by clicking elsewhere (auto-save trigger)
    await page.click('body');
    await page.waitForTimeout(1000);
    
    // Refresh page to verify auto-save worked
    await page.reload();
    
    // Verify comment persisted
    const commentDisplay = page.getByTestId('sh-request-comment-display');
    await expect(commentDisplay).toContainText('Auto-save test comment');
  });
});

Create `/tests/e2e/specs/prd-requirements.e2e.spec.ts`:

import { test, expect } from '@playwright/test';
import { MainPage } from '../pages/main-page';

test.describe('PRD Requirements E2E', () => {
  let mainPage: MainPage;
  
  test.beforeEach(async ({ page }) => {
    mainPage = new MainPage(page);
    await page.request.delete('/api/test-cleanup');
    await mainPage.goto();
  });
  
  test('should hide New Request button when showAll=true', async ({ page }) => {
    // Navigate to page with showAll=true parameter
    await page.goto('/?showAll=true');
    
    // New Request button should not be visible
    await expect(mainPage.newRequestButton).toBeHidden();
  });
  
  test('should show New Request button by default', async ({ page }) => {
    // Default page load
    await mainPage.goto();
    
    // New Request button should be visible
    await expect(mainPage.newRequestButton).toBeVisible();
  });
  
  test('should enforce submit button logic per PRD', async ({ page }) => {
    // Create new request
    await mainPage.createNewRequest();
    
    // Initially submit should be disabled (no contact, no items)
    await expect(mainPage.submitButton).toBeDisabled();
    
    // Add contact only - still disabled
    await mainPage.addContact('Test Group', 'Test Mine', 'John Doe');
    await expect(mainPage.submitButton).toBeDisabled();
    
    // Add line item - now enabled
    await mainPage.addLineItem('Safety Equipment', 'Safety Helmet');
    await expect(mainPage.submitButton).toBeEnabled();
    
    // Remove contact by clearing and submit should be disabled again
    // (This would require additional UI for contact removal, implementing concept)
    
    // Add comment - should remain enabled
    await mainPage.addComment('Test comment');
    await expect(mainPage.submitButton).toBeEnabled();
  });
});

Create `/tests/e2e/specs/navigation.e2e.spec.ts`:

import { test, expect } from '@playwright/test';

test.describe('App Navigation', () => {
  test('should navigate between main sections', async ({ page }) => {
    await page.goto('/');
    
    // Test main page loads
    await expect(page.getByTestId('sh-main-page')).toBeVisible();
    
    // Test navigation menu
    const menuButton = page.getByTestId('sh-header-menu-button');
    await menuButton.click();
    
    // Test navigation links
    const contactsLink = page.getByTestId('sh-nav-contacts');
    await expect(contactsLink).toBeVisible();
    
    const priceListLink = page.getByTestId('sh-nav-pricelist');
    await expect(priceListLink).toBeVisible();
    
    const checkInLink = page.getByTestId('sh-nav-checkin');
    await expect(checkInLink).toBeVisible();
  });
  
  test('should handle offline state gracefully', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    
    await page.goto('/');
    
    // App should still load with cached data
    await expect(page.getByTestId('sh-main-page')).toBeVisible();
    
    // Should show offline indicator
    const offlineIndicator = page.getByTestId('sh-offline-banner');
    await expect(offlineIndicator).toBeVisible({ timeout: 5000 });
  });
});

Create `/tests/e2e/specs/offline-behavior.e2e.spec.ts`:

import { test, expect } from '@playwright/test';

test.describe('Offline Behavior', () => {
  test('should work with cached data when offline', async ({ page }) => {
    // First, load the app online to cache data
    await page.goto('/');
    
    // Load contacts and products to cache them
    await page.getByTestId('sh-main-new-request-button').click();
    await page.getByTestId('sh-request-add-contact-button').click();
    await page.waitForLoadState('networkidle');
    await page.goBack();
    
    await page.getByTestId('sh-request-add-lineitem-button').click();
    await page.waitForLoadState('networkidle');
    await page.goBack();
    
    // Now go offline
    await page.context().setOffline(true);
    
    // Should still be able to navigate and use cached data
    await page.getByTestId('sh-request-add-contact-button').click();
    
    // Should show offline banner
    const offlineIndicator = page.getByTestId('sh-offline-banner');
    await expect(offlineIndicator).toBeVisible();
    await expect(offlineIndicator).toContainText('offline data');
    
    // Should still show contact groups (from cache)
    const contactGroups = page.getByTestId('sh-contacts-groups');
    await expect(contactGroups).toBeVisible();
  });
  
  test('should sync changes when back online', async ({ page }) => {
    // Start online, create a draft request
    await page.goto('/');
    await page.getByTestId('sh-main-new-request-button').click();
    
    // Go offline
    await page.context().setOffline(true);
    
    // Add comment while offline
    await page.getByTestId('sh-request-add-comment-button').click();
    const commentInput = page.getByTestId('sh-request-comment-input');
    await commentInput.fill('Offline comment');
    await page.click('body');
    
    // Go back online
    await page.context().setOffline(false);
    
    // Verify comment was saved
    const commentDisplay = page.getByTestId('sh-request-comment-display');
    await expect(commentDisplay).toContainText('Offline comment');
  });
});

Update package.json scripts:

{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed", 
    "test:e2e:debug": "playwright test --debug",
    "dev:mock": "APP_ENV=test PIPEDRIVE_SUBMIT_MODE=mock npm run dev -- --port 3010"
  }
}

Create `/tests/_utils/api.ts`:

export const api = {
  async get(endpoint: string) {
    const response = await fetch(`http://localhost:3001${endpoint}`);
    return await response.json();
  },
  
  async post(endpoint: string, body: any) {
    const response = await fetch(`http://localhost:3001${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await response.json();
  },
  
  async delete(endpoint: string) {
    const response = await fetch(`http://localhost:3001${endpoint}`, {
      method: 'DELETE'
    });
    return await response.json();
  }
};

Create additional E2E helper `/tests/e2e/helpers/mock-data.ts`:

export const mockContactsResponse = {
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
};

export const mockProductsResponse = {
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
};
```

**Manual Validation Steps:**
- [ ] Run `npx playwright install` to install browsers
- [ ] Run `npm run test:e2e` and verify all E2E tests pass
- [ ] Test with `npm run test:e2e:headed` to see browser automation
- [ ] Verify test creates new request, adds contact and line items
- [ ] Check that mock submission is recorded in database
- [ ] Test validation prevents submission without required data
- [ ] Verify offline handling works correctly
- [ ] Check that navigation between pages works smoothly
- [ ] Confirm test cleanup removes all test data
- [ ] Test offline behavior: cached data usage and sync when back online
- [ ] Verify E2E tests work with mock mode submission flow
- [ ] Test PRD-specific requirements: showAll parameter, submit button logic, comment auto-save behavior

**Checkbox:** - [ ] 4.3 End-to-End Testing Complete

---

## Section 4 Summary

This testing infrastructure provides comprehensive coverage with:

### Unit Tests (Vitest)
- Schema validation with Zod contracts
- Cache functionality (get/set/bust/expiry) 
- Database utilities (ID generation, cleanup)
- Test data factories and isolation

### Integration Tests (Vitest + Test Server)
- Full API endpoint testing with real database
- Contacts/Products caching and offline behavior
- Submit workflow in mock mode with database verification
- Cache busting and warming functionality
- **PRD-specific requirements testing**: showAll parameter behavior, submit button logic, comment auto-save functionality

### End-to-End Tests (Playwright)
- Complete submission workflow smoke test
- Navigation and offline state handling
- Form validation and error prevention
- Real browser automation with mobile viewport
- **PRD requirements validation**: New Request button visibility, submit button state management, comment auto-save behavior

### Key Features
- **Environment isolation**: Uses `APP_ENV=test` with separate test database
- **Mock mode**: `PIPEDRIVE_SUBMIT_MODE=mock` for safe testing
- **Test data cleanup**: Automatic cleanup of test data older than specified age
- **Offline tolerance**: Tests verify stale cache behavior and offline indicators
- **Page Object Model**: Clean E2E test structure with reusable components
- **PRD compliance**: Specific tests for all PRD requirements including UI behavior and business logic

All tests are designed to run in CI/CD with proper setup/teardown and no external dependencies beyond the test database.

**Overall Section 4 Status:** - [ ] Testing Infrastructure Complete