# Workflow State Dashboard

**Last Updated:** 2025-01-27 11:30  
**Project:** sales-helper-app-s2  
**Current Branch:** `main`

---

## 🚦 Workflow Kanban

| State                  | Branch                | Notes                |
|-------------------------|-----------------------|----------------------|
| No Feature Branch       |                       |                      |
| In Progress / Local     |                       |                      |
| Deployed to Preview     |                       |                      |
| Deployed to Production  | `main` | ✅ Contacts & Products API with Caching + Data Display Tables |

---

## 📝 Recent Commits
37ff0b6 Add data display tables to main page - Create DataDisplay component showing contacts and products - Display hierarchical contact structure (Mine Group > Mine Name > Persons) - Show categorized products with pricing - Include summary statistics and data source indicators - Responsive design with loading states and error handling
971a2a6 Implement contacts and products APIs with caching - Add hierarchical transformation functions - Create /api/contacts route with cache fallback - Create /api/products route with cache fallback - Add unit tests for transformation functions - Update environment configuration
fa9ed0b Add comprehensive Neon CLI utilities for optimized database management
186c693 Replace Supabase patterns with centralized Neon SQL queries
673a35f Fix dynamic UPDATE query in requests API

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
