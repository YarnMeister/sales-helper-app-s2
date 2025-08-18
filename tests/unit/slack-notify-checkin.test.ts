import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/slack/notify-checkin/route';

// Mock environment variables
vi.mock('../../lib/env', () => ({
  env: {
    SLACK_BOT_TOKEN: 'xoxb-test-token',
    SLACK_CHANNEL_LIVE: '#sales-checkins',
    SLACK_CHANNEL_MOCK: '#sales-checkins-test'
  }
}));

// Mock the log function
vi.mock('../../lib/log', async () => {
  const actual = await vi.importActual('../../lib/log');
  return {
    ...actual,
    log: vi.fn(),
    generateCorrelationId: () => 'test-correlation-id'
  };
});

// Mock fetch globally
global.fetch = vi.fn();

describe('Slack Notify Check-in API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful Slack response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ok: true,
        ts: '1234567890.123456'
      })
    });
  });

  const createRequest = (data: any) => {
    return new NextRequest('http://localhost:3000/api/slack/notify-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  };

  it('should send Slack notification successfully', async () => {
    const mockData = {
      salesperson: 'James',
      planned_mines: ['Mine Alpha'],
      main_purpose: 'Quote follow-up',
      availability: 'Later this morning',
      submit_mode: 'mock'
    };

    const request = createRequest(mockData);
    const response = await POST(request);
    
    // Verify it's a Response object
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    
    // Parse the JSON response
    const result = await response.json();
    expect(result.ok).toBe(true);
    expect(result.channel).toBe('#sales-helper-test');
    expect(result.mode).toBe('mock');
    
    // Verify Slack API was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      'https://slack.com/api/chat.postMessage',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Bearer xoxb-'),
          'Content-Type': 'application/json'
        }),
        body: expect.stringContaining('"channel":"#sales-helper-test"')
      })
    );
  });

  it('should use live channel for live mode', async () => {
    const mockData = {
      salesperson: 'James',
      planned_mines: ['Mine Alpha'],
      main_purpose: 'Quote follow-up',
      availability: 'Later this morning',
      submit_mode: 'live'
    };

    const request = createRequest(mockData);
    const response = await POST(request);
    
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.channel).toBe('#out-of-office');
    expect(result.mode).toBe('live');
  });

  it('should handle missing SLACK_BOT_TOKEN', async () => {
    // Clear module cache and re-import with mocked env
    vi.resetModules();
    
    // Mock missing token
    vi.doMock('../../lib/env.server', () => ({
      env: {
        SLACK_BOT_TOKEN: undefined,
        SLACK_CHANNEL_LIVE: '#out-of-office',
        SLACK_CHANNEL_MOCK: '#sales-helper-test'
      }
    }));

    // Re-import the route with the new mock
    const { POST: POSTWithMock } = await import('../../app/api/slack/notify-checkin/route');

    const mockData = {
      salesperson: 'James',
      planned_mines: ['Mine Alpha'],
      main_purpose: 'Quote follow-up',
      availability: 'Later this morning',
      submit_mode: 'mock'
    };

    const request = createRequest(mockData);
    const response = await POSTWithMock(request);
    
    expect(response.status).toBe(503);
    const result = await response.json();
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Slack integration not configured');
  });

  it('should handle Slack API errors', async () => {
    // Mock Slack API error
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        ok: false,
        error: 'channel_not_found'
      })
    });

    const mockData = {
      salesperson: 'James',
      planned_mines: ['Mine Alpha'],
      main_purpose: 'Quote follow-up',
      availability: 'Later this morning',
      submit_mode: 'mock'
    };

    const request = createRequest(mockData);
    const response = await POST(request);
    
    expect(response.status).toBe(500);
    const result = await response.json();
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Slack API error: channel_not_found');
  });

  it('should handle network errors', async () => {
    // Mock network error
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const mockData = {
      salesperson: 'James',
      planned_mines: ['Mine Alpha'],
      main_purpose: 'Quote follow-up',
      availability: 'Later this morning',
      submit_mode: 'mock'
    };

    const request = createRequest(mockData);
    const response = await POST(request);
    
    expect(response.status).toBe(500);
    const result = await response.json();
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('should validate required fields', async () => {
    const invalidData = {
      salesperson: '', // Invalid
      planned_mines: [], // Invalid
      main_purpose: '',
      availability: '',
      submit_mode: 'mock'
    };

    const request = createRequest(invalidData);
    const response = await POST(request);
    
    expect(response.status).toBe(422);
    const result = await response.json();
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Invalid request data');
  });
});
