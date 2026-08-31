import { describe, expect, it } from 'vitest';
import featureFlagDefaultValues from './feature-flag-default-values.json' with { type: 'json' };

const expectedFeatureFlags = [
	'MAINTENANCE_MSG_SYSTEM_UI_COMMUNITY_PORTAL',
	'MAINTENANCE_MSG_IMPENDING_UI_COMMUNITY_PORTAL',
	'MAINTENANCE_IMPENDING_TIMESTAMP_UI_COMMUNITY_PORTAL',
	'MAINTENANCE_START_TIMESTAMP_UI_COMMUNITY_PORTAL',
	'MAINTENANCE_END_TIMESTAMP_UI_COMMUNITY_PORTAL',
	'MAINTENANCE_UPCOMING_UI_COMMUNITY_PORTAL',
];

describe('community feature-flag defaults', () => {
	it('includes the standard Community Portal maintenance flags', () => {
		expect(featureFlagDefaultValues.FeatureFlags.map((featureFlag) => featureFlag.Name)).toEqual(expect.arrayContaining(expectedFeatureFlags));
	});
});
