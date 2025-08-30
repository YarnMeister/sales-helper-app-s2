# Architecture Modularization Plan - Sales Helper App

## Overview

This document outlines the comprehensive plan to restructure the Sales Helper App architecture to achieve better separation of concerns and prepare for future feature additions. The goal is to create clear "air gaps" between different feature domains while maintaining current functionality and enabling independent development of new features.

## Current Architecture Assessment

### Strengths
1. **Good Environment Separation**: Clear development/production isolation with mock tables
2. **Type Safety**: Comprehensive TypeScript and Zod validation
3. **Modular API Structure**: Well-organized API routes by functionality
4. **BFF Pattern**: Good use of Backend for Frontend pattern for data transformation
5. **Offline Resilience**: Client-side QR-ID generation for poor network conditions

### Areas of Concern

#### 1. Monolithic Database Layer
- **Issue**: All database functions are centralized in `lib/db.ts` (910 lines)
- **Problem**: Flow metrics, requests, site visits, and future features all mixed together
- **Impact**: Difficult to maintain, test, and extend individual features

#### 2. Shared Component Pollution
- **Issue**: Components like `MetricsManagement.tsx` (723 lines) mix multiple concerns
- **Problem**: Flow metrics UI mixed with Pipedrive stage explorer and admin functions
- **Impact**: Hard to isolate feature-specific changes

#### 3. API Route Coupling
- **Issue**: Some API routes handle multiple related but distinct operations
- **Problem**: Flow metrics, Pipedrive integration, and request management mixed
- **Impact**: Difficult to version, test, and maintain individual features

#### 4. Type Definitions Scattered
- **Issue**: Types defined inline in components and mixed across features
- **Problem**: No clear ownership of type definitions
- **Impact**: Type conflicts and maintenance issues

## Proposed Architecture Restructure

### 1. Feature-Based Module Organization

