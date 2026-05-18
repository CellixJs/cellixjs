import { isAgent } from 'std-env';

process.env.DEBUG_TAG = 'acceptance-ui';

export default {
	paths: ['../verification-shared/src/scenarios/**/*.feature'],
	import: ['../verification-shared/src/debug/bootstrap.ts', 'src/world.ts', 'src/step-definitions/index.ts'],
	format: [...(isAgent ? ['../verification-shared/src/formatters/agent-formatter.ts', 'summary'] : ['progress-bar']), 'json:./reports/cucumber-report-ui.json', 'html:./reports/cucumber-report-ui.html'],
	formatOptions: {
		snippetInterface: 'async-await',
	},
	parallel: 1,
};
