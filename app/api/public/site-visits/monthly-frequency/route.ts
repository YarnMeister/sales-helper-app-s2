import { NextRequest, NextResponse } from 'next/server';
import { and, asc, count, eq, gte, lt } from 'drizzle-orm';
import { z } from 'zod';
import { requireBearer } from '@/lib/auth/public-api-auth';
import { createStandardConnection, sql } from '@/lib/database/connection-standard';
import { siteVisits } from '@/lib/database/schema';
import { logError } from '@/lib/log';

export const dynamic = 'force-dynamic';

const MonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected YYYY-MM');
const SalespersonSchema = z.enum(['James', 'Luyanda', 'Stefan']);

const QuerySchema = z.object({
  from: MonthSchema.optional(),
  to: MonthSchema.optional(),
  salesperson: SalespersonSchema.optional(),
});

const addMonths = (date: Date, months: number) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));

const currentMonthStart = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
};

const formatMonth = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const parseMonthStart = (month: string) => {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1));
};

const formatMonthValue = (value: Date | string) => {
  if (value instanceof Date) {
    return formatMonth(value);
  }

  const monthMatch = value.match(/^\d{4}-\d{2}/);
  if (monthMatch) {
    return monthMatch[0];
  }

  return formatMonth(new Date(value));
};

export async function GET(req: NextRequest) {
  const unauthorized = requireBearer(req);
  if (unauthorized) {
    return unauthorized;
  }

  const { searchParams } = new URL(req.url);
  const parsedQuery = QuerySchema.safeParse({
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
    salesperson: searchParams.get('salesperson') ?? undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      { ok: false, error: parsedQuery.error.issues.map((issue) => issue.message) },
      { status: 400 }
    );
  }

  const defaultTo = currentMonthStart();
  const defaultFrom = addMonths(defaultTo, -11);
  const fromMonth = parsedQuery.data.from ?? formatMonth(defaultFrom);
  const toMonth = parsedQuery.data.to ?? formatMonth(defaultTo);

  if (fromMonth > toMonth) {
    return NextResponse.json(
      { ok: false, error: 'from must be before or equal to to' },
      { status: 400 }
    );
  }

  const fromDate = parseMonthStart(fromMonth);
  const toExclusiveDate = addMonths(parseMonthStart(toMonth), 1);
  const monthExpression = sql<Date>`date_trunc('month', ${siteVisits.date})`;
  const filters = [
    gte(siteVisits.date, fromDate),
    lt(siteVisits.date, toExclusiveDate),
  ];

  if (parsedQuery.data.salesperson) {
    filters.push(eq(siteVisits.salesperson, parsedQuery.data.salesperson));
  }

  try {
    const { db } = createStandardConnection();
    const rows = await db
      .select({
        month: monthExpression,
        salesperson: siteVisits.salesperson,
        visit_count: count(siteVisits.id),
      })
      .from(siteVisits)
      .where(and(...filters))
      .groupBy(monthExpression, siteVisits.salesperson)
      .orderBy(asc(monthExpression), asc(siteVisits.salesperson));

    return NextResponse.json({
      ok: true,
      data: rows.map((row) => ({
        month: formatMonthValue(row.month),
        salesperson: row.salesperson,
        visit_count: Number(row.visit_count),
      })),
    });
  } catch (error) {
    logError('Failed to fetch monthly site visit frequency', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { ok: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
