import { projectFiles } from 'archunit';

export interface ApplicationServicesConventionsConfig {
	applicationServicesGlob: string;
	applicationServicesAllGlob: string;
}

export async function checkApplicationServicesFactoryPattern(config: Pick<ApplicationServicesConventionsConfig, 'applicationServicesGlob'>): Promise<string[]> {
	if (!config.applicationServicesGlob) {
		throw new Error('checkApplicationServicesFactoryPattern requires applicationServicesGlob to be set');
	}

	const allViolations: string[] = [];

	await projectFiles()
		.inFolder(config.applicationServicesGlob)
		.withName('*.ts')
		.should()
		.adhereTo((file) => {
			if (file.path.endsWith('index.ts') || file.path.includes('.test.ts') || file.path.includes('.feature') || file.path.includes('/features/')) {
				return true;
			}

			const hasDataSourcesParam = /\(\s*dataSources\s*:\s*DataSources\s*\)/.test(file.content);
			if (!hasDataSourcesParam) {
				allViolations.push(`[${file.path}] Action must follow curried factory pattern: (dataSources: DataSources) => async (command) => result`);
				return false;
			}
			return true;
		}, 'Application service actions must follow the curried factory pattern')
		.check();

	return allViolations;
}

export async function checkApplicationServicesDependencyBoundaries(config: Pick<ApplicationServicesConventionsConfig, 'applicationServicesAllGlob'>): Promise<string[]> {
	if (!config.applicationServicesAllGlob) {
		throw new Error('checkApplicationServicesDependencyBoundaries requires applicationServicesAllGlob to be set');
	}

	const allViolations: string[] = [];

	await projectFiles()
		.inPath(config.applicationServicesAllGlob)
		.should()
		.adhereTo((file) => {
			if (file.path.includes('.test.ts') || file.path.includes('.feature')) return true;

			const importsMongoose = /from\s+['"]mongoose['"]/.test(file.content);
			if (importsMongoose) {
				allViolations.push(`[${file.path}] Application services must not import mongoose directly`);
				return false;
			}
			return true;
		}, 'Application services must not import mongoose')
		.check();

	await projectFiles()
		.inPath(config.applicationServicesAllGlob)
		.should()
		.adhereTo((file) => {
			if (file.path.includes('.test.ts') || file.path.includes('.feature')) return true;

			const importsMongooseSeedwork = /@cellix\/mongoose-seedwork/.test(file.content);
			if (importsMongooseSeedwork) {
				allViolations.push(`[${file.path}] Application services must not import @cellix/mongoose-seedwork`);
				return false;
			}
			return true;
		}, 'Application services must not import mongoose seedwork')
		.check();

	await projectFiles()
		.inPath(config.applicationServicesAllGlob)
		.should()
		.adhereTo((file) => {
			if (file.path.includes('.test.ts') || file.path.includes('.feature')) return true;

			const importsModels = /@ocom\/data-sources-mongoose-models/.test(file.content);
			if (importsModels) {
				allViolations.push(`[${file.path}] Application services must not import @ocom/data-sources-mongoose-models`);
				return false;
			}
			return true;
		}, 'Application services must not import data source models directly')
		.check();

	await projectFiles()
		.inPath(config.applicationServicesAllGlob)
		.should()
		.adhereTo((file) => {
			if (file.path.includes('.test.ts') || file.path.includes('.feature')) return true;

			const importsGraphql = /@ocom\/graphql/.test(file.content);
			if (importsGraphql) {
				allViolations.push(`[${file.path}] Application services must not import from @ocom/graphql`);
				return false;
			}
			return true;
		}, 'Application services must not depend on GraphQL layer')
		.check();

	return allViolations;
}

export async function checkApplicationServicesIndexComposition(config: Pick<ApplicationServicesConventionsConfig, 'applicationServicesGlob'>): Promise<string[]> {
	if (!config.applicationServicesGlob) {
		throw new Error('checkApplicationServicesIndexComposition requires applicationServicesGlob to be set');
	}

	const allViolations: string[] = [];

	await projectFiles()
		.inFolder(config.applicationServicesGlob)
		.withName('index.ts')
		.should()
		.adhereTo((file) => {
			const contextsParts = file.path.split('/contexts/');
			if (!contextsParts[1]) return true;
			const depth = contextsParts[1].split('/').length;
			if (depth < 2) return true;

			const hasInterface = /export\s+interface\s+\w+ApplicationService/.test(file.content);
			if (!hasInterface) {
				allViolations.push(`[${file.path}] Entity index must define an *ApplicationService interface`);
				return false;
			}
			return true;
		}, 'Entity-level index files must define an ApplicationService interface')
		.check();

	return allViolations;
}

export async function checkApplicationServicesTransactionUsage(config: Pick<ApplicationServicesConventionsConfig, 'applicationServicesGlob'>): Promise<string[]> {
	if (!config.applicationServicesGlob) {
		throw new Error('checkApplicationServicesTransactionUsage requires applicationServicesGlob to be set');
	}

	const allViolations: string[] = [];

	await projectFiles()
		.inFolder(config.applicationServicesGlob)
		.withName('*.ts')
		.should()
		.adhereTo((file) => {
			const fileName = file.path.split('/').pop() ?? '';

			const isMutation = /^(create|update|delete)\.ts$/.test(fileName);
			if (!isMutation) return true;

			if (file.path.includes('.test.ts')) return true;

			const usesTransaction = /withScopedTransaction/.test(file.content);
			if (!usesTransaction) {
				allViolations.push(`[${file.path}] Mutation action must use domainDataSource.*.withScopedTransaction()`);
				return false;
			}
			return true;
		}, 'Mutation actions must use withScopedTransaction for writes')
		.check();

	return allViolations;
}

export async function checkApplicationServicesQueryPattern(config: Pick<ApplicationServicesConventionsConfig, 'applicationServicesGlob'>): Promise<string[]> {
	if (!config.applicationServicesGlob) {
		throw new Error('checkApplicationServicesQueryPattern requires applicationServicesGlob to be set');
	}

	const allViolations: string[] = [];

	await projectFiles()
		.inFolder(config.applicationServicesGlob)
		.withName('*.ts')
		.should()
		.adhereTo((file) => {
			const fileName = file.path.split('/').pop() ?? '';

			const isQuery = /^(query-|get-|find-)/.test(fileName);
			if (!isQuery) return true;
			if (file.path.includes('.test.ts')) return true;

			const usesReadonly = /readonlyDataSource/.test(file.content);
			if (!usesReadonly) {
				allViolations.push(`[${file.path}] Query action should use readonlyDataSource for reads`);
				return false;
			}
			return true;
		}, 'Query actions should use readonlyDataSource (CQRS read side)')
		.check();

	return allViolations;
}
