#!/usr/bin/env node

/**
 * Utility script to help with Turborepo selective builds based on frontend/backend changes
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const FRONTEND_PATTERNS = [
  'ui-*',
  'cellix-ui-core'
];

const EXCLUDED_PACKAGES = [
  'service-mongodb-memory-server',
  'service-oauth2-mock-server'
];

// Read package.json to get workspaces
function getWorkspacePackages() {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  return packageJson.workspaces.map(workspace => {
    const pkg = workspace.replace('packages/', '');
    return pkg;
  });
}

// Check if a package is frontend
function isFrontendPackage(packageName) {
  return FRONTEND_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(packageName);
    }
    return packageName === pattern;
  });
}

// Check if a package should be excluded from builds
function isExcludedPackage(packageName) {
  return EXCLUDED_PACKAGES.includes(packageName);
}

// Get affected packages using git diff instead of turbo (more reliable for selective builds)
function getAffectedPackages(baseBranch = 'HEAD^1') {
  try {
    // Get list of changed files, only in packages/ directory
    const result = execSync(`git diff --name-only ${baseBranch}...HEAD`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    const changedFiles = result.trim().split('\n').filter(file => file.trim());
    const affectedPackages = new Set();
    
    // Extract package names from changed files
    for (const file of changedFiles) {
      if (file.startsWith('packages/')) {
        const packagePath = file.split('/')[1];
        if (packagePath && !isExcludedPackage(packagePath)) {
          affectedPackages.add(packagePath);
        }
      }
    }
    
    // If no package files changed, but root files changed (like package.json, turbo.json),
    // we'll return empty array to indicate no selective build needed
    return Array.from(affectedPackages);
  } catch (error) {
    console.error('Error getting affected packages:', error.message);
    return [];
  }
}

// Get packages that depend on the given packages (using turbo to find dependents)
function getDependentPackages(affectedPackages) {
  if (affectedPackages.length === 0) {
    return [];
  }
  
  try {
    // Convert directory names to npm package names for turbo filters
    const packageNames = affectedPackages.map(pkg => {
      if (pkg.startsWith('cellix-')) {
        return `@cellix/${pkg.replace('cellix-', '')}`;
      } else if (pkg === 'docs') {
        return 'docs';
      } else if (!pkg.includes('/') && !pkg.startsWith('@')) {
        return `@ocom/${pkg}`;
      }
      return pkg;
    });
    
    // Use turbo to find all packages that depend on the affected packages
    const filter = packageNames.map(pkg => `--filter="${pkg}..."`).join(' ');
    const result = execSync(`npx turbo run build ${filter} --dry-run 2>/dev/null`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    // Extract package names from the "Packages in Scope" section
    const packages = [];
    const lines = result.split('\n');
    let inScopeSection = false;
    
    for (const line of lines) {
      if (line.includes('Packages in Scope')) {
        inScopeSection = true;
        continue;
      }
      if (inScopeSection && line.trim() === '') {
        break;
      }
      if (inScopeSection && line.includes('packages/')) {
        // Extract package directory from path like "packages/api-domain"
        const match = line.match(/packages\/([^\s]+)/);
        if (match) {
          const packageDir = match[1];
          if (!isExcludedPackage(packageDir)) {
            packages.push(packageDir);
          }
        }
      }
    }
    
    return [...new Set(packages)]; // Remove duplicates
  } catch (error) {
    console.error('Error getting dependent packages:', error.message);
    return affectedPackages; // Fall back to just the directly affected packages
  }
}

// Categorize packages into frontend/backend
function categorizePackages(packages) {
  const frontend = [];
  const backend = [];
  const excluded = [];
  
  packages.forEach(pkg => {
    if (isExcludedPackage(pkg)) {
      excluded.push(pkg);
    } else if (isFrontendPackage(pkg)) {
      frontend.push(pkg);
    } else {
      backend.push(pkg);
    }
  });
  
  return { frontend, backend, excluded };
}

// Main function
function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'categorize-affected': {
      const baseBranch = process.argv[3] || 'HEAD^1';
      const directlyAffected = getAffectedPackages(baseBranch);
      const allAffected = getDependentPackages(directlyAffected);
      const categories = categorizePackages(allAffected);
      console.log(JSON.stringify(categories, null, 2));
      break;
    }
    
    case 'categorize-all': {
      const allPackages = getWorkspacePackages();
      const categories = categorizePackages(allPackages);
      console.log(JSON.stringify(categories, null, 2));
      break;
    }
    
    case 'has-frontend-changes': {
      const baseBranch = process.argv[3] || 'HEAD^1';
      const directlyAffected = getAffectedPackages(baseBranch);
      const allAffected = getDependentPackages(directlyAffected);
      const categories = categorizePackages(allAffected);
      console.log(categories.frontend.length > 0);
      break;
    }
    
    case 'has-backend-changes': {
      const baseBranch = process.argv[3] || 'HEAD^1';
      const directlyAffected = getAffectedPackages(baseBranch);
      const allAffected = getDependentPackages(directlyAffected);
      const categories = categorizePackages(allAffected);
      console.log(categories.backend.length > 0);
      break;
    }
    
    case 'get-affected-filter': {
      const baseBranch = process.argv[3] || 'HEAD^1';
      const type = process.argv[4]; // 'frontend' or 'backend'
      const directlyAffected = getAffectedPackages(baseBranch);
      
      // If no packages are directly affected, return nothing filter
      if (directlyAffected.length === 0) {
        console.log('--filter="nothing"');
        break;
      }
      
      const allAffected = getDependentPackages(directlyAffected);
      const categories = categorizePackages(allAffected);
      
      const packages = type === 'frontend' ? categories.frontend : categories.backend;
      if (packages.length === 0) {
        console.log('--filter="nothing"');
      } else {
        // Convert directory names back to npm package names for turbo filters
        const packageNames = packages.map(pkg => {
          if (pkg.startsWith('cellix-')) {
            return `@cellix/${pkg.replace('cellix-', '')}`;
          } else if (pkg === 'docs') {
            return 'docs';
          } else if (!pkg.includes('/') && !pkg.startsWith('@')) {
            return `@ocom/${pkg}`;
          }
          return pkg;
        });
        const filter = packageNames.map(pkg => `--filter="${pkg}"`).join(' ');
        console.log(filter);
      }
      break;
    }
    
    default:
      console.log('Usage:');
      console.log('  node turbo-utils.js categorize-affected [base-branch]');
      console.log('  node turbo-utils.js categorize-all');
      console.log('  node turbo-utils.js has-frontend-changes [base-branch]');
      console.log('  node turbo-utils.js has-backend-changes [base-branch]');
      console.log('  node turbo-utils.js get-affected-filter [base-branch] [frontend|backend]');
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { categorizePackages, getAffectedPackages, getDependentPackages, isFrontendPackage, isExcludedPackage };