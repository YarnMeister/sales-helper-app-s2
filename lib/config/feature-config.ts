/**
 * Feature-Specific Environment Configuration
 * 
 * Separates configuration requirements for different features in the modular architecture.
 * Each feature can define its own configuration schema and validation.
 */

import { z } from 'zod';

/**
 * Base configuration interface that all features extend
 */
export interface BaseFeatureConfig {
  enabled: boolean;
  environment: 'development' | 'production' | 'test';
  debug: boolean;
}

/**
 * Sales Requests Feature Configuration
 */
export interface SalesRequestsConfig extends BaseFeatureConfig {
  maxLineItems: number;
  allowDraftSaves: boolean;
  autoGenerateQR: boolean;
  contactValidation: {
    requireEmail: boolean;
    requirePhone: boolean;
    allowAnonymous: boolean;
  };
  submission: {
    requireApproval: boolean;
    autoSubmitToPipedrive: boolean;
    retryAttempts: number;
  };
}

/**
 * Flow Metrics Feature Configuration
 */
export interface FlowMetricsConfig extends BaseFeatureConfig {
  dataRetention: {
    days: number;
    autoArchive: boolean;
  };
  calculations: {
    enableRealTime: boolean;
    cacheResults: boolean;
    refreshInterval: number;
  };
  pipedrive: {
    syncEnabled: boolean;
    syncInterval: number;
    webhookEnabled: boolean;
  };
  reporting: {
    enableExport: boolean;
    maxExportRows: number;
    scheduledReports: boolean;
  };
}

/**
 * Voice Commands Feature Configuration
 */
export interface VoiceCommandsConfig extends BaseFeatureConfig {
  mcpServer: {
    url: string;
    apiKey: string;
    timeout: number;
    retryAttempts: number;
  };
  audio: {
    format: 'wav' | 'mp3' | 'ogg';
    quality: 'low' | 'medium' | 'high';
    maxDuration: number;
  };
  commands: {
    maxHistory: number;
    enableCustomCommands: boolean;
    requireConfirmation: boolean;
  };
}

/**
 * Customer Sentiment Feature Configuration
 */
export interface CustomerSentimentConfig extends BaseFeatureConfig {
  surveys: {
    maxQuestions: number;
    allowAnonymous: boolean;
    requireContact: boolean;
  };
  responses: {
    autoAnalysis: boolean;
    sentimentThreshold: number;
    alertOnNegative: boolean;
  };
  analytics: {
    enableRealTime: boolean;
    dataRetention: number;
    exportFormats: string[];
  };
}

/**
 * Authentication Feature Configuration
 */
export interface AuthenticationConfig extends BaseFeatureConfig {
  google: {
    clientId: string;
    clientSecret: string;
    workspaceDomain: string;
    allowedDomains: string[];
  };
  session: {
    maxAge: number;
    updateAge: number;
    secure: boolean;
  };
  permissions: {
    enableRoleBasedAccess: boolean;
    defaultRole: string;
    adminEmails: string[];
  };
}

/**
 * Offline Support Feature Configuration
 */
export interface OfflineSupportConfig extends BaseFeatureConfig {
  queue: {
    maxSize: number;
    persistence: boolean;
    retryStrategy: 'immediate' | 'exponential' | 'fixed';
  };
  sync: {
    enableAutoSync: boolean;
    syncInterval: number;
    conflictResolution: 'server-wins' | 'client-wins' | 'manual';
  };
  storage: {
    maxLocalStorage: number;
    enableCompression: boolean;
    encryption: boolean;
  };
}

/**
 * Configuration validation schemas
 */
export const salesRequestsConfigSchema = z.object({
  enabled: z.boolean(),
  environment: z.enum(['development', 'production', 'test']),
  debug: z.boolean(),
  maxLineItems: z.number().min(1).max(100),
  allowDraftSaves: z.boolean(),
  autoGenerateQR: z.boolean(),
  contactValidation: z.object({
    requireEmail: z.boolean(),
    requirePhone: z.boolean(),
    allowAnonymous: z.boolean(),
  }),
  submission: z.object({
    requireApproval: z.boolean(),
    autoSubmitToPipedrive: z.boolean(),
    retryAttempts: z.number().min(0).max(10),
  }),
});

