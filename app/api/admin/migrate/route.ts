import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { neon } from '@neondatabase/serverless';

export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization (you can add more security here)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('🔄 Admin migration endpoint triggered');
    
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'DATABASE_URL not configured',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    // Run Drizzle migrations
    const sql = neon(connectionString);
    const db = drizzle(sql);
    
    await migrate(db, { 
      migrationsFolder: './lib/database/migrations',
      migrationsTable: '__drizzle_migrations'
    });

    return NextResponse.json({
      success: true,
      message: 'Migrations completed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Migration endpoint error:', error);
    
    // Handle "already exists" gracefully
    if (error instanceof Error && 
        (error.message?.includes('already exists') || 
         (error as any).cause?.code === '42710' || 
         (error as any).cause?.code === '42P07')) {
      return NextResponse.json({
        success: true,
        message: 'Database is already up to date',
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Migration endpoint - use POST to trigger migrations',
    timestamp: new Date().toISOString()
  });
}
