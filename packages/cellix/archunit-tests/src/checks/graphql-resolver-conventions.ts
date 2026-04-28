import * as path from 'node:path';
import { projectFiles } from 'archunit';
import { getDirectories } from '../utils/frontend-helpers.js';

export interface GraphqlResolverConventionsConfig {
	resolversGlob: string;
	entityFilesPattern?: string;
	repositoryFilesPattern?: string;
	uowFilesPattern?: string;
	infrastructureServicesPattern?: string;
	persistenceFolder?: string;
}

export interface GraphqlFlatStructureConfig {
	typesDirectoryPath: string;
	allowedSubdirectories?: string[];
}

export async function checkGraphqlResolverDependencies(config: GraphqlResolverConventionsConfig): Promise<string[]> {
	const hasDependencyPatterns = config.entityFilesPattern || config.repositoryFilesPattern || config.uowFilesPattern || config.infrastructureServicesPattern || config.persistenceFolder;

	if (!hasDependencyPatterns) {
		throw new Error('checkGraphqlResolverDependencies requires at least one dependency pattern: ' + 'entityFilesPattern, repositoryFilesPattern, uowFilesPattern, infrastructureServicesPattern, or persistenceFolder');
	}

	const violations: string[] = [];

	if (config.entityFilesPattern) {
		try {
			const rule = projectFiles().inFolder(config.resolversGlob).withName('*.resolvers.ts').shouldNot().dependOnFiles().inPath(config.entityFilesPattern);
			try {
				await rule.check();
			} catch (error_) {
				violations.push(`Resolver imports domain entities: ${String(error_)}`);
			}
		} catch {
			// Silently skip
		}
	}

	if (config.repositoryFilesPattern) {
		try {
			const rule = projectFiles().inFolder(config.resolversGlob).withName('*.resolvers.ts').shouldNot().dependOnFiles().inPath(config.repositoryFilesPattern);
			try {
				await rule.check();
			} catch (error_) {
				violations.push(`Resolver imports repositories: ${String(error_)}`);
			}
		} catch {
			// Silently skip
		}
	}

	if (config.uowFilesPattern) {
		try {
			const rule = projectFiles().inFolder(config.resolversGlob).withName('*.resolvers.ts').shouldNot().dependOnFiles().inPath(config.uowFilesPattern);
			try {
				await rule.check();
			} catch (error_) {
				violations.push(`Resolver imports unit of work: ${String(error_)}`);
			}
		} catch {
			// Silently skip
		}
	}

	if (config.infrastructureServicesPattern) {
		try {
			const rule = projectFiles().inFolder(config.resolversGlob).withName('*.resolvers.ts').shouldNot().dependOnFiles().inPath(config.infrastructureServicesPattern);
			try {
				await rule.check();
			} catch (error_) {
				violations.push(`Resolver imports infrastructure services: ${String(error_)}`);
			}
		} catch {
			// Silently skip
		}
	}

	if (config.persistenceFolder) {
		try {
			const rule = projectFiles().inFolder(config.resolversGlob).withName('*.resolvers.ts').shouldNot().dependOnFiles().inFolder(config.persistenceFolder);
			try {
				await rule.check();
			} catch (error_) {
				violations.push(`Resolver imports persistence layer: ${String(error_)}`);
			}
		} catch {
			// Silently skip
		}
	}

	return violations;
}

export async function checkGraphqlResolverContent(config: GraphqlResolverConventionsConfig): Promise<string[]> {
	if (!config.resolversGlob) {
		throw new Error('checkGraphqlResolverContent requires resolversGlob to be set');
	}

	const allViolations: string[] = [];

	await projectFiles()
		.inFolder(config.resolversGlob)
		.withName('*.resolvers.ts')
		.should()
		.adhereTo((file) => {
			const hasDefaultExport = /export\s+default\s+\w+/.test(file.content);
			if (!hasDefaultExport) {
				allViolations.push(`[${file.path}] Missing default export of resolver object`);
				return false;
			}
			return true;
		}, 'Resolver files must export a default resolver object')
		.check();

	await projectFiles()
		.inFolder(config.resolversGlob)
		.withName('*.resolvers.ts')
		.should()
		.adhereTo((file) => {
			const violations: string[] = [];

			const interfacePattern = /^(?:export\s+)?interface\s+\w+/gm;
			const interfaces = file.content.match(interfacePattern);
			if (interfaces) {
				violations.push(`interfaces: ${interfaces.join(', ')}`);
			}

			const typePattern = /^(?:export\s+)?type\s+\w+\s*=/gm;
			const types = file.content.match(typePattern);
			if (types) {
				violations.push(`types: ${types.join(', ')}`);
			}

			const classPattern = /^(?:export\s+)?class\s+\w+/gm;
			const classes = file.content.match(classPattern);
			if (classes) {
				violations.push(`classes: ${classes.join(', ')}`);
			}

			const enumPattern = /^(?:export\s+)?enum\s+\w+/gm;
			const enums = file.content.match(enumPattern);
			if (enums) {
				violations.push(`enums: ${enums.join(', ')}`);
			}

			const namedExportPattern = /^export\s+(?:const|function|interface|type|class|enum)\s+/gm;
			const namedExports = file.content.match(namedExportPattern);
			if (namedExports) {
				violations.push(`named exports: ${namedExports.join(', ')}`);
			}

			if (violations.length > 0) {
				allViolations.push(`[${file.path}] Contains disallowed definitions: ${violations.join('; ')}.`);
				return false;
			}
			return true;
		}, 'Resolver files should not define interfaces, types, classes, or enums')
		.check();

	await projectFiles()
		.inFolder(config.resolversGlob)
		.withName('*.resolvers.ts')
		.should()
		.adhereTo((file) => {
			const hasResolversType = /:\s*Resolvers\s*[=;]/.test(file.content);
			if (!hasResolversType) {
				allViolations.push(`[${file.path}] Resolver object not typed as Resolvers`);
				return false;
			}
			return true;
		}, 'Resolver objects must be typed as Resolvers from generated schema')
		.check();

	await projectFiles()
		.inFolder(config.resolversGlob)
		.withName('*.resolvers.ts')
		.should()
		.adhereTo((file) => {
			if (/context[,)]/.test(file.content)) {
				const hasGraphContext = /context:\s+GraphContext/.test(file.content);
				if (!hasGraphContext) {
					allViolations.push(`[${file.path}] Context parameter not typed as GraphContext`);
					return false;
				}
			}
			return true;
		}, 'Resolver context parameter must be explicitly typed as GraphContext')
		.check();

	await projectFiles()
		.inFolder(config.resolversGlob)
		.withName('*.resolvers.ts')
		.should()
		.adhereTo((file) => {
			const hasResolverFunctions = /(?:Query|Mutation|[A-Z]\w{0,100}):/.test(file.content);
			if (hasResolverFunctions) {
				const hasAsyncFunctions = /async\s+\(/.test(file.content);
				if (!hasAsyncFunctions) {
					allViolations.push(`[${file.path}] Resolver functions should be declared as async`);
					return false;
				}
			}
			return true;
		}, 'Resolver functions must be async to support await operations')
		.check();

	return allViolations;
}

export async function checkGraphqlFlatStructure(config: GraphqlFlatStructureConfig): Promise<string[]> {
	if (!config.typesDirectoryPath) {
		throw new Error('checkGraphqlFlatStructure requires typesDirectoryPath to be set');
	}

	const violations: string[] = [];
	const resolvedPath = path.join(process.cwd(), config.typesDirectoryPath);
	const allowedSubs = new Set(config.allowedSubdirectories ?? []);

	const subdirs = await getDirectories(resolvedPath);
	for (const dir of subdirs) {
		if (!allowedSubs.has(dir)) {
			violations.push(`[${config.typesDirectoryPath}/${dir}] Unexpected subdirectory in types directory — resolver types must use a flat structure`);
		}
	}

	return violations;
}
