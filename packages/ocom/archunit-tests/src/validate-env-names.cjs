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

function skipQuotedString(text, startIndex, quote) {
	let i = startIndex + 1;
	while (i < text.length) {
		if (text[i] === '\\') {
			i += 2;
			continue;
		}
		if (text[i] === quote) {
			return i + 1;
		}
		i += 1;
	}
	return i;
}

function skipTemplateExpression(text, startIndex, ranges) {
	let i = startIndex;
	let depth = 1;
	while (i < text.length && depth > 0) {
		const ch = text[i];
		const next = text[i + 1];

		if (ch === "'" || ch === '"') {
			i = skipQuotedString(text, i, ch);
			continue;
		}

		if (ch === '`') {
			i = skipTemplateLiteral(text, i, ranges);
			continue;
		}

		if (ch === '/' && next === '/') {
			i += 2;
			while (i < text.length && text[i] !== '\n') i++;
			continue;
		}

		if (ch === '/' && next === '*') {
			i += 2;
			while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
			i = Math.min(i + 2, text.length);
			continue;
		}

		if (ch === '{') {
			depth += 1;
			i += 1;
			continue;
		}

		if (ch === '}') {
			depth -= 1;
			i += 1;
			continue;
		}

		if (ch === '\\') {
			i += 2;
			continue;
		}

		i += 1;
	}
	return i;
}

function skipTemplateLiteral(text, startIndex, ranges) {
	let i = startIndex + 1;
	let literalStart = i;
	while (i < text.length) {
		if (text[i] === '\\') {
			i += 2;
			continue;
		}

		if (text[i] === '$' && text[i + 1] === '{') {
			// Mark template literal text (non-expression) as ignored before scanning the expression
			if (i > literalStart) {
				ranges.push([literalStart, i]);
			}
			// Skip the ${...} expression but do NOT add it to ignored ranges
			// so env-var access inside the expression is detected
			i = skipTemplateExpression(text, i + 2, ranges);
			literalStart = i;
			continue;
		}

		if (text[i] === '`') {
			// Mark final template literal text as ignored
			if (i > literalStart) {
				ranges.push([literalStart, i]);
			}
			return i + 1;
		}

		i += 1;
	}
	// Mark any remaining template literal text as ignored
	if (i > literalStart) {
		ranges.push([literalStart, i]);
	}
	return i;
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

		if (ch === "'" || ch === '"') {
			const start = i;
			i = skipQuotedString(text, i, ch);
			ranges.push([start, i]);
			continue;
		}

		if (ch === '`') {
			i = skipTemplateLiteral(text, i, ranges);
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
	// Handle both POSIX (/) and Windows (\) path separators for cross-platform compatibility
	const isEnvFile = filePath.includes('.env') && (/(^|\/)\.env(\.|$)/.test(filePath) || /(^|\\)\.env(\.|$)/.test(filePath));
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
				// handle UI_<NAME> style portals which have an underscore in the portal segment
				if (parts[0] === 'UI' && parts.length > 1) {
					portalSegment = `${parts[0]}_${parts[1]}`;
				}
				// Check against the single source of truth instead of hard-coding portal names
				if (CANONICAL_PORTALS.includes(portalSegment)) {
					portal = portalSegment;
					// owner groups follow the pattern ocm-app-<portal-name-in-kebab-case>
					ownerGroup = `ocm-app-${portalSegment.toLowerCase().replace(/_/g, '-')}`;
				} else {
					portal = portalSegment;
					ownerGroup = `ocm-app-${portalSegment.toLowerCase().replace(/_/g, '-')}`;
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
