import { getDatabaseConnection, withDbErrorHandling } from './connection';
import { logInfo, logError, withPerformanceLogging } from '../../log';
import { DatabaseConfig, DatabaseHealth, QueryOptions, FilterConditions } from './types';

/**
 * Get the appropriate table name based on environment
 * Development uses mock tables, production uses real tables
 */
export const getTableName = (baseTableName: string): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const tableName = isDevelopment ? `mock_${baseTableName}` : baseTableName;
  
  logInfo('Table name selected', { 
    environment: process.env.NODE_ENV,
    baseTableName,
    selectedTableName: tableName,
    isMock: isDevelopment
  });
  
  return tableName;
};

/**
 * Get requests table name (requests or mock_requests)
 */
export const getRequestsTableName = (): string => {
  return getTableName('requests');
};

/**
 * Get site visits table name (site_visits or mock_site_visits)
 */
export const getSiteVisitsTableName = (): string => {
  return getTableName('site_visits');
};

/**
 * Database health check utility
 */
export const checkDbHealth = async (): Promise<DatabaseHealth> => {
  return withPerformanceLogging('checkDbHealth', 'database', async () => {
    const startTime = Date.now();
    const sql = getDatabaseConnection();
    
    try {
      const result = await sql`SELECT 1 as health_check`;
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        connected: true,
        responseTime,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        lastCheck: new Date().toISOString(),
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  });
};

/**
 * Generate next sequential request ID using database function
 */
export const generateRequestId = async (): Promise<string> => {
  return withPerformanceLogging('generateRequestId', 'database', async () => {
    const sql = getDatabaseConnection();
    const result = await sql`SELECT generate_request_id()`;
    const newId = (result as any[])[0].generate_request_id;
    logInfo(`Generated new request ID: ${newId}`, { requestId: newId });
    return newId;
  });
};

/**
 * Validate contact JSONB using database function
 */
export const validateContactJsonb = async (contact: any): Promise<boolean> => {
  return withPerformanceLogging('validateContactJsonb', 'database', async () => {
    const sql = getDatabaseConnection();
    const result = await sql`SELECT validate_contact_jsonb(${JSON.stringify(contact)})`;
    const isValid = (result as any[])[0].validate_contact_jsonb;
    logInfo(`Contact JSONB validation result: ${isValid}`, { contact });
    return isValid;
  });
};

/**
 * Build WHERE clause from filter conditions
 */
export const buildWhereClause = (conditions: FilterConditions): string => {
  if (!conditions || Object.keys(conditions).length === 0) {
    return '';
  }
  
  const clauses = Object.entries(conditions)
    .map(([key, value]) => {
      if (value === null) {
        return `${key} IS NULL`;
      } else if (value === undefined) {
        return `${key} IS NULL`;
      } else if (Array.isArray(value)) {
        return `${key} = ANY(${JSON.stringify(value)})`;
      } else {
        return `${key} = ${JSON.stringify(value)}`;
      }
    })
    .join(' AND ');
  
  return `WHERE ${clauses}`;
};

/**
 * Build ORDER BY clause from options
 */
export const buildOrderByClause = (options: QueryOptions): string => {
  if (!options.orderBy) {
    return 'ORDER BY created_at DESC';
  }
  
  const direction = options.orderDirection || 'ASC';
  return `ORDER BY ${options.orderBy} ${direction}`;
};

/**
 * Build LIMIT and OFFSET clause from options
 */
export const buildLimitOffsetClause = (options: QueryOptions): string => {
  const limit = options.limit || 10;
  const offset = options.offset || 0;
  
  return `LIMIT ${limit} OFFSET ${offset}`;
};

/**
 * Execute a query with timing and error handling
 * Note: This is a placeholder for future implementation
 */
export const executeQuery = async <T>(
  query: string,
  params: any[] = [],
  context: string = 'executeQuery'
): Promise<T[]> => {
  throw new Error('executeQuery not implemented - use template literals instead');
};

/**
 * Execute a single row query
 * Note: This is a placeholder for future implementation
 */
export const executeSingleQuery = async <T>(
  query: string,
  params: any[] = [],
  context: string = 'executeSingleQuery'
): Promise<T | null> => {
  throw new Error('executeSingleQuery not implemented - use template literals instead');
};

/**
 * Execute a count query
 * Note: This is a placeholder for future implementation
 */
export const executeCountQuery = async (
  query: string,
  params: any[] = [],
  context: string = 'executeCountQuery'
): Promise<number> => {
  throw new Error('executeCountQuery not implemented - use template literals instead');
};

/**
 * Validate database configuration
 */
export const validateDatabaseConfig = (config: DatabaseConfig): boolean => {
  if (!config.url) {
    throw new Error('Database URL is required');
  }
  
  if (!config.environment) {
    throw new Error('Database environment is required');
  }
  
  return true;
};

/**
 * Get database configuration from environment
 */
export const getDatabaseConfig = (): DatabaseConfig => {
  const config: DatabaseConfig = {
    url: process.env.DATABASE_URL!,
    environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000')
  };
  
  validateDatabaseConfig(config);
  return config;
};

/**
 * Format SQL query for logging (remove sensitive data)
 */
export const formatQueryForLogging = (query: string, params: any[] = []): string => {
  let formattedQuery = query;
  
  // Replace parameter placeholders with values
  params.forEach((param, index) => {
    const placeholder = `$${index + 1}`;
    const value = typeof param === 'string' ? `'${param}'` : String(param);
    formattedQuery = formattedQuery.replace(placeholder, value);
  });
  
  // Truncate long queries for logging
  if (formattedQuery.length > 500) {
    formattedQuery = formattedQuery.substring(0, 500) + '...';
  }
  
  return formattedQuery;
};
