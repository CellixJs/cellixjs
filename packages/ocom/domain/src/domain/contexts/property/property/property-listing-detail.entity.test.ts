import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import * as PropertyListingDetailEntity from './property-listing-detail.entity.ts';
import * as ValueObjects from './property-listing-detail.value-objects.ts';
import type { PropertyListingDetailBedroomDetail, PropertyListingDetailBedroomDetailProps } from './property-listing-detail-bedroom-detail.entity.ts';
import type { PropertyListingDetailAdditionalAmenity, PropertyListingDetailAdditionalAmenityProps } from './property-listing-detail-additional-amenity.entity.ts';
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
    bedroomDetails: { items: [], getNewItem: vi.fn(() => ({ id: '1', roomName: 'new room', bedDescriptions: [] })), removeItem: vi.fn() } as unknown as DomainSeedwork.PropArray<PropertyListingDetailBedroomDetailProps>,
    bathrooms: 2,
    squareFeet: null,
    yearBuilt: null,
    lotSize: null,
    description: 'A nice property',
    amenities: ['pool', 'gym'],
    additionalAmenities: { items: [], getNewItem: vi.fn(() => ({ id: '1', category: 'amenity', amenities: ['pool'] })), removeItem: vi.fn() } as unknown as DomainSeedwork.PropArray<PropertyListingDetailAdditionalAmenity>,
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

  Scenario('Setting rentHigh with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the rentHigh with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.rentHigh = new ValueObjects.RentHigh(2500);
    });
    Then('the rentHigh should be updated', () => {
      expect(listing.rentHigh).toBe(2500);
    });
  });

  Scenario('Setting rentHigh without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the rentHigh without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.rentHigh = new ValueObjects.RentHigh(2500);
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting rentLow with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the rentLow with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.rentLow = new ValueObjects.RentLow(2000);
    });
    Then('the rentLow should be updated', () => {
      expect(listing.rentLow).toBe(2000);
    });
  });

  Scenario('Setting rentLow without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the rentLow without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.rentLow = new ValueObjects.RentLow(2000);
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting lease with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the lease with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.lease = new ValueObjects.Lease(12);
    });
    Then('the lease should be updated', () => {
      expect(listing.lease).toBe(12);
    });
  });

  Scenario('Setting lease without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the lease without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.lease = new ValueObjects.Lease(12);
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting maxGuests with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the maxGuests with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.maxGuests = new ValueObjects.MaxGuests(6);
    });
    Then('the maxGuests should be updated', () => {
      expect(listing.maxGuests).toBe(6);
    });
  });

  Scenario('Setting maxGuests without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the maxGuests without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.maxGuests = new ValueObjects.MaxGuests(6);
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting bedrooms with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the bedrooms with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.bedrooms = new ValueObjects.Bedrooms(4);
    });
    Then('the bedrooms should be updated', () => {
      expect(listing.bedrooms).toBe(4);
    });
  });

  Scenario('Setting bedrooms without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the bedrooms without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.bedrooms = new ValueObjects.Bedrooms(4);
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting bathrooms with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the bathrooms with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.bathrooms = new ValueObjects.Bathrooms(3);
    });
    Then('the bathrooms should be updated', () => {
      expect(listing.bathrooms).toBe(3);
    });
  });

  Scenario('Setting bathrooms without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the bathrooms without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.bathrooms = new ValueObjects.Bathrooms(3);
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting squareFeet with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the squareFeet with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.squareFeet = new ValueObjects.SquareFeet(1500);
    });
    Then('the squareFeet should be updated', () => {
      expect(listing.squareFeet).toBe(1500);
    });
  });

  Scenario('Setting squareFeet without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the squareFeet without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.squareFeet = new ValueObjects.SquareFeet(1500);
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting yearBuilt with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the yearBuilt with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.yearBuilt = new ValueObjects.YearBuilt(2020);
    });
    Then('the yearBuilt should be updated', () => {
      expect(listing.yearBuilt).toBe(2020);
    });
  });

  Scenario('Setting yearBuilt without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the yearBuilt without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.yearBuilt = new ValueObjects.YearBuilt(2020);
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting lotSize with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the lotSize with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.lotSize = new ValueObjects.LotSize(5000);
    });
    Then('the lotSize should be updated', () => {
      expect(listing.lotSize).toBe(5000);
    });
  });

  Scenario('Setting lotSize without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the lotSize without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.lotSize = new ValueObjects.LotSize(5000);
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting description with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the description with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.description = new ValueObjects.Description('Updated description');
    });
    Then('the description should be updated', () => {
      expect(listing.description).toBe('Updated description');
    });
  });

  Scenario('Setting description without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the description without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.description = new ValueObjects.Description('Updated description');
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting amenities with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the amenities with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.amenities = new ValueObjects.Amenities(['pool', 'gym', 'parking']);
    });
    Then('the amenities should be updated', () => {
      expect(listing.amenities).toEqual(['pool', 'gym', 'parking']);
    });
  });

  Scenario('Setting amenities without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the amenities without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.amenities = new ValueObjects.Amenities(['pool', 'gym']);
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting images with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the images with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.images = new ValueObjects.Images(['new-image1.jpg', 'new-image2.jpg']);
    });
    Then('the images should be updated', () => {
      expect(listing.images).toEqual(['new-image1.jpg', 'new-image2.jpg']);
    });
  });

  Scenario('Setting images without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the images without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.images = new ValueObjects.Images(['new-image.jpg']);
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting video with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the video with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.video = new ValueObjects.Video('new-video.mp4');
    });
    Then('the video should be updated', () => {
      expect(listing.video).toBe('new-video.mp4');
    });
  });

  Scenario('Setting video without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the video without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.video = new ValueObjects.Video('new-video.mp4');
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting floorPlan with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the floorPlan with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.floorPlan = new ValueObjects.FloorPlan('floor-plan.pdf');
    });
    Then('the floorPlan should be updated', () => {
      expect(listing.floorPlan).toBe('floor-plan.pdf');
    });
  });

  Scenario('Setting floorPlan without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the floorPlan without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.floorPlan = new ValueObjects.FloorPlan('floor-plan.pdf');
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting floorPlanImages with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the floorPlanImages with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.floorPlanImages = new ValueObjects.FloorPlanImages(['floor1.jpg', 'floor2.jpg']);
    });
    Then('the floorPlanImages should be updated', () => {
      expect(listing.floorPlanImages).toEqual(['floor1.jpg', 'floor2.jpg']);
    });
  });

  Scenario('Setting floorPlanImages without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the floorPlanImages without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.floorPlanImages = new ValueObjects.FloorPlanImages(['floor.jpg']);
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting listingAgent with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the listingAgent with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.listingAgent = new ValueObjects.ListingAgent('John Smith');
    });
    Then('the listingAgent should be updated', () => {
      expect(listing.listingAgent).toBe('John Smith');
    });
  });

  Scenario('Setting listingAgent without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the listingAgent without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.listingAgent = new ValueObjects.ListingAgent('John Smith');
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting listingAgentPhone with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the listingAgentPhone with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.listingAgentPhone = new ValueObjects.ListingAgentPhone('555-1234');
    });
    Then('the listingAgentPhone should be updated', () => {
      expect(listing.listingAgentPhone).toBe('555-1234');
    });
  });

  Scenario('Setting listingAgentPhone without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the listingAgentPhone without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.listingAgentPhone = new ValueObjects.ListingAgentPhone('555-1234');
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting listingAgentEmail with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the listingAgentEmail with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.listingAgentEmail = new ValueObjects.ListingAgentEmail('agent@example.com');
    });
    Then('the listingAgentEmail should be updated', () => {
      expect(listing.listingAgentEmail).toBe('agent@example.com');
    });
  });

  Scenario('Setting listingAgentEmail without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the listingAgentEmail without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.listingAgentEmail = new ValueObjects.ListingAgentEmail('agent@example.com');
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting listingAgentWebsite with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the listingAgentWebsite with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.listingAgentWebsite = new ValueObjects.ListingAgentWebsite('https://agent.com');
    });
    Then('the listingAgentWebsite should be updated', () => {
      expect(listing.listingAgentWebsite).toBe('https://agent.com');
    });
  });

  Scenario('Setting listingAgentWebsite without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the listingAgentWebsite without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.listingAgentWebsite = new ValueObjects.ListingAgentWebsite('https://agent.com');
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting listingAgentCompany with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the listingAgentCompany with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.listingAgentCompany = new ValueObjects.ListingAgentCompany('Real Estate Co');
    });
    Then('the listingAgentCompany should be updated', () => {
      expect(listing.listingAgentCompany).toBe('Real Estate Co');
    });
  });

  Scenario('Setting listingAgentCompany without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the listingAgentCompany without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.listingAgentCompany = new ValueObjects.ListingAgentCompany('Real Estate Co');
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting listingAgentCompanyPhone with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the listingAgentCompanyPhone with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.listingAgentCompanyPhone = new ValueObjects.ListingAgentCompanyPhone('555-5678');
    });
    Then('the listingAgentCompanyPhone should be updated', () => {
      expect(listing.listingAgentCompanyPhone).toBe('555-5678');
    });
  });

  Scenario('Setting listingAgentCompanyPhone without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the listingAgentCompanyPhone without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.listingAgentCompanyPhone = new ValueObjects.ListingAgentCompanyPhone('555-5678');
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting listingAgentCompanyEmail with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the listingAgentCompanyEmail with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.listingAgentCompanyEmail = new ValueObjects.ListingAgentCompanyEmail('company@example.com');
    });
    Then('the listingAgentCompanyEmail should be updated', () => {
      expect(listing.listingAgentCompanyEmail).toBe('company@example.com');
    });
  });

  Scenario('Setting listingAgentCompanyEmail without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the listingAgentCompanyEmail without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.listingAgentCompanyEmail = new ValueObjects.ListingAgentCompanyEmail('company@example.com');
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting listingAgentCompanyWebsite with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the listingAgentCompanyWebsite with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.listingAgentCompanyWebsite = new ValueObjects.ListingAgentCompanyWebsite('https://company.com');
    });
    Then('the listingAgentCompanyWebsite should be updated', () => {
      expect(listing.listingAgentCompanyWebsite).toBe('https://company.com');
    });
  });

  Scenario('Setting listingAgentCompanyWebsite without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the listingAgentCompanyWebsite without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.listingAgentCompanyWebsite = new ValueObjects.ListingAgentCompanyWebsite('https://company.com');
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting listingAgentCompanyAddress with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I set the listingAgentCompanyAddress with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      listing.listingAgentCompanyAddress = new ValueObjects.ListingAgentCompanyAddress('123 Main St, City, State');
    });
    Then('the listingAgentCompanyAddress should be updated', () => {
      expect(listing.listingAgentCompanyAddress).toBe('123 Main St, City, State');
    });
  });

  Scenario('Setting listingAgentCompanyAddress without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to set the listingAgentCompanyAddress without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      expect(() => {
        listing.listingAgentCompanyAddress = new ValueObjects.ListingAgentCompanyAddress('123 Main St, City, State');
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Requesting remove bedroom with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I request to remove a bedroom with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      const bedroomProps = validProps.bedroomDetails.items[0] as PropertyListingDetailBedroomDetailProps;
      listing.requestRemoveBedroom(bedroomProps);
    });
    Then('the bedroom should be removed', () => {
      // Since we mocked getNewItem, the bedroom should be removed from the array
      expect(validProps.bedroomDetails.removeItem).toHaveBeenCalled();
    });
  });

  Scenario('Requesting remove bedroom without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to request remove a bedroom without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      const bedroomProps = validProps.bedroomDetails.items[0] as PropertyListingDetailBedroomDetailProps;
      expect(() => {
        listing.requestRemoveBedroom(bedroomProps);
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Requesting remove additional amenity with proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I request to remove an additional amenity with proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(true);
      const amenityProps = validProps.additionalAmenities.items[0] as PropertyListingDetailAdditionalAmenityProps;
      listing.requestRemoveAdditionalAmenity(amenityProps);
    });
    Then('the additional amenity should be removed', () => {
      // Since we mocked getNewItem, the amenity should be removed from the array
      expect(validProps.additionalAmenities.removeItem).toHaveBeenCalled();
    });
  });

  Scenario('Requesting remove additional amenity without proper permissions', ({ Given, When, Then }) => {
    let listing: PropertyListingDetailEntity.PropertyListingDetail;
    Given('a property listing detail exists', () => {
      listing = new PropertyListingDetailEntity.PropertyListingDetail(validProps, mockVisa);
    });
    When('I try to request remove an additional amenity without proper permissions', () => {
      mockVisa.determineIf.mockReturnValue(false);
      const amenityProps = validProps.additionalAmenities.items[0] as PropertyListingDetailAdditionalAmenityProps;
      expect(() => {
        listing.requestRemoveAdditionalAmenity(amenityProps);
      }).toThrow('You do not have permission to update this property listing');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });
});