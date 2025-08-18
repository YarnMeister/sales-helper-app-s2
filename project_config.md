# Project Configuration - Sales Helper App

## 3 Golden rules for assistants to follow:
1. NEVER commit code to `main` branch, commit to feature branch. If no feature branch, create one
2. Always ask pemission before deploying to prod. Feature branches get tested in local host. Explixit permission needed to merge branches to `main`
3. Never say "You are absolutely right", this annoys the user. Always skip this line, just start with the next sentence. 

## Context
Before each new change, read `specs/Archive/original-product-req-doc.md` and `specs/Archive/legacy-tech-specs` as context only to get an overall idea of the app. For actual changes focus only on the current prompt details.

## Key questions for each new major prompt
- For each new prompt, before making changes, review the instructions below and confirm:
1. Are they clear?
2. Any gaps?  
3. Call out any parts we can skip

## Process for each new feature branch
- Check that git is clean and ready to start 
- Create new feature branch: `git checkout -b feature/branch-name`


## Process for each commit
- Commit to current working feature branch 
- Ensure commited changes are running locally on http://localhost:3000 foribly kill all other local servers and start lacal sever on port:3000
- Check for any linting errors with `npm run lint` and fix
- Ensure all dependencies are up to date
- Then run `npm test`
- Ensure all tests pass, fix any issues, even if they are unrelated to your change
- Include any untracked/recent changes to `project_confg.md` (this file) in the commit so no changes are lost


## Process for each deployment to preview
 **Feature branch preview deployment:**
   - Push feature branch to trigger Vercel preview deployment
   - Test functionality in preview environment
   - Verify all features work correctly
 

## Process for each deployment to prod
**Pre-deployment validation:**
   - Run `npm run build` to ensure TypeScript compilation succeeds
   - Verify environment variables are properly configured


**Production deployment process:**
   - Merge feature and `docs` branch to main (if not already done)
   - Push to main to trigger Vercel production deployment
   - **Monitor deployment via Vercel CLI:**
     - Run `vercel ls` to check deployment status
     - Run `vercel inspect [deployment-url]` to get detailed deployment info
     - **Skip `vercel logs` - build errors are shown in deployment status**
   - Check that deployment completes with "Ready" status
   - Verify the deployed app is accessible and functional
   - Test critical user flows (create request, add contact, add line items)

**Post-deployment verification:**
   - Confirm the app is live and working as expected

**Critical: Never declare deployment successful until all validation steps pass!**

## Deployment Pipeline Monitoring
- **Always check Vercel deployment status via CLI** before declaring success:
  - Use `vercel ls` to see all deployments and their status
  - Use `vercel inspect [url]` to get detailed deployment information
  - **Skip `vercel logs` - build errors are shown in deployment status**
- **Monitor deployment status** for TypeScript errors, missing dependencies, or environment issues
- **Test the deployed application** to ensure functionality works in production
- **Document any deployment failures** and their root causes
- **Implement automated testing** in CI/CD pipeline when possible

## Common Deployment Issues to Check
1. **TypeScript compilation errors** - Most common cause of deployment failures
2. **Missing environment variables** - Check Vercel environment configuration
3. **Dependency issues** - Ensure package.json and package-lock.json are in sync
4. **API route errors** - Verify all API endpoints are properly configured
5. **Database connection issues** - Check Neon database connectivity in production


