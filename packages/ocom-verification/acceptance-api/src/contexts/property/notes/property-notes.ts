/** Input details used when updating a property through the API. */
export interface PropertyUpdateDetails {
	propertyName?: string | undefined;
	propertyType?: string | undefined;
	bedrooms?: number | null | undefined;
	bathrooms?: number | null | undefined;
	squareFeet?: number | null | undefined;
}

/** Scenario-local property state shared between tasks and questions via actor notes. */
export interface PropertyNotes {
	activeCommunityId: string;
	activeCommunityName: string;
	actingMemberId: string;
	lastPropertyStatus: string;
	lastPropertyId: string;
	lastPropertyName: string;
	lastPropertyError: string;
	listedPropertyNames: string[];
	viewedPropertyId: string;
	viewedPropertyName: string;
}
