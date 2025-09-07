/**
 * Shared API Types
 * 
 * Common types for API requests and responses that are shared across all feature modules.
 * This ensures consistency in API interfaces and error handling.
 */

/**
 * Base API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Paginated API response interface
 */
export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * API error interface
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * API request metadata interface
 */
export interface ApiRequestMetadata {
  requestId: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * Base API request interface
 */
export interface ApiRequest<T = any> {
  data: T;
  metadata?: ApiRequestMetadata;
}

/**
 * Query parameters interface
 */
export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
  include?: string[];
  exclude?: string[];
}

/**
 * Filter condition interface
 */
export interface FilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'ilike' | 'regex' | 'exists';
  value: any;
}

/**
 * Advanced query interface
 */
export interface AdvancedQuery {
  filters: FilterCondition[];
  sort: Array<{
    field: string;
    order: 'asc' | 'desc';
  }>;
  pagination: {
    page: number;
    limit: number;
  };
  search?: {
    query: string;
    fields: string[];
    operator: 'or' | 'and';
  };
  include?: string[];
  exclude?: string[];
}

/**
 * Bulk operation request interface
 */
export interface BulkOperationRequest<T = any> {
  operations: Array<{
    type: 'create' | 'update' | 'delete';
    data?: T;
    id?: string;
    filters?: FilterCondition[];
  }>;
  options?: {
    validateOnly?: boolean;
    skipValidation?: boolean;
    transaction?: boolean;
  };
}

/**
 * Bulk operation response interface
 */
export interface BulkOperationResponse<T = any> {
  success: boolean;
  results: Array<{
    operation: 'create' | 'update' | 'delete';
    success: boolean;
    data?: T;
    error?: ApiError;
    id?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    errors: ApiError[];
  };
}

/**
 * File upload request interface
 */
export interface FileUploadRequest {
  file: File;
  metadata?: {
    category?: string;
    tags?: string[];
    description?: string;
    public?: boolean;
  };
  options?: {
    compress?: boolean;
    resize?: {
      width?: number;
      height?: number;
      quality?: number;
    };
    format?: 'original' | 'webp' | 'jpeg' | 'png';
  };
}

/**
 * File upload response interface
 */
export interface FileUploadResponse {
  success: boolean;
  file: {
    id: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    url: string;
    thumbnailUrl?: string;
    metadata?: Record<string, any>;
    uploadedAt: string;
  };
  error?: ApiError;
}

/**
 * Webhook payload interface
 */
export interface WebhookPayload<T = any> {
  event: string;
  timestamp: string;
  data: T;
  metadata: {
    webhookId: string;
    signature?: string;
    version: string;
  };
}

/**
 * Webhook response interface
 */
export interface WebhookResponse {
  success: boolean;
  message: string;
  timestamp: string;
  webhookId: string;
}

/**
 * Health check response interface
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheckResult;
    cache: HealthCheckResult;
    externalServices: Record<string, HealthCheckResult>;
  };
}

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  responseTime?: number;
  lastCheck: string;
  details?: Record<string, any>;
}

/**
 * Metrics response interface
 */
export interface MetricsResponse {
  timestamp: string;
  metrics: {
    requests: {
      total: number;
      successful: number;
      failed: number;
      averageResponseTime: number;
    };
    system: {
      memoryUsage: number;
      cpuUsage: number;
      activeConnections: number;
    };
    custom: Record<string, number>;
  };
}

/**
 * API audit log entry interface
 */
export interface ApiAuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}

/**
 * API audit log response interface
 */
export interface ApiAuditLogResponse extends PaginatedApiResponse<ApiAuditLogEntry> {
  summary: {
    totalActions: number;
    uniqueUsers: number;
    successRate: number;
    topActions: Array<{
      action: string;
      count: number;
    }>;
  };
}

/**
 * Export request interface
 */
export interface ExportRequest {
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  query: AdvancedQuery;
  options?: {
    includeHeaders?: boolean;
    dateFormat?: string;
    timezone?: string;
    compression?: boolean;
  };
}

/**
 * Export response interface
 */
