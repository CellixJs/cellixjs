import { projectFiles } from 'archunit';

export interface PersistenceConventionsConfig {
	persistenceDomainGlob: string;
	persistenceReadonlyGlob: string;
	persistenceAllGlob: string;
}

export async function checkPersistenceRepositoryConventions(config: Pick<PersistenceConventionsConfig, 'persistenceDomainGlob'>): Promise<string[]> {
	if (!config.persistenceDomainGlob) {
		throw new Error('checkPersistenceRepositoryConventions requires persistenceDomainGlob to be set');
	}

	const allViolations: string[] = [];

	await projectFiles()
		.inFolder(config.persistenceDomainGlob)
		.withName('*.repository.ts')
		.should()
		.adhereTo((file) => {
			const extendsBase = /extends\s+MongooseSeedwork\.MongoRepositoryBase</.test(file.content);
			if (!extendsBase) {
				allViolations.push(`[${file.path}] Repository class must extend MongooseSeedwork.MongoRepositoryBase`);
				return false;
			}
			return true;
		}, 'Persistence repository classes must extend MongooseSeedwork.MongoRepositoryBase')
		.check();

	await projectFiles()
		.inFolder(config.persistenceDomainGlob)
		.withName('*.repository.ts')
		.should()
		.adhereTo((file) => {
			const implementsIdx = file.content.indexOf('implements');
			const domainCtxIdx = file.content.indexOf('Domain.Contexts.');
			const implementsDomainRepo = implementsIdx !== -1 && domainCtxIdx !== -1 && domainCtxIdx > implementsIdx && domainCtxIdx < file.content.indexOf('{', implementsIdx);

			if (!implementsDomainRepo) {
				allViolations.push(`[${file.path}] Repository must implement the corresponding Domain.Contexts.*.Repository interface`);
				return false;
			}
			return true;
		}, 'Persistence repositories must implement domain repository interfaces')
		.check();

	return allViolations;
}

export async function checkPersistenceDomainAdapterConventions(config: Pick<PersistenceConventionsConfig, 'persistenceDomainGlob'>): Promise<string[]> {
	if (!config.persistenceDomainGlob) {
		throw new Error('checkPersistenceDomainAdapterConventions requires persistenceDomainGlob to be set');
	}

	const allViolations: string[] = [];

	await projectFiles()
		.inFolder(config.persistenceDomainGlob)
		.withName('*.domain-adapter.ts')
		.should()
		.adhereTo((file) => {
			const extendsAdapter = /extends\s+MongooseSeedwork\.MongooseDomainAdapter</.test(file.content);
			if (!extendsAdapter) {
				allViolations.push(`[${file.path}] Domain adapter must extend MongooseSeedwork.MongooseDomainAdapter`);
				return false;
			}
			return true;
		}, 'Domain adapters must extend MongooseSeedwork.MongooseDomainAdapter')
		.check();

	await projectFiles()
		.inFolder(config.persistenceDomainGlob)
		.withName('*.domain-adapter.ts')
		.should()
		.adhereTo((file) => {
			const hasConverter = /extends\s+MongooseSeedwork\.MongoTypeConverter</.test(file.content);
			if (!hasConverter) {
				allViolations.push(`[${file.path}] Domain adapter file must contain a Converter class extending MongooseSeedwork.MongoTypeConverter`);
				return false;
			}
			return true;
		}, 'Domain adapter files must contain a MongoTypeConverter')
		.check();

	return allViolations;
}

