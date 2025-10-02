# Project Configuration — Sales Helper App

## Golden Rules
1. **Never commit to `main`.** Always create or use a feature branch.
2. **Production deploys require explicit permission.** Feature branches run locally; only merge to `main` with approval.

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

## Database Migrations (WebSocket System)

**The 3-Step Workflow**
1. **Edit Schema**: Modify `lib/database/schema.ts` with your changes
2. **Generate Migration**: Run `npm run db:generate`
   - Creates SQL file in `lib/database/migrations/`
   - Auto-generates migration name (e.g., `0003_fancy_spider.sql`)
   - Updates `meta/_journal.json` automatically
3. **Run Migration**: Run `npm run db:migrate`
   - Uses WebSocket driver (supports multi-statement SQL)
   - Tracks in `drizzle.__drizzle_migrations` table
   - Idempotent (safe to run multiple times)

**Key Commands**
- `npm run db:migrate` - Run pending migrations (WebSocket driver)
- `npm run db:generate` - Generate migration from schema changes
- `npm run db:studio` - Open Drizzle Studio (GUI for database)
- `npm run db:push` - **DISABLED** (use db:migrate instead)

**Migration System Architecture**
- **Single folder**: `lib/database/migrations/`
- **Single runner**: `scripts/migrate-websocket.ts`
- **Tracking table**: `drizzle.__drizzle_migrations` (Drizzle standard)
- **Driver**: Neon WebSocket Pool (supports multi-statement SQL)
- **Configuration**: `drizzle.config.ts` points to `lib/database/migrations`

**Production Workflow**
- Migrations run automatically during Vercel deployment
- Build command: `npm run db:migrate && npm run build`
- Failures block deployment (prevents broken production state)
- Always test migrations locally before deploying

**Migration Best Practices**
- Never edit applied migrations - create new ones instead
- Always commit migration files with schema changes
- Test migrations locally before pushing to main
- Review generated SQL before committing
- Keep migrations small and focused

**Troubleshooting**
- See `.augment/rules/DATABASE_MIGRATIONS.md` for complete guide
- Check migration journal: `cat lib/database/migrations/meta/_journal.json`
- Verify tracking table: `SELECT * FROM drizzle.__drizzle_migrations ORDER BY id;`

---

## Preview Deployment (Vercel)
- SKIP preview deployments, we DO NOT use preview environment.

---

## Production Deployment

**Pre-deploy Validation**
1. **Build Test**: Run `npm run build` locally
   - Confirms TypeScript compiles cleanly
   - Runs migrations against dev database
   - Catches build errors before deployment
2. **Migration Check**: Verify migrations are ready
   - New migration files committed in `lib/database/migrations/`
   - Journal updated in `meta/_journal.json`
   - Migrations tested locally with `npm run db:migrate`
3. **Test Suite**: Run `npm test`
   - All tests passing
   - No regressions introduced
4. **Environment Variables**: Confirm Vercel settings
   - `DATABASE_URL` points to production database
   - All required env vars are set
   - No dev-only variables in production

**Deploy Process**
1. **Merge to Main**: Merge approved feature branch into `main`
2. **Auto-Deploy**: Vercel automatically triggers production deployment
3. **Build Command**: `npm run db:migrate && npm run build`
   - Migrations run first (WebSocket driver)
   - Build fails if migrations fail (prevents broken state)
   - TypeScript compilation happens after migrations
4. **Monitor Deployment**:
   - Check Vercel dashboard for deployment status
   - Review build logs for migration success
   - Verify no errors in production logs

**Post-Deploy Verification**
- Check `/api/health` endpoint responds
- Verify new features work as expected
- Monitor error logs for first 10 minutes
- Test critical user flows

