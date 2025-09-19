#!/usr/bin/env node

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

// Load workspaces from package.json
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const workspaces = packageJson.workspaces || [];

// Helper function to get the workspace path for a package
function getWorkspacePathForPackage(pkg) {
	return workspaces.find((ws) => {
		try {
			const pkgJson = JSON.parse(readFileSync(`${ws}/package.json`, 'utf8'));
			return pkgJson.name === pkg;
		} catch {
			return false;
		}
	});
}

// Helper function to get tags for a package
function getPackageTags(_pkg, workspacePath) {
	try {
		const turboJsonPath = join(workspacePath, 'turbo.json');
		const turboJson = JSON.parse(readFileSync(turboJsonPath, 'utf8'));
		return turboJson.tags || [];
	} catch {
		// If turbo.json is missing or invalid, return empty tags
		return [];
	}
}

// Main function to detect affected packages
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
	}

	// Initialize flags
	let hasFrontendChanges = false;
	let hasBackendChanges = false;
	let hasDocsChanges = false;

	// Run Turbo to get affected packages
	console.log('Running turbo to detect affected packages...');
	const turboCommand = `npx turbo run build --affected --dry-run=json`;
	const turboOutput = await runCommand(turboCommand);

	let affectedPackages = [];

	// Parse Turbo output
	if (turboOutput === 'COMMAND_FAILED') {
		console.log(
			'Turbo command failed. Assuming all non-mock packages are affected.',
		);
		hasFrontendChanges = true;
		hasBackendChanges = true;
		hasDocsChanges = true;
	} else {
		try {
			const turboData = JSON.parse(turboOutput);
			affectedPackages = turboData.packages.filter((pkg) => pkg !== '//') || [];

			console.log('Parsed affected packages:', affectedPackages.join(' '));

			// If no packages found, skip deployments
			if (affectedPackages.length === 0) {
				console.log('No affected packages detected. Skipping deployments.');
				hasFrontendChanges = false;
				hasBackendChanges = false;
				hasDocsChanges = false;
			} else {
				// Process each affected package
				for (const pkg of affectedPackages) {
					console.log(`Processing package: ${pkg}`);
					// Find the workspace path for the package
					const workspacePath = getWorkspacePathForPackage(pkg);
					if (workspacePath) {
						// Get tags from package's turbo.json
						const tags = getPackageTags(pkg, workspacePath);
						console.log(`Tags for ${pkg}: ${tags.join(', ') || 'none'}`);

						// Categorize based on tags
						if (tags.includes('config')) {
							hasFrontendChanges = true;
							hasBackendChanges = true;
							hasDocsChanges = true;
							console.log(
								`Config package detected, marking all apps as affected: ${pkg}`,
							);
						} else if (tags.includes('frontend')) {
							hasFrontendChanges = true;
							console.log(`Frontend package detected: ${pkg}`);
						} else if (tags.includes('backend')) {
							hasBackendChanges = true;
							console.log(`Backend package detected: ${pkg}`);
						} else if (tags.includes('docs')) {
							hasDocsChanges = true;
							console.log(`Docs package detected: ${pkg}`);
						} else if (tags.includes('mock')) {
							console.log(
								`Mock package detected (no deployment impact): ${pkg}`,
							);
						}
						// If no tags are defined, default to backend (unless it's a known mock package)
						else if (
							![
								'@cellix/mock-mongodb-memory-server',
								'@cellix/mock-oauth2-server',
							].includes(pkg)
						) {
							hasBackendChanges = true;
							console.log(`No tags defined, treating as backend: ${pkg}`);
						}
					} else {
						console.log(
							`Ignoring invalid package: ${pkg} (not found in workspaces)`,
						);
					}
				}
			}
		} catch (error) {
			console.error('Failed to parse Turbo JSON output:', error.message);
			console.log(
				'Falling back to assuming all non-mock packages are affected.',
			);
			hasFrontendChanges = true;
			hasBackendChanges = true;
			hasDocsChanges = true;
		}
	}

	// Log final results
	console.log('Final results:');
	console.log(`Frontend changes: ${hasFrontendChanges}`);
	console.log(`Backend changes: ${hasBackendChanges}`);
	console.log(`Docs changes: ${hasDocsChanges}`);

	// Set pipeline variables
	setPipelineVariable('HAS_FRONTEND_CHANGES', hasFrontendChanges);
	setPipelineVariable('HAS_BACKEND_CHANGES', hasBackendChanges);
	setPipelineVariable('HAS_DOCS_CHANGES', hasDocsChanges);
}

// Execute the script
try {
	await detectChanges();
} catch (error) {
	console.error('Error in detect-changes.mjs:', error.message);
	process.exit(1);
}