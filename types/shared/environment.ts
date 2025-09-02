/**
 * Shared Environment Types
 * 
 * Common types for environment configuration that are shared across all feature modules.
 * This ensures consistency in environment variable handling and validation.
 */

/**
 * Base environment configuration interface
 */
export interface BaseEnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  DEBUG: boolean;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  TIMEZONE: string;
  LOCALE: string;
}

/**
 * Database environment configuration
 */
export interface DatabaseEnvironmentConfig {
  DATABASE_URL: string;
  DB_MAX_CONNECTIONS?: number;
  DB_CONNECTION_TIMEOUT?: number;
  DB_QUERY_TIMEOUT?: number;
  DB_SSL?: boolean;
  DB_SSL_CA?: string;
  DB_SSL_CERT?: string;
  DB_SSL_KEY?: string;
  DB_SSL_REJECT_UNAUTHORIZED?: boolean;
}

/**
 * Redis environment configuration
 */
export interface RedisEnvironmentConfig {
  REDIS_URL?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_PASSWORD?: string;
  REDIS_DB?: number;
  REDIS_TLS?: boolean;
  REDIS_TLS_CA?: string;
  REDIS_TLS_CERT?: string;
  REDIS_TLS_KEY?: string;
  REDIS_TLS_REJECT_UNAUTHORIZED?: boolean;
  REDIS_MAX_RETRIES?: number;
  REDIS_RETRY_DELAY?: number;
  REDIS_TIMEOUT?: number;
}

/**
 * Authentication environment configuration
 */
export interface AuthEnvironmentConfig {
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_WORKSPACE_DOMAIN?: string;
  GOOGLE_ALLOWED_DOMAINS?: string;
  AUTH_SESSION_MAX_AGE?: number;
  AUTH_SESSION_UPDATE_AGE?: number;
  AUTH_SESSION_SECURE?: boolean;
  AUTH_ENABLE_RBAC?: boolean;
  AUTH_DEFAULT_ROLE?: string;
  AUTH_ADMIN_EMAILS?: string;
}

/**
 * External services environment configuration
 */
export interface ExternalServicesEnvironmentConfig {
  PIPEDRIVE_API_KEY?: string;
  PIPEDRIVE_DOMAIN?: string;
  PIPEDRIVE_WEBHOOK_SECRET?: string;
  SLACK_WEBHOOK_URL?: string;
  SLACK_BOT_TOKEN?: string;
  SLACK_SIGNING_SECRET?: string;
  MCP_SERVER_URL?: string;
  MCP_SERVER_API_KEY?: string;
  MCP_SERVER_TIMEOUT?: number;
  MCP_SERVER_RETRY_ATTEMPTS?: number;
}

/**
 * File storage environment configuration
 */
export interface FileStorageEnvironmentConfig {
  STORAGE_PROVIDER: 'local' | 's3' | 'gcs' | 'azure';
  STORAGE_BUCKET?: string;
  STORAGE_REGION?: string;
  STORAGE_ACCESS_KEY?: string;
  STORAGE_SECRET_KEY?: string;
  STORAGE_ENDPOINT?: string;
  STORAGE_FORCE_PATH_STYLE?: boolean;
  STORAGE_MAX_FILE_SIZE?: number;
  STORAGE_ALLOWED_MIME_TYPES?: string[];
  STORAGE_ENCRYPTION?: boolean;
  STORAGE_ENCRYPTION_KEY?: string;
}

/**
 * Email environment configuration
 */
export interface EmailEnvironmentConfig {
  EMAIL_PROVIDER: 'smtp' | 'sendgrid' | 'mailgun' | 'ses' | 'resend';
  EMAIL_FROM: string;
  EMAIL_REPLY_TO?: string;
  EMAIL_SMTP_HOST?: string;
  EMAIL_SMTP_PORT?: number;
  EMAIL_SMTP_USER?: string;
  EMAIL_SMTP_PASS?: string;
  EMAIL_SMTP_SECURE?: boolean;
  EMAIL_SENDGRID_API_KEY?: string;
  EMAIL_MAILGUN_API_KEY?: string;
  EMAIL_MAILGUN_DOMAIN?: string;
  EMAIL_SES_ACCESS_KEY?: string;
  EMAIL_SES_SECRET_KEY?: string;
  EMAIL_SES_REGION?: string;
  EMAIL_RESEND_API_KEY?: string;
}

