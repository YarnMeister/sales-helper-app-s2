# Cursor Prompt: Fix Slack Integration and Add Submit Mode Tracking

## CRITICAL: Fix the `withPerformanceLogging` Issue First

**Problem:** The `withPerformanceLogging` function is unwrapping Response objects and returning raw JSON data instead of preserving the Response object. This breaks all API route tests.

**Fix Required:** Modify `lib/log.ts` to detect and preserve Response objects:

```typescript
export const withPerformanceLogging = async <T>(
  operation: string,
  context: string,
  fn: () => Promise<T>,
  meta?: Omit<LogMetadata, 'duration' | 'operation' | 'context'>
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    // Preserve Response objects for API routes
    if (result instanceof Response) {
      log(operation, { 
        duration, 
        context, 
        status: result.status,
        success: true, 
        ...meta 
      });
      return result;
    }
    
    // Handle other return types normally
    log(operation, { duration, context, success: true, ...meta });
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    log(operation, { 
      duration, 
      context, 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      ...meta 
    });
    throw error;
  }
};
```

## Task 1: Add Submit Mode Column to site_visits Table

**Create migration file:** `supabase/migrations/[timestamp]_add_submit_mode_to_site_visits.sql`

```sql
-- Add submit_mode column to site_visits table
ALTER TABLE site_visits 
ADD COLUMN submit_mode TEXT DEFAULT 'live' 
CHECK (submit_mode IN ('mock', 'live'));

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_site_visits_submit_mode 
ON site_visits(submit_mode);

-- Update existing records to 'live' (production default)
UPDATE site_visits 
SET submit_mode = 'live' 
WHERE submit_mode IS NULL;
```

## Task 2: Update Environment Variables

**Add to `.env.example` and ensure proper resolution:**

```bash
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_CHANNEL_LIVE=#sales-checkins
SLACK_CHANNEL_MOCK=#sales-checkins-test

# Submit Mode (determines channel selection)
NEXT_PUBLIC_SUBMIT_MODE=mock
```

**Fix environment resolution in `lib/env.ts`:**

```typescript
const EnvSchema = z.object({
  // ... existing vars
  SLACK_BOT_TOKEN: z.string().optional(),
  SLACK_CHANNEL_LIVE: z.string().default('#sales-checkins'),
  SLACK_CHANNEL_MOCK: z.string().default('#sales-checkins-test'),
  NEXT_PUBLIC_SUBMIT_MODE: z.enum(['mock', 'live']).default('mock'),
});
```

## Task 3: Update Schema Validation

**Modify `lib/schema.ts` to include submit_mode:**

```typescript
export const SiteVisitUpsert = z.object({
  salesperson: z.string().min(1),
  planned_mines: z.array(z.string().min(1)).min(1),
  main_purpose: z.string().min(1),
  availability: z.string().min(1),
  comments: z.string().optional(),
  submit_mode: z.enum(['mock', 'live']).default('live'), // Add this field
});

export const CheckInNotificationSchema = z.object({
  salesperson: z.string().min(1),
  planned_mines: z.array(z.string().min(1)).min(1),
  main_purpose: z.string().min(1),
  availability: z.string().min(1),
  comments: z.string().optional(),
  submit_mode: z.enum(['mock', 'live']).default('live'), // Add this field
});
```

## Task 4: Update Site Visits API

**Modify `app/api/site-visits/route.ts` to capture submit_mode:**

```typescript
export async function POST(request: NextRequest) {
  return withPerformanceLogging('POST /api/site-visits', 'api', async () => {
    const body = await request.json();
    const validatedData = SiteVisitUpsert.parse(body);
    
    // Get submit_mode from environment or request
    const submitMode = process.env.NODE_ENV === 'production' 
      ? 'live' 
      : (validatedData.submit_mode || process.env.NEXT_PUBLIC_SUBMIT_MODE || 'live');
    
    const db = getDb();
    const { data, error } = await db
      .from('site_visits')
      .insert({
        salesperson: validatedData.salesperson,
        planned_mines: validatedData.planned_mines,
        main_purpose: validatedData.main_purpose,
        availability: validatedData.availability,
        comments: validatedData.comments || null,
        submit_mode: submitMode, // Store the resolved mode
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      log('Error creating site visit', { error });
      throw error;
    }
    
    return Response.json({ ok: true, data });
  });
}
```

## Task 5: Fix Slack Channel Resolution

**Update `app/api/slack/notify-checkin/route.ts` to properly resolve channels:**

```typescript
export async function POST(req: NextRequest) {
  return withPerformanceLogging('POST /api/slack/notify-checkin', 'api', async () => {
    // Validate environment
    if (!env.SLACK_BOT_TOKEN) {
      return Response.json({
        ok: false,
        error: 'Slack integration not configured'
      }, { status: 503 });
    }
    
    const body = await req.json();
    const validatedData = CheckInNotificationSchema.parse(body);
    
    // Resolve submit mode from multiple sources
    const submitMode = process.env.NODE_ENV === 'production' 
      ? 'live'
      : (validatedData.submit_mode || process.env.NEXT_PUBLIC_SUBMIT_MODE || 'live');
    
    // CRITICAL FIX: Properly resolve channel at runtime
    const targetChannel = submitMode === 'mock' 
      ? (env.SLACK_CHANNEL_MOCK || '#sales-checkins-test')
      : (env.SLACK_CHANNEL_LIVE || '#sales-checkins');
    
    // Format message with mode indicator
    const messageText = formatCheckInMessage({
      ...validatedData,
      submit_mode: submitMode
    });
    
    // Send to Slack
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: targetChannel,
        text: messageText,
        unfurl_links: false,
        unfurl_media: false
      })
    });
    
    const result = await response.json();
    
    if (!result.ok) {
      log('Slack API error', { error: result.error, channel: targetChannel });
      return Response.json({
        ok: false,
        error: `Slack API error: ${result.error}`,
        channel: targetChannel
      }, { status: 500 });
    }
    
    return Response.json({ 
      ok: true, 
      channel: targetChannel,
      mode: submitMode,
      timestamp: result.ts 
    });
  });
}
```

## Task 6: Update Frontend Check-in Page

**Modify `app/check-in/page.tsx` to pass submit_mode:**

```typescript
const handleCheckIn = async () => {
  // ... existing validation
  
  // Get submit mode from environment
  const submitMode = process.env.NODE_ENV === 'production' 
    ? 'live' 
    : (process.env.NEXT_PUBLIC_SUBMIT_MODE || 'live');
  
  const checkInData = {
    salesperson: selectedSalesperson,
    planned_mines: [selectedMine],
    main_purpose: selectedPurpose,
    availability: backInOffice,
    comments: comments.trim() || undefined,
    submit_mode: submitMode // Include submit mode
  };

  // Save to database first
  const siteVisitResponse = await fetch('/api/site-visits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checkInData)
  });
  
  // ... rest of the logic
};
```

## Task 7: Fix All Broken Tests

**Update `tests/unit/slack-notify-checkin.test.ts`:**

```typescript
describe('Slack Notify Check-in API', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock successful Slack response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, ts: '1234567890.123456' })
    });
  });

  it('should send Slack notification successfully', async () => {
    const mockData = {
      salesperson: 'James',
      planned_mines: ['Mine Alpha'],
      main_purpose: 'Quote follow-up',
      availability: 'Later this morning',
      submit_mode: 'mock'
    };

    const request = new NextRequest('http://localhost:3000/api/slack/notify-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockData)
    });

    const response = await POST(request);
    
    // Now this should work because withPerformanceLogging preserves Response objects
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    
    const result = await response.json();
    expect(result.ok).toBe(true);
    expect(result.mode).toBe('mock');
    expect(result.channel).toContain('test');
  });

  it('should use correct channel based on submit mode', async () => {
    // Test mock mode
    const mockRequest = new NextRequest('http://localhost:3000/api/slack/notify-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salesperson: 'James',
        planned_mines: ['Mine Alpha'],
        main_purpose: 'Quote follow-up',
        availability: 'Later this morning',
        submit_mode: 'mock'
      })
    });

    const mockResponse = await POST(mockRequest);
    const mockResult = await mockResponse.json();
    expect(mockResult.channel).toContain('test');

    // Test live mode
    const liveRequest = new NextRequest('http://localhost:3000/api/slack/notify-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salesperson: 'James',
        planned_mines: ['Mine Alpha'],
        main_purpose: 'Quote follow-up',
        availability: 'Later this morning',
        submit_mode: 'live'
      })
    });

    const liveResponse = await POST(liveRequest);
    const liveResult = await liveResponse.json();
    expect(liveResult.channel).not.toContain('test');
  });
});
```

## Task 8: Update All Other Tests Using withPerformanceLogging

**Find and update any other test files that use API routes with `withPerformanceLogging`:**

```bash
# Search for affected test files
grep -r "withPerformanceLogging" tests/
```

**Apply the same fix pattern to all affected tests:**
- Expect `response` to be a `Response` object
- Use `await response.json()` to get the data
- Update assertions accordingly

## Critical Success Criteria:

1. ✅ **All tests must pass** after the changes
2. ✅ **Mock mode posts to test channel**, live mode posts to live channel  
3. ✅ **submit_mode is captured in database** for all site visits
4. ✅ **Production always uses 'live' mode** regardless of env vars
5. ✅ **No more fallback to "out-of-office"** - proper channel resolution
6. ✅ **Environment variables resolve correctly at runtime**

## Order of Operations:

1. **First:** Fix `withPerformanceLogging` in `lib/log.ts`
2. **Second:** Run existing tests to verify the fix works
3. **Third:** Add database migration and apply it
4. **Fourth:** Update schema, APIs, and frontend
5. **Fifth:** Update and run all tests
6. **Sixth:** Test manually with both mock and live modes

Make these changes in order and ensure each step passes tests before proceeding to the next.