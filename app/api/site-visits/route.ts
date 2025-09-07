import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SiteVisitsRepository } from '@/lib/database/repositories/sales-requests-repository';
import { logInfo, logError, generateCorrelationId, withPerformanceLogging } from '@/lib/log';

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
  
  return await withPerformanceLogging('POST /api/site-visits', 'api', async () => {
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
      
      // Insert into database using Drizzle repository
      const repository = new SiteVisitsRepository();
      
      // Map API fields to database fields
      const siteVisitData = {
        salesperson: validatedData.salesperson,
        plannedMines: validatedData.planned_mines,  // API: planned_mines -> DB: plannedMines
        mainPurpose: validatedData.main_purpose,    // API: main_purpose -> DB: mainPurpose
        availability: validatedData.availability,
        comments: validatedData.comments || null
      };
      
      logInfo('Creating site visit via repository', {
        correlationId,
        repositoryData: {
          salesperson: siteVisitData.salesperson,
          plannedMinesCount: siteVisitData.plannedMines.length,
          mainPurpose: siteVisitData.mainPurpose,
          availability: siteVisitData.availability,
          hasComments: !!siteVisitData.comments
        }
      });
      
      const repositoryResult = await repository.create(siteVisitData);
      
      if (!repositoryResult.success) {
        logError('Repository failed to create site visit', {
          correlationId,
          error: repositoryResult.error?.message,
          errorType: repositoryResult.error?.type
        });
        
        return NextResponse.json({
          ok: false,
          error: 'Failed to save site visit'
        }, { status: 500 });
      }
      
      const savedVisit = repositoryResult.data!; // Safe because we checked repositoryResult.success
      
      logInfo('Site visit saved to database via repository', { 
        correlationId,
        visitId: savedVisit.id,
        date: savedVisit.date,
        createdAt: savedVisit.createdAt
      });
      
      return NextResponse.json({
        ok: true,
        data: {
          id: savedVisit.id,
          date: savedVisit.date,
          salesperson: savedVisit.salesperson,
          planned_mines: savedVisit.plannedMines,     // DB: plannedMines -> API: planned_mines
          main_purpose: savedVisit.mainPurpose,       // DB: mainPurpose -> API: main_purpose  
          availability: savedVisit.availability,
          comments: savedVisit.comments,
          created_at: savedVisit.createdAt
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
  
  return await withPerformanceLogging('GET /api/site-visits', 'api', async () => {
    try {
      logInfo('Site visits fetch request started', { correlationId });
      
      const { searchParams } = new URL(req.url);
      const salesperson = searchParams.get('salesperson');
      const dateStr = searchParams.get('date');
      
      const repository = new SiteVisitsRepository();
      let repositoryResult;
      
      logInfo('Fetching site visits via repository', {
        correlationId,
        salesperson,
        date: dateStr,
        hasFilters: !!(salesperson || dateStr)
      });
      
      // Parse date if provided
      let dateFilter: Date | undefined;
      if (dateStr) {
        dateFilter = new Date(dateStr);
        if (isNaN(dateFilter.getTime())) {
          logError('Invalid date parameter', { correlationId, dateStr });
          return NextResponse.json({
            ok: false,
            error: 'Invalid date format'
          }, { status: 400 });
        }
      }
      
      // Use repository methods based on filters
      if (salesperson && dateFilter) {
        // Both salesperson and date filters
        repositoryResult = await repository.findBySalespersonAndDate(salesperson, dateFilter);
      } else if (salesperson) {
        // Filter by salesperson only
        repositoryResult = await repository.findBySalesperson(salesperson);
      } else if (dateFilter) {
        // Filter by date only  
        repositoryResult = await repository.findByDate(dateFilter);
      } else {
        // No filters - get all
        repositoryResult = await repository.findAll();
      }
      
      if (!repositoryResult.success) {
        logError('Repository failed to fetch site visits', {
          correlationId,
          error: repositoryResult.error?.message,
          errorType: repositoryResult.error?.type
        });
        
        return NextResponse.json({
          ok: false,
          error: 'Failed to fetch site visits'
        }, { status: 500 });
      }
      
      const siteVisits = repositoryResult.data!;
      
      // Transform data to match API format (DB uses camelCase, API expects snake_case)
      const transformedData = siteVisits.map(visit => ({
        id: visit.id,
        date: visit.date,
        salesperson: visit.salesperson,
        planned_mines: visit.plannedMines,
        main_purpose: visit.mainPurpose,
        availability: visit.availability,
        comments: visit.comments,
        created_at: visit.createdAt,
        updated_at: visit.updatedAt
      }));
      
      logInfo('Site visits fetched successfully via repository', { 
        correlationId,
        count: transformedData.length,
        salesperson,
        date: dateStr
      });
      
      return NextResponse.json({
        ok: true,
        data: transformedData
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
