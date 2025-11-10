import { projectFiles } from 'archunit';
import { describe, expect, it } from 'vitest';

describe('Naming Conventions', () => {
	it.skip('UI graphql files must be named *.container.graphql', async () => {
		// Broadly match any .graphql file under any `src` folder across the repo.
		// This is intentionally permissive so new UI packages are automatically covered.
		// Restrict to UI packages only. UI packages in this repo follow the
		// pattern `ui-*` and exist under packages/*/ui-* and apps/ui-*
		// Examples: packages/cellix/ui-core, packages/ocom/ui-components, apps/ui-community
		const rule = projectFiles()
			// Match files that live inside a ui-* package's src folder.
			// inFolder matches the folder path (without filename) so it's
			// resilient to test CWD differences.
			.inFolder('**/ui-*/src/**')
			.withName('*.graphql')
			.should()
			.haveName('*.container.graphql');

		// Keep this strict: if the pattern is wrong (matches nothing) the test
		// will fail so we can notice and correct the glob. If you prefer a
		// non-blocking rule in CI for empty checkouts, pass { allowEmptyTests: true }.
		await expect(rule).toPassAsync();
	});
});