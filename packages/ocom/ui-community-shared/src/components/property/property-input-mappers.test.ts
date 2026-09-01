import { describe, expect, it } from 'vitest';
import { toManagerPropertyInputFields, toMemberPropertyCreateInput, toMemberPropertyUpdateInput } from './property-input-mappers.ts';
import type { PropertyFormValues } from './property-types.ts';

const formValues: PropertyFormValues = {
	propertyName: '  Maple Cottage  ',
	propertyType: 'condo',
	ownerId: 'owner-id',
	listedForSale: true,
	listedInDirectory: true,
	tags: 'quiet,  garden',
	location: {
		address: {
			streetNumber: '12',
			streetName: 'Maple Street',
		},
	},
	listingDetail: {
		bedrooms: 2,
		amenities: 'fireplace, deck',
	},
};

describe('member Property input mappers', () => {
	it('uses a positive create allowlist and omits manager-only fields', () => {
		const input = toMemberPropertyCreateInput(formValues);

		expect(input).toMatchObject({
			propertyName: 'Maple Cottage',
			listedForSale: true,
			listedInDirectory: true,
			tags: ['quiet', 'garden'],
			location: { address: { streetNumber: '12', streetName: 'Maple Street' } },
			listingDetail: { bedrooms: 2, amenities: ['fireplace', 'deck'] },
		});
		expect(input).not.toHaveProperty('ownerId');
		expect(input).not.toHaveProperty('propertyType');
	});

	it('uses a positive update allowlist and never serializes name, owner, or type', () => {
		const input = toMemberPropertyUpdateInput('property-id', formValues);

		expect(input).toMatchObject({
			id: 'property-id',
			listedForSale: true,
			listedInDirectory: true,
		});
		expect(input).not.toHaveProperty('propertyName');
		expect(input).not.toHaveProperty('ownerId');
		expect(input).not.toHaveProperty('propertyType');
	});

	it('keeps full owner and type fields available only to the manager mapper', () => {
		expect(toManagerPropertyInputFields(formValues)).toMatchObject({
			propertyType: 'condo',
			ownerId: 'owner-id',
			listedForSale: true,
		});
	});
});
