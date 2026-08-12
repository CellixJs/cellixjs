import { ServiceFeatureFlags as CellixServiceFeatureFlags } from '@cellix/service-feature-flags';
import { describe, expect, it } from 'vitest';
import { ServiceFeatureFlags } from './index.js';

describe('@ocom/service-feature-flags', () => {
	it('re-exports the Cellix service for application-composed feature flag sources', () => {
		const source = {
			downloadText: async () => undefined,
		};
		const service = new ServiceFeatureFlags(source, {
			containerName: 'public',
			blobName: 'feature-flags.json',
		});

		expect(service).toBeInstanceOf(CellixServiceFeatureFlags);
	});
});
