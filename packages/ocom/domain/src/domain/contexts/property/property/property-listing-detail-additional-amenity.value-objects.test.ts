import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as ValueObjects from './property-listing-detail-additional-amenity.value-objects.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/property-listing-detail-additional-amenity.value-objects.feature'),
);

test.for(feature, ({ Scenario }) => {
  Scenario('Creating a valid category', ({ When, Then }) => {
    let category: ValueObjects.Category;
    When('I create a category with "Electronics"', () => {
      category = new ValueObjects.Category('Electronics');
    });
    Then('the value should be "Electronics"', () => {
      expect(category.valueOf()).toBe('Electronics');
    });
  });

  Scenario('Creating a category with leading/trailing whitespace', ({ When, Then }) => {
    let category: ValueObjects.Category;
    When('I create a category with "  Kitchen  "', () => {
      category = new ValueObjects.Category('  Kitchen  ');
    });
    Then('the value should be "Kitchen"', () => {
      expect(category.valueOf()).toBe('Kitchen');
    });
  });

  Scenario('Creating a category that is too short', ({ When, Then }) => {
    When('I try to create a category with ""', () => {
      expect(() => new ValueObjects.Category('')).toThrow('Too short');
    });
    Then('it should throw an error "Too short"', () => {
      // Already checked in When
    });
  });

  Scenario('Creating a category that is too long', ({ When, Then }) => {
    const longString = 'a'.repeat(101);
    When('I try to create a category with a string longer than 100 characters', () => {
      expect(() => new ValueObjects.Category(longString)).toThrow('Too long');
    });
    Then('it should throw an error "Too long"', () => {
      // Already checked in When
    });
  });

  Scenario('Creating a category with null', ({ When, Then }) => {
    When('I try to create a category with null', () => {
      // @ts-expect-error Testing invalid input
      expect(() => new ValueObjects.Category(null)).toThrow('Wrong raw value type');
    });
    Then('it should throw an error "Wrong raw value type"', () => {
      // Already checked in When
    });
  });

  Scenario('Creating valid amenities', ({ When, Then }) => {
    let amenities: ValueObjects.Amenities;
    When('I create amenities with ["WiFi", "Parking", "Pool"]', () => {
      amenities = new ValueObjects.Amenities(['WiFi', 'Parking', 'Pool']);
    });
    Then('the amenities should contain ["WiFi", "Parking", "Pool"]', () => {
      expect(amenities.valueOf()).toEqual(['WiFi', 'Parking', 'Pool']);
    });
  });

  Scenario('Creating amenities with too many items', ({ When, Then }) => {
    const tooManyItems = Array.from({ length: 21 }, (_, i) => `Amenity${i}`);
    When('I try to create amenities with more than 20 items', () => {
      expect(() => new ValueObjects.Amenities(tooManyItems)).toThrow('Too long');
    });
    Then('it should throw an error "Too long"', () => {
      // Already checked in When
    });
  });

  Scenario('Creating amenities with null', ({ When, Then }) => {
    When('I try to create amenities with null', () => {
      // @ts-expect-error Testing invalid input
      expect(() => new ValueObjects.Amenities(null)).toThrow('Wrong raw value type');
    });
    Then('it should throw an error "Wrong raw value type"', () => {
      // Already checked in When
    });
  });
});