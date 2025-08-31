Read @architecture-modularization-plan.md focus on phase 0 and phase 1, then review what we've achieved so far in the branch. Then I want you to compare main branch and the feature branch side-by-side for every instance in main where you see a reference so "mock_" tables you need to: 
1. confirm that we've successfully removed the reference to "Mock_" for that occurrence 
2. we've updated lib/db correctly for the new pattern and prod/test db split
3. We've maintained the intent of the action that was using the "Mock_" reference (comparing main to feature branch) no business logic change
4. run and update/add tests to ensure that particular instance is working and tested using the approach in @test-playbook.md 

We will do this multiple times until there are no more references of mock_ so expect to see lots of working senarios