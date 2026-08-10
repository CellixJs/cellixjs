import type { UpdatePropertyDetails } from '../../../shared/abilities/update-property.ts';
import type { PropertyUpdateDetails } from '../notes/property-notes.ts';

/** Convert flat scenario update details into the nested propertyUpdate input shape. */
export function toUpdatePropertyInput(propertyId: string, details: PropertyUpdateDetails): UpdatePropertyDetails {
	const hasListingDetail = details.bedrooms !== undefined || details.bathrooms !== undefined || details.squareFeet !== undefined;
	return {
		id: propertyId,
		propertyName: details.propertyName,
		propertyType: details.propertyType,
		listingDetail: hasListingDetail
			? {
					bedrooms: details.bedrooms,
					bathrooms: details.bathrooms,
					squareFeet: details.squareFeet,
				}
			: undefined,
	};
}
