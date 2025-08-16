#!/bin/bash

# Neon CLI Utilities for Sales Helper App
# This script provides optimized commands for managing Neon database branches

set -e

# Configuration
PROJECT_ID="solitary-art-52761452"
PROJECT_NAME="sales-helper-db"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Get current branch name from git
get_current_branch() {
    git branch --show-current 2>/dev/null || echo "unknown"
}

# Get connection string for a branch
get_connection_string() {
    local branch_name=$1
    local use_unpooled=${2:-false}
    
    if [ "$use_unpooled" = "true" ]; then
        neonctl connection-string --project-id $PROJECT_ID --branch "$branch_name" --pooled false
    else
        neonctl connection-string --project-id $PROJECT_ID --branch "$branch_name" --pooled true
    fi
}

# List all branches with details
list_branches() {
    log_info "Listing branches for project: $PROJECT_NAME"
    neonctl branches list --project-id $PROJECT_ID
}

# Create a new branch
create_branch() {
    local branch_name=$1
    local parent_branch=${2:-main}
    
    if [ -z "$branch_name" ]; then
        log_error "Branch name is required"
        echo "Usage: $0 create-branch <branch-name> [parent-branch]"
        exit 1
    fi
    
    log_info "Creating branch: $branch_name from parent: $parent_branch"
    neonctl branches create --project-id $PROJECT_ID --name "$branch_name" --parent "$parent_branch"
    log_success "Branch $branch_name created successfully"
}

# Delete a branch
delete_branch() {
    local branch_name=$1
    
    if [ -z "$branch_name" ]; then
        log_error "Branch name is required"
        echo "Usage: $0 delete-branch <branch-name>"
        exit 1
    fi
    
    log_warning "Are you sure you want to delete branch: $branch_name? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        log_info "Deleting branch: $branch_name"
        neonctl branches delete --project-id $PROJECT_ID --name "$branch_name"
        log_success "Branch $branch_name deleted successfully"
    else
        log_info "Branch deletion cancelled"
    fi
}

# Run migrations on a specific branch
migrate_branch() {
    local branch_name=$1
    
    if [ -z "$branch_name" ]; then
        log_error "Branch name is required"
        echo "Usage: $0 migrate <branch-name>"
        exit 1
    fi
    
    log_info "Running migrations on branch: $branch_name"
    
    # Get unpooled connection string for migrations
    export DATABASE_URL_UNPOOLED=$(get_connection_string "$branch_name" true)
    
    if [ -z "$DATABASE_URL_UNPOOLED" ]; then
        log_error "Failed to get connection string for branch: $branch_name"
        exit 1
    fi
    
    log_info "Using connection string: ${DATABASE_URL_UNPOOLED:0:50}..."
    
    # Run migrations
    npm run db:migrate
    
    log_success "Migrations completed on branch: $branch_name"
}

# Setup environment for a branch
setup_branch_env() {
    local branch_name=$1
    
    if [ -z "$branch_name" ]; then
        log_error "Branch name is required"
        echo "Usage: $0 setup-env <branch-name>"
        exit 1
    fi
    
    log_info "Setting up environment for branch: $branch_name"
    
    # Get both connection strings
    local pooled_cs=$(get_connection_string "$branch_name" false)
    local unpooled_cs=$(get_connection_string "$branch_name" true)
    
    if [ -z "$pooled_cs" ] || [ -z "$unpooled_cs" ]; then
        log_error "Failed to get connection strings for branch: $branch_name"
        exit 1
    fi
    
    # Create .env.local with branch-specific settings
    cat > .env.local << EOF
# Neon Database - $branch_name branch
DATABASE_URL=$pooled_cs
DATABASE_URL_UNPOOLED=$unpooled_cs

# Other environment variables (copy from .env if exists)
$(grep -v '^DATABASE_URL' .env 2>/dev/null || true)
EOF
    
    log_success "Environment setup complete for branch: $branch_name"
    log_info "Connection strings saved to .env.local"
}

# Clean up old preview branches
cleanup_preview_branches() {
    log_info "Cleaning up old preview branches..."
    
    # Get list of preview branches older than 7 days
    local branches=$(neonctl branches list --project-id $PROJECT_ID --output json | jq -r '.[] | select(.name | startswith("preview/")) | select(.created_at < "'$(date -d '7 days ago' -u +%Y-%m-%dT%H:%M:%SZ)'") | .name')
    
    if [ -z "$branches" ]; then
        log_info "No old preview branches found"
        return
    fi
    
    echo "$branches" | while read -r branch; do
        if [ -n "$branch" ]; then
            log_warning "Found old preview branch: $branch"
            delete_branch "$branch"
        fi
    done
}

# Get branch info
get_branch_info() {
    local branch_name=$1
    
    if [ -z "$branch_name" ]; then
        log_error "Branch name is required"
        echo "Usage: $0 info <branch-name>"
        exit 1
    fi
    
    log_info "Getting info for branch: $branch_name"
    neonctl branches get --project-id $PROJECT_ID --name "$branch_name"
}

# Compare schemas between branches
compare_schemas() {
    local base_branch=${1:-main}
    local compare_branch=$2
    
    if [ -z "$compare_branch" ]; then
        log_error "Compare branch is required"
        echo "Usage: $0 schema-diff [base-branch] <compare-branch>"
        exit 1
    fi
    
    log_info "Comparing schemas: $base_branch vs $compare_branch"
    neonctl branches schema-diff --project-id $PROJECT_ID "$base_branch" "$compare_branch"
}

# Show usage
show_usage() {
    echo "Neon CLI Utilities for Sales Helper App"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  list                    List all branches"
    echo "  create <name> [parent]  Create a new branch"
    echo "  delete <name>           Delete a branch"
    echo "  migrate <name>          Run migrations on a branch"
    echo "  setup-env <name>        Setup environment for a branch"
    echo "  cleanup                 Clean up old preview branches"
    echo "  info <name>             Get branch information"
    echo "  schema-diff [base] <compare>  Compare schemas between branches"
    echo "  current                 Setup environment for current git branch"
    echo "  help                    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 create feature/new-feature main"
    echo "  $0 migrate preview/feature/test"
    echo "  $0 setup-env main"
    echo "  $0 current"
}

# Handle current git branch
setup_current_branch() {
    local current_branch=$(get_current_branch)
    
    if [ "$current_branch" = "unknown" ]; then
        log_error "Not in a git repository or no branch detected"
        exit 1
    fi
    
    log_info "Current git branch: $current_branch"
    
    # Check if branch exists in Neon
    local branch_exists=$(neonctl branches list --project-id $PROJECT_ID --output json | jq -r ".[] | select(.name == \"$current_branch\") | .name")
    
    if [ -z "$branch_exists" ]; then
        log_warning "Branch '$current_branch' not found in Neon"
        log_info "Available branches:"
        neonctl branches list --project-id $PROJECT_ID --output table | grep -E "(main|preview)" || true
        echo ""
        log_info "Use '$0 create $current_branch' to create it, or '$0 setup-env <existing-branch>' to use an existing branch"
        exit 1
    fi
    
    setup_branch_env "$current_branch"
}

# Main command handler
case "${1:-help}" in
    "list")
        list_branches
        ;;
    "create")
        create_branch "$2" "$3"
        ;;
    "delete")
        delete_branch "$2"
        ;;
    "migrate")
        migrate_branch "$2"
        ;;
    "setup-env")
        setup_branch_env "$2"
        ;;
    "cleanup")
        cleanup_preview_branches
        ;;
    "info")
        get_branch_info "$2"
        ;;
    "schema-diff")
        compare_schemas "$2" "$3"
        ;;
    "current")
        setup_current_branch
        ;;
    "help"|*)
        show_usage
        ;;
esac
