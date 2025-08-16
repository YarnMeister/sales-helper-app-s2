# Sales Helper App - Complete Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture & Infrastructure](#architecture--infrastructure)
3. [Database Schema](#database-schema)
4. [Core Application Features](#core-application-features)
   - [Main Dashboard (All Requests)](#main-dashboard-all-requests)
   - [Quote Management](#quote-management)
   - [Contact Management](#contact-management)
   - [Product Management](#product-management)
5. [Pipedrive Integrations](#pipedrive-integrations)
   - [Deal Creation](#deal-creation-integration)
   - [Contact Sync](#contact-sync-integration)
   - [Product Sync](#product-sync-integration)
6. [Data Flow Patterns](#data-flow-patterns)
7. [Technical Implementation](#technical-implementation)
8. [Future Considerations](#future-considerations)

---

## System Overview

The Sales Helper App is a Next.js 14 application with a Supabase backend that integrates with Pipedrive CRM. The system manages quote requests, contacts, products, and line items with a focus on sales workflow automation.

### Technology Stack
- **Frontend**: Next.js 14 with TypeScript, React
- **Backend**: Supabase (PostgreSQL) with Next.js API routes
- **External Integration**: Pipedrive CRM API
- **Deployment**: Vercel
- **Authentication**: Internal API (no external auth required)

### Key Features
- Quote request creation and management
- Contact and product synchronization with Pipedrive
- Automated deal creation in Pipedrive CRM
- Hierarchical data organization (Mine Groups â†’ Mines â†’ Contacts)
- Sequential ID generation for quotes (QR-001, QR-002, etc.)
- Smart deletion handling for data integrity

---

## Architecture & Infrastructure

### Current Architecture
```
Frontend (Next.js 14)
    â†“
API Routes (/app/api/*)
    â†“
Supabase Database (PostgreSQL)
    â†”
Pipedrive CRM API
```

### API Route Structure
```
/api/
â”œâ”€â”€ quotes/                    # Quote CRUD operations
â”œâ”€â”€ contacts/                  # Contact data fetching
â”œâ”€â”€ products/                  # Product data fetching
â”œâ”€â”€ create-pipedrive-deal/     # Deal submission to Pipedrive
â”œâ”€â”€ refresh-contacts-direct/   # Sync contacts from Pipedrive
â”œâ”€â”€ refresh-products-direct/   # Sync products from Pipedrive
â””â”€â”€ health/                   # System health checks
```

---

## Database Schema

### Core Tables

#### `quote_requests`
```sql
CREATE TABLE quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT UNIQUE, -- QR-001, QR-002, etc.
  salesperson_first_name TEXT NOT NULL,
  status TEXT DEFAULT 'Draft', -- Draft, Submitted
  mine_name TEXT,
  mine_group TEXT,
  contact_person_id UUID REFERENCES contacts(id),
  comment TEXT,
  request_type TEXT, -- Phone Request, Email Request, etc.
  pipedrive_deal_id INTEGER, -- Link to Pipedrive deal
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_reason TEXT
);
```

#### `line_items`
```sql
CREATE TABLE line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID REFERENCES quote_requests(id) ON DELETE CASCADE,
  request_id TEXT, -- Human-readable quote ID
  product_id UUID REFERENCES products(id),
  custom_description TEXT,
  quantity INTEGER DEFAULT 1,
  number_of_rows INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `contacts`
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipedrive_person_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mine_name TEXT,
  mine_group TEXT,
  job_title TEXT,
  pipedrive_org_id INTEGER,
  salesperson_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_reason TEXT
);
```

#### `products`
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipedrive_product_id INTEGER UNIQUE,
  description TEXT NOT NULL,
  product_code TEXT,
  category TEXT,
  price DECIMAL(10,2),
  show_on_sales_helper BOOLEAN DEFAULT FALSE,
  short_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Views

#### `active_quote_requests`
```sql
CREATE VIEW active_quote_requests AS
SELECT * FROM quote_requests 
WHERE is_active = TRUE;
```

---

## Core Application Features

## Main Dashboard (All Requests)

### Overview
The main dashboard displays all quote requests with filtering, searching, and management capabilities.

### API Routes Used

#### `GET /api/quotes`
**Purpose**: Fetch all quote requests for the main dashboard

**Database Query**:
```sql
SELECT 
  *,
  line_items(
    id, quote_request_id, request_id, product_id, 
    custom_description, quantity, number_of_rows,
    products(id, description, product_code, category, price)
  )
FROM active_quote_requests -- or quote_requests for inactive
ORDER BY created_at DESC;
```

**Key Features**:
- Nested data loading (quotes â†’ line items â†’ products)
- Filters by `includeInactive` parameter
- Supports salesperson filtering
- Returns complete quote data structure

### Data Flow

#### Initial Load Process
```
1. App Load â†’ Local Storage (get salesperson preference)
2. App Load â†’ Reference Data Refresh (contacts/products from Pipedrive)
3. App Load â†’ Quotes API â†’ Supabase (fetch all quotes with line items)
4. Frontend â†’ Data Mapping (transform database to UI format)
5. Frontend â†’ Filtering (by selected salesperson)
```

#### Quote List Management
```typescript
// Primary data fetch
const response = await fetch('/api/quotes')
const quotes = await response.json()

// Transform data for UI
const transformedQuotes = quotes.map(quote => ({
  id: quote.id,
  requestId: quote.request_id,
  status: quote.status,
  mineName: quote.mine_name,
  mineGroup: quote.mine_group,
  lineItems: quote.line_items?.map(item => ({
    productName: item.products?.description,
    quantity: item.quantity,
    // ...
  }))
}))
```

### Error Handling Strategy
- **Non-blocking reference data refresh**: App continues if Pipedrive sync fails
- **Graceful degradation**: Shows empty state if quotes fail to load
- **Background sync**: Reference data updates don't block UI
- **Comprehensive logging**: All errors logged for debugging

---

## Quote Management

### API Routes Used

#### `POST /api/quotes`
**Purpose**: Create or update quote requests with line items

**Database Operations**:
```sql
-- 1. Generate sequential request_id
SELECT MAX(CAST(SUBSTRING(request_id FROM 4) AS INTEGER)) 
FROM quote_requests 
WHERE request_id LIKE 'QR-%';

-- 2. Upsert quote request
INSERT INTO quote_requests (...) 
VALUES (...) 
ON CONFLICT (id) DO UPDATE SET ...;

-- 3. Delete existing line items (for updates)
DELETE FROM line_items WHERE quote_request_id = ?;

-- 4. Insert new line items
INSERT INTO line_items (...) VALUES (...);
```

### Data Structure

#### Quote Request Payload
```json
{
  "quoteData": {
    "salespersonFirstName": "James",
    "mineName": "Zibulo Mine",
    "mineGroup": "Anglo American Inyosi", 
    "contactPersonId": "uuid-from-contacts",
    "comment": "Optional comment",
    "requestType": "Telephone Request"
  },
  "lineItems": [
    {
      "productId": "uuid-from-products",
      "quantity": 5,
      "customDescription": "Custom description",
      "numberOfRows": 2
    }
  ],
  "existingQuoteId": "uuid-for-updates"
}
```

#### Response Structure
```json
{
  "success": true,
  "message": "Quote saved successfully",
  "data": {
    "id": "uuid",
    "request_id": "QR-017",
    "status": "Draft"
  }
}
```

---

## Contact Management

### Overview
Manages contact data synchronized from Pipedrive with hierarchical organization.

### API Routes Used

#### `GET /api/contacts`
**Purpose**: Fetch contacts for selection in quote creation

**Database Query**:
```sql
SELECT * FROM contacts 
WHERE is_active = true 
ORDER BY name;
```

**Key Features**:
- Filters to active contacts only (unless `includeInactive=true`)
- Hierarchical organization: Mine Group â†’ Mine â†’ Contacts
- Real-time search and filtering

#### `POST /api/refresh-contacts-direct`
**Purpose**: Sync contacts from Pipedrive to local database

**Process Flow**:
```typescript
export async function POST(request: NextRequest) {
  // Step 1: Fetch all persons from Pipedrive
  const personsResponse = await fetchPersons()
  const persons = personsResponse.data?.data || []
  
  // Step 2: Fetch all organizations from Pipedrive
  const organizationsResponse = await fetchOrganizations()
  const organizations = organizationsResponse.data?.data || []
  
  // Step 3: Create organization lookup map
  const organizationMap = new Map<number, any>()
  organizations.forEach(org => {
    organizationMap.set(org.id, org)
  })
  
  // Step 4: Transform contact data
  const transformedContacts = persons.map(person => 
    transformPersonToContact(person, organizationMap)
  )
  
  // Step 5: Handle deleted contacts (smart deletion)
  const deletedIds = findDeletedContacts(currentContacts, transformedContacts)
  await handleSmartDeletion(deletedIds)
  
  // Step 6: Upsert contacts to Supabase
  await supabase.from('contacts').upsert(transformedContacts, {
    onConflict: 'pipedrive_person_id',
    ignoreDuplicates: false
  })
}
```

### Data Structures

#### Contact Data Format
```json
{
  "id": "uuid-from-supabase",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+27123456789",
  "mine_name": "Zibulo Mine",
  "mine_group": "Anglo American Inyosi",
  "job_title": "Mining Engineer",
  "pipedrive_person_id": 12345,
  "pipedrive_org_id": 67890,
  "salesperson_name": "James",
  "is_active": true
}
```

#### Pipedrive Person Response
```json
{
  "data": [
    {
      "id": 12345,
      "name": "John Doe",
      "email": [{"value": "john.doe@example.com", "primary": true}],
      "phone": [{"value": "+27123456789", "primary": true}],
      "org_id": {"name": "Zibulo Mine", "value": 67890},
      "owner_id": {"name": "James", "value": 11111},
      "d84955e5e1a7284521f90bca9aa2b94a533ed24e": "Mining Engineer"
    }
  ]
}
```

### Smart Deletion Logic
- **Soft Delete**: Contacts used in quotes marked as `is_active: false`
- **Hard Delete**: Unused contacts permanently removed
- **Conflict Resolution**: Uses `pipedrive_person_id` for conflict detection

### Custom Field Mapping
- **Job Title Field ID**: `d84955e5e1a7284521f90bca9aa2b94a533ed24e`
- **Mine Group Field ID**: `d0b6b2d1d53bed3053e896f938c6051a790bd15e`

---

## Product Management

### Overview
Manages product catalog synchronized from Pipedrive with category-based organization.

### API Routes Used

#### `GET /api/products`
**Purpose**: Fetch products for line item selection

**Database Query**:
```sql
SELECT * FROM products 
WHERE show_on_sales_helper = true 
ORDER BY description;
```

**Key Features**:
- Filters to products marked for Sales Helper display
- Category-based grouping
- Multi-select functionality

#### `POST /api/refresh-products-direct`
**Purpose**: Sync products from Pipedrive to local database

**Process Flow**:
```typescript
export async function POST(request: NextRequest) {
  // Step 1: Fetch all products from Pipedrive
  const productsResponse = await fetchProducts()
  const products = productsResponse.data?.data || []
  
  // Step 2: Fetch category mapping
  const categoryMapping = await fetchProductCategoryMapping()
  
  // Step 3: Transform product data with change detection
  const transformedProducts = products.map(product => 
    transformProductToDatabase(product, categoryMapping)
  )
  
  // Step 4: Detect changes (inserted, updated, unchanged)
  const changeDetection = analyzeProductChanges(existing, transformed)
  
  // Step 5: Upsert to database
  await supabase.from('products').upsert(transformedProducts, {
    onConflict: 'pipedrive_product_id',
    ignoreDuplicates: false
  })
}
```

### Data Structures

#### Product Data Format
```json
{
  "id": "uuid-from-supabase",
  "description": "Safety Helmet - Hard Hat",
  "product_code": "SH-001",
  "category": "Safety Equipment",
  "price": 150.00,
  "show_on_sales_helper": true,
  "short_description": "Industrial safety helmet",
  "pipedrive_product_id": 12345
}
```

#### Pipedrive Product Response
```json
{
  "data": [
    {
      "id": 12345,
      "name": "Safety Helmet - Hard Hat",
      "code": "SH-001",
      "category": "1",
      "price": 150.00,
      "59af9d567fc57492de93e82653ce01d0c967f6f5": 78,
      "f320da5e15bef8b83d8c9d997533107dfdb66d5c": "Industrial safety helmet"
    }
  ]
}
```

### Custom Field Processing
- **Show on Sales Helper Field**: `59af9d567fc57492de93e82653ce01d0c967f6f5`
  - Value 78 = "Yes" (display in UI)
  - Value 79 = "No" (hide from UI)
- **Short Description Field**: `f320da5e15bef8b83d8c9d997533107dfdb66d5c`

---

## Pipedrive Integrations

## Deal Creation Integration

### Overview
Converts saved quotes into Pipedrive deals with all associated data.

### API Route: `POST /api/create-pipedrive-deal`

#### Process Flow
```typescript
export async function POST(request: NextRequest) {
  // 1. Validate and extract payload
  const payload = validateCreateDealPayload(request.body)
  
  // 2. Fetch required data from database
  const contact = await getContactById(payload.contactPersonId)
  const products = await getProductsByIds(payload.lineItems.map(li => li.productId))
  const ruanUserId = await getRuanUserId() // Hardcoded: 123456
  
  // 3. Build deal title
  const dealTitle = buildDealTitle(
    payload.requestId, 
    payload.mineGroup, 
    payload.mineName, 
    payload.lineItems
  )
  
  // 4. Create deal in Pipedrive
  const dealData = {
    title: dealTitle,
    pipeline_id: 9,
    stage_id: 57,
    person_id: contact.pipedrive_person_id,
    org_id: contact.pipedrive_org_id,
    user_id: ruanUserId,
    // Custom fields (hardcoded IDs)
    '4ad64c7e225ef479139742cdb9bf93f956298f69': payload.requestId,
    '1fe134689b48d31c77a75af4a44d8a613da61df3': mapSalespersonToValue(payload.salespersonFirstName),
    'a6321f3f56ba1e30978e1176bef2ca18dab2066b': 38 // Ruan
  }
  
  const dealResponse = await createPipedriveDeal(dealData)
  const dealId = dealResponse.data?.data?.id
  
  // 5. Add product line items to deal
  const pipedriveProducts = payload.lineItems.map(item => ({
    product_id: products.find(p => p.id === item.productId)?.pipedrive_product_id,
    quantity: item.quantity,
    item_price: products.find(p => p.id === item.productId)?.price || 0
  }))
  
  await addProductsToDeal(dealId, pipedriveProducts)
  
  // 6. Update local database
  await supabase.from('quote_requests').update({
    pipedrive_deal_id: dealId,
    status: 'Submitted',
    updated_at: new Date()
  }).eq('id', payload.quoteRequestId)
  
  return { success: true, dealId, requestId: payload.requestId }
}
```

#### Input Payload Structure
```json
{
  "quoteRequestId": "uuid-from-supabase",
  "requestId": "QR-017",
  "salespersonFirstName": "James",
  "mineName": "Zibulo",
  "mineGroup": "Anglo American Inyosi",
  "contactPersonId": "uuid-from-contacts-table",
  "comment": "Optional comment",
  "requestType": "Telephone Request",
  "lineItems": [
    {
      "productId": "uuid-from-products-table",
      "quantity": 5,
      "customDescription": "Optional custom description"
    }
  ]
}
```

#### Pipedrive Deal Structure
```json
{
  "title": "[QR-017] - [Anglo American Inyosi] - [Zibulo] - [Product Name x 5]",
  "pipeline_id": 9,
  "stage_id": 57,
  "person_id": 12345,
  "org_id": 67890,
  "user_id": 11111,
  "4ad64c7e225ef479139742cdb9bf93f956298f69": "QR-017",
  "1fe134689b48d31c77a75af4a44d8a613da61df3": "47",
  "a6321f3f56ba1e30978e1176bef2ca18dab2066b": "38"
}
```

### Custom Field Mapping
- **Salesperson Mapping**: Jamesâ†’47, Luyandaâ†’46, Stefanâ†’48
- **Assigned Person Mapping**: Ruanâ†’38, DeWetâ†’39
- **Custom Field IDs**: Hardcoded Pipedrive field identifiers

### Error Handling
- Mock mode for testing (`PIPEDRIVE_SUBMIT_MODE` environment variable)
- Graceful degradation (deal creation continues if product addition fails)
- 30-second timeout for API calls
- Comprehensive logging and validation

---

## Contact Sync Integration

### Process Overview
Synchronizes contacts from Pipedrive persons and organizations into local database.

### External API Calls
- `GET /persons` - Fetch all persons from Pipedrive
- `GET /organizations` - Fetch all organizations from Pipedrive

### Data Transformation Process
```typescript
function transformPersonToContact(person: any, organizationMap: Map<number, any>) {
  const org = organizationMap.get(person.org_id?.value)
  
  return {
    pipedrive_person_id: person.id,
    name: person.name,
    email: extractPrimaryEmail(person.email),
    phone: extractPrimaryPhone(person.phone),
    mine_name: person.org_id?.name,
    mine_group: org?.[MINE_GROUP_FIELD_ID] || null,
    job_title: person[JOB_TITLE_FIELD_ID] || null,
    pipedrive_org_id: person.org_id?.value,
    salesperson_name: person.owner_id?.name,
    is_active: true
  }
}
```

### Smart Deletion Algorithm
```sql
-- 1. Identify deleted contacts
WITH deleted_contacts AS (
  SELECT pipedrive_person_id 
  FROM contacts 
  WHERE pipedrive_person_id NOT IN (/* new contact IDs */)
),
used_contacts AS (
  SELECT DISTINCT c.pipedrive_person_id
  FROM contacts c
  INNER JOIN quote_requests qr ON c.id = qr.contact_person_id
  WHERE c.pipedrive_person_id IN (SELECT pipedrive_person_id FROM deleted_contacts)
)
-- 2. Soft delete used contacts
UPDATE contacts SET 
  is_active = false,
  deleted_at = NOW(),
  deleted_reason = 'Removed from Pipedrive but used in quotes'
WHERE pipedrive_person_id IN (SELECT pipedrive_person_id FROM used_contacts);

-- 3. Hard delete unused contacts
DELETE FROM contacts 
WHERE pipedrive_person_id IN (
  SELECT pipedrive_person_id FROM deleted_contacts
  EXCEPT 
  SELECT pipedrive_person_id FROM used_contacts
);
```

---

## Product Sync Integration

### Process Overview
Synchronizes products from Pipedrive with change detection and filtering.

### External API Calls
- `GET /products` - Fetch all products from Pipedrive
- Custom category mapping logic

### Change Detection Logic
```typescript
function analyzeProductChanges(existing: Product[], transformed: Product[]) {
  const stats = { inserted: 0, updated: 0, unchanged: 0 }
  const existingMap = new Map(existing.map(p => [p.pipedrive_product_id, p]))
  
  return transformed.map(product => {
    const existingProduct = existingMap.get(product.pipedrive_product_id)
    
    if (!existingProduct) {
      stats.inserted++
      return product
    }
    
    const hasChanges = 
      existingProduct.description !== product.description ||
      existingProduct.price !== product.price ||
      existingProduct.show_on_sales_helper !== product.show_on_sales_helper ||
      existingProduct.category !== product.category
    
    if (hasChanges) {
      stats.updated++
    } else {
      stats.unchanged++
    }
    
    return product
  })
}
```

### Category Mapping
```typescript
const CATEGORY_MAPPING = {
  "1": "Safety Equipment",
  "2": "Mining Tools", 
  "3": "Personal Protective Equipment",
  "4": "Machinery Parts"
}
```

---

## Data Flow Patterns

### 1. Quote Creation Flow
```
User Action â†’ Create New Quote â†’ In-Memory Draft
User Input â†’ Add Contacts/Products â†’ Update Draft State  
User Action â†’ Save Quote â†’ POST /api/quotes
Backend â†’ Generate Sequential ID â†’ Insert Quote + Line Items
Frontend â†’ Refresh Quote List â†’ GET /api/quotes
```

### 2. Quote Submission Flow  
```
User Action â†’ Submit Quote â†’ POST /api/create-pipedrive-deal
Backend â†’ Fetch Contact/Product Details â†’ Validate Data
Backend â†’ Create Pipedrive Deal â†’ Add Products to Deal
Backend â†’ Update Quote Status â†’ Return Success Response
Frontend â†’ Navigate to Quote List â†’ Show Updated Status
```

### 3. Reference Data Sync Flow
```
App Load â†’ Background Sync â†’ POST /api/refresh-contacts-direct
Backend â†’ Fetch Pipedrive Persons/Orgs â†’ Transform Data
Backend â†’ Smart Deletion Logic â†’ Upsert to Database
App Load â†’ Background Sync â†’ POST /api/refresh-products-direct  
Backend â†’ Fetch Pipedrive Products â†’ Change Detection â†’ Upsert to Database
```

### 4. Contact Selection Flow
```
User Action â†’ Open Add Contacts â†’ GET /api/contacts
Frontend â†’ Display Hierarchical List â†’ Mine Group â†’ Mine â†’ Contacts
User Selection â†’ Choose Contact â†’ Update Quote State
Frontend â†’ Return to Quote Edit â†’ Show Selected Contact
```

### 5. Product Selection Flow
```
User Action â†’ Open Add Line Items â†’ GET /api/products
Frontend â†’ Display by Category â†’ Safety Equipment â†’ Products
User Selection â†’ Multi-Select Products â†’ Update Quote State
Frontend â†’ Return to Quote Edit â†’ Show Selected Products as Line Items
```

