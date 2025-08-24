Sales Helper App - Functional Requirements Summary
Main Page Requirements
Header & Navigation

RTSE logo with red background
Dynamic page title (e.g., "Sales Helper - James's Requests")
Salesperson filter buttons: Luyanda, James, Stefan, "All requests"
Default selection: James (not "All requests")
New Request button: Only visible when specific salesperson selected, hidden for "All requests"

Request Display

Mobile-first compact view optimizing whitespace
Clear separation between request cards
Sequential QR ID format: QR-001, QR-002, etc. (auto-incrementing)
Status badges: Draft (gray), Submitted (green), Failed (red)
Salesperson attribution: Shows who owns each request

Request Management

Inline creation: "New Request" creates blank draft directly on main page
No separate edit draft page: Eliminated 3-level navigation (Main → Edit Draft → Add Contact/Items)
Inline editing: All modifications happen directly in request cards
Real-time updates: Changes reflect immediately with visual feedback
Statistics dashboard: Total, submitted, draft, and failed request counts

Submit Logic (PRD Requirements)

Submit button disabled by default
Enable only when: Contact AND at least 1 line item added
Submit states: "Submit to Pipedrive" → "Submitting..." → "See Deal" (with external link)
Error handling: Failed submissions show "Retry Submission" button


Add Contacts Requirements
Page Structure

Full-screen modal design for mobile (separate page, not overlay)
Universal header with RTSE logo + "Add Contacts" title
Back button returns to main page, clears sessionStorage

UI Component - 3-Tier Accordion

Mine Groups: List all mine groups with contact counts
Mine Names: When group selected, reveal all mines in that group
Contacts: When mine selected, reveal all persons for that mine

Contact Information Display

Contact details: Name, email, phone number
Hierarchy display: Mine Group → Mine Name → Contact
Single selection only: Can select one contact and save or go back
Search functionality: Filter across all levels (group, mine, contact, email)

Data Management

No local persistence: Get full list from Pipedrive efficiently
Caching with TTL: 24-hour cache, stale data tolerance for offline
200-500 contacts: Optimized for this scale
Infrequent changes: Updates ~once per week

Save Workflow

SessionStorage: Stores editingRequestId for navigation context
Save action: Returns to main page, displays contact in correct QR request
Visual feedback: Contact displays with Mine Group → Mine Name hierarchy


Add Line Items Requirements
Page Structure

Reuse accordion component from Add Contacts (same look and feel)
2-tier structure: Product Groups → Products (no third level)
Same mobile-first full-screen design

Product Selection

Product Groups: Categories like "Safety Equipment", "Tools", etc.
Products: When group selected, reveal all products in category


Multi-selection support: Can select multiple products
Quantity controls: Default quantity 1, with jumbo +/- buttons
Minimum quantity: 1 (cannot go below)

Quantity Management

Jumbo +/- buttons: Mobile-optimized touch targets
Direct input: Can type quantity directly
Real-time totals: Shows item count and total value
Inline editing: Quantity changes immediately update totals

Line Item Display on Main Page

Default quantity 1: Shows on main page for each line item
Inline deletion: Can delete individual line items from main page
Add more items: Button to return to line items page
Order total: Calculates and displays total value when prices available

Data Management

Same caching strategy as contacts (24h TTL, offline tolerance)
200-500 products: Optimized for this scale
Product details: Name, code, price, description
Categories: Organized in logical groupings


Add Comment Requirements
Interaction Pattern

Optional feature: Comments are not required
Inline editing: No separate page/modal
Click "Add Comment": Reveals large text input box directly in request card

Auto-Save Behavior (PRD Critical)

Focus loss triggers save: When clicking outside the text box
Exception: If box is empty, restore "Add Comment" button (don't save)
Smart state management: Toggles between Add → Edit → Display modes

Text Input Features

Large text area: Multi-line support with auto-resize
Character limit: 2000 characters with warning near limit
Keyboard shortcuts: Ctrl+Enter to save, Escape to cancel
Mobile actions: Save/Cancel buttons visible on small screens

Display and Edit

Comment display: Shows saved comment with edit-on-click
Visual formatting: Preserves line breaks and whitespace
Edit mode: Click anywhere on comment to edit
Auto-focus: Cursor positioned at end of existing text

Error Handling

Auto-retry: Network errors retry automatically (up to 3 attempts)
Offline detection: Prevents save attempts when offline
Error recovery: Keeps edit mode active on save failures
Loading states: Visual feedback during save operations


Cross-Feature Requirements
Mobile-First Design

Touch targets: Minimum 44px for all interactive elements
Compact layouts: Efficient use of screen space
Responsive navigation: Horizontal scrolling for filter buttons
Sticky headers: Navigation remains accessible during scroll

Data Management

SessionStorage: Preserves editing context across navigation
Real-time sync: Changes reflect immediately in UI
Optimistic updates: UI updates before server confirmation
Error recovery: Graceful handling of save failures

Performance

Debounced search: 300ms delay to prevent excessive API calls
Efficient filtering: Uses database generated columns
Cache strategy: 24-hour TTL with stale-while-revalidate
Offline tolerance: Works with cached data when connectivity poor

Accessibility

Keyboard navigation: All features accessible via keyboard
Screen reader support: Proper ARIA labels and announcements
Focus management: Logical tab order and focus preservation
High contrast: Maintains visibility in accessibility modes

Integration

Flat JSONB schema: All data stored as JSON in single table
API consistency: Standardized error handling and response formats
State preservation: Navigation maintains editing context
Visual feedback: Real-time indicators for saves and updates

This functional specification eliminates the original 3-tier navigation (Main → Edit Draft → Add Contact/Items) in favor of direct inline editing, while maintaining all the hierarchical data organization and mobile-optimized UX patterns.