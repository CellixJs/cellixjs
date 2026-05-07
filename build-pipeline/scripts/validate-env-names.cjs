#!/usr/bin/env node

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function walkDir(dir, fileList = []) {
	const files = fs.readdirSync(dir, { withFileTypes: true });
	for (const file of files) {
		if (file.name.startsWith('.')) continue;
		const full = path.join(dir, file.name);
		if (file.isDirectory()) {
			// skip noise directories
			if (file.name === 'node_modules' || file.name === '.turbo' || file.name === 'build-artifacts') continue;
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
	let m;
	while ((m = regex.exec(text)) !== null) {
		matches.push({ match: m[0], index: m.index });
	}
	return matches;
}

function validateEnvNames(options = {}) {
	const rootDir = options.rootDir || process.cwd();
	const scanDirs = [rootDir, path.join(rootDir, 'build-pipeline')];

	const filesToScan = new Set();
	for (const d of scanDirs) {
		if (!fs.existsSync(d)) continue;
		for (const f of walkDir(d)) {
			// only scan certain file types to reduce noise
			if (/\.(yml|yaml|env|json|ts|js|cjs|mjs|txt)$/i.test(f) || /azure-pipelines\.yml$/i.test(f)) {
				filesToScan.add(f);
			}
		}
	}

	const results = [];
	for (const filePath of Array.from(filesToScan)) {
		let text;
		try {
			text = fs.readFileSync(filePath, 'utf8');
		} catch (e) {
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
	const canonicalPortals = ['UI_COMMUNITY', 'UI_STAFF'];
	const portals = Array.from(new Set([...canonicalPortals, ...uniquePortals])).filter((p) => p && p !== 'UNKNOWN');
	const nonCompliantCount = results.filter((r) => r.status === 'non_compliant').length;

	const buildId = process.env.BUILD_BUILDID ?? process.env.BUILD_BUILDNUMBER ?? 'local';
	let commitSha = process.env.BUILD_SOURCEVERSION ? process.env.BUILD_SOURCEVERSION.slice(0, 8) : null;
	if (!commitSha) {
		try {
			commitSha = execSync('git rev-parse --short HEAD').toString().trim();
		} catch (e) {
			commitSha = 'local';
		}
	}

	return {
		evidenceType: 'env-var-naming-compliance',
		timestamp: new Date().toISOString(),
		buildId,
		commitSha,
		portals,
		results,
		summary: {
			totalVariables: results.length,
			nonCompliantCount,
		},
		validatedBy: 'ArchUnit + validate-env-names.cjs',
		adrReference: 'ADR-0031',
	};
}

function writeEvidence(evidence, options = {}) {
	const rootDir = options.rootDir || process.cwd();
	const outDir = path.join(rootDir, 'build-artifacts');
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
	const outPath = path.join(outDir, 'env-var-compliance-evidence.json');
	fs.writeFileSync(outPath, JSON.stringify(evidence, null, 2), 'utf8');
	return outPath;
}

module.exports = { validateEnvNames, writeEvidence };

if (require.main === module) {
	const evidence = validateEnvNames();
	writeEvidence(evidence);
	console.log('Wrote evidence to build-artifacts/env-var-compliance-evidence.json');
}