```
app/
├── features/
│   ├── sales-requests/           # Main sales workflow
│   │   ├── components/
│   │   │   ├── RequestForm.tsx
│   │   │   ├── ContactSelector.tsx
│   │   │   ├── LineItemManager.tsx
│   │   │   ├── SalespersonSelector.tsx
│   │   │   └── RequestCard.tsx
│   │   ├── api/
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── submit/route.ts
│   │   ├── types/
│   │   │   ├── request.ts
│   │   │   ├── contact.ts
│   │   │   └── line-item.ts
│   │   ├── hooks/
│   │   │   ├── useRequestForm.ts
│   │   │   ├── useContactSearch.ts
│   │   │   └── useLineItems.ts
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   ├── formatting.ts
│   │   │   └── qr-generator.ts
│   │   └── pages/
│   │       ├── page.tsx          # Main page
│   │       ├── add-contact/
│   │       ├── add-line-items/
│   │       └── contacts-list/
│   ├── flow-metrics/            # Flow efficiency reporting
│   │   ├── components/
│   │   │   ├── MetricsDashboard.tsx
│   │   │   ├── KPICard.tsx
│   │   │   ├── MetricsManagement.tsx
│   │   │   ├── PipedriveStageExplorer.tsx
│   │   │   └── FlowDataTable.tsx
│   │   ├── api/
│   │   │   ├── metrics/route.ts
│   │   │   ├── config/route.ts
│   │   │   └── [metric-id]/route.ts
│   │   ├── types/
│   │   │   ├── metric.ts
│   │   │   ├── flow-data.ts
│   │   │   └── stage-mapping.ts
│   │   ├── hooks/
│   │   │   ├── useMetrics.ts
│   │   │   ├── useFlowData.ts
│   │   │   └── useStageMappings.ts
│   │   ├── utils/
│   │   │   ├── calculations.ts
│   │   │   ├── formatting.ts
│   │   │   └── validation.ts
│   │   └── pages/
│   │       ├── page.tsx          # Flow metrics main page
│   │       └── [metric-id]/
│   ├── voice-commands/          # Future MCP server integration
│   │   ├── components/
│   │   │   ├── VoiceRecorder.tsx
│   │   │   ├── CommandDisplay.tsx
│   │   │   └── VoiceSettings.tsx
│   │   ├── api/
│   │   │   ├── route.ts
│   │   │   ├── process/route.ts
│   │   │   └── settings/route.ts
│   │   ├── types/
│   │   │   ├── command.ts
│   │   │   ├── audio.ts
│   │   │   └── mcp-server.ts
│   │   ├── hooks/
│   │   │   ├── useVoiceRecorder.ts
│   │   │   ├── useMCPConnection.ts
│   │   │   └── useCommandHistory.ts
│   │   ├── utils/
│   │   │   ├── audio-processing.ts
│   │   │   ├── command-parsing.ts
│   │   │   └── mcp-client.ts
│   │   └── pages/
│   │       └── page.tsx
│   ├── customer-sentiment/      # Future survey system
│   │   ├── components/
│   │   │   ├── SurveyWidget.tsx
│   │   │   ├── SentimentChart.tsx
│   │   │   ├── FeedbackForm.tsx
│   │   │   └── ResponseAnalytics.tsx
│   │   ├── api/
│   │   │   ├── surveys/route.ts
│   │   │   ├── responses/route.ts
│   │   │   └── analytics/route.ts
│   │   ├── types/
│   │   │   ├── survey.ts
│   │   │   ├── response.ts
│   │   │   └── analytics.ts
│   │   ├── hooks/
│   │   │   ├── useSurvey.ts
│   │   │   ├── useSentiment.ts
│   │   │   └── useAnalytics.ts
│   │   ├── utils/
│   │   │   ├── survey-builder.ts
│   │   │   ├── sentiment-analysis.ts
│   │   │   └── analytics-calculations.ts
│   │   └── pages/
│   │       ├── page.tsx
│   │       ├── surveys/
│   │       └── analytics/
│   ├── authentication/          # Google Workspace authentication
│   │   ├── components/
│   │   │   ├── LoginButton.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   ├── AuthGuard.tsx
│   │   │   └── SessionProvider.tsx
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts
│   │   ├── types/
│   │   │   ├── auth.ts
│   │   │   ├── session.ts
│   │   │   └── user.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useSession.ts
│   │   │   └── usePermissions.ts
│   │   ├── utils/
│   │   │   ├── auth-config.ts
│   │   │   ├── permissions.ts
│   │   │   └── session-utils.ts
│   │   └── middleware.ts
│   └── offline-support/         # Future offline queue processing
│       ├── components/
│       │   ├── OfflineIndicator.tsx
│       │   ├── SyncStatus.tsx
│       │   └── QueueManager.tsx
│       ├── api/
│       │   ├── queue/route.ts
│       │   ├── sync/route.ts
│       │   └── status/route.ts
│       ├── types/
│       │   ├── queue.ts
│       │   ├── sync.ts
│       │   └── worker.ts
│       ├── hooks/
│       │   ├── useOfflineStatus.ts
│       │   ├── useQueueSync.ts
│       │   └── useWorkerStatus.ts
│       ├── utils/
│       │   ├── queue-manager.ts
│       │   ├── sync-engine.ts
│       │   └── worker-utils.ts
│       └── workers/
│           ├── queue-processor.ts
│           └── sync-worker.ts
├── shared/                      # Cross-cutting concerns
│   ├── components/
│   │   ├── ui/                  # Radix UI components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── Layout.tsx
│   │   ├── common/
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── Modal.tsx
│   │   └── forms/
│   │       ├── FormField.tsx
│   │       ├── FormValidation.tsx
│   │       └── FormSubmit.tsx
│   ├── types/
│   │   ├── common.ts
│   │   ├── api.ts
│   │   ├── database.ts
│   │   └── ui.ts
│   ├── hooks/
│   │   ├── useToast.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useOnlineStatus.ts
│   │   └── useDebounce.ts
│   └── utils/
│       ├── constants.ts
│       ├── helpers.ts
│       ├── validation.ts
│       └── formatting.ts
└── core/                        # Core infrastructure
    ├── database/
    │   ├── connection.ts
    │   ├── migrations.ts
    │   └── types.ts
    ├── cache/
    │   ├── redis.ts
    │   ├── memory.ts
    │   └── types.ts
    ├── auth/
    │   ├── nextauth-config.ts
    │   ├── middleware.ts
    │   ├── session.ts
    │   ├── permissions.ts
    │   └── types.ts
    └── logging/
        ├── logger.ts
        ├── performance.ts
        └── types.ts
```

