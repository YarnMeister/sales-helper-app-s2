# Project Configuration — Sales Helper App

## Golden Rules
1. **Never commit to `main`.** Always create or use a feature branch.
2. **Production deploys require explicit permission.** Feature branches run locally or in Vercel previews; only merge to `main` with approval.

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

---

## Commit Checklist
- Always work in a feature branch, if one does not exist, create one.
- Run locally on [http://localhost:3000](http://localhost:3000). Kill other servers if needed.
- Run `npm run lint` and fix all errors.
- Ensure dependencies are up to date (`npm outdated` → update safe packages).
- Run `npm test` and fix failing tests (even if unrelated).
- Do a comprehensive review of the change to check if any new tests should be added for this commit, then do it
- Include any changes to `project_config.md` or `/specs/*` in the commit.
- Update README.md for any new major features or technical changes

---

## Preview Deployment (Vercel)
- SKIP preview deployments, we DO NOT use preview environment.

---

## Production Deployment
**Pre-deploy validation**
- Run `npm run build` to confirm TypeScript compiles cleanly.
- Prompt user to confirm all required environment variables in Vercel are set and correct.
**Deploy**
- Merge approved feature branch into `main`.
- Vercel auto-triggers production deployment.
- Monitor via CLI:
  - `vercel ls` → confirm production build in progress.
  - `vercel inspect <deployment-url>` → verify logs.

