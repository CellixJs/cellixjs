#!/usr/bin/env node

const { exec } = require('node:child_process');
const { promisify } = require('node:util');

// Promisify exec for async/await
const execAsync = promisify(exec);

// Helper function to run shell commands and capture output
async function runCommand(command) {
	try {
		const { stdout } = await execAsync(command, { encoding: 'utf8' });
		return stdout.trim();
	} catch (error) {
		console.error(`Command failed: ${command}`);
		console.error(error.stderr || error.message);
		return 'COMMAND_FAILED';
	}
}

// Helper function to set Azure DevOps pipeline variable
function setPipelineVariable(name, value) {
	console.log(`##vso[task.setvariable variable=${name};isOutput=true]${value}`);
}

// Configuration constants
const FORCE_DEPLOY_VARS = {
	API: 'FORCE_DEPLOY_API',
	UI: 'FORCE_DEPLOY_UI',
	DOCS: 'FORCE_DEPLOY_DOCS'
};

const DEFAULT_FORCE_DEPLOY = {
	[FORCE_DEPLOY_VARS.API]: 'false',
	[FORCE_DEPLOY_VARS.UI]: 'false',
	[FORCE_DEPLOY_VARS.DOCS]: 'false'
};

const INFRA_PATTERNS = [
	'build-pipeline/**',
	'iac/**',
	'azure-pipelines.yml',
	'host.json'
];

const APP_CONFIGS = {
	backend: { filter: './apps/api', variable: 'HAS_BACKEND_CHANGES' },
	frontend: { filter: './apps/ui-community', variable: 'HAS_FRONTEND_CHANGES' },
	docs: { filter: './apps/docs', variable: 'HAS_DOCS_CHANGES' }
};

// Parse .force-deploy file and return force deploy settings
function parseForceDeployFile() {
	const fs = require('fs');
	const path = require('path');
	
	const forceDeployVars = { ...DEFAULT_FORCE_DEPLOY };
	const forceDeployPath = path.resolve('.force-deploy');
	
	if (!fs.existsSync(forceDeployPath)) {
		console.log('.force-deploy file not found, using default force deploy settings');
		return forceDeployVars;
	}
	
	try {
		const content = fs.readFileSync(forceDeployPath, 'utf8');
		const lines = content.split('\n');
		
		for (const line of lines) {
			const trimmed = line.trim();
			// Parse variable assignments like: FORCE_DEPLOY_API=true
			if (trimmed.startsWith(`${FORCE_DEPLOY_VARS.API}=`)) {
				forceDeployVars[FORCE_DEPLOY_VARS.API] = trimmed.split('=')[1] || 'false';
			} else if (trimmed.startsWith(`${FORCE_DEPLOY_VARS.UI}=`)) {
				forceDeployVars[FORCE_DEPLOY_VARS.UI] = trimmed.split('=')[1] || 'false';
			} else if (trimmed.startsWith(`${FORCE_DEPLOY_VARS.DOCS}=`)) {
				forceDeployVars[FORCE_DEPLOY_VARS.DOCS] = trimmed.split('=')[1] || 'false';
			}
		}
		
		console.log('Parsed force deploy settings from .force-deploy file');
	} catch (error) {
		console.warn('Could not read .force-deploy file:', error.message);
	}
	
	return forceDeployVars;
}

// Check for infrastructure changes that affect deployments
async function checkInfrastructureChanges() {
	let hasInfraChanges = false;
	
	for (const pattern of INFRA_PATTERNS) {
		const gitCommand = `git diff --name-only ${process.env.TURBO_SCM_BASE} -- ${pattern}`;
		const infraOutput = await runCommand(gitCommand);
		if (infraOutput?.trim()) {
			console.log(`Infrastructure changes detected in: ${pattern}`);
			hasInfraChanges = true;
		}
	}
	
	return hasInfraChanges;
}

// Get affected packages from Turbo
async function getAffectedPackages() {
	const turboCommand = `npx turbo run build --affected --dry-run=json`;
	const turboOutput = await runCommand(turboCommand);
	
	if (turboOutput === 'COMMAND_FAILED') {
		return { packages: [], error: true };
	}
	
	try {
		const turboData = JSON.parse(turboOutput);
		const affectedPackages = turboData.packages ? turboData.packages.filter((pkg) => pkg !== '//') : [];
		console.log('Parsed affected packages:', affectedPackages.join(' '));
		return { packages: affectedPackages, error: false };
	} catch (error) {
		console.error('Failed to parse Turbo JSON output:', error.message);
		return { packages: [], error: true };
	}
}

