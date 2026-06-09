import { projectFiles } from 'archunit';

export interface DomainConventionsConfig {
	domainContextsGlob: string;
}

export async function checkRepositoryConventions(config: DomainConventionsConfig): Promise<string[]> {
	if (!config.domainContextsGlob) {
		throw new Error('checkRepositoryConventions requires domainContextsGlob to be set');
	}

	const allViolations: string[] = [];

	await projectFiles()
		.inFolder(config.domainContextsGlob)
		.withName('*.repository.ts')
		.should()
		.adhereTo((file) => {
			const extendsRepository = /extends\s+DomainSeedwork\.Repository</.test(file.content);
			if (!extendsRepository) {
				allViolations.push(`[${file.path}] Repository interface does not extend DomainSeedwork.Repository<T>`);
				return false;
			}
			return true;
		}, 'Repository interfaces must extend DomainSeedwork.Repository<T>')
		.check();

	await projectFiles()
		.inFolder(config.domainContextsGlob)
		.withName('*.repository.ts')
		.should()
		.adhereTo((file) => {
			const exportsClass = /export\s+class\s+/g.test(file.content);
			if (exportsClass) {
				allViolations.push(`[${file.path}] Exports concrete class - repositories should only export interfaces`);
				return false;
			}
			return true;
		}, 'Repository files must only export interfaces, not classes')
		.check();

	return allViolations;
}

export async function checkUnitOfWorkConventions(config: DomainConventionsConfig): Promise<string[]> {
	if (!config.domainContextsGlob) {
		throw new Error('checkUnitOfWorkConventions requires domainContextsGlob to be set');
	}

	const allViolations: string[] = [];

	await projectFiles()
		.inFolder(config.domainContextsGlob)
		.withName('*.uow.ts')
		.should()
		.adhereTo((file) => {
			const extendsUnitOfWork = /extends\s+DomainSeedwork\.UnitOfWork</.test(file.content);
			const extendsInitializedUoW = /DomainSeedwork\.InitializedUnitOfWork</.test(file.content);

			if (!extendsUnitOfWork || !extendsInitializedUoW) {
				allViolations.push(`[${file.path}] UoW interface must extend both DomainSeedwork.UnitOfWork and InitializedUnitOfWork`);
				return false;
			}
			return true;
		}, 'UoW interfaces must extend both DomainSeedwork.UnitOfWork and InitializedUnitOfWork')
		.check();

	await projectFiles()
		.inFolder(config.domainContextsGlob)
		.withName('*.uow.ts')
		.should()
		.adhereTo((file) => {
			const importsPassport = /import.*Passport.*from.*passport/.test(file.content);
			const importsEntity = /\.entity\.ts/.test(file.content);
			const importsRepository = /\.repository\.ts/.test(file.content);

			if (!importsPassport || !importsEntity || !importsRepository) {
				allViolations.push(`[${file.path}] UoW must import Passport, entity, and repository`);
				return false;
			}
			return true;
		}, 'UoW files must import Passport, entity types, repository, and aggregate')
		.check();

	await projectFiles()
		.inFolder(config.domainContextsGlob)
		.withName('*.uow.ts')
		.should()
		.adhereTo((file) => {
			const exportsClass = /export\s+class\s+/g.test(file.content);
			if (exportsClass) {
				allViolations.push(`[${file.path}] Exports concrete class - UoW should only export interfaces`);
				return false;
			}
			return true;
		}, 'UoW files must only export interfaces, not classes')
		.check();

	return allViolations;
}

