import { describe, expect, it } from 'vitest';
import { formatDisplayAddress } from './format-display-address.ts';

describe('formatDisplayAddress', () => {
	it('formats a full address with street, municipality, and region parts', () => {
		expect(
			formatDisplayAddress({
				streetNumber: '113',
				streetName: 'Beacon St',
				municipality: 'Mountain View',
				countrySubdivision: 'CA',
				postalCode: '94040',
				country: 'USA',
			}),
		).toBe('113 Beacon St, Mountain View, CA 94040');
	});

	it('joins only the non-empty parts', () => {
		expect(formatDisplayAddress({ streetName: 'Beacon St', postalCode: '94040' })).toBe('Beacon St, 94040');
		expect(formatDisplayAddress({ municipality: 'Mountain View' })).toBe('Mountain View');
		expect(formatDisplayAddress({ streetNumber: '113', countrySubdivision: 'CA' })).toBe('113, CA');
	});

	it('ignores whitespace-only parts', () => {
		expect(formatDisplayAddress({ streetNumber: '  ', streetName: ' Main St ', municipality: ' ' })).toBe('Main St');
	});

	it('returns N/A when no part is set', () => {
		expect(formatDisplayAddress(undefined)).toBe('N/A');
		expect(formatDisplayAddress(null)).toBe('N/A');
		expect(formatDisplayAddress({})).toBe('N/A');
		expect(formatDisplayAddress({ streetNumber: null, streetName: '', country: 'USA' })).toBe('N/A');
	});
});
