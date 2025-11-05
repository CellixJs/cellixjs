import { join } from 'node:path';
import { metrics } from 'archunit';
import { describe, expect, it } from 'vitest';

const tsconfigPath = join(__dirname, '..', 'tsconfig.json');

describe('Code Metrics', () => {
	describe('File Size', () => {
	    // This check can be slow on large repos; give it more timeout headroom
        it('should not contain too large files', async () => {
            const rule = metrics(tsconfigPath)
                .inPath('../../**/src/**/*.ts')
                .count()
                .linesOfCode()
                .shouldBeBelow(1000);
            // Enable debug logging to list analyzed files when troubleshooting
            await expect(rule).toPassAsync();
        }, 15000);

		it('should limit statements per file (excluding tests)', async () => {
			const rule = metrics(tsconfigPath)
				.inPath('../../**/src/**/*.ts')
				.count()
				.statements()
				.shouldBeBelowOrEqual(250);
			await expect(rule).toPassAsync();
		}, 15000);
	});

	describe('Class Structure', () => {
		it('should limit methods per class', async () => {
			const rule = metrics(tsconfigPath)
				.inPath('../**/src/**/*.ts')
				.count()
				.methodCount()
				.shouldBeBelow(20);
			await expect(rule).toPassAsync();
		});

		it('should limit fields per class', async () => {
			const rule = metrics(tsconfigPath)
				.inPath('../**/src/**/*.ts')
				.count()
				.fieldCount()
				.shouldBeBelow(15);
			await expect(rule).toPassAsync();
		});
	});

	describe('Coupling', () => {
		it('should limit imports per file', async () => {
			const rule = metrics(tsconfigPath)
				.inPath('../**/src/**/*.ts')
				.count()
				.imports()
				.shouldBeBelowOrEqual(20);
			await expect(rule).toPassAsync();
		});
	});
});