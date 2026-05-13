import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getPublicSiteVisits } from '../../app/api/public/site-visits/route';
import { GET as getMonthlyFrequency } from '../../app/api/public/site-visits/monthly-frequency/route';
import { createStandardConnection } from '@/lib/database/connection-standard';

type DbVisitRow = {
  id: string;
  date: Date;
  salesperson: 'James' | 'Luyanda' | 'Stefan';
  plannedMines: string[];
  mainPurpose: string;
  comments: string | null;
  availability?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type QueryCondition = {
  op: 'and' | 'gte' | 'lte' | 'lt' | 'eq';
  column?: string;
  value?: unknown;
  conditions?: QueryCondition[];
};

type QueryRecord = {
  type: 'list' | 'monthly';
  where?: QueryCondition;
  limit?: number;
};

const mockState = vi.hoisted(() => ({
  createStandardConnection: vi.fn(),
  generateCorrelationId: vi.fn(() => 'test-correlation-id'),
  logError: vi.fn(),
  logWarn: vi.fn(),
  listRows: [] as DbVisitRow[],
  monthlyRows: [] as DbVisitRow[],
  queries: [] as QueryRecord[],
}));

vi.mock('@/lib/log', () => ({
  generateCorrelationId: mockState.generateCorrelationId,
  logError: mockState.logError,
  logWarn: mockState.logWarn,
}));

vi.mock('@/lib/database/connection-standard', () => ({
  createStandardConnection: mockState.createStandardConnection,
  sql: vi.fn(() => ({ op: 'month_expression' })),
}));

vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual<typeof import('drizzle-orm')>('drizzle-orm');
  const columnName = (column: any) => column?.name ?? column?.config?.name;

  return {
    ...actual,
    and: vi.fn((...conditions: QueryCondition[]) => ({ op: 'and', conditions })),
    asc: vi.fn((value: unknown) => ({ op: 'asc', value })),
    count: vi.fn((value: unknown) => ({ op: 'count', value })),
    desc: vi.fn((value: unknown) => ({ op: 'desc', value })),
    eq: vi.fn((column: unknown, value: unknown) => ({ op: 'eq', column: columnName(column), value })),
    gte: vi.fn((column: unknown, value: unknown) => ({ op: 'gte', column: columnName(column), value })),
    lt: vi.fn((column: unknown, value: unknown) => ({ op: 'lt', column: columnName(column), value })),
    lte: vi.fn((column: unknown, value: unknown) => ({ op: 'lte', column: columnName(column), value })),
  };
});

const authorizedHeaders = { Authorization: 'Bearer expected-token' };

const publicRequest = (path: string, headers: HeadersInit = authorizedHeaders) =>
  new NextRequest(`http://localhost:3000${path}`, { headers });

const parseResponse = async (response: Response) => ({
  status: response.status,
  body: await response.json(),
});

const visit = (
  id: string,
  date: string,
  salesperson: DbVisitRow['salesperson'],
  extra: Partial<DbVisitRow> = {}
): DbVisitRow => ({
  id,
  date: new Date(`${date}T12:00:00.000Z`),
  salesperson,
  plannedMines: [`${id} Mine`],
  mainPurpose: 'Quote follow-up',
  comments: `${id} comments`,
  availability: 'Later this morning',
  createdAt: new Date(`${date}T13:00:00.000Z`),
  updatedAt: new Date(`${date}T14:00:00.000Z`),
  ...extra,
});

const compareDates = (actual: Date, expected: unknown, op: 'gte' | 'lte' | 'lt') => {
  const actualTime = actual.getTime();
  const expectedTime = expected instanceof Date ? expected.getTime() : new Date(String(expected)).getTime();

  if (op === 'gte') return actualTime >= expectedTime;
  if (op === 'lte') return actualTime <= expectedTime;
  return actualTime < expectedTime;
};

const matchesCondition = (row: DbVisitRow, condition?: QueryCondition): boolean => {
  if (!condition) return true;

  if (condition.op === 'and') {
    return (condition.conditions ?? []).every((child) => matchesCondition(row, child));
  }

  if (condition.column === 'date' && ['gte', 'lte', 'lt'].includes(condition.op)) {
    return compareDates(row.date, condition.value, condition.op as 'gte' | 'lte' | 'lt');
  }

  if (condition.column === 'salesperson' && condition.op === 'eq') {
    return row.salesperson === condition.value;
  }

  return true;
};

const formatMonth = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const createListBuilder = () => {
  const query: QueryRecord = { type: 'list' };
  mockState.queries.push(query);

  const builder = {
    from: vi.fn(() => builder),
    where: vi.fn((condition: QueryCondition) => {
      query.where = condition;
      return builder;
    }),
    orderBy: vi.fn(() => builder),
    limit: vi.fn((limit: number) => {
      query.limit = limit;
      return mockState.listRows
        .filter((row) => matchesCondition(row, query.where))
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, limit);
    }),
  };

  return builder;
};

const createMonthlyBuilder = () => {
  const query: QueryRecord = { type: 'monthly' };
  mockState.queries.push(query);

  const builder = {
    from: vi.fn(() => builder),
    where: vi.fn((condition: QueryCondition) => {
      query.where = condition;
      return builder;
    }),
    groupBy: vi.fn(() => builder),
    orderBy: vi.fn(() => {
      const grouped = mockState.monthlyRows
        .filter((row) => matchesCondition(row, query.where))
        .reduce<Record<string, { month: Date; salesperson: string; visit_count: number }>>((acc, row) => {
          const month = formatMonth(row.date);
          const key = `${month}:${row.salesperson}`;
          acc[key] ??= {
            month: new Date(`${month}-01T00:00:00.000Z`),
            salesperson: row.salesperson,
            visit_count: 0,
          };
          acc[key].visit_count += 1;
          return acc;
        }, {});

      return Object.values(grouped).sort((a, b) =>
        formatMonth(a.month).localeCompare(formatMonth(b.month)) ||
        a.salesperson.localeCompare(b.salesperson)
      );
    }),
  };

  return builder;
};