export const flowMetricsConfigSchema = z.object({
  enabled: z.boolean(),
  environment: z.enum(['development', 'production', 'test']),
  debug: z.boolean(),
  dataRetention: z.object({
    days: z.number().min(1).max(3650),
    autoArchive: z.boolean(),
  }),
  calculations: z.object({
    enableRealTime: z.boolean(),
    cacheResults: z.boolean(),
    refreshInterval: z.number().min(1000).max(300000),
  }),
  pipedrive: z.object({
    syncEnabled: z.boolean(),
    syncInterval: z.number().min(5000).max(300000),
    webhookEnabled: z.boolean(),
  }),
  reporting: z.object({
    enableExport: z.boolean(),
    maxExportRows: z.number().min(100).max(100000),
    scheduledReports: z.boolean(),
  }),
});

export const voiceCommandsConfigSchema = z.object({
  enabled: z.boolean(),
  environment: z.enum(['development', 'production', 'test']),
  debug: z.boolean(),
  mcpServer: z.object({
    url: z.string().url(),
    apiKey: z.string().min(1),
    timeout: z.number().min(1000).max(60000),
    retryAttempts: z.number().min(0).max(5),
  }),
  audio: z.object({
    format: z.enum(['wav', 'mp3', 'ogg']),
    quality: z.enum(['low', 'medium', 'high']),
    maxDuration: z.number().min(1000).max(300000),
  }),
  commands: z.object({
    maxHistory: z.number().min(10).max(1000),
    enableCustomCommands: z.boolean(),
    requireConfirmation: z.boolean(),
  }),
});

export const customerSentimentConfigSchema = z.object({
  enabled: z.boolean(),
  environment: z.enum(['development', 'production', 'test']),
  debug: z.boolean(),
  surveys: z.object({
    maxQuestions: z.number().min(1).max(50),
    allowAnonymous: z.boolean(),
    requireContact: z.boolean(),
  }),
  responses: z.object({
    autoAnalysis: z.boolean(),
    sentimentThreshold: z.number().min(-1).max(1),
    alertOnNegative: z.boolean(),
  }),
  analytics: z.object({
    enableRealTime: z.boolean(),
    dataRetention: z.number().min(1).max(3650),
    exportFormats: z.array(z.string()),
  }),
});

export const authenticationConfigSchema = z.object({
  enabled: z.boolean(),
  environment: z.enum(['development', 'production', 'test']),
  debug: z.boolean(),
  google: z.object({
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    workspaceDomain: z.string().min(1),
    allowedDomains: z.array(z.string()),
  }),
  session: z.object({
    maxAge: z.number().min(300).max(86400),
    updateAge: z.number().min(0).max(86400),
    secure: z.boolean(),
  }),
  permissions: z.object({
    enableRoleBasedAccess: z.boolean(),
    defaultRole: z.string().min(1),
    adminEmails: z.array(z.string().email()),
  }),
});

export const offlineSupportConfigSchema = z.object({
  enabled: z.boolean(),
  environment: z.enum(['development', 'production', 'test']),
  debug: z.boolean(),
  queue: z.object({
    maxSize: z.number().min(100).max(100000),
    persistence: z.boolean(),
    retryStrategy: z.enum(['immediate', 'exponential', 'fixed']),
  }),
  sync: z.object({
    enableAutoSync: z.boolean(),
    syncInterval: z.number().min(1000).max(300000),
    conflictResolution: z.enum(['server-wins', 'client-wins', 'manual']),
  }),
  storage: z.object({
    maxLocalStorage: z.number().min(1).max(1000),
    enableCompression: z.boolean(),
    encryption: z.boolean(),
  }),
});

/**
 * Configuration validation utilities
 */
export class ConfigurationValidator {
  /**
   * Validate sales requests configuration
   */
  static validateSalesRequests(config: unknown): SalesRequestsConfig {
    return salesRequestsConfigSchema.parse(config);
  }

  /**
   * Validate flow metrics configuration
   */
  static validateFlowMetrics(config: unknown): FlowMetricsConfig {
    return flowMetricsConfigSchema.parse(config);
  }

  /**
   * Validate voice commands configuration
   */
  static validateVoiceCommands(config: unknown): VoiceCommandsConfig {
    return voiceCommandsConfigSchema.parse(config);
  }

  /**
   * Validate customer sentiment configuration
   */
  static validateCustomerSentiment(config: unknown): CustomerSentimentConfig {
    return customerSentimentConfigSchema.parse(config);
  }

  /**
   * Validate authentication configuration
   */
  static validateAuthentication(config: unknown): AuthenticationConfig {
    return authenticationConfigSchema.parse(config);
  }

  /**
   * Validate offline support configuration
   */
  static validateOfflineSupport(config: unknown): OfflineSupportConfig {
    return offlineSupportConfigSchema.parse(config);
  }