export async function checkPersistenceUnitOfWorkConventions(config: Pick<PersistenceConventionsConfig, 'persistenceDomainGlob'>): Promise<string[]> {
	if (!config.persistenceDomainGlob) {
		throw new Error('checkPersistenceUnitOfWorkConventions requires persistenceDomainGlob to be set');
	}

	const allViolations: string[] = [];

	await projectFiles()
		.inFolder(config.persistenceDomainGlob)
		.withName('*.uow.ts')
		.should()
		.adhereTo((file) => {
			const usesMongoUoW = /new\s+MongooseSeedwork\.MongoUnitOfWork\(/.test(file.content);
			if (!usesMongoUoW) {
				allViolations.push(`[${file.path}] UoW file must use MongooseSeedwork.MongoUnitOfWork`);
				return false;
			}
			return true;
		}, 'Persistence UoW files must use MongooseSeedwork.MongoUnitOfWork')
		.check();

	await projectFiles()
		.inFolder(config.persistenceDomainGlob)
		.withName('*.uow.ts')
		.should()
		.adhereTo((file) => {
			const hasInProc = /InProcEventBusInstance/.test(file.content);
			const hasNode = /NodeEventBusInstance/.test(file.content);
			if (!hasInProc || !hasNode) {
				allViolations.push(`[${file.path}] UoW must use both InProcEventBusInstance and NodeEventBusInstance`);
				return false;
			}
			return true;
		}, 'Persistence UoW files must wire both event bus instances')
		.check();

	await projectFiles()
		.inFolder(config.persistenceDomainGlob)
		.withName('*.uow.ts')
		.should()
		.adhereTo((file) => {
			const exportsFactory = /export\s+const\s+get\w+UnitOfWork\s*=/.test(file.content);
			if (!exportsFactory) {
				allViolations.push(`[${file.path}] UoW must export a factory function named get*UnitOfWork`);
				return false;
			}
			return true;
		}, 'Persistence UoW files must export a factory function')
		.check();

	return allViolations;
}

export async function checkPersistenceReadonlyDataConventions(config: Pick<PersistenceConventionsConfig, 'persistenceReadonlyGlob'>): Promise<string[]> {
	if (!config.persistenceReadonlyGlob) {
		throw new Error('checkPersistenceReadonlyDataConventions requires persistenceReadonlyGlob to be set');
	}

	const allViolations: string[] = [];

	await projectFiles()
		.inFolder(config.persistenceReadonlyGlob)
		.withName('*.data.ts')
		.should()
		.adhereTo((file) => {
			const extendsBase = /extends\s+MongoDataSourceImpl</.test(file.content);
			if (!extendsBase) {
				allViolations.push(`[${file.path}] Readonly data source must extend MongoDataSourceImpl`);
				return false;
			}
			return true;
		}, 'Readonly data source files must extend MongoDataSourceImpl')
		.check();

	return allViolations;
}

export async function checkPersistenceDependencyBoundaries(config: Pick<PersistenceConventionsConfig, 'persistenceAllGlob'>): Promise<string[]> {
	if (!config.persistenceAllGlob) {
		throw new Error('checkPersistenceDependencyBoundaries requires persistenceAllGlob to be set');
	}

	const allViolations: string[] = [];

	const forbiddenImports: Array<{ pattern: RegExp; message: string; description: string }> = [
		{ pattern: /@ocom\/application-services/, message: 'Persistence must not import from @ocom/application-services', description: 'Persistence layer must not depend on application services' },
		{ pattern: /@ocom\/graphql/, message: 'Persistence must not import from @ocom/graphql', description: 'Persistence layer must not depend on GraphQL layer' },
	];

	for (const { pattern, message, description } of forbiddenImports) {
		await projectFiles()
			.inPath(config.persistenceAllGlob)
			.should()
			.adhereTo((file) => {
				if (file.path.includes('.test.ts') || file.path.includes('.feature')) return true;
				if (pattern.test(file.content)) {
					allViolations.push(`[${file.path}] ${message}`);
					return false;
				}
				return true;
			}, description)
			.check();
	}

	return allViolations;
}

export async function checkPersistenceAbstractionDependencies(config: Pick<PersistenceConventionsConfig, 'persistenceAllGlob'>): Promise<string[]> {
	if (!config.persistenceAllGlob) {
		throw new Error('checkPersistenceAbstractionDependencies requires persistenceAllGlob to be set');
	}

	const allViolations: string[] = [];

	const abstractionChecks: Array<{ folder: string; pattern: RegExp; message: string; description: string }> = [
		{
			folder: '/messaging/',
			pattern: /@cellix\/service-messaging-(?!base)/,
			message: 'Messaging persistence must depend on @cellix/service-messaging-base, not concrete implementations',
			description: 'Messaging persistence must depend on abstractions',
		},
		{
			folder: '/payment/',
			pattern: /@cellix\/service-payment-(?!base)/,
			message: 'Payment persistence must depend on @cellix/service-payment-base, not concrete implementations',
			description: 'Payment persistence must depend on abstractions',
		},
	];

	for (const { folder, pattern, message, description } of abstractionChecks) {
		await projectFiles()
			.inPath(config.persistenceAllGlob)
			.should()
			.adhereTo((file) => {
				if (file.path.includes('.test.ts') || file.path.includes('.feature')) return true;
				if (!file.path.includes(folder)) return true;
				if (pattern.test(file.content)) {
					allViolations.push(`[${file.path}] ${message}`);
					return false;
				}
				return true;
			}, description)
			.check();
	}

	return allViolations;
}
