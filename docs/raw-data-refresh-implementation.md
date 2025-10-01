# Raw Data Tab Refresh Implementation

## Overview
Implemented manual sync trigger for the Raw Data tab in the Flow Metrics section, allowing users to refresh Pipedrive deal flow data on-demand in development environment.

## Changes Made

### 1. New Component: DataRefreshButton
**File**: `app/features/flow-metrics/components/DataRefreshButton.tsx`

**Features**:
- Replaces the old "Fetch" button and deal ID input
- Triggers manual sync via `/api/admin/trigger-sync` endpoint
- Shows real-time sync status with polling
- Displays last sync time with human-readable format
- Auto-refreshes data during sync operation
- Prevents multiple concurrent syncs

**UI States**:
- **Idle**: Shows "Refresh Data" button with last sync time
- **Syncing**: Shows "Syncing..." with loading spinner
- **Complete**: Shows success toast and updates data

### 2. Enhanced useFlowData Hook
**File**: `app/features/flow-metrics/hooks/useFlowData.ts`

**New Features**:
- `startAutoRefresh()` - Starts polling data every 5 seconds during sync
- `stopAutoRefresh()` - Stops auto-refresh when sync completes
- Automatic cleanup on component unmount

**Usage Pattern**:
```typescript
const { 
  data, 
  loading, 
  refresh,
  startAutoRefresh,
  stopAutoRefresh
} = useFlowData();

// Start auto-refresh during sync
startAutoRefresh();

// Stop when sync completes
stopAutoRefresh();
```

### 3. Updated Main Page
**File**: `app/features/flow-metrics/pages/page.tsx`

**Changes**:
- Replaced `DealInputForm` with `DataRefreshButton`
- Added sync lifecycle handlers:
  - `handleSyncStart()` - Starts auto-refresh
  - `handleSyncComplete()` - Stops auto-refresh and does final refresh
  - `handleDataUpdate()` - Immediate refresh when sync starts

### 4. Updated FlowDataTable
**File**: `app/features/flow-metrics/components/FlowDataTable.tsx`

**Changes**:
- Updated empty state message to guide users to click "Refresh Data"
- Fixed ESLint quote escaping issues

### 5. Updated Components Index
**File**: `app/features/flow-metrics/components/index.ts`

**Changes**:
- Added export for `DataRefreshButton`

### 6. ESLint Configuration
**File**: `.eslintrc.json`

**Changes**:
- Added `lib/database/connection-standard.js` to ESLint overrides
- Allows direct `neon()` import in connection-standard files only

## API Endpoints Used

### `/api/admin/trigger-sync` (POST)
**Purpose**: Triggers manual sync of Pipedrive deal flow data

**Request Body**:
```json
{
  "mode": "incremental",
  "daysBack": 7,
  "batchSize": 20,
  "async": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "incremental sync started in background",
  "parameters": {
    "mode": "incremental",
    "daysBack": 7,
    "batchSize": 20
  }
}
```

### `/api/admin/trigger-sync` (GET)
**Purpose**: Get current sync status and options

**Response**:
```json
{
  "success": true,
  "data": {
    "currentStatus": {
      "isRunning": false,
      "lastSync": "2025-10-01T13:00:00.000Z",
      "hoursSinceLastSync": 2
    },
    "options": { ... },
    "recommendations": { ... },
    "dataStats": { ... }
  }
}
```

### `/api/pipedrive/deal-flow-data` (GET)
**Purpose**: Fetch stored deal flow data from database

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "deal_id": 12345,
      "deal_title": "Example Deal",
      "pipeline_id": 16,
      "stage_id": 98,
      "stage_name": "In Progress",
      "entered_at": "2025-10-01T10:00:00.000Z",
      ...
    }
  ]
}
```

## User Flow

1. **Navigate to Raw Data Tab**
   - User clicks "Raw Data" view toggle
   - Page shows "Refresh Data" button and current data (if any)

2. **Click Refresh Data**
   - Button shows "Syncing..." with loading spinner
   - Toast notification: "Sync Started"
   - Data table starts auto-refreshing every 5 seconds

3. **Sync in Progress**
   - Status indicator shows "Sync in progress..."
   - Data table updates automatically as new data arrives
   - User can see data streaming in real-time

4. **Sync Complete**
   - Button returns to "Refresh Data" state
   - Toast notification: "Sync Complete"
   - Status shows "Last synced: X mins ago"
   - Final data refresh performed

## Technical Details

### Sync Engine
- Uses `DealFlowSyncEngine` from `app/api/cron/shared/sync-engine.ts`
- Processes deals in batches with rate limiting (40 requests per 2 seconds)
- Stores sync status in `deal_flow_sync_status` table
- Stores deal flow data in `pipedrive_deal_flow_data` table

### Polling Strategy
- **Sync Status**: Polls every 3 seconds to check if sync is still running
- **Data Refresh**: Polls every 5 seconds to fetch updated data
- **Auto-cleanup**: Stops polling when sync completes or component unmounts

### Data Flow
```
User Click → POST /api/admin/trigger-sync
           → DealFlowSyncEngine.syncDealFlow()
           → Batch process deals from Pipedrive
           → Store in pipedrive_deal_flow_data table
           
