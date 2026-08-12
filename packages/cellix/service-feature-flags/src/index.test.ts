import { type FeatureFlagTextSource, ServiceFeatureFlags } from '@cellix/service-feature-flags';
import { describe, expect, it } from 'vitest';

const featureFlags = {
	FeatureFlags: [
		{
			Name: 'NEW_MEMBER_FLOW',
			Description: 'Enables the new member flow',
			Value: 'true',
			AllowedValues: ['true', 'false'],
			RetirementDate: '2026-12-31',
		},
	],
};

function createSource(content: string | undefined): FeatureFlagTextSource {
	return {
		downloadText: async () => content,
	};
}

describe('@cellix/service-feature-flags ServiceFeatureFlags', () => {
	it('reads and validates a feature-flag document from its configured source', async () => {
		const service = new ServiceFeatureFlags(createSource(JSON.stringify(featureFlags)), {
			containerName: 'public',
			blobName: 'flags-production.json',
		});

		await expect(service.startUp()).resolves.toBe(service);
		await expect(service.getFeatureFlags()).resolves.toEqual(featureFlags);
		await expect(service.shutDown()).resolves.toBeUndefined();
	});

	it('uses the configured fallback document when the source has no feature-flag document', async () => {
		const service = new ServiceFeatureFlags(createSource(undefined), {
			containerName: 'public',
			blobName: 'flags-production.json',
			fallback: { FeatureFlags: [] },
		});

		await expect(service.getFeatureFlags()).resolves.toEqual({ FeatureFlags: [] });
	});

	it('rejects an invalid feature-flag document', async () => {
		const service = new ServiceFeatureFlags(createSource('{"featureFlags":[]}'), {
			containerName: 'public',
			blobName: 'flags-production.json',
		});

		await expect(service.getFeatureFlags()).rejects.toThrow('Feature flag payload validation failed');
	});

	it('requires a configured feature-flag blob name', () => {
		expect(
			() =>
				new ServiceFeatureFlags(createSource(undefined), {
					containerName: 'public',
					blobName: '',
				}),
		).toThrow("Provide a non-empty 'blobName' for feature-flag retrieval");
	});
});
