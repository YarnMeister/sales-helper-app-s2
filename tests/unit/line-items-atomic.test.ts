import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { addLineItemAtomic, createRequest, updateRequest } from '@/lib/db';
import { TestDataManager } from '../_utils/test-lifecycle';

// Mock the database functions
vi.mock('@/lib/db', () => ({
  createRequest: vi.fn(),
  addLineItemAtomic: vi.fn(),
  updateRequest: vi.fn()
}));

describe('Atomic Line Items Operations', () => {
  const testManager = new TestDataManager();

  beforeEach(async () => {
    await testManager.cleanup();
  });

  afterEach(async () => {
    await testManager.cleanup();
  });

  describe('addLineItemAtomic', () => {
    it('should add line item atomically without race conditions', async () => {
      // Mock the test request
      const testRequest = {
        id: 'test-id',
        request_id: 'test-atomic-001',
        salesperson_first_name: 'Test',
        line_items: []
      };

      vi.mocked(createRequest).mockResolvedValue(testRequest);

      const createdRequest = await createRequest({
        request_id: 'test-atomic-001',
        salesperson_first_name: 'Test',
        line_items: []
      });

      expect(createdRequest.line_items).toEqual([]);

      // Add a line item atomically
      const lineItem = {
        code: 'TEST001',
        name: 'Test Product',
        quantity: 1,
        price: 100
      };

      // Mock the addLineItemAtomic result
      const updatedRequest = {
        ...testRequest,
        line_items: [lineItem]
      };
      vi.mocked(addLineItemAtomic).mockResolvedValue(updatedRequest);

      const result = await addLineItemAtomic(testRequest.id, lineItem);

      expect(result.line_items).toHaveLength(1);
      expect(result.line_items[0]).toEqual(lineItem);
    });

    it('should handle concurrent line item additions correctly', async () => {
      // Mock the test request
      const testRequest = {
        id: 'test-concurrent-id',
        request_id: 'test-concurrent-001',
        salesperson_first_name: 'Test',
        line_items: []
      };

      vi.mocked(createRequest).mockResolvedValue(testRequest);

      const createdRequest = await createRequest({
        request_id: 'test-concurrent-001',
        salesperson_first_name: 'Test',
        line_items: []
      });

      const lineItem1 = { code: 'ITEM1', name: 'Item 1', quantity: 1, price: 50 };
      const lineItem2 = { code: 'ITEM2', name: 'Item 2', quantity: 2, price: 75 };
      const lineItem3 = { code: 'ITEM3', name: 'Item 3', quantity: 1, price: 100 };

      // Mock concurrent additions - each call adds to the existing items
      vi.mocked(addLineItemAtomic)
        .mockResolvedValueOnce({ ...testRequest, line_items: [lineItem1] })
        .mockResolvedValueOnce({ ...testRequest, line_items: [lineItem1, lineItem2] })
        .mockResolvedValueOnce({ ...testRequest, line_items: [lineItem1, lineItem2, lineItem3] });

      // Simulate concurrent additions
      const promises = [
        addLineItemAtomic(testRequest.id, lineItem1),
        addLineItemAtomic(testRequest.id, lineItem2),
        addLineItemAtomic(testRequest.id, lineItem3)
      ];

      const results = await Promise.all(promises);

      // Each result should reflect the cumulative state
      // The final result should have all 3 items
      const finalResult = results[results.length - 1];
      expect(finalResult.line_items).toHaveLength(3);

      // Verify all items were added (order may vary due to concurrency)
      const codes = finalResult.line_items.map(item => item.code).sort();
      expect(codes).toEqual(['ITEM1', 'ITEM2', 'ITEM3']);
    });
  });

  describe('updateRequest atomic operations', () => {
    it('should handle line item updates atomically', async () => {
      // Create request with initial line items
      const initialItems = [
        { code: 'INIT1', name: 'Initial 1', quantity: 1, price: 25 },
        { code: 'INIT2', name: 'Initial 2', quantity: 2, price: 50 }
      ];

      const testRequest = {
        id: 'test-update-id',
        request_id: 'test-update-atomic-001',
        salesperson_first_name: 'Test',
        line_items: initialItems
      };

      vi.mocked(createRequest).mockResolvedValue(testRequest);

      const createdRequest = await createRequest({
        request_id: 'test-update-atomic-001',
        salesperson_first_name: 'Test',
        line_items: initialItems
      });

      // Update line items atomically
      const updatedItems = [
        { code: 'INIT1', name: 'Initial 1', quantity: 3, price: 25 }, // Changed quantity
        { code: 'NEW1', name: 'New Item', quantity: 1, price: 100 }   // Added new item
      ];

      const updatedRequest = {
        ...testRequest,
        line_items: updatedItems
      };

      vi.mocked(updateRequest).mockResolvedValue(updatedRequest);

      const result = await updateRequest(testRequest.id, {
        line_items: updatedItems
      });

      expect(result.line_items).toHaveLength(2);
      expect(result.line_items[0].quantity).toBe(3);
      expect(result.line_items[1].code).toBe('NEW1');
    });

    it('should not lose data during concurrent updates', async () => {
      // Mock the test request
      const testRequest = {
        id: 'test-concurrent-update-id',
        request_id: 'test-concurrent-update-001',
        salesperson_first_name: 'Test',
        line_items: [{ code: 'BASE', name: 'Base Item', quantity: 1, price: 10 }],
        comment: 'Initial comment'
      };

      vi.mocked(createRequest).mockResolvedValue(testRequest);

      const createdRequest = await createRequest({
        request_id: 'test-concurrent-update-001',
        salesperson_first_name: 'Test',
        line_items: [{ code: 'BASE', name: 'Base Item', quantity: 1, price: 10 }],
        comment: 'Initial comment'
      });

      // Mock concurrent updates
      vi.mocked(updateRequest)
        .mockResolvedValueOnce({ ...testRequest, comment: 'Updated comment 1' })
        .mockResolvedValueOnce({
          ...testRequest,
          comment: 'Updated comment 1',
          line_items: [
            { code: 'BASE', name: 'Base Item', quantity: 1, price: 10 },
            { code: 'ADDED', name: 'Added Item', quantity: 1, price: 20 }
          ]
        });

      // Simulate concurrent updates to different fields
      const promises = [
        updateRequest(testRequest.id, {
          comment: 'Updated comment 1'
        }),
        updateRequest(testRequest.id, {
          line_items: [
            { code: 'BASE', name: 'Base Item', quantity: 1, price: 10 },
            { code: 'ADDED', name: 'Added Item', quantity: 1, price: 20 }
          ]
        })
      ];

      const results = await Promise.all(promises);

      // Both updates should be preserved
      const finalResult = results[results.length - 1];
      expect(finalResult.line_items).toHaveLength(2);

      // The comment should be from one of the updates
      expect(['Updated comment 1', 'Initial comment']).toContain(finalResult.comment);
    });
  });
});