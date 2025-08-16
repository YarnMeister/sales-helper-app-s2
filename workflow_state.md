# Workflow State Dashboard

**Last Updated:** 2025-08-16 16:30  
**Project:** sales-helper-app-s2  
**Current Branch:** `main`

---

## 🚦 Workflow Kanban

| State                  | Branch                | Notes                |
|-------------------------|-----------------------|----------------------|
| No Feature Branch       |                       |                      |
| In Progress / Local     |                       |                      |
| Deployed to Preview     |                       |                      |
| Deployed to Production  | `main`                | Schema validation live in production |

👉 Move the branch name as it progresses.

---

## 📝 Recent Commits
3dee751 Update workflow state: schema validation deployed to preview
915da6d Mark schema validation steps as complete in progress checklist
7a273c8 Implement core schema validation system with Zod
3fecc94 Remove section 1.3 from spec document and prepare for schema validation feature
a323862 Remove actual Slack token from spec file, replace with placeholder

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

**Example update pattern:**
- Update date: `2025-08-16 14:54` → `2025-08-16 15:30`
- Update branch: `neon-upstash-direct` → `feature/new-ui`
- Move branch in kanban: "In Progress / Local" → "Deployed to Preview"
- Update commits: Replace with 5 most recent commits
