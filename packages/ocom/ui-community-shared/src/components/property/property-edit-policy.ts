/**
 * Presentation capability policy. Route containers decide which policy is
 * appropriate; this policy only controls visible fields and actions.
 */
export interface PropertyEditPolicy {
	readonly canEditPropertyName: boolean;
	readonly canEditPropertyType: boolean;
	readonly canEditOwner: boolean;
	readonly canEditListingContent: boolean;
	readonly canSubmit: boolean;
}

export const PROPERTY_EDIT_POLICIES = {
	managerCreate: {
		canEditPropertyName: true,
		canEditPropertyType: true,
		canEditOwner: true,
		canEditListingContent: true,
		canSubmit: true,
	},
	managerEdit: {
		canEditPropertyName: true,
		canEditPropertyType: true,
		canEditOwner: true,
		canEditListingContent: true,
		canSubmit: true,
	},
	memberCreate: {
		canEditPropertyName: true,
		canEditPropertyType: false,
		canEditOwner: false,
		canEditListingContent: true,
		canSubmit: true,
	},
	memberEdit: {
		canEditPropertyName: false,
		canEditPropertyType: false,
		canEditOwner: false,
		canEditListingContent: true,
		canSubmit: true,
	},
	readOnly: {
		canEditPropertyName: false,
		canEditPropertyType: false,
		canEditOwner: false,
		canEditListingContent: false,
		canSubmit: false,
	},
} as const satisfies Record<string, PropertyEditPolicy>;
