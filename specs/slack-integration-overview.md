# Slack Integration & Check-in Feature - Technical Overview

## 📋 Overview

This document provides a complete technical overview of the Slack integration and check-in feature in the Sales Helper App. The system allows sales representatives to log site visits and automatically notify team members via Slack.

## 🏗️ Architecture

### **Two-Phase Process:**
1. **Database Storage** - Site visit data is saved to the database
2. **Slack Notification** - Team is notified via Slack (non-blocking)

### **Key Components:**
- **Frontend**: Check-in page with form validation
- **API Routes**: Database storage and Slack notification
- **Database**: Site visits table for audit trail
- **Slack API**: Real-time team notifications

---

## 🔌 API Routes

### **1. Primary Route: `/api/slack/notify-checkin`**

**File:** `app/api/slack/notify-checkin/route.ts`

**Purpose:** Sends formatted check-in notifications to Slack

**Method:** `POST`

**Authentication:** Internal API call (no external auth required)

**Flow:**
1. Validates environment variables
2. Parses and validates check-in data
3. Formats message for Slack
4. Sends to Slack API
5. Returns success/error response

### **2. Supporting Route: `/api/site-visits`**

**File:** `app/api/site-visits/route.ts`

**Purpose:** Saves check-in data to database

**Method:** `POST`

**Flow:**
1. Validates required fields
2. Saves to `site_visits` table
3. Returns saved data

---

## 📊 Data Structures

### **Check-in Data Structure**

```typescript
interface CheckInData {
  salesperson: string          // Required: Name of salesperson
  planned_mines: string[]      // Required: Array of mine names
  main_purpose: string         // Required: Purpose of visit
  availability: string         // Required: When they'll be back
  comments?: string           // Optional: Additional comments
}
```

### **Slack Message Structure**

```typescript
interface SlackMessage {
  channel: string             // Slack channel (from env var)
  text: string               // Formatted message text
}
```

### **Slack API Response**

```typescript
interface SlackResponse {
  ok: boolean
  error?: string
  message?: any
}
```

---

## 💬 Message Formatting

### **Message Template**

```typescript
function formatCheckInMessage(data: CheckInData): string {
  const mineNames = data.planned_mines.join(', ')
  
  let message = `Hi, this is *${data.salesperson}*, today I'll be visiting *${mineNames}*. The main purpose of the visit is: *${data.main_purpose}*. I'll be available on mobile throughout the day and I'll be back in office *${data.availability}*.`
  
  if (data.comments && data.comments.trim()) {
    message += `\n\nAdditional comments: ${data.comments}`
  }
  
  return message
}
```

### **Example Slack Message**

```
Hi, this is *James*, today I'll be visiting *Mine A, Mine B*. The main purpose of the visit is: *Quote follow-up*. I'll be available on mobile throughout the day and I'll be back in office *in the afternoon*.

Additional comments: Testing the Slack integration
```

---

## 🔧 Environment Variables

### **Required Variables**

```bash
# Slack Bot Token (required)
SLACK_BOT_TOKEN=xoxb-your-bot-token-here

# Slack Channel (optional, defaults to #out-of-office)
SLACK_CHANNEL=#sales-helper-test
```

### **Usage in Code**

```typescript
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const SLACK_CHANNEL = process.env.SLACK_CHANNEL || '#out-of-office'
```

### **Validation**

```typescript
if (!SLACK_BOT_TOKEN) {
  throw new Error('SLACK_BOT_TOKEN environment variable is required')
}
```

---

## 🔌 Slack API Integration

### **API Endpoint**

```typescript
const response = await fetch('https://slack.com/api/chat.postMessage', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(message)
})
```

### **Authentication**

- **Method**: Bot Token authentication
- **Token Format**: `xoxb-...`
- **Required Scope**: `chat:write`
- **Header**: `Authorization: Bearer {SLACK_BOT_TOKEN}`

### **Error Handling**

```typescript
if (!response.ok) {
  const errorText = await response.text()
  throw new Error(`Slack API error: ${response.status} ${errorText}`)
}

const result: SlackResponse = await response.json()
if (!result.ok) {
  throw new Error(`Slack API error: ${result.error}`)
}
```

---

## 🗄️ Database Schema

### **Site Visits Table**

```sql
CREATE TABLE site_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,                    -- Today's date
  salesperson TEXT NOT NULL,             -- Salesperson name
  planned_mines TEXT[] NOT NULL,         -- Array of mine names
  main_purpose TEXT NOT NULL,            -- Visit purpose
  availability TEXT NOT NULL,            -- Return time
  comments TEXT,                         -- Optional comments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Indexes**

```sql
CREATE INDEX idx_site_visits_date ON site_visits(date);
CREATE INDEX idx_site_visits_salesperson ON site_visits(salesperson);
CREATE INDEX idx_site_visits_created_at ON site_visits(created_at);
```

### **Triggers**

```sql
-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_site_visits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_site_visits_updated_at
  BEFORE UPDATE ON site_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_site_visits_updated_at();
```

---

## 🎨 Frontend Integration

### **Check-in Page: `/check-in`**

**File:** `app/check-in/page.tsx`

### **Form Fields**

- **Salesperson Selection**: Dropdown with team members
- **Mine Selection**: Multi-select from mine groups
- **Main Purpose**: Dropdown with visit purposes
- **Availability**: Dropdown with return times
- **Comments**: Optional text area

### **Check-in Flow**

```typescript
const handleCheckIn = async () => {
  // 1. Validate form fields
  const errors: Record<string, string> = {}
  if (!selectedSalesperson) errors.salesperson = "Please select a salesperson"
  if (selectedMines.length === 0) errors.mines = "Please select at least one mine"
  if (!mainPurpose) errors.mainPurpose = "Please select the main purpose of your visit"
  if (!availability) errors.availability = "Please select your availability"
  
  // 2. Save to database first
  const response = await fetch('/api/site-visits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      salesperson: selectedSalesperson,
      planned_mines: selectedMines,
      main_purpose: mainPurpose,
      availability: availability,
      comments: comments.trim() || undefined
    })
  })

  // 3. Send Slack notification (non-blocking)
  try {
    const slackResponse = await fetch('/api/slack/notify-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salesperson: selectedSalesperson,
        planned_mines: selectedMines,
        main_purpose: mainPurpose,
        availability: availability,
        comments: comments.trim() || undefined
      })
    })
  } catch (slackError) {
    // Don't fail check-in if Slack fails
    console.warn('Slack notification error:', slackError)
  }
}
```

---

## ✅ Validation & Error Handling

### **Required Field Validation**

```typescript
// Frontend validation
if (!selectedSalesperson) {
  errors.salesperson = "Please select a salesperson"
}

// Backend validation
if (!salesperson) {
  throw new Error('salesperson is required')
}

if (!planned_mines || !Array.isArray(planned_mines) || planned_mines.length === 0) {
  throw new Error('planned_mines is required and must be a non-empty array')
}

if (!main_purpose) {
  throw new Error('main_purpose is required')
}

if (!availability) {
  throw new Error('availability is required')
}
```

### **Graceful Degradation**

- **Check-in succeeds** even if Slack fails
- **Slack errors are logged** but don't break the flow
- **Environment variable validation** with clear error messages
- **Non-blocking Slack calls** - database save happens first

### **Error Response Format**

```typescript
return NextResponse.json(
  { 
    error: `Failed to send check-in notification: ${error instanceof Error ? error.message : String(error)}` 
  },
  { status: 500 }
)
```

---

## 🧪 Testing

### **Test File: `test-slack-integration.js`**

**Location:** Root directory

**Purpose:** Browser console testing functions

### **Test Functions**

```javascript
// Test with authentication
async function testSlackIntegration() {
  const testData = {
    salesperson: 'James',
    planned_mines: ['Mine A', 'Mine B'],
    main_purpose: 'Quote follow-up',
    availability: 'in the afternoon',
    comments: 'Testing the Slack integration from browser console'
  }
  
  const response = await fetch('/api/slack/notify-checkin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-api-key-here'
    },
    body: JSON.stringify(testData)
  })
}

// Test without authentication (development)
async function testSlackIntegrationNoAuth() {
  const testData = {
    salesperson: 'Luyanda',
    planned_mines: ['Test Mine 1', 'Test Mine 2'],
    main_purpose: 'Site check',
    availability: 'tomorrow',
    comments: 'This is a test message from the browser console'
  }
  
  const response = await fetch('/api/slack/notify-checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
  })
}
```

### **Usage**

```javascript
// In browser console
testSlackIntegration()
testSlackIntegrationNoAuth()
```

---

## 🔄 Integration Points

### **Mine Groups API**

**Route:** `/api/mine-groups`

**Purpose:** Provides mine names for selection

**Usage:** Populates mine selection dropdown

### **Salesperson Selection**

**Storage:** `localStorage` for persistence

**Key:** `selectedSalesSupport`

**Usage:** Remembers last selected salesperson

---

## 🚀 Deployment Requirements

### **Environment Setup**

1. **Slack Bot Token** with `chat:write` scope
2. **Slack Channel** for notifications
3. **Database table** (`site_visits`) created
4. **Environment variables** configured

### **Slack App Configuration**

1. **Create Slack App** in workspace
2. **Add Bot Token** with `chat:write` scope
3. **Invite bot** to target channel
4. **Set environment variables**

### **Database Migration**

**File:** `database-migration-site-visits.sql`

**Purpose:** Creates site_visits table with proper schema

---

## 📈 Monitoring & Logging

### **Console Logging**

```typescript
console.log('API route /api/slack/notify-checkin called')
console.log('Slack API: Sending message to channel:', message.channel)
console.log('Slack API: Response status:', response.status)
console.log('Slack API: Message sent successfully')
```

### **Error Logging**

```typescript
console.error('Slack API Error:', errorText)
console.error('Error sending Slack message:', error)
console.warn('Slack notification failed, but check-in was saved')
```

---

## 🔧 Troubleshooting

### **Common Issues**

1. **Missing SLACK_BOT_TOKEN**
   - Error: "SLACK_BOT_TOKEN environment variable is required"
   - Solution: Set environment variable

2. **Invalid Bot Token**
   - Error: "Slack API error: invalid_auth"
   - Solution: Regenerate bot token

3. **Channel Not Found**
   - Error: "Slack API error: channel_not_found"
   - Solution: Invite bot to channel

4. **Insufficient Permissions**
   - Error: "Slack API error: missing_scope"
   - Solution: Add `chat:write` scope to bot

### **Debug Steps**

1. Check environment variables are set
2. Verify bot token is valid
3. Confirm bot is in target channel
4. Test with browser console functions
5. Check server logs for detailed errors

---

## 📝 Summary

The Slack integration and check-in feature provides:

- ✅ **Reliable data storage** in database
- ✅ **Real-time team notifications** via Slack
- ✅ **Graceful error handling** and degradation
- ✅ **Comprehensive validation** at multiple levels
- ✅ **Easy testing** with browser console functions
- ✅ **Clear separation of concerns** between storage and notifications

**The system is production-ready with proper error handling, logging, and graceful degradation.**