  /**
   * Validate all configurations at once
   */
  static validateAll(configs: {
    salesRequests?: unknown;
    flowMetrics?: unknown;
    voiceCommands?: unknown;
    customerSentiment?: unknown;
    authentication?: unknown;
    offlineSupport?: unknown;
  }) {
    const validated: any = {};

    if (configs.salesRequests) {
      validated.salesRequests = this.validateSalesRequests(configs.salesRequests);
    }

    if (configs.flowMetrics) {
      validated.flowMetrics = this.validateFlowMetrics(configs.flowMetrics);
    }

    if (configs.voiceCommands) {
      validated.voiceCommands = this.validateVoiceCommands(configs.voiceCommands);
    }

    if (configs.customerSentiment) {
      validated.customerSentiment = this.validateCustomerSentiment(configs.customerSentiment);
    }

    if (configs.authentication) {
      validated.authentication = this.validateAuthentication(configs.authentication);
    }

    if (configs.offlineSupport) {
      validated.offlineSupport = this.validateOfflineSupport(configs.offlineSupport);
    }

    return validated;
  }
}

/**
 * Configuration loader utilities
 */
export class ConfigurationLoader {
  /**
   * Load configuration from environment variables
   */
  static loadFromEnvironment(): {
    salesRequests: SalesRequestsConfig;
    flowMetrics: FlowMetricsConfig;
    voiceCommands: VoiceCommandsConfig;
    customerSentiment: CustomerSentimentConfig;
    authentication: AuthenticationConfig;
    offlineSupport: OfflineSupportConfig;
  } {
    const environment = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
    const debug = environment === 'development';

    return {
      salesRequests: {
        enabled: process.env.SALES_REQUESTS_ENABLED !== 'false',
        environment,
        debug,
        maxLineItems: parseInt(process.env.SALES_REQUESTS_MAX_LINE_ITEMS || '50'),
        allowDraftSaves: process.env.SALES_REQUESTS_ALLOW_DRAFTS !== 'false',
        autoGenerateQR: process.env.SALES_REQUESTS_AUTO_QR !== 'false',
        contactValidation: {
          requireEmail: process.env.SALES_REQUESTS_REQUIRE_EMAIL === 'true',
          requirePhone: process.env.SALES_REQUESTS_REQUIRE_PHONE === 'true',
          allowAnonymous: process.env.SALES_REQUESTS_ALLOW_ANONYMOUS === 'true',
        },
        submission: {
          requireApproval: process.env.SALES_REQUESTS_REQUIRE_APPROVAL === 'true',
          autoSubmitToPipedrive: process.env.SALES_REQUESTS_AUTO_SUBMIT === 'true',
          retryAttempts: parseInt(process.env.SALES_REQUESTS_RETRY_ATTEMPTS || '3'),
        },
      },
      flowMetrics: {
        enabled: process.env.FLOW_METRICS_ENABLED !== 'false',
        environment,
        debug,
        dataRetention: {
          days: parseInt(process.env.FLOW_METRICS_RETENTION_DAYS || '365'),
          autoArchive: process.env.FLOW_METRICS_AUTO_ARCHIVE === 'true',
        },
        calculations: {
          enableRealTime: process.env.FLOW_METRICS_REAL_TIME === 'true',
          cacheResults: process.env.FLOW_METRICS_CACHE !== 'false',
          refreshInterval: parseInt(process.env.FLOW_METRICS_REFRESH_INTERVAL || '30000'),
        },
        pipedrive: {
          syncEnabled: process.env.FLOW_METRICS_PIPEDRIVE_SYNC !== 'false',
          syncInterval: parseInt(process.env.FLOW_METRICS_SYNC_INTERVAL || '60000'),
          webhookEnabled: process.env.FLOW_METRICS_WEBHOOK === 'true',
        },
        reporting: {
          enableExport: process.env.FLOW_METRICS_EXPORT !== 'false',
          maxExportRows: parseInt(process.env.FLOW_METRICS_MAX_EXPORT_ROWS || '10000'),
          scheduledReports: process.env.FLOW_METRICS_SCHEDULED_REPORTS === 'true',
        },
      },
      voiceCommands: {
        enabled: process.env.VOICE_COMMANDS_ENABLED === 'true',
        environment,
        debug,
        mcpServer: {
          url: process.env.VOICE_COMMANDS_MCP_URL || 'http://localhost:3001',
          apiKey: process.env.VOICE_COMMANDS_MCP_API_KEY || '',
          timeout: parseInt(process.env.VOICE_COMMANDS_MCP_TIMEOUT || '30000'),
          retryAttempts: parseInt(process.env.VOICE_COMMANDS_MCP_RETRY_ATTEMPTS || '3'),
        },
        audio: {
          format: (process.env.VOICE_COMMANDS_AUDIO_FORMAT as 'wav' | 'mp3' | 'ogg') || 'wav',
          quality: (process.env.VOICE_COMMANDS_AUDIO_QUALITY as 'low' | 'medium' | 'high') || 'medium',
          maxDuration: parseInt(process.env.VOICE_COMMANDS_MAX_DURATION || '30000'),
        },
        commands: {
          maxHistory: parseInt(process.env.VOICE_COMMANDS_MAX_HISTORY || '100'),
          enableCustomCommands: process.env.VOICE_COMMANDS_CUSTOM === 'true',
          requireConfirmation: process.env.VOICE_COMMANDS_CONFIRMATION === 'true',
        },
      },
      customerSentiment: {
        enabled: process.env.CUSTOMER_SENTIMENT_ENABLED === 'true',
        environment,
        debug,
        surveys: {
          maxQuestions: parseInt(process.env.CUSTOMER_SENTIMENT_MAX_QUESTIONS || '20'),
          allowAnonymous: process.env.CUSTOMER_SENTIMENT_ANONYMOUS === 'true',
          requireContact: process.env.CUSTOMER_SENTIMENT_REQUIRE_CONTACT === 'true',
        },
        responses: {
          autoAnalysis: process.env.CUSTOMER_SENTIMENT_AUTO_ANALYSIS === 'true',
          sentimentThreshold: parseFloat(process.env.CUSTOMER_SENTIMENT_THRESHOLD || '-0.5'),
          alertOnNegative: process.env.CUSTOMER_SENTIMENT_ALERT_NEGATIVE === 'true',
        },
        analytics: {
          enableRealTime: process.env.CUSTOMER_SENTIMENT_REAL_TIME === 'true',
          dataRetention: parseInt(process.env.CUSTOMER_SENTIMENT_RETENTION || '365'),
          exportFormats: (process.env.CUSTOMER_SENTIMENT_EXPORT_FORMATS || 'csv,json').split(','),
        },
      },
      authentication: {
        enabled: process.env.AUTHENTICATION_ENABLED !== 'false',
        environment,
        debug,
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID || '',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
          workspaceDomain: process.env.GOOGLE_WORKSPACE_DOMAIN || '',
          allowedDomains: (process.env.GOOGLE_ALLOWED_DOMAINS || '').split(',').filter(Boolean),
        },
        session: {
          maxAge: parseInt(process.env.AUTH_SESSION_MAX_AGE || '86400'),
          updateAge: parseInt(process.env.AUTH_SESSION_UPDATE_AGE || '0'),
          secure: process.env.AUTH_SESSION_SECURE === 'true',
        },
        permissions: {
          enableRoleBasedAccess: process.env.AUTH_ENABLE_RBAC === 'true',
          defaultRole: process.env.AUTH_DEFAULT_ROLE || 'user',
          adminEmails: (process.env.AUTH_ADMIN_EMAILS || '').split(',').filter(Boolean),
        },
      },
      offlineSupport: {
        enabled: process.env.OFFLINE_SUPPORT_ENABLED === 'true',
        environment,
        debug,
        queue: {
          maxSize: parseInt(process.env.OFFLINE_QUEUE_MAX_SIZE || '1000'),
          persistence: process.env.OFFLINE_QUEUE_PERSISTENCE === 'true',
          retryStrategy: (process.env.OFFLINE_QUEUE_RETRY_STRATEGY as 'immediate' | 'exponential' | 'fixed') || 'exponential',
        },
        sync: {
          enableAutoSync: process.env.OFFLINE_AUTO_SYNC === 'true',
          syncInterval: parseInt(process.env.OFFLINE_SYNC_INTERVAL || '30000'),
          conflictResolution: (process.env.OFFLINE_CONFLICT_RESOLUTION as 'server-wins' | 'client-wins' | 'manual') || 'server-wins',
        },
        storage: {
          maxLocalStorage: parseInt(process.env.OFFLINE_MAX_STORAGE || '100'),
          enableCompression: process.env.OFFLINE_COMPRESSION === 'true',
          encryption: process.env.OFFLINE_ENCRYPTION === 'true',
        },
      },
    };
  }

  /**
   * Load and validate configuration from environment
   */
  static loadAndValidate() {
    const config = this.loadFromEnvironment();
    return ConfigurationValidator.validateAll(config);
  }
}
