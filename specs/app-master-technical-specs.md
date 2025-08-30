# Sales Helper App - Technical Specification

## Overview

The Sales Helper App is a Next.js 14 application designed for mobile-first sales workflow management. It enables sales personnel to create and manage sales requests with contacts, line items, and check-ins, integrating with Pipedrive CRM and Slack for notifications.

### Key Technologies
- **Frontend**: Next.js 14 with React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes with TypeScript
- **Database**: Neon Postgres (serverless) with JSONB schema
- **Cache**: Upstash Redis for performance optimization
- **Testing**: Vitest with React Testing Library
- **Deployment**: Vercel with branch protection (suppressing Preview deployments due to technical issues as at Aug 2025)

### Architecture Principles
- **Mobile-First**: Optimized for mobile devices with responsive design
- **Offline-Resilient**: Client-side QR-ID generation for poor network conditions
- **Environment-Aware**: Separate development/production data isolation (mock-tables for transactional data)
- **Type-Safe**: Comprehensive TypeScript validation with Zod schemas

## Functionality and Pages

### Core Pages

#### 1. Main Page (`/`)
- **Purpose**: Primary sales request creation interface
- **Features**:
  - QR-ID generation (client-side localStorage approach)
  - Salesperson selection (Luyanda, James, Stefan)
  - Contact selection from Pipedrive integration
  - Line item management with product catalog
  - Comment system with 2000 character limit
  - Draft saving and submission workflow

#### 2. Add Contact (`/add-contact`)
- **Purpose**: Contact creation and management
- **Features**:
  - Contact form with validation
  - Mine group and mine name requirements
  - Integration with Pipedrive person records
  - Mobile-optimized form layout
  - Cache refresh button for real-time data updates

#### 3. Add Line Items (`/add-line-items`)
- **Purpose**: Product selection and quantity management
- **Features**:
  - Product catalog from Pipedrive
  - Quantity controls with validation
  - Price calculation
  - Custom descriptions
  - Show/hide product visibility
  - Cache refresh button for real-time data updates

#### 4. Check-In (`/check-in`)
- **Purpose**: Site visit tracking and Slack notifications
- **Features**:
  - Location-based check-ins (selected from a drop-down)
  - Slack integration for team notifications
  - Visit history tracking (for future reporting)
  - Environment-aware notification channels (test channel for local testing)

#### 5. Contacts List (`/contacts-list`)
- **Purpose**: Contact browsing and search
- **Features**:
  - Mine group organization
  - Contact details display
  - Integration with main workflow

#### 6. Price List (`/price-list`)
- **Purpose**: Product catalog display
- **Features**:
  - Product browsing interface
  - Price information
  - Product categorization


### Shared Components

#### Navigation
- **BottomNavigation**: Mobile-optimized navigation bar
- **Header**: Page headers with consistent styling
- **CommonFooter**: Standard footer across pages

#### Data Display
- **ContactAccordion**: Collapsible contact information
- **ProductAccordion**: Product details with expand/collapse
- **LineItemCard**: Individual line item display
- **RequestCard**: Request summary cards

#### Interactive Elements
- **CommentControl**: Comment management interface
- **CommentDisplay**: Comment rendering
- **CommentInput**: Comment input with validation
- **QuantityControl**: Product quantity adjustment
- **SalespersonModal**: Salesperson selection modal
- **CacheRefreshButton**: Cache refresh functionality with visual feedback

## API Routes

### Core API Endpoints

#### 1. `/api/submit` (POST)
- **Purpose**: Submit sales requests to Pipedrive
- **Features**:
  - Environment-aware submission (mock/live)
  - Request validation and error handling
  - Pipedrive deal creation
  - Product attachment to deals
  - Comment/note addition
  - Status tracking

#### 2. `/api/requests` (GET/POST/PUT)
- **Purpose**: CRUD operations for sales requests
- **Features**:
  - Request creation with validation
  - Request retrieval by ID or QR-ID
  - Request updates with conflict resolution
  - Environment-aware table selection

