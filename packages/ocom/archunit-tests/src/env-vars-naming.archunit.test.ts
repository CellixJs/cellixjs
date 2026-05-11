import fs from 'node:fs';
import path from 'node:path';
import { afterAll, expect, test } from 'vitest';
import { CANONICAL_PORTALS, validateEnvNames, writeEvidence } from './validate-env-names.cjs';

const rootDir = path.resolve(__dirname, '../../../../');
const packageDir = path.resolve(__dirname, '../');
const testScratchRoot = path.join(packageDir, '.test-work');

const createScratchRoot = (prefix: string) => {
	const scratchRoot = path.join(testScratchRoot, `${prefix}-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
	fs.mkdirSync(scratchRoot, { recursive: true });
	return scratchRoot;
};

afterAll(() => {
	fs.rmSync(testScratchRoot, { recursive: true, force: true });
});

test('env vars naming compliance scan generates evidence file', () => {
	const evidence = validateEnvNames({ rootDir });
	// Basic sanity assertions (non-strict to avoid breaking builds)
	expect(evidence).toBeDefined();
	expect(evidence.evidenceType).toBe('env-var-naming-compliance');
	expect(typeof evidence.timestamp).toBe('string');
	expect(typeof evidence.buildId).toBe('string');
	expect(typeof evidence.commitSha).toBe('string');
	// Portals must include all canonical portals from ADR-0031 (sourced from validator)
	expect(evidence.portals).toEqual(expect.arrayContaining(CANONICAL_PORTALS));
	expect(Array.isArray(evidence.results)).toBe(true);
	expect(typeof evidence.summary).toBe('object');
	// Guard against misconfigured scan paths producing an empty result
	expect(evidence.summary.totalVariables).toBeGreaterThan(0);

	// Ensure every result object has required fields
	for (const r of evidence.results) {
		expect(typeof r.variable).toBe('string');
		expect(['compliant', 'non_compliant']).toContain(r.status);
		expect(typeof r.portal).toBe('string');
		expect(typeof r.ownerGroup).toBe('string');
		expect(typeof r.location).toBe('string');
	}

	// Enforce strict compliance: no non-compliant variables allowed
	const nonCompliantFromResults = evidence.results.filter((r) => r.status === 'non_compliant').length;
	expect(evidence.summary.nonCompliantCount).toBe(nonCompliantFromResults);
	expect(evidence.summary.nonCompliantCount).toBe(0);

	// After assertions pass, write the evidence file into this package's build-artifacts/
	const outPath = writeEvidence(evidence, { outDir: path.join(packageDir, 'build-artifacts') });
	console.log('Evidence written to', outPath);

	// Assert the evidence file was actually written and contains valid JSON
	expect(fs.existsSync(outPath)).toBe(true);
	const parsed = JSON.parse(fs.readFileSync(outPath, 'utf8'));
	expect(parsed.evidenceType).toBe('env-var-naming-compliance');
});

test('env vars naming compliance scan detects non-compliant variables', () => {
	const tmpRoot = createScratchRoot('env-vars-naming');
	try {
		// Construct the invalid var name at runtime so the scanner doesn't pick it up from this source file
		const invalidVar = `VITE_APP_${'UNKNOWNPORTAL'}_FOO`;
		fs.writeFileSync(path.join(tmpRoot, 'config.ts'), `const scope = import.meta.env.${invalidVar};\n`, 'utf8');

		const evidence = validateEnvNames({ rootDir: tmpRoot, scanPaths: [tmpRoot] });

		expect(evidence).toBeDefined();
		expect(Array.isArray(evidence.results)).toBe(true);
		expect(evidence.summary.nonCompliantCount).toBeGreaterThan(0);

		// Assert the specific offending variable and its portal/ownerGroup mapping
		const offending = evidence.results.find((r) => r.variable === invalidVar);
		expect(offending).toBeDefined();
		expect(offending?.status).toBe('non_compliant');
		expect(offending?.portal).toBe('UNKNOWNPORTAL');
		expect(offending?.ownerGroup).toBe('ocm-app-unknownportal');
	} finally {
		fs.rmSync(tmpRoot, { recursive: true, force: true });
	}
});

test('validateEnvNames maps VITE_COMMON_* and portal vars to correct portals and ownerGroups', () => {
	const tmpRoot = createScratchRoot('env-vars-mapping');
	try {
		// Use a .env.test file — dotfiles named .env.* are explicitly allowed by the scanner
		fs.writeFileSync(path.join(tmpRoot, '.env.test'), ['VITE_COMMON_API_ENDPOINT=https://example.com', 'VITE_APP_UI_COMMUNITY_B2C_CLIENTID=client-id'].join('\n'), 'utf8');

		const evidence = validateEnvNames({ rootDir: tmpRoot, scanPaths: [tmpRoot] });

		const commonVar = evidence.results.find((r) => r.variable === 'VITE_COMMON_API_ENDPOINT');
		expect(commonVar).toBeDefined();
		expect(commonVar?.portal).toBe('COMMON');
		expect(commonVar?.ownerGroup).toBe('ocm-common');

		const communityVar = evidence.results.find((r) => r.variable === 'VITE_APP_UI_COMMUNITY_B2C_CLIENTID');
		expect(communityVar).toBeDefined();
		expect(communityVar?.portal).toBe('UI_COMMUNITY');
		expect(communityVar?.ownerGroup).toBe('ocm-app-ui-community');
	} finally {
		fs.rmSync(tmpRoot, { recursive: true, force: true });
	}
});

test('validateEnvNames flags VITE_* vars that lack VITE_APP_ or VITE_COMMON_ prefix', () => {
	const tmpRoot = createScratchRoot('env-vars-prefix');
	try {
		const badVar = `VITE_${'FUNCTION'}_ENDPOINT`;
		fs.writeFileSync(path.join(tmpRoot, 'config.ts'), `const { ${badVar} } = import.meta.env;\n`, 'utf8');

		const evidence = validateEnvNames({ rootDir: tmpRoot, scanPaths: [tmpRoot] });

		const offending = evidence.results.find((r) => r.variable === badVar);
		expect(offending).toBeDefined();
		expect(offending?.status).toBe('non_compliant');
		expect(offending?.reason).toBe('Variable does not use VITE_APP_<PORTAL>_ or VITE_COMMON_ prefix');
	} finally {
		fs.rmSync(tmpRoot, { recursive: true, force: true });
	}
});

test('validateEnvNames flags VITE_APP_ vars with unknown portal name', () => {
	const tmpRoot = createScratchRoot('env-vars-unknown-portal');
	try {
		const badVar = `VITE_APP_${'UNKNOWNPORTAL'}_FOO`;
		fs.writeFileSync(path.join(tmpRoot, 'config.ts'), `const { ${badVar} } = import.meta.env;\n`, 'utf8');

		const evidence = validateEnvNames({ rootDir: tmpRoot, scanPaths: [tmpRoot] });

		const offending = evidence.results.find((r) => r.variable === badVar);
		expect(offending).toBeDefined();
		expect(offending?.status).toBe('non_compliant');
		expect(offending?.reason).toContain('Unknown VITE_APP_');
	} finally {
		fs.rmSync(tmpRoot, { recursive: true, force: true });
	}
});

test('validateEnvNames deduplicates results, excluding dist/ from scan', () => {
	const tmpRoot = createScratchRoot('env-vars-dedupe');
	try {
		const srcFile = path.join(tmpRoot, 'src', 'config.ts');
		const distFile = path.join(tmpRoot, 'dist', 'config.js');
		fs.mkdirSync(path.dirname(srcFile), { recursive: true });
		fs.mkdirSync(path.dirname(distFile), { recursive: true });

		// Use a compliant var name — constructed at runtime to avoid scanner false-positive
		const varName = `VITE_APP_UI_${'COMMUNITY'}_DEDUP_TEST`;
		const content = `const v = import.meta.env.${varName};\n`;
		fs.writeFileSync(srcFile, content, 'utf8');
		fs.writeFileSync(distFile, content, 'utf8');

		const evidence = validateEnvNames({ rootDir: tmpRoot, scanPaths: [tmpRoot] });

		// dist/ is in SKIP_DIRS so only the src file is scanned — exactly one result
		const resultsForVar = evidence.results.filter((r) => r.variable === varName);
		expect(resultsForVar).toHaveLength(1);
		expect(resultsForVar[0].location).toContain(path.join('src', 'config.ts'));
	} finally {
		fs.rmSync(tmpRoot, { recursive: true, force: true });
	}
});

test('validateEnvNames ignores variables that only appear in comments and string literals', () => {
	const tmpRoot = createScratchRoot('env-vars-ignored-ranges');
	try {
		const content = ['// VITE_APP_UI_COMMUNITY_FOO in a comment', 'const s = "VITE_APP_UI_COMMUNITY_BAR in a string";'].join('\n');

		fs.writeFileSync(path.join(tmpRoot, 'config.ts'), content, 'utf8');

		const evidence = validateEnvNames({ rootDir: tmpRoot, scanPaths: [tmpRoot] });

		expect(evidence.results).toEqual([]);
	} finally {
		fs.rmSync(tmpRoot, { recursive: true, force: true });
	}
});

test('validateEnvNames detects env access inside template literal expressions', () => {
	const tmpRoot = createScratchRoot('env-vars-template-expression');
	try {
		const content = 'const endpoint = `' + '$' + "{import.meta.env['VITE_APP_UI_COMMUNITY_API_ENDPOINT']}" + '`;\n';

		fs.writeFileSync(path.join(tmpRoot, 'config.ts'), content, 'utf8');

		const evidence = validateEnvNames({ rootDir: tmpRoot, scanPaths: [tmpRoot] });

		expect(evidence.results).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					variable: 'VITE_APP_UI_COMMUNITY_API_ENDPOINT',
					status: 'compliant',
					portal: 'UI_COMMUNITY',
				}),
			]),
		);
	} finally {
		fs.rmSync(tmpRoot, { recursive: true, force: true });
	}
});
