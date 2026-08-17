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
