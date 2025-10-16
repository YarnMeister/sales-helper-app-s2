# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL DATABASE RULE

**ALWAYS USE DRIZZLE ORM - NEVER USE RAW SQL**

- ✅ **DO**: Use Drizzle ORM for ALL database queries
  ```typescript
  import { createStandardConnection } from '@/lib/database/connection-standard';
  import { flowMetricsConfig } from '@/lib/database/schema';
  import { eq } from 'drizzle-orm';

  const { db } = createStandardConnection();
  const result = await db
    .select()
    .from(flowMetricsConfig)
    .where(eq(flowMetricsConfig.isActive, true));
  ```

- ❌ **DON'T**: Use raw SQL queries (tagged templates)
  ```typescript
  // WRONG - causes type mismatches and truncation issues
  const result = await sql`SELECT * FROM flow_metrics_config WHERE is_active = true`;
  ```

**Why?**
- Raw SQL with Neon HTTP driver silently truncates results
- Type mismatches between database and schema cause silent failures
- Drizzle ORM handles type mapping correctly
- ORM provides type safety and prevents SQL injection

**Exception**: Only use raw SQL for complex queries that Drizzle cannot express (very rare)

**Legacy Code**: `lib/db.ts` contains 595 lines of raw SQL that should be migrated to Drizzle ORM over time

## Essential Commands

### Development
```bash
npm run dev                    # Start development server (includes env check and migrations)
npm run build                  # Build for production 
npm run start                  # Start production server
npm run lint                   # Run ESLint
npm run test                   # Run tests with Vitest
npm run test:watch             # Run tests in watch mode
```

### Database Management
```bash
npm run db:migrate             # Run database migrations (WebSocket driver)
npm run db:generate            # Generate Drizzle migrations
npm run db:push                # DISABLED - use db:migrate instead
npm run db:studio              # Open Drizzle Studio
npm run env:check              # Validate environment configuration
```

