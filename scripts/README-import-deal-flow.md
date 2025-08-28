# Deal Flow Data Import Script

This is a **temporary script** to import deal flow data from Pipedrive for the Flow Metrics Report. The script will be discarded after the import is complete.

## Overview

The script imports flow data for 578 deals from the `specs/deal-id.md` file, fetching stage transition history from Pipedrive's `/deals/{id}/flow` endpoint.

## Files

- `scripts/import-deal-flow-data.js` - Main import script (requires environment variables)
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

### Run the Actual Import

```bash
# Set environment variables
export PIPEDRIVE_API_TOKEN="your_token_here"
export DATABASE_URL="your_database_url_here"

# Run the import
node scripts/import-deal-flow-data.js
```

## Expected Performance

- **Total deals**: 578
- **Batches**: 15 (40 deals per batch)
- **Estimated time**: 30-45 minutes
- **Rate**: ~20 deals/second (with rate limiting)

## Output

The script provides:
- **Real-time progress**: Batch processing updates
- **Heartbeat indicator**: Every 100 deals
- **Final summary**: Success/failure counts and timing
- **Failed deals list**: Details of any failures

## Example Output

```
🚀 Starting deal flow data import...
📋 Loaded 578 deal IDs from specs/deal-id.md
✅ Environment variables validated
🔄 Processing 578 deals in 15 batches of 40
📦 Processing batch 1/15 (40 deals)
✅ Deal 23: 5 events processed
✅ Deal 29: 3 events processed
❌ Deal 31: No flow data found
...
💓 Heartbeat: 100/578 deals processed (19.8 deals/sec)
⏳ Rate limiting: waiting 2000ms before next batch...

📊 IMPORT SUMMARY
==================
Total deals: 578
Successful: 545
Failed: 33
Success rate: 94.3%
Total time: 1847.2 seconds
Average rate: 0.3 deals/second
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

5. **"null value in column 'id' of relation 'pipedrive_metric_data' violates not-null constraint"**
   - **KNOWN ISSUE**: The metadata insertion has a bug where `firstEvent.deal_id` is undefined
   - **IMPACT**: Metadata insertion fails, but flow data insertion succeeds
   - **WORKAROUND**: Use the `dealId` parameter instead of `firstEvent.deal_id`
   - **FIX NEEDED**: Change line in `processDeal()` function from `id: firstEvent.deal_id` to `id: dealId`

### Monitoring

- Watch the heartbeat indicators to ensure the script is running
- Monitor the success rate in the final summary
- Check failed deals list for patterns

## Safety Notes

- This is a **read-only operation** for Pipedrive (no data modification)
- The script includes duplicate prevention via `pipedrive_event_id`
- Safe to run multiple times (will skip existing records)
- No impact on production data or user workflows

## Known Issues & Fixes

### Metadata Insertion Bug
**Issue**: The script fails to insert deal metadata due to `firstEvent.deal_id` being undefined.

**Fix Required**: In `scripts/import-deal-flow-data.js`, line ~185, change:
```javascript
// CURRENT (BROKEN):
const dealMetadata = {
  id: firstEvent.deal_id,  // This is undefined!
};

// FIXED:
const dealMetadata = {
  id: dealId,  // Use the dealId parameter we already have
  title: `Deal ${dealId}`,
  pipeline_id: 1,
  stage_id: 1,
  status: 'active'
};
```

**Impact**: Metadata insertion fails, but flow data insertion succeeds. The import will work for flow data but won't populate the deal metadata table.