// Check if specific app has changes
async function checkAppChanges(appConfig, affectedPackages) {
	const scopeCommand = `npx turbo run build --filter=${appConfig.filter} --dry-run=json`;
	const scopeOutput = await runCommand(scopeCommand);
	
	if (scopeOutput === 'COMMAND_FAILED') {
		console.warn(`Scope detection error for ${appConfig.filter}; assuming affected.`);
		return true;
	}
	
	try {
		const scopeData = JSON.parse(scopeOutput);
		const scopePackages = scopeData.packages ? scopeData.packages.filter((pkg) => pkg !== '//') : [];
		
		const affectedSet = new Set(affectedPackages);
		const scopeSet = new Set(scopePackages);
		const hasIntersect = Array.from(affectedSet).some((pkg) => scopeSet.has(pkg));
		
		console.log(`${appConfig.filter} scope packages:`, scopePackages.join(' '));
		console.log(`${appConfig.filter} affected: ${hasIntersect}`);
		
		return hasIntersect;
	} catch (error) {
		console.error(`Failed to parse scope JSON for ${appConfig.filter}:`, error.message);
		console.warn(`Scope detection error for ${appConfig.filter}; assuming affected.`);
		return true;
	}
}
// Main function to detect affected packages and map to deployment groups
async function detectChanges() {
	const forceDeployVars = parseForceDeployFile();
	
	// Determine build context
	const buildReason = process.env.Build_Reason || 'Manual';
	const isPullRequest = buildReason === 'PullRequest';

	// Set TURBO_SCM_BASE for PR builds
	if (isPullRequest) {
		const targetBranch = `origin/${process.env.System_PullRequest_TargetBranch || 'main'}`;
		process.env.TURBO_SCM_BASE = targetBranch;
		console.log(`PR build - comparing current branch to: ${targetBranch}`);
	} else {
		console.log(`Push build - comparing to previous commit (HEAD~1)`);
		process.env.TURBO_SCM_BASE = 'HEAD~1';
	}

	// Check for infrastructure changes
	console.log('Checking for infrastructure and configuration changes...');
	const hasInfraChanges = await checkInfrastructureChanges();

	// Get affected packages
	console.log('Running turbo to detect affected packages...');
	const { packages: affectedPackages, error: globalError } = await getAffectedPackages();

	// Determine whether any source packages are affected (distinct from infra/pipeline changes)
	// If Turbo failed (globalError) be conservative and treat this as source-changes = true
	let hasSourceChanges = false;
	if (globalError) {
		hasSourceChanges = true;
	} else {
		// Turbo returns an array of affected package ids; non-empty => source changes
		hasSourceChanges = Array.isArray(affectedPackages) && affectedPackages.length > 0;
	}

	// Export a pipeline variable for other tasks to consume
	setPipelineVariable('HAS_SOURCE_CHANGES', hasSourceChanges);
	console.log(`Source/package changes detected: ${hasSourceChanges}`);

	// Initialize deployment flags
	let hasBackendChanges = false;
	let hasFrontendChanges = false;
	let hasDocsChanges = false;

	if (globalError) {
		// Fallback: assume all deployments are affected on global detection failure
		console.log('Global affected detection failed. Assuming all deployments are affected.');
		hasBackendChanges = true;
		hasFrontendChanges = true;
		hasDocsChanges = true;
	} else if (affectedPackages.length === 0 && !hasInfraChanges) {
		// No changes detected globally and no infrastructure changes
		console.log('No affected packages or infrastructure changes detected. Skipping all deployments.');
	} else {
		// Check each app for changes
		const changeChecks = await Promise.all([
			checkAppChanges(APP_CONFIGS.backend, affectedPackages),
			checkAppChanges(APP_CONFIGS.frontend, affectedPackages),
			checkAppChanges(APP_CONFIGS.docs, affectedPackages)
		]);

		hasBackendChanges = changeChecks[0];
		hasFrontendChanges = changeChecks[1];
		hasDocsChanges = changeChecks[2];

		// If infrastructure changes detected, force deployment of all components
		if (hasInfraChanges) {
			console.log('Infrastructure changes detected - forcing deployment of all components');
			hasBackendChanges = true;
			hasFrontendChanges = true;
			hasDocsChanges = true;
		}
	}

	// Override with FORCE_DEPLOY_* env vars if set to true
	if (forceDeployVars[FORCE_DEPLOY_VARS.API] === 'true') {
		console.log('FORCE_DEPLOY_API=true detected, forcing API deployment');
		hasBackendChanges = true;
	}
	if (forceDeployVars[FORCE_DEPLOY_VARS.UI] === 'true') {
		console.log('FORCE_DEPLOY_UI=true detected, forcing UI deployment');
		hasFrontendChanges = true;
	}
	if (forceDeployVars[FORCE_DEPLOY_VARS.DOCS] === 'true') {
		console.log('FORCE_DEPLOY_DOCS=true detected, forcing Docs deployment');
		hasDocsChanges = true;
	}

	// Log final results
	console.log('Final results:');
	console.log(`Backend changes: ${hasBackendChanges}`);
	console.log(`Frontend changes: ${hasFrontendChanges}`);
	console.log(`Docs changes: ${hasDocsChanges}`);

	// Set pipeline variables
	setPipelineVariable('HAS_BACKEND_CHANGES', hasBackendChanges);
	setPipelineVariable('HAS_FRONTEND_CHANGES', hasFrontendChanges);
	setPipelineVariable('HAS_DOCS_CHANGES', hasDocsChanges);
}

// Execute the script
(async () => {
	try {
		await detectChanges();
	} catch (error) {
		console.error('Error in detect-changes.js:', error.message);
		process.exit(1);
	}
})();