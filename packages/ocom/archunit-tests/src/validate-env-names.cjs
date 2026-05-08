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

function getIgnoredRanges(text) {
	const ranges = [];
	let i = 0;
	while (i < text.length) {
		const ch = text[i];
		const next = text[i + 1];

		if (ch === '/' && next === '/') {
			const start = i;
			i += 2;
			while (i < text.length && text[i] !== '\n') i++;
			ranges.push([start, i]);
			continue;
		}

		if (ch === '/' && next === '*') {
			const start = i;
			i += 2;
			while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
			i = Math.min(i + 2, text.length);
			ranges.push([start, i]);
			continue;
		}

		if (ch === "'" || ch === '"' || ch === '`') {
			const quote = ch;
			const start = i;
			i += 1;
			while (i < text.length) {
				if (text[i] === '\\') {
					i += 2;
					continue;
				}
				if (text[i] === quote) {
					i += 1;
					break;
				}
				i += 1;
			}
			ranges.push([start, i]);
			continue;
		}

		i += 1;
	}
	return ranges;
}

function isIgnoredIndex(index, ranges) {
	return ranges.some(([start, end]) => index >= start && index < end);
}

function getLineNumber(text, index) {
	return text.slice(0, index).split(/\r?\n/).length;
}

function findEnvVarsInText(text, filePath) {
	const matches = [];
	const isEnvFile = /(^|\/)\.env(\.|$)/.test(filePath);
	if (isEnvFile) {
		const re = /^(VITE_[A-Z0-9_]+)\s*=/gm;
		let match = re.exec(text);
		while (match) {
			matches.push({ match: match[1], index: match.index });
			match = re.exec(text);
		}
		return matches;
	}

	const ignoredRanges = getIgnoredRanges(text);
	const pushMatch = (value, index) => {
		if (!value.startsWith('VITE_')) return;
		if (isIgnoredIndex(index, ignoredRanges)) return;
		matches.push({ match: value, index });
	};

	let re = /import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g;
	let match = re.exec(text);
	while (match) {
		pushMatch(match[1], match.index);
		match = re.exec(text);
	}

	re = /import\.meta\.env\[['"]([^'"]+)['"]\]/g;
	match = re.exec(text);
	while (match) {
		pushMatch(match[1], match.index);
		match = re.exec(text);
	}

	re = /const\s*\{([^}]*)\}\s*=\s*import\.meta\.env/g;
	match = re.exec(text);
	while (match) {
		if (!isIgnoredIndex(match.index, ignoredRanges)) {
			const innerRe = /\b(VITE_[A-Z0-9_]+)\b/g;
			let innerMatch = innerRe.exec(match[1]);
			while (innerMatch) {
				const innerIndex = match.index + match[0].indexOf(match[1]) + innerMatch.index;
				pushMatch(innerMatch[1], innerIndex);
				innerMatch = innerRe.exec(match[1]);
			}
		}
		match = re.exec(text);
	}

	re = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
	match = re.exec(text);
	while (match) {
		pushMatch(match[1], match.index);
		match = re.exec(text);
	}

	re = /process\.env\[['"]([^'"]+)['"]\]/g;
	match = re.exec(text);
	while (match) {
		pushMatch(match[1], match.index);
		match = re.exec(text);
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
			if (/\.(yml|yaml|env|json|tsx?|jsx?|cjs|mjs|txt)$/i.test(d) || /\/\.env(\..+)?$/.test(d)) filesToScan.add(d);
			continue;
		}
		for (const f of walkDir(d)) {
			if (/\.(yml|yaml|env|json|tsx?|jsx?|cjs|mjs|txt)$/i.test(f) || /\/\.env(\..+)?$/.test(f)) {
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
		const matches = findEnvVarsInText(text, filePath);
		for (const m of matches) {
			const variable = m.match;
			const relPath = `${path.relative(rootDir, filePath)}:${getLineNumber(text, m.index)}`;
			if (!variable.startsWith('VITE_APP_') && !variable.startsWith('VITE_COMMON_')) {
				results.push({
					variable,
					status: 'non_compliant',
					portal: 'UNKNOWN',
					ownerGroup: 'unknown',
					location: relPath,
					reason: 'Variable does not use VITE_APP_<PORTAL>_ or VITE_COMMON_ prefix',
				});
				continue;
			}
			let portal = 'UNKNOWN';
			let ownerGroup = 'unknown';
			let status = 'compliant';
			let reason;
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
					status = 'non_compliant';
					reason = 'Unknown VITE_APP_<PORTAL>_ value: portal is not registered';
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
				location: relPath,
				...(reason ? { reason } : {}),
			});
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
