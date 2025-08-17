# Workflow State Dashboard

**Last Updated:** 2025-01-27 14:30  
**Project:** sales-helper-app-s2  
**Current Branch:** `cleanup-supabase-tech-debt`

---

## 🚦 Workflow Kanban

| State                  | Branch                | Notes                |
|-------------------------|-----------------------|----------------------|
| No Feature Branch       |                       |                      |
| In Progress / Local     | `cleanup-supabase-tech-debt` | 🔧 Remove Supabase patterns, implement pure Neon SQL |
| Deployed to Preview     |                       |                      |
| Deployed to Production  |                       |                      |

---

## 📝 Recent Commits
5e219de Add Supabase tech debt cleanup documentation - add comprehensive cleanup guide for removing Supabase patterns - document pure Neon SQL implementation approach - include detailed API route refactoring instructions - prepare for systematic removal of Supabase client usage

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