#### 3. `/api/contacts` (GET)
- **Purpose**: Contact data retrieval
- **Features**:
  - Pipedrive contact synchronization
  - Redis caching for performance
  - Contact filtering and search
  - Mine group organization

#### 4. `/api/products` (GET)
- **Purpose**: Product catalog management with BFF dynamic category discovery
- **Features**:
  - Pipedrive product synchronization
  - Redis caching with TTL
  - BFF-powered dynamic category discovery and mapping
  - Product filtering and categorization
  - Price and availability data
  - Automatic category name generation for new categories

#### 5. `/api/site-visits` (POST)
- **Purpose**: Check-in tracking
- **Features**:
  - Site visit recording
  - Slack notification integration
  - Environment-aware data storage
  - Visit history tracking

#### 6. `/api/slack/notify-checkin` (POST)
- **Purpose**: Slack integration for check-ins
- **Features**:
  - Environment-aware channel selection
  - Rich message formatting
  - Error handling and retry logic
  - Team notification management

### Utility Endpoints

#### 7. `/api/health` (GET)
- **Purpose**: Application health monitoring
- **Features**:
  - Database connectivity check
  - Redis connectivity check
  - Environment information
  - Performance metrics

#### 8. `/api/cache/health` (GET)
- **Purpose**: Cache system monitoring
- **Features**:
  - Redis connection status
  - Cache hit/miss statistics
  - Performance metrics
  - Cache configuration details

#### 9. `/api/mock-submissions` (GET)
- **Purpose**: Development testing support
- **Features**:
  - Mock submission retrieval
  - Development data isolation
  - Testing data management

#### 10. `/api/cache/refresh` (POST)
- **Purpose**: Manual cache refresh and data synchronization
- **Features**:
  - Redis cache busting for contacts and products
  - Force refresh from Pipedrive API
  - Comprehensive error handling and logging
  - Performance monitoring and correlation tracking
  - Returns busted cache keys for verification

## Database Structure and Interaction

### Schema Design

#### Core Tables

##### 1. `requests` (Production)
```sql
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT UNIQUE,                       -- QR-001 format
  status request_status NOT NULL DEFAULT 'draft',
  salesperson_first_name TEXT,
  salesperson_selection TEXT CHECK (salesperson_selection IN ('Luyanda', 'James', 'Stefan')),
  mine_group TEXT,
  mine_name TEXT,
  contact JSONB,                                -- ContactJSON structure
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,-- [LineItem] array
  comment TEXT,
  pipedrive_deal_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

##### 2. `mock_requests` (Development)
- Identical structure to `requests`
- Environment isolation for development
- Prevents test data contamination

##### 3. `site_visits` (Production)
```sql
CREATE TABLE site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_name TEXT NOT NULL,
  mine_group TEXT NOT NULL,
  mine_name TEXT NOT NULL,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  slack_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

##### 4. `mock_site_visits` (Development)
- Identical structure to `site_visits`
- Development data isolation

##### 5. `mock_pipedrive_submissions` (Testing)
```sql
CREATE TABLE mock_pipedrive_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  simulated_deal_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### JSONB Schema Validation

#### ContactJSON Structure
```typescript
{
  personId: number,           // Pipedrive person ID
  name: string,              // Contact name
  email: string | null,      // Email address
  phone: string | null,      // Phone number
  orgId?: number,            // Organization ID
  orgName?: string,          // Organization name
  mineGroup: string,         // Required for mobile workflow
  mineName: string           // Required for mobile workflow
}
```

#### LineItem Structure
```typescript
{
  pipedriveProductId: number,    // Pipedrive product ID
  name: string,                  // Product name
  code?: string,                 // Product code
  category?: string,             // Product category
  price: number,                 // Unit price
  quantity: number,              // Quantity (default: 1)
  description?: string,          // Full description
  shortDescription?: string,     // Short description
  customDescription?: string,    // Custom description
  showOnSalesHelper?: boolean    // Visibility flag
}
```

### Database Interactions

#### Environment-Aware Operations
- **Development**: Uses `mock_*` tables
- **Production**: Uses main tables
- **Automatic Selection**: Based on `NODE_ENV`

#### Performance Optimizations
- **Generated Columns**: Fast filtering on JSONB fields
- **B-tree Indexes**: Optimized for common queries
- **GIN Indexes**: JSONB containment queries
- **Composite Indexes**: Multi-field query optimization

#### Data Integrity
- **Triggers**: Automatic request ID generation
- **Constraints**: Salesperson selection validation
- **JSONB Validation**: Schema enforcement
- **Foreign Key Relationships**: Referential integrity

## Redis Cache Usage

### BFF (Backend for Frontend) Dynamic Category Discovery

#### Overview
The application now uses a BFF (Backend for Frontend) pattern for dynamic category discovery and data transformation. This replaces the previous hardcoded category mapping approach with a more flexible, auto-discovering system.

#### BFF Architecture
The BFF layer consists of several helper modules:

##### 1. Core BFF Modules (`lib/bff/`)
- **`types.ts`**: Type definitions for BFF data structures
- **`redis-helper.ts`**: Redis cache interaction utilities
- **`category-helper.ts`**: Category metadata extraction and management
- **`product-shape.ts`**: Product data transformation and shaping functions
- **`index.ts`**: Central export point for all BFF functionality

##### 2. Dynamic Category Discovery
The `transformRawProductsToCategorized` function in `lib/bff/product-shape.ts` provides:
- **Auto-discovery**: Automatically discovers new category IDs from Pipedrive data
- **Human-readable mapping**: Maps known category IDs to human-readable names
- **Fallback naming**: Generates "Category XX" names for unmapped categories
- **Real-time logging**: Logs newly discovered categories for monitoring

##### 3. Category Mapping Strategy
```typescript
// Known category mappings for human-readable names
const knownCategoryMap: Record<string, string> = {
  '28': 'Cable',
  '29': 'Conveyor Belt Equipment',
  '30': 'Environmental Monitoring',
  '31': 'General Supplies',
  '32': 'Services',
  '33': 'Panel Accessories',
  '34': 'Maintenance & Repair',
  '35': 'Rescue Bay Equipment',
  '36': 'Labour & Services',
  '37': 'Spare Parts',
  '80': 'New'
};

// Dynamic discovery for new categories
const generateCategoryName = (categoryId: string): string => {
  return `Category ${categoryId}`;
};

// "Show on Sales Helper" field mapping
// 78 = "Yes" (show on Sales Helper)
// 79 = "No" (do not show on Sales Helper)
const showOnSalesHelper = showOnSalesHelperValue === 78 || showOnSalesHelperValue === '78';
```

##### 4. Integration Points
- **API Routes**: `/api/products` now uses `transformRawProductsToCategorized` from BFF
- **Cache Warming**: Cache warming functions use BFF helpers for data transformation
- **Frontend Components**: ProductAccordion components consume BFF-processed data

#### Benefits of BFF Pattern
- **Maintainability**: Centralized category mapping logic
- **Flexibility**: Automatic discovery of new categories without code changes
- **Consistency**: Unified data transformation across all endpoints
- **Monitoring**: Built-in logging for category discovery tracking
- **Performance**: Efficient Redis-based data access patterns

### Cache Refresh Functionality

#### Manual Cache Refresh
- **Purpose**: Allow users to manually refresh data from Pipedrive without waiting for cache expiration
- **Implementation**: Subtle refresh button in top-right corner of Add Contact and Add Line Items pages
- **User Experience**: 
  - Visual feedback with spinning animation during refresh
  - Toast notifications for success/failure states
  - Non-intrusive design that doesn't interfere with main workflow
- **Technical Benefits**:
  - Immediate data synchronization from Pipedrive
  - Bypasses 2-hour cache expiration period
  - Enables real-time updates for new contacts and products

#### Cache Refresh API (`/api/cache/refresh`)
```typescript
// POST /api/cache/refresh
interface CacheRefreshResponse {
  ok: boolean;
  message: string;
  bustedKeys: string[];
}
```

#### CacheRefreshButton Component
```typescript
interface CacheRefreshButtonProps {
  className?: string;
}

// Features:
// - RefreshCw icon from Lucide React
// - Loading state with spinning animation
// - Toast notifications for user feedback
// - Error handling for network failures
// - Accessibility with proper title and test IDs
```

### Cache Architecture

#### Cache Configuration
```typescript
const CACHE_MAX_AGE_SECONDS = 2 * 60 * 60;        // 2 hours
const STALE_WHILE_REVALIDATE_SECONDS = 7 * 24 * 60 * 60; // 7 days
```

#### Cache Entry Structure
```typescript
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  stale: boolean;
  source: 'redis' | 'fresh';
}
```

### Cached Data Types

#### 1. Contact Data
- **Key Pattern**: `contacts:${mineGroup}:${mineName}`
- **TTL**: 2 hours
- **Purpose**: Reduce Pipedrive API calls
- **Invalidation**: On contact updates

#### 2. Product Catalog
- **Key Pattern**: `products:${category}:${showOnSalesHelper}`
- **TTL**: 2 hours
- **Purpose**: Fast product lookup
- **Invalidation**: On product updates

#### 3. Request Data
- **Key Pattern**: `request:${requestId}`
- **TTL**: 1 hour
- **Purpose**: Fast request retrieval
- **Invalidation**: On request updates

### Cache Performance Features

#### Pipeline Operations
- **Batch Operations**: Multiple Redis commands in single request
- **TTL Checking**: Efficient stale data detection
- **Error Handling**: Graceful cache failures

#### Stale-While-Revalidate
- **Background Updates**: Non-blocking cache refresh
- **Graceful Degradation**: Serves stale data during updates
- **Performance Monitoring**: Cache hit/miss tracking

#### Cache Busting
- **Selective Invalidation**: Targeted cache clearing
- **Pattern Matching**: Bulk cache invalidation
- **Event-Driven**: Automatic cache updates
- **Manual Refresh**: User-initiated cache refresh via UI button
- **Real-time Updates**: Immediate data synchronization from Pipedrive

## Frontend vs Backend

### Frontend Architecture

#### Next.js 14 App Router
- **File-based Routing**: Automatic route generation
- **Server Components**: Default server-side rendering
- **Client Components**: Interactive UI elements
- **Layout System**: Consistent page structure

#### State Management
- **React Hooks**: Local component state
- **Form State**: Controlled form inputs
- **URL State**: Query parameters for navigation
- **Local Storage**: QR-ID counter persistence

#### UI Framework
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Custom Components**: Reusable UI elements

### Backend Architecture

#### API Route Structure
- **Route Handlers**: Next.js API route functions
- **Middleware**: Request/response processing
- **Error Handling**: Centralized error management
- **Validation**: Zod schema validation

#### Database Layer
- **Neon Serverless**: Connection pooling
- **Query Builders**: Type-safe database operations
- **Transaction Support**: ACID compliance
- **Migration System**: Schema versioning

#### Integration Layer
- **Pipedrive API**: CRM integration
- **Slack API**: Notification system
- **Redis Client**: Cache management
- **Error Handling**: Graceful failure handling

### Data Flow

#### Request Creation Flow
1. **Frontend**: User fills form with validation
2. **API**: Request validation and database storage
3. **Cache**: Cache invalidation and updates
4. **Response**: Success/error feedback to user

#### Product Data Flow with BFF
1. **Pipedrive**: Raw product data fetched from Pipedrive API
2. **BFF Transformation**: `transformRawProductsToCategorized` processes raw data
3. **Category Discovery**: BFF automatically discovers and maps category IDs
4. **Redis Cache**: Transformed data cached with human-readable category names
5. **Frontend**: ProductAccordion components consume BFF-processed data
6. **Dynamic Updates**: New categories automatically discovered on cache refresh

#### Cache Refresh Flow
1. **Frontend**: User clicks cache refresh button
2. **API**: Cache busting for contacts and products
3. **Redis**: Removal of cached data
4. **Pipedrive**: Fresh data fetch on next request
5. **Response**: Success notification to user

#### Submission Flow
1. **Frontend**: Submit button triggers API call
2. **API**: Request retrieval and validation
3. **Pipedrive**: Deal creation and product attachment
4. **Database**: Status update and deal ID storage
5. **Response**: Success confirmation to user

#### Check-in Flow
1. **Frontend**: Check-in form submission
2. **API**: Site visit recording
3. **Slack**: Notification posting
4. **Database**: Visit history storage
5. **Response**: Check-in confirmation

## Test Framework and Coverage

### Testing Stack

#### Core Testing Tools
- **Vitest**: Fast unit testing framework
- **React Testing Library**: Component testing
- **jsdom**: DOM environment simulation
- **Testing Library Jest DOM**: Custom matchers

#### Test Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    environment: 'jsdom',
    globals: true,
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### Test Structure

#### Unit Tests (`tests/unit/`)
- **Schema Validation**: Zod schema testing
- **Database Operations**: Query function testing
- **Cache Operations**: Redis interaction testing
- **Utility Functions**: Helper function testing
- **API Endpoints**: Route handler testing

#### Integration Tests (`tests/integration/`)
- **API Endpoints**: Full request/response testing
- **Database Integration**: End-to-end database operations
- **Cache Integration**: Redis cache behavior testing
- **External APIs**: Pipedrive and Slack integration

#### Component Tests (`app/__tests__/`)
- **Page Components**: Full page testing
- **UI Components**: Reusable component testing
- **Form Validation**: Input validation testing
- **User Interactions**: Click and form submission testing
- **Cache Refresh**: Cache refresh button functionality testing

### Test Factories (`tests/_factories/`)

#### Data Factories
- **Contact Factory**: Contact data generation
- **Product Factory**: Product data generation
- **Request Factory**: Request data generation
- **Line Item Factory**: Line item data generation

#### Factory Features
- **Realistic Data**: Production-like test data
- **Customization**: Flexible data generation
- **Relationships**: Related data creation
- **Validation**: Schema-compliant data

### Test Utilities (`tests/_utils/`)

#### Helper Functions
- **Test Lifecycle**: Setup and teardown utilities
- **Database Helpers**: Test database operations
- **Mock Utilities**: External service mocking
- **Assertion Helpers**: Custom test assertions

### Test Coverage Areas

#### Frontend Coverage
- **Component Rendering**: UI component display
- **User Interactions**: Click, type, submit actions
- **Form Validation**: Input validation and error handling
- **Navigation**: Page routing and navigation
- **State Management**: Component state changes
- **Cache Refresh UI**: Button rendering, loading states, and user feedback

#### Backend Coverage
- **API Endpoints**: Request/response handling
- **Database Operations**: CRUD operations
- **Cache Operations**: Redis interactions
- **External Integrations**: Pipedrive and Slack APIs
- **Error Handling**: Error scenarios and recovery
- **Cache Refresh API**: Manual cache busting functionality
- **BFF Functions**: Dynamic category discovery and data transformation
- **Category Mapping**: Human-readable name generation and fallback logic

#### Integration Coverage
- **End-to-End Flows**: Complete user workflows
- **Data Persistence**: Database state consistency
- **Cache Consistency**: Cache and database synchronization
- **External Service Integration**: API reliability
- **Cache Refresh Integration**: Manual refresh with Pipedrive synchronization

### Testing Best Practices

#### Test Organization
- **Descriptive Names**: Clear test purpose identification
- **Arrange-Act-Assert**: Structured test layout
- **Isolation**: Independent test execution
- **Cleanup**: Proper test data cleanup

#### Performance Testing
- **Database Performance**: Query optimization testing
- **Cache Performance**: Cache hit/miss ratio testing
- **API Performance**: Response time testing
- **Memory Usage**: Memory leak detection
- **Cache Refresh Performance**: Manual refresh operation timing and impact

#### Error Scenario Testing
- **Network Failures**: Offline behavior testing
- **API Failures**: External service failure handling
- **Validation Errors**: Invalid input handling
- **Database Errors**: Connection failure handling
- **Cache Refresh Failures**: Redis connection issues and API error handling

### Continuous Integration

#### Automated Testing
- **Pre-commit Hooks**: Local test execution
- **CI Pipeline**: Automated test suite execution
- **Coverage Reporting**: Test coverage metrics
- **Performance Monitoring**: Test performance tracking

#### Quality Gates
- **Test Coverage**: Minimum coverage requirements
- **Performance Thresholds**: Response time limits
- **Error Rate Monitoring**: Failure rate tracking
- **Security Scanning**: Vulnerability detection

## Environment Configuration

### Environment Variables

#### Required Variables
- `DATABASE_URL`: Neon Postgres connection string
- `REDIS_URL`: Upstash Redis connection string
- `PIPEDRIVE_API_TOKEN`: Pipedrive API authentication
- `PIPEDRIVE_BASE_URL`: Pipedrive API base URL

#### Optional Variables
- `SLACK_BOT_TOKEN`: Slack bot authentication
- `SLACK_CHANNEL`: Slack notification channel
- `PIPEDRIVE_SUBMIT_MODE`: Submission mode (mock/live)
- `APP_ENV`: Application environment

### Environment-Based Behavior

#### Development Environment
- **Mock Submissions**: Test data isolation
- **Test Channels**: Slack test channel usage
- **Mock Tables**: Development data separation
- **Debug Logging**: Enhanced error reporting

#### Production Environment
- **Live Submissions**: Real Pipedrive integration
- **Production Channels**: Live Slack notifications
- **Production Tables**: Live data storage
- **Performance Logging**: Optimized logging

## Deployment and DevOps

### Branch Protection
- **Mandatory Protection**: Prevents direct main branch commits
- **Git Hooks**: Pre-commit and pre-push validation
- **Feature Branches**: Required for all changes
- **Pull Request Workflow**: Code review enforcement

### Deployment Pipeline
- **Vercel Integration**: Automatic deployment from main
- **Environment Validation**: Pre-deployment checks
- **Database Migrations**: Automatic schema updates
- **Health Checks**: Post-deployment verification

### Monitoring and Observability
- **Performance Logging**: Request timing tracking
- **Error Tracking**: Centralized error monitoring
- **Cache Metrics**: Redis performance monitoring
- **Database Metrics**: Query performance tracking

## Security Considerations

### Data Protection
- **Environment Isolation**: Development/production data separation
- **API Key Management**: Secure credential storage
- **Input Validation**: Comprehensive data validation
- **SQL Injection Prevention**: Parameterized queries

### Access Control
- **API Rate Limiting**: Request throttling
- **CORS Configuration**: Cross-origin request control
- **Authentication**: API token validation
- **Authorization**: Role-based access control

### Audit and Compliance
- **Request Logging**: Comprehensive audit trails
- **Data Retention**: Automated data cleanup
- **Privacy Protection**: PII handling compliance
- **Security Scanning**: Vulnerability assessment

## User Workflow Improvements

### Cache Refresh Integration
- **Real-time Data Access**: Users can now see new contacts and products immediately after they're added to Pipedrive
- **Reduced Wait Time**: Eliminates the 2-hour cache expiration wait period for critical data updates
- **Improved User Experience**: Subtle, non-intrusive refresh functionality that enhances rather than disrupts workflow
- **Data Synchronization**: Ensures users always have access to the most current information from Pipedrive

### Workflow Benefits
- **Sales Efficiency**: Sales personnel can immediately access newly added contacts and products
- **Data Accuracy**: Reduces risk of working with outdated information
- **User Control**: Gives users control over when to refresh data based on their needs
- **Seamless Integration**: Cache refresh functionality integrates naturally with existing page layouts

This technical specification provides a comprehensive overview of the Sales Helper App's current architecture, implementation details, and operational characteristics. The application demonstrates a well-structured, mobile-first approach to sales workflow management with robust testing, caching, and deployment practices, enhanced by manual cache refresh capabilities for improved data synchronization.
