/**
 * Options offered by the address dropdowns of the shared property form.
 *
 * Backed by the local `countries.json` asset (shape
 * `{countryName, countryCode, states: [{stateName, stateCode}] | null}`;
 * only the US and Canada carry `states`). The property backend stores the
 * full country name for `country` and the 2-letter state/province code for
 * `countrySubdivision`, so option values carry the stored form while labels
 * carry the display form.
 */
import countriesJson from './countries.json';

/** A dropdown option of an address select: stored value, displayed label, and hover title. */
interface AddressSelectOption {
	value: string;
	label: string;
	title: string;
}

interface CountryState {
	stateName: string;
	stateCode: string;
}

interface Country {
	countryName: string;
	countryCode: string;
	states: CountryState[] | null;
}

const COUNTRIES: ReadonlyArray<Country> = countriesJson as Country[];

/**
 * Options of the Country select: value = country name (the stored string,
 * e.g. `country = "United States"`), label = country name. The ISO country
 * code serves only as the option key and for the state cascade lookup.
 */
export const COUNTRY_SELECT_OPTIONS: ReadonlyArray<AddressSelectOption & { key: string }> = COUNTRIES.map((country) => ({
	key: country.countryCode,
	value: country.countryName,
	label: country.countryName,
	title: country.countryName,
}));

/**
 * Options of the State/Province (`countrySubdivision`) select for the given
 * country: value = 2-letter code (e.g. `countrySubdivision = "NY"`), label =
 * full state/province name. Returns null when the country has no subdivision
 * list (anything other than the US and Canada, or no country selected), in
 * which case the form falls back to a free-text input.
 */
export function stateSelectOptionsForCountry(countryName: string | null | undefined): ReadonlyArray<AddressSelectOption> | null {
	if (!countryName) {
		return null;
	}
	const country = COUNTRIES.find((candidate) => candidate.countryName === countryName);
	if (!country?.states) {
		return null;
	}
	return country.states.map((state) => ({
		value: state.stateCode,
		label: state.stateName,
		title: state.stateName,
	}));
}
