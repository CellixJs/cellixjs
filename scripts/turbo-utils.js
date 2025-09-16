#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Frontend packages that require specific handling
 */
const FRONTEND_PACKAGES = [
  'ui-community',
  'ui-components', 
  'cellix-ui-core',
  'docs'
];

/**
 * Packages to exclude from builds
 */
const EXCLUDED_PACKAGES = [
  'cellix-mock-mongodb-memory-server',
  'cellix-mock-oauth2-server'
];

/**
 * Get all workspace packages from the repository
 */
function getAllPackages() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const workspaces = packageJson.workspaces || [];
    
    const packages = [];
    for (const workspace of workspaces) {
      // Extract package name from workspace path
      if (workspace.startsWith('apps/')) {
        const appName = workspace.replace('apps/', '');
        if (!EXCLUDED_PACKAGES.includes(appName)) {
          packages.push(appName);
        }
      } else if (workspace.startsWith('packages/')) {
        const parts = workspace.split('/');
        if (parts.length === 3) {
          // packages/cellix/ui-core -> cellix-ui-core
          if (parts[1] === 'cellix') {
            const packageName = `cellix-${parts[2]}`;
            if (!EXCLUDED_PACKAGES.includes(packageName)) {
              packages.push(packageName);
            }
          } else if (parts[1] === 'ocom') {
            const packageName = parts[2];
            if (!EXCLUDED_PACKAGES.includes(packageName)) {
              packages.push(packageName);
            }
          }
        }
      }
    }
    
    return packages;
  } catch (error) {
    console.error('Error reading packages:', error);
    return [];
  }
}

/**
 * Get packages that have changed based on git diff
 */
function getChangedPackages(baseBranch) {
  try {
    // Get changed files since base branch
    const changedFiles = execSync(`git diff --name-only ${baseBranch}`, { 
      encoding: 'utf8' 
    }).trim().split('\n').filter(Boolean);
    
    console.log(`Changed files since ${baseBranch}:`, changedFiles);
    
    const changedPackages = new Set();
    
    for (const file of changedFiles) {
      // Extract package name from file path
      if (file.startsWith('apps/')) {
        const appName = file.split('/')[1];
        if (appName && !EXCLUDED_PACKAGES.includes(appName)) {
          changedPackages.add(appName);
        }
      } else if (file.startsWith('packages/')) {
        const parts = file.split('/');
        if (parts.length >= 3) {
          // Handle nested package structure: packages/cellix/ui-core -> cellix-ui-core
          if (parts[1] === 'cellix') {
            const packageName = `cellix-${parts[2]}`;
            if (!EXCLUDED_PACKAGES.includes(packageName)) {
              changedPackages.add(packageName);
            }
          } else if (parts[1] === 'ocom') {
            const packageName = parts[2];
            if (!EXCLUDED_PACKAGES.includes(packageName)) {
              changedPackages.add(packageName);
            }
          } else {
            // Legacy structure
            const packageName = parts[1];
            if (!EXCLUDED_PACKAGES.includes(packageName)) {
              changedPackages.add(packageName);
            }
          }
        }
      }
    }
    
    const result = Array.from(changedPackages);
    console.log('Detected changed packages:', result);
    return result;
  } catch (error) {
    console.error('Error getting changed packages:', error);
    return [];
  }
}

/**
 * Get affected packages including dependencies
 */
function getAffectedPackages(baseBranch) {
  const changedPackages = getChangedPackages(baseBranch);
  
  if (changedPackages.length === 0) {
    return [];
  }
  
  try {
    // Use turbo to find affected packages including dependents
    const filterArgs = changedPackages.map(pkg => {
      if (pkg.startsWith('cellix-')) {
        return `@cellix/${pkg.substring(7)}`;
      } else if (pkg === 'docs') {
        return 'docs';
      } else {
        return `@ocom/${pkg}`;
      }
    }).join(' ');
    
    // For now, just return the directly changed packages
    // TODO: Add dependency resolution using turbo when needed
    return changedPackages;
  } catch (error) {
    console.error('Error getting affected packages:', error);
    return changedPackages;
  }
}

/**
 * Categorize packages into frontend and backend
 */
function categorizePackages(packages) {
  const frontend = packages.filter(pkg => FRONTEND_PACKAGES.includes(pkg));
  const backend = packages.filter(pkg => !FRONTEND_PACKAGES.includes(pkg));
  
  return { frontend, backend };
}

/**
 * Check if there are frontend changes
 */
function hasFrontendChanges(baseBranch) {
  const affected = getAffectedPackages(baseBranch);
  const categorized = categorizePackages(affected);
  return categorized.frontend.length > 0;
}

/**
 * Check if there are backend changes
 */
function hasBackendChanges(baseBranch) {
  const affected = getAffectedPackages(baseBranch);
  const categorized = categorizePackages(affected);
  return categorized.backend.length > 0;
}

/**
 * Categorize affected packages
 */
function categorizeAffected(baseBranch) {
  const affected = getAffectedPackages(baseBranch);
  return categorizePackages(affected);
}

/**
 * Categorize all packages
 */
function categorizeAll() {
  const allPackages = getAllPackages();
  return categorizePackages(allPackages);
}

// Main CLI handler
const command = process.argv[2];
const baseBranch = process.argv[3] || 'origin/main';

switch (command) {
  case 'has-frontend-changes':
    console.log(hasFrontendChanges(baseBranch));
    break;
  case 'has-backend-changes':
    console.log(hasBackendChanges(baseBranch));
    break;
  case 'categorize-affected':
    console.log(JSON.stringify(categorizeAffected(baseBranch)));
    break;
  case 'categorize-all':
    console.log(JSON.stringify(categorizeAll()));
    break;
  default:
    console.error('Usage: turbo-utils.js <command> [baseBranch]');
    console.error('Commands:');
    console.error('  has-frontend-changes [baseBranch]');
    console.error('  has-backend-changes [baseBranch]');
    console.error('  categorize-affected [baseBranch]');
    console.error('  categorize-all');
    process.exit(1);
}