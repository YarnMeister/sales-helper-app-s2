#!/bin/bash

# Flow Metrics Test Runner
# This script runs all the flow metrics related tests

echo "🧪 Running Flow Metrics Tests..."
echo "=================================="

# Set environment variables for testing
export NODE_ENV=test
export DATABASE_URL="postgresql://test:test@localhost:5432/test_db"
export PIPEDRIVE_API_TOKEN="test_token"

# Run database function tests
echo "📊 Testing Database Functions..."
npm test -- tests/unit/canonical-stage-mappings.test.ts --reporter=verbose

# Run API endpoint tests
echo "🔌 Testing API Endpoints..."
npm test -- tests/unit/canonical-mappings-api.test.ts --reporter=verbose

# Run Pipedrive flow data tests
echo "📈 Testing Pipedrive Flow Data..."
npm test -- tests/unit/pipedrive-flow-data.test.ts --reporter=verbose

# Run UI component tests
echo "🎨 Testing UI Components..."
npm test -- tests/unit/flow-metrics-ui.test.tsx --reporter=verbose

# Run integration tests
echo "🔗 Testing Integration Flows..."
npm test -- tests/integration/flow-metrics-integration.test.ts --reporter=verbose

# Run all flow metrics tests together
echo "🚀 Running All Flow Metrics Tests..."
npm test -- tests/unit/canonical-stage-mappings.test.ts tests/unit/canonical-mappings-api.test.ts tests/unit/pipedrive-flow-data.test.ts tests/unit/flow-metrics-ui.test.tsx tests/integration/flow-metrics-integration.test.ts --reporter=verbose

echo "✅ Flow Metrics Tests Complete!"
echo "=================================="