UI Polling → GET /api/admin/trigger-sync (status)
          → GET /api/pipedrive/deal-flow-data (data)
          → Update FlowDataTable
```

## Success Criteria

✅ **Criterion 1**: Can click the refresh button
- Button is visible and clickable in Raw Data tab
- Triggers sync operation successfully

✅ **Criterion 2**: Can see raw data coming in from Pipedrive
- Data fetched using new Pipedrive integration
- Uses same logic as cron job (DealFlowSyncEngine)
- Runs asynchronously in background

✅ **Criterion 3**: Page refreshes to show data streaming in
- Auto-refresh every 5 seconds during sync
- FlowDataTable updates with new data
- Pagination handles 1000+ rows (50 initial, "Show All" button)
- Data ready for flow metrics calculations

## Testing

### Manual Testing Steps
1. Navigate to http://localhost:3003/flow-metrics-report
2. Click "Raw Data" tab
3. Click "Refresh Data" button
4. Verify:
   - Toast shows "Sync Started"
   - Button shows "Syncing..." state
   - Status shows "Sync in progress..."
   - Data table updates automatically
   - Toast shows "Sync Complete" when done
   - Status shows "Last synced: X mins ago"

### Edge Cases Handled
- **Concurrent Syncs**: Prevents starting new sync if one is already running
- **Component Unmount**: Cleans up polling intervals
- **Network Errors**: Shows error toast with details
- **Empty Data**: Shows helpful message to click "Refresh Data"

## Future Enhancements

### Potential Improvements
1. **Progress Indicator**: Show processed/total deals during sync
2. **Sync History**: Display recent sync operations with results
3. **Custom Parameters**: Allow user to configure daysBack and batchSize
4. **Incremental vs Full**: Toggle between sync modes
5. **Real-time Updates**: Use WebSockets instead of polling
6. **Sync Scheduling**: Allow users to schedule automatic syncs

### Performance Optimizations
1. **Debouncing**: Prevent rapid successive sync triggers
2. **Caching**: Cache sync status to reduce API calls
3. **Lazy Loading**: Load data in chunks for better performance
4. **Virtual Scrolling**: Handle very large datasets more efficiently

## Related Files

### Core Implementation
- `app/features/flow-metrics/components/DataRefreshButton.tsx`
- `app/features/flow-metrics/hooks/useFlowData.ts`
- `app/features/flow-metrics/pages/page.tsx`
- `app/features/flow-metrics/components/FlowDataTable.tsx`

### API Endpoints
- `app/api/admin/trigger-sync/route.ts`
- `app/api/pipedrive/deal-flow-data/route.ts`

### Sync Engine
- `app/api/cron/shared/sync-engine.ts`
- `app/api/cron/sync-deal-flow/route.ts`

### Database
- `lib/database/features/flow-metrics/repository.ts`
- `lib/database/schema.ts` (pipedrive_deal_flow_data, deal_flow_sync_status)

## Commit Information

**Branch**: `feature/flow-metrics-module`

**Commit Message**:
```
feat: Add manual sync trigger for Raw Data tab

- Replace DealInputForm with DataRefreshButton component
- Add auto-refresh during sync operations
- Show real-time sync status and progress
- Poll for updates every 5 seconds during sync
- Display last sync time with human-readable format
- Prevent concurrent sync operations
- Update FlowDataTable empty state message
- Fix ESLint configuration for connection-standard.js

Success criteria met:
1. ✅ Can click refresh button to trigger sync
2. ✅ Data fetched from Pipedrive using new integration
3. ✅ Page auto-refreshes to show streaming data
```