### 2. Database Layer Separation

```
lib/
├── database/
│   ├── core/                    # Base database utilities
│   │   ├── connection.ts        # Database connection management
│   │   ├── migrations.ts        # Migration system
│   │   ├── repository.ts        # Base repository pattern
│   │   ├── types.ts            # Core database types
│   │   └── utils.ts            # Database utilities
│   ├── features/
│   │   ├── sales-requests/
│   │   │   ├── repository.ts    # Request CRUD operations
│   │   │   ├── types.ts        # Request-specific types
│   │   │   ├── queries.ts      # SQL queries
│   │   │   └── migrations/
│   │   │       ├── 001_requests.sql
│   │   │       └── 002_request_indexes.sql
│   │   ├── flow-metrics/
│   │   │   ├── repository.ts    # Metrics CRUD operations
│   │   │   ├── types.ts        # Metrics-specific types
│   │   │   ├── queries.ts      # Metrics queries
│   │   │   └── migrations/
│   │   │       ├── 001_flow_metrics.sql
│   │   │       └── 002_metrics_config.sql
│   │   ├── voice-commands/
│   │   │   ├── repository.ts    # Voice command storage
│   │   │   ├── types.ts        # Voice command types
│   │   │   ├── queries.ts      # Voice command queries
│   │   │   └── migrations/
│   │   │       └── 001_voice_commands.sql
│   │   ├── customer-sentiment/
│   │   │   ├── repository.ts    # Survey and response storage
│   │   │   ├── types.ts        # Sentiment types
│   │   │   ├── queries.ts      # Sentiment queries
│   │   │   └── migrations/
│   │   │       ├── 001_surveys.sql
│   │   │       └── 002_responses.sql
│   │   ├── authentication/
│   │   │   ├── repository.ts    # User session storage (optional)
│   │   │   ├── types.ts        # Authentication types
│   │   │   ├── queries.ts      # Session queries (if needed)
│   │   │   └── migrations/
│   │   │       └── 001_auth_sessions.sql
│   │   └── offline-support/
│   │       ├── repository.ts    # Queue and sync storage
│   │       ├── types.ts        # Offline types
│   │       ├── queries.ts      # Queue queries
│   │       └── migrations/
│   │           ├── 001_offline_queue.sql
│   │           └── 002_sync_status.sql
│   └── shared/
│       ├── base-repository.ts   # Common repository methods
│       ├── common-types.ts     # Shared database types
│       ├── transaction.ts      # Transaction management
│       └── validation.ts       # Database validation
```

### 3. API Route Organization

