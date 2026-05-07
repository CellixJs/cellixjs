import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from 'vitest';
import { CANONICAL_PORTALS, validateEnvNames, writeEvidence } from './validate-env-names.cjs';

const rootDir = path.resolve(__dirname, '../../../../');
const packageDir = path.resolve(__dirname, '../');

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
	const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'env-vars-naming-'));
	try {
		// Construct the invalid var name at runtime so the scanner doesn't pick it up from this source file
		const invalidVar = `VITE_APP_${'UNKNOWNPORTAL'}_FOO`;
		fs.writeFileSync(path.join(tmpRoot, 'config.ts'), `const scope = import.meta.env.${invalidVar};\n`, 'utf8');

		const evidence = validateEnvNames({ rootDir: tmpRoot });

		expect(evidence).toBeDefined();
		expect(Array.isArray(evidence.results)).toBe(true);
		expect(evidence.summary.nonCompliantCount).toBeGreaterThan(0);
		expect(evidence.results.some((r) => r.status === 'non_compliant')).toBe(true);
	} finally {
		fs.rmSync(tmpRoot, { recursive: true, force: true });
	}
});
