import { isAgent } from 'std-env';

process.env.DEBUG_TAG = 'acceptance-api';

export default {
	paths: ['../verification-shared/src/scenarios/**/*.feature'],
	import: ['../verification-shared/src/debug/bootstrap.ts', 'src/world.ts', 'src/step-definitions/index.ts'],
	format: [...(isAgent ? ['../verification-shared/src/formatters/agent-formatter.ts', 'summary'] : ['progress-bar']), 'json:./reports/cucumber-report-api.json', 'html:./reports/cucumber-report-api.html'],
	formatOptions: {
		snippetInterface: 'async-await',
	},
	parallel: 1,
};
