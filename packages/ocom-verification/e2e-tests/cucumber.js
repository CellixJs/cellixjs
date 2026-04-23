import { isAgent } from 'std-env';

export default {
	paths: ['../verification-shared/src/scenarios/**/*.feature'],
	import: ['src/world.ts', 'src/contexts/**/step-definitions/**/*.steps.ts', 'src/shared/support/**/*.ts'],
	format: [...(isAgent ? ['../verification-shared/src/formatters/agent-formatter.ts'] : ['progress-bar']), 'json:./reports/cucumber-report.json', 'html:./reports/cucumber-report.html'],
	formatOptions: {
		snippetInterface: 'async-await',
	},
	parallel: 1,
};
