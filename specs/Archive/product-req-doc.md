Usage/Volume Context
Number of users of the app: less than 10
Number of concurrent users: less than 3 at a time
Number of deals submitted: less than 10 requests a week 
Super low volume app, no need for designing for scale or massive performance


Main page:
Shared "outbox" for all draft and submitted deals
Filter for sales reps by name: Luyanda, James, Stefan and 
Filter for All Requests shows all deals and hides the "New Request" button

Each deal shows
- Unique ID: QR-xxx where xxx is a 3 digit integer e.g QR-001
- Status: Draft, Submitted - these two states managed by the app internalle
- Status: several statusses will be fetched from pipedrive later as the deal progresses in the pipedrive workflow
- Deal Link: Submitted deals show button linked to URL of Pipedrive deal 
- Contact: Mine name + Contact Name
- Line Items: Description and quantity
- Relevant sales person name who saved or submitted a given deal
 

Improved design for main page
When I click "New Request" it should show a blank, draft deal on the main page.
Remove the interim Edit Draft Page, the current app has 3 levels Main Page -> Edit Dart -> Add Contact/Line-Item. Trim it to Main Page -> Add Contact/Line-Item
Replace "Continue"/View Details" buttons with "Submit" button to trigger call to Pipedrive to submit that deal. 
Submit button disabled until Contact and at least 1 Line item added. 
Clicking submit will update the status from Draft to Submitted (shown in the status badge for that deal)
After Submit id done, show the "See Deal" button linked to the relevant item in Pipedrive
When I selected a Contact/Line Item and hit save it saves the state of the draft request to retain selected items
There are 3 button on the main oage: 
Add Contact: 
- Clicking this button navigates to existing pages to select Contacts
- Saving a contact shows the contact details instead of the Add button 
- I can delete the contact to show the Add button again
Add Line Item:
- Clicking theis buttons navigates to existing pages to select Products
- Saving a Product shows the contact details instead of the Add button 
- I can delete any line item. Once all line items deleted show the Add button again
Add Comment:
Clicking reveals a large text input box. 
If I click outside the box (lost focus) it will save the comment unless the box is empty, then restore the state to show "Add comment" button


Add Contact Page:
Shows a list of all Mine Groups
When I select a Mine Group, reveal all Mine Names for that group
When I select a Mine Name, reveal all Contacts (Persons) for than Mine Name
INdividual Contacts show email and phone number
Technical improvement required:
There is no need to persist contacts in a local DB, it is more important to get a full list of all contacts from Pipedrive as quickly and efficiently as possible
The data should be available to optimise for filtering by, Mine Group, Mine Name, Contact in the app. We will experiement with different UI patterns to suit sales reps search behaviour
Some level or retention is needed to make the mobile experience tollerant to unreliable wifi 
Contact list is between 200 - 500 contacts and unlikely to grow larger for a long time
Contacts change infrequently, like once a week for one or two individuals

Add Line Item:
Shows a list of all Product Groups
When I select a Product Group, reveal all Products for that group
Technical improvement required:
There is no need to persist products in a local DB, it is more important to get a full list of all products from Pipedrive as quickly and efficiently as possible
The data should be available to optimise for filtering by, Group or Products. We will experiement with different UI patterns to suit sales reps search behaviour
Some level or retention is needed to make the mobile experience tollerant to unreliable wifi 
Product list is between 200 - 500 products and unlikely to grow larger for a long time
Products change infrequently, like once a week for one or two individuals
Consolidate the Add Contacts and Add Item UI component design to ensure resuability and consistense: Same Accordion pattern, single row select. We don't need both single and multi-select variations (current version has several variations of the same ui components) 


Overall technical consideraitons
Keep the moving parts a little as possible
Simple mechanisms, super simple design
No relational DB implementation, keep it flat
Use Service Role for Supabase access, don't mix ANON keys with Service Role keys
Preferance for keeping to JSON format as much as possible
The helper app's job is to build the submit payload for a new Pipedrive deal in the simplest most robust way possbile that supports bulding up the Contact and Line-itmes over an extended period of time (can take a few days from starting a draft to submitting)
Optimise to fetcing raw data from Pipedrive each time and providing it in the format that the Frontend needs
Optimise for saving the data in a format that is ready to submit to pipedrive with fewest amount of handling and formatting

Security considerations
The main page is a shared outbox by design. Planning to implement basic Auth using Google Workspace account. Users can only access the app if they are logged into their Corporate Google Workspace accounts

Testing requirement
Unit tests for all feasible requirements above
One simple E2E test via Playwright to test submit process with one contact and one line item and a comment
Feature toggle via Environment Variable .env.local to post Pipedrive submit request to live or mock table. Need a simple but reliable method for getting confidence that the submit works without posting to Prod Pipedrive URL

Other considerations
There is a menu item with Check-in, Contact List, Price List which we will refactor seperately once the main app is working
