# Turborepo Configuration

This document describes the Turborepo setup for CellixJS monorepo optimization, including selective builds, remote caching, and CI/CD integration.

## Overview

The CellixJS monorepo uses Turborepo to:
- Build and test only affected packages
- Cache build outputs locally and in CI/CD pipeline
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

### Local Development

Turborepo uses local caching by default to speed up subsequent builds:

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

### Caching Behavior

Turborepo automatically caches task outputs locally in the `.turbo` directory:
- **Local builds**: Subsequent builds of unchanged packages complete in ~160ms
- **CI/CD builds**: Azure Pipelines Cache@2 task preserves cache between runs
- **Selective execution**: Only changed packages and their dependents are rebuilt

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

### Caching in CI/CD

The Azure Pipelines use the Cache@2 task to preserve Turborepo cache between runs:
- **PR builds**: Cache helps speed up builds of unaffected packages 
- **Main builds**: Full cache restoration for optimal performance
- **Cache key**: Based on OS, package-lock.json, and source version
- **Fallback keys**: Progressively broader cache matching

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
- Local caching behavior

### package.json Scripts

Updated scripts use `turbo run` instead of `npm run --ws`:
- Better dependency handling
- Improved caching
- Selective execution capabilities

## Troubleshooting

### Common Issues

1. **"Could not resolve workspaces" error**
   - Ensure `packageManager` field is set in root `package.json`

2. **Local cache not working**
   - Check that outputs are correctly specified in turbo.json
   - Verify .turbo directory is not being cleared between runs

3. **Cache misses in CI**
   - Ensure Azure Cache@2 task is properly configured
   - Check that cache keys are consistent across runs

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
   - Azure Cache@2 sharing across pipeline runs
   - Reduced SonarCloud analysis time

3. **Developer Experience**
   - Faster feedback loops
   - Consistent local caching experience
   - Better build insights and debugging