import type { PropertyFullListingDetailInput, PropertyFullResult, PropertyFullSharedInput } from '../../../shared/graphql/property-field-operations.ts';

/** Flat Gherkin table of property field values, keyed by camelCase field name. */
export type PropertyFullFieldTable = Record<string, string>;

const ADDRESS_KEYS = ['streetNumber', 'streetName', 'municipality', 'countrySubdivision', 'postalCode', 'country'] as const;
const FLAG_KEYS = ['listedForSale', 'listedForRent', 'listedForLease', 'listedInDirectory'] as const;
const LISTING_NUMBER_KEYS = ['price', 'rentHigh', 'rentLow', 'lease', 'maxGuests', 'bedrooms', 'bathrooms', 'squareFeet', 'yearBuilt', 'lotSize'] as const;
const LISTING_STRING_KEYS = [
	'description',
	'video',
	'floorPlan',
	'listingAgent',
	'listingAgentPhone',
	'listingAgentEmail',
	'listingAgentWebsite',
	'listingAgentCompany',
	'listingAgentCompanyPhone',
	'listingAgentCompanyEmail',
	'listingAgentCompanyWebsite',
	'listingAgentCompanyAddress',
] as const;
const LISTING_ARRAY_KEYS = ['amenities', 'images', 'floorPlanImages'] as const;

type AddressKey = (typeof ADDRESS_KEYS)[number];
type FlagKey = (typeof FLAG_KEYS)[number];
type ListingNumberKey = (typeof LISTING_NUMBER_KEYS)[number];
type ListingStringKey = (typeof LISTING_STRING_KEYS)[number];
type ListingArrayKey = (typeof LISTING_ARRAY_KEYS)[number];

/** Split a comma-separated Gherkin cell into trimmed values. */
export function splitList(value: string): string[] {
	return value
		.split(',')
		.map((part) => part.trim())
		.filter((part) => part.length > 0);
}

/**
 * Convert a flat Gherkin field table into the nested shared shape of the
 * full-field property create/update inputs. Absent keys are left undefined so
 * the API treats them as "leave unchanged".
 */
export function toFullPropertySharedInput(details: PropertyFullFieldTable): PropertyFullSharedInput {
	const input: PropertyFullSharedInput = {};

	if (details['propertyType'] !== undefined) {
		input.propertyType = details['propertyType'];
	}
	for (const key of FLAG_KEYS) {
		if (details[key] !== undefined) {
			input[key satisfies FlagKey] = details[key] === 'true';
		}
	}
	if (details['tags'] !== undefined) {
		input.tags = splitList(details['tags']);
	}

	if (ADDRESS_KEYS.some((key) => details[key] !== undefined)) {
		const address: Partial<Record<AddressKey, string>> = {};
		for (const key of ADDRESS_KEYS) {
			if (details[key] !== undefined) {
				address[key] = details[key];
			}
		}
		input.location = { address };
	}

	const listingDetail: PropertyFullListingDetailInput = {};
	let hasListingDetail = false;
	for (const key of LISTING_NUMBER_KEYS) {
		if (details[key] !== undefined) {
			listingDetail[key satisfies ListingNumberKey] = Number(details[key]);
			hasListingDetail = true;
		}
	}
	for (const key of LISTING_STRING_KEYS) {
		if (details[key] !== undefined) {
			listingDetail[key satisfies ListingStringKey] = details[key];
			hasListingDetail = true;
		}
	}
	for (const key of LISTING_ARRAY_KEYS) {
		if (details[key] !== undefined) {
			listingDetail[key satisfies ListingArrayKey] = splitList(details[key]);
			hasListingDetail = true;
		}
	}
	if (hasListingDetail) {
		input.listingDetail = listingDetail;
	}

	return input;
}

/**
 * Read the value a flat field table key holds on a full property result,
 * normalized to a comparable string ('' when unset).
 */
export function actualFullFieldValue(property: PropertyFullResult, key: string): string {
	if (key === 'propertyName') {
		return property.propertyName;
	}
	if (key === 'propertyType') {
		return property.propertyType ?? '';
	}
	if ((FLAG_KEYS as readonly string[]).includes(key)) {
		return String(property[key as FlagKey]);
	}
	if (key === 'tags') {
		return (property.tags ?? []).join(', ');
	}
	if ((ADDRESS_KEYS as readonly string[]).includes(key)) {
		return property.location?.address?.[key as AddressKey] ?? '';
	}
	if ((LISTING_NUMBER_KEYS as readonly string[]).includes(key)) {
		const value = property.listingDetail?.[key as ListingNumberKey];
		return value === null || value === undefined ? '' : String(value);
	}
	if ((LISTING_STRING_KEYS as readonly string[]).includes(key)) {
		return property.listingDetail?.[key as ListingStringKey] ?? '';
	}
	if ((LISTING_ARRAY_KEYS as readonly string[]).includes(key)) {
		return (property.listingDetail?.[key as ListingArrayKey] ?? []).join(', ');
	}
	throw new Error(`Unknown property field key "${key}" in the scenario table`);
}

/** Normalize an expected Gherkin cell for comparison against {@link actualFullFieldValue}. */
export function normalizeExpectedFieldValue(key: string, raw: string): string {
	if ((LISTING_NUMBER_KEYS as readonly string[]).includes(key)) {
		return String(Number(raw));
	}
	if (key === 'tags' || (LISTING_ARRAY_KEYS as readonly string[]).includes(key)) {
		return splitList(raw).join(', ');
	}
	return raw.trim();
}
