# Sales Helper App

A Next.js application for managing sales contacts, line items, check-ins, and flow efficiency metrics using Neon Postgres and Upstash Redis.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp env.example .env.local
   ```
   
   Then edit `.env.local` with your actual values:
   - Neon Postgres DATABASE_URL
   - Upstash Redis REDIS_URL
   - Pipedrive API token

3. **Run development server:**
   ```bash
   npm run dev
   ```

## Environment Variables

- `APP_ENV` - Environment ('development' or 'production')
- `DATABASE_URL` - Neon Postgres connection string
- `REDIS_URL` - Upstash Redis connection string
- `PIPEDRIVE_API_TOKEN` - Pipedrive API token
- `PIPEDRIVE_BASE_URL` - Pipedrive API base URL
- `PIPEDRIVE_SUBMIT_MODE` - 'mock' or 'live' (defaults to 'mock')
- `SLACK_BOT_TOKEN` - Optional Slack bot token for alerts
- `SLACK_CHANNEL` - Slack channel for notifications (defaults to '#out-of-office')

## Environment-Based Behavior

The app uses different strategies for local development vs production to prevent test data from affecting production users:

### **Pipedrive Submissions**
- **Control**: `PIPEDRIVE_SUBMIT_MODE` environment variable
- **Development**: `PIPEDRIVE_SUBMIT_MODE=mock` → Saves to `mock_pipedrive_submissions` table
- **Production**: `PIPEDRIVE_SUBMIT_MODE=live` → Submits to actual Pipedrive API
- **No environment variable changes needed** - uses existing configuration

### **Slack Notifications**
- **Control**: `NODE_ENV` environment variable
- **Development**: `NODE_ENV=development` → Posts to `#sales-helper-test` channel
- **Production**: `NODE_ENV=production` → Posts to `SLACK_CHANNEL` (defaults to '#out-of-office')
- **No environment variable changes needed** - automatic based on deployment environment

### **Database Tables (Requests & Site Visits)**
- **Control**: `NODE_ENV` environment variable
- **Development**: `NODE_ENV=development` → Uses `mock_requests` and `mock_site_visits` tables
- **Production**: `NODE_ENV=production` → Uses `requests` and `site_visits` tables
- **No environment variable changes needed** - automatic based on deployment environment

### **Contacts & Line Items**
- **Read-only reference tables** - No environment-based switching
- **Shared between environments** - Used for product catalog and contact lookup

## QR-ID Generation Pattern

The app uses a **client-side localStorage approach** for QR-ID generation to ensure resilience in poor network conditions, with server-side validation to catch duplicates.

### **Design Philosophy**
- **Offline-First**: QR-IDs can be generated even with poor WiFi coverage
- **Resilient**: Works without server connectivity during ID generation
- **Safe**: Server-side validation prevents duplicate IDs
- **Environment-Aware**: Separate counters for development vs production

### **How It Works**

#### **Client-Side Generation (`lib/client-qr-generator.ts`)**
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

#### **Server-Side Validation**
- **Database Constraint**: `request_id` field has a unique constraint
- **Duplicate Detection**: If a duplicate ID is submitted, the database throws an error
- **Fallback**: If localStorage fails, timestamp-based fallback IDs are generated
- **Environment Separation**: Development and production use separate localStorage counters

#### **Usage Pattern**
1. **Main Page**: Uses client-side generation for immediate feedback
2. **Non-Main Pages**: Also uses client-side generation for consistency
3. **API Endpoint**: Accepts client-generated IDs and validates against database
4. **Error Handling**: Server returns clear error if duplicate ID is detected

### **Benefits**
- ✅ **Works offline** - No server dependency for ID generation
- ✅ **Fast response** - No network round-trip for ID generation
- ✅ **Resilient** - Handles poor network conditions gracefully
- ✅ **Safe** - Server validation prevents duplicates
- ✅ **Environment-aware** - Separate counters prevent conflicts
- ✅ **Consistent** - Same approach across all pages

### **Error Scenarios**
- **Duplicate ID**: Server returns 500 error, user can retry
- **localStorage failure**: Falls back to timestamp-based IDs
- **Network failure**: Client can still generate IDs, server validates when connection restored

## Database Schema

