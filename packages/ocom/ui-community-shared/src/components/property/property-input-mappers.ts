import type { ManagerPropertyInputFields, MemberPropertyCreateInput, MemberPropertyUpdateInput, PropertyFormValues, PropertyListingContentInput, PropertyRecord } from './property-types.ts';

/** Splits a comma-separated string into trimmed, non-empty entries. */
const splitCommaList = (value?: string | null): string[] =>
	(value ?? '')
		.split(',')
		.map((part) => part.trim())
		.filter((part) => part.length > 0);

const trimmedOrNull = (value?: string | null): string | null => {
	const trimmed = (value ?? '').trim();
	return trimmed.length > 0 ? trimmed : null;
};

/** Joins list entries into comma-separated form text, dropping blank values. */
export const joinCommaList = (values?: readonly (string | null | undefined)[] | null): string => (values ?? []).filter((value): value is string => typeof value === 'string' && value.trim().length > 0).join(', ');

/**
 * Converts a record into form values without leaking route or generated-type
 * dependencies into presentation components.
 */
export const propertyRecordToFormValues = (data: PropertyRecord): PropertyFormValues => ({
	propertyName: data.propertyName,
	propertyType: data.propertyType ?? undefined,
	ownerId: data.owner ? String(data.owner.id) : undefined,
	listedForSale: data.listedForSale ?? false,
	listedForRent: data.listedForRent ?? false,
	listedForLease: data.listedForLease ?? false,
	listedInDirectory: data.listedInDirectory ?? false,
	tags: joinCommaList(data.tags),
	location: {
		address: {
			streetNumber: data.location?.address?.streetNumber ?? undefined,
			streetName: data.location?.address?.streetName ?? undefined,
			municipality: data.location?.address?.municipality ?? undefined,
			countrySubdivision: data.location?.address?.countrySubdivision ?? undefined,
			postalCode: data.location?.address?.postalCode ?? undefined,
			country: data.location?.address?.country ?? undefined,
		},
	},
	listingDetail: {
		price: data.listingDetail?.price ?? undefined,
		rentHigh: data.listingDetail?.rentHigh ?? undefined,
		rentLow: data.listingDetail?.rentLow ?? undefined,
		lease: data.listingDetail?.lease ?? undefined,
		maxGuests: data.listingDetail?.maxGuests ?? undefined,
		bedrooms: data.listingDetail?.bedrooms ?? undefined,
		bathrooms: data.listingDetail?.bathrooms ?? undefined,
		squareFeet: data.listingDetail?.squareFeet ?? undefined,
		yearBuilt: data.listingDetail?.yearBuilt ?? undefined,
		lotSize: data.listingDetail?.lotSize ?? undefined,
		description: data.listingDetail?.description ?? undefined,
		amenities: joinCommaList(data.listingDetail?.amenities),
		bedroomDetails: (data.listingDetail?.bedroomDetails ?? []).map((detail) => ({
			roomName: detail.roomName ?? undefined,
			bedDescriptions: joinCommaList(detail.bedDescriptions),
		})),
		additionalAmenities: (data.listingDetail?.additionalAmenities ?? []).map((amenity) => ({
			category: amenity.category ?? undefined,
			amenities: joinCommaList(amenity.amenities),
		})),
		images: joinCommaList(data.listingDetail?.images),
		video: data.listingDetail?.video ?? undefined,
		floorPlan: data.listingDetail?.floorPlan ?? undefined,
		floorPlanImages: joinCommaList(data.listingDetail?.floorPlanImages),
		listingAgent: data.listingDetail?.listingAgent ?? undefined,
		listingAgentPhone: data.listingDetail?.listingAgentPhone ?? undefined,
		listingAgentEmail: data.listingDetail?.listingAgentEmail ?? undefined,
		listingAgentWebsite: data.listingDetail?.listingAgentWebsite ?? undefined,
		listingAgentCompany: data.listingDetail?.listingAgentCompany ?? undefined,
		listingAgentCompanyPhone: data.listingDetail?.listingAgentCompanyPhone ?? undefined,
		listingAgentCompanyEmail: data.listingDetail?.listingAgentCompanyEmail ?? undefined,
		listingAgentCompanyWebsite: data.listingDetail?.listingAgentCompanyWebsite ?? undefined,
		listingAgentCompanyAddress: data.listingDetail?.listingAgentCompanyAddress ?? undefined,
	},
});

/**
 * Builds the listing-content portion explicitly. Member builders below only
 * spread this positive allowlist, so restricted fields cannot be serialized
 * accidentally through a hidden field or an object cast.
 */
export const toPropertyListingContentInput = (values: PropertyFormValues): PropertyListingContentInput => ({
	listedForSale: values.listedForSale ?? false,
	listedForRent: values.listedForRent ?? false,
	listedForLease: values.listedForLease ?? false,
	listedInDirectory: values.listedInDirectory ?? false,
	tags: splitCommaList(values.tags),
	location: {
		address: {
			streetNumber: trimmedOrNull(values.location?.address?.streetNumber),
			streetName: trimmedOrNull(values.location?.address?.streetName),
			municipality: trimmedOrNull(values.location?.address?.municipality),
			countrySubdivision: trimmedOrNull(values.location?.address?.countrySubdivision),
			postalCode: trimmedOrNull(values.location?.address?.postalCode),
			country: trimmedOrNull(values.location?.address?.country),
		},
	},
	listingDetail: {
		price: values.listingDetail?.price ?? null,
		rentHigh: values.listingDetail?.rentHigh ?? null,
		rentLow: values.listingDetail?.rentLow ?? null,
		lease: values.listingDetail?.lease ?? null,
		maxGuests: values.listingDetail?.maxGuests ?? null,
		bedrooms: values.listingDetail?.bedrooms ?? null,
		bathrooms: values.listingDetail?.bathrooms ?? null,
		squareFeet: values.listingDetail?.squareFeet ?? null,
		yearBuilt: values.listingDetail?.yearBuilt ?? null,
		lotSize: values.listingDetail?.lotSize ?? null,
		description: trimmedOrNull(values.listingDetail?.description),
		amenities: splitCommaList(values.listingDetail?.amenities),
		bedroomDetails: (values.listingDetail?.bedroomDetails ?? []).map((row) => ({
			roomName: trimmedOrNull(row.roomName),
			bedDescriptions: splitCommaList(row.bedDescriptions),
		})),
		additionalAmenities: (values.listingDetail?.additionalAmenities ?? []).map((row) => ({
			category: trimmedOrNull(row.category),
			amenities: splitCommaList(row.amenities),
		})),
		images: splitCommaList(values.listingDetail?.images),
		video: trimmedOrNull(values.listingDetail?.video),
		floorPlan: trimmedOrNull(values.listingDetail?.floorPlan),
		floorPlanImages: splitCommaList(values.listingDetail?.floorPlanImages),
		listingAgent: trimmedOrNull(values.listingDetail?.listingAgent),
		listingAgentPhone: trimmedOrNull(values.listingDetail?.listingAgentPhone),
		listingAgentEmail: trimmedOrNull(values.listingDetail?.listingAgentEmail),
		listingAgentWebsite: trimmedOrNull(values.listingDetail?.listingAgentWebsite),
		listingAgentCompany: trimmedOrNull(values.listingDetail?.listingAgentCompany),
		listingAgentCompanyPhone: trimmedOrNull(values.listingDetail?.listingAgentCompanyPhone),
		listingAgentCompanyEmail: trimmedOrNull(values.listingDetail?.listingAgentCompanyEmail),
		listingAgentCompanyWebsite: trimmedOrNull(values.listingDetail?.listingAgentCompanyWebsite),
		listingAgentCompanyAddress: trimmedOrNull(values.listingDetail?.listingAgentCompanyAddress),
	},
});

/** Builds manager form fields, including manager-only type and owner controls. */
export const toManagerPropertyInputFields = (values: PropertyFormValues): ManagerPropertyInputFields => ({
	propertyType: trimmedOrNull(values.propertyType),
	ownerId: values.ownerId ?? null,
	...toPropertyListingContentInput(values),
});

/** Builds the strict member-create mutation payload. */
export const toMemberPropertyCreateInput = (values: PropertyFormValues): MemberPropertyCreateInput => ({
	propertyName: (values.propertyName ?? '').trim(),
	...toPropertyListingContentInput(values),
});

/** Builds the strict member-update mutation payload. */
export const toMemberPropertyUpdateInput = (id: string, values: PropertyFormValues): MemberPropertyUpdateInput => ({
	id,
	...toPropertyListingContentInput(values),
});