const mockDb = () => ({
  select: vi.fn((fields: Record<string, unknown>) => {
    if ('visit_count' in fields) {
      return createMonthlyBuilder();
    }

    return createListBuilder();
  }),
});

describe('Public Site Visits API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.stubEnv('PUBLIC_API_TOKEN', 'expected-token');
    mockState.listRows = [];
    mockState.monthlyRows = [];
    mockState.queries = [];
    vi.mocked(createStandardConnection).mockReturnValue({ db: mockDb() } as any);
  });

  describe('authentication', () => {
    it('rejects a missing authorization header', async () => {
      const response = await getPublicSiteVisits(publicRequest('/api/public/site-visits', {}));

      await expect(parseResponse(response)).resolves.toEqual({
        status: 401,
        body: { ok: false, error: 'Unauthorized' },
      });
      expect(createStandardConnection).not.toHaveBeenCalled();
    });

    it('rejects a wrong bearer token', async () => {
      const response = await getMonthlyFrequency(
        publicRequest('/api/public/site-visits/monthly-frequency', { Authorization: 'Bearer wrong-token' })
      );

      await expect(parseResponse(response)).resolves.toEqual({
        status: 401,
        body: { ok: false, error: 'Unauthorized' },
      });
      expect(createStandardConnection).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/public/site-visits', () => {
    beforeEach(() => {
      mockState.listRows = [
        visit('visit-1', '2025-01-10', 'James'),
        visit('visit-2', '2025-02-15', 'Luyanda'),
        visit('visit-3', '2025-03-20', 'James'),
        visit('visit-4', '2025-04-05', 'Stefan'),
      ];
    });

    it.each([
      ['from', '?from=2025-02-01', ['visit-4', 'visit-3', 'visit-2']],
      ['to', '?to=2025-02-28', ['visit-2', 'visit-1']],
      ['salesperson', '?salesperson=James', ['visit-3', 'visit-1']],
      ['limit', '?limit=2', ['visit-4', 'visit-3']],
    ])('returns 200 with the %s filter', async (_filter, query, expectedIds) => {
      const response = await getPublicSiteVisits(publicRequest(`/api/public/site-visits${query}`));
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data.map((row: { id: string }) => row.id)).toEqual(expectedIds);
      expect(result.count).toBe(expectedIds.length);
    });

    it('returns 200 with combined filters', async () => {
      const response = await getPublicSiteVisits(
        publicRequest('/api/public/site-visits?from=2025-02-01&to=2025-03-31&salesperson=James&limit=1')
      );
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toMatchObject({ ok: true, count: 1 });
      expect(result.data.map((row: { id: string }) => row.id)).toEqual(['visit-3']);
      expect(mockState.queries[0].limit).toBe(1);
    });

    it('returns only public fields and excludes internal fields', async () => {
      mockState.listRows = [visit('visit-public', '2025-02-15', 'James')];

      const response = await getPublicSiteVisits(publicRequest('/api/public/site-visits'));
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(Object.keys(result.data[0]).sort()).toEqual([
        'comments',
        'date',
        'id',
        'main_purpose',
        'planned_mines',
        'salesperson',
      ]);
      expect(result.data[0]).not.toHaveProperty('availability');
      expect(result.data[0]).not.toHaveProperty('created_at');
      expect(result.data[0]).not.toHaveProperty('updated_at');
    });
  });

  describe('GET /api/public/site-visits/monthly-frequency', () => {
    it('groups monthly visit counts across 3 months and 2 salespersons', async () => {
      mockState.monthlyRows = [
        visit('jan-james-1', '2025-01-05', 'James'),
        visit('jan-james-2', '2025-01-20', 'James'),
        visit('jan-luyanda-1', '2025-01-22', 'Luyanda'),
        visit('feb-james-1', '2025-02-03', 'James'),
        visit('feb-luyanda-1', '2025-02-16', 'Luyanda'),
        visit('mar-james-1', '2025-03-11', 'James'),
      ];

      const response = await getMonthlyFrequency(
        publicRequest('/api/public/site-visits/monthly-frequency?from=2025-01&to=2025-03')
      );
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toEqual({
        ok: true,
        data: [
          { month: '2025-01', salesperson: 'James', visit_count: 2 },
          { month: '2025-01', salesperson: 'Luyanda', visit_count: 1 },
          { month: '2025-02', salesperson: 'James', visit_count: 1 },
          { month: '2025-02', salesperson: 'Luyanda', visit_count: 1 },
          { month: '2025-03', salesperson: 'James', visit_count: 1 },
        ],
      });
      expect(result.data.every((row: { month: string }) => /^\d{4}-\d{2}$/.test(row.month))).toBe(true);
    });

    it('uses the last 12 months as the default range when params are omitted', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-05-13T12:00:00.000Z'));
      mockState.monthlyRows = [
        visit('outside-range', '2025-05-31', 'James'),
        visit('range-start', '2025-06-01', 'James'),
        visit('range-end', '2026-05-13', 'Luyanda'),
      ];

      const response = await getMonthlyFrequency(
        publicRequest('/api/public/site-visits/monthly-frequency')
      );
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toEqual({
        ok: true,
        data: [
          { month: '2025-06', salesperson: 'James', visit_count: 1 },
          { month: '2026-05', salesperson: 'Luyanda', visit_count: 1 },
        ],
      });
    });
  });
});
