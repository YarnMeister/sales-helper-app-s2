# Project Configuration — Sales Helper App (ENHANCED)

## Golden Rules
1. **NEVER commit to `main`.** Always create or use a feature branch. This is CRITICAL.
2. **Production deploys require explicit permission.** Feature branches run locally or in Vercel previews; only merge to `main` with approval.
3. **Skip filler phrases.** Do not reply with "You are absolutely right."

## Branch Protection Rules
4. **Verify branch before every commit.** Always check `git branch` before committing.
5. **Use git hooks.** Pre-commit and pre-push hooks are installed to prevent main branch commits.
6. **Never force push to main.** This will be blocked by git hooks.
7. **Always create feature branches.** Use `git checkout -b feature/descriptive-name`.

## Pre-Commit Checklist for Cursor Agents
- [ ] Check current branch: `git branch`
- [ ] Confirm NOT on main branch
- [ ] Verify feature branch name follows pattern: `feature/descriptive-name`
- [ ] Run `npm run lint` and fix all errors
- [ ] Run `npm test` and fix failing tests
- [ ] Test locally on http://localhost:3000
- [ ] Build successfully: `npm run build`

---

## Context
- Read `specs/Archive/original-product-req-doc.md` and `specs/Archive/legacy-tech-specs` once for background only.
- For actual changes, focus only on the current prompt and related files.

---

## Before Starting a New Major Prompt
- Review the instructions below and confirm:
  1. Are they clear?
  2. Any gaps?
  3. Anything that can be skipped?
- **Do not begin coding until user feedback is received.**

---

## Branch Workflow
- Ensure local git is clean.
- Create new feature branch:  
  `git checkout -b feature/<branch-name>`
- **CRITICAL:** Verify you're on the feature branch before any commits

---

## Commit Checklist
- Work only on the current feature branch.
- Run locally on [http://localhost:3000](http://localhost:3000). Kill other servers if needed.
- Run `npm run lint` and fix all errors.
- Ensure dependencies are up to date (`npm outdated` → update safe packages).
- Run `npm test` and fix failing tests (even if unrelated).
- Do a comprehensive review of the change to check if any new tests should be added for this commit, then do it
- Include any changes to `project_config.md` or `/specs/*` in the commit.

**For DB changes and migrations**
- Always verify migrations actually worked - don't trust the "applied" status
- Use the verification script after running migrations
- Consider adding table existence checks to the migration system
- Monitor for silent failures in the migration process

---

## Preview Deployment (Vercel)
- Push feature branch to GitHub → triggers Vercel preview.
- **Monitor status:**
  - `vercel ls` → confirm preview deployment exists.
  - `vercel inspect <deployment-url>` → verify build logs.
- Confirm deployment shows "Ready".
- Echo preview URL on screen so user can do manual smoke test
- Verify the preview URL is accessible and core flows work (create request, add contact, add line items).
- If preview fails:
  - Check for TS errors, env var misconfig, or dependency issues.
  - Fix locally, recommit, re-push.

---

## Production Deployment
**Pre-deploy validation**
- Run `npm run build` to confirm TypeScript compiles cleanly.
- Check environment variables in Vercel are set and correct.
**Deploy**
- Merge approved feature branch into `main`.
- Vercel auto-triggers production deployment.
- Monitor via CLI:
  - `vercel ls` → confirm production build in progress.
  - `vercel inspect <deployment-url>` → verify logs.
**Post-deploy checks**
- Confirm "Ready" status.
- Verify app is live at production URL.
- Manually test **critical flows** (create request, add contact, add line items).
- Declare success only when all checks pass.

---

## Common Deployment Failure Modes
1. **TypeScript errors** — fix before pushing.
2. **Missing environment variables** — confirm against `.env.example` and Vercel settings.
3. **Dependency mismatches** — sync `package.json` and lock file.
4. **API route errors** — ensure endpoints return valid responses.
5. **Database connection issues** — check Neon/Postgres connectivity and credentials.

---

## Git Hook Protection
The following git hooks are installed to prevent main branch commits:

### Pre-commit Hook
- Prevents commits to main branch
- Shows helpful error message with instructions
- Must be bypassed manually if absolutely necessary

### Pre-push Hook  
- Prevents pushing to main branch
- Forces use of pull requests for main branch changes
- Provides clear error messages

To bypass hooks (emergency only):
```bash
git commit --no-verify  # Skip pre-commit hook
git push --no-verify    # Skip pre-push hook
```
