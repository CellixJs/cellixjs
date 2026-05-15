import { projectFiles } from 'archunit';

export interface CircularDependenciesConfig {
	appsGlob?: string;
	packagesGlob?: string;
}

export async function checkCircularDependencies(config: CircularDependenciesConfig): Promise<string[]> {
	const violations: string[] = [];

	if (config.appsGlob) {
		try {
			const appsRule = projectFiles().inFolder(config.appsGlob).should().haveNoCycles();
			try {
				await appsRule.check();
			} catch (e) {
				violations.push(`Apps have circular dependencies: ${String(e)}`);
			}
		} catch {
			// Silently skip if no apps found
		}
	}

	if (config.packagesGlob) {
		try {
			const packagesRule = projectFiles().inFolder(config.packagesGlob).should().haveNoCycles();
			try {
				await packagesRule.check();
			} catch (error_) {
				violations.push(`Packages have circular dependencies: ${String(error_)}`);
			}
		} catch {
			// Silently skip if no packages found
		}
	}

	return violations;
}

export interface LayeredArchitectureConfig {
	domainFolder?: string;
	persistenceFolder?: string;
	applicationServicesFolder?: string;
	graphqlFolder?: string;
	restFolder?: string;
	infrastructurePattern?: string;
	restInfrastructurePattern?: string;
}

export async function checkLayeredArchitecture(config: LayeredArchitectureConfig): Promise<string[]> {
	const violations: string[] = [];

	if (config.domainFolder && config.persistenceFolder) {
		try {
			const rule = projectFiles().inFolder(config.domainFolder).shouldNot().dependOnFiles().inFolder(config.persistenceFolder);
			try {
				await rule.check();
			} catch (error_) {
				violations.push(`Domain depends on persistence layer: ${String(error_)}`);
			}
		} catch {
			// Silently skip
		}
	}

	if (config.domainFolder && config.infrastructurePattern) {
		try {
			const rule = projectFiles().inFolder(config.domainFolder).shouldNot().dependOnFiles().inPath(config.infrastructurePattern);
			try {
				await rule.check();
			} catch (error_) {
				violations.push(`Domain depends on infrastructure: ${String(error_)}`);
			}
		} catch {
			// Silently skip
		}
	}

	if (config.domainFolder && config.applicationServicesFolder) {
		try {
			const rule = projectFiles().inFolder(config.domainFolder).shouldNot().dependOnFiles().inFolder(config.applicationServicesFolder);
			try {
				await rule.check();
			} catch (error_) {
				violations.push(`Domain depends on application services: ${String(error_)}`);
			}
		} catch {
			// Silently skip
		}
	}

	if (config.applicationServicesFolder && config.infrastructurePattern) {
		try {
			const rule = projectFiles().inFolder(config.applicationServicesFolder).shouldNot().dependOnFiles().inPath(config.infrastructurePattern);
			try {
				await rule.check();
			} catch (error_) {
				violations.push(`Application services depend on infrastructure: ${String(error_)}`);
			}
		} catch {
			// Silently skip
		}
	}

	if (config.graphqlFolder && config.infrastructurePattern) {
		try {
			const rule = projectFiles().inFolder(config.graphqlFolder).shouldNot().dependOnFiles().inPath(config.infrastructurePattern);
			try {
				await rule.check();
			} catch (error_) {
				violations.push(`GraphQL depends on infrastructure: ${String(error_)}`);
			}
		} catch {
			// Silently skip
		}
	}

	if (config.restFolder && config.restInfrastructurePattern) {
		try {
			const rule = projectFiles().inFolder(config.restFolder).shouldNot().dependOnFiles().inPath(config.restInfrastructurePattern);
			try {
				await rule.check();
			} catch (error_) {
				violations.push(`REST depends on infrastructure: ${String(error_)}`);
			}
		} catch {
			// Silently skip
		}
	}

	return violations;
}

export interface UiIsolationConfig {
	uiCoreFolder?: string;
	uiComponentsFolder?: string;
	appUiFolder?: string;
}

export async function checkUiIsolation(config: UiIsolationConfig): Promise<string[]> {
	const violations: string[] = [];

	if (config.uiCoreFolder && config.uiComponentsFolder) {
		try {
			const rule = projectFiles().inFolder(config.uiCoreFolder).shouldNot().dependOnFiles().inFolder(config.uiComponentsFolder);
			try {
				await rule.check();
			} catch (error_) {
				violations.push(`ui-core depends on ui-components: ${String(error_)}`);
			}
		} catch {
			// Silently skip
		}
	}

	if (config.uiCoreFolder && config.appUiFolder) {
		try {
			const rule = projectFiles().inFolder(config.uiCoreFolder).shouldNot().dependOnFiles().inFolder(config.appUiFolder);
			try {
				await rule.check();
			} catch (error_) {
				violations.push(`ui-core depends on app UI: ${String(error_)}`);
			}
		} catch {
			// Silently skip
		}
	}

	if (config.uiComponentsFolder && config.appUiFolder) {
		try {
			const rule = projectFiles().inFolder(config.uiComponentsFolder).shouldNot().dependOnFiles().inFolder(config.appUiFolder);
			try {
				await rule.check();
			} catch (error_) {
				violations.push(`ui-components depends on app UI: ${String(error_)}`);
			}
		} catch {
			// Silently skip
		}
	}

	return violations;
}
