# Workflow State Dashboard

**Last Updated:** 2025-01-27 10:40  
**Project:** sales-helper-app-s2  
**Current Branch:** `main`

---

## 🚦 Workflow Kanban

| State                  | Branch                | Notes                |
|-------------------------|-----------------------|----------------------|
| No Feature Branch       |                       |                      |
| In Progress / Local     |                       |                      |
| Deployed to Preview     |                       |                      |
| Deployed to Production  | `main` | ✅ Complete: Pipedrive product mapping fixes - price extraction from prices array - short description and Show on Sales Helper field mapping - product filtering - all 157 tests passing - production deployment successful |

---

## 📝 Recent Commits
c88bd8a Update workflow state - mark price extraction fix as complete
55aaa50 Fix price extraction from Pipedrive - extract price from prices array instead of direct price field - update test data to include prices array structure - all 157 tests passing
c6c57a8 Fix Pipedrive product mapping - price and short description not pulling through - add Show on Sales Helper field - update product transformation to use correct custom field IDs - preserve both description and shortDescription fields - filter products by Show on Sales Helper field - update all type definitions and schemas - fix all tests to pass
6c7c156 Fix Show on Sales Helper field mapping - correct dropdown value mapping (79 = Yes, 78 = No) - remove debug logging - enable proper filtering
2e46889 Fix test data for Show on Sales Helper field mapping - update test values to match correct dropdown mapping (79 = Yes, 78 = No) - all 157 tests now passing


---

## 📋 Instructions for Future Assistants

**IMPORTANT: Dashboard Structure Rules**

1. **Never change the layout** - Keep the exact same structure and formatting

2. **Only update these fields:**
   - Date in "Last Updated" 
   - Branch name in "Current Branch"
   - Kanban board (move feature branch to correct state)


4. **Kanban progression:**
   - "No Feature Branch" → "In Progress / Local" → "Deployed to Preview" → "Deployed to Production"
   - Only one branch should be active at a time
   - Move branch name between rows as it progresses

5. **Preview Deployemnts:**
   


**Example update pattern:**
- Update date: `2025-08-16 14:54` → `2025-08-16 15:30`
- Update branch: `neon-upstash-direct` → `feature/new-ui`
- Move branch in kanban: "In Progress / Local" → "Deployed to Preview"
- Update commits: Replace with 5 most recent commits
