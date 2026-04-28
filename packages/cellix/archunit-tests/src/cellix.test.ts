import { describeDependencyRulesTests } from './test-suites/dependency-rules.js';

describeDependencyRulesTests({
	packagesGlob: '../{cellix}/**',
	uiCoreFolder: '../cellix/ui-core',
	uiComponentsFolder: '../ocom/ui-components',
	appUiFolder: '../../apps/ui-community',
});
