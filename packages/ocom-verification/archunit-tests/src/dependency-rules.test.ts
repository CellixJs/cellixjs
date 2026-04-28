import { type DependencyRulesTestsConfig, describeDependencyRulesTests } from '@cellix/archunit-tests/general';

const config: DependencyRulesTestsConfig = {
	appsGlob: '../../apps/**',
	packagesGlob: '../**',

	domainFolder: '../domain',
	persistenceFolder: '../persistence',
	applicationServicesFolder: '../application-services',
	graphqlFolder: '../graphql',
	restFolder: '../rest',
	infrastructurePattern: '../../cellix/service-*/**',
	restInfrastructurePattern: '../service-*/**',

	uiCoreFolder: '../../cellix/ui-core',
	uiComponentsFolder: '../ui-components',
	appUiFolder: '../../apps/ui-community',
};

describeDependencyRulesTests(config);
