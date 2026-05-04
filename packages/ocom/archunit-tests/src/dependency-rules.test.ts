import { projectFiles } from 'archunit';
import { describe, expect, it } from 'vitest';

describe('Dependency Rules', () => {
	describe('Circular Dependencies', () => {
		it('apps should not have circular dependencies', async () => {
			const rule = projectFiles().inPath('../../../apps/**/src/**').withName('*.ts').should().haveNoCycles();
			await expect(rule).toPassAsync();
		}, 60000);

		it('ocom packages should not have circular dependencies', async () => {
			const rule = projectFiles().inPath('../*/src/**').withName('*.ts').should().haveNoCycles();
			await expect(rule).toPassAsync();
		}, 60000);
	});

	describe('api', () => {
		it('domain layer should not depend on persistence layer', async () => {
			const rule = projectFiles().inFolder('../domain').shouldNot().dependOnFiles().inFolder('../persistence');

			await expect(rule).toPassAsync();
		});

		it('domain layer should not depend on infrastructure layer', async () => {
			const rule = projectFiles().inFolder('../domain').shouldNot().dependOnFiles().inPath('../service-*/**');

			await expect(rule).toPassAsync();
		});

		it('domain layer should not depend on application services', async () => {
			const rule = projectFiles().inFolder('../domain').shouldNot().dependOnFiles().inFolder('../application-services');

			await expect(rule).toPassAsync();
		});

		it('application services should not depend on infrastructure', async () => {
			const rule = projectFiles().inFolder('../application-services').shouldNot().dependOnFiles().inPath('../service-*/**');

			await expect(rule).toPassAsync();
		});

		it('GraphQL API layer should not depend on infrastructure directly', async () => {
			const rule = projectFiles().inFolder('../graphql').shouldNot().dependOnFiles().inPath('../service-*/**');

			await expect(rule).toPassAsync();
		});

		it('REST API layer should not depend on infrastructure directly', async () => {
			const rule = projectFiles().inFolder('../rest').shouldNot().dependOnFiles().inPath('../service-*/**');

			await expect(rule).toPassAsync({ allowEmptyTests: true });
		});
	});

	describe('ui-shared', () => {
		it('ui-shared should not depend on ui-community app', async () => {
			const rule = projectFiles().inFolder('../ui-shared').shouldNot().dependOnFiles().inFolder('../../../apps/ui-community');

			await expect(rule).toPassAsync();
		});
	});
});