```
app/
├── api/
│   ├── v1/                      # Versioned API structure
│   │   ├── sales-requests/
│   │   │   ├── route.ts         # GET/POST requests
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts     # GET/PUT/DELETE specific request
│   │   │   │   └── submit/
│   │   │   │       └── route.ts # Submit to Pipedrive
│   │   │   ├── contacts/
│   │   │   │   └── route.ts     # Contact management
│   │   │   └── products/
│   │   │       └── route.ts     # Product catalog
│   │   ├── flow-metrics/
│   │   │   ├── route.ts         # GET metrics data
│   │   │   ├── config/
│   │   │   │   ├── route.ts     # GET/POST metric config
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts # PUT/DELETE specific config
│   │   │   ├── [metric-id]/
│   │   │   │   └── route.ts     # GET specific metric details
│   │   │   └── pipedrive/
│   │   │       ├── pipelines/
│   │   │       │   └── route.ts # GET Pipedrive pipelines
│   │   │       └── stages/
│   │   │           └── route.ts # GET Pipedrive stages
│   │   ├── voice-commands/
│   │   │   ├── route.ts         # POST voice command
│   │   │   ├── process/
│   │   │   │   └── route.ts     # Process with MCP server
│   │   │   └── settings/
│   │   │       └── route.ts     # Voice command settings
│   │   ├── customer-sentiment/
│   │   │   ├── surveys/
│   │   │   │   ├── route.ts     # GET/POST surveys
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts # GET/PUT/DELETE specific survey
│   │   │   ├── responses/
│   │   │   │   ├── route.ts     # POST survey responses
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts # GET specific response
│   │   │   └── analytics/
│   │   │       └── route.ts     # GET sentiment analytics
│   │   ├── authentication/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts # NextAuth.js configuration
│   │   │   ├── session/
│   │   │   │   └── route.ts     # Session management
│   │   │   └── user/
│   │   │       └── route.ts     # User profile management
│   │   └── offline-support/
│   │       ├── queue/
│   │       │   ├── route.ts     # GET/POST queue items
│   │       │   └── [id]/
│   │       │       └── route.ts # GET/PUT/DELETE queue item
│   │       ├── sync/
│   │       │   └── route.ts     # POST sync operations
│   │       └── status/
│   │           └── route.ts     # GET sync status
│   └── shared/                  # Cross-cutting API concerns
│       ├── health/
│       │   └── route.ts         # Health check endpoint
│       ├── cache/
│       │   ├── route.ts         # Cache management
│       │   └── refresh/
│       │       └── route.ts     # Cache refresh
│       ├── auth/
│       │   └── route.ts         # Authentication
│       └── webhooks/
│           ├── pipedrive/
│           │   └── route.ts     # Pipedrive webhooks
│           └── slack/
│               └── route.ts     # Slack webhooks
```

### 4. Type System Organization

```
types/
├── shared/                      # Common types across features
│   ├── database.ts             # Core database types
│   ├── api.ts                  # API response/request types
│   ├── ui.ts                   # UI component types
│   ├── common.ts               # General utility types
│   └── environment.ts          # Environment configuration types
├── features/
│   ├── sales-requests.ts       # Sales request types
│   ├── flow-metrics.ts         # Flow metrics types
│   ├── voice-commands.ts       # Voice command types
│   ├── customer-sentiment.ts   # Customer sentiment types
│   ├── authentication.ts       # Authentication types
│   └── offline-support.ts      # Offline support types
└── external/                    # External service types
    ├── pipedrive.ts            # Pipedrive API types
    ├── slack.ts                # Slack API types
    ├── mcp-server.ts           # MCP server types
    └── redis.ts                # Redis types
```

## Implementation Strategy

### Phase 1: Core Infrastructure Separation (Weeks 1-2)

#### 1.1 Extract Shared Database Utilities
- **Task**: Create `lib/database/core/` directory
- **Deliverables**:
  - `connection.ts` - Database connection management
  - `repository.ts` - Base repository pattern
  - `types.ts` - Core database types
  - `utils.ts` - Database utilities
- **Migration**: Move common database functions from `lib/db.ts`

#### 1.2 Create Base Repository Pattern
- **Task**: Implement base repository with common CRUD operations
- **Deliverables**:
  - `BaseRepository` class with common methods
  - Transaction management utilities
  - Error handling patterns
- **Benefits**: Consistent database operations across features

#### 1.3 Separate Environment Configuration
- **Task**: Create feature-specific environment configurations
- **Deliverables**:
  - Feature-specific environment schemas
  - Validation utilities
  - Configuration management
- **Benefits**: Clear separation of feature requirements

#### 1.4 Establish Shared Type Definitions
- **Task**: Create `types/shared/` directory
- **Deliverables**:
  - Common database types
  - API response/request types
  - UI component types
- **Benefits**: Consistent type definitions across features

#### 1.5 Implement Authentication Infrastructure
- **Task**: Set up NextAuth.js with Google Workspace integration
- **Deliverables**:
  - NextAuth.js configuration with Google provider
  - Domain restriction for Google Workspace
  - Session management utilities
  - API route protection middleware
- **Benefits**: Secure access control for all features

### Phase 2: Feature Module Extraction (Weeks 3-6)

#### 2.1 Sales Requests Module
- **Task**: Extract all request-related functionality
- **Deliverables**:
  - `app/features/sales-requests/` directory
  - Request-specific components, API routes, types, hooks, and utils
  - Database repository for requests
  - Migration of existing request functionality
- **Migration**: Move from current scattered implementation

#### 2.2 Flow Metrics Module
- **Task**: Separate metrics and reporting logic
- **Deliverables**:
  - `app/features/flow-metrics/` directory
  - Metrics-specific components, API routes, types, hooks, and utils
  - Database repository for metrics
  - Migration of existing metrics functionality
- **Migration**: Move from current mixed implementation

#### 2.3 Shared Components Module
- **Task**: Move common UI elements to shared module
- **Deliverables**:
  - `app/shared/components/` directory
  - Common UI components (Header, Footer, Navigation, etc.)
  - Form components and utilities
  - Layout components
- **Migration**: Extract from current scattered components

#### 2.4 API Route Restructuring
- **Task**: Organize API routes by feature domain
- **Deliverables**:
  - `app/api/v1/` versioned structure
  - Feature-specific API routes
  - Shared API utilities
  - Consistent error handling
- **Migration**: Reorganize existing API routes

### Phase 3: Future Feature Preparation (Weeks 7-8)

#### 3.1 Voice Commands Module
- **Task**: Prepare structure for MCP server integration
- **Deliverables**:
  - `app/features/voice-commands/` directory
  - Voice recording components
  - MCP server integration utilities
  - Command processing infrastructure
- **Benefits**: Ready for voice command implementation

#### 3.2 Customer Sentiment Module
- **Task**: Set up survey and feedback infrastructure
- **Deliverables**:
  - `app/features/customer-sentiment/` directory
  - Survey components and utilities
  - Response collection infrastructure
  - Analytics preparation
- **Benefits**: Ready for sentiment tracking implementation

#### 3.3 Offline Support Module
- **Task**: Create queue processing architecture
- **Deliverables**:
  - `app/features/offline-support/` directory
  - Queue management components
  - Sync engine utilities
  - Worker infrastructure
- **Benefits**: Ready for offline functionality

#### 3.4 Integration Layer
- **Task**: Establish clean interfaces between modules
- **Deliverables**:
  - Module communication patterns
  - Event system for cross-module communication
  - Shared state management
  - Integration testing framework
- **Benefits**: Clean separation with controlled integration

#### 3.5 Authentication Module Integration
- **Task**: Integrate authentication across all features
- **Deliverables**:
  - Protected API routes with session validation
  - Authentication-aware UI components
  - User session management
  - Permission-based access control
- **Benefits**: Secure, role-based access to all features

## Benefits of Proposed Structure

### 1. Clear Feature Boundaries
- **Benefit**: Each feature has its own module with complete ownership
- **Impact**: Changes to one feature don't affect others
- **Result**: Easier to understand and maintain

### 2. Improved Testing
- **Benefit**: Feature-specific test suites
- **Impact**: Isolated unit tests and better integration test coverage
- **Result**: Higher code quality and easier debugging

### 3. Enhanced Scalability
- **Benefit**: New features can be added without touching existing code
- **Impact**: Independent deployment of feature modules (future)
- **Result**: Better team collaboration on different features

### 4. Better Performance
- **Benefit**: Feature-specific code splitting
- **Impact**: Lazy loading of feature modules and optimized bundle sizes
- **Result**: Faster application loading and better user experience

### 5. Future-Proof Architecture
- **Benefit**: Ready for microservices migration (if needed)
- **Impact**: Supports independent feature development
- **Result**: Clear upgrade paths for individual features

### 6. Secure Access Control
- **Benefit**: Google Workspace authentication for all users
- **Impact**: Domain-restricted access with automatic session management
- **Result**: Enterprise-grade security with minimal user management overhead

## Migration Considerations

### 1. Gradual Migration Strategy
- **Approach**: Start with core infrastructure separation
- **Process**: Move one feature at a time
- **Requirement**: Maintain backward compatibility during transition
- **Timeline**: 8 weeks total with 2-week phases

### 2. Database Migration Strategy
- **Approach**: Keep existing tables during transition
- **Process**: Create new feature-specific tables
- **Requirement**: Migrate data gradually with feature extraction
- **Safety**: Maintain data integrity throughout migration