/**
 * SMS environment configuration
 */
export interface SMSEnvironmentConfig {
  SMS_PROVIDER: 'twilio' | 'aws-sns' | 'sendgrid' | 'none';
  SMS_TWILIO_ACCOUNT_SID?: string;
  SMS_TWILIO_AUTH_TOKEN?: string;
  SMS_TWILIO_FROM_NUMBER?: string;
  SMS_AWS_SNS_ACCESS_KEY?: string;
  SMS_AWS_SNS_SECRET_KEY?: string;
  SMS_AWS_SNS_REGION?: string;
  SMS_SENDGRID_API_KEY?: string;
  SMS_SENDGRID_FROM_NUMBER?: string;
}

/**
 * Push notification environment configuration
 */
export interface PushNotificationEnvironmentConfig {
  PUSH_PROVIDER: 'firebase' | 'aws-sns' | 'none';
  PUSH_FIREBASE_PROJECT_ID?: string;
  PUSH_FIREBASE_PRIVATE_KEY?: string;
  PUSH_FIREBASE_CLIENT_EMAIL?: string;
  PUSH_AWS_SNS_ACCESS_KEY?: string;
  PUSH_AWS_SNS_SECRET_KEY?: string;
  PUSH_AWS_SNS_REGION?: string;
  PUSH_AWS_SNS_PLATFORM_APPLICATION_ARN?: string;
}

/**
 * Monitoring environment configuration
 */
export interface MonitoringEnvironmentConfig {
  MONITORING_ENABLED: boolean;
  MONITORING_PROVIDER: 'sentry' | 'datadog' | 'newrelic' | 'none';
  MONITORING_SENTRY_DSN?: string;
  MONITORING_SENTRY_ENVIRONMENT?: string;
  MONITORING_DATADOG_API_KEY?: string;
  MONITORING_DATADOG_APP_KEY?: string;
  MONITORING_DATADOG_SITE?: string;
  MONITORING_NEWRELIC_LICENSE_KEY?: string;
  MONITORING_NEWRELIC_APP_NAME?: string;
  MONITORING_NEWRELIC_DISTRIBUTED_TRACING?: boolean;
}

/**
 * Logging environment configuration
 */
export interface LoggingEnvironmentConfig {
  LOGGING_ENABLED: boolean;
  LOGGING_PROVIDER: 'console' | 'file' | 'syslog' | 'cloudwatch' | 'stackdriver';
  LOGGING_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  LOGGING_FORMAT: 'json' | 'text' | 'syslog';
  LOGGING_TIMESTAMP_FORMAT?: string;
  LOGGING_FILE_PATH?: string;
  LOGGING_FILE_MAX_SIZE?: number;
  LOGGING_FILE_MAX_FILES?: number;
  LOGGING_CLOUDWATCH_GROUP?: string;
  LOGGING_CLOUDWATCH_STREAM?: string;
  LOGGING_CLOUDWATCH_REGION?: string;
  LOGGING_STACKDRIVER_PROJECT_ID?: string;
  LOGGING_STACKDRIVER_LOG_NAME?: string;
}

/**
 * Security environment configuration
 */
