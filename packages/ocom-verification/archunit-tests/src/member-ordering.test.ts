import path from 'node:path';
import { checkMemberOrdering } from '@cellix/archunit-tests/general';
import { describe, expect, it } from 'vitest';
import { getAllFiles } from './utils/source-files.js';

function getTypeScriptFiles(sourcePath: string, predicate: (filePath: string) => boolean = () => true): string[] {
	return getAllFiles(path.resolve(process.cwd(), sourcePath)).filter((filePath) => {
		if (!filePath.endsWith('.ts')) {
			return false;
		}

		if (filePath.endsWith('.test.ts')) {
			return false;
		}

		return predicate(filePath);
	});
}

describe('Member Ordering Conventions', () => {
	it('domain classes should follow member ordering convention', async () => {
		const violations = await checkMemberOrdering({
			sourceGlobs: getTypeScriptFiles('../../ocom/domain/src/domain'),
		});

		expect(violations).toStrictEqual([]);
	}, 30000);

	it('aggregate root classes should follow member ordering convention', async () => {
		const violations = await checkMemberOrdering({
			sourceGlobs: getTypeScriptFiles('../../ocom/domain/src/domain', (filePath) => filePath.endsWith('.aggregate.ts')),
		});

		expect(violations).toStrictEqual([]);
	}, 30000);

	it('entity classes should follow member ordering convention', async () => {
		const violations = await checkMemberOrdering({
			sourceGlobs: getTypeScriptFiles('../../ocom/domain/src/domain', (filePath) => filePath.endsWith('.entity.ts')),
		});

		expect(violations).toStrictEqual([]);
	}, 30000);

	it('persistence classes should follow member ordering convention', async () => {
		const violations = await checkMemberOrdering({
			sourceGlobs: getTypeScriptFiles('../../ocom/persistence/src'),
		});

		expect(violations).toStrictEqual([]);
	}, 30000);

	it('resolver classes should follow member ordering convention', async () => {
		const violations = await checkMemberOrdering({
			sourceGlobs: getTypeScriptFiles('../../ocom/graphql/src/schema/types'),
		});

		expect(violations).toStrictEqual([]);
	}, 30000);

	it('allows mixing instance methods and accessors within the same instance-member group', async () => {
		const violations = await checkMemberOrdering({
			sourceGlobs: ['./src/fixtures/member-ordering/instance-mixed-ok.ts'],
		});

		expect(violations).toStrictEqual([]);
	});

	it('still enforces grouping of static vs instance members', async () => {
		const violations = await checkMemberOrdering({
			sourceGlobs: ['./src/fixtures/member-ordering/static-instance-misordered.ts'],
		});

		expect(violations.length).toBeGreaterThan(0);
	});
});
