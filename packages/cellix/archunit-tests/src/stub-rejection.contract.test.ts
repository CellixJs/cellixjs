import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkApiComposition } from './api.js';
import { checkSerenitySuiteConventions } from './serenity.js';
import { checkUiAppComposition } from './ui-app.js';

const fixturesRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'architecture-stubs');

describe('architecture test stub rejection', () => {
	it('rejects the incomplete API stub', async () => {
		const violations = await checkApiComposition({ apiIndexPath: path.join(fixturesRoot, 'api', 'src', 'index.ts') });

		expect(violations).toEqual(expect.arrayContaining([expect.stringContaining('initializeInfrastructureServices'), expect.stringContaining('initializeApplicationServices'), expect.stringContaining('registerAzureFunction')]));
	});

	it('rejects the incomplete UI stub', async () => {
		const violations = await checkUiAppComposition({
			appRoot: path.join(fixturesRoot, 'ui', 'src'),
			requiredProviders: ['ThemeProvider', 'BrowserRouter', 'AuthProvider'],
		});

		expect(violations).toEqual(expect.arrayContaining([expect.stringContaining('React root'), expect.stringContaining('ThemeProvider'), expect.stringContaining('Routes')]));
	});

	it('rejects the incomplete Serenity stub', async () => {
		const violations = await checkSerenitySuiteConventions({
			suiteRoot: path.join(fixturesRoot, 'serenity', 'src'),
			requireManagedCleanup: true,
		});

		expect(violations).toEqual(expect.arrayContaining([expect.stringContaining('Managed world'), expect.stringContaining('at least one server'), expect.stringContaining('delegate behavior')]));
	});
});
