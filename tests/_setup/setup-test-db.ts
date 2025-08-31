import { getTestDb, getTableName } from '../../lib/config/test-env';
import { readFileSync } from 'fs';
import { join } from 'path';

export const setupTestDatabase = async () => {
  const db = getTestDb();
  
  try {
    // Read and execute the SQL setup script
    const sqlScript = readFileSync(
      join(__dirname, 'create-test-tables.sql'), 
      'utf8'
    );
    
    // Split the script into individual statements and execute them
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db(statement);
      }
    }
    
    console.log('Test database tables created successfully');
    
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
};

// Alternative approach - execute statements individually
export const setupTestDatabaseManual = async () => {
  const db = getTestDb();
  
  try {
    // Create test_requests table
    await db(`
      CREATE TABLE IF NOT EXISTS test_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        salesperson_first_name TEXT,
        mine_group TEXT,
        mine_name TEXT,
        contact JSONB,
        line_items JSONB DEFAULT '[]'::jsonb,
        comment TEXT,
        pipedrive_deal_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Create test_kv_cache table
    await db(`
      CREATE TABLE IF NOT EXISTS test_kv_cache (
        key TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE
      );
    `);
    
    // Create test_pipedrive_submissions table
    await db(`
      CREATE TABLE IF NOT EXISTS test_pipedrive_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id TEXT NOT NULL,
        simulated_deal_id INTEGER NOT NULL,
        submission_data JSONB NOT NULL,
        status TEXT DEFAULT 'Submitted',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Create indexes
    await db(`CREATE INDEX IF NOT EXISTS idx_test_requests_status ON test_requests(status);`);
    await db(`CREATE INDEX IF NOT EXISTS idx_test_requests_salesperson ON test_requests(salesperson_first_name);`);
    await db(`CREATE INDEX IF NOT EXISTS idx_test_requests_created_at ON test_requests(created_at);`);
    await db(`CREATE INDEX IF NOT EXISTS idx_test_kv_cache_expires_at ON test_kv_cache(expires_at);`);
    await db(`CREATE INDEX IF NOT EXISTS idx_test_pipedrive_submissions_request_id ON test_pipedrive_submissions(request_id);`);
    
    console.log('Test database tables created successfully');
    
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
};

export const teardownTestDatabase = async () => {
  const db = getTestDb();
  
  try {
    // Drop test tables
    await db(`DROP TABLE IF EXISTS test_pipedrive_submissions CASCADE;`);
    await db(`DROP TABLE IF EXISTS test_kv_cache CASCADE;`);
    await db(`DROP TABLE IF EXISTS test_requests CASCADE;`);
    await db(`DROP FUNCTION IF EXISTS update_test_updated_at_column() CASCADE;`);
    
    console.log('Test database tables dropped successfully');
    
  } catch (error) {
    console.error('Test database teardown failed:', error);
    // Don't throw - teardown should be best effort
  }
};
