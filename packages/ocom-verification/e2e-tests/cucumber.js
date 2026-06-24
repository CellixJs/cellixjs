import { isAgent } from 'std-env';

export default {
	paths: ['../verification-shared/src/scenarios/**/*.feature'],
	import: ['src/world.ts', 'src/step-definitions/index.ts'],
	format: [...(isAgent ? ['@cellix/serenity-framework/formatters/agent'] : ['progress-bar']), 'json:./reports/cucumber-report.json', 'html:./reports/cucumber-report.html'],
	formatOptions: {
		snippetInterface: 'async-await',
	},
	// Disable parallel workers — the shared portless proxy and per-worktree port
	// scheme make parallel browsers contend for the same hostnames.
	parallel: 0,
};
