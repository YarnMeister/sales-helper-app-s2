# Workflow State Dashboard

**Last Updated:** 2025-08-16 15:30  
**Project:** sales-helper-app-s2  
**Current Branch:** `main`

---

## 🚦 Workflow Kanban

| State                  | Branch                | Notes                |
|-------------------------|-----------------------|----------------------|
| No Feature Branch       |                       |                      |
| In Progress / Local     |                       |                      |
| Deployed to Preview     | `feature/preview-deployment-test-v2` | Successfully tested |
| Deployed to Production  | `main`                | Live at vercel.app   |

👉 Move the branch name as it progresses.

---

## 📝 Recent Commits
a323862 Remove actual Slack token from spec file, replace with placeholder
1faf67a Update SLACK_ALERT_WEBHOOK to SLACK_BOT_TOKEN for better Slack integration
d9694fa Add preview deployment test with health check API
d913f57 Complete clean build test - all systems working
86ab809 Clean build preparation - commit current state

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
