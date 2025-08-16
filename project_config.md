# Project Configuration - Sales Helper App

## Context
Before each new change, read `specs/Archive/original-product-req-doc.md` as context only to get an overall idea of the app. For actual changes focus only on the current prompt details.


## Process for each new feature branch
1. Check that git is clean and ready to start 
2. Create new branch and update workflow_state.md using instructions in that doc

## Process for each new prompt
1. Update workflow_state.md using instructions in that doc
2. Update the Notes section in workfow_state.md if any production config is needed (like db migration or env config) for the previous change we just completed (if relevant)
For each new prompt, before making changes, review the instructions below and confirm:
1. Are they clear?
2. Any gaps?  
3. Call out any parts we can skip
4. Keep in mind this is a 2nd generation rewrite, Greenfield but based on learning from original app.


## Process for each deployment to prod
1. Always deploy to preview in Vercel first
2. Do the deployment
3. Update workflow_state.md using instructions in that doc


