import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as ValueObjects from './property-listing-detail.value-objects.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/property-listing-detail.value-objects.feature'),
);

test.for(feature, ({ Scenario }) => {
  // Price
  Scenario('Creating a price with valid value', ({ When, Then }) => {
    let value: number | null;
    When('I create a price with 100000', () => {
      value = new ValueObjects.Price(100000).valueOf();
    });
    Then('the value should be 100000', () => {
      expect(value).toBe(100000);
    });
  });

  Scenario('Creating a price with null', ({ When, Then }) => {
    let value: number | null;
    When('I create a price with null', () => {
      value = new ValueObjects.Price(null).valueOf();
    });
    Then('the value should be null', () => {
      expect(value).toBe(null);
    });
  });

  Scenario('Creating a price with negative value', ({ When, Then }) => {
    let createPriceWithNegative: () => void;
    When('I try to create a price with -1000', () => {
      createPriceWithNegative = () => {
        new ValueObjects.Price(-1000).valueOf();
      };
    });
    Then('an error should be thrown indicating the price is invalid', () => {
      expect(createPriceWithNegative).toThrow('Too small');
    });
  });

  // RentHigh
  Scenario('Creating a rent high with valid value', ({ When, Then }) => {
    let value: number | null;
    When('I create a rent high with 2000', () => {
      value = new ValueObjects.RentHigh(2000).valueOf();
    });
    Then('the value should be 2000', () => {
      expect(value).toBe(2000);
    });
  });

  Scenario('Creating a rent high with null', ({ When, Then }) => {
    let value: number | null;
    When('I create a rent high with null', () => {
      value = new ValueObjects.RentHigh(null).valueOf();
    });
    Then('the value should be null', () => {
      expect(value).toBe(null);
    });
  });

  Scenario('Creating a rent high with negative value', ({ When, Then }) => {
    let createRentHighWithNegative: () => void;
    When('I try to create a rent high with -500', () => {
      createRentHighWithNegative = () => {
        new ValueObjects.RentHigh(-500).valueOf();
      };
    });
    Then('an error should be thrown indicating the rent high is invalid', () => {
      expect(createRentHighWithNegative).toThrow('Too small');
    });
  });

  // Bedrooms
  Scenario('Creating bedrooms with valid value', ({ When, Then }) => {
    let value: number | null;
    When('I create bedrooms with 3', () => {
      value = new ValueObjects.Bedrooms(3).valueOf();
    });
    Then('the value should be 3', () => {
      expect(value).toBe(3);
    });
  });

  Scenario('Creating bedrooms with null', ({ When, Then }) => {
    let value: number | null;
    When('I create bedrooms with null', () => {
      value = new ValueObjects.Bedrooms(null).valueOf();
    });
    Then('the value should be null', () => {
      expect(value).toBe(null);
    });
  });

  Scenario('Creating bedrooms with negative value', ({ When, Then }) => {
    let createBedroomsWithNegative: () => void;
    When('I try to create bedrooms with -1', () => {
      createBedroomsWithNegative = () => {
        new ValueObjects.Bedrooms(-1).valueOf();
      };
    });
    Then('an error should be thrown indicating the bedrooms is invalid', () => {
      expect(createBedroomsWithNegative).toThrow('Too small');
    });
  });

  Scenario('Creating bedrooms with value above maximum', ({ When, Then }) => {
    let createBedroomsAboveMax: () => void;
    When('I try to create bedrooms with 1001', () => {
      createBedroomsAboveMax = () => {
        new ValueObjects.Bedrooms(1001).valueOf();
      };
    });
    Then('an error should be thrown indicating the bedrooms is invalid', () => {
      expect(createBedroomsAboveMax).toThrow('Too big');
    });
  });

  // Description
  Scenario('Creating a description with valid value', ({ When, Then }) => {
    let value: string | null;
    When('I create a description with "A nice property description"', () => {
      value = new ValueObjects.Description('A nice property description').valueOf();
    });
    Then('the value should be "A nice property description"', () => {
      expect(value).toBe('A nice property description');
    });
  });

  Scenario('Creating a description with null', ({ When, Then }) => {
    let value: string | null;
    When('I create a description with null', () => {
      value = new ValueObjects.Description(null).valueOf();
    });
    Then('the value should be null', () => {
      expect(value).toBe(null);
    });
  });

  Scenario('Creating a description with leading and trailing whitespace', ({ When, Then }) => {
    let value: string | null;
    When('I create a description with "  A nice property  "', () => {
      value = new ValueObjects.Description('  A nice property  ').valueOf();
    });
    Then('the value should be "A nice property"', () => {
      expect(value).toBe('A nice property');
    });
  });

  Scenario('Creating a description with maximum allowed length', ({ When, Then }) => {
    let value: string | null;
    When('I create a description with a string of 5000 characters', () => {
      value = new ValueObjects.Description('a'.repeat(5000)).valueOf();
    });
    Then('the value should be the 5000 character string', () => {
      expect(value).toBe('a'.repeat(5000));
    });
  });

  Scenario('Creating a description with more than maximum allowed length', ({ When, Then }) => {
    let createDescriptionAboveMax: () => void;
    When('I try to create a description with a string of 5001 characters', () => {
      createDescriptionAboveMax = () => {
        new ValueObjects.Description('a'.repeat(5001)).valueOf();
      };
    });
    Then('an error should be thrown indicating the description is too long', () => {
      expect(createDescriptionAboveMax).toThrow('Too long');
    });
  });

  // Amenities
  Scenario('Creating amenities with valid array', ({ When, Then }) => {
    let value: string[] | null;
    When('I create amenities with ["pool", "gym", "parking"]', () => {
      value = new ValueObjects.Amenities(['pool', 'gym', 'parking']).valueOf();
    });
    Then('the value should be ["pool", "gym", "parking"]', () => {
      expect(value).toEqual(['pool', 'gym', 'parking']);
    });
  });

  Scenario('Creating amenities with null', ({ When, Then }) => {
    let value: string[] | null;
    When('I create amenities with null', () => {
      value = new ValueObjects.Amenities(null).valueOf();
    });
    Then('the value should be null', () => {
      expect(value).toBe(null);
    });
  });

  Scenario('Creating amenities with empty array', ({ When, Then }) => {
    let value: string[] | null;
    When('I create amenities with []', () => {
      value = new ValueObjects.Amenities([]).valueOf();
    });
    Then('the value should be []', () => {
      expect(value).toEqual([]);
    });
  });

  Scenario('Creating amenities with array above maximum length', ({ When, Then }) => {
    let createAmenitiesAboveMax: () => void;
    When('I try to create amenities with 51 items', () => {
      createAmenitiesAboveMax = () => {
        new ValueObjects.Amenities(new Array(51).fill('amenity'))
      };
    });
    Then('an error should be thrown indicating the amenities array is too long', () => {
      expect(createAmenitiesAboveMax).toThrow('Too long');
    });
  });

  // Images
  Scenario('Creating images with valid array', ({ When, Then }) => {
    let value: string[] | null;
    When('I create images with ["image1.jpg", "image2.png"]', () => {
      value = new ValueObjects.Images(['image1.jpg', 'image2.png']).valueOf();
    });
    Then('the value should be ["image1.jpg", "image2.png"]', () => {
      expect(value).toEqual(['image1.jpg', 'image2.png']);
    });
  });

  Scenario('Creating images with null', ({ When, Then }) => {
    let value: string[] | null;
    When('I create images with null', () => {
      value = new ValueObjects.Images(null).valueOf();
    });
    Then('the value should be null', () => {
      expect(value).toBe(null);
    });
  });

  Scenario('Creating images with array above maximum length', ({ When, Then }) => {
    let createImagesAboveMax: () => void;
    When('I try to create images with 51 items', () => {
      createImagesAboveMax = () => {
        new ValueObjects.Images(new Array(51).fill('image.jpg')).valueOf();
      };
    });
    Then('an error should be thrown indicating the images array is too long', () => {
      expect(createImagesAboveMax).toThrow('Too long');
    });
  });

  // ListingAgentEmail
  Scenario('Creating a listing agent email with valid value', ({ When, Then }) => {
    let value: string | null;
    When('I create a listing agent email with "agent@example.com"', () => {
      value = new ValueObjects.ListingAgentEmail('agent@example.com').valueOf();
    });
    Then('the value should be "agent@example.com"', () => {
      expect(value).toBe('agent@example.com');
    });
  });

  Scenario('Creating a listing agent email with null', ({ When, Then }) => {
    let value: string | null;
    When('I create a listing agent email with null', () => {
      value = new ValueObjects.ListingAgentEmail(null).valueOf();
    });
    Then('the value should be null', () => {
      expect(value).toBe(null);
    });
  });

  Scenario('Creating a listing agent email with invalid format', ({ When, Then }) => {
    let createInvalidEmail: () => void;
    When('I try to create a listing agent email with "invalid-email"', () => {
      createInvalidEmail = () => {
        new ValueObjects.ListingAgentEmail('invalid-email').valueOf();
      };
    });
    Then('an error should be thrown indicating the email is invalid', () => {
      expect(createInvalidEmail).toThrow('Value doesn\'t match pattern');
    });
  });
});