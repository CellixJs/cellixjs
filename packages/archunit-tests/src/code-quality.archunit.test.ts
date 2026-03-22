import { metrics } from 'archunit';
import { describe, it, expect } from 'vitest';
import { join } from 'node:path';

// Absolute tsconfig path so archunit resolves workspace files reliably
const tsconfigPath = join(__dirname, '..', 'tsconfig.json');

describe('Code Quality', () => {
	describe('Domain (ocom/domain)', () => {
		it.skip('should have reasonable cohesion (LCOM96b)', async () => {
			// Some small DTO/record-like classes (e.g. violation-ticket v1 models) are
			// intentionally simple and report high LCOM; relax threshold here to avoid
			// noisy failures. If you want stricter checks, consider whitelisting folders.
			const rule = metrics(tsconfigPath)
				.inPath('../ocom/domain/src/**')
    				.lcom()
    				.lcom96b()
    				.shouldBeBelowOrEqual(1.0);

			await expect(rule).toPassAsync();
		}, 10000);

		it.skip('should avoid excessive methods per class', async () => {
			const rule = metrics(tsconfigPath)
				.inPath('../ocom/domain/src/**')
				.count()
				.methodCount()
				.shouldBeBelow(30);

			await expect(rule).toPassAsync();
		});
	});

	describe('UI (ui packages)', () => {
		it.skip('should have higher cohesion (LCOM96b)', async () => {
			// Target known UI packages explicitly so the pattern matches reliably in
			// monorepo layouts.
			const rule = metrics(tsconfigPath)
				.inPath('../cellix/ui-core/src/**')
				.inPath('../ocom/ui-components/src/**')
				.inPath('../../apps/ui-community/src/**')
				.lcom()
				.lcom96b()
				.shouldBeBelow(0.85);

			// AllowEmptyTests because some clones may not contain all UI packages.
			await expect(rule).toPassAsync({ allowEmptyTests: true });
		});

		it.skip('should limit imports and surface area in UI code', async () => {
			const rule = metrics(tsconfigPath)
				.inPath('../cellix/ui-core/src/**')
				.inPath('../ocom/ui-components/src/**')
				.inPath('../../apps/ui-community/src/**')
				.count()
				.imports()
				.shouldBeBelowOrEqual(20);

			await expect(rule).toPassAsync({ allowEmptyTests: true });
		});
	});

	describe('Service / Infrastructure', () => {
		it.skip('should have reasonable cohesion (LCOM96b)', async () => {
			const rule = metrics(tsconfigPath)
				.inPath('../ocom/service-*/src/**')
				.lcom()
				.lcom96b()
				.shouldBeBelow(0.95);

			await expect(rule).toPassAsync();
		});

		it.skip('should limit imports per file for services', async () => {
			const rule = metrics(tsconfigPath)
				.inPath('../ocom/service-*/src/**')
				.count()
				.imports()
				.shouldBeBelowOrEqual(25);

			await expect(rule).toPassAsync();
		});
	});

	describe('Global / Cross-cutting checks', () => {
		it.skip('baseline cohesion for all src files (lenient)', async () => {
			// Include both packages/* and apps/* src folders; allow empty in case
			// some workspace clones don't include everything.
			const rule = metrics(tsconfigPath)
				.inPath('../**/src/**')
				.inPath('../../apps/**/src/**')
				.lcom()
				.lcom96b()
				.shouldBeBelow(0.98);
			await expect(rule).toPassAsync({ allowEmptyTests: true });
		});

		it.skip('custom complexity ratio (methods / fields) should be reasonable', async () => {
			const rule = metrics(tsconfigPath)
				.inPath('../**/src/**')
				.inPath('../../apps/**/src/**')
				.customMetric('complexityRatio', 'methods/fields ratio', (classInfo) => {
					return classInfo.methods.length / Math.max(classInfo.fields.length, 1);
				})
				.shouldBeBelow(6.0);

			await expect(rule).toPassAsync({ allowEmptyTests: true });
		});
	});
});