import { describe, expect, it } from 'vitest';
import { formatDisplayAddress } from './format-display-address.ts';

describe('formatDisplayAddress', () => {
	it('joins populated address parts and ignores empty parts', () => {
		expect(
			formatDisplayAddress({
				streetNumber: '125',
				streetName: 'Harbor Way',
				municipality: 'Shorewood',
				countrySubdivision: 'WI',
				postalCode: '53211',
			}),
		).toBe('125 Harbor Way, Shorewood, WI 53211');
		expect(formatDisplayAddress({ streetNumber: ' ', streetName: ' Main St ', municipality: '' })).toBe('Main St');
	});

	it('uses a stable fallback for a missing address', () => {
		expect(formatDisplayAddress(undefined)).toBe('N/A');
	});
});