export async function checkAggregateRootConventions(config: DomainConventionsConfig): Promise<string[]> {
	if (!config.domainContextsGlob) {
		throw new Error('checkAggregateRootConventions requires domainContextsGlob to be set');
	}

	const allViolations: string[] = [];

	await projectFiles()
		.inFolder(config.domainContextsGlob)
		.withName('*.ts')
		.should()
		.adhereTo((file) => {
			if (
				file.path.includes('.entity.ts') ||
				file.path.includes('.repository.ts') ||
				file.path.includes('.uow.ts') ||
				file.path.includes('.value-objects.ts') ||
				file.path.includes('.visa.ts') ||
				file.path.includes('.test.ts') ||
				file.path.includes('.helpers.ts') ||
				file.path.includes('index.ts') ||
				file.path.includes('passport.ts') ||
				file.path.includes('permissions.ts')
			) {
				return true;
			}

			const extendsEntity = /extends\s+DomainSeedwork\.Entity/.test(file.content);
			const extendsValueObject = /extends\s+DomainSeedwork\.ValueObject/.test(file.content);
			const extendsDomainEntity = /extends\s+DomainSeedwork\.DomainEntity/.test(file.content);
			if (extendsEntity || extendsValueObject || extendsDomainEntity) {
				return true;
			}

			const extendsAggregateRoot = /extends\s+DomainSeedwork\.AggregateRoot</.test(file.content);

			if (extendsAggregateRoot && !file.path.includes('.aggregate.ts')) {
				allViolations.push(`[${file.path}] Aggregate root file must use .aggregate.ts extension`);
				return false;
			}
			return true;
		}, 'Files extending DomainSeedwork.AggregateRoot must use .aggregate.ts extension')
		.check();

	await projectFiles()
		.inFolder(config.domainContextsGlob)
		.withName('*.aggregate.ts')
		.should()
		.adhereTo((file) => {
			const extendsAggregateRoot = /extends\s+DomainSeedwork\.AggregateRoot</.test(file.content);
			if (!extendsAggregateRoot) {
				allViolations.push(`[${file.path}] Aggregate root class does not extend DomainSeedwork.AggregateRoot`);
				return false;
			}
			return true;
		}, 'Aggregate root files must export a class extending DomainSeedwork.AggregateRoot')
		.check();

	await projectFiles()
		.inFolder(config.domainContextsGlob)
		.withName('*.aggregate.ts')
		.should()
		.adhereTo((file) => {
			const hasGetNewInstance = /static\s+getNewInstance/.test(file.content);
			if (!hasGetNewInstance) {
				allViolations.push(`[${file.path}] Aggregate root must have static getNewInstance method`);
				return false;
			}
			return true;
		}, 'Aggregate root files must have a static getNewInstance factory method')
		.check();

	await projectFiles()
		.inFolder(config.domainContextsGlob)
		.withName('*.aggregate.ts')
		.should()
		.adhereTo((file) => {
			const importsPassport = /import.*Passport.*from.*passport/.test(file.content);
			const importsEntity = /\.entity\.ts/.test(file.content);
			const importsVisa = /Visa.*from/.test(file.content);

			if (!importsPassport || !importsEntity || !importsVisa) {
				allViolations.push(`[${file.path}] Aggregate root must import entity types, Passport, and Visa`);
				return false;
			}
			return true;
		}, 'Aggregate root files must import entity types, Passport, and Visa')
		.check();

	return allViolations;
}

export async function checkVisaConventions(config: DomainConventionsConfig): Promise<string[]> {
	if (!config.domainContextsGlob) {
		throw new Error('checkVisaConventions requires domainContextsGlob to be set');
	}

	const allViolations: string[] = [];

	await projectFiles()
		.inFolder(config.domainContextsGlob)
		.withName('*.visa.ts')
		.should()
		.adhereTo((file) => {
			const extendsVisa = /extends\s+PassportSeedwork\.Visa</.test(file.content);
			if (!extendsVisa) {
				allViolations.push(`[${file.path}] Visa interface does not extend PassportSeedwork.Visa`);
				return false;
			}
			return true;
		}, 'Visa files must export interface extending PassportSeedwork.Visa')
		.check();

	await projectFiles()
		.inFolder(config.domainContextsGlob)
		.withName('*.visa.ts')
		.should()
		.adhereTo((file) => {
			const importsDomainPermissions = /import.*DomainPermissions.*from/.test(file.content);
			if (!importsDomainPermissions) {
				allViolations.push(`[${file.path}] Visa must import domain permissions interface`);
				return false;
			}
			return true;
		}, 'Visa files must import domain permissions interface')
		.check();

	return allViolations;
}
