import path from 'node:path';
import { expect, test } from 'vitest';
import { validateEnvNames, writeEvidence } from './validate-env-names.cjs';

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
	expect(evidence.summary.nonCompliantCount).toBe(0);

	// After assertions pass, write the evidence file into this package's build-artifacts/
	const outPath = writeEvidence(evidence, { outDir: path.join(packageDir, 'build-artifacts') });
	console.log('Evidence written to', outPath);
});
