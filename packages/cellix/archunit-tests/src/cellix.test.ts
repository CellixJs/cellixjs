import { describeDependencyRulesTests } from './test-suites/dependency-rules.js';

describeDependencyRulesTests({
	packagesGlob: '../{cellix}/**',
	uiCoreFolder: '../cellix/ui-core',
	uiComponentsFolder: '../ocom/ui-shared',
	appUiFolder: '../../apps/ui-community',
});
