#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const SKIP_DIRS = new Set(['node_modules', '.turbo', 'build-artifacts', 'dist', 'build', 'coverage', '.git', 'storybook-static', '.next']);

// Single source of truth for known portal identifiers (ADR-0031).
// Keep this list in sync with apps/docs/docs/portals/PORTAL_REGISTRY.md.
const CANONICAL_PORTALS = ['UI_COMMUNITY', 'UI_STAFF'];

function walkDir(dir, fileList = []) {
	const files = fs.readdirSync(dir, { withFileTypes: true });
	for (const file of files) {
		// Allow .env and .env.* files even though they start with a dot
		const isDotEnv = /^\.env(\..+)?$/.test(file.name);
		if (file.name.startsWith('.') && !isDotEnv) continue;
		const full = path.join(dir, file.name);
		if (file.isDirectory()) {
			if (SKIP_DIRS.has(file.name)) continue;
			walkDir(full, fileList);
		} else {
			fileList.push(full);
		}
	}
	return fileList;
}

function findEnvVarsInText(text) {
	const regex = /(VITE_APP_[A-Z0-9_]+|VITE_COMMON_[A-Z0-9_]+)/g;
	const matches = [];
	let match = regex.exec(text);
	while (match !== null) {
		matches.push({ match: match[0], index: match.index });
		match = regex.exec(text);
	}
	return matches;
}

function validateEnvNames(options = {}) {
	const rootDir = options.rootDir || process.cwd();

	// Default scan paths: restrict to areas that actually contain VITE_* variables.
	// Falls back to rootDir when options.scanPaths is provided (e.g. temp dirs in tests).
	const defaultScanPaths = options.scanPaths ?? [path.join(rootDir, 'apps'), path.join(rootDir, 'iac'), path.join(rootDir, 'build-pipeline'), path.join(rootDir, 'azure-pipelines.yml')];
	const scanDirs = defaultScanPaths;

	const filesToScan = new Set();
	for (const d of scanDirs) {
		if (!fs.existsSync(d)) continue;
		const stat = fs.statSync(d);
		if (stat.isFile()) {
			if (/\.(yml|yaml|env|json|tsx?|jsx?|cjs|mjs|txt)$/i.test(d)) filesToScan.add(d);
			continue;
		}
		for (const f of walkDir(d)) {
			if (/\.(yml|yaml|env|json|tsx?|jsx?|cjs|mjs|txt)$/i.test(f)) {
				filesToScan.add(f);
			}
		}
	}

	const results = [];
	for (const filePath of Array.from(filesToScan)) {
		let text;
		try {
			text = fs.readFileSync(filePath, 'utf8');
		} catch {
			continue;
		}
		const lines = text.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const matches = findEnvVarsInText(line);
			for (const m of matches) {
				const variable = m.match;
				let portal = 'UNKNOWN';
				let ownerGroup = 'unknown';
				let status = 'compliant';
				if (variable.startsWith('VITE_APP_')) {
					// extract portal name between VITE_APP_ and next _
					const rest = variable.replace('VITE_APP_', '');
					const parts = rest.split('_');
					let portalSegment = parts[0];
					// handle UI_COMMUNITY and UI_STAFF which start with UI_
					if (parts[0] === 'UI' && parts.length > 1) {
						portalSegment = `${parts[0]}_${parts[1]}`;
					}
					if (portalSegment === 'UI_COMMUNITY') {
						portal = 'UI_COMMUNITY';
						ownerGroup = 'ocm-app-ui-community';
					} else if (portalSegment === 'UI_STAFF') {
						portal = 'UI_STAFF';
						ownerGroup = 'ocm-app-ui-staff';
					} else {
						portal = portalSegment;
						ownerGroup = `ocm-app-${portalSegment.toLowerCase()}`;
						// unknown portal treated as non_compliant
						status = 'non_compliant';
					}
				} else if (variable.startsWith('VITE_COMMON_')) {
					portal = 'COMMON';
					ownerGroup = 'ocm-common';
				} else {
					status = 'non_compliant';
				}

				results.push({
					variable,
					status,
					portal,
					ownerGroup,
					location: `${path.relative(rootDir, filePath)}:${i + 1}`,
				});
			}
		}
	}

	const uniquePortals = Array.from(new Set(results.map((r) => r.portal))).filter((p) => p && p !== 'UNKNOWN');
	const canonicalPortals = CANONICAL_PORTALS;
	const portals = Array.from(new Set([...canonicalPortals, ...uniquePortals])).filter((p) => p && p !== 'UNKNOWN');

	// Deduplicate: one entry per unique variable name, preferring source files over bundled output
	const isBundledPath = (loc) => /\/(dist|build|\.turbo|storybook-static)\//.test(loc);
	const deduped = new Map();
	for (const r of results) {
		const existing = deduped.get(r.variable);
		if (!existing || (isBundledPath(existing.location) && !isBundledPath(r.location))) {
			deduped.set(r.variable, r);
		}
	}
	const dedupedResults = Array.from(deduped.values());

	const nonCompliantCount = dedupedResults.filter((r) => r.status === 'non_compliant').length;

	const buildId = process.env.BUILD_BUILDID ?? process.env.BUILD_BUILDNUMBER ?? 'local';
	let commitSha = process.env.BUILD_SOURCEVERSION ? process.env.BUILD_SOURCEVERSION.slice(0, 8) : null;
	if (!commitSha) {
		try {
			// Read git HEAD directly from filesystem — avoids subprocess PATH resolution (S4036).
			// Supports both regular repos (.git dir) and git worktrees (.git pointer file).
			const gitPointer = path.join(rootDir, '.git');
			const gitStat = fs.statSync(gitPointer);
			let gitDir;
			let mainGitDir;
			if (gitStat.isFile()) {
				const raw = fs.readFileSync(gitPointer, 'utf8').trim();
				gitDir = raw.replace(/^gitdir:\s*/, '');
				mainGitDir = path.resolve(gitDir, '../..');
			} else {
				gitDir = gitPointer;
				mainGitDir = gitPointer;
			}
			const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
			const sha = head.startsWith('ref: ') ? fs.readFileSync(path.join(mainGitDir, head.slice(5)), 'utf8').trim() : head;
			commitSha = sha.slice(0, 8);
		} catch {
			commitSha = 'local';
		}
	}

	return {
		evidenceType: 'env-var-naming-compliance',
		timestamp: new Date().toISOString(),
		buildId,
		commitSha,
		portals,
		results: dedupedResults,
		summary: {
			totalVariables: dedupedResults.length,
			nonCompliantCount,
		},
		validatedBy: 'ArchUnit + packages/ocom/archunit-tests/src/validate-env-names.cjs',
		adrReference: 'ADR-0031',
	};
}

function writeEvidence(evidence, options = {}) {
	const outDir = options.outDir || path.join(options.rootDir || process.cwd(), 'build-artifacts');
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
	const outPath = path.join(outDir, 'env-var-compliance-evidence.json');
	fs.writeFileSync(outPath, JSON.stringify(evidence, null, 2), 'utf8');
	return outPath;
}

module.exports = { validateEnvNames, writeEvidence, CANONICAL_PORTALS };

if (require.main === module) {
	const evidence = validateEnvNames();
	writeEvidence(evidence);
	console.log('Wrote evidence to build-artifacts/env-var-compliance-evidence.json');
}
