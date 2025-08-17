# Workflow State Dashboard

**Last Updated:** 2025-01-27 16:15  
**Project:** sales-helper-app-s2  
**Current Branch:** `main`

---

## 🚦 Workflow Kanban

| State                  | Branch                | Notes                |
|-------------------------|-----------------------|----------------------|
| No Feature Branch       |                       |                      |
| In Progress / Local     |                       |                      |
| Deployed to Preview     |                       |                      |
| Deployed to Production  | `main` | ✅ Complete: Supabase tech debt cleanup, line_items bug fix, pure Neon SQL implementation |

---

## 📝 Recent Commits
bdefb82 Fix line_items clearing bug in comment updates - check raw request body instead of parsed values to avoid Zod defaults - only include fields that were explicitly sent in request - prevent line_items: [] from being added to comment-only updates - preserve existing line items when updating comments
afebb31 Phase 4: Complete Supabase tech debt cleanup - verify no remaining Supabase patterns in codebase - confirm environment variables are clean (no SUPABASE_* vars) - all individual update functions deprecated and replaced - over-engineered query building simplified - maintain backward compatibility during transition - ready for testing and deployment
f997174 Phase 3: Clean up individual update functions and simplify query building - deprecate individual update functions (updateRequestContact, updateRequestLineItems, updateRequestComment) - remove debugging console.log statements - simplify over-engineered getRequests function with hardcoded condition combinations - add deprecation comments for backward compatibility - delegate to new lib/db.ts implementation
746e01c Phase 2: Update API route to use single updateRequest function - replace individual update functions with single updateRequest call - update function imports to use new lib/db.ts - simplify request creation and update logic - maintain backward compatibility with existing API interface
2ca138d Phase 1: Implement new lib/db.ts with pure Neon SQL - replace simple db.ts with comprehensive CRUD operations - add error handling and logging wrapper - implement single updateRequest function to replace individual update functions - use template literals for all SQL queries - add proper TypeScript types and error handling

---

## 📋 Instructions for Future Assistants

**IMPORTANT: Dashboard Structure Rules**

1. **Never change the layout** - Keep the exact same structure and formatting

2. **Only update these fields:**
   - Date in "Last Updated" 
   - Branch name in "Current Branch"
   - Recent commits list (last 5 commits)
   - Kanban board (move feature branch to correct state)

3. **When creating a new feature branch:**
   - Remove previous feature from "Deployed to Production" row
   - Clear out all commits in "Recent Commits" section
   - Add new feature branch to "In Progress / Local" row

4. **Kanban progression:**
   - "No Feature Branch" → "In Progress / Local" → "Deployed to Preview" → "Deployed to Production"
   - Only one branch should be active at a time
   - Move branch name between rows as it progresses

5. **Preview Deployemnts:**
   - Update the "Last Preview URL:" section with latest URL from Vercel


**Example update pattern:**
- Update date: `2025-08-16 14:54` → `2025-08-16 15:30`
- Update branch: `neon-upstash-direct` → `feature/new-ui`
- Move branch in kanban: "In Progress / Local" → "Deployed to Preview"
- Update commits: Replace with 5 most recent commits
