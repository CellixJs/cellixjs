import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import * as PropertyListingDetailEntity from './property-listing-detail.entity.ts';
import * as ValueObjects from './property-listing-detail.value-objects.ts';
import type { PropertyListingDetailBedroomDetail, PropertyListingDetailBedroomDetailProps } from './property-listing-detail-bedroom-detail.entity.ts';
import type { PropertyListingDetailAdditionalAmenity } from './property-listing-detail-additional-amenity.entity.ts';
import type { DomainSeedwork } from '@cellix/domain-seedwork';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/property-listing-detail.entity.feature'),
);

test.for(feature, ({ Scenario }) => {
  const mockVisa = {
    determineIf: vi.fn(),
  };

  const validProps: PropertyListingDetailEntity.PropertyListingDetailProps = {
    price: 100000,
    rentHigh: null,
    rentLow: null,
    lease: null,
    maxGuests: null,
    bedrooms: 3,
    bedroomDetails: { items: [], getNewItem: vi.fn(() => ({ id: '1', roomName: 'new room', bedDescriptions: [] })) } as unknown as DomainSeedwork.PropArray<PropertyListingDetailBedroomDetailProps>,
    bathrooms: 2,
    squareFeet: null,
    yearBuilt: null,
    lotSize: null,
    description: 'A nice property',
    amenities: ['pool', 'gym'],
    additionalAmenities: { items: [], getNewItem: vi.fn(() => ({ id: '1', category: 'amenity', amenities: ['pool'] })) } as unknown as DomainSeedwork.PropArray<PropertyListingDetailAdditionalAmenity>,
    images: ['image1.jpg'],
    video: null,
    floorPlan: null,
    floorPlanImages: null,
    listingAgent: null,
    listingAgentPhone: null,
    listingAgentEmail: null,
    listingAgentWebsite: null,
    listingAgentCompany: null,
    listingAgentCompanyPhone: null,
    listingAgentCompanyEmail: null,
    listingAgentCompanyWebsite: null,
    listingAgentCompanyAddress: null,
  };

  Scenario('Creating a property listing detail with valid props', ({ When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    When('I create a property listing detail with valid props', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    Then('the property listing detail should be created successfully', () => {
      expect(listing).toBeInstanceOf(PropertyListingDetailEntity.PropertyListingDetail);
      expect(listing.price).toBe(100000);
    });
  });

  Scenario('Setting price with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the price with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.price = new ValueObjects.Price(200000);
    });
    Then('the price should be updated', () => {
      expect(listing.price).toBe(200000);
    });
  });

  Scenario('Setting price without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the price without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.price = new ValueObjects.Price(200000);
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Accessing bedroom details', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I access the bedroom details', () => {
      // Access in Then
    });
    Then('it should return the bedroom details', () => {
      expect(listing.bedroomDetails).toBeInstanceOf(Array);
      expect(listing.bedroomDetails).toHaveLength(0);
    });
  });

  Scenario('Requesting new bedroom with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    let newBedroom: PropertyListingDetailBedroomDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I request a new bedroom with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      newBedroom = listing.requestNewBedroom();
    });
    Then('a new bedroom should be returned', () => {
      expect(newBedroom).toBeInstanceOf(Object); // PropertyListingDetailBedroomDetail
    });
  });

  Scenario('Requesting new bedroom without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to request a new bedroom without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.requestNewBedroom();
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Accessing additional amenities', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I access the additional amenities', () => {
      // Access in Then
    });
    Then('it should return the additional amenities', () => {
      expect(listing.additionalAmenities).toBeInstanceOf(Array);
      expect(listing.additionalAmenities).toHaveLength(0);
    });
  });

  Scenario('Requesting new additional amenity with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    let newAmenity: PropertyListingDetailAdditionalAmenity;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I request a new additional amenity with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      newAmenity = listing.requestNewAdditionalAmenity();
    });
    Then('a new additional amenity should be returned', () => {
      expect(newAmenity).toBeInstanceOf(Object); // PropertyListingDetailAdditionalAmenity
    });
  });

  Scenario('Removing image with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I remove an image with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.requestRemoveImage('image1.jpg');
    });
    Then('the image should be removed', () => {
      expect(listing.images).toEqual([]);
    });
  });
});