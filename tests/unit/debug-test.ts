import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/slack/notify-checkin/route';

// Mock environment variables
vi.mock('@/lib/env', () => ({
  env: {
    SLACK_BOT_TOKEN: 'xoxb-test-token',
    SLACK_CHANNEL: '#out-of-office'
  }
}));

// Mock logging
vi.mock('@/lib/log', () => ({
  generateCorrelationId: vi.fn(() => 'test-correlation-id'),
  withPerformanceLogging: vi.fn((fn) => fn),
  logInfo: vi.fn(),
  logError: vi.fn()
}));

// Mock global fetch
global.fetch = vi.fn();

describe('Debug Test', () => {
  it('should understand response structure', async () => {
    const mockSlackResponse = {
      ok: true,
      ts: '1234567890.123456'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSlackResponse)
    });

    const mockData = {
      salesperson: 'James',
      planned_mines: ['Mine Alpha'],
      main_purpose: 'Quote follow-up',
      availability: 'Later this morning'
    };

    const request = new NextRequest('http://localhost:3000/api/slack/notify-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockData)
    });

    const response = await POST(request);
    
    console.log('Response type:', typeof response);
    console.log('Response constructor:', response.constructor.name);
    console.log('Response methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(response)));
    console.log('Response status:', response.status);
    
    // Try to get the response body
    const text = await response.text();
    console.log('Response text:', text);
    
    expect(response.status).toBe(200);
  });
});