### **Core Tables**
- `requests` - Main requests table with JSONB contact and line_items
- `mock_requests` - Development requests table (identical structure)
- `site_visits` - Site visit check-ins for Slack notifications
- `mock_site_visits` - Development site visits table (identical structure)
- `mock_pipedrive_submissions` - Testing support table for Pipedrive submissions

### **Flow Metrics Tables** (New)
The Flow Metrics Report system uses a unified data model for managing sales efficiency metrics and their stage mappings:

#### **`flow_metrics_config` Table**
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

#### **Enhanced `canonical_stage_mappings` Table**
```sql
-- Added to existing table:
metric_config_id UUID REFERENCES flow_metrics_config(id),
start_stage VARCHAR(100),
end_stage VARCHAR(100),
UNIQUE(metric_config_id) -- One mapping per metric
```

### **Data Relationships**
- **One-to-One**: Each `flow_metrics_config` record has exactly one `canonical_stage_mappings` record
- **Flexible Stages**: Start/end stages can be customized per metric
- **Active Management**: Metrics can be enabled/disabled without deletion
- **Ordered Display**: Sort order controls display sequence on main page

## Flow Metrics Report System

### **Overview**
The Flow Metrics Report provides comprehensive sales efficiency tracking with dynamic metric management. It replaces the previous hardcoded approach with a database-driven system that allows full CRUD operations on metrics and their stage mappings.

### **Key Features**
- **Dynamic Metrics**: Metrics are loaded from database instead of hardcoded values
- **Full CRUD Operations**: Create, read, update, and delete metrics and mappings
- **Unified Management**: Single interface for managing both metrics and their stage mappings
- **Real-time Updates**: Changes in mappings immediately reflect on the main report page
- **Flexible Configuration**: Support for custom start/end stages per metric

### **UI Components**

#### **Main Report Page** (`/flow-metrics-report`)
- **Dynamic Loading**: Fetches active metrics from `/api/admin/flow-metrics-config`
- **KPI Cards**: Displays metrics with main value, best/worst performance, and trends
- **Loading States**: Shows "Loading metrics..." during data fetch
- **Empty States**: Handles scenarios with no configured metrics

#### **Metrics Management Tab**
- **Table View**: Lists all metrics with their configuration details
- **Inline Editing**: Edit metric properties directly in the table
- **Add/Delete**: Full CRUD operations with confirmation dialogs
- **Validation**: Client-side validation for required fields and format requirements

### **API Endpoints**

#### **Flow Metrics Configuration**
```typescript
// Get all metrics
GET /api/admin/flow-metrics-config
Response: { success: boolean, data: FlowMetricConfig[] }

// Create new metric
POST /api/admin/flow-metrics-config
Body: { metric_key: string, display_title: string, canonical_stage: string, start_stage?: string, end_stage?: string }
Response: { success: boolean, data: FlowMetricConfig }

// Update metric
PATCH /api/admin/flow-metrics-config/[id]
Body: { display_title?: string, canonical_stage?: string, start_stage?: string, end_stage?: string, is_active?: boolean }
Response: { success: boolean, data: FlowMetricConfig }

// Delete metric
DELETE /api/admin/flow-metrics-config/[id]
Response: { success: boolean }

// Reorder metrics
POST /api/admin/flow-metrics-config/reorder
Body: { reorderData: Array<{id: string, sort_order: number}> }
Response: { success: boolean }
```

### **Technical Architecture**

#### **Data Flow**
1. **Main Page Load**: `useEffect` fetches active metrics from API
2. **Data Transformation**: API response converted to `FlowMetricData` format for UI
3. **Dynamic Rendering**: KPI cards rendered based on fetched data
4. **Real-time Updates**: Changes in mappings tab immediately reflect on main page

#### **Database Functions** (`lib/db.ts`)
```typescript
// Core functions for flow metrics management
getFlowMetricsConfig(): Promise<FlowMetricConfig[]>
getActiveFlowMetricsConfig(): Promise<FlowMetricConfig[]>
getFlowMetricConfig(metricKey: string): Promise<FlowMetricConfig | null>
createFlowMetricConfig(data: CreateFlowMetricData): Promise<FlowMetricConfig>
updateFlowMetricConfig(id: string, data: UpdateFlowMetricData): Promise<FlowMetricConfig>
deleteFlowMetricConfig(id: string): Promise<void>
reorderFlowMetrics(reorderData: ReorderData[]): Promise<void>
```

