# Workflow State Dashboard

**Last Updated:** 2025-01-27 10:00  
**Project:** sales-helper-app-s2  
**Current Branch:** `feature/submit-pipedrive-integration`

---

## 🚦 Workflow Kanban

| State                  | Branch                | Notes                |
|-------------------------|-----------------------|----------------------|
| No Feature Branch       |                       |                      |
| In Progress / Local     | `feature/submit-pipedrive-integration` | Submit & Pipedrive Integration API |
| Deployed to Preview     |                       |                      |
| Deployed to Production  |                 |  |

---


---

## 📝 Recent Commits
83872f9 Update project config and clear workflow state for new feature
f458d51 Update workflow state: database client utilities deployed to production
936924d Update project config: clarify production deployment notes instructions
4bb3d7d Update workflow state: database client utilities deployed to preview
d51bd15 Update workflow state: database client utilities complete
99eb0e4 Implement enhanced database client utilities with Neon PostgreSQL support
e6c4a75 Add product-req-spec-new.md to tracking
3dee751 Update workflow state: schema validation deployed to preview
915da6d Mark schema validation steps as complete in progress checklist
7a273c8 Implement core schema validation system with Zod
3fecc94 Remove section 1.3 from spec document and prepare for schema validation feature

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
