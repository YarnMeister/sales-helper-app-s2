# Neon CLI Utilities Guide

This guide shows you how to use the optimized Neon CLI utilities for managing your database branches efficiently.

## 🚀 Quick Start

### Prerequisites
- Neon CLI installed: `sudo npm install -g neonctl`
- Authenticated with Neon: `neonctl me`

### Basic Commands

```bash
# List all branches
npm run neon:list

# Setup environment for current git branch
npm run neon:current

# Setup environment for specific branch
npm run neon:setup main

# Run migrations on a branch
npm run neon:migrate main

# Create a new branch
npm run neon:create feature/new-feature main

# Delete a branch
npm run neon:delete preview/feature/old-branch

# Clean up old preview branches
npm run neon:cleanup
```

## 📋 Available Commands

### `npm run neon:list`
Lists all branches in your Neon project with details:
- Branch ID and name
- Default status
- Current state (ready, active, etc.)
- Creation date

### `npm run neon:current`
Automatically detects your current git branch and sets up the environment:
- Gets connection strings for your current branch
- Updates `.env.local` with branch-specific settings
- Shows available branches if current branch doesn't exist

### `npm run neon:setup <branch-name>`
Sets up environment for a specific branch:
- Gets both pooled and unpooled connection strings
- Updates `.env.local` with branch-specific settings
- Preserves other environment variables

### `npm run neon:migrate <branch-name>`
Runs migrations on a specific branch:
- Uses unpooled connection string for migrations
- Runs all pending migrations
- Shows progress and results

### `npm run neon:create <branch-name> [parent-branch]`
Creates a new database branch:
- Defaults to `main` as parent if not specified
- Creates branch with same schema as parent
- Ready for immediate use

### `npm run neon:delete <branch-name>`
Safely deletes a branch:
- Confirms deletion with user input
- Removes branch and all its data
- Cannot be undone

### `npm run neon:cleanup`
Cleans up old preview branches:
- Finds branches older than 7 days
- Shows them for review
- Optionally deletes them

### `npm run neon:info <branch-name>`
Shows detailed information about a branch:
- Branch configuration
- Compute settings
- Storage usage
- Creation and activity timestamps

### `npm run neon:schema-diff [base] <compare>`
Compares schemas between branches:
- Shows differences in table structures
- Useful for reviewing changes
- Defaults to `main` as base branch

## 🔧 Advanced Usage

### Direct CLI Commands

You can also use the script directly:

```bash
# List branches
./scripts/neon-utils.sh list

# Create branch with specific parent
./scripts/neon-utils.sh create feature/new-feature preview/feature/test

# Compare schemas
./scripts/neon-utils.sh schema-diff main preview/feature/test

# Get help
./scripts/neon-utils.sh help
```

### Environment Variables

The utilities automatically handle:
- `DATABASE_URL` - Pooled connection for normal operations
- `DATABASE_URL_UNPOOLED` - Unpooled connection for migrations
- Preserves other environment variables from `.env`

### Branch Naming Conventions

Recommended branch naming:
- `main` - Production branch
- `dev` - Development branch
- `feature/feature-name` - Feature branches
- `preview/feature/feature-name` - Vercel preview branches

## 🏗️ Workflow Examples

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-feature
npm run neon:create feature/new-feature main

# 2. Setup environment
npm run neon:current

# 3. Run migrations
npm run neon:migrate feature/new-feature

# 4. Develop and test
npm run dev

# 5. Clean up when done
npm run neon:delete feature/new-feature
```

### Preview Deployment Workflow

```bash
# 1. Push to feature branch
git push origin feature/new-feature

# 2. Vercel creates preview branch automatically
# 3. Setup environment for preview branch
npm run neon:setup preview/feature/new-feature

# 4. Run migrations on preview branch
npm run neon:migrate preview/feature/new-feature

# 5. Test preview deployment
# 6. Clean up old preview branches periodically
npm run neon:cleanup
```

### Production Deployment Workflow

```bash
# 1. Merge to main
git checkout main
git merge feature/new-feature

# 2. Setup production environment
npm run neon:setup main

# 3. Run migrations on production
npm run neon:migrate main

# 4. Deploy to production
git push origin main
```

## 🔍 Troubleshooting

### Common Issues

**"Branch not found" error:**
```bash
# Check available branches
npm run neon:list

# Create the branch if needed
npm run neon:create branch-name main
```

**"Connection failed" error:**
```bash
# Check authentication
neonctl me

# Verify project access
neonctl projects list
```

**"Migration failed" error:**
```bash
# Check connection string
npm run neon:setup branch-name

# Verify database is accessible
npm run neon:info branch-name
```

### Debug Mode

Enable debug output:
```bash
# Set debug environment variable
export DEBUG=1
npm run neon:current
```

## 📊 Benefits of Using Neon CLI

### ✅ Advantages

1. **Automated Environment Setup**: No manual connection string management
2. **Branch Isolation**: Each feature gets its own database instance
3. **Safe Migrations**: Uses unpooled connections for schema changes
4. **Easy Cleanup**: Automated cleanup of old preview branches
5. **Schema Comparison**: Visual diff between branches
6. **Git Integration**: Automatic detection of current branch

### 🔄 Migration from Old Scripts

Old commands still work but are deprecated:
```bash
# Old way (still works)
npm run db:migrate-dev
npm run db:setup-dev

# New way (recommended)
npm run neon:migrate dev
npm run neon:setup dev
```

## 🎯 Best Practices

1. **Always use `neon:current`** when switching branches
2. **Run migrations after creating branches**
3. **Clean up preview branches** regularly
4. **Use descriptive branch names**
5. **Test migrations on preview branches** before production
6. **Keep main branch stable** and use feature branches for development

## 📚 Additional Resources

- [Neon CLI Documentation](https://neon.com/docs/reference/neon-cli)
- [Neon Branching Guide](https://neon.com/docs/introduction/branching)
- [Vercel + Neon Integration](https://neon.com/docs/guides/vercel)
