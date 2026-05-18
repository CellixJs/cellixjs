import { beforeAll, describe, expect, it } from 'vitest';
import {
	checkApplicationServicesDependencyBoundaries,
	checkApplicationServicesFactoryPattern,
	checkApplicationServicesIndexComposition,
	checkApplicationServicesQueryPattern,
	checkApplicationServicesTransactionUsage,
} from '../checks/application-services-conventions.js';

export interface ApplicationServicesConventionTestsConfig {
	applicationServicesGlob: string;
	applicationServicesAllGlob: string;
	applicationServicesFixtureGlob?: string;
}

export function describeApplicationServicesConventionTests(config: ApplicationServicesConventionTestsConfig): void {
	describe('Application Services Conventions', () => {
		describe('Factory Pattern', () => {
			let factoryViolations: string[];

			beforeAll(async () => {
				factoryViolations = await checkApplicationServicesFactoryPattern({
					applicationServicesGlob: config.applicationServicesGlob,
				});
			}, 30000);

			it('action files must follow curried factory pattern: (dataSources) => async (command) => result', () => {
				expect(factoryViolations).toStrictEqual([]);
			});

			it('detects factory pattern violations in fixture files', async () => {
				if (!config.applicationServicesFixtureGlob) {
					console.log('⊘ Fixture glob not provided, skipping violation detection test');
					return;
				}
				const fixtureViolations = await checkApplicationServicesFactoryPattern({
					applicationServicesGlob: config.applicationServicesFixtureGlob,
				});
				expect(fixtureViolations.length).toBeGreaterThan(0);
			}, 30000);
		});

		describe('Dependency Boundaries', () => {
			let boundaryViolations: string[];

			beforeAll(async () => {
				boundaryViolations = await checkApplicationServicesDependencyBoundaries({
					applicationServicesAllGlob: config.applicationServicesAllGlob,
				});
			}, 30000);

			it('must not import mongoose directly', () => {
				expect(boundaryViolations.filter((v) => v.includes('mongoose directly'))).toStrictEqual([]);
			});

			it('must not import @cellix/mongoose-seedwork', () => {
				expect(boundaryViolations.filter((v) => v.includes('mongoose-seedwork'))).toStrictEqual([]);
			});

			it('must not import @ocom/data-sources-mongoose-models', () => {
				expect(boundaryViolations.filter((v) => v.includes('data-sources-mongoose-models'))).toStrictEqual([]);
			});

			it('must not import from @ocom/graphql', () => {
				expect(boundaryViolations.filter((v) => v.includes('graphql'))).toStrictEqual([]);
			});

			it('detects dependency boundary violations in fixture files', async () => {
				if (!config.applicationServicesFixtureGlob) {
					console.log('⊘ Fixture glob not provided, skipping violation detection test');
					return;
				}
				const fixtureViolations = await checkApplicationServicesDependencyBoundaries({
					applicationServicesAllGlob: config.applicationServicesFixtureGlob,
				});
				expect(fixtureViolations.length).toBeGreaterThan(0);
			}, 30000);
		});

		describe('Index Composition', () => {
			let indexViolations: string[];

			beforeAll(async () => {
				indexViolations = await checkApplicationServicesIndexComposition({
					applicationServicesGlob: config.applicationServicesGlob,
				});
			}, 30000);

			it('entity-level index files must define an ApplicationService interface', () => {
				expect(indexViolations).toStrictEqual([]);
			});
		});

		describe('CQRS Patterns', () => {
			let transactionViolations: string[];
			let queryViolations: string[];

			beforeAll(async () => {
				transactionViolations = await checkApplicationServicesTransactionUsage({
					applicationServicesGlob: config.applicationServicesGlob,
				});
				queryViolations = await checkApplicationServicesQueryPattern({
					applicationServicesGlob: config.applicationServicesGlob,
				});
			}, 30000);

			it('mutation actions (create/update/delete) must use withScopedTransaction', () => {
				expect(transactionViolations).toStrictEqual([]);
			});

			it('query actions must use readonlyDataSource', () => {
				expect(queryViolations).toStrictEqual([]);
			});
		});
	});
}
