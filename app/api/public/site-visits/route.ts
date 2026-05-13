import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { requireBearer } from '@/lib/auth/public-api-auth';
import { createStandardConnection } from '@/lib/database/connection-standard';
import { siteVisits } from '@/lib/database/schema';
import { generateCorrelationId, logError } from '@/lib/log';

const yyyyMmDdPattern = /^\d{4}-\d{2}-\d{2}$/;

const isValidDateString = (value: string) => {
  if (!yyyyMmDdPattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const optionalDateParam = z
  .string()
  .refine(isValidDateString, 'Expected date in YYYY-MM-DD format')
  .optional();

const QuerySchema = z.object({
  from: optionalDateParam,
  to: optionalDateParam,
  salesperson: z.enum(['James', 'Luyanda', 'Stefan']).optional(),
  limit: z
    .preprocess(
      (value) => (value === undefined || value === '' ? undefined : Number(value)),
      z.number().int().min(1).max(1000).default(500)
    ),
});

export async function GET(req: NextRequest) {
  const authResponse = requireBearer(req);
  if (authResponse) {
    return authResponse;
  }

  const correlationId = generateCorrelationId();

  try {
    const { searchParams } = new URL(req.url);
    const query = QuerySchema.parse({
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
      salesperson: searchParams.get('salesperson') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    const filters: SQL[] = [];

    if (query.from) {
      filters.push(gte(siteVisits.date, query.from));
    }

    if (query.to) {
      filters.push(lte(siteVisits.date, query.to));
    }

    if (query.salesperson) {
      filters.push(eq(siteVisits.salesperson, query.salesperson));
    }

    const { db } = createStandardConnection();
    const selectedFields = {
      id: siteVisits.id,
      date: siteVisits.date,
      salesperson: siteVisits.salesperson,
      plannedMines: siteVisits.plannedMines,
      mainPurpose: siteVisits.mainPurpose,
      comments: siteVisits.comments,
    };

    const rows = filters.length > 0
      ? await db
          .select(selectedFields)
          .from(siteVisits)
          .where(and(...filters))
          .orderBy(desc(siteVisits.date))
          .limit(query.limit)
      : await db
          .select(selectedFields)
          .from(siteVisits)
          .orderBy(desc(siteVisits.date))
          .limit(query.limit);

    const data = rows.map((visit) => ({
      id: visit.id,
      date: visit.date,
      salesperson: visit.salesperson,
      planned_mines: visit.plannedMines,
      main_purpose: visit.mainPurpose,
      comments: visit.comments,
    }));

    return NextResponse.json({ ok: true, data, count: data.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.issues },
        { status: 400 }
      );
    }

    logError('Public site visits fetch failed', {
      correlationId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { ok: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
