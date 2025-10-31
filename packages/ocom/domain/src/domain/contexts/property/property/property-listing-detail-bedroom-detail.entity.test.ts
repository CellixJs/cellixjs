import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { PropertyVisa } from '../property.visa.ts';
import * as PropertyListingDetailBedroomDetailEntity from './property-listing-detail-bedroom-detail.entity.ts';
import * as ValueObjects from './property-listing-detail-bedroom-detail.value-objects.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/property-listing-detail-bedroom-detail.entity.feature'),
);

test.for(feature, ({ Scenario }) => {
  const mockVisa = {
    determineIf: vi.fn(),
  } as PropertyVisa;

  const validProps: PropertyListingDetailBedroomDetailEntity.PropertyListingDetailBedroomDetailProps = {
    id: '1',
    roomName: 'Master Bedroom',
    bedDescriptions: ['King bed', 'Queen bed'],
  };

  Scenario('Creating a bedroom detail with valid props', ({ When, Then }) => {
    let bedroom: PropertyListingDetailBedroomDetailEntity.PropertyListingDetailBedroomDetail;
    When('I create a bedroom detail with valid room name and bed descriptions', () => {
      bedroom = new PropertyListingDetailBedroomDetailEntity.PropertyListingDetailBedroomDetail(validProps, mockVisa);
    });
    Then('the bedroom detail should be created successfully', () => {
      expect(bedroom).toBeInstanceOf(PropertyListingDetailBedroomDetailEntity.PropertyListingDetailBedroomDetail);
      expect(bedroom.roomName).toBe('Master Bedroom');
      expect(bedroom.bedDescriptions).toEqual(['King bed', 'Queen bed']);
    });
  });

  Scenario('Setting room name with proper permissions', ({ Given, When, Then }) => {
    let bedroom: PropertyListingDetailBedroomDetailEntity.PropertyListingDetailBedroomDetail;
    Given('a bedroom detail exists', () => {
      bedroom = new PropertyListingDetailBedroomDetailEntity.PropertyListingDetailBedroomDetail(validProps, mockVisa);
    });
    When('I set the room name with proper permissions', () => {
      vi.mocked(mockVisa.determineIf).mockReturnValue(true);
      bedroom.roomName = new ValueObjects.RoomName('Guest Bedroom');
    });
    Then('the room name should be updated', () => {
      expect(bedroom.roomName).toBe('Guest Bedroom');
    });
  });

  Scenario('Setting room name without proper permissions', ({ Given, When, Then }) => {
    let bedroom: PropertyListingDetailBedroomDetailEntity.PropertyListingDetailBedroomDetail;
    Given('a bedroom detail exists', () => {
      bedroom = new PropertyListingDetailBedroomDetailEntity.PropertyListingDetailBedroomDetail(validProps, mockVisa);
    });
    When('I try to set the room name without proper permissions', () => {
      vi.mocked(mockVisa.determineIf).mockReturnValue(false);
      expect(() => {
        bedroom.roomName = new ValueObjects.RoomName('Guest Bedroom');
      }).toThrow('You do not have permission to update bedroom details for this property');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });

  Scenario('Setting bed descriptions with proper permissions', ({ Given, When, Then }) => {
    let bedroom: PropertyListingDetailBedroomDetailEntity.PropertyListingDetailBedroomDetail;
    Given('a bedroom detail exists', () => {
      bedroom = new PropertyListingDetailBedroomDetailEntity.PropertyListingDetailBedroomDetail(validProps, mockVisa);
    });
    When('I set the bed descriptions with proper permissions', () => {
      vi.mocked(mockVisa.determineIf).mockReturnValue(true);
      bedroom.bedDescriptions = new ValueObjects.BedDescriptions(['Twin bed']);
    });
    Then('the bed descriptions should be updated', () => {
      expect(bedroom.bedDescriptions).toEqual(['Twin bed']);
    });
  });

  Scenario('Setting bed descriptions without proper permissions', ({ Given, When, Then }) => {
    let bedroom: PropertyListingDetailBedroomDetailEntity.PropertyListingDetailBedroomDetail;
    Given('a bedroom detail exists', () => {
      bedroom = new PropertyListingDetailBedroomDetailEntity.PropertyListingDetailBedroomDetail(validProps, mockVisa);
    });
    When('I try to set the bed descriptions without proper permissions', () => {
      vi.mocked(mockVisa.determineIf).mockReturnValue(false);
      expect(() => {
        bedroom.bedDescriptions = new ValueObjects.BedDescriptions(['Twin bed']);
      }).toThrow('You do not have permission to update bedroom details for this property');
    });
    Then('a permission error should be thrown', () => {
      // Already checked in When
    });
  });
});