import { isAgent } from 'std-env';

export default {
	paths: ['../verification-shared/src/scenarios/**/*.feature'],
	import: ['src/world.ts', 'src/step-definitions/index.ts'],
	format: [...(isAgent ? ['@cellix/serenity-framework/formatters/agent'] : ['progress-bar']), 'json:./reports/cucumber-report-api.json', 'html:./reports/cucumber-report-api.html'],
	formatOptions: {
		snippetInterface: 'async-await',
	},
	parallel: 1,
};
