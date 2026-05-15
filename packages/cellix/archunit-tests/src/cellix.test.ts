import { describeDependencyRulesTests } from './test-suites/dependency-rules.js';

describeDependencyRulesTests({
	packagesGlob: '../**',
	uiCoreFolder: '../ui-core',
	uiComponentsFolder: '../ocom/ui-shared',
	appUiFolder: '../../../apps/ui-community',
});
