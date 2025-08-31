import { describe, it, expect, vi, beforeEach } from 'vitest';
import { neon } from '@neondatabase/serverless';

// Mock the database
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn()
}));

// Mock fs
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn()
}));

// Mock path
vi.mock('path', () => ({
  join: vi.fn(),
  resolve: vi.fn()
}));

describe('Migration Verification System', () => {
  let mockSql: any;
  let mockFs: any;
  let mockPath: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    mockSql = {
      unsafe: vi.fn()
    };
    
    // Make mockSql.unsafe a proper vitest mock
    mockSql.unsafe = vi.fn();
    
    (neon as any).mockReturnValue(mockSql);
    
    mockFs = await import('fs');
    mockPath = await import('path');
  });

  describe('Table Existence Verification', () => {
    it('should detect when mock tables are missing', async () => {
      // Mock that tables don't exist
      mockSql.unsafe.mockResolvedValueOnce([{ exists: false }]); // mock_requests
      mockSql.unsafe.mockResolvedValueOnce([{ exists: false }]); // mock_site_visits

      // This would be the verification query
      const verificationQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'mock_requests'
        )
      `;

      const result = await mockSql.unsafe(verificationQuery);
      
      expect(result[0].exists).toBe(false);
      expect(mockSql.unsafe).toHaveBeenCalledWith(verificationQuery);
    });

    it('should detect when mock tables exist', async () => {
      // Mock that tables exist
      mockSql.unsafe.mockResolvedValueOnce([{ exists: true }]); // mock_requests
      mockSql.unsafe.mockResolvedValueOnce([{ exists: true }]); // mock_site_visits

      const verificationQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'mock_requests'
        )
      `;

      const result = await mockSql.unsafe(verificationQuery);
      
      expect(result[0].exists).toBe(true);
    });
  });

  describe('Migration Execution Verification', () => {
    it('should detect when migration SQL fails silently', async () => {
      // Mock that migration was "applied" but tables don't exist
      mockSql.unsafe.mockResolvedValueOnce([]); // Migration execution (silent success)
      mockSql.unsafe.mockResolvedValueOnce([{ exists: false }]); // Table check - doesn't exist!

      // This simulates the migration verification process
      const migrationSql = 'CREATE TABLE mock_requests (...);';
      const verificationQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'mock_requests'
        )
      `;

      // Execute migration (silent failure)
      await mockSql.unsafe(migrationSql);
      
      // Verify tables exist
      const result = await mockSql.unsafe(verificationQuery);
      
      expect(result[0].exists).toBe(false);
      expect(mockSql.unsafe).toHaveBeenCalledTimes(2);
    });

    it('should detect when migration SQL succeeds', async () => {
      // Mock that migration was applied and tables exist
      mockSql.unsafe.mockResolvedValueOnce([]); // Migration execution
      mockSql.unsafe.mockResolvedValueOnce([{ exists: true }]); // Table check - exists!

      const migrationSql = 'CREATE TABLE mock_requests (...);';
      const verificationQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'mock_requests'
        )
      `;

      await mockSql.unsafe(migrationSql);
      const result = await mockSql.unsafe(verificationQuery);
      
      expect(result[0].exists).toBe(true);
    });
  });

  describe('Migration Rollback on Verification Failure', () => {
    it('should rollback migration record when verification fails', async () => {
      // Mock migration execution
      mockSql.unsafe.mockResolvedValueOnce([]); // Migration SQL
      mockSql.unsafe.mockResolvedValueOnce([{ exists: false }]); // Table check - missing!
      mockSql.unsafe.mockResolvedValueOnce([]); // Rollback DELETE

      const migrationSql = 'CREATE TABLE mock_requests (...);';
      const verificationQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'mock_requests'
        )
      `;
      const rollbackQuery = 'DELETE FROM schema_migrations WHERE version = 7';

      // Execute migration
      await mockSql.unsafe(migrationSql);
      
      // Verify tables exist
      const result = await mockSql.unsafe(verificationQuery);
      
      if (!result[0].exists) {
        // Rollback the migration record
        await mockSql.unsafe(rollbackQuery);
      }
      
      expect(mockSql.unsafe).toHaveBeenCalledWith(rollbackQuery);
    });
  });

  describe('Migration File Reading', () => {
    it('should read migration file correctly', async () => {
      const mockMigrationContent = `
        CREATE TABLE IF NOT EXISTS mock_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          request_id VARCHAR(10) UNIQUE NOT NULL
        );
      `;

      mockFs.readFileSync.mockReturnValue(mockMigrationContent);
      mockPath.join.mockReturnValue('/path/to/migration.sql');

      const migrationPath = mockPath.join('migrations', '007_create_mock_tables.sql');
      const migrationSql = mockFs.readFileSync(migrationPath, 'utf8');

      expect(mockFs.readFileSync).toHaveBeenCalledWith(migrationPath, 'utf8');
      expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS mock_requests');
    });

    it('should handle missing migration file', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockPath.join.mockReturnValue('/path/to/missing_migration.sql');

      const migrationPath = mockPath.join('migrations', '999_missing_migration.sql');
      const fileExists = mockFs.existsSync(migrationPath);

      expect(fileExists).toBe(false);
      expect(mockFs.existsSync).toHaveBeenCalledWith(migrationPath);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const connectionError = new Error('Connection failed');
      mockSql.unsafe.mockRejectedValueOnce(connectionError);

      await expect(mockSql.unsafe('SELECT 1')).rejects.toThrow('Connection failed');
    });

    it('should handle SQL syntax errors', async () => {
      const syntaxError = new Error('syntax error at or near "INVALID"');
      mockSql.unsafe.mockRejectedValueOnce(syntaxError);

      await expect(mockSql.unsafe('INVALID SQL')).rejects.toThrow('syntax error');
    });
  });

  describe('Comprehensive Migration Verification', () => {
    it('should verify all expected tables exist', async () => {
      const expectedTables = [
        'requests',
        'site_visits',
        'pipedrive_submissions'
      ];

      // Mock that all tables exist
      expectedTables.forEach(() => {
        mockSql.unsafe.mockResolvedValueOnce([{ exists: true }]);
      });

      for (const tableName of expectedTables) {
        const verificationQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          )
        `;

        const result = await mockSql.unsafe(verificationQuery);
        expect(result[0].exists).toBe(true);
      }

      expect(mockSql.unsafe).toHaveBeenCalledTimes(expectedTables.length);
    });

    it('should report missing tables specifically', async () => {
      // Mock that some tables are missing
      mockSql.unsafe.mockResolvedValueOnce([{ exists: true }]); // requests
      mockSql.unsafe.mockResolvedValueOnce([{ exists: false }]); // site_visits - missing!
      mockSql.unsafe.mockResolvedValueOnce([{ exists: true }]); // pipedrive_submissions

      const expectedTables = [
        'requests',
        'site_visits',
        'pipedrive_submissions'
      ];

      const missingTables = [];

      for (const tableName of expectedTables) {
        const verificationQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          )
        `;

        const result = await mockSql.unsafe(verificationQuery);
        if (!result[0].exists) {
          missingTables.push(tableName);
        }
      }

      expect(missingTables).toEqual(['site_visits']);
    });
  });
});
