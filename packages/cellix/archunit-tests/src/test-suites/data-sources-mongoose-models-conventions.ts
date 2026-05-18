import { beforeAll, describe, expect, it } from 'vitest';
import { checkModelBarrelFiles, checkModelDependencyBoundaries, checkModelFileConventions, checkStandaloneModelConventions } from '../checks/data-sources-mongoose-models-conventions.js';

export interface DataSourcesMongooseModelsConventionTestsConfig {
	modelsGlob: string;
	allGlob: string;
	modelsFixtureGlob?: string;
}

export function describeDataSourcesMongooseModelsConventionTests(config: DataSourcesMongooseModelsConventionTestsConfig): void {
	describe('Data Sources Mongoose Models Conventions', () => {
		describe('Model File Conventions', () => {
			let fileViolations: string[];

			beforeAll(async () => {
				fileViolations = await checkModelFileConventions({ modelsGlob: config.modelsGlob });
			}, 30000);

			it('model files must export a *ModelFactory', () => {
				expect(fileViolations.filter((v) => v.includes('ModelFactory'))).toStrictEqual([]);
			});

			it('model files must export a *ModelType type alias', () => {
				expect(fileViolations.filter((v) => v.includes('ModelType'))).toStrictEqual([]);
			});

			it('model files must export a *ModelName constant', () => {
				expect(fileViolations.filter((v) => v.includes('ModelName'))).toStrictEqual([]);
			});

			it('detects model file convention violations in fixture files', async () => {
				if (!config.modelsFixtureGlob) {
					console.log('⊘ Fixture glob not provided, skipping violation detection test');
					return;
				}
				const fixtureViolations = await checkModelFileConventions({ modelsGlob: config.modelsFixtureGlob });
				expect(fixtureViolations.length).toBeGreaterThan(0);
			}, 30000);
		});

		describe('Dependency Boundaries', () => {
			let boundaryViolations: string[];

			beforeAll(async () => {
				boundaryViolations = await checkModelDependencyBoundaries({ allGlob: config.allGlob });
			}, 30000);

			it('must not import from domain, persistence, application-services, or graphql', () => {
				expect(boundaryViolations).toStrictEqual([]);
			});
		});

		describe('Model Directory Structure', () => {
			let barrelViolations: string[];

			beforeAll(async () => {
				barrelViolations = await checkModelBarrelFiles({ modelsGlob: config.modelsGlob });
			}, 30000);

			it('model files must live in named subdirectories under models/', () => {
				expect(barrelViolations).toStrictEqual([]);
			});
		});

		describe('Standalone Model Conventions', () => {
			let standaloneViolations: string[];

			beforeAll(async () => {
				standaloneViolations = await checkStandaloneModelConventions({ modelsGlob: config.modelsGlob });
			}, 30000);

			it('standalone models using modelFactory must extend MongooseSeedwork.Base', () => {
				expect(standaloneViolations).toStrictEqual([]);
			});
		});
	});
}
