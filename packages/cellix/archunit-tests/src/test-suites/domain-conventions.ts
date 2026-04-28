import { describe, expect, it } from 'vitest';
import { checkAggregateRootConventions, checkRepositoryConventions, checkUnitOfWorkConventions, checkVisaConventions } from '../checks/domain-conventions.js';

export interface DomainConventionTestsConfig {
	domainContextsGlob: string;
}

export function describeDomainConventionTests(config: DomainConventionTestsConfig): void {
	describe('Domain Layer Conventions', () => {
		describe('Repository Files', () => {
			it('repository files must extend DomainSeedwork.Repository', async () => {
				const violations = await checkRepositoryConventions({
					domainContextsGlob: config.domainContextsGlob,
				});
				expect(violations.filter((v) => v.includes('extends'))).toStrictEqual([]);
			}, 30000);

			it('repository files should not export concrete classes', async () => {
				const violations = await checkRepositoryConventions({
					domainContextsGlob: config.domainContextsGlob,
				});
				expect(violations.filter((v) => v.includes('class'))).toStrictEqual([]);
			}, 30000);
		});

		describe('Unit of Work Files', () => {
			it('UoW files must extend DomainSeedwork.UnitOfWork and InitializedUnitOfWork', async () => {
				const violations = await checkUnitOfWorkConventions({
					domainContextsGlob: config.domainContextsGlob,
				});
				expect(violations.filter((v) => v.includes('extends'))).toStrictEqual([]);
			}, 30000);

			it('UoW files must import Passport, entity, repository, and aggregate', async () => {
				const violations = await checkUnitOfWorkConventions({
					domainContextsGlob: config.domainContextsGlob,
				});
				expect(violations.filter((v) => v.includes('import'))).toStrictEqual([]);
			}, 30000);

			it('UoW files should not have concrete implementations', async () => {
				const violations = await checkUnitOfWorkConventions({
					domainContextsGlob: config.domainContextsGlob,
				});
				expect(violations.filter((v) => v.includes('class'))).toStrictEqual([]);
			}, 30000);
		});

		describe('Aggregate Root Files', () => {
			it('aggregate root files must be named with .aggregate.ts extension', async () => {
				const violations = await checkAggregateRootConventions({
					domainContextsGlob: config.domainContextsGlob,
				});
				expect(violations.filter((v) => v.includes('extension'))).toStrictEqual([]);
			}, 30000);

			it('aggregate root files must export a class extending DomainSeedwork.AggregateRoot', async () => {
				const violations = await checkAggregateRootConventions({
					domainContextsGlob: config.domainContextsGlob,
				});
				expect(violations.filter((v) => v.includes('extends'))).toStrictEqual([]);
			}, 30000);

			it('aggregate root files must have a static getNewInstance method', async () => {
				const violations = await checkAggregateRootConventions({
					domainContextsGlob: config.domainContextsGlob,
				});
				expect(violations.filter((v) => v.includes('getNewInstance'))).toStrictEqual([]);
			}, 30000);

			it('aggregate root files must import entity, Passport, and Visa', async () => {
				const violations = await checkAggregateRootConventions({
					domainContextsGlob: config.domainContextsGlob,
				});
				expect(violations.filter((v) => v.includes('import'))).toStrictEqual([]);
			}, 30000);
		});

		describe('Visa Files', () => {
			it('visa files must export interface extending PassportSeedwork.Visa', async () => {
				const violations = await checkVisaConventions({
					domainContextsGlob: config.domainContextsGlob,
				});
				expect(violations.filter((v) => v.includes('extends')).length).toBeLessThanOrEqual(1);
			}, 30000);

			it('visa files must import domain permissions interface', async () => {
				const violations = await checkVisaConventions({
					domainContextsGlob: config.domainContextsGlob,
				});
				expect(violations.filter((v) => v.includes('permissions'))).toStrictEqual([]);
			}, 30000);
		});
	});
}
