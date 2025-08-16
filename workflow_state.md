# Workflow State Dashboard

**Last Updated:** 2025-01-27 10:30  
**Project:** sales-helper-app-s2  
**Current Branch:** `feature/mock-submit-draft-requests`

---

## 🚦 Workflow Kanban

| State                  | Branch                | Notes                |
|-------------------------|-----------------------|----------------------|
| No Feature Branch       |                       |                      |
| In Progress / Local     | `feature/mock-submit-draft-requests` | 🔄 Saving submitted draft requests to mock-submit table |
| Deployed to Preview     |                       |                      |
| Deployed to Production  |                       |                      |

---

## 📝 Recent Commits
60e0472 feat: implement inline comment functionality - add comment types and interfaces - create CommentInput component with auto-save on blur - create CommentDisplay component for viewing comments - create CommentControl component for state management - integrate CommentControl into RequestCard - update main page to handle inline comment updates - add recently updated indicator for comment changes - remove old comment handling code
f52a4d9 fix: resolve API validation error for contact/line-item updates - fix RequestUpsert schema to only require salesperson info for new requests - remove debugging console.log statements - API now properly handles contact and line-item updates
ac3aeca feat: streamline contact and line-item selection flow - remove interim visual feedback and save buttons - make clicking immediately save to DB and navigate back - update ContactAccordion to remove selection highlighting - update ProductAccordion to remove Add buttons and selection summary - add loading overlays during save operations

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
