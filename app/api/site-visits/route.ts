import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/database';
import { logInfo, logError } from '@/lib/log';
import { generateCorrelationId } from '@/lib/utils';
import { withTiming } from '@/lib/log';

// Validation schema for check-in data
const CheckInSchema = z.object({
  salesperson: z.enum(['James', 'Luyanda', 'Stefan'], {
    errorMap: () => ({ message: "Salesperson must be one of: James, Luyanda, Stefan" })
  }),
  planned_mines: z.array(z.string().min(1)).min(1, "At least one mine must be selected"),
  main_purpose: z.enum(['Quote follow-up', 'Delivery', 'Site check', 'Installation support', 'General sales visit'], {
    errorMap: () => ({ message: "Invalid purpose selected" })
  }),
  availability: z.enum(['Later this morning', 'In the afternoon', 'Tomorrow'], {
    errorMap: () => ({ message: "Invalid availability selected" })
  }),
  comments: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  
  return await withTiming('POST /api/site-visits', async () => {
    try {
      logInfo('Site visit check-in request started', { correlationId });
      
      const body = await req.json();
      
      // Validate request body
      const validatedData = CheckInSchema.parse(body);
      
      logInfo('Check-in data validated', { 
        correlationId,
        salesperson: validatedData.salesperson,
        minesCount: validatedData.planned_mines.length,
        purpose: validatedData.main_purpose
      });
      
      // Insert into database
      const query = `
        INSERT INTO site_visits (
          salesperson, 
          planned_mines, 
          main_purpose, 
          availability, 
          comments
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id, date, created_at
      `;
      
      const values = [
        validatedData.salesperson,
        validatedData.planned_mines,
        validatedData.main_purpose,
        validatedData.availability,
        validatedData.comments || null
      ];
      
      const result = await db.query(query, values);
      const savedVisit = result.rows[0];
      
      logInfo('Site visit saved to database', { 
        correlationId,
        visitId: savedVisit.id,
        date: savedVisit.date
      });
      
      return NextResponse.json({
        ok: true,
        data: {
          id: savedVisit.id,
          date: savedVisit.date,
          salesperson: validatedData.salesperson,
          planned_mines: validatedData.planned_mines,
          main_purpose: validatedData.main_purpose,
          availability: validatedData.availability,
          comments: validatedData.comments,
          created_at: savedVisit.created_at
        }
      });
      
    } catch (error) {
      logError('Site visit check-in failed', { 
        correlationId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          ok: false,
          error: 'Validation failed',
          details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        }, { status: 400 });
      }
      
      return NextResponse.json({
        ok: false,
        error: 'Failed to save site visit'
      }, { status: 500 });
    }
  });
}

export async function GET(req: NextRequest) {
  const correlationId = generateCorrelationId();
  
  return await withTiming('GET /api/site-visits', async () => {
    try {
      logInfo('Site visits fetch request started', { correlationId });
      
      const { searchParams } = new URL(req.url);
      const salesperson = searchParams.get('salesperson');
      const date = searchParams.get('date');
      
      let query = `
        SELECT id, date, salesperson, planned_mines, main_purpose, availability, comments, created_at, updated_at
        FROM site_visits
      `;
      
      const values: any[] = [];
      let paramCount = 0;
      
      if (salesperson) {
        paramCount++;
        query += ` WHERE salesperson = $${paramCount}`;
        values.push(salesperson);
      }
      
      if (date) {
        paramCount++;
        const whereClause = salesperson ? ' AND' : ' WHERE';
        query += `${whereClause} date = $${paramCount}`;
        values.push(date);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await db.query(query, values);
      
      logInfo('Site visits fetched successfully', { 
        correlationId,
        count: result.rows.length
      });
      
      return NextResponse.json({
        ok: true,
        data: result.rows
      });
      
    } catch (error) {
      logError('Site visits fetch failed', { 
        correlationId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return NextResponse.json({
        ok: false,
        error: 'Failed to fetch site visits'
      }, { status: 500 });
    }
  });
}