**Migration System**: Uses WebSocket-only approach with Drizzle ORM
- **Single folder**: `lib/database/migrations/`
- **Single runner**: `scripts/migrate-websocket.ts`
- **Tracking table**: `drizzle.__drizzle_migrations` (Drizzle's standard)
- **See**: `.augment/rules/DATABASE_MIGRATIONS.md` for complete guide

### Neon Database Branch Management
```bash
npm run neon:current           # Setup environment for current git branch
npm run neon:list              # List all database branches
npm run neon:create <branch>   # Create new database branch
npm run neon:delete <branch>   # Delete database branch
npm run neon:migrate <branch>  # Run migrations on specific branch
npm run neon:cleanup           # Clean up old preview branches
```

## High-Level Architecture

### Technology Stack
- **Frontend**: Next.js 14 App Router with React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Neon Postgres with Drizzle ORM
- **Cache**: Upstash Redis with custom BFF layer
- **Testing**: Vitest with React Testing Library
- **Deployment**: Vercel (production only, no preview environments)

### Environment Isolation Strategy
The application uses **separate database instances** for development and production environments instead of table prefixes:

- **Development**: Uses development database instance (`NODE_ENV=development`)
- **Production**: Uses production database instance (`NODE_ENV=production`)
- **Benefits**: Same table names across environments, cleaner code, better isolation
- **Configuration**: `DATABASE_URL` environment variable determines which database to use

### Database Architecture
- **Primary Tables**: `requests`, `site_visits`, `flow_metrics_config`, `pipedrive_deal_flow_data`, `deal_flow_sync_status`
- **ORM**: Drizzle ORM with TypeScript schema definitions in `lib/database/schema.ts`
- **Migrations**: Located in `lib/database/migrations/` directory, managed through WebSocket migration system
- **Repository Pattern**: Core repository classes in `lib/database/core/` with typed interfaces
- **Migration Driver**: Neon WebSocket Pool (supports multi-statement SQL)

### API Routes Structure
Key API endpoints:
- `/api/requests` - CRUD operations for sales requests
- `/api/contacts` - Contact data with Pipedrive integration
- `/api/products` - Product catalog with BFF dynamic category discovery
- `/api/submit` - Submit requests to Pipedrive (mock or live mode)
- `/api/cache/refresh` - Manual cache refresh functionality
- `/api/flow/metrics` - Flow metrics calculations
- `/api/pipedrive-webhook` - Zapier integration for deal flow data

### BFF (Backend for Frontend) Pattern
The application implements a BFF layer for data transformation:

- **Location**: `lib/bff/` directory
- **Purpose**: Dynamic category discovery, product data transformation
- **Components**: 
  - `category-helper.ts` - Category mapping and discovery
  - `product-shape.ts` - Product data transformation
  - `redis-helper.ts` - Cache interaction utilities
- **Benefits**: Auto-discovers new Pipedrive categories, generates human-readable names

### Caching Strategy
- **Redis Cache**: 2-hour TTL with stale-while-revalidate pattern
- **Cached Data**: Contacts, products, requests
- **Manual Refresh**: UI buttons allow users to bypass cache and fetch fresh data
- **Cache Keys**: Structured patterns like `contacts:${mineGroup}:${mineName}`

## Development Guidelines

### Branch Workflow
- **Never commit directly to main** - use feature branches only
- Create branches: `git checkout -b feature/<descriptive-name>`
- All changes require pull request approval before merging to main

### Environment Configuration
- Copy `.env.example` to `.env.local` for local development
- Run `npm run env:check` to validate configuration
- Key variables: `DATABASE_URL`, `REDIS_URL`, `PIPEDRIVE_API_TOKEN`

### Testing Requirements
- Run `npm test` and fix all failing tests before committing
- Add tests for new functionality in appropriate directories:
  - `tests/unit/` - Unit tests
  - `tests/integration/` - Integration tests  
  - `app/__tests__/` - Component tests
- Use test factories in `tests/_factories/` for consistent test data

### Code Quality
- Run `npm run lint` and fix all errors before committing
- TypeScript compilation must be clean: `npm run build`
- Follow existing patterns for new components and API routes
- Use Drizzle ORM for all database operations

## Important Context

### Pipedrive Integration
- **Submit Mode**: `PIPEDRIVE_SUBMIT_MODE=mock` for development, `live` for production
- **Mock Submissions**: Stored in `pipedrive_submissions` table during development
- **Live Submissions**: Create actual deals in Pipedrive CRM

### Flow Metrics System
- **Database-Driven**: Metrics configuration stored in `flow_metrics_config` table
- **Stage Mappings**: Flexible start/end stage configuration per metric
- **Real-time Calculations**: Performance metrics calculated from Pipedrive deal flow data

### Zapier Integration
- **Webhook Endpoint**: `/api/pipedrive-webhook` processes completed deals
- **Authentication**: Requires `X-Zapier-Secret` header
- **Data Storage**: Automatically stores deal flow data for analysis

### Mobile-First Design
- **QR-ID Generation**: Client-side localStorage approach for offline resilience
- **Responsive UI**: Tailwind CSS with mobile-optimized layouts
- **Progressive Enhancement**: Works with poor network conditions

### Deployment
- **Production Only**: No preview environments, test locally or on production
- **Vercel**: Automatic deployment from main branch
- **Branch Protection**: Git hooks prevent direct main branch commits
- **Health Checks**: `/api/health` endpoint for monitoring

## Common Patterns

### Database Queries
Use the repository pattern with Drizzle ORM:
```typescript
import { getRepository } from '@/lib/database/core/repository-factory';

const repository = getRepository('salesRequests');
const request = await repository.findById(id);
```

### API Error Handling
Consistent error responses across all API routes:
```typescript
return NextResponse.json(
  { error: 'Error message' }, 
  { status: 400 }
);
```

### Cache Operations
Use the BFF helpers for cache management:
```typescript
import { getCachedData, setCachedData } from '@/lib/bff';

const data = await getCachedData(key) || await fetchFreshData();
```

### Environment-Aware Operations
Check environment for conditional behavior:
```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
const tableName = 'requests'; // Same name across environments
```

This codebase emphasizes type safety, clean architecture patterns, and robust error handling throughout the application stack.