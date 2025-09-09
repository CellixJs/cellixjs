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

// Get affected packages using turbo
function getAffectedPackages(baseBranch = 'HEAD^1') {
  try {
    // Use turbo to get list of tasks that would run for affected packages
    const result = execSync(`npx turbo run build --filter='[${baseBranch}]' --dry-run`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    // Parse the output to extract package names
    const packages = [];
    const lines = result.split('\n');
    
    for (const line of lines) {
      // Look for lines like "@ocom/ui-community#build" or "docs#build"
      const match = line.match(/^([^#\s]+)#build\s*$/);
      if (match) {
        const packageName = match[1].trim();
        // Convert npm package name to directory name
        let dirName = packageName;
        if (packageName.startsWith('@cellix/')) {
          dirName = packageName.replace('@cellix/', 'cellix-');
        } else if (packageName.startsWith('@ocom/')) {
          dirName = packageName.replace('@ocom/', '');
        }
        packages.push(dirName);
      }
    }
    
    return packages;
  } catch (error) {
    console.error('Error getting affected packages:', error.message);
    return [];
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
      const affected = getAffectedPackages(baseBranch);
      const categories = categorizePackages(affected);
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
      const affected = getAffectedPackages(baseBranch);
      const categories = categorizePackages(affected);
      console.log(categories.frontend.length > 0);
      break;
    }
    
    case 'has-backend-changes': {
      const baseBranch = process.argv[3] || 'HEAD^1';
      const affected = getAffectedPackages(baseBranch);
      const categories = categorizePackages(affected);
      console.log(categories.backend.length > 0);
      break;
    }
    
    case 'get-affected-filter': {
      const baseBranch = process.argv[3] || 'HEAD^1';
      const type = process.argv[4]; // 'frontend' or 'backend'
      const affected = getAffectedPackages(baseBranch);
      const categories = categorizePackages(affected);
      
      const packages = type === 'frontend' ? categories.frontend : categories.backend;
      if (packages.length === 0) {
        console.log('--filter="nothing"');
      } else {
        const filter = packages.map(pkg => `--filter="${pkg}"`).join(' ');
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

export { categorizePackages, getAffectedPackages, isFrontendPackage, isExcludedPackage };