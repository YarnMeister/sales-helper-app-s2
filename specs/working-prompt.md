# Flow Metrics Redesign - Implementation Plan v2

## 🎯 Objective
Redesign the Flow Metrics system as a proper feature module with JSONB-based configuration, following project architecture standards and testing practices.

## 📋 Background
- Pipedrive pipeline setup was redesigned - current metrics are outdated
- Old `canonical_stage_mappings` design was over-engineered
- Need to configure 9 new metrics across 8 different pipelines
- Webhook feeding `pipedrive_deal_flow_data` is broken (will fix separately)
- **Alignment:** Follow architecture-modularization-plan.md Phase 2.2 (Flow Metrics Module)
- **Testing:** Implement test-playbook.md patterns

## 🏗️ Architecture Decisions

### 1. JSONB Configuration Pattern
**Pattern:** Follow `requests.line_items` JSONB approach  
**Benefits:**
- Single table (remove `canonical_stage_mappings`)
- Atomic updates, no foreign key complexity
- Fewer JOINs, better performance
- Easy schema-less extension

**Data Structure:**
```json
{
  "metric_key": "general-supplies-lead-time",
  "display_title": "General Supplies Lead Time",
  "config": {
    "pipeline": { "id": 5, "name": "New Orders – General Items" },
    "startStage": { "id": 301, "name": "Order Received – General" },
    "endStage": { "id": 303, "name": "Order Ready – General" },
    "thresholds": { "minDays": 2, "maxDays": 14 },
    "comment": "Tracks fulfillment time for general supply orders"
  },
  "sort_order": 1,
  "is_active": true
}
```

### 2. Feature Module Structure
**Location:** `app/features/flow-metrics/` (NOT scattered components)  
**Follows:** architecture-modularization-plan.md Phase 2.2

```
app/features/flow-metrics/
├── __tests__/
│   ├── test-utils.ts              # Feature-specific mocks
│   ├── factories.ts               # Metric/config builders
│   ├── MetricsDashboard.test.tsx  # Component tests
│   ├── api.test.ts                # API route tests
│   └── integration.test.ts        # Feature workflow tests
├── components/
│   ├── MetricsDashboard.tsx       # Main dashboard
│   ├── KPICard.tsx                # Metric card
│   ├── MetricsManagement.tsx      # Config UI
│   ├── PipedriveStageExplorer.tsx # Stage picker
│   └── FlowDataTable.tsx          # Raw data view
├── api/
│   ├── metrics/
│   │   └── route.ts               # GET calculated metrics
│   ├── config/
│   │   ├── route.ts               # GET/POST metric configs
│   │   └── [id]/route.ts          # PUT/DELETE specific config
│   └── [metric-id]/
│       └── route.ts               # GET metric details
├── types/
│   ├── metric.ts                  # Metric types
│   ├── config.ts                  # Config types
│   └── flow-data.ts               # Flow data types
├── hooks/
│   ├── useMetrics.ts              # Fetch/manage metrics
│   ├── useFlowData.ts             # Fetch flow data
│   └── useStageSelection.ts       # Stage picker logic
├── utils/
│   ├── calculations.ts            # Metric calculations
│   ├── formatting.ts              # Display formatting
│   └── validation.ts              # Config validation
└── pages/
    ├── page.tsx                   # /flow-metrics-report
    └── [metric-id]/
        └── page.tsx               # /flow-metrics-report/[id]
```

### 3. Database Layer Structure
**Location:** `lib/database/features/flow-metrics/`  
**Pattern:** Repository pattern with Drizzle ORM

```
lib/database/features/flow-metrics/
├── repository.ts                  # FlowMetricsRepository class
├── types.ts                       # Database-specific types
├── queries.ts                     # Complex SQL queries
└── migrations/
    └── 0002_flow_metrics_jsonb.ts # Drizzle migration
```

## 📊 New Metrics to Configure

| # | Metric Name | Pipeline | Start Stage | End Stage |
|---|-------------|----------|-------------|-----------|
| **5** | General supplies Lead Time | New Orders – General Items | Order Received – General | Order Ready – General |
| **6** | Cable Order Lead Time | Ruan – New Orders – Cable Orders | Order Received – Ruan | Order Ready – Ruan |
| **7** | OEM Order Lead Time | Johan – New Orders – OEM | New Order Received – OEM | Order Ready – OEM |
| **8** | OEM – Repair strip and Quote Lead Time | Johan – Repairs – OEM | RFQ received – Repair OEM | Quote Sent – Repair |
| **9** | MetCoAir Order Lead Time | Michael – New Orders – MetCoAir | New Order Received – MKIV | Order Ready – MKIV |
| **10** | MetCoAir Repair Lead Time | Michael – Repairs – MetCoAir | RFQ received – Repair | Quote Sent – Repair |
| **11a** | OEM/General Delivery Lead Time | Dawie – Deliveries | OEM Order – In Laydown | Quality Control |
| **11b** | MetCoAir Delivery Lead Time | Dawie – Deliveries | OEM Order – In Laydown | Quality Control |
| **12** | Order to Cash | Finance | (New Orders Received – All Orders) New Orders | Invoice Paid |

## 🔧 Implementation Phases

### Phase 1: Database Migration with Drizzle ORM

**Create:** `lib/database/features/flow-metrics/migrations/0002_flow_metrics_jsonb.ts`

**Tasks:**
- [ ] Use Drizzle migration system (NOT raw SQL)
- [ ] Drop `canonical_stage_mappings` table
- [ ] Recreate `flow_metrics_config` with JSONB column
- [ ] Add GIN index for JSONB queries
- [ ] Add validation function (as separate SQL in migration)

**Drizzle Migration:**
```typescript
import { sql } from 'drizzle-orm';
import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export async function up(db) {
  // Drop old table
  await db.execute(sql`DROP TABLE IF EXISTS canonical_stage_mappings CASCADE`);
  
  // Recreate flow_metrics_config with JSONB
  await db.execute(sql`
    DROP TABLE IF EXISTS flow_metrics_config CASCADE
  `);
  
  await db.execute(sql`
    CREATE TABLE flow_metrics_config (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      metric_key TEXT NOT NULL UNIQUE,
      display_title TEXT NOT NULL,
      config JSONB NOT NULL DEFAULT '{}'::jsonb,
      sort_order INTEGER DEFAULT 0 NOT NULL,
      is_active BOOLEAN DEFAULT true NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);
  
  // Create indexes
  await db.execute(sql`CREATE UNIQUE INDEX idx_fmc_metric_key ON flow_metrics_config(metric_key)`);
  await db.execute(sql`CREATE INDEX idx_fmc_is_active ON flow_metrics_config(is_active)`);
  await db.execute(sql`CREATE INDEX idx_fmc_sort_order ON flow_metrics_config(sort_order)`);
  await db.execute(sql`CREATE INDEX idx_fmc_config_gin ON flow_metrics_config USING GIN(config)`);
  
  // Validation function
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION validate_metric_config_jsonb(config_data JSONB)
    RETURNS BOOLEAN AS $$
    BEGIN
        RETURN config_data ? 'pipeline' 
           AND config_data ? 'startStage'
           AND config_data ? 'endStage'
           AND (config_data->'pipeline') ? 'id'
           AND (config_data->'pipeline') ? 'name'
           AND (config_data->'startStage') ? 'id'
           AND (config_data->'startStage') ? 'name'
           AND (config_data->'endStage') ? 'id'
           AND (config_data->'endStage') ? 'name';
    END;
    $$ LANGUAGE plpgsql;
  `);
  
  // Add constraint
  await db.execute(sql`
    ALTER TABLE flow_metrics_config
      ADD CONSTRAINT check_valid_metric_config 
      CHECK (validate_metric_config_jsonb(config))
  `);
}

export async function down(db) {
  await db.execute(sql`DROP TABLE IF EXISTS flow_metrics_config CASCADE`);
  await db.execute(sql`DROP FUNCTION IF EXISTS validate_metric_config_jsonb(JSONB)`);
  
  // Recreate old tables (optional - for rollback)
  // ... old schema here
}
```

**Update Drizzle Schema:**
```typescript
// lib/database/schema.ts

// REMOVE this completely:
// export const canonicalStageMappings = ...

// UPDATE this:
export const flowMetricsConfig = pgTable('flow_metrics_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  metricKey: text('metric_key').notNull().unique(),
  displayTitle: text('display_title').notNull(),
  config: jsonb('config').notNull().default('{}'),  // JSONB column
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  metricKeyIdx: uniqueIndex('idx_fmc_metric_key').on(table.metricKey),
  isActiveIdx: index('idx_fmc_is_active').on(table.isActive),
  sortOrderIdx: index('idx_fmc_sort_order').on(table.sortOrder),
  configGinIdx: index('idx_fmc_config_gin').on(table.config),
}));
```

### Phase 2: Create Feature Module Structure

**Tasks:**
- [ ] Create `app/features/flow-metrics/` directory structure
- [ ] Move existing components from `app/components/` to feature module
- [ ] Move existing pages from `app/flow-metrics-report/` to feature module
- [ ] Create feature-specific types in `app/features/flow-metrics/types/`
- [ ] Extract metrics logic to feature-specific utils/hooks

**Key Files to Create:**
```
app/features/flow-metrics/
├── types/
│   ├── config.ts         # MetricConfigJSON, StageSelection
│   ├── metric.ts         # FlowMetric, CalculatedMetrics
│   └── index.ts          # Barrel exports
├── utils/
│   ├── validation.ts     # validateMetricConfig()
│   ├── calculations.ts   # calculateMetrics()
│   └── formatting.ts     # formatDuration()
└── hooks/
    ├── useMetrics.ts     # Hook for fetching metrics
    └── useStageSelection.ts  # Hook for stage picker
```

### Phase 3: Database Repository Layer

**Create:** `lib/database/features/flow-metrics/repository.ts`

**Pattern:** Extend BaseRepository

```typescript
// lib/database/features/flow-metrics/repository.ts

import { BaseRepositoryImpl } from '../../core/base-repository';
import { flowMetricsConfig } from '../../schema';
import type { FlowMetricsConfig, MetricConfigJSON } from './types';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../core/connection';

export class FlowMetricsRepository extends BaseRepositoryImpl<FlowMetricsConfig> {
  constructor() {
    super(flowMetricsConfig, 'flow_metrics_config');
  }

  async createWithConfig(data: {
    metricKey: string;
    displayTitle: string;
    config: MetricConfigJSON;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return this.create({
      metricKey: data.metricKey,
      displayTitle: data.displayTitle,
      config: data.config as any, // JSONB
      sortOrder: data.sortOrder || 0,
      isActive: data.isActive !== false,
    });
  }

  async getActive() {
    return this.findMany({
      where: { isActive: true },
      orderBy: ['sortOrder', 'asc'],
    });
  }

  async getByKey(metricKey: string) {
    return this.findOne({ where: { metricKey } });
  }

  async updateConfig(id: string, config: MetricConfigJSON) {
    return this.update(id, { config: config as any });
  }

  async getDealsForMetric(metricId: string, period?: string) {
    // Complex query logic here
    // ...
  }
}
```

**Tasks:**
- [ ] Create `FlowMetricsRepository` class
- [ ] Implement CRUD methods using Drizzle ORM
- [ ] Add `getDealsForMetric()` query method
- [ ] Add JSONB-specific query helpers
- [ ] Remove old functions from `lib/db.ts`

### Phase 4: TypeScript Types (Feature Module)

**Create:** `app/features/flow-metrics/types/config.ts`

```typescript
/**
 * JSONB structure for metric configuration
 */
export interface MetricConfigJSON {
  pipeline: {
    id: number;
    name: string;
  };
  startStage: {
    id: number;
    name: string;
  };
  endStage: {
    id: number;
    name: string;
  };
  thresholds: {
    minDays?: number;
    maxDays?: number;
  };
  comment?: string;
}

/**
 * Stage selection for UI
 */
export interface StageSelection {
  pipelineId: number;
  pipelineName: string;
  stageId: number;
  stageName: string;
}

/**
 * Form data for creating/editing metrics
 */
export interface MetricConfigForm {
  metricKey: string;
  displayTitle: string;
  startStage: StageSelection | null;
  endStage: StageSelection | null;
  avgMinDays?: number;
  avgMaxDays?: number;
  metricComment?: string;
  sortOrder: number;
  isActive: boolean;
}
```

**Tasks:**
- [ ] Create feature-specific types
- [ ] Update `types/features/flow-metrics.ts` for shared types
- [ ] Remove old canonical mapping types
- [ ] Add JSONB validation schemas

### Phase 5: Feature API Routes

**Restructure:** Move from `app/api/` to feature module

```
app/features/flow-metrics/api/
├── metrics/
│   └── route.ts                   # GET /api/flow-metrics/metrics
├── config/
│   ├── route.ts                   # GET/POST /api/flow-metrics/config
│   └── [id]/
│       └── route.ts               # PUT/DELETE /api/flow-metrics/config/[id]
└── [metric-id]/
    └── route.ts                   # GET /api/flow-metrics/[metric-id]
```

**Update:** Use repository pattern

```typescript
// app/features/flow-metrics/api/config/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { FlowMetricsRepository } from '../../../../../lib/database/features/flow-metrics/repository';
import { MetricConfigJSON } from '../../types/config';

const repository = new FlowMetricsRepository();

export async function GET() {
  try {
    const metrics = await repository.getActive();
    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metric_key, display_title, pipeline, start_stage, end_stage, thresholds, comment } = body;

    // Build JSONB config
    const config: MetricConfigJSON = {
      pipeline: { id: pipeline.id, name: pipeline.name },
      startStage: { id: start_stage.id, name: start_stage.name },
      endStage: { id: end_stage.id, name: end_stage.name },
      thresholds: { minDays: thresholds?.minDays, maxDays: thresholds?.maxDays },
      comment: comment || undefined
    };

    // Create metric
    const result = await repository.createWithConfig({
      metricKey: metric_key,
      displayTitle: display_title,
      config,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

**Tasks:**
- [ ] Move API routes to feature module
- [ ] Update routes to use repository pattern
- [ ] Remove old `lib/db.ts` function calls
- [ ] Add proper error handling
- [ ] Add request validation

### Phase 6: Enhanced UI Components

**PipedriveStageExplorer:**
```typescript
// app/features/flow-metrics/components/PipedriveStageExplorer.tsx

interface PipedriveStageExplorerProps {
  mode?: 'view' | 'select';
  selectionType?: 'start' | 'end';
  currentSelection?: StageSelection | null;
  onStageSelect?: (stage: StageSelection) => void;
  onCancel?: () => void;
  otherStageSelection?: StageSelection | null;
}
```

**Features:**
- [ ] Selection mode with radio buttons
- [ ] Click handlers on stages
- [ ] Visual selection indicators
- [ ] Pipeline filtering (gray out if other pipeline selected)
- [ ] Confirm/Cancel actions
- [ ] Validation warnings

**MetricsManagement:**
```typescript
// app/features/flow-metrics/components/MetricsManagement.tsx

const [formData, setFormData] = useState<MetricConfigForm>({
  metricKey: '',
  displayTitle: '',
  startStage: null,
  endStage: null,
  avgMinDays: undefined,
  avgMaxDays: undefined,
  metricComment: '',
  sortOrder: 0,
  isActive: true
});

const [stageSelectionState, setStageSelectionState] = useState<{
  isOpen: boolean;
  type: 'start' | 'end' | null;
}>({ isOpen: false, type: null });
```

**Remove:**
- [ ] Static `STAGE_OPTIONS` array
- [ ] Manual stage ID input fields
- [ ] All `canonical_stage` references

**Add:**
- [ ] Accordion-based stage selection
- [ ] Stage selection cards showing pipeline context
- [ ] Form validation for same pipeline
- [ ] JSONB-aware submission

### Phase 7: Testing Suite (test-playbook.md Compliance)

**Create:** `app/features/flow-metrics/__tests__/`

#### 7.1 Test Utilities

**File:** `test-utils.ts`
```typescript
// app/features/flow-metrics/__tests__/test-utils.ts

import { render } from '@testing-library/react';
import { MetricConfigJSON, StageSelection } from '../types/config';

// Mock API responses - NOT the fetch mechanism
export const mockApiResponses = {
  metrics: () => [buildMetric(), buildMetric()],
  pipelines: () => [buildPipeline(), buildPipeline()],
  stages: (pipelineId: number) => [buildStage(pipelineId)],
};

// Factory builders
export const buildMetric = (overrides?: Partial<FlowMetricsConfig>) => ({
  id: 'metric-123',
  metricKey: 'test-metric',
  displayTitle: 'Test Metric',
  config: {
    pipeline: { id: 5, name: 'Test Pipeline' },
    startStage: { id: 301, name: 'Start Stage' },
    endStage: { id: 303, name: 'End Stage' },
    thresholds: { minDays: 2, maxDays: 14 },
  },
  sortOrder: 0,
  isActive: true,
  ...overrides,
});

// Feature-specific render helpers
export const renderMetricsManagement = (props = {}) => {
  return render(<MetricsManagement {...props} />);
};

// NO router mocking here - use global setup from tests/setup.ts
// NO fetch mocking here - configure responses only
```

#### 7.2 Unit Tests

**File:** `validation.test.ts`
```typescript
// app/features/flow-metrics/__tests__/validation.test.ts

import { validateMetricConfig } from '../utils/validation';

describe('validateMetricConfig', () => {
  it('validates required fields', () => {
    const result = validateMetricConfig({});
    expect(result.errors).toContain('metricKey required');
  });

  it('validates same pipeline for start/end stages', () => {
    const config = {
      metricKey: 'test',
      displayTitle: 'Test',
      startStage: { pipelineId: 5, ... },
      endStage: { pipelineId: 6, ... },
    };
    const result = validateMetricConfig(config);
    expect(result.errors).toContain('start and end stages must be from same pipeline');
  });
});
```

#### 7.3 Component Tests

**File:** `MetricsManagement.test.tsx`
```typescript
// app/features/flow-metrics/__tests__/MetricsManagement.test.tsx

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderMetricsManagement, mockApiResponses } from './test-utils';

// Required pattern from test-playbook.md
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation');
  return {
    ...actual,
    useRouter: vi.fn(() => mockUseRouter),
    useSearchParams: vi.fn(() => new URLSearchParams())
  };
});

describe('MetricsManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('creates metric with selected stages', async () => {
    renderMetricsManagement();
    
    // Fill form
    await userEvent.type(screen.getByLabelText(/metric key/i), 'test-metric');
    await userEvent.type(screen.getByLabelText(/display title/i), 'Test Metric');
    
    // Select stages (using stage explorer)
    await userEvent.click(screen.getByRole('button', { name: /select start stage/i }));
    await userEvent.click(screen.getByText(/Order Received/i));
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }));
    
    // Submit
    await userEvent.click(screen.getByRole('button', { name: /create metric/i }));
    
    // Verify
    await waitFor(() => {
      expect(screen.getByText(/metric created successfully/i)).toBeInTheDocument();
    });
  });
});
```

#### 7.4 API Tests

**File:** `api.test.ts`
```typescript
// app/features/flow-metrics/__tests__/api.test.ts

import { POST } from '../api/config/route';
import { buildMetric } from './test-utils';

describe('POST /api/flow-metrics/config', () => {
  it('creates metric with valid JSONB config', async () => {
    const metricData = {
      metric_key: 'test-metric',
      display_title: 'Test Metric',
      pipeline: { id: 5, name: 'Test Pipeline' },
      start_stage: { id: 301, name: 'Start Stage' },
      end_stage: { id: 303, name: 'End Stage' },
      thresholds: { minDays: 2, maxDays: 14 },
    };
    
    const response = await POST({ json: () => metricData } as any);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.config).toMatchObject({
      pipeline: { id: 5 },
      startStage: { id: 301 },
      endStage: { id: 303 },
    });
  });

  it('validates same pipeline for start/end stages', async () => {
    const metricData = {
      metric_key: 'test-metric',
      display_title: 'Test Metric',
      pipeline: { id: 5, name: 'Test Pipeline' },
      start_stage: { id: 301, pipelineId: 5 },
      end_stage: { id: 401, pipelineId: 6 }, // Different pipeline!
    };
    
    const response = await POST({ json: () => metricData } as any);
    expect(response.status).toBe(400);
  });
});
```

#### 7.5 Integration Tests

**File:** `integration.test.ts`
```typescript
// app/features/flow-metrics/__tests__/integration.test.ts