export interface SecurityEnvironmentConfig {
  SECURITY_ENABLED: boolean;
  SECURITY_CORS_ORIGINS?: string[];
  SECURITY_CORS_METHODS?: string[];
  SECURITY_CORS_HEADERS?: string[];
  SECURITY_CORS_CREDENTIALS?: boolean;
  SECURITY_CORS_MAX_AGE?: number;
  SECURITY_RATE_LIMIT_ENABLED?: boolean;
  SECURITY_RATE_LIMIT_WINDOW?: number;
  SECURITY_RATE_LIMIT_MAX_REQUESTS?: number;
  SECURITY_CSRF_ENABLED?: boolean;
  SECURITY_CSRF_SECRET?: string;
  SECURITY_HELMET_ENABLED?: boolean;
  SECURITY_CONTENT_SECURITY_POLICY?: string;
  SECURITY_STRICT_TRANSPORT_SECURITY?: boolean;
  SECURITY_X_FRAME_OPTIONS?: string;
  SECURITY_X_CONTENT_TYPE_OPTIONS?: boolean;
  SECURITY_X_XSS_PROTECTION?: boolean;
  SECURITY_REFERRER_POLICY?: string;
  SECURITY_PERMISSIONS_POLICY?: string;
}

/**
 * Performance environment configuration
 */
export interface PerformanceEnvironmentConfig {
  PERFORMANCE_ENABLED: boolean;
  PERFORMANCE_COMPRESSION_ENABLED?: boolean;
  PERFORMANCE_COMPRESSION_LEVEL?: number;
  PERFORMANCE_COMPRESSION_THRESHOLD?: number;
  PERFORMANCE_CACHE_ENABLED?: boolean;
  PERFORMANCE_CACHE_TTL?: number;
  PERFORMANCE_CACHE_MAX_SIZE?: number;
  PERFORMANCE_CACHE_STRATEGY?: 'lru' | 'lfu' | 'fifo';
  PERFORMANCE_CDN_ENABLED?: boolean;
  PERFORMANCE_CDN_URL?: string;
  PERFORMANCE_CDN_PURGE_ENABLED?: boolean;
  PERFORMANCE_CDN_PURGE_API_KEY?: string;
}

/**
 * Development environment configuration
 */
export interface DevelopmentEnvironmentConfig {
  DEV_ENABLED: boolean;
  DEV_HOT_RELOAD?: boolean;
  DEV_SOURCE_MAPS?: boolean;
  DEV_ESLINT_ENABLED?: boolean;
  DEV_PRETTIER_ENABLED?: boolean;
  DEV_TYPE_CHECK_ENABLED?: boolean;
  DEV_TESTS_ENABLED?: boolean;
  DEV_COVERAGE_ENABLED?: boolean;
  DEV_MOCK_ENABLED?: boolean;
  DEV_DEBUG_ENABLED?: boolean;
  DEV_PROFILING_ENABLED?: boolean;
}

/**
 * Testing environment configuration
 */
export interface TestingEnvironmentConfig {
  TEST_ENABLED: boolean;
  TEST_FRAMEWORK: 'jest' | 'vitest' | 'mocha' | 'none';
  TEST_COVERAGE_ENABLED?: boolean;
  TEST_COVERAGE_THRESHOLD?: number;
  TEST_COVERAGE_REPORTERS?: string[];
  TEST_MOCK_ENABLED?: boolean;
  TEST_MOCK_PROVIDERS?: string[];
  TEST_TIMEOUT?: number;
  TEST_RETRIES?: number;
  TEST_PARALLEL?: boolean;
  TEST_WATCH?: boolean;
  TEST_UPDATE_SNAPSHOTS?: boolean;
}

/**
 * Complete environment configuration interface
 */
export interface CompleteEnvironmentConfig extends
  BaseEnvironmentConfig,
  DatabaseEnvironmentConfig,
  RedisEnvironmentConfig,
  AuthEnvironmentConfig,
  ExternalServicesEnvironmentConfig,
  FileStorageEnvironmentConfig,
  EmailEnvironmentConfig,
  SMSEnvironmentConfig,
  PushNotificationEnvironmentConfig,
  MonitoringEnvironmentConfig,
  LoggingEnvironmentConfig,
  SecurityEnvironmentConfig,
  PerformanceEnvironmentConfig,
  DevelopmentEnvironmentConfig,
  TestingEnvironmentConfig {}

/**
 * Environment variable validation result
 */
export interface EnvironmentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
  invalid: string[];
  unused: string[];
}

/**
 * Environment configuration loader interface
 */
