#!/bin/bash

BRANCH=${1:-dev}
PROJECT="sales-helper-db"

echo "Running migrations on branch: $BRANCH"

export DATABASE_URL=$(neonctl connection-string --project $PROJECT --branch $BRANCH)
npm run db:migrate
