export const FEATURE_FLAG_BLOB_NAME = 'feature-flags.json';

export interface FeatureFlag {
	readonly Name: string;
	readonly Description: string;
	readonly Value: string;
	readonly AllowedValues: readonly string[];
	readonly RetirementDate: string;
}

export interface FeatureFlagsPayloadType {
	readonly FeatureFlags: readonly FeatureFlag[];
}

export const FeatureFlagsSchema = {
	$schema: 'https://json-schema.org/draft/2020-12/schema',
	type: 'object',
	properties: {
		FeatureFlags: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					Name: { type: 'string' },
					Description: { type: 'string' },
					Value: { type: 'string' },
					AllowedValues: {
						type: 'array',
						items: { type: 'string' },
					},
					RetirementDate: { type: 'string' },
				},
				additionalProperties: false,
			},
		},
	},
	additionalProperties: false,
} as const;