export interface EnvironmentConfigLoader {
  load(): CompleteEnvironmentConfig;
  validate(): EnvironmentValidationResult;
  loadAndValidate(): {
    config: CompleteEnvironmentConfig;
    validation: EnvironmentValidationResult;
  };
  getRequired(): string[];
  getOptional(): string[];
  getDefaults(): Partial<CompleteEnvironmentConfig>;
}

/**
 * Environment configuration validator interface
 */
export interface EnvironmentConfigValidator {
  validateConfig(config: Partial<CompleteEnvironmentConfig>): EnvironmentValidationResult;
  validateRequired(config: Partial<CompleteEnvironmentConfig>): string[];
  validateTypes(config: Partial<CompleteEnvironmentConfig>): string[];
  validateFormats(config: Partial<CompleteEnvironmentConfig>): string[];
  validateDependencies(config: Partial<CompleteEnvironmentConfig>): string[];
  validateConflicts(config: Partial<CompleteEnvironmentConfig>): string[];
}

/**
 * Environment configuration transformer interface
 */
export interface EnvironmentConfigTransformer {
  transform(config: Record<string, string>): CompleteEnvironmentConfig;
  transformDatabase(config: Record<string, string>): DatabaseEnvironmentConfig;
  transformRedis(config: Record<string, string>): RedisEnvironmentConfig;
  transformAuth(config: Record<string, string>): AuthEnvironmentConfig;
  transformExternalServices(config: Record<string, string>): ExternalServicesEnvironmentConfig;
  transformFileStorage(config: Record<string, string>): FileStorageEnvironmentConfig;
  transformEmail(config: Record<string, string>): EmailEnvironmentConfig;
  transformSMS(config: Record<string, string>): SMSEnvironmentConfig;
  transformPushNotification(config: Record<string, string>): PushNotificationEnvironmentConfig;
  transformMonitoring(config: Record<string, string>): MonitoringEnvironmentConfig;
  transformLogging(config: Record<string, string>): LoggingEnvironmentConfig;
  transformSecurity(config: Record<string, string>): SecurityEnvironmentConfig;
  transformPerformance(config: Record<string, string>): PerformanceEnvironmentConfig;
  transformDevelopment(config: Record<string, string>): DevelopmentEnvironmentConfig;
  transformTesting(config: Record<string, string>): TestingEnvironmentConfig;
}

/**
 * Environment configuration provider interface
 */
export interface EnvironmentConfigProvider {
  get(): CompleteEnvironmentConfig;
  getDatabase(): DatabaseEnvironmentConfig;
  getRedis(): RedisEnvironmentConfig;
  getAuth(): AuthEnvironmentConfig;
  getExternalServices(): ExternalServicesEnvironmentConfig;
  getFileStorage(): FileStorageEnvironmentConfig;
  getEmail(): EmailEnvironmentConfig;
  getSMS(): SMSEnvironmentConfig;
  getPushNotification(): PushNotificationEnvironmentConfig;
  getMonitoring(): MonitoringEnvironmentConfig;
  getLogging(): LoggingEnvironmentConfig;
  getSecurity(): SecurityEnvironmentConfig;
  getPerformance(): PerformanceEnvironmentConfig;
  getDevelopment(): DevelopmentEnvironmentConfig;
  getTesting(): TestingEnvironmentConfig;
  isDevelopment(): boolean;
  isProduction(): boolean;
  isTest(): boolean;
  isDebug(): boolean;
}

/**
 * Environment configuration manager interface
 */
export interface EnvironmentConfigManager extends
  EnvironmentConfigLoader,
  EnvironmentConfigValidator,
  EnvironmentConfigTransformer,
  EnvironmentConfigProvider {
  reload(): void;
  reset(): void;
  update(updates: Partial<CompleteEnvironmentConfig>): void;
  validateUpdate(updates: Partial<CompleteEnvironmentConfig>): EnvironmentValidationResult;
  export(): Record<string, string>;
  import(config: Record<string, string>): void;
  diff(other: CompleteEnvironmentConfig): {
    added: string[];
    removed: string[];
    changed: string[];
    unchanged: string[];
  };
}
