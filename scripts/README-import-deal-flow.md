# Deal Flow Data Import Script

This is a **temporary script** to import deal flow data from Pipedrive for the Flow Metrics Report. The script will be discarded after the import is complete.

## Overview

The script imports flow data for 746 deals from the `specs/import-id-list` file, fetching stage transition history from Pipedrive's `/deals/{id}/flow` endpoint.

## Files

- `scripts/import-deal-flow-data.js` - Main import script (requires environment variables)
- `scripts/test-import-80-deals.js` - Test script for 80 deals validation
- `scripts/test-import-script.js` - Test version (no environment variables needed)
- `scripts/README-import-deal-flow.md` - This documentation

## Prerequisites

1. **Environment Variables** (set in `.env.local` or export in terminal):
   ```bash
   export PIPEDRIVE_API_TOKEN="your_pipedrive_api_token"
   export DATABASE_URL="your_neon_database_url"
   ```

2. **Pipedrive API Token** with permissions to:
   - Read deal flow data (`GET /deals/{id}/flow`)
   - Access to all deals in the list

## Rate Limiting

The script respects Pipedrive's rate limits:
- **40 requests per 2 seconds** per API token
- **10,000 POST/PUT requests per day** per token
- Batches requests in groups of 40
- Waits 2 seconds between batches

## Error Handling

- **Skip failed deals** and continue processing
- **Retry failed deals once** at the end
- **Give up after 2nd attempt**
- Logs all failures for review

## Usage

### Test the Script (Recommended First Step)

```bash
# Test with first 10 deals (no environment variables needed)
node scripts/test-import-script.js
```

### Test Run with 80 Deals (Validation)

```bash
# Set environment variables
export PIPEDRIVE_API_TOKEN="your_token_here"
export DATABASE_URL="your_database_url_here"

# Run the 80-deal test
node scripts/test-import-80-deals.js
```

### Run the Full Import

```bash
# Set environment variables
export PIPEDRIVE_API_TOKEN="your_token_here"
export DATABASE_URL="your_database_url_here"

# Run the full import
node scripts/import-deal-flow-data.js
```

## Expected Performance

- **Test run**: 80 deals in 2 batches (40 each)
- **Full import**: 746 deals in 19 batches (40 deals per batch)
- **Estimated time**: 8-10 minutes for test, 45-60 minutes for full import
- **Rate**: ~20 deals/second (with rate limiting)

## Output

The script provides:
- **Real-time progress**: Batch processing updates
- **Heartbeat indicator**: Every 100 deals (20 for test run)
- **Final summary**: Success/failure counts and timing
- **Failed deals list**: Details of any failures

## Example Output

```
🚀 Starting deal flow data import...
📋 Loaded 746 deal IDs from specs/import-id-list
✅ Environment variables validated
🔄 Processing 746 deals in 19 batches of 40
📦 Processing batch 1/19 (40 deals)
✅ Deal 23: 5 events processed
✅ Deal 29: 3 events processed
❌ Deal 31: No flow data found
...
💓 Heartbeat: 100/746 deals processed (19.8 deals/sec)
⏳ Rate limiting: waiting 2000ms before next batch...

📊 IMPORT SUMMARY
==================
Total deals: 746
Successful: 712
Failed: 34
Success rate: 95.4%
Total time: 1847.2 seconds
Average rate: 0.4 deals/second
```

## Database Schema

The script inserts data into:
- `pipedrive_deal_flow_data` - Stage transition events
- `pipedrive_metric_data` - Deal metadata

## Cleanup

After successful import:
1. Verify data in the Flow Metrics Report
2. Delete the temporary branch: `git checkout main && git branch -D temp/import-deal-flow-data`
3. Remove the script files

## Troubleshooting

### Common Issues

1. **"PIPEDRIVE_API_TOKEN environment variable is required"**
   - Set the environment variable before running the script

2. **"DATABASE_URL environment variable is required"**
   - Set the database connection string

3. **High failure rate**
   - Check Pipedrive API token permissions
   - Verify deals exist in Pipedrive
   - Check network connectivity

4. **Rate limit errors**
   - The script should handle this automatically
   - If persistent, increase `RATE_LIMIT_DELAY_MS`

5. **Database insertion errors**
   - Check database connectivity
   - Verify table schema matches expectations
   - Check for duplicate constraint violations

### Monitoring

- Watch the heartbeat indicators to ensure the script is running
- Monitor the success rate in the final summary
- Check failed deals list for patterns

## Safety Notes

- This is a **read-only operation** for Pipedrive (no data modification)
- The script includes duplicate prevention via `pipedrive_event_id`
- Safe to run multiple times (will skip existing records)
- No impact on production data or user workflows

## Recent Fixes

### Metadata Insertion Bug (FIXED)
**Issue**: The script was failing to insert deal metadata due to `firstEvent.deal_id` being undefined.

**Fix Applied**: Changed the metadata insertion to use the `dealId` parameter instead of `firstEvent.deal_id`.

**Before (BROKEN)**:
```javascript
const dealMetadata = {
  id: firstEvent.deal_id,  // This was undefined!
};
```

**After (FIXED)**:
```javascript
const dealMetadata = {
  id: dealId,  // Use the dealId parameter we already have
  title: `Deal ${dealId}`,
  pipeline_id: 1,
  stage_id: 1,
  status: 'active'
};
```

### Database Insertion (IMPLEMENTED)
**Issue**: The script was only logging data instead of actually inserting into the database.

**Fix Applied**: Implemented actual database insertion using the existing `lib/db.ts` functions:
- `insertDealFlowData()` for flow data
- `insertDealMetadata()` for deal metadata

### File Path Update
**Issue**: Script was looking for `deal-id.md` which was renamed to `import-id-list`.

**Fix Applied**: Updated file path to use `specs/import-id-list`.

## Test Strategy

### 80-Deal Test Run
1. **Purpose**: Validate the import process with a subset before full import
2. **Configuration**: First 80 deals from `import-id-list` (2 batches of 40)
3. **Success Criteria**: 100% success rate with zero errors
4. **Next Steps**: Only proceed with full import if test run passes

### Full Import
1. **Purpose**: Import all 746 deals from `import-id-list`
2. **Configuration**: All deals in batches of 40
3. **Success Criteria**: High success rate (>95%) with detailed error reporting
4. **Monitoring**: Real-time progress tracking and comprehensive logging