export interface ExportResponse {
  success: boolean;
  export: {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    format: string;
    downloadUrl?: string;
    expiresAt: string;
    progress?: number;
    estimatedTimeRemaining?: number;
  };
  error?: ApiError;
}

/**
 * Import request interface
 */
export interface ImportRequest {
  file: File;
  options: {
    format: 'csv' | 'json' | 'xlsx';
    mapping?: Record<string, string>;
    validateOnly?: boolean;
    skipDuplicates?: boolean;
    updateExisting?: boolean;
  };
}

/**
 * Import response interface
 */
export interface ImportResponse {
  success: boolean;
  import: {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    results?: {
      total: number;
      imported: number;
      skipped: number;
      failed: number;
      errors: Array<{
        row: number;
        field: string;
        message: string;
        value?: any;
      }>;
    };
  };
  error?: ApiError;
}

/**
 * Search request interface
 */
export interface SearchRequest {
  query: string;
  filters?: Record<string, any>;
  options?: {
    fuzzy?: boolean;
    highlight?: boolean;
    maxResults?: number;
    includeScore?: boolean;
    fields?: string[];
  };
}

/**
 * Search result interface
 */
export interface SearchResult<T = any> {
  item: T;
  score: number;
  highlights?: Record<string, string[]>;
  matchedFields?: string[];
}

/**
 * Search response interface
 */
export interface SearchResponse<T = any> extends ApiResponse<SearchResult<T>[]> {
  search: {
    query: string;
    totalResults: number;
    searchTime: number;
    suggestions?: string[];
    facets?: Record<string, Array<{
      value: string;
      count: number;
    }>>;
  };
}

/**
 * Notification request interface
 */
export interface NotificationRequest {
  type: 'email' | 'sms' | 'push' | 'webhook';
  recipient: string | string[];
  subject?: string;
  message: string;
  template?: string;
  data?: Record<string, any>;
  options?: {
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    scheduledAt?: string;
    expiresAt?: string;
    retryAttempts?: number;
  };
}

/**
 * Notification response interface
 */
export interface NotificationResponse {
  success: boolean;
  notification: {
    id: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    sentAt?: string;
    deliveredAt?: string;
    error?: string;
  };
  error?: ApiError;
}

/**
 * Rate limit information interface
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * API response headers interface
 */
export interface ApiResponseHeaders {
  'X-Request-ID'?: string;
  'X-RateLimit-Limit'?: string;
  'X-RateLimit-Remaining'?: string;
  'X-RateLimit-Reset'?: string;
  'X-RateLimit-RetryAfter'?: string;
  'X-Pagination-Page'?: string;
  'X-Pagination-Limit'?: string;
  'X-Pagination-Total'?: string;
  'X-Pagination-TotalPages'?: string;
  'X-Cache-Control'?: string;
  'X-Processing-Time'?: string;
}

/**
 * API versioning interface
 */
export interface ApiVersion {
  version: string;
  deprecated?: boolean;
  sunsetDate?: string;
  migrationGuide?: string;
  breakingChanges?: string[];
}

/**
 * API documentation interface
 */
export interface ApiDocumentation {
  version: string;
  title: string;
  description: string;
  baseUrl: string;
  endpoints: Array<{
    path: string;
    method: string;
    description: string;
    parameters?: Array<{
      name: string;
      type: string;
      required: boolean;
      description: string;
    }>;
    requestBody?: {
      type: string;
      schema: any;
      required: boolean;
    };
    responses: Array<{
      code: number;
      description: string;
      schema?: any;
    }>;
    examples?: Array<{
      name: string;
      request: any;
      response: any;
    }>;
  }>;
  schemas: Record<string, any>;
  examples: Record<string, any>;
}

/**
 * API status response interface
 */
export interface ApiStatusResponse {
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  message: string;
  timestamp: string;
  incidents?: Array<{
    id: string;
    title: string;
    description: string;
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
    startedAt: string;
    resolvedAt?: string;
    updates: Array<{
      message: string;
      timestamp: string;
    }>;
  }>;
  maintenance?: {
    scheduled: boolean;
    startTime?: string;
    endTime?: string;
    description?: string;
  };
}
