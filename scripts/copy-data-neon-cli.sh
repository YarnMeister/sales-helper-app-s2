#!/bin/bash

# Copy data from production to test database using Neon CLI
# This script assumes you have the Neon CLI installed and configured

set -e

echo "🔄 Copying data from production to test database..."

# Check if neon CLI is installed
if ! command -v neon &> /dev/null; then
    echo "❌ Neon CLI not found. Please install it first:"
    echo "   npm install -g @neondatabase/cli"
    exit 1
fi

# Tables to copy
TABLES=("canonical_stage_mappings" "flow_metrics_config" "pipedrive_deal_flow_data")

for table in "${TABLES[@]}"; do
    echo "📋 Copying $table..."
    
    # Export data from production
    echo "📥 Exporting from production..."
    neon sql --database neondb --branch main --command "COPY (SELECT * FROM $table) TO STDOUT WITH CSV HEADER" > /tmp/${table}_prod.csv
    
    # Import data to test database
    echo "📤 Importing to test database..."
    neon sql --database neondb --branch test-db --command "COPY $table FROM STDIN WITH CSV HEADER" < /tmp/${table}_prod.csv
    
    # Clean up
    rm /tmp/${table}_prod.csv
    
    echo "✅ $table copied successfully"
done

echo "🎉 All data copied successfully!"
