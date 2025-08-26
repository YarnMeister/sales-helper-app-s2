#!/bin/bash

# Test script with timeout functionality
# Usage: ./scripts/test-with-timeout.sh <test-file> [timeout-seconds]

TEST_FILE=$1
TIMEOUT=${2:-180}  # Default 3 minutes

echo "Running tests with ${TIMEOUT}s timeout: $TEST_FILE"

# Function to handle timeout
timeout_handler() {
    echo "❌ Tests timed out after ${TIMEOUT} seconds"
    echo "🔍 This may indicate infinite loops or hanging tests"
    exit 1
}

# Set up timeout trap
trap timeout_handler SIGTERM

# Run the test with timeout
timeout ${TIMEOUT}s npm test -- "$TEST_FILE" --run --reporter=verbose

# Check exit code
EXIT_CODE=$?
if [ $EXIT_CODE -eq 124 ]; then
    echo "❌ Tests timed out after ${TIMEOUT} seconds"
    echo "🔍 This may indicate infinite loops or hanging tests"
    exit 1
elif [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Tests completed successfully"
    exit 0
else
    echo "❌ Tests failed with exit code $EXIT_CODE"
    exit $EXIT_CODE
fi
