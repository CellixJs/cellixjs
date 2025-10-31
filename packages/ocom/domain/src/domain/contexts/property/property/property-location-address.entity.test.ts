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

  Scenario('Accessing municipality subdivision property', ({ Given, When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    Given('a property location address exists', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    When('I access the municipality subdivision property', () => {
      // Access in Then
    });
    Then('it should return the correct municipality subdivision', () => {
      expect(address.municipalitySubdivision).toBe('');
    });
  });

  Scenario('Accessing local name property', ({ Given, When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    Given('a property location address exists', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    When('I access the local name property', () => {
      // Access in Then
    });
    Then('it should return the correct local name', () => {
      expect(address.localName).toBe('');
    });
  });

  Scenario('Accessing country secondary subdivision property', ({ Given, When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    Given('a property location address exists', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    When('I access the country secondary subdivision property', () => {
      // Access in Then
    });
    Then('it should return the correct country secondary subdivision', () => {
      expect(address.countrySecondarySubdivision).toBe('');
    });
  });

  Scenario('Accessing country tertiary subdivision property', ({ Given, When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    Given('a property location address exists', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    When('I access the country tertiary subdivision property', () => {
      // Access in Then
    });
    Then('it should return the correct country tertiary subdivision', () => {
      expect(address.countryTertiarySubdivision).toBe('');
    });
  });

  Scenario('Accessing country subdivision property', ({ Given, When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    Given('a property location address exists', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    When('I access the country subdivision property', () => {
      // Access in Then
    });
    Then('it should return the correct country subdivision', () => {
      expect(address.countrySubdivision).toBe('CA');
    });
  });

  Scenario('Accessing country subdivision name property', ({ Given, When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    Given('a property location address exists', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    When('I access the country subdivision name property', () => {
      // Access in Then
    });
    Then('it should return the correct country subdivision name', () => {
      expect(address.countrySubdivisionName).toBe('California');
    });
  });

  Scenario('Accessing postal code property', ({ Given, When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    Given('a property location address exists', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    When('I access the postal code property', () => {
      // Access in Then
    });
    Then('it should return the correct postal code', () => {
      expect(address.postalCode).toBe('90210');
    });
  });

  Scenario('Accessing extended postal code property', ({ Given, When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    Given('a property location address exists', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    When('I access the extended postal code property', () => {
      // Access in Then
    });
    Then('it should return the correct extended postal code', () => {
      expect(address.extendedPostalCode).toBe('');
    });
  });

  Scenario('Accessing country code property', ({ Given, When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    Given('a property location address exists', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    When('I access the country code property', () => {
      // Access in Then
    });
    Then('it should return the correct country code', () => {
      expect(address.countryCode).toBe('US');
    });
  });

  Scenario('Accessing country property', ({ Given, When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    Given('a property location address exists', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    When('I access the country property', () => {
      // Access in Then
    });
    Then('it should return the correct country', () => {
      expect(address.country).toBe('USA');
    });
  });

  Scenario('Accessing country code ISO3 property', ({ Given, When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    Given('a property location address exists', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    When('I access the country code ISO3 property', () => {
      // Access in Then
    });
    Then('it should return the correct country code ISO3', () => {
      expect(address.countryCodeISO3).toBe('USA');
    });
  });

  Scenario('Accessing freeform address property', ({ Given, When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    Given('a property location address exists', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    When('I access the freeform address property', () => {
      // Access in Then
    });
    Then('it should return the correct freeform address', () => {
      expect(address.freeformAddress).toBe('123 Main St, Los Angeles, CA 90210');
    });
  });

  Scenario('Accessing street name and number property', ({ Given, When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    Given('a property location address exists', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    When('I access the street name and number property', () => {
      // Access in Then
    });
    Then('it should return the correct street name and number', () => {
      expect(address.streetNameAndNumber).toBe('123 Main St');
    });
  });

  Scenario('Accessing route numbers property', ({ Given, When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    Given('a property location address exists', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    When('I access the route numbers property', () => {
      // Access in Then
    });
    Then('it should return the correct route numbers', () => {
      expect(address.routeNumbers).toBe('');
    });
  });

  Scenario('Accessing cross street property', ({ Given, When, Then }) => {
    let address: PropertyLocationAddressEntity.PropertyLocationAddress;
    Given('a property location address exists', () => {
      address = new PropertyLocationAddressEntity.PropertyLocationAddress(validProps);
    });
    When('I access the cross street property', () => {
      // Access in Then
    });
    Then('it should return the correct cross street', () => {
      expect(address.crossStreet).toBe('');
    });
  });
});