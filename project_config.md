# Project Configuration - Sales Helper App

## Context
Before each new change, read `specs/Archive/original-product-req-doc.md` and `specs/Archive/legacy-tech-specs` as context only to get an overall idea of the app. For actual changes focus only on the current prompt details.

## Key questions for each new major prompt
- For each new prompt, before making changes, review the instructions below and confirm:
1. Are they clear?
2. Any gaps?  
3. Call out any parts we can skip

## Process for each new feature branch
- Check that git is clean and ready to start 
- Create new branch and update workflow_state.md using instructions in that doc


## Process for each commit
- commit the code then run `npm test`
- ensure all tests pass, fix any issues
- describe any failed tests that you are unable to resovle in enough detail do the intent of the test is clear

## Process for each deployment to preview
 **Feature branch preview deployment:**
   - Push feature branch to trigger Vercel preview deployment
   - Test functionality in preview environment
   - Verify all features work correctly
   - Update workflow_state.md using instructions in that doc
   - Update the "Last Preview URL:" in workflow_state.md using latest preview URL from Vercel

## Process for each deployment to prod
**Pre-deployment validation:**
   - Run `npm run build` to ensure TypeScript compilation succeeds
  
   - Check for any linting errors with `npm run lint` (if available)
   - Verify environment variables are properly configured
   - Ensure all dependencies are up to date

**Production deployment process:**
   - Merge feature branch to main (if not already done)
   - Push to main to trigger Vercel production deployment
   - **Monitor deployment via Vercel CLI:**
     - Run `vercel ls` to check deployment status
     - Run `vercel inspect [deployment-url]` to get detailed deployment info
     - Run `vercel logs [deployment-url]` to check build logs for errors
   - Check that deployment completes with "Ready" status
   - Verify the deployed app is accessible and functional
   - Test critical user flows (create request, add contact, add line items)

**Post-deployment verification:**
   - Confirm the app is live and working as expected
   - Update workflow_state.md using instructions in that doc
   - Document any deployment issues or required manual steps

**Critical: Never declare deployment successful until all validation steps pass!**

## Deployment Pipeline Monitoring
- **Always check Vercel deployment status via CLI** before declaring success:
  - Use `vercel ls` to see all deployments and their status
  - Use `vercel inspect [url]` to get detailed deployment information
  - Use `vercel logs [url]` to check build and runtime logs for errors
- **Monitor build logs** for TypeScript errors, missing dependencies, or environment issues
- **Test the deployed application** to ensure functionality works in production
- **Document any deployment failures** and their root causes
- **Implement automated testing** in CI/CD pipeline when possible

## Common Deployment Issues to Check
1. **TypeScript compilation errors** - Most common cause of deployment failures
2. **Missing environment variables** - Check Vercel environment configuration
3. **Dependency issues** - Ensure package.json and package-lock.json are in sync
4. **API route errors** - Verify all API endpoints are properly configured
5. **Database connection issues** - Check Neon database connectivity in production


