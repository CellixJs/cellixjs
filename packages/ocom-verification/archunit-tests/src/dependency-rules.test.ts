import { type DependencyRulesTestsConfig, describeDependencyRulesTests } from '@cellix/archunit-tests/general';

const config: DependencyRulesTestsConfig = {
	appsGlob: '../../../apps/**',
	packagesGlob: '../../**',

	domainFolder: '../../ocom/domain',
	persistenceFolder: '../../ocom/persistence',
	applicationServicesFolder: '../../ocom/application-services',
	graphqlFolder: '../../ocom/graphql',
	restFolder: '../../ocom/rest',
	infrastructurePattern: '../../cellix/service-*/**',
	restInfrastructurePattern: '../../ocom/service-*/**',

	uiCoreFolder: '../../cellix/ui-core',
	uiComponentsFolder: '../../ocom/ui-components',
	appUiFolder: '../../../apps/ui-community',
};

describeDependencyRulesTests(config);
