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

// Main function to detect affected packages and map to deployment groups
async function detectChanges() {
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

	// Run Turbo to get globally affected packages
	console.log('Running turbo to detect affected packages...');
	const turboCommand = `npx turbo run build --affected --dry-run=json`;
	const turboOutput = await runCommand(turboCommand);

	let affectedPackages = [];
	let globalError = false;

	if (turboOutput === 'COMMAND_FAILED') {
		globalError = true;
	} else {
		try {
			const turboData = JSON.parse(turboOutput);
			affectedPackages = turboData.packages ? turboData.packages.filter((pkg) => pkg !== '//') : [];
			console.log('Parsed affected packages:', affectedPackages.join(' '));
		} catch (error) {
			console.error('Failed to parse Turbo JSON output:', error.message);
			globalError = true;
		}
	}

	// Define deployment app configurations (using path filters for reliability)
	const appConfigs = [
		{ filter: './apps/api', variable: 'HAS_BACKEND_CHANGES' },
		{ filter: './apps/ui-community', variable: 'HAS_FRONTEND_CHANGES' },
		{ filter: './apps/docs', variable: 'HAS_DOCS_CHANGES' },
	];

	// Initialize flags
	let hasBackendChanges = false;
	let hasFrontendChanges = false;
	let hasDocsChanges = false;

	if (globalError) {
		// Fallback: assume all deployments are affected on global detection failure
		console.log('Global affected detection failed. Assuming all deployments are affected.');
		hasBackendChanges = true;
		hasFrontendChanges = true;
		hasDocsChanges = true;
	} else if (affectedPackages.length === 0) {
		// No changes detected globally
		console.log('No affected packages detected. Skipping all deployments.');
	} else {
		// Compute per-app changes by intersecting affected with each app's dependency scope
		const affectedSet = new Set(affectedPackages);
		console.log('Computing dependency scopes for each app...');

		const scopePromises = appConfigs.map(async (appConfig) => {
			const scopeCommand = `npx turbo run build --filter=${appConfig.filter} --dry-run=json`;
			const scopeOutput = await runCommand(scopeCommand);

			let scopePackages = [];
			let scopeError = false;

			if (scopeOutput === 'COMMAND_FAILED') {
				scopeError = true;
			} else {
				try {
					const scopeData = JSON.parse(scopeOutput);
					scopePackages = scopeData.packages ? scopeData.packages.filter((pkg) => pkg !== '//') : [];
				} catch (error) {
					console.error(`Failed to parse scope JSON for ${appConfig.filter}:`, error.message);
					scopeError = true;
				}
			}

			// If scope detection has an error, conservatively assume affected (to avoid missing deploys)
			if (scopeError) {
				console.warn(`Scope detection error for ${appConfig.filter}; assuming affected.`);
				return { config: appConfig, hasChanges: true };
			}

			const scopeSet = new Set(scopePackages);
			const hasIntersect = Array.from(affectedSet).some((pkg) => scopeSet.has(pkg));

			console.log(`${appConfig.filter} scope packages:`, scopePackages.join(' '));
			console.log(`${appConfig.filter} affected: ${hasIntersect}`);

			return { config: appConfig, hasChanges: hasIntersect };
		});

		const results = await Promise.all(scopePromises);

		for (const result of results) {
			if (result.hasChanges) {
				switch (result.config.variable) {
					case 'HAS_BACKEND_CHANGES':
						hasBackendChanges = true;
						break;
					case 'HAS_FRONTEND_CHANGES':
						hasFrontendChanges = true;
						break;
					case 'HAS_DOCS_CHANGES':
						hasDocsChanges = true;
						break;
				}
			}
		}
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