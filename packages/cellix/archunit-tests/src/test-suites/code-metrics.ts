import { describe, it } from 'vitest';
import { checkCodeMetrics } from '../checks/code-metrics.js';

export function describeCodeMetricsTests(): void {
	describe('Code Metrics', () => {
		describe('Lines of Code', () => {
			it.skip('files should not exceed maximum lines of code', async () => {
				await checkCodeMetrics({});
			});
		});

		describe('Complexity', () => {
			it.skip('methods should not exceed maximum cyclomatic complexity', async () => {
				await checkCodeMetrics({});
			});
		});
	});
}
