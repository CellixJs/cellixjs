# Turborepo Configuration

This document describes the Turborepo setup for CellixJS monorepo optimization, including selective builds, remote caching, and CI/CD integration.

## Overview

The CellixJS monorepo uses Turborepo to:
- Build and test only affected packages
- Cache build outputs locally and remotely 
- Optimize CI/CD pipeline performance
- Maintain frontend/backend package separation

## Package Categories

### Frontend Packages
- `ui-community` - Community UI application
- `ui-components` - Shared UI components
- `cellix-ui-core` - Core UI library

### Backend Packages
All packages except frontend and excluded packages (see below).

### Excluded Packages
These packages are not included in standard build/test pipelines:
- `service-mongodb-memory-server` - Test MongoDB server
- `service-oauth2-mock-server` - Test OAuth2 server

## Local Development

### Basic Commands

```bash
# Build all packages
npm run build

# Build only affected packages (since last commit)
npm run build:affected

# Test all packages  
npm run test

# Test only affected packages
npm run test:affected

# Run with coverage for affected packages
npm run test:coverage:affected

# Lint all packages
npm run lint

# Lint only affected packages  
npm run lint:affected
```

### Remote Caching Setup

To enable remote caching locally, set the following environment variables:

```bash
# Export in your shell or add to .env.local (not tracked in git)
export TURBO_TEAM="your-team-slug"
export TURBO_TOKEN="your-vercel-token"
```

#### Getting Vercel Credentials

1. **Team Slug**: Your Vercel team slug (found in Vercel dashboard URL)
2. **Token**: Create a Vercel API token:
   - Go to [Vercel Tokens](https://vercel.com/account/tokens)
   - Click "Create Token"
   - Select appropriate scope and expiration
   - Copy the generated token

### Using Local Cache Only

If you don't have remote cache credentials, Turbo will automatically fall back to local caching only:

```bash
# This works without TURBO_TEAM/TURBO_TOKEN
npm run build
```

## CI/CD Pipeline

### Change Detection

The pipeline automatically detects changes and categorizes them:

- **Frontend changes**: Any changes to `ui-*` or `cellix-ui-core` packages
- **Backend changes**: Changes to any other packages (excluding mock servers)
- **Mixed changes**: Changes affecting both frontend and backend

### Selective Builds

For Pull Requests and non-main branches:
- Only affected packages are built and tested
- SonarCloud analysis is scoped to affected packages only
- Coverage reports include only affected packages

For main branch:
- All packages are built and tested (full pipeline)

### Remote Cache Configuration

The CI pipeline uses Azure Pipeline variables:
- `TURBO_TEAM` - Vercel team slug (set in pipeline variables)
- `TURBO_TOKEN` - Vercel API token (set as secret variable)

## Utility Scripts

### Change Detection Script

The `scripts/turbo-utils.js` script provides utilities for package categorization:

```bash
# Categorize all packages
node scripts/turbo-utils.js categorize-all

# Categorize affected packages since HEAD^1
node scripts/turbo-utils.js categorize-affected HEAD^1

# Check if there are frontend changes
node scripts/turbo-utils.js has-frontend-changes HEAD^1

# Check if there are backend changes  
node scripts/turbo-utils.js has-backend-changes HEAD^1

# Get turbo filter for affected packages
node scripts/turbo-utils.js get-affected-filter HEAD^1 frontend
node scripts/turbo-utils.js get-affected-filter HEAD^1 backend
```

## Configuration Files

### turbo.json

The main Turborepo configuration defines:
- Task dependencies (`build` depends on `^build`)
- Output directories for caching
- Environment variables to consider for cache keys
- Remote caching enablement

### package.json Scripts

Updated scripts use `turbo run` instead of `npm run --ws`:
- Better dependency handling
- Improved caching
- Selective execution capabilities

## Troubleshooting

### Common Issues

1. **"Could not resolve workspaces" error**
   - Ensure `packageManager` field is set in root `package.json`

2. **Remote cache not working**
   - Verify `TURBO_TEAM` and `TURBO_TOKEN` are set correctly
   - Check Vercel token has appropriate permissions

3. **Cache misses in CI**
   - Ensure cache keys are consistent
   - Check that output directories are correctly specified

4. **Affected package detection not working**
   - Verify git history is available (fetchDepth: 0 in CI)
   - Check base branch reference is correct

### Debug Commands

```bash
# Show turbo configuration
npx turbo run build --dry-run

# Show cache hits/misses
npx turbo run build --summarize

# Clear local cache
npx turbo prune
```

## Performance Benefits

Expected improvements with Turborepo:

1. **Local Development**
   - 50-80% faster subsequent builds (cache hits)
   - Only rebuild changed packages and dependents

2. **CI/CD Pipeline**  
   - 30-60% faster PR builds (affected packages only)
   - Remote cache sharing across pipeline runs
   - Reduced SonarCloud analysis time

3. **Developer Experience**
   - Faster feedback loops
   - Consistent caching across team
   - Better build insights and debugging