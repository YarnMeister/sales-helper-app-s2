# Deal Flow Data Import Script

This is a **temporary script** to import deal flow data from Pipedrive for the Flow Metrics Report. The script will be discarded after the import is complete.

## Overview

The script imports flow data for 746 deals from the `specs/import-id-list` file, fetching stage transition history from Pipedrive's `/deals/{id}/flow` endpoint.

## Files

- `scripts/import-deal-flow-data.js` - Main import script (requires environment variables)
- `scripts/test-import-80-deals.js` - Test script for 80 deals validation
- `scripts/retry-failed-deals.js` - Retry script for failed deals
- `scripts/test-import-script.js` - Test version (no environment variables needed)
- `scripts/README-import-deal-flow.md` - This documentation

## Prerequisites

1. **Environment Variables** (set in `.env.local` or export in terminal):
   ```bash
   export PIPEDRIVE_API_TOKEN="your_pipedrive_api_token"
   export DATABASE_URL="your_neon_database_url"
   ```

2. **Database Tables**: Ensure the following tables exist:
   - `pipedrive_deal_flow_data` - Stores flow data
   - `pipedrive_metric_data` - Stores deal metadata

## Usage

### 1. Test Run (Recommended First Step)
```bash
node scripts/test-import-80-deals.js
```
This imports the first 80 deals to validate the process before running the full import.

### 2. Full Import
```bash
node scripts/import-deal-flow-data.js
```
This imports all 746 deals from the `specs/import-id-list` file.

### 3. Retry Failed Deals
If some deals fail during import, you can retry them:
```bash
node scripts/retry-failed-deals.js failed-deals-import.txt
```

## Error Handling & Retry Strategy

### Automatic Retry
- Failed deals are automatically retried once during the main import
- Detailed error logging shows specific reasons for failures

### Manual Retry
- Failed deals are exported to `failed-deals-import.txt`
- Use the retry script to attempt failed deals again
- Still-failed deals are exported to `still-failed-deals.txt`

### Common Error Types
- **401 Unauthorized**: Check your Pipedrive API token
- **404 Not Found**: Deal may have been deleted from Pipedrive
- **429 Rate Limited**: Script automatically handles rate limiting
- **No flow data**: Deal has no stage transitions to import

## Rate Limiting

The script respects Pipedrive's API limits:
- **40 requests per 2 seconds** (Pipedrive limit)
- **Automatic batching** with delays between batches
- **Concurrent processing** within each batch for efficiency

## Expected Results

### Test Run (80 deals)
- **Expected success rate**: 100%
- **Execution time**: ~12-15 seconds
- **Data validation**: All flow records and metadata inserted

### Full Import (746 deals)
- **Expected success rate**: >95%
- **Execution time**: ~2-3 minutes
- **Error handling**: Failed deals logged and exported for retry

## Troubleshooting

### API Authentication Issues
```bash
# Test your API token
curl "https://api.pipedrive.com/v1/deals/23/flow?api_token=YOUR_TOKEN"
```

### Database Connection Issues
```bash
# Test database connection
node -e "require('dotenv').config(); const { sql } = require('./lib/db'); sql\`SELECT 1\`.then(() => console.log('DB OK')).catch(console.error)"
```

### Retry Process
1. Check the failed deals file: `failed-deals-import.txt`
2. Investigate error reasons in the console output
3. Run retry script: `node scripts/retry-failed-deals.js failed-deals-import.txt`
4. Check still-failed deals: `still-failed-deals.txt`

## Data Structure

### Flow Data (`pipedrive_deal_flow_data`)
- `pipedrive_event_id`: Unique Pipedrive event ID
- `deal_id`: Deal identifier
- `stage_id`: Stage identifier
- `stage_name`: Human-readable stage name
- `entered_at`: When deal entered this stage
- `left_at`: When deal left this stage (null if current)
- `duration_seconds`: Time spent in stage

### Metadata (`pipedrive_metric_data`)
- `id`: Deal identifier
- `title`: Deal title
- `pipeline_id`: Pipeline identifier
- `stage_id`: Current stage
- `status`: Deal status

## Cleanup

After successful import, you can remove these temporary files:
- `scripts/import-deal-flow-data.js`
- `scripts/test-import-80-deals.js`
- `scripts/retry-failed-deals.js`
- `scripts/README-import-deal-flow.md`
- `failed-deals-import.txt` (if any)
- `still-failed-deals.txt` (if any)
