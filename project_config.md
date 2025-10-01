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

## Database Migrations (Drizzle ORM)

**Making Schema Changes**
1. Edit `lib/database/schema.ts` with your changes
2. Generate migration: `npm run db:generate`
   - Creates SQL file in `lib/database/migrations/`
   - Auto-generates migration name (e.g., `0001_fancy_spider.sql`)
3. Review the generated SQL file
4. Test locally: `npm run db:migrate` or `npm run db:push` (dev only)
5. Commit the migration file with your code changes

**Development Workflow**
- `npm run db:push` - Quick schema sync (dev only, bypasses migrations)
- `npm run db:migrate` - Run pending migrations
- `npm run db:reset-dev` - Nuclear option: drop all tables and recreate from schema
- `npm run db:studio` - Open Drizzle Studio (GUI for database)

**Production Workflow**
- Migrations run automatically during Vercel deployment
- Vercel build command: `npm run db:migrate && npm run build`
- Migrations are tracked in `__drizzle_migrations` table
- Only pending migrations are applied (idempotent)

**Migration Files**
- Location: `lib/database/migrations/`
- Format: `####_description.sql` (e.g., `0001_add_users_table.sql`)
- Never edit applied migrations - create new ones instead
- All migrations are committed to git

**Troubleshooting**
- If dev database gets out of sync: `npm run db:reset-dev`
- Check migration status: `node scripts/check-drizzle-migrations.js`
- View table list: `node scripts/check-db-tables.js`

---

## Preview Deployment (Vercel)
- SKIP preview deployments, we DO NOT use preview environment.

---

## Production Deployment
**Pre-deploy validation**
- Run `npm run build` to confirm TypeScript compiles cleanly.
- Verify any new migrations are committed and tested locally.
- Prompt user to confirm all required environment variables in Vercel are set and correct.
**Deploy**
- Merge approved feature branch into `main`.
- Vercel auto-triggers production deployment.
- Build command runs migrations automatically: `npm run db:migrate && npm run build`
- Monitor via CLI:
  - `vercel ls` → confirm production build in progress.
  - `vercel inspect <deployment-url>` → verify logs and migration success.

