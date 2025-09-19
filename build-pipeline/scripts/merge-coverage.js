#!/usr/bin/env node

import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Simple LCOV merger that combines multiple lcov.info files
 */
function processLcovContent(content, packagePath) {
  const lines = content.split('\n');
  const processedLines = [];
  
  for (const line of lines) {
    if (line.startsWith('SF:')) {
      // Extract the file path after 'SF:'
      const filePath = line.substring(3);
      // Prefix with package path, ensuring no double slashes
      const prefixedPath = path.join(packagePath, filePath).replace(/\\/g, '/');
      processedLines.push(`SF:${prefixedPath}`);
    } else {
      processedLines.push(line);
    }
  }
  
  return processedLines.join('\n');
}

function mergeLcovFiles() {
  const rootDir = process.cwd();
  const outputFile = path.join(rootDir, 'coverage', 'lcov.info');
  
  // Create output directory
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Find all lcov.info files
  const lcovFiles = [];
  
  function findLcovFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.git') {
          findLcovFiles(fullPath);
        }
      } else if (entry.name === 'lcov.info' && fullPath.includes('/coverage/')) {
        lcovFiles.push(fullPath);
      }
    }
  }
  
  // Search in apps and packages directories
  const searchDirs = ['apps', 'packages'].filter(dir => 
    fs.existsSync(path.join(rootDir, dir))
  );
  
  for (const dir of searchDirs) {
    findLcovFiles(path.join(rootDir, dir));
  }
  
  console.log(`Found ${lcovFiles.length} LCOV files:`);
  lcovFiles.forEach(file => console.log(`  - ${file}`));
  
  if (lcovFiles.length === 0) {
    console.log('No LCOV files found. Creating empty coverage file.');
    fs.writeFileSync(outputFile, '');
    return;
  }
  
  // Merge all LCOV files
  let mergedContent = '';
  
  for (const lcovFile of lcovFiles) {
    try {
      const content = fs.readFileSync(lcovFile, 'utf8');
      if (content.trim()) {
        // Compute the package path relative to monorepo root
        const packageDir = path.dirname(path.dirname(lcovFile)); // Go up from coverage/ to package/
        const packagePath = path.relative(rootDir, packageDir);
        
        // Process the LCOV content to prefix SF: paths
        const processedContent = processLcovContent(content, packagePath);
        
        mergedContent += processedContent;
        if (!processedContent.endsWith('\n')) {
          mergedContent += '\n';
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read ${lcovFile}: ${error.message}`);
    }
  }
  
  // Write merged content
  fs.writeFileSync(outputFile, mergedContent);
  
  console.log(`Merged coverage report written to: ${outputFile}`);
  console.log(`Total size: ${mergedContent.length} characters`);
  
  // Count records
  const records = (mergedContent.match(/end_of_record/g) || []).length;
  console.log(`Coverage records: ${records}`);
}

// Run the merger
mergeLcovFiles();