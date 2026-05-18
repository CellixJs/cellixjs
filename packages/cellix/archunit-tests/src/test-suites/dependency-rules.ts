import { describe, expect, it } from 'vitest';
import { checkCircularDependencies, checkLayeredArchitecture, checkUiIsolation } from '../checks/circular-dependencies.js';

export interface DependencyRulesTestsConfig {
	appsGlob?: string;
	packagesGlob?: string;
	domainFolder?: string;
	persistenceFolder?: string;
	applicationServicesFolder?: string;
	graphqlFolder?: string;
	restFolder?: string;
	infrastructurePattern?: string;
	restInfrastructurePattern?: string;
	uiCoreFolder?: string;
	uiComponentsFolder?: string;
	appUiFolder?: string;
}

export function describeDependencyRulesTests(config: DependencyRulesTestsConfig): void {
	const { appsGlob, packagesGlob, domainFolder, persistenceFolder, applicationServicesFolder, graphqlFolder, restFolder, infrastructurePattern, restInfrastructurePattern, uiCoreFolder, uiComponentsFolder, appUiFolder } = config;

	describe('Dependency Rules', () => {
		if (appsGlob || packagesGlob) {
			describe('Circular Dependencies', () => {
				if (appsGlob) {
					it('apps should not have circular dependencies', async () => {
						const violations = await checkCircularDependencies({ appsGlob });
						expect(violations).toStrictEqual([]);
					}, 30000);
				}

				if (packagesGlob) {
					it('packages should not have circular dependencies', async () => {
						const violations = await checkCircularDependencies({ packagesGlob });
						expect(violations).toStrictEqual([]);
					}, 10000);
				}
			});
		}

		if (domainFolder) {
			describe('Layered Architecture', () => {
				if (persistenceFolder) {
					it('domain layer should not depend on persistence layer', async () => {
						const violations = await checkLayeredArchitecture({ domainFolder, persistenceFolder });
						expect(violations).toStrictEqual([]);
					}, 30000);
				}

				if (infrastructurePattern) {
					it('domain layer should not depend on infrastructure layer', async () => {
						const violations = await checkLayeredArchitecture({ domainFolder, infrastructurePattern });
						expect(violations).toStrictEqual([]);
					}, 30000);
				}

				if (applicationServicesFolder) {
					it('domain layer should not depend on application services', async () => {
						const violations = await checkLayeredArchitecture({ domainFolder, applicationServicesFolder });
						expect(violations).toStrictEqual([]);
					}, 30000);

					if (infrastructurePattern) {
						it('application services should not depend on infrastructure', async () => {
							const violations = await checkLayeredArchitecture({ applicationServicesFolder, infrastructurePattern });
							expect(violations).toStrictEqual([]);
						}, 30000);
					}
				}

				if (graphqlFolder && infrastructurePattern) {
					it('GraphQL API layer should not depend on infrastructure directly', async () => {
						const violations = await checkLayeredArchitecture({ graphqlFolder, infrastructurePattern });
						expect(violations).toStrictEqual([]);
					}, 30000);
				}

				if (restFolder && restInfrastructurePattern) {
					it('REST API layer should not depend on infrastructure directly', async () => {
						const violations = await checkLayeredArchitecture({ restFolder, restInfrastructurePattern });
						expect(violations).toStrictEqual([]);
					}, 30000);
				}
			});
		}

		if (uiCoreFolder || uiComponentsFolder) {
			describe('UI Isolation', () => {
				if (uiCoreFolder && uiComponentsFolder) {
					it('ui-core should not depend on ui-components', async () => {
						const violations = await checkUiIsolation({ uiCoreFolder, uiComponentsFolder });
						expect(violations).toStrictEqual([]);
					}, 30000);
				}

				if (uiCoreFolder && appUiFolder) {
					it('ui-core should not depend on app UI', async () => {
						const violations = await checkUiIsolation({ uiCoreFolder, appUiFolder });
						expect(violations).toStrictEqual([]);
					}, 30000);
				}

				if (uiComponentsFolder && appUiFolder) {
					it('ui-components should not depend on app UI', async () => {
						const violations = await checkUiIsolation({ uiComponentsFolder, appUiFolder });
						expect(violations).toStrictEqual([]);
					}, 30000);
				}
			});
		}
	});
}