describe('Flow Metrics Workflow', () => {
  it('completes full metric creation to calculation flow', async () => {
    // Create metric via API
    const metric = await createMetric(buildMetric());
    
    // Import some flow data
    await importFlowData(mockDealFlowData);
    
    // Calculate metrics
    const result = await calculateMetrics(metric.id, '7d');
    
    expect(result.average).toBeGreaterThan(0);
    expect(result.totalDeals).toBeGreaterThan(0);
  });
});
```

**Testing Checklist:**
- [ ] Create `test-utils.ts` with mock responses
- [ ] Add factory builders for metrics/configs
- [ ] Write unit tests for validation logic
- [ ] Write component tests for UI behavior
- [ ] Write API tests for CRUD operations
- [ ] Write integration tests for workflows
- [ ] Ensure ≥90% test coverage
- [ ] Follow test-playbook.md patterns (NO router/fetch overrides)

### Phase 8: Data Import Utilities

**Script:** `scripts/import-pipedrive-flow-data.js`
```javascript
const { FlowMetricsRepository } = require('../lib/database/features/flow-metrics/repository');
const { fetchDealFlow } = require('../lib/pipedrive');

async function importFlowData(days = 14) {
  console.log(`Importing deal flow data for last ${days} days...`);
  
  // Fetch deals from Pipedrive
  const deals = await fetchAllDealsUpdatedSince(days);
  
  for (const deal of deals) {
    const flowData = await fetchDealFlow(deal.id);
    await importDealFlowData(deal.id, flowData);
  }
  
  console.log('Import complete!');
}

