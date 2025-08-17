import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('Slack Notify Check-in API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send Slack notification successfully', async () => {
    const mockSlackResponse = {
      ok: true,
      ts: '1234567890.123456'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSlackResponse)
    });

    const mockData = {
      salesperson: 'James',
      planned_mines: ['Mine Alpha', 'Mine Beta'],
      main_purpose: 'Quote follow-up',
      availability: 'Later this morning',
      comments: 'Test comment'
    };

    const request = new NextRequest('http://localhost:3000/api/slack/notify-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockData)
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.ok).toBe(true);
    expect(result.data.channel).toBe('#out-of-office');
    expect(result.data.message_ts).toBe('1234567890.123456');

    // Verify Slack API call
    expect(global.fetch).toHaveBeenCalledWith('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer xoxb-test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: '#out-of-office',
        text: expect.stringContaining('James'),
        unfurl_links: false,
        unfurl_media: false
      })
    });
  });

  it('should format message correctly with multiple mines', async () => {
    const mockSlackResponse = {
      ok: true,
      ts: '1234567890.123456'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSlackResponse)
    });

    const mockData = {
      salesperson: 'Luyanda',
      planned_mines: ['Mine Alpha', 'Mine Beta', 'Mine Gamma'],
      main_purpose: 'Delivery',
      availability: 'In the afternoon',
      comments: 'Multiple site visits today'
    };

    const request = new NextRequest('http://localhost:3000/api/slack/notify-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockData)
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.ok).toBe(true);

    // Verify message content
    const slackCall = (global.fetch as jest.Mock).mock.calls[0];
    const messageBody = JSON.parse(slackCall[1].body);
    
    expect(messageBody.text).toContain('Luyanda');
    expect(messageBody.text).toContain('Mine Alpha, Mine Beta, Mine Gamma');
    expect(messageBody.text).toContain('Delivery');
    expect(messageBody.text).toContain('In the afternoon');
    expect(messageBody.text).toContain('Multiple site visits today');
  });

  it('should format message correctly without comments', async () => {
    const mockSlackResponse = {
      ok: true,
      ts: '1234567890.123456'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSlackResponse)
    });

    const mockData = {
      salesperson: 'Stefan',
      planned_mines: ['Mine Alpha'],
      main_purpose: 'Site check',
      availability: 'Tomorrow'
      // No comments
    };

    const request = new NextRequest('http://localhost:3000/api/slack/notify-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockData)
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.ok).toBe(true);

    // Verify message content doesn't include comments section
    const slackCall = (global.fetch as jest.Mock).mock.calls[0];
    const messageBody = JSON.parse(slackCall[1].body);
    
    expect(messageBody.text).toContain('Stefan');
    expect(messageBody.text).toContain('Mine Alpha');
    expect(messageBody.text).toContain('Site check');
    expect(messageBody.text).toContain('Tomorrow');
    expect(messageBody.text).not.toContain('Comments:');
  });

  it('should validate required fields', async () => {
    const invalidData = {
      salesperson: 'James',
      // missing planned_mines
      main_purpose: 'Quote follow-up',
      availability: 'Later this morning'
    };

    const request = new NextRequest('http://localhost:3000/api/slack/notify-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('planned_mines');
  });

  it('should validate salesperson values', async () => {
    const invalidData = {
      salesperson: 'InvalidName',
      planned_mines: ['Mine Alpha'],
      main_purpose: 'Quote follow-up',
      availability: 'Later this morning'
    };

    const request = new NextRequest('http://localhost:3000/api/slack/notify-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Invalid enum value');
  });

  it('should validate purpose values', async () => {
    const invalidData = {
      salesperson: 'James',
      planned_mines: ['Mine Alpha'],
      main_purpose: 'Invalid Purpose',
      availability: 'Later this morning'
    };

    const request = new NextRequest('http://localhost:3000/api/slack/notify-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Invalid enum value');
  });

  it('should validate availability values', async () => {
    const invalidData = {
      salesperson: 'James',
      planned_mines: ['Mine Alpha'],
      main_purpose: 'Quote follow-up',
      availability: 'Invalid Time'
    };

    const request = new NextRequest('http://localhost:3000/api/slack/notify-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Invalid enum value');
  });

  it('should handle missing SLACK_BOT_TOKEN', async () => {
    // Mock missing token
    vi.mocked(await import('@/lib/env')).env.SLACK_BOT_TOKEN = '';

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
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('SLACK_BOT_TOKEN not configured');
  });

  it('should handle Slack API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        ok: false,
        error: 'channel_not_found'
      })
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
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Slack API error: channel_not_found');
  });

  it('should handle network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

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
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('should use fallback channel when SLACK_CHANNEL is empty', async () => {
    // Mock empty channel
    vi.mocked(await import('@/lib/env')).env.SLACK_CHANNEL = '';

    const mockSlackResponse = {
      ok: true,
      ts: '1234567890.123456'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
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
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.ok).toBe(true);
    expect(result.data.channel).toBe('#out-of-office');

    // Verify fallback channel was used
    const slackCall = (global.fetch as jest.Mock).mock.calls[0];
    const messageBody = JSON.parse(slackCall[1].body);
    expect(messageBody.channel).toBe('#out-of-office');
  });
});
