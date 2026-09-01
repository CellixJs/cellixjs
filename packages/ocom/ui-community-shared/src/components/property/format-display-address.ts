/** Address parts accepted by {@link formatDisplayAddress}. */
interface DisplayAddressParts {
	streetNumber?: string | null | undefined;
	streetName?: string | null | undefined;
	municipality?: string | null | undefined;
	countrySubdivision?: string | null | undefined;
	postalCode?: string | null | undefined;
	country?: string | null | undefined;
}

const nonEmpty = (value?: string | null): value is string => typeof value === 'string' && value.trim().length > 0;

/**
 * Formats an address as `streetNumber streetName, municipality,
 * countrySubdivision postalCode`, joining only the non-empty parts.
 * Returns `N/A` when no part is set.
 */
export const formatDisplayAddress = (address?: DisplayAddressParts | null): string => {
	const street = [address?.streetNumber, address?.streetName]
		.filter(nonEmpty)
		.map((part) => part.trim())
		.join(' ');
	const region = [address?.countrySubdivision, address?.postalCode]
		.filter(nonEmpty)
		.map((part) => part.trim())
		.join(' ');
	const municipality = nonEmpty(address?.municipality) ? address.municipality.trim() : '';
	const parts = [street, municipality, region].filter((part) => part.length > 0);
	return parts.length > 0 ? parts.join(', ') : 'N/A';
};