### 3. API Versioning Strategy
- **Approach**: Maintain v1 API compatibility
- **Process**: Introduce v2 API with new structure
- **Requirement**: Gradual deprecation of old endpoints
- **Timeline**: Support both versions during transition period

### 4. Testing Strategy
- **Approach**: Comprehensive test coverage for each module
- **Process**: Integration tests for cross-module communication
- **Requirement**: Performance testing for each feature
- **Quality**: Maintain or improve current test coverage

## Risk Mitigation

### 1. Backward Compatibility
- **Risk**: Breaking changes during migration
- **Mitigation**: Maintain existing API endpoints during transition
- **Monitoring**: Comprehensive testing of existing functionality

### 2. Data Integrity
- **Risk**: Data loss during database restructuring
- **Mitigation**: Thorough backup and rollback procedures
- **Validation**: Data integrity checks at each migration step

### 3. Performance Impact
- **Risk**: Performance degradation during restructuring
- **Mitigation**: Performance testing at each phase
- **Monitoring**: Real-time performance monitoring during migration

### 4. Development Velocity
- **Risk**: Slowed development during migration
- **Mitigation**: Parallel development on new structure
- **Approach**: Feature development continues on new modules

### 5. Authentication Integration
- **Risk**: Breaking existing API functionality during auth integration
- **Mitigation**: Gradual API route protection with fallback options
- **Monitoring**: Comprehensive testing of authenticated endpoints

## Success Metrics

### 1. Code Organization
- **Metric**: Reduction in file size and complexity
- **Target**: 50% reduction in average file size
- **Measurement**: Lines of code per file analysis

### 2. Test Coverage
- **Metric**: Maintain or improve test coverage
- **Target**: 90%+ test coverage for new modules
- **Measurement**: Coverage reports for each module

### 3. Development Velocity
- **Metric**: Time to implement new features
- **Target**: 30% improvement in feature development time
- **Measurement**: Feature implementation tracking

### 4. Performance
- **Metric**: Application performance metrics
- **Target**: Maintain or improve current performance
- **Measurement**: Lighthouse scores and load times

### 5. Security
- **Metric**: Authentication coverage and security compliance
- **Target**: 100% API route protection with Google Workspace authentication
- **Measurement**: Security audit and authentication coverage reports

## Conclusion

This modularization plan provides the foundation for a scalable, maintainable architecture that supports current functionality while preparing for future feature additions. The clear separation of concerns ensures that each feature domain can evolve independently, reducing complexity and improving development velocity.

The phased approach minimizes risk while maximizing the benefits of the new architecture. By starting with core infrastructure and gradually extracting features, we can maintain system stability while achieving the desired architectural improvements.

This plan serves as a roadmap for future development and ensures continuity across development teams and AI assistants working on the project.

## Authentication Implementation Details

### Google Workspace Integration
The authentication module will use NextAuth.js with Google provider, configured to:
- Restrict access to users from your Google Workspace domain
- Provide automatic session management and token refresh
- Protect all API routes with session validation
- Require no user database or manual user management

### Environment Variables Required
```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-random-secret-key

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional: Restrict to specific domain
GOOGLE_WORKSPACE_DOMAIN=yourcompany.com
```

### Implementation Timeline
- **Setup & Configuration**: 2-3 hours
- **API Route Protection**: 1-2 hours
- **UI Integration**: 1-2 hours
- **Testing**: 1 hour
- **Total**: 5-8 hours for complete implementation

### Benefits
- **Zero User Management**: No user tables or CRUD operations required
- **Automatic Security**: Built-in CSRF protection and secure session handling
- **Workspace Integration**: Seamless single sign-on with existing Google accounts
- **Minimal Code Changes**: Existing API routes only need session validation
- **Production Ready**: Industry-standard OAuth 2.0 implementation

## Implementation Checklist

### Phase 1: Core Infrastructure Separation (Weeks 1-2)

#### 1.1 Extract Shared Database Utilities
- [ ] **Code Complete**: Create `lib/database/core/` directory
- [ ] **Code Complete**: Implement `connection.ts` - Database connection management
- [ ] **Code Complete**: Implement `repository.ts` - Base repository pattern
- [ ] **Code Complete**: Implement `types.ts` - Core database types
- [ ] **Code Complete**: Implement `utils.ts` - Database utilities
- [ ] **Tests Updated**: Add unit tests for core database utilities
- [ ] **Tests Updated**: Update existing database tests to use new structure
- [ ] **README Updated**: Document new database architecture

#### 1.2 Create Base Repository Pattern
- [ ] **Code Complete**: Implement `BaseRepository` class with common methods
- [ ] **Code Complete**: Create transaction management utilities
- [ ] **Code Complete**: Implement error handling patterns
- [ ] **Tests Updated**: Add comprehensive tests for BaseRepository
- [ ] **Tests Updated**: Test transaction management and error handling
- [ ] **README Updated**: Document repository pattern usage

#### 1.3 Separate Environment Configuration
- [ ] **Code Complete**: Create feature-specific environment configurations
- [ ] **Code Complete**: Implement validation utilities
- [ ] **Code Complete**: Set up configuration management
- [ ] **Tests Updated**: Add tests for environment validation
- [ ] **Tests Updated**: Test configuration loading and validation
- [ ] **README Updated**: Update environment setup documentation

#### 1.4 Establish Shared Type Definitions
- [ ] **Code Complete**: Create `types/shared/` directory
- [ ] **Code Complete**: Implement common database types
- [ ] **Code Complete**: Implement API response/request types
- [ ] **Code Complete**: Implement UI component types
- [ ] **Tests Updated**: Add type validation tests
- [ ] **Tests Updated**: Test type compatibility across modules
- [ ] **README Updated**: Document type system organization

#### 1.5 Implement Authentication Infrastructure
- [ ] **Code Complete**: Set up NextAuth.js with Google provider
- [ ] **Code Complete**: Configure domain restriction for Google Workspace
- [ ] **Code Complete**: Implement session management utilities
- [ ] **Code Complete**: Create API route protection middleware
- [ ] **Tests Updated**: Add authentication integration tests
- [ ] **Tests Updated**: Test session management and middleware
- [ ] **README Updated**: Document authentication setup and usage

### Phase 2: Feature Module Extraction (Weeks 3-6)

#### 2.1 Sales Requests Module
- [ ] **Code Complete**: Create `app/features/sales-requests/` directory
- [ ] **Code Complete**: Extract request-specific components
- [ ] **Code Complete**: Extract request-specific API routes
- [ ] **Code Complete**: Extract request-specific types, hooks, and utils
- [ ] **Code Complete**: Create database repository for requests
- [ ] **Code Complete**: Migrate existing request functionality
- [ ] **Tests Updated**: Update tests for sales requests module
- [ ] **Tests Updated**: Add integration tests for request workflow
- [ ] **README Updated**: Document sales requests module structure

#### 2.2 Flow Metrics Module
- [ ] **Code Complete**: Create `app/features/flow-metrics/` directory
- [ ] **Code Complete**: Extract metrics-specific components
- [ ] **Code Complete**: Extract metrics-specific API routes
- [ ] **Code Complete**: Extract metrics-specific types, hooks, and utils
- [ ] **Code Complete**: Create database repository for metrics
- [ ] **Code Complete**: Migrate existing metrics functionality
- [ ] **Tests Updated**: Update tests for flow metrics module
- [ ] **Tests Updated**: Add integration tests for metrics calculations
- [ ] **README Updated**: Document flow metrics module structure

#### 2.3 Shared Components Module
- [ ] **Code Complete**: Create `app/shared/components/` directory
- [ ] **Code Complete**: Extract common UI components
- [ ] **Code Complete**: Extract form components and utilities
- [ ] **Code Complete**: Extract layout components
- [ ] **Code Complete**: Update imports across all modules
- [ ] **Tests Updated**: Update tests for shared components
- [ ] **Tests Updated**: Add component integration tests
- [ ] **README Updated**: Document shared components usage

#### 2.4 API Route Restructuring
- [ ] **Code Complete**: Create `app/api/v1/` versioned structure
- [ ] **Code Complete**: Reorganize API routes by feature domain
- [ ] **Code Complete**: Implement shared API utilities
- [ ] **Code Complete**: Ensure consistent error handling
- [ ] **Tests Updated**: Update API route tests
- [ ] **Tests Updated**: Add versioning compatibility tests
- [ ] **README Updated**: Document new API structure

### Phase 3: Future Feature Preparation (Weeks 7-8)

#### 3.1 Voice Commands Module
- [ ] **Code Complete**: Create `app/features/voice-commands/` directory
- [ ] **Code Complete**: Implement voice recording components
- [ ] **Code Complete**: Create MCP server integration utilities
- [ ] **Code Complete**: Set up command processing infrastructure
- [ ] **Tests Updated**: Add tests for voice commands module
- [ ] **Tests Updated**: Test MCP server integration
- [ ] **README Updated**: Document voice commands module structure

#### 3.2 Customer Sentiment Module
- [ ] **Code Complete**: Create `app/features/customer-sentiment/` directory
- [ ] **Code Complete**: Implement survey components and utilities
- [ ] **Code Complete**: Set up response collection infrastructure
- [ ] **Code Complete**: Prepare analytics framework
- [ ] **Tests Updated**: Add tests for customer sentiment module
- [ ] **Tests Updated**: Test survey and response functionality
- [ ] **README Updated**: Document customer sentiment module structure

#### 3.3 Offline Support Module
- [ ] **Code Complete**: Create `app/features/offline-support/` directory
- [ ] **Code Complete**: Implement queue management components
- [ ] **Code Complete**: Create sync engine utilities
- [ ] **Code Complete**: Set up worker infrastructure
- [ ] **Tests Updated**: Add tests for offline support module
- [ ] **Tests Updated**: Test queue and sync functionality
- [ ] **README Updated**: Document offline support module structure

#### 3.4 Integration Layer
- [ ] **Code Complete**: Establish module communication patterns
- [ ] **Code Complete**: Implement event system for cross-module communication
- [ ] **Code Complete**: Set up shared state management
- [ ] **Code Complete**: Create integration testing framework
- [ ] **Tests Updated**: Add integration tests for module communication
- [ ] **Tests Updated**: Test event system and state management
- [ ] **README Updated**: Document integration patterns

#### 3.5 Authentication Module Integration
- [ ] **Code Complete**: Protect all API routes with session validation
- [ ] **Code Complete**: Create authentication-aware UI components
- [ ] **Code Complete**: Implement user session management
- [ ] **Code Complete**: Set up permission-based access control
- [ ] **Tests Updated**: Add authentication integration tests
- [ ] **Tests Updated**: Test protected routes and permissions
- [ ] **README Updated**: Document authentication integration

### Overall Project Completion

#### Code Quality & Standards
- [ ] **Code Complete**: All TypeScript compilation errors resolved
- [ ] **Code Complete**: ESLint passes with no warnings
- [ ] **Code Complete**: Prettier formatting applied consistently
- [ ] **Tests Updated**: Overall test coverage maintained or improved
- [ ] **Tests Updated**: All integration tests passing
- [ ] **README Updated**: Complete documentation of new architecture

#### Performance & Security
- [ ] **Code Complete**: Performance benchmarks maintained
- [ ] **Code Complete**: Security audit completed
- [ ] **Code Complete**: Authentication coverage verified
- [ ] **Tests Updated**: Performance tests updated and passing
- [ ] **Tests Updated**: Security tests implemented
- [ ] **README Updated**: Security and performance documentation

#### Deployment & Migration
- [ ] **Code Complete**: Database migrations tested and verified
- [ ] **Code Complete**: Environment variables documented
- [ ] **Code Complete**: Deployment scripts updated
- [ ] **Tests Updated**: Deployment tests added
- [ ] **Tests Updated**: Migration rollback tests implemented
- [ ] **README Updated**: Deployment and migration documentation

### Progress Tracking

**Phase 1 Progress**: ___ / 25 tasks completed
**Phase 2 Progress**: ___ / 32 tasks completed  
**Phase 3 Progress**: ___ / 35 tasks completed
**Overall Progress**: ___ / 92 tasks completed

**Last Updated**: [Date]
**Next Review**: [Date]
