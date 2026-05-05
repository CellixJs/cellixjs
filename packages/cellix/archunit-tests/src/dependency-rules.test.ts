import { projectFiles } from 'archunit';
import { describe, expect, it } from 'vitest';

describe('Cellix Dependency Rules', () => {
	describe('Circular Dependencies', () => {
		it('cellix packages should not have circular dependencies', async () => {
			const rule = projectFiles().inPath('../*/src/**').withName('*.ts').should().haveNoCycles();
			await expect(rule).toPassAsync();
		});
	});

	describe('Framework Boundaries', () => {
		it('ui-core should not depend on ocom ui-shared', async () => {
			const rule = projectFiles().inFolder('../ui-core/src').shouldNot().dependOnFiles().inPath('../../ocom/ui-shared/src/**');

			await expect(rule).toPassAsync();
		});

		it('ui-core should not depend on ui-community app', async () => {
			const rule = projectFiles().inFolder('../ui-core/src').shouldNot().dependOnFiles().inPath('../../../apps/ui-community/src/**');

			await expect(rule).toPassAsync();
		});
	});
});
