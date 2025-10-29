import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as PropertyLocationAddressEntity from './property-location-address.entity.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/property-location-address.entity.feature'),
);

test.for(feature, ({ Scenario }) => {
  const validProps: PropertyLocationAddressEntity.PropertyLocationAddressProps = {
    streetNumber: '123',
    streetName: 'Main St',
    municipality: 'Los Angeles',
    municipalitySubdivision: '',
    localName: '',
    countrySecondarySubdivision: '',
    countryTertiarySubdivision: '',
    countrySubdivision: 'CA',
    countrySubdivisionName: 'California',
    postalCode: '90210',
    extendedPostalCode: '',
    countryCode: 'US',
    country: 'USA',
    countryCodeISO3: 'USA',
    freeformAddress: '123 Main St, Los Angeles, CA 90210',
    streetNameAndNumber: '123 Main St',
    routeNumbers: '',
    crossStreet: '',
  };

  Scenario('Creating a property location address with valid props', ({ When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    When('I create a property location address with valid address fields', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    Then('the property location address should be created successfully', () => {
      expect(address).toBeInstanceOf(PropertyLocationAddressEntity.PropertyLocationAddress);
    });
  });

  Scenario('Accessing street number property', ({ Given, When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    Given('a property location address exists', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    When('I access the street number property', () => {
      // Access in Then
    });
    Then('it should return the correct street number', () => {
      expect(address.streetNumber).toBe('123');
    });
  });

  Scenario('Accessing street name property', ({ Given, When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    Given('a property location address exists', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    When('I access the street name property', () => {
      // Access in Then
    });
    Then('it should return the correct street name', () => {
      expect(address.streetName).toBe('Main St');
    });
  });

  Scenario('Accessing municipality property', ({ Given, When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    Given('a property location address exists', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    When('I access the municipality property', () => {
      // Access in Then
    });
    Then('it should return the correct municipality', () => {
      expect(address.municipality).toBe('Los Angeles');
    });
  });
});