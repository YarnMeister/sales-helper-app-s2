import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId, logError, logWarn } from '@/lib/log';

const unauthorizedResponse = () =>
  NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

const misconfiguredResponse = () =>
  NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 });

const safeTokenEquals = (providedToken: string, expectedToken: string): boolean => {
  const expected = Buffer.from(expectedToken);
  const provided = Buffer.from(providedToken);

  if (provided.length === expected.length) {
    return timingSafeEqual(provided, expected);
  }

  const normalizedProvided = Buffer.alloc(expected.length);
  provided.copy(normalizedProvided, 0, 0, Math.min(provided.length, expected.length));
  timingSafeEqual(normalizedProvided, expected);
  return false;
};

const rejectUnauthorized = (reason: string) => {
  const correlationId = generateCorrelationId();
  logWarn('Public API authorization failed', { correlationId, reason });
  return unauthorizedResponse();
};

export function requireBearer(req: NextRequest): NextResponse | null {
  const expectedToken = process.env.PUBLIC_API_TOKEN;

  if (!expectedToken) {
    if (process.env.NODE_ENV === 'production') {
      logError('PUBLIC_API_TOKEN is not configured for public API authentication');
      return misconfiguredResponse();
    }

    return rejectUnauthorized('token_not_configured');
  }

  const authorization = req.headers.get('authorization');

  if (!authorization) {
    return rejectUnauthorized('missing_authorization_header');
  }

  if (!authorization.startsWith('Bearer ')) {
    return rejectUnauthorized('invalid_authorization_scheme');
  }

  const providedToken = authorization.slice('Bearer '.length);

  if (!providedToken || !safeTokenEquals(providedToken, expectedToken)) {
    return rejectUnauthorized('invalid_token');
  }

  return null;
}
