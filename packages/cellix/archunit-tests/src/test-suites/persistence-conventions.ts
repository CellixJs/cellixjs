import { beforeAll, describe, expect, it } from 'vitest';
import {
	checkPersistenceAbstractionDependencies,
	checkPersistenceDependencyBoundaries,
	checkPersistenceDomainAdapterConventions,
	checkPersistenceReadonlyDataConventions,
	checkPersistenceRepositoryConventions,
	checkPersistenceUnitOfWorkConventions,
} from '../checks/persistence-conventions.js';

export interface PersistenceConventionTestsConfig {
	persistenceDomainGlob: string;
	persistenceReadonlyGlob: string;
	persistenceAllGlob: string;
	persistenceFixtureGlob?: string;
}

export function describePersistenceConventionTests(config: PersistenceConventionTestsConfig): void {
	describe('Persistence Layer Conventions', () => {
		describe('Domain Repository Files', () => {
			let repositoryViolations: string[];

			beforeAll(async () => {
				repositoryViolations = await checkPersistenceRepositoryConventions({
					persistenceDomainGlob: config.persistenceDomainGlob,
				});
			}, 30000);

			it('repository classes must extend MongooseSeedwork.MongoRepositoryBase', () => {
				expect(repositoryViolations.filter((v) => v.includes('MongoRepositoryBase'))).toStrictEqual([]);
			});

			it('repository classes must implement domain repository interfaces', () => {
				expect(repositoryViolations.filter((v) => v.includes('Domain.Contexts'))).toStrictEqual([]);
			});

			it('detects repository convention violations in fixture files', async () => {
				if (!config.persistenceFixtureGlob) {
					console.log('⊘ Fixture glob not provided, skipping violation detection test');
					return;
				}
				const fixtureViolations = await checkPersistenceRepositoryConventions({
					persistenceDomainGlob: config.persistenceFixtureGlob,
				});
				expect(fixtureViolations.length).toBeGreaterThan(0);
			}, 30000);
		});

		describe('Domain Adapter Files', () => {
			let adapterViolations: string[];

			beforeAll(async () => {
				adapterViolations = await checkPersistenceDomainAdapterConventions({
					persistenceDomainGlob: config.persistenceDomainGlob,
				});
			}, 30000);

			it('domain adapters must extend MongooseSeedwork.MongooseDomainAdapter', () => {
				expect(adapterViolations.filter((v) => v.includes('MongooseDomainAdapter'))).toStrictEqual([]);
			});

			it('domain adapter files must contain a MongoTypeConverter', () => {
				expect(adapterViolations.filter((v) => v.includes('MongoTypeConverter'))).toStrictEqual([]);
			});
		});

		describe('Unit of Work Files', () => {
			let uowViolations: string[];

			beforeAll(async () => {
				uowViolations = await checkPersistenceUnitOfWorkConventions({
					persistenceDomainGlob: config.persistenceDomainGlob,
				});
			}, 30000);

			it('UoW files must use MongooseSeedwork.MongoUnitOfWork', () => {
				expect(uowViolations.filter((v) => v.includes('MongoUnitOfWork'))).toStrictEqual([]);
			});

			it('UoW files must wire both InProcEventBusInstance and NodeEventBusInstance', () => {
				expect(uowViolations.filter((v) => v.includes('EventBus'))).toStrictEqual([]);
			});

			it('UoW files must export a factory function named get*UnitOfWork', () => {
				expect(uowViolations.filter((v) => v.includes('factory'))).toStrictEqual([]);
			});
		});

		describe('Readonly Data Source Files', () => {
			it('readonly data source files must extend MongoDataSourceImpl', async () => {
				const violations = await checkPersistenceReadonlyDataConventions({
					persistenceReadonlyGlob: config.persistenceReadonlyGlob,
				});
				expect(violations).toStrictEqual([]);
			}, 30000);
		});

		describe('Dependency Boundaries', () => {
			let boundaryViolations: string[];

			beforeAll(async () => {
				boundaryViolations = await checkPersistenceDependencyBoundaries({
					persistenceAllGlob: config.persistenceAllGlob,
				});
			}, 30000);

			it('persistence must not import from @ocom/application-services', () => {
				expect(boundaryViolations.filter((v) => v.includes('application-services'))).toStrictEqual([]);
			});

			it('persistence must not import from @ocom/graphql', () => {
				expect(boundaryViolations.filter((v) => v.includes('graphql'))).toStrictEqual([]);
			});
		});

		describe('Abstraction Dependencies', () => {
			let abstractionViolations: string[];

			beforeAll(async () => {
				abstractionViolations = await checkPersistenceAbstractionDependencies({
					persistenceAllGlob: config.persistenceAllGlob,
				});
			}, 30000);

			it('messaging persistence must depend on @cellix/service-messaging-base, not concrete implementations', () => {
				expect(abstractionViolations.filter((v) => v.includes('messaging'))).toStrictEqual([]);
			});

			it('payment persistence must depend on @cellix/service-payment-base, not concrete implementations', () => {
				expect(abstractionViolations.filter((v) => v.includes('payment'))).toStrictEqual([]);
			});
		});
	});
}
