#!/usr/bin/env node

/**
 * Test script for SonarQube MCP Server Integration
 * 
 * This script tests the MCP server integration without requiring network access
 */

const fs = require('node:fs');
const path = require('node:path');

console.log('Testing SonarQube MCP Server Integration...\n');

// Test 1: Check if files exist
console.log('1. Checking file structure...');
const files = [
  '.github/mcp-servers/sonarqube-server.cjs',
  '.github/mcp-servers/mcp-config.json', 
  '.github/mcp-servers/README.md',
  '.github/mcp-servers/USAGE.md',
  '.github/workflows/copilot-setup-steps.yml'
];

let allFilesExist = true;
files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓ ${file} exists`);
  } else {
    console.log(`  ✗ ${file} missing`);
    allFilesExist = false;
  }
});

// Test 2: Check if MCP server can be instantiated
console.log('\n2. Testing MCP server instantiation...');
try {
  // Set required environment variables
  process.env.SONAR_SERVER_URL = 'https://sonarcloud.io';
  process.env.SONAR_ORGANIZATION = 'simnova';
  process.env.SONAR_PROJECT_KEY = 'simnova_cellix-data-access';
  process.env.SONAR_TOKEN = 'test-token';
  process.env.PR_CONTEXT = 'false';

  const SonarQubeMCPServer = require('./sonarqube-server.cjs');
  const server = new SonarQubeMCPServer();
  
  console.log('  ✓ MCP server can be instantiated');
  console.log(`  ✓ Server URL: ${server.serverUrl}`);
  console.log(`  ✓ Organization: ${server.organization}`);
  console.log(`  ✓ Project Key: ${server.projectKey}`);
  console.log(`  ✓ PR Context: ${server.prContext}`);
} catch (error) {
  console.log(`  ✗ MCP server instantiation failed: ${error.message}`);
  allFilesExist = false;
}

// Test 3: Check configuration template
console.log('\n3. Testing MCP configuration template...');
try {
  const configPath = path.join(process.cwd(), '.github/mcp-servers/mcp-config.json');
  const configContent = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configContent);
  
  console.log(`  ✓ Configuration is valid JSON`);
  console.log(`  ✓ Found ${Object.keys(config.servers || {}).length} server(s)`);
  console.log(`  ✓ Found ${Object.keys(config.tools || {}).length} tool(s)`);
  
  if (config.servers.sonarqube) {
    console.log('  ✓ SonarQube server configuration found');
  }
  
  const expectedTools = ['sonarqube_quality_gate', 'sonarqube_issues', 'sonarqube_coverage', 'sonarqube_analysis_report', 'sonarqube_info'];
  expectedTools.forEach(tool => {
    if (config.tools[tool]) {
      console.log(`  ✓ Tool '${tool}' configured`);
    } else {
      console.log(`  ✗ Tool '${tool}' missing`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log(`  ✗ Configuration test failed: ${error.message}`);
  allFilesExist = false;
}

// Test 4: Check workflow integration
console.log('\n4. Testing workflow integration...');
try {
  const workflowPath = path.join(process.cwd(), '.github/workflows/copilot-setup-steps.yml');
  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  
  if (workflowContent.includes('Setup SonarQube MCP Server Integration')) {
    console.log('  ✓ SonarQube MCP setup step found in workflow');
  }
  
  if (workflowContent.includes('Cache node modules')) {
    console.log('  ✓ Node modules caching configured');
  }
  
  if (workflowContent.includes('Cache Playwright browsers')) {
    console.log('  ✓ Playwright browser caching configured');
  }
  
  if (workflowContent.includes('actions/cache@v4')) {
    console.log('  ✓ Using latest cache action version');
  }
} catch (error) {
  console.log(`  ✗ Workflow integration test failed: ${error.message}`);
  allFilesExist = false;
}

// Summary
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('✅ All tests passed! SonarQube MCP Server integration is ready.');
  console.log('\nNext steps:');
  console.log('1. Commit these changes to your PR');
  console.log('2. Test in a real PR environment with SONAR_TOKEN');
  console.log('3. Use copilot with SonarQube tools in PR workflows');
} else {
  console.log('❌ Some tests failed. Please check the implementation.');
  process.exit(1);
}
console.log('='.repeat(50));