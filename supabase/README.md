# Database Schema - Sales Helper App

This directory contains the Supabase database migrations and schema definitions for the Sales Helper App.

## Schema Overview

### Main Tables

#### `requests` - Core request data
- **Primary key:** `id` (UUID)
- **Request ID:** `request_id` (QR-001 format, auto-generated)
- **Status:** `draft`, `submitted`, `failed`
- **Contact data:** JSONB with Pipedrive contact information
- **Line items:** JSONB array of product line items
- **Generated columns:** For fast filtering and performance

#### `kv_cache` - Key-value caching
- **Purpose:** Performance optimization for frequently accessed data
- **Use cases:** Cached Pipedrive data, user preferences, etc.

#### `mock_pipedrive_submissions` - Testing support
- **Purpose:** Track mock submissions during development
- **Use cases:** Testing submission workflow, debugging

## Migrations

### `20250815000001_requests_flat_schema.sql`
- Creates the main `requests` table with JSONB structure
- Implements request ID auto-generation (QR-001, QR-002, etc.)
- Adds comprehensive indexing for performance
- Includes JSONB validation functions
- Sets up triggers for automatic updates

### `20250815000002_support_tables.sql`
- Creates `kv_cache` table for performance optimization
- Creates `mock_pipedrive_submissions` table for testing

## Key Features

### Auto-Generated Request IDs
- Sequential format: QR-001, QR-002, QR-003...
- Handles gaps in sequence gracefully
- Trigger-based automatic generation

### JSONB Validation
- Database-level validation for contact data
- Ensures required fields (personId, name, mineGroup, mineName)
- Mobile-first workflow requirements

### Performance Optimizations
- Generated columns for fast filtering
- B-tree indexes on frequently queried fields
- GIN indexes for JSONB containment queries
- Composite indexes for complex queries

### Data Integrity
- Foreign key constraints where applicable
- Check constraints for enum values
- Automatic timestamp management
- UUID primary keys for scalability

## TypeScript Integration

The schema is fully typed with TypeScript interfaces in `lib/types/database.ts`:

- `Request` - Main request interface
- `ContactJSON` - Contact data structure
- `LineItem` - Line item structure
- `RequestStatus` - Status enum
- `SalespersonSelection` - Salesperson enum

## Validation

### Database Level
- JSONB validation functions
- Check constraints
- Foreign key constraints

### Application Level
- Zod schemas for runtime validation
- TypeScript types for compile-time safety
- Helper functions for common validations

## Usage Examples

### Creating a Request
```typescript
import { createRequest } from '@/lib/database-utils';

const request = await createRequest({
  status: 'draft',
  salesperson_selection: 'Luyanda',
  contact: {
    personId: 123,
    name: 'John Doe',
    mineGroup: 'Group A',
    mineName: 'Mine 1'
  },
  line_items: []
});
```

### Querying Requests
```typescript
import { listRequests } from '@/lib/database-utils';

// Get all draft requests
const drafts = await listRequests({ status: 'draft' });

// Get requests by salesperson
const luyandaRequests = await listRequests({ salesperson: 'Luyanda' });

// Get requests by mine group
const groupARequests = await listRequests({ mineGroup: 'Group A' });
```

### Caching
```typescript
import { setCacheValue, getCacheValue } from '@/lib/database-utils';

// Cache Pipedrive data
await setCacheValue('pipedrive_products', products);

// Retrieve cached data
const cachedProducts = await getCacheValue('pipedrive_products');
```

## Migration Commands

### Apply Migrations
```bash
# Apply to test database
supabase migration up --db-url $SUPABASE_URL_TEST

# Apply to production database
supabase migration up --db-url $SUPABASE_URL_PROD
```

### Reset Database (Development)
```bash
supabase db reset
```

## Performance Considerations

### Indexes
- **B-tree indexes:** For equality and range queries
- **GIN indexes:** For JSONB containment queries
- **Generated columns:** For fast filtering without JSONB parsing

### Query Optimization
- Use generated columns for filtering when possible
- Leverage JSONB containment operators for complex queries
- Consider caching frequently accessed data in `kv_cache`

### Monitoring
- Monitor query performance with Supabase dashboard
- Watch for slow queries and add indexes as needed
- Consider partitioning for large datasets

## Security

### Row Level Security (RLS)
- RLS policies should be added based on business requirements
- Consider salesperson-based access control
- Implement audit logging for sensitive operations

### Data Validation
- All user input validated at application level
- Database constraints provide additional safety
- JSONB validation ensures data integrity

## Testing

### Mock Submissions
- Use `mock_pipedrive_submissions` table for testing
- Simulate Pipedrive API responses
- Test submission workflow without external dependencies

### Test Data
- Create test requests with various statuses
- Test edge cases (empty line items, invalid contacts)
- Verify validation functions work correctly
