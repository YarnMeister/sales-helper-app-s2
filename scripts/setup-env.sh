#!/bin/bash

BRANCH=${1:-dev}
PROJECT="sales-helper"

echo "Setting up environment for branch: $BRANCH"

# Get connection string
export DATABASE_URL=$(neonctl connection-string --project $PROJECT --branch $BRANCH)
export APP_ENV=local

echo "DATABASE_URL set for $BRANCH branch"
echo "Run: npm run db:migrate"
