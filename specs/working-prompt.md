Review the code base to understand how Line Items are added to new request

Objective: improve reliability of CRUD for Line Items

Issues:
1. Sometimes when I add a line item, a second phantom item is added to a request
2. Sometimes when I add multiple line items, let's say 3 items, then the 1st and 2nd items are deleted randomly

There is some sequencing or state management issues that is making the Add Line Item function unreliable and flakey.

Requirements:
1. Review the code and see if the root cause is obvious
2. If not obvious add logging and then write a manual test to smash the Add Line Item function to see if you can replicate the issue and fix
3. If the above does not work, revie the design and pospose a better design pattern that will be more reliable

I don't want all 3 requirements met, do the least to get us to the objective. Escalate to next requirement if the earlier is unscussessful 