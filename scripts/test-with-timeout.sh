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

# Run the test with timeout (macOS compatible)
if command -v gtimeout >/dev/null 2>&1; then
    # Use gtimeout if available (install with: brew install coreutils)
    gtimeout ${TIMEOUT}s npm test -- "$TEST_FILE" --run --reporter=verbose
elif command -v timeout >/dev/null 2>&1; then
    # Use timeout if available
    timeout ${TIMEOUT}s npm test -- "$TEST_FILE" --run --reporter=verbose
else
    # Fallback: run without timeout but with warning
    echo "⚠️  Warning: timeout command not available. Install with: brew install coreutils"
    echo "⚠️  Running tests without timeout protection..."
    npm test -- "$TEST_FILE" --run --reporter=verbose
fi

# Check exit code
EXIT_CODE=$?
if [ $EXIT_CODE -eq 124 ] || [ $EXIT_CODE -eq 143 ]; then
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
