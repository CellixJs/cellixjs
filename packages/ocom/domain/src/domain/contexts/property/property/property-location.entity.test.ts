import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { PropertyVisa } from '../property.visa.ts';
import * as PropertyLocationEntity from './property-location.entity.ts';
import type { PropertyLocationAddressProps } from './property-location-address.entity.ts';
import type { PropertyLocationPositionProps } from './property-location-position.entity.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/property-location.entity.feature'),
);

test.for(feature, ({ Scenario }) => {
	const mockVisa = {
		determineIf: vi.fn(),
	} as PropertyVisa;

	const validAddressProps: PropertyLocationAddressProps = {
		country: 'USA',
		countryCode: 'US',
		countryCodeISO3: 'USA',
		countrySubdivision: 'CA',
		countrySubdivisionName: 'California',
		countryTertiarySubdivision: '',
		countrySecondarySubdivision: '',
		municipality: 'Los Angeles',
		municipalitySubdivision: '',
		localName: '',
		postalCode: '90210',
		extendedPostalCode: '',
		streetName: 'Main St',
		streetNumber: '123',
		freeformAddress: '123 Main St, Los Angeles, CA 90210',
		streetNameAndNumber: '123 Main St',
		routeNumbers: '',
		crossStreet: '',
	};

	const validPositionProps: PropertyLocationPositionProps = {
		type: 'Point',
		coordinates: [-118.2437, 34.0522],
	};

	const validProps: PropertyLocationEntity.PropertyLocationProps = {
		address: validAddressProps,
		position: validPositionProps,
	};

	Scenario(
		'Creating a property location with valid props',
		({ When, Then }) => {
			let location: PropertyLocationEntity.PropertyLocation;
			When(
				'I create a property location with valid address and position',
				() => {
					location = new PropertyLocationEntity.PropertyLocation(
						validProps,
						mockVisa,
					);
				},
			);
			Then('the property location should be created successfully', () => {
				expect(location).toBeInstanceOf(
					PropertyLocationEntity.PropertyLocation,
				);
				expect(location.address.country).toBe('USA');
				expect(location.position.type).toBe('Point');
			});
		},
	);

	Scenario(
		'Setting address with proper permissions',
		({ Given, When, Then }) => {
			let location: PropertyLocationEntity.PropertyLocation;
			Given('a property location exists', () => {
				location = new PropertyLocationEntity.PropertyLocation(
					validProps,
					mockVisa,
				);
			});
			When('I set the address with proper permissions', () => {
				vi.mocked(mockVisa.determineIf).mockReturnValue(true);
				const newAddress = { ...validAddressProps, streetNumber: '456' };
				location.address = newAddress;
			});
			Then('the address should be updated', () => {
				expect(location.address.streetNumber).toBe('456');
			});
		},
	);

	Scenario(
		'Setting address without proper permissions',
		({ Given, When, Then }) => {
			let location: PropertyLocationEntity.PropertyLocation;
			Given('a property location exists', () => {
				location = new PropertyLocationEntity.PropertyLocation(
					validProps,
					mockVisa,
				);
			});
			When('I try to set the address without proper permissions', () => {
				vi.mocked(mockVisa.determineIf).mockReturnValue(false);
				const newAddress = { ...validAddressProps, streetNumber: '456' };
				expect(() => {
					location.address = newAddress;
				}).toThrow(
					'You do not have permission to update this property location',
				);
			});
			Then('a permission error should be thrown', () => {
				// Already checked in When
			});
		},
	);

	Scenario(
		'Setting position with proper permissions',
		({ Given, When, Then }) => {
			let location: PropertyLocationEntity.PropertyLocation;
			Given('a property location exists', () => {
				location = new PropertyLocationEntity.PropertyLocation(
					validProps,
					mockVisa,
				);
			});
			When('I set the position with proper permissions', () => {
				vi.mocked(mockVisa.determineIf).mockReturnValue(true);
				const newPosition = {
					...validPositionProps,
					coordinates: [-122.4194, 37.7749],
				};
				location.position = newPosition;
			});
			Then('the position should be updated', () => {
				expect(location.position.coordinates).toEqual([-122.4194, 37.7749]);
			});
		},
	);

	Scenario(
		'Setting position without proper permissions',
		({ Given, When, Then }) => {
			let location: PropertyLocationEntity.PropertyLocation;
			Given('a property location exists', () => {
				location = new PropertyLocationEntity.PropertyLocation(
					validProps,
					mockVisa,
				);
			});
			When('I try to set the position without proper permissions', () => {
				vi.mocked(mockVisa.determineIf).mockReturnValue(false);
				const newPosition = {
					...validPositionProps,
					coordinates: [-122.4194, 37.7749],
				};
				expect(() => {
					location.position = newPosition;
				}).toThrow(
					'You do not have permission to update this property location',
				);
			});
			Then('a permission error should be thrown', () => {
				// Already checked in When
			});
		},
	);
});
