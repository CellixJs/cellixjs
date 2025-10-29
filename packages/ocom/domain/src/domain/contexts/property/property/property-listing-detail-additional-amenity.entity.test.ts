import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import * as PropertyListingDetailAdditionalAmenityEntity from './property-listing-detail-additional-amenity.entity.ts';
import * as ValueObjects from './property-listing-detail-additional-amenity.value-objects.ts';
import type { PropertyVisa } from '../property.visa.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/property-listing-detail-additional-amenity.entity.feature'),
);

test.for(feature, ({ Scenario }) => {
  const mockVisa = {
    determineIf: vi.fn(),
  } as PropertyVisa;

  const validProps: PropertyListingDetailAdditionalAmenityEntity.PropertyListingDetailAdditionalAmenityProps = {
    id: '1',
    category: 'Electronics',
    amenities: ['WiFi', 'TV'],
  };

  Scenario('Creating an additional amenity with valid props', ({ When, Then }) => {
    let amenity: PropertyListingDetailAdditionalAmenityEntity.PropertyListingDetailAdditionalAmenity;
    When('I create an additional amenity with valid category and amenities', () => {
      amenity = new PropertyListingDetailAdditionalAmenityEntity.PropertyListingDetailAdditionalAmenity(validProps, mockVisa);
    });
    Then('the additional amenity should be created successfully', () => {
      expect(amenity).toBeInstanceOf(PropertyListingDetailAdditionalAmenityEntity.PropertyListingDetailAdditionalAmenity);
      expect(amenity.category).toBe('Electronics');
      expect(amenity.amenities).toEqual(['WiFi', 'TV']);
    });
  });

  Scenario('Setting category with proper permissions', ({ Given, When, Then }) => {
    let amenity: PropertyListingDetailAdditionalAmenityEntity.PropertyListingDetailAdditionalAmenity;
    Given('an additional amenity exists', () => {
      amenity = new PropertyListingDetailAdditionalAmenityEntity.PropertyListingDetailAdditionalAmenity(validProps, mockVisa);
    });
    When('I set the category with proper permissions', () => {
      vi.mocked(mockVisa.determineIf).mockReturnValue(true);
      amenity.category = new ValueObjects.Category('Kitchen');
    });
    Then('the category should be updated', () => {
      expect(amenity.category).toBe('Kitchen');
    });
  });

  Scenario('Setting category without proper permissions', ({ Given, When, Then }) => {
    let amenity: PropertyListingDetailAdditionalAmenityEntity.PropertyListingDetailAdditionalAmenity;
    Given('an additional amenity exists', () => {
      amenity = new PropertyListingDetailAdditionalAmenityEntity.PropertyListingDetailAdditionalAmenity(validProps, mockVisa);
    });
    When('I try to set the category without proper permissions', () => {
      vi.mocked(mockVisa.determineIf).mockReturnValue(false);
      expect(() => {
        amenity.category = new ValueObjects.Category('Kitchen');
      }).toThrow('You do not have permission to update property amenities');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting amenities with proper permissions', ({ Given, When, Then }) => {
    let amenity: PropertyListingDetailAdditionalAmenityEntity.PropertyListingDetailAdditionalAmenity;
    Given('an additional amenity exists', () => {
      amenity = new PropertyListingDetailAdditionalAmenityEntity.PropertyListingDetailAdditionalAmenity(validProps, mockVisa);
    });
    When('I set the amenities with proper permissions', () => {
      vi.mocked(mockVisa.determineIf).mockReturnValue(true);
      amenity.amenities = new ValueObjects.Amenities(['Parking', 'Pool']);
    });
    Then('the amenities should be updated', () => {
      expect(amenity.amenities).toEqual(['Parking', 'Pool']);
    });
  });

  Scenario('Setting amenities without proper permissions', ({ Given, When, Then }) => {
    let amenity: PropertyListingDetailAdditionalAmenityEntity.PropertyListingDetailAdditionalAmenity;
    Given('an additional amenity exists', () => {
      amenity = new PropertyListingDetailAdditionalAmenityEntity.PropertyListingDetailAdditionalAmenity(validProps, mockVisa);
    });
    When('I try to set the amenities without proper permissions', () => {
      vi.mocked(mockVisa.determineIf).mockReturnValue(false);
      expect(() => {
        amenity.amenities = new ValueObjects.Amenities(['Parking', 'Pool']);
      }).toThrow('You do not have permission to update property amenities');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });
});