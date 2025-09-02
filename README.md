# Sales Helper App - Complete Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Features & Functionality](#features--functionality)
5. [API Reference](#api-reference)
6. [Database Schema](#database-schema)
7. [Caching & Performance](#caching--performance)
8. [Testing](#testing)
9. [Development](#development)
10. [Deployment](#deployment)
11. [Security](#security)
12. [Future Roadmap](#future-roadmap)

## Overview

The Sales Helper App is a Next.js 14 application designed for mobile-first sales workflow management. It enables sales personnel to create and manage sales requests with contacts, line items, and check-ins, integrating with Pipedrive CRM and Slack for notifications.

### Key Technologies
- **Frontend**: Next.js 14 with React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes with TypeScript
- **Database**: Neon Postgres (serverless) with JSONB schema
- **Cache**: Upstash Redis for performance optimization
- **Testing**: Vitest with React Testing Library
- **Deployment**: Vercel with branch protection

### Architecture Principles
- **Mobile-First**: Optimized for mobile devices with responsive design
- **Offline-Resilient**: Client-side QR-ID generation for poor network conditions
- **Environment-Aware**: Separate development/production data isolation
- **Type-Safe**: Comprehensive TypeScript validation with Zod schemas

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Neon Postgres database
- Upstash Redis instance
- Pipedrive API token

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd sales-helper-app-s2
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp env.example .env.local
   ```
   
   Configure `.env.local` with your values:
   ```bash
   # Database
   DATABASE_URL=postgres://user:password@host/database
   REDIS_URL=redis://user:password@host:port
   
   # Pipedrive
   PIPEDRIVE_API_TOKEN=your_token_here
   PIPEDRIVE_BASE_URL=https://api.pipedrive.com/v1
   PIPEDRIVE_SUBMIT_MODE=mock
   
   # Optional: Slack
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_CHANNEL=#out-of-office
   
   # Zapier Integration
   ZAPIER_WEBHOOK_SECRET=your_long_random_secret
   ```
   
   **Note**: The application now uses separate database instances for development and production instead of table prefixes. Set `DATABASE_URL` to point to your development database for local development.

3. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Main app: http://localhost:3000
   - Flow metrics: http://localhost:3000/flow-metrics-report

## Architecture

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
- **Environment Isolation**: Separate database instances for development and production

#### Architecture Approach
- **Database Separation**: Development and production use separate Neon database instances
- **Unified Schema**: Same table names across environments for consistency
- **No Mock Tables**: Eliminated the `mock_*` table pattern in favor of database-level isolation
- **Environment Variables**: `DATABASE_URL` determines which database instance to use
- **Benefits**: Cleaner code, consistent table names, easier maintenance, better testing isolation

#### Integration Layer
- **Pipedrive API**: CRM integration
- **Slack API**: Notification system
- **Redis Client**: Cache management
- **Error Handling**: Graceful failure handling

## Features & Functionality

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
  - Environment-aware notification channels

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

### Flow Metrics Report System

#### Overview
The Flow Metrics Report provides comprehensive sales efficiency tracking with dynamic metric management. It replaces the previous hardcoded approach with a database-driven system that allows full CRUD operations on metrics and their stage mappings.

#### Pipedrive Stage Explorer
- **Real-time Pipeline Data**: Fetches live data from Pipedrive API
- **Accordion Interface**: Expandable pipeline sections for easy navigation
- **Stage Details**: Shows Stage ID, Stage Name, and Order for each stage
- **Status Indicators**: Visual badges for active/inactive pipelines
- **Error Handling**: Graceful handling of API failures and network issues
- **Manual Refresh**: Button to reload data when needed

#### Key Features
- **Dynamic Metrics**: Metrics are loaded from database instead of hardcoded values
- **Full CRUD Operations**: Create, read, update, and delete metrics and mappings
- **Unified Management**: Single interface for managing both metrics and their stage mappings
- **Real-time Updates**: Changes in mappings immediately reflect on the main report page
- **Flexible Configuration**: Support for custom start/end stages per metric

### Zapier Integration

#### Overview
The Sales Helper App includes automated Zapier integration for processing completed deals. When a deal is moved to the "done" column in Pipedrive, Zapier automatically triggers a webhook that fetches the deal's flow data and stores it in the database for analysis.

#### How It Works
1. **Zapier Setup**: Configure Zapier to detect when deals are moved to the "done" column
2. **Webhook Processing**: Validate the webhook secret and fetch flow data from Pipedrive
3. **Database Storage**: Store the flow data in the `pipedrive_deal_flow_data` table
4. **Data Availability**: Flow data appears automatically in the Raw Data tab

#### Benefits
- ✅ **Automated Processing**: No manual intervention required
- ✅ **Real-time Data**: Flow data captured immediately when deals complete
- ✅ **Consistent Storage**: Same data format as manual "Fetch" button
- ✅ **Error Resilient**: Graceful handling of API failures
- ✅ **Secure**: Secret-based authentication prevents unauthorized access

### QR-ID Generation Pattern

#### Design Philosophy
- **Offline-First**: QR-IDs can be generated even with poor WiFi coverage
- **Resilient**: Works without server connectivity during ID generation
- **Safe**: Server-side validation prevents duplicate IDs
- **Environment-Aware**: Separate counters for development vs production

#### Implementation
```typescript
// Environment-specific localStorage keys
const getQRCounterKey = (): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? 'qr_counter_dev' : 'qr_counter_prod';
};

// Generates sequential IDs: QR-002, QR-003, QR-004, etc.
export const generateQRId = (): string => {
  const counterKey = getQRCounterKey();
  const currentCounter = localStorage.getItem(counterKey);
  const nextCounter = currentCounter ? parseInt(currentCounter, 10) + 1 : 2;
  localStorage.setItem(counterKey, nextCounter.toString());
  return `QR-${nextCounter.toString().padStart(3, '0')}`;
};
```

#### Benefits
- ✅ **Works offline** - No server dependency for ID generation
- ✅ **Fast response** - No network round-trip for ID generation
- ✅ **Resilient** - Handles poor network conditions gracefully
- ✅ **Safe** - Server validation prevents duplicates
- ✅ **Environment-aware** - Separate counters prevent conflicts

## API Reference

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

#### 9. `/api/cache/refresh` (POST)
- **Purpose**: Manual cache refresh and data synchronization
- **Features**:
  - Redis cache busting for contacts and products
  - Force refresh from Pipedrive API
  - Comprehensive error handling and logging
  - Performance monitoring and correlation tracking

#### 10. `/api/pipedrive-webhook` (POST)
- **Purpose**: Process Zapier webhook requests for deal flow data
- **Authentication**: Requires `X-Zapier-Secret` header
- **Input**: JSON with `deal_id` (number or string)
- **Output**: JSON response with processing status

### Flow Metrics API

#### `/api/admin/flow-metrics-config` (GET/POST)
- **Purpose**: Flow metrics configuration management
- **Features**:
  - Get all metrics configuration
  - Create new metrics
  - Update existing metrics
  - Delete metrics

#### `/api/flow/metrics` (GET)
- **Purpose**: Get calculated flow metrics data
- **Features**:
  - Period-based filtering (7d, 14d, 1m, 3m)
  - Real-time calculations
  - Performance data aggregation

#### `/api/pipedrive/pipelines` (GET)
- **Purpose**: Get Pipedrive pipeline information
- **Features**:
  - Real-time pipeline data
  - Stage information
  - Pipeline status

## Database Schema

### Core Tables

#### 1. `requests` (Production)
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

#### 2. `requests` (Development)
- Identical structure to production `requests`
- Environment isolation provided by separate database instance
- Prevents test data contamination through database separation

#### 3. `site_visits` (Production)
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

#### 4. `flow_metrics_config` (Flow Metrics)
```sql
CREATE TABLE flow_metrics_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'lead-conversion-time'
  display_title VARCHAR(100) NOT NULL,    -- e.g., 'Lead Conversion Time'
  canonical_stage VARCHAR(50) NOT NULL,   -- e.g., 'LEAD'
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. `pipedrive_deal_flow_data` (Flow Analysis)
```sql
CREATE TABLE pipedrive_deal_flow_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pipedrive_event_id BIGINT UNIQUE NOT NULL,
  deal_id BIGINT NOT NULL,
  pipeline_id BIGINT NOT NULL,
  stage_id BIGINT NOT NULL,
  stage_name TEXT NOT NULL,
  entered_at TIMESTAMPTZ NOT NULL,
  left_at TIMESTAMPTZ,
  duration_seconds BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. `pipedrive_submissions` (Mock Submissions)
```sql
CREATE TABLE pipedrive_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  simulated_deal_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
- **Purpose**: Stores mock Pipedrive submissions for development and testing
- **Environment**: Used when `PIPEDRIVE_SUBMIT_MODE=mock`
- **Architecture**: Same table name across environments, isolated by separate database instances

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
- **Development**: Uses same table names in development database instance
- **Production**: Uses same table names in production database instance
- **Automatic Selection**: Based on `DATABASE_URL` environment variable
- **Architecture**: Database separation provides environment isolation, not table name differences

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

## Caching & Performance

### Redis Cache Usage

#### BFF (Backend for Frontend) Dynamic Category Discovery

##### Overview
The application uses a BFF (Backend for Frontend) pattern for dynamic category discovery and data transformation. This replaces the previous hardcoded category mapping approach with a more flexible, auto-discovering system.

##### BFF Architecture
The BFF layer consists of several helper modules:

###### 1. Core BFF Modules (`lib/bff/`)
- **`types.ts`**: Type definitions for BFF data structures
- **`redis-helper.ts`**: Redis cache interaction utilities
- **`category-helper.ts`**: Category metadata extraction and management
- **`product-shape.ts`**: Product data transformation and shaping functions
- **`index.ts`**: Central export point for all BFF functionality

###### 2. Dynamic Category Discovery
The `transformRawProductsToCategorized` function provides:
- **Auto-discovery**: Automatically discovers new category IDs from Pipedrive data
- **Human-readable mapping**: Maps known category IDs to human-readable names
- **Fallback naming**: Generates "Category XX" names for unmapped categories
- **Real-time logging**: Logs newly discovered categories for monitoring

###### 3. Category Mapping Strategy
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

## Testing

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

## Development

### Development Commands

```bash
# Development
npm run dev                    # Start development server with environment check and migrations
npm run build                  # Build for production with environment check and migrations
npm run start                  # Start production server
npm run lint                   # Run ESLint
npm run test                   # Run tests
npm run test:watch             # Run tests in watch mode

# Database
npm run db:migrate             # Run database migrations
npm run env:check              # Validate environment configuration

# Neon Database Management
npm run neon:list              # List all branches
npm run neon:current           # Setup environment for current git branch
npm run neon:setup <branch>    # Setup environment for specific branch
npm run neon:migrate <branch>  # Run migrations on a specific branch
npm run neon:create <branch>   # Create a new database branch
npm run neon:delete <branch>   # Delete a branch
npm run neon:cleanup           # Clean up old preview branches

# Environment Setup
npm run db:setup-dev           # Setup development environment
npm run db:setup-preview       # Setup preview environment
npm run db:migrate-dev         # Run migrations on development
npm run db:migrate-preview     # Run migrations on preview
npm run db:migrate-prod        # Run migrations on production

# Utilities
npm run workflow:update        # Update workflow state dashboard
npm run test:clean-build       # Test clean build process
```

### Environment-Based Behavior

The app uses different strategies for local development vs production to prevent test data from affecting production users:

#### Pipedrive Submissions
- **Control**: `PIPEDRIVE_SUBMIT_MODE` environment variable
- **Development**: `PIPEDRIVE_SUBMIT_MODE=mock` → Saves to `pipedrive_submissions` table
- **Production**: `PIPEDRIVE_SUBMIT_MODE=live` → Submits to actual Pipedrive API

#### Slack Notifications
- **Control**: `NODE_ENV` environment variable
- **Development**: `NODE_ENV=development` → Posts to `#sales-helper-test` channel
- **Production**: `NODE_ENV=production` → Posts to `SLACK_CHANNEL` (defaults to '#out-of-office')

#### Database Tables (Requests & Site Visits)
- **Control**: `NODE_ENV` environment variable
- **Development**: `NODE_ENV=development` → Uses `requests` and `site_visits` tables in development database
- **Production**: `NODE_ENV=production` → Uses `requests` and `site_visits` tables in production database
- **Architecture**: Separate database instances provide environment isolation instead of table prefixes

#### Contacts & Line Items
- **Read-only reference tables** - No environment-based switching
- **Shared between environments** - Used for product catalog and contact lookup

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

## Deployment

### Deployment Workflow

#### Feature Development
1. Create feature branch: `git checkout -b feature/descriptive-name`
2. Make changes and test locally
3. Commit to feature branch (git hooks will prevent main branch commits)
4. Push to GitHub: `git push origin feature/your-branch`
5. Create pull request for review
6. Merge to main only after approval

#### Production Deployment
- Only merged pull requests trigger production deployment
- Vercel automatically deploys from main branch
- All changes must go through feature branch → pull request → merge workflow

#### Preview Deployments (Disabled)
- Preview deployments have been disabled due to persistent Vercel infrastructure issues
- All testing should be done locally or via production deployment
- Git integration has been disconnected to prevent automatic preview deployments

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

### Emergency Override (Use with extreme caution)
If you absolutely need to bypass the git hooks (emergency only):
```bash
git commit --no-verify  # Skip pre-commit hook
git push --no-verify    # Skip pre-push hook
```

## Security

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

### Security Considerations for Zapier Integration
- **Secret-based Authentication**: Webhook secret validation
- **Input Validation**: Deal ID validation and sanitization
- **Error Handling**: Graceful failure without exposing internals
- **Logging**: Comprehensive audit trails for webhook operations

## Future Roadmap

### Planned Features

#### 1. Voice Commands via MCP Server
- **Purpose**: Voice-activated sales workflow management
- **Features**:
  - Voice recording and processing
  - MCP server integration for command interpretation
  - Hands-free operation for mobile users
  - Command history and learning

#### 2. Customer Sentiment Tracking
- **Purpose**: In-app mini surveys for customer feedback
- **Features**:
  - Survey widgets and forms
  - Sentiment analysis and reporting
  - Response analytics and trends
  - Integration with sales workflow

#### 3. Offline Support with Helper Workers
- **Purpose**: Queue processing for offline operations
- **Features**:
  - Offline data synchronization
  - Queue management and processing
  - Background sync workers
  - Conflict resolution

#### 4. Google Workspace Authentication
- **Purpose**: Enterprise-grade authentication for all users
- **Features**:
  - Google Workspace domain restriction
  - Single sign-on integration
  - Automatic session management
  - Role-based access control

### Architecture Evolution

#### Modular Architecture Plan
The application is planned to evolve into a modular architecture with clear separation of concerns:

- **Feature Modules**: Independent feature development
- **Shared Components**: Reusable UI and utility components
- **Core Infrastructure**: Database, caching, and authentication
- **API Versioning**: Backward-compatible API evolution

#### Benefits of Future Architecture
- **Scalability**: Independent feature development and deployment
- **Maintainability**: Clear boundaries and responsibilities
- **Performance**: Optimized bundle sizes and lazy loading
- **Security**: Isolated authentication and authorization
- **Testing**: Comprehensive test coverage per module

#### Current Implementation Status (Phase 1 - Core Infrastructure)
The application has successfully completed Phase 1 of the modularization plan:

- **✅ Core Database Infrastructure**: Base repository pattern, repository factory, and shared types implemented
- **✅ Shared Type System**: Comprehensive type definitions for UI components, API structures, and common utilities
- **✅ Environment Configuration**: Feature-specific environment schemas with validation
- **✅ Database Architecture**: Eliminated mock table pattern in favor of separate database instances
- **✅ Migration System**: Automated schema updates with proper versioning
- **🔄 Next Phase**: Feature module extraction and API route restructuring

**Key Architectural Changes**:
- Replaced `mock_*` table pattern with database-level environment isolation
- Implemented unified table names across environments for consistency
- Added comprehensive type safety and validation systems
- Established foundation for future modular development

### User Workflow Improvements

#### Cache Refresh Integration
- **Real-time Data Access**: Users can now see new contacts and products immediately after they're added to Pipedrive
- **Reduced Wait Time**: Eliminates the 2-hour cache expiration wait period for critical data updates
- **Improved User Experience**: Subtle, non-intrusive refresh functionality that enhances rather than disrupts workflow
- **Data Synchronization**: Ensures users always have access to the most current information from Pipedrive

#### Workflow Benefits
- **Sales Efficiency**: Sales personnel can immediately access newly added contacts and products
- **Data Accuracy**: Reduces risk of working with outdated information
- **User Control**: Gives users control over when to refresh data based on their needs
- **Seamless Integration**: Cache refresh functionality integrates naturally with existing page layouts

---

This comprehensive documentation provides a complete overview of the Sales Helper App's architecture, implementation details, and operational characteristics. The application demonstrates a well-structured, mobile-first approach to sales workflow management with robust testing, caching, and deployment practices, enhanced by manual cache refresh capabilities for improved data synchronization.