// Usage: node scripts/import-pipedrive-flow-data.js 14
```

**Tasks:**
- [ ] Create import script
- [ ] Add error handling for rate limits
- [ ] Add progress logging
- [ ] Handle duplicate prevention
- [ ] Add dry-run mode

### Phase 9: Defensive Data Handling

**UI Updates:**
```typescript
// Show "No data" state gracefully
const KPICard = ({ data }: { data: FlowMetricData }) => {
  const hasData = data.totalDeals > 0;
  
  return (
    <Card>
      {hasData ? (
        <div className="text-3xl font-bold">{data.mainMetric} days</div>
      ) : (
        <>
          <div className="text-3xl font-bold text-gray-400">—</div>
          <div className="text-sm text-yellow-600">
            ⚠️ No data available
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Import deal flow data to see metrics
          </div>
        </>
      )}
    </Card>
  );
};
```

**Tasks:**
- [ ] Update KPI cards for "no data" state
- [ ] Add data status indicator on main page
- [ ] Create admin import UI
- [ ] Add last import timestamp display

## 📝 Commit Strategy

**Branch:** `feature/flow-metrics-module`

**Commits:**
1. `feat(flow-metrics): Add Drizzle migration for JSONB config`
2. `feat(flow-metrics): Create feature module structure`
3. `feat(flow-metrics): Add repository layer with Drizzle ORM`
4. `feat(flow-metrics): Implement API routes in feature module`
5. `feat(flow-metrics): Enhance stage explorer with selection mode`
6. `feat(flow-metrics): Redesign metrics management UI`
7. `test(flow-metrics): Add comprehensive test suite`
8. `feat(flow-metrics): Add data import utilities`
9. `docs(flow-metrics): Update documentation`

## 🚀 Deployment Plan

1. **Local Development:**
   - [ ] Create feature branch
   - [ ] Run Drizzle migration: `npm run db:migrate`
   - [ ] Start dev server: `npm run dev`
   - [ ] Test metric creation via UI

2. **Testing:**
   - [ ] Run unit tests: `npm test features/flow-metrics`
   - [ ] Run integration tests: `npm test:integration`
   - [ ] Run linter: `npm run lint`
   - [ ] Fix all errors

3. **Data Import:**
   - [ ] Import last 14 days: `node scripts/import-pipedrive-flow-data.js 14`
   - [ ] Verify data in database
   - [ ] Test metrics calculations

4. **Configuration:**
   - [ ] Create all 9 metrics via UI
   - [ ] Verify metrics display correctly
   - [ ] Test period filtering (7d/14d/1m/3m)

5. **Deployment:**
   - [ ] Commit to feature branch
   - [ ] Push to remote
   - [ ] Wait for user approval
   - [ ] Merge to main (requires approval per project_config.md)

## 📚 Key Files Reference

### Database Layer
- `lib/database/features/flow-metrics/migrations/0002_flow_metrics_jsonb.ts` - Drizzle migration
- `lib/database/features/flow-metrics/repository.ts` - Repository class
- `lib/database/features/flow-metrics/types.ts` - Database types
- `lib/database/schema.ts` - Updated schema definition

### Feature Module
- `app/features/flow-metrics/types/` - Feature types
- `app/features/flow-metrics/components/` - UI components
- `app/features/flow-metrics/api/` - API routes
- `app/features/flow-metrics/hooks/` - React hooks
- `app/features/flow-metrics/utils/` - Utilities
- `app/features/flow-metrics/__tests__/` - Test suite

### Scripts
- `scripts/import-pipedrive-flow-data.js` - Data import utility

### Documentation
- `specs/architecture-modularization-plan.md` - Architecture reference
- `specs/test-playbook.md` - Testing patterns

## ⚠️ Important Notes

1. **Feature Module:** All code lives in `app/features/flow-metrics/` (no scattered files)
2. **Drizzle ORM:** Use Drizzle migrations, NOT raw SQL files
3. **Repository Pattern:** Use `FlowMetricsRepository` class, NOT direct `lib/db.ts` functions
4. **Testing:** Follow test-playbook.md patterns (NO router/fetch overrides in feature tests)
5. **Clean Slate:** Old metrics and `canonical_stage_mappings` will be deleted
6. **JSONB Pattern:** Follow `requests.line_items` pattern for consistency
7. **Accordion UI:** Inline stage selection, not modals
8. **Pipeline Validation:** Enforce same pipeline for start/end stages

## ✅ Success Criteria

- [ ] Feature module structure matches architecture-modularization-plan.md
- [ ] Database uses Drizzle ORM migrations
- [ ] Repository pattern implemented correctly
- [ ] Test suite follows test-playbook.md patterns
- [ ] Test coverage ≥90% for feature module
- [ ] User can create all 9 metrics without typing stage IDs
- [ ] Pipedrive Stage Explorer shows all current pipelines/stages
- [ ] Visual selection interface guides stage picking
- [ ] System validates pipeline consistency automatically
- [ ] Metrics calculate correctly using JSONB config
- [ ] "No data" state displays gracefully
- [ ] All tests pass
- [ ] Linter passes with no errors
- [ ] Documentation updated

## 🎯 Architecture Compliance Checklist

### Phase 2.2: Flow Metrics Module (from architecture-modularization-plan.md)
- [ ] Create `app/features/flow-metrics/` directory
- [ ] Extract metrics-specific components
- [ ] Extract metrics-specific API routes
- [ ] Extract metrics-specific types, hooks, and utils
- [ ] Create database repository for metrics
- [ ] Migrate existing metrics functionality
- [ ] Update tests for flow metrics module
- [ ] Add integration tests for metrics calculations
- [ ] Document flow metrics module structure

### Test Playbook Compliance (from test-playbook.md)
- [ ] Feature has own `__tests__/` directory
- [ ] `test-utils.ts` created with mock configuration
- [ ] Factory builders for metrics/configs
- [ ] NO router mocking in feature tests (use global setup)
- [ ] NO fetch mocking in feature tests (configure responses)
- [ ] Unit tests for pure functions (≥90% coverage)
- [ ] Component tests for UI behavior (≥85% coverage)
- [ ] API tests for route handlers (test database)
- [ ] Integration tests for complete workflows (≥75% coverage)
- [ ] All tests follow strict isolation protocol

---

**Status:** Planning complete, aligned with project architecture  
**Last Updated:** 2025-09-30  
**Next Step:** Create feature branch `feature/flow-metrics-module` and start Phase 1