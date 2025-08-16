#!/bin/bash

# Clean Build Test Script
# This script tests everything we have so far

echo "🧪 Starting Clean Build Test..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test results
print_test() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}🔍 $1${NC}"
    echo "----------------------------------------"
}

# 1. Check Node.js and npm
print_section "Environment Check"
echo "Checking Node.js and npm versions..."

NODE_VERSION=$(node --version 2>/dev/null)
NPM_VERSION=$(npm --version 2>/dev/null)

if [ ! -z "$NODE_VERSION" ]; then
    print_test 0 "Node.js version: $NODE_VERSION"
else
    print_test 1 "Node.js not found"
fi

if [ ! -z "$NPM_VERSION" ]; then
    print_test 0 "npm version: $NPM_VERSION"
else
    print_test 1 "npm not found"
fi

# 2. Check project structure
print_section "Project Structure Check"
echo "Verifying essential files and directories..."

[ -f "package.json" ] && print_test 0 "package.json exists" || print_test 1 "package.json missing"
[ -f "tsconfig.json" ] && print_test 0 "tsconfig.json exists" || print_test 1 "tsconfig.json missing"
[ -f "next.config.js" ] && print_test 0 "next.config.js exists" || print_test 1 "next.config.js missing"
[ -d "lib" ] && print_test 0 "lib directory exists" || print_test 1 "lib directory missing"
[ -d "migrations" ] && print_test 0 "migrations directory exists" || print_test 1 "migrations directory missing"
[ -d "scripts" ] && print_test 0 "scripts directory exists" || print_test 1 "scripts directory missing"

# 3. Check core library files
print_section "Core Library Files"
echo "Checking essential TypeScript files..."

[ -f "lib/env.ts" ] && print_test 0 "lib/env.ts exists" || print_test 1 "lib/env.ts missing"
[ -f "lib/cache.ts" ] && print_test 0 "lib/cache.ts exists" || print_test 1 "lib/cache.ts missing"
[ -f "lib/database-utils.ts" ] && print_test 0 "lib/database-utils.ts exists" || print_test 1 "lib/database-utils.ts missing"
[ -f "lib/types/database.ts" ] && print_test 0 "lib/types/database.ts exists" || print_test 1 "lib/types/database.ts missing"

# 4. Check migration files
print_section "Database Migrations"
echo "Checking migration files..."

[ -f "migrations/001_initial_schema.sql" ] && print_test 0 "Initial schema migration exists" || print_test 1 "Initial schema migration missing"
[ -f "migrations/002_support_tables.sql" ] && print_test 0 "Support tables migration exists" || print_test 1 "Support tables migration missing"

# 5. Check scripts
print_section "Automation Scripts"
echo "Checking executable scripts..."

[ -f "scripts/migrate.js" ] && print_test 0 "migrate.js exists" || print_test 1 "migrate.js missing"
[ -f "scripts/env-check.js" ] && print_test 0 "env-check.js exists" || print_test 1 "env-check.js missing"
[ -f "scripts/setup-env.sh" ] && print_test 0 "setup-env.sh exists" || print_test 1 "setup-env.sh missing"
[ -f "scripts/migrate-env.sh" ] && print_test 0 "migrate-env.sh exists" || print_test 1 "migrate-env.sh missing"
[ -f "scripts/update-workflow-state.sh" ] && print_test 0 "update-workflow-state.sh exists" || print_test 1 "update-workflow-state.sh missing"

# Check if scripts are executable
[ -x "scripts/setup-env.sh" ] && print_test 0 "setup-env.sh is executable" || print_test 1 "setup-env.sh not executable"
[ -x "scripts/migrate-env.sh" ] && print_test 0 "migrate-env.sh is executable" || print_test 1 "migrate-env.sh not executable"
[ -x "scripts/update-workflow-state.sh" ] && print_test 0 "update-workflow-state.sh is executable" || print_test 1 "update-workflow-state.sh not executable"

# 6. Check documentation
print_section "Documentation"
echo "Checking documentation files..."

[ -f "README.md" ] && print_test 0 "README.md exists" || print_test 1 "README.md missing"
[ -f "SETUP.md" ] && print_test 0 "SETUP.md exists" || print_test 1 "SETUP.md missing"
[ -f "db-workflow-overview.md" ] && print_test 0 "db-workflow-overview.md exists" || print_test 1 "db-workflow-overview.md missing"
[ -f "workflow_state.md" ] && print_test 0 "workflow_state.md exists" || print_test 1 "workflow_state.md missing"
[ -f "project_config.md" ] && print_test 0 "project_config.md exists" || print_test 1 "project_config.md missing"

# 7. Check dependencies
print_section "Dependencies Check"
echo "Checking package.json dependencies..."

# Check if key dependencies are in package.json
grep -q '"pg"' package.json && print_test 0 "pg dependency found" || print_test 1 "pg dependency missing"
grep -q '"@upstash/redis"' package.json && print_test 0 "@upstash/redis dependency found" || print_test 1 "@upstash/redis dependency missing"
grep -q '"zod"' package.json && print_test 0 "zod dependency found" || print_test 1 "zod dependency missing"
grep -q '"next"' package.json && print_test 0 "next dependency found" || print_test 1 "next dependency missing"

# Check if Supabase is removed
grep -q '"@supabase/supabase-js"' package.json && print_test 1 "Supabase dependency still present" || print_test 0 "Supabase dependency removed"

# 8. Check environment configuration
print_section "Environment Configuration"
echo "Checking environment setup..."

[ -f "env.example" ] && print_test 0 "env.example exists" || print_test 1 "env.example missing"
[ -f ".env.local" ] && print_test 0 ".env.local exists" || print_test 1 ".env.local missing (you'll need to create this)"

# Check if env.example has the right variables
grep -q "DATABASE_URL" env.example && print_test 0 "DATABASE_URL in env.example" || print_test 1 "DATABASE_URL missing from env.example"
grep -q "REDIS_URL" env.example && print_test 0 "REDIS_URL in env.example" || print_test 1 "REDIS_URL missing from env.example"
grep -q "PIPEDRIVE_API_TOKEN" env.example && print_test 0 "PIPEDRIVE_API_TOKEN in env.example" || print_test 1 "PIPEDRIVE_API_TOKEN missing from env.example"

# 9. Test TypeScript compilation
print_section "TypeScript Compilation"
echo "Testing TypeScript compilation..."

if npm run build > /dev/null 2>&1; then
    print_test 0 "TypeScript compilation successful"
else
    print_test 1 "TypeScript compilation failed"
    echo -e "${YELLOW}Note: This might fail if .env.local is not configured${NC}"
fi

# 10. Test environment validation
print_section "Environment Validation"
echo "Testing environment validation script..."

if node scripts/env-check.js > /dev/null 2>&1; then
    print_test 0 "Environment validation script runs"
else
    print_test 1 "Environment validation script failed"
    echo -e "${YELLOW}Note: This will fail if .env.local is not configured${NC}"
fi

# 11. Test workflow state update
print_section "Workflow State Update"
echo "Testing workflow state update script..."

if ./scripts/update-workflow-state.sh > /dev/null 2>&1; then
    print_test 0 "Workflow state update script runs"
else
    print_test 1 "Workflow state update script failed"
fi

# Summary
echo -e "\n${BLUE}📊 Test Summary${NC}"
echo "=================================="
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo -e "${BLUE}📈 Total Tests: $TOTAL_TESTS${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Your setup is ready for development.${NC}"
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Configure your .env.local with actual credentials"
    echo "2. Run: npm run db:setup-dev"
    echo "3. Run: npm run db:migrate"
    echo "4. Run: npm run dev"
else
    echo -e "\n${RED}⚠️  Some tests failed. Please review the issues above.${NC}"
    echo -e "\n${YELLOW}Common fixes:${NC}"
    echo "1. Create .env.local with your credentials"
    echo "2. Run: npm install"
    echo "3. Check file permissions on scripts"
fi

echo -e "\n${BLUE}🔗 Useful Commands:${NC}"
echo "npm run env:check     - Check environment configuration"
echo "npm run db:setup-dev  - Set up development database"
echo "npm run db:migrate    - Run database migrations"
echo "npm run dev           - Start development server"
echo "npm run workflow:update - Update workflow state dashboard"