#### **Validation Rules**
- **Metric Key**: Must be kebab-case format (e.g., 'lead-conversion-time')
- **Display Title**: Required, max 100 characters
- **Canonical Stage**: Must be one of predefined stages (LEAD, QUOTE, ORDER, etc.)
- **Unique Constraints**: Metric key must be unique across all metrics
- **Foreign Key**: Each metric must have exactly one stage mapping

### **Future Maintenance and Changes**

#### **Adding New Metrics**
1. **Database**: Insert new record in `flow_metrics_config`
2. **Mapping**: Create corresponding record in `canonical_stage_mappings`
3. **UI**: Automatically appears on main page and in management tab
4. **No Code Changes**: New metrics appear without UI modifications

#### **Modifying Stage Mappings**
1. **Update Mapping**: Modify `start_stage` or `end_stage` in `canonical_stage_mappings`
2. **Immediate Effect**: Changes reflect on main page without restart
3. **Validation**: API validates stage names against available options

#### **Customizing Display**
1. **Sort Order**: Modify `sort_order` to change display sequence
2. **Active Status**: Set `is_active = false` to hide metrics without deletion
3. **Display Title**: Update `display_title` for UI changes

#### **Extending the System**
- **New Metric Types**: Add new `metric_type` field for categorization
- **Advanced Calculations**: Extend with custom calculation functions
- **Historical Tracking**: Add audit trail for metric changes
- **Performance Optimization**: Add caching layer for frequently accessed metrics

#### **Migration Strategy**
- **Backward Compatibility**: Existing hardcoded metrics preserved in database
- **Gradual Migration**: Old and new systems can coexist during transition
- **Data Integrity**: Foreign key constraints ensure data consistency
- **Rollback Support**: Previous system can be restored if needed

## Development

- `npm run dev` - Start development server with environment check and migrations
- `npm run build` - Build for production with environment check and migrations
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run database migrations
- `npm run env:check` - Validate environment configuration

## Deployment Workflow

### Feature Development
1. Create feature branch: `git checkout -b feature/descriptive-name`
2. Make changes and test locally
3. Commit to feature branch (git hooks will prevent main branch commits)
4. Push to GitHub: `git push origin feature/your-branch`
5. Create pull request for review
6. Merge to main only after approval

### Production Deployment
- Only merged pull requests trigger production deployment
- Vercel automatically deploys from main branch
- All changes must go through feature branch → pull request → merge workflow

### Preview Deployments (Disabled)
- Preview deployments have been disabled due to persistent Vercel infrastructure issues
- All testing should be done locally or via production deployment
- Git integration has been disconnected to prevent automatic preview deployments

#### Preview Deployment Configuration
The following configuration has been implemented to prevent preview deployments:

**`vercel.json` Configuration:**
```json
{
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "ignoreCommand": "echo 'Preview deployments disabled' && exit 1"
}
```

**`.vercelignore` File:**
- Ignores feature branch specific files
- Prevents test and development files from triggering deployments
- Excludes documentation that shouldn't trigger deployments

**Environment Variables:**
- `VERCEL_DISABLE_PREVIEW_DEPLOYMENTS=true` - Set for both Production and Development environments

#### Why This Was Necessary
- **Persistent Build Failures**: Preview deployments were consistently failing with "Unexpected Error" messages
- **Resource Waste**: Failed builds were consuming Vercel resources and build minutes
- **Development Blockers**: Failed previews were preventing proper testing workflow
- **Infrastructure Issues**: Vercel's preview deployment system had unrecoverable issues for this project

#### Impact
- ✅ **Feature branches**: No longer trigger automatic preview deployments
- ✅ **Main branch**: Continues to trigger production deployments normally
- ✅ **Manual deployments**: Can still be triggered with `vercel --prod` when needed
- ✅ **Local development**: Unaffected - `npm run dev` continues to work normally

## Emergency Override (Use with extreme caution)
If you absolutely need to bypass the git hooks (emergency only):
```bash
git commit --no-verify  # Skip pre-commit hook
git push --no-verify    # Skip pre-push hook
```

**⚠️ Warning**: Only use these commands in true emergencies. The hooks exist to protect production.
