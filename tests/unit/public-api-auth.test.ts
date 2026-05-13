import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireBearer } from '@/lib/auth/public-api-auth';
import { generateCorrelationId, logError, logWarn } from '@/lib/log';

vi.mock('@/lib/log', () => ({
  generateCorrelationId: vi.fn(() => 'test-correlation-id'),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

const createRequest = (authorization?: string) => {
  const headers = new Headers();

  if (authorization !== undefined) {
    headers.set('Authorization', authorization);
  }

  return new NextRequest('http://localhost/api/public/site-visits', { headers });
};

const parseResponse = async (response: Response) => ({
  status: response.status,
  body: await response.json(),
});

describe('requireBearer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv('PUBLIC_API_TOKEN', 'expected-token');
    vi.mocked(generateCorrelationId).mockReturnValue('test-correlation-id');
  });

  it('rejects requests with a missing authorization header', async () => {
    const response = requireBearer(createRequest());

    expect(response).not.toBeNull();
    await expect(parseResponse(response!)).resolves.toEqual({
      status: 401,
      body: { ok: false, error: 'Unauthorized' },
    });
    expect(logWarn).toHaveBeenCalledWith('Public API authorization failed', {
      correlationId: 'test-correlation-id',
      reason: 'missing_authorization_header',
    });
    expect(JSON.stringify(vi.mocked(logWarn).mock.calls)).not.toContain('expected-token');
  });

  it('rejects requests with the wrong authorization scheme', async () => {
    const response = requireBearer(createRequest('Basic expected-token'));

    expect(response).not.toBeNull();
    await expect(parseResponse(response!)).resolves.toEqual({
      status: 401,
      body: { ok: false, error: 'Unauthorized' },
    });
    expect(logWarn).toHaveBeenCalledWith('Public API authorization failed', {
      correlationId: 'test-correlation-id',
      reason: 'invalid_authorization_scheme',
    });
    expect(JSON.stringify(vi.mocked(logWarn).mock.calls)).not.toContain('Basic expected-token');
  });

  it('rejects requests with the wrong bearer token', async () => {
    const response = requireBearer(createRequest('Bearer wrong-token'));

    expect(response).not.toBeNull();
    await expect(parseResponse(response!)).resolves.toEqual({
      status: 401,
      body: { ok: false, error: 'Unauthorized' },
    });
    expect(logWarn).toHaveBeenCalledWith('Public API authorization failed', {
      correlationId: 'test-correlation-id',
      reason: 'invalid_token',
    });
    expect(JSON.stringify(vi.mocked(logWarn).mock.calls)).not.toContain('wrong-token');
  });

  it('accepts requests with the correct bearer token', () => {
    const response = requireBearer(createRequest('Bearer expected-token'));

    expect(response).toBeNull();
    expect(logWarn).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
  });

  it('returns server misconfigured when the token is unset in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PUBLIC_API_TOKEN', '');

    const response = requireBearer(createRequest('Bearer expected-token'));

    expect(response).not.toBeNull();
    await expect(parseResponse(response!)).resolves.toEqual({
      status: 500,
      body: { ok: false, error: 'Server misconfigured' },
    });
    expect(logError).toHaveBeenCalledWith(
      'PUBLIC_API_TOKEN is not configured for public API authentication'
    );
    expect(logWarn).not.toHaveBeenCalled();
  });
});
