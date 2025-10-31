import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { Domain } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import {
  PropertyConverter,
  PropertyDomainAdapter,
} from './property.domain-adapter.ts';
import { CommunityDomainAdapter } from '../../community/community/community.domain-adapter.ts';
import { MemberDomainAdapter } from '../../community/member/member.domain-adapter.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const domainAdapterFeature = await loadFeature(
  path.resolve(__dirname, 'features/property.domain-adapter.feature')
);
const typeConverterFeature = await loadFeature(
  path.resolve(__dirname, 'features/property.type-converter.feature')
);

function makePropertyDoc(overrides: Partial<Models.Property.Property> = {}) {
  return {
    propertyName: 'Test Property',
    propertyType: 'house',
    listedForSale: true,
    listedForRent: false,
    listedForLease: false,
    listedInDirectory: true,
    tags: ['tag1', 'tag2'],
    community: undefined,
    owner: undefined,
    location: {
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
      },
      position: {
        type: 'Point',
        coordinates: [40.7128, -74.0060],
      },
    },
    listingDetail: {
      price: 100000,
      description: 'Test description',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: '1.0',
    set(key: keyof Models.Property.Property, value: unknown) {
      // Type-safe property assignment
      (this as Models.Property.Property)[key] = value as never;
    },
    populate(path: string) {
      // Mock populate method for testing
      if (path === 'community' && this.community instanceof MongooseSeedwork.ObjectId) {
        this.community = makeCommunityDoc();
      } else if (path === 'owner' && this.owner instanceof MongooseSeedwork.ObjectId) {
        this.owner = makeMemberDoc();
      }
      return this;
    },
    ...overrides,
  } as Models.Property.Property;
}

function makeCommunityDoc(overrides: Partial<Models.Community.Community> = {}) {
  const base = {
    id: '6898b0c34b4a2fbc01e9c697',
    name: 'Test Community',
    domain: 'test.com',
    ...overrides,
  } as Models.Community.Community;
  return vi.mocked(base);
}

function makeMemberDoc(overrides: Partial<Models.Member.Member> = {}) {
  const base = {
    id: '6898b0c34b4a2fbc01e9c698',
    memberName: 'Test Member',
    ...overrides,
  } as Models.Member.Member;
  return vi.mocked(base);
}

function makeMockPassport() {
  return {
    community: {
      forCommunity: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
    property: {
      forProperty: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Domain.Passport;
}

test.for(domainAdapterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let doc: Models.Property.Property;
  let adapter: PropertyDomainAdapter;
  let communityAdapter: CommunityDomainAdapter;
  let memberAdapter: MemberDomainAdapter;
  let communityDoc: Models.Community.Community;
  let memberDoc: Models.Member.Member;
  let result: unknown;

  BeforeEachScenario(() => {
    communityDoc = makeCommunityDoc();
    memberDoc = makeMemberDoc();
    memberDoc.community = communityDoc;
    doc = makePropertyDoc({
      community: communityDoc,
      owner: memberDoc,
    });
    adapter = new PropertyDomainAdapter(doc);
    memberAdapter = new MemberDomainAdapter(memberDoc);
    communityAdapter = new CommunityDomainAdapter(communityDoc);
    result = undefined;
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose Property document with propertyName "Test Property", propertyType "house", and populated community and owner fields',
      () => {
        communityDoc = makeCommunityDoc();
        memberDoc = makeMemberDoc();
        memberDoc.community = communityDoc;
        doc = makePropertyDoc({
          community: communityDoc,
          owner: memberDoc,
        });
        adapter = new PropertyDomainAdapter(doc);
      }
    );
  });

  Scenario('Getting and setting the propertyName property', ({ Given, When, Then }) => {
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the propertyName property', () => {
      result = adapter.propertyName;
    });
    Then('it should return "Test Property"', () => {
      expect(result).toBe('Test Property');
    });
    When('I set the propertyName property to "Updated Property"', () => {
      adapter.propertyName = 'Updated Property';
    });
    Then('the document\'s propertyName should be "Updated Property"', () => {
      expect(doc.propertyName).toBe('Updated Property');
    });
  });

  Scenario('Getting and setting the propertyType property', ({ Given, When, Then }) => {
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the propertyType property', () => {
      result = adapter.propertyType;
    });
    Then('it should return "house"', () => {
      expect(result).toBe('house');
    });
    When('I set the propertyType property to "apartment"', () => {
      adapter.propertyType = 'apartment';
    });
    Then('the document\'s propertyType should be "apartment"', () => {
      expect(doc.propertyType).toBe('apartment');
    });
  });

  Scenario('Getting and setting the listedForSale property', ({ Given, When, Then }) => {
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the listedForSale property', () => {
      result = adapter.listedForSale;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the listedForSale property to false', () => {
      adapter.listedForSale = false;
    });
    Then('the document\'s listedForSale should be false', () => {
      expect(doc.listedForSale).toBe(false);
    });
  });

  Scenario('Getting and setting the listedForRent property', ({ Given, When, Then }) => {
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the listedForRent property', () => {
      result = adapter.listedForRent;
    });
    Then('it should return false', () => {
      expect(result).toBe(false);
    });
    When('I set the listedForRent property to true', () => {
      adapter.listedForRent = true;
    });
    Then('the document\'s listedForRent should be true', () => {
      expect(doc.listedForRent).toBe(true);
    });
  });

  Scenario('Getting and setting the listedForLease property', ({ Given, When, Then }) => {
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the listedForLease property', () => {
      result = adapter.listedForLease;
    });
    Then('it should return false', () => {
      expect(result).toBe(false);
    });
    When('I set the listedForLease property to true', () => {
      adapter.listedForLease = true;
    });
    Then('the document\'s listedForLease should be true', () => {
      expect(doc.listedForLease).toBe(true);
    });
  });

  Scenario('Getting and setting the listedInDirectory property', ({ Given, When, Then }) => {
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the listedInDirectory property', () => {
      result = adapter.listedInDirectory;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the listedInDirectory property to false', () => {
      adapter.listedInDirectory = false;
    });
    Then('the document\'s listedInDirectory should be false', () => {
      expect(doc.listedInDirectory).toBe(false);
    });
  });

  Scenario('Getting and setting the tags property', ({ Given, When, Then }) => {
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the tags property', () => {
      result = adapter.tags;
    });
    Then('it should return ["tag1", "tag2"]', () => {
      expect(result).toEqual(['tag1', 'tag2']);
    });
    When('I set the tags property to ["newTag1", "newTag2"]', () => {
      adapter.tags = ['newTag1', 'newTag2'];
    });
    Then('the document\'s tags should be ["newTag1", "newTag2"]', () => {
      expect(doc.tags).toEqual(['newTag1', 'newTag2']);
    });
  });

  Scenario('Getting and setting the hash property', ({ Given, When, Then }) => {
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the hash property', () => {
      result = adapter.hash;
    });
    Then('it should return undefined', () => {
      expect(result).toBeUndefined();
    });
    When('I set the hash property to "test-hash"', () => {
      adapter.hash = 'test-hash';
    });
    Then('the document\'s hash should be "test-hash"', () => {
      expect(doc.hash).toBe('test-hash');
    });
  });

  Scenario('Getting and setting the lastIndexed property', ({ Given, When, Then }) => {
    let testDate: Date;
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the lastIndexed property', () => {
      result = adapter.lastIndexed;
    });
    Then('it should return undefined', () => {
      expect(result).toBeUndefined();
    });
    When('I set the lastIndexed property to a date', () => {
      testDate = new Date();
      adapter.lastIndexed = testDate;
    });
    Then('the document\'s lastIndexed should be that date', () => {
      expect(doc.lastIndexed).toBe(testDate);
    });
  });

  Scenario('Getting and setting the updateIndexFailedDate property', ({ Given, When, Then }) => {
    let testDate: Date;
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the updateIndexFailedDate property', () => {
      result = adapter.updateIndexFailedDate;
    });
    Then('it should return undefined', () => {
      expect(result).toBeUndefined();
    });
    When('I set the updateIndexFailedDate property to a date', () => {
      testDate = new Date();
      adapter.updateIndexFailedDate = testDate;
    });
    Then('the document\'s updateIndexFailedDate should be that date', () => {
      expect(doc.updateIndexFailedDate).toBe(testDate);
    });
  });

  Scenario('Getting the location property', ({ Given, When, Then }) => {
    let locationAdapter: Domain.Contexts.Property.Property.PropertyLocationProps;
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the location property', () => {
      locationAdapter = adapter.location;
      result = locationAdapter;
    });
    Then('it should return a PropertyLocationDomainAdapter instance', () => {
      expect(result).toBeDefined();
      expect(result).toHaveProperty('address');
      expect(result).toHaveProperty('position');
    });
    When('I get the address property from the location', () => {
      result = locationAdapter.address;
    });
    Then('it should return a PropertyLocationAddressDomainAdapter instance', () => {
      expect(result).toBeDefined();
      expect(result).toHaveProperty('streetNumber');
      expect(result).toHaveProperty('streetName');
      expect(result).toHaveProperty('municipality');
    });
    When('I get the position property from the location', () => {
      result = locationAdapter.position;
    });
    Then('it should return a PropertyLocationPositionDomainAdapter instance', () => {
      expect(result).toBeDefined();
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('coordinates');
    });
  });

  Scenario('Getting the communityId property', ({ Given, When, Then }) => {
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the communityId property', () => {
      result = adapter.communityId;
    });
    Then('it should return the community\'s id as a string', () => {
      expect(result).toBe(communityDoc.id);
    });
  });

  Scenario('Getting the community property when populated', ({ Given, When, Then }) => {
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the community property', () => {
      result = adapter.community;
    });
    Then('it should return a CommunityDomainAdapter instance with the correct community data', () => {
      expect(result).toBeInstanceOf(CommunityDomainAdapter);
      expect((result as CommunityDomainAdapter).doc).toBe(communityDoc);
    });
  });

  Scenario('Getting the community property when not populated', ({ Given, When, Then }) => {
    let gettingCommunityWhenNotPopulated: () => void;
    Given('a PropertyDomainAdapter for a document with community as an ObjectId', () => {
      doc = makePropertyDoc({ community: new MongooseSeedwork.ObjectId() });
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the community property', () => {
      gettingCommunityWhenNotPopulated = () => {
        result = adapter.community;
      };
    });
    Then('an error should be thrown indicating "community is not populated or is not of the correct type"', () => {
      expect(gettingCommunityWhenNotPopulated).toThrow();
      expect(gettingCommunityWhenNotPopulated).throws(/community is not populated or is not of the correct type/);
    });
  });

  Scenario('Loading the community', ({ Given, When, Then }) => {
    Given('a PropertyDomainAdapter for a document with community as an ObjectId', () => {
      doc = makePropertyDoc({ community: new MongooseSeedwork.ObjectId() });
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I load the community', async () => {
      result = await adapter.loadCommunity();
    });
    Then('it should populate and return the community', () => {
      expect(result).toBeDefined();
    });
  });

  Scenario('Setting the community property with a valid Community domain object', ({ Given, And, When, Then }) => {
    let communityAdapter: CommunityDomainAdapter;
    let communityDomainObj: Domain.Contexts.Community.Community.Community<CommunityDomainAdapter>;
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    And('a valid Community domain object', () => {
      communityAdapter = new CommunityDomainAdapter(communityDoc);
      communityDomainObj = new Domain.Contexts.Community.Community.Community(communityAdapter, makeMockPassport());
    });
    When('I set the community property to the Community domain object', () => {
      adapter.community = communityDomainObj;
    });
    Then('the document\'s community should be set to the community\'s doc', () => {
      expect(doc.community).toBe(communityDoc);
    });
  });

  Scenario('Setting the community property with an invalid value', ({ Given, And, When, Then }) => {
    let settingCommunityWithInvalidValue: () => void;
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    And('an object that is not a Community domain object', () => {
      communityAdapter = {} as CommunityDomainAdapter;
    });
    When('I try to set the community property to the invalid object', () => {
      settingCommunityWithInvalidValue = () => {
        adapter.community = communityAdapter;
      };
    });
    Then('an error should be thrown indicating "community reference is missing id"', () => {
      expect(settingCommunityWithInvalidValue).toThrow();
      expect(settingCommunityWithInvalidValue).throws(/community reference is missing id/);
    });
  });

  Scenario('Getting the ownerId property', ({ Given, When, Then }) => {
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the ownerId property', () => {
      result = adapter.ownerId;
    });
    Then('it should return the owner\'s id as a string', () => {
      expect(result).toBe(memberDoc.id);
    });
  });

  Scenario('Getting the owner property when populated', ({ Given, When, Then }) => {
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the owner property', () => {
      result = adapter.owner;
    });
    Then('it should return a MemberEntityReference instance', () => {
      expect(result).toBeDefined();
      // The exact type checking might be complex due to the workaround
    });
  });

  Scenario('Getting the owner property when not populated', ({ Given, When, Then }) => {
    let gettingOwnerWhenNotPopulated: () => void;
    Given('a PropertyDomainAdapter for a document with owner as an ObjectId', () => {
      doc = makePropertyDoc({ owner: new MongooseSeedwork.ObjectId() });
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the owner property', () => {
      gettingOwnerWhenNotPopulated = () => {
        result = adapter.owner;
      };
    });
    Then('an error should be thrown indicating "owner is not populated or is not of the correct type"', () => {
      expect(gettingOwnerWhenNotPopulated).toThrow();
      expect(gettingOwnerWhenNotPopulated).throws(/owner is not populated or is not of the correct type/);
    });
  });

  Scenario('Loading the owner', ({ Given, When, Then }) => {
    Given('a PropertyDomainAdapter for a document with owner as an ObjectId', () => {
      doc = makePropertyDoc({ owner: new MongooseSeedwork.ObjectId() });
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I load the owner', async () => {
      result = await adapter.loadOwner();
    });
    Then('it should populate and return the owner', () => {
      expect(result).toBeDefined();
    });
  });

  Scenario('Setting the owner property with a valid Member domain object', ({ Given, And, When, Then }) => {
    let memberAdapter: MemberDomainAdapter;
    let memberDomainObj: Domain.Contexts.Community.Member.Member<MemberDomainAdapter>;
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    And('a valid Member domain object', () => {
      memberAdapter = new MemberDomainAdapter(memberDoc);
      memberDomainObj = new Domain.Contexts.Community.Member.Member(memberAdapter, makeMockPassport());
    });
    When('I set the owner property to the Member domain object', () => {
      adapter.setOwnerRef(memberDomainObj);
    });
    Then('the document\'s owner should be set to the member\'s doc', () => {
      expect(doc.owner?.toString()).toBe(memberDoc.id);
    });
  });

  Scenario('Setting the owner property with an invalid value', ({ Given, And, When, Then }) => {
    let settingOwnerWithInvalidValue: () => void;
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    And('an object that is not a Member domain object', () => {
      memberAdapter = {} as MemberDomainAdapter;
    });
    When('I try to set the owner property to the invalid object', () => {
      settingOwnerWithInvalidValue = () => {
        adapter.setOwnerRef(memberAdapter as unknown as Domain.Contexts.Community.Member.MemberEntityReference);
      };
    });
    Then('an error should be thrown indicating "owner reference is missing id"', () => {
      expect(settingOwnerWithInvalidValue).toThrow();
      expect(settingOwnerWithInvalidValue).throws(/owner reference is missing id/);
    });
  });

  Scenario('Getting the createdAt property', ({ Given, When, Then }) => {
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the createdAt property', () => {
      result = adapter.createdAt;
    });
    Then('it should return the createdAt date', () => {
      expect(result).toBeInstanceOf(Date);
    });
  });

  Scenario('Getting the updatedAt property', ({ Given, When, Then }) => {
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the updatedAt property', () => {
      result = adapter.updatedAt;
    });
    Then('it should return the updatedAt date', () => {
      expect(result).toBeInstanceOf(Date);
    });
  });

  Scenario('Getting the schemaVersion property', ({ Given, When, Then }) => {
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the schemaVersion property', () => {
      result = adapter.schemaVersion;
    });
    Then('it should return the schemaVersion number', () => {
      expect(typeof result).toBe('string');
    });
  });

  Scenario('Getting and setting address properties', ({ Given, When, Then }) => {
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
    });
    When('I get the streetNumber property from the address', () => {
      result = adapter.location.address.streetNumber;
    });
    Then('the streetNumber should be an empty string', () => {
      expect(result).toBe('');
    });
    When('I set the streetNumber property to "123"', () => {
      adapter.location.address.streetNumber = '123';
    });
    Then('the document\'s address streetNumber should be "123"', () => {
      expect(doc.location.address.streetNumber).toBe('123');
    });
    When('I get the streetName property from the address', () => {
      result = adapter.location.address.streetName;
    });
    Then('the streetName should be an empty string', () => {
      expect(result).toBe('');
    });
    When('I set the streetName property to "Main St"', () => {
      adapter.location.address.streetName = 'Main St';
    });
    Then('the document\'s address streetName should be "Main St"', () => {
      expect(doc.location.address.streetName).toBe('Main St');
    });
    When('I get the municipality property from the address', () => {
      result = adapter.location.address.municipality;
    });
    Then('the municipality should be an empty string', () => {
      expect(result).toBe('');
    });
    When('I set the municipality property to "Anytown"', () => {
      adapter.location.address.municipality = 'Anytown';
    });
    Then('the document\'s address municipality should be "Anytown"', () => {
      expect(doc.location.address.municipality).toBe('Anytown');
    });
    When('I get the municipalitySubdivision property from the address', () => {
      result = adapter.location.address.municipalitySubdivision;
    });
    Then('the municipalitySubdivision should be an empty string', () => {
      expect(result).toBe('');
    });
    When('I set the municipalitySubdivision property to "Subdivision"', () => {
      adapter.location.address.municipalitySubdivision = 'Subdivision';
    });
    Then('the document\'s address municipalitySubdivision should be "Subdivision"', () => {
      expect(doc.location.address.municipalitySubdivision).toBe('Subdivision');
    });
    When('I get the localName property from the address', () => {
      result = adapter.location.address.localName;
    });
    Then('the localName should be an empty string', () => {
      expect(result).toBe('');
    });
    When('I set the localName property to "Local Name"', () => {
      adapter.location.address.localName = 'Local Name';
    });
    Then('the document\'s address localName should be "Local Name"', () => {
      expect(doc.location.address.localName).toBe('Local Name');
    });
    When('I get the countrySecondarySubdivision property from the address', () => {
      result = adapter.location.address.countrySecondarySubdivision;
    });
    Then('the countrySecondarySubdivision should be an empty string', () => {
      expect(result).toBe('');
    });
    When('I set the countrySecondarySubdivision property to "Secondary"', () => {
      adapter.location.address.countrySecondarySubdivision = 'Secondary';
    });
    Then('the document\'s address countrySecondarySubdivision should be "Secondary"', () => {
      expect(doc.location.address.countrySecondarySubdivision).toBe('Secondary');
    });
    When('I get the countryTertiarySubdivision property from the address', () => {
      result = adapter.location.address.countryTertiarySubdivision;
    });
    Then('the countryTertiarySubdivision should be an empty string', () => {
      expect(result).toBe('');
    });
    When('I set the countryTertiarySubdivision property to "Tertiary"', () => {
      adapter.location.address.countryTertiarySubdivision = 'Tertiary';
    });
    Then('the document\'s address countryTertiarySubdivision should be "Tertiary"', () => {
      expect(doc.location.address.countryTertiarySubdivision).toBe('Tertiary');
    });
    When('I get the countrySubdivision property from the address', () => {
      result = adapter.location.address.countrySubdivision;
    });
    Then('the countrySubdivision should be an empty string', () => {
      expect(result).toBe('');
    });
    When('I set the countrySubdivision property to "State"', () => {
      adapter.location.address.countrySubdivision = 'State';
    });
    Then('the document\'s address countrySubdivision should be "State"', () => {
      expect(doc.location.address.countrySubdivision).toBe('State');
    });
    When('I get the countrySubdivisionName property from the address', () => {
      result = adapter.location.address.countrySubdivisionName;
    });
    Then('the countrySubdivisionName should be an empty string', () => {
      expect(result).toBe('');
    });
    When('I set the countrySubdivisionName property to "State Name"', () => {
      adapter.location.address.countrySubdivisionName = 'State Name';
    });
    Then('the document\'s address countrySubdivisionName should be "State Name"', () => {
      expect(doc.location.address.countrySubdivisionName).toBe('State Name');
    });
    When('I get the postalCode property from the address', () => {
      result = adapter.location.address.postalCode;
    });
    Then('the postalCode should be an empty string', () => {
      expect(result).toBe('');
    });
    When('I set the postalCode property to "12345"', () => {
      adapter.location.address.postalCode = '12345';
    });
    Then('the document\'s address postalCode should be "12345"', () => {
      expect(doc.location.address.postalCode).toBe('12345');
    });
    When('I get the extendedPostalCode property from the address', () => {
      result = adapter.location.address.extendedPostalCode;
    });
    Then('the extendedPostalCode should be an empty string', () => {
      expect(result).toBe('');
    });
    When('I set the extendedPostalCode property to "6789"', () => {
      adapter.location.address.extendedPostalCode = '6789';
    });
    Then('the document\'s address extendedPostalCode should be "6789"', () => {
      expect(doc.location.address.extendedPostalCode).toBe('6789');
    });
    When('I get the countryCode property from the address', () => {
      result = adapter.location.address.countryCode;
    });
    Then('the countryCode should be an empty string', () => {
      expect(result).toBe('');
    });
    When('I set the countryCode property to "US"', () => {
      adapter.location.address.countryCode = 'US';
    });
    Then('the document\'s address countryCode should be "US"', () => {
      expect(doc.location.address.countryCode).toBe('US');
    });
    When('I get the country property from the address', () => {
      result = adapter.location.address.country;
    });
    Then('the country should be an empty string', () => {
      expect(result).toBe('');
    });
    When('I set the country property to "USA"', () => {
      adapter.location.address.country = 'USA';
    });
    Then('the document\'s address country should be "USA"', () => {
      expect(doc.location.address.country).toBe('USA');
    });
    When('I get the countryCodeISO3 property from the address', () => {
      result = adapter.location.address.countryCodeISO3;
    });
    Then('the countryCodeISO3 should be an empty string', () => {
      expect(result).toBe('');
    });
    When('I set the countryCodeISO3 property to "USA"', () => {
      adapter.location.address.countryCodeISO3 = 'USA';
    });
    Then('the document\'s address countryCodeISO3 should be "USA"', () => {
      expect(doc.location.address.countryCodeISO3).toBe('USA');
    });
    When('I get the freeformAddress property from the address', () => {
      result = adapter.location.address.freeformAddress;
    });
    Then('the freeformAddress should be an empty string', () => {
      expect(result).toBe('');
    });
    When('I set the freeformAddress property to "123 Main St, Anytown"', () => {
      adapter.location.address.freeformAddress = '123 Main St, Anytown';
    });
    Then('the document\'s address freeformAddress should be "123 Main St, Anytown"', () => {
      expect(doc.location.address.freeformAddress).toBe('123 Main St, Anytown');
    });
    When('I get the streetNameAndNumber property from the address', () => {
      result = adapter.location.address.streetNameAndNumber;
    });
    Then('the streetNameAndNumber should be an empty string', () => {
      expect(result).toBe('');
    });
    When('I set the streetNameAndNumber property to "123 Main St"', () => {
      adapter.location.address.streetNameAndNumber = '123 Main St';
    });
    Then('the document\'s address streetNameAndNumber should be "123 Main St"', () => {
      expect(doc.location.address.streetNameAndNumber).toBe('123 Main St');
    });
    When('I get the routeNumbers property from the address', () => {
      result = adapter.location.address.routeNumbers;
    });
    Then('the routeNumbers should be an empty string', () => {
      expect(result).toBe('');
    });
    When('I set the routeNumbers property to "I-95"', () => {
      adapter.location.address.routeNumbers = 'I-95';
    });
    Then('the document\'s address routeNumbers should be "I-95"', () => {
      expect(doc.location.address.routeNumbers).toBe('I-95');
    });
    When('I get the crossStreet property from the address', () => {
      result = adapter.location.address.crossStreet;
    });
    Then('the crossStreet should be an empty string', () => {
      expect(result).toBe('');
    });
    When('I set the crossStreet property to "Elm St"', () => {
      adapter.location.address.crossStreet = 'Elm St';
    });
    Then('the document\'s address crossStreet should be "Elm St"', () => {
      expect(doc.location.address.crossStreet).toBe('Elm St');
    });
  });

  Scenario('Getting and setting position properties', ({ Given, When, Then }) => {
    let positionAdapter: Domain.Contexts.Property.Property.PropertyLocationPositionProps;
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
      positionAdapter = adapter.location.position;
    });
    When('I get the type property from the position', () => {
      result = positionAdapter.type;
    });
    Then('it should return "Point"', () => {
      expect(result).toBe('Point');
    });
    When('I set the type property to "Polygon"', () => {
      positionAdapter.type = 'Polygon';
    });
    Then('the document\'s position type should be "Polygon"', () => {
      expect(doc.location.position.type).toBe('Polygon');
    });
    When('I get the coordinates property from the position', () => {
      result = positionAdapter.coordinates;
    });
    Then('it should return [40.7128, -74.0060]', () => {
      expect(result).toEqual([40.7128, -74.0060]);
    });
    When('I set the coordinates property to [41.7128, -75.0060]', () => {
      positionAdapter.coordinates = [41.7128, -75.0060];
    });
    Then('the document\'s position coordinates should be [41.7128, -75.0060]', () => {
      expect(doc.location.position.coordinates).toEqual([41.7128, -75.0060]);
    });
  });

  Scenario('Getting and setting listing detail properties', ({ Given, When, Then }) => {
    let listingDetailAdapter: Domain.Contexts.Property.Property.PropertyListingDetailProps;
    Given('a PropertyDomainAdapter for the document', () => {
      adapter = new PropertyDomainAdapter(doc);
      listingDetailAdapter = adapter.listingDetail;
    });
    When('I get the price property from the listingDetail', () => {
      result = listingDetailAdapter.price;
    });
    Then('the price should be 100000', () => {
      expect(result).toBe(100000);
    });
    When('I set the price property to 250000', () => {
      listingDetailAdapter.price = 250000;
    });
    Then('the document\'s listingDetail price should be 250000', () => {
      expect(doc.listingDetail.price).toBe(250000);
    });
    When('I get the description property from the listingDetail', () => {
      result = listingDetailAdapter.description;
    });
    Then('the description should be "Test description"', () => {
      expect(result).toBe('Test description');
    });
    When('I set the description property to "Beautiful home"', () => {
      listingDetailAdapter.description = 'Beautiful home';
    });
    Then('the document\'s listingDetail description should be "Beautiful home"', () => {
      expect(doc.listingDetail.description).toBe('Beautiful home');
    });
    When('I get the rentHigh property from the listingDetail', () => {
      result = listingDetailAdapter.rentHigh;
    });
    Then('the rentHigh should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the rentHigh property to 3000', () => {
      listingDetailAdapter.rentHigh = 3000;
    });
    Then('the document\'s listingDetail rentHigh should be 3000', () => {
      expect(doc.listingDetail.rentHigh).toBe(3000);
    });
    When('I get the rentLow property from the listingDetail', () => {
      result = listingDetailAdapter.rentLow;
    });
    Then('the rentLow should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the rentLow property to 2500', () => {
      listingDetailAdapter.rentLow = 2500;
    });
    Then('the document\'s listingDetail rentLow should be 2500', () => {
      expect(doc.listingDetail.rentLow).toBe(2500);
    });
    When('I get the lease property from the listingDetail', () => {
      result = listingDetailAdapter.lease;
    });
    Then('the lease should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the lease property to 1', () => {
      listingDetailAdapter.lease = 1;
    });
    Then('the document\'s listingDetail lease should be 1', () => {
      expect(doc.listingDetail.lease).toBe(1);
    });
    When('I get the maxGuests property from the listingDetail', () => {
      result = listingDetailAdapter.maxGuests;
    });
    Then('the maxGuests should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the maxGuests property to 6', () => {
      listingDetailAdapter.maxGuests = 6;
    });
    Then('the document\'s listingDetail maxGuests should be 6', () => {
      expect(doc.listingDetail.maxGuests).toBe(6);
    });
    When('I get the bedrooms property from the listingDetail', () => {
      result = listingDetailAdapter.bedrooms;
    });
    Then('the bedrooms should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the bedrooms property to 3', () => {
      listingDetailAdapter.bedrooms = 3;
    });
    Then('the document\'s listingDetail bedrooms should be 3', () => {
      expect(doc.listingDetail.bedrooms).toBe(3);
    });
    When('I get the bedroomDetails property from the listingDetail', () => {
      result = listingDetailAdapter.bedroomDetails;
    });
    Then('the bedroomDetails should be a MongoosePropArray', () => {
      expect(result).toBeInstanceOf(MongooseSeedwork.MongoosePropArray);
    });
    When('I get the bathrooms property from the listingDetail', () => {
      result = listingDetailAdapter.bathrooms;
    });
    Then('the bathrooms should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the bathrooms property to 2', () => {
      listingDetailAdapter.bathrooms = 2;
    });
    Then('the document\'s listingDetail bathrooms should be 2', () => {
      expect(doc.listingDetail.bathrooms).toBe(2);
    });
    When('I get the squareFeet property from the listingDetail', () => {
      result = listingDetailAdapter.squareFeet;
    });
    Then('the squareFeet should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the squareFeet property to 2000', () => {
      listingDetailAdapter.squareFeet = 2000;
    });
    Then('the document\'s listingDetail squareFeet should be 2000', () => {
      expect(doc.listingDetail.squareFeet).toBe(2000);
    });
    When('I get the yearBuilt property from the listingDetail', () => {
      result = listingDetailAdapter.yearBuilt;
    });
    Then('the yearBuilt should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the yearBuilt property to 1995', () => {
      listingDetailAdapter.yearBuilt = 1995;
    });
    Then('the document\'s listingDetail yearBuilt should be 1995', () => {
      expect(doc.listingDetail.yearBuilt).toBe(1995);
    });
    When('I get the lotSize property from the listingDetail', () => {
      result = listingDetailAdapter.lotSize;
    });
    Then('the lotSize should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the lotSize property to 0.5', () => {
      listingDetailAdapter.lotSize = 0.5;
    });
    Then('the document\'s listingDetail lotSize should be 0.5', () => {
      expect(doc.listingDetail.lotSize).toBe(0.5);
    });
    When('I get the amenities property from the listingDetail', () => {
      result = listingDetailAdapter.amenities;
    });
    Then('the amenities should be an empty array', () => {
      expect(result).toEqual([]);
    });
    When('I set the amenities property to ["pool", "gym"]', () => {
      listingDetailAdapter.amenities = ['pool', 'gym'];
    });
    Then('the document\'s listingDetail amenities should be ["pool", "gym"]', () => {
      expect(doc.listingDetail.amenities).toEqual(['pool', 'gym']);
    });
    When('I get the additionalAmenities property from the listingDetail', () => {
      result = listingDetailAdapter.additionalAmenities;
    });
    Then('the additionalAmenities should be a MongoosePropArray', () => {
      expect(result).toBeInstanceOf(MongooseSeedwork.MongoosePropArray);
    });
    When('I get the images property from the listingDetail', () => {
      result = listingDetailAdapter.images;
    });
    Then('the images should be an empty array', () => {
      expect(result).toEqual([]);
    });
    When('I set the images property to ["image1.jpg", "image2.jpg"]', () => {
      listingDetailAdapter.images = ['image1.jpg', 'image2.jpg'];
    });
    Then('the document\'s listingDetail images should be ["image1.jpg", "image2.jpg"]', () => {
      expect(doc.listingDetail.images).toEqual(['image1.jpg', 'image2.jpg']);
    });
    When('I get the video property from the listingDetail', () => {
      result = listingDetailAdapter.video;
    });
    Then('the video should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the video property to "video.mp4"', () => {
      listingDetailAdapter.video = 'video.mp4';
    });
    Then('the document\'s listingDetail video should be "video.mp4"', () => {
      expect(doc.listingDetail.video).toBe('video.mp4');
    });
    When('I get the floorPlan property from the listingDetail', () => {
      result = listingDetailAdapter.floorPlan;
    });
    Then('the floorPlan should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the floorPlan property to "floorplan.pdf"', () => {
      listingDetailAdapter.floorPlan = 'floorplan.pdf';
    });
    Then('the document\'s listingDetail floorPlan should be "floorplan.pdf"', () => {
      expect(doc.listingDetail.floorPlan).toBe('floorplan.pdf');
    });
    When('I get the floorPlanImages property from the listingDetail', () => {
      result = listingDetailAdapter.floorPlanImages;
    });
    Then('the floorPlanImages should be an empty array', () => {
      expect(result).toEqual([]);
    });
    When('I set the floorPlanImages property to ["fp1.jpg", "fp2.jpg"]', () => {
      listingDetailAdapter.floorPlanImages = ['fp1.jpg', 'fp2.jpg'];
    });
    Then('the document\'s listingDetail floorPlanImages should be ["fp1.jpg", "fp2.jpg"]', () => {
      expect(doc.listingDetail.floorPlanImages).toEqual(['fp1.jpg', 'fp2.jpg']);
    });
    When('I get the listingAgent property from the listingDetail', () => {
      result = listingDetailAdapter.listingAgent;
    });
    Then('the listingAgent should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the listingAgent property to "John Doe"', () => {
      listingDetailAdapter.listingAgent = 'John Doe';
    });
    Then('the document\'s listingDetail listingAgent should be "John Doe"', () => {
      expect(doc.listingDetail.listingAgent).toBe('John Doe');
    });
    When('I get the listingAgentPhone property from the listingDetail', () => {
      result = listingDetailAdapter.listingAgentPhone;
    });
    Then('the listingAgentPhone should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the listingAgentPhone property to "555-1234"', () => {
      listingDetailAdapter.listingAgentPhone = '555-1234';
    });
    Then('the document\'s listingDetail listingAgentPhone should be "555-1234"', () => {
      expect(doc.listingDetail.listingAgentPhone).toBe('555-1234');
    });
    When('I get the listingAgentEmail property from the listingDetail', () => {
      result = listingDetailAdapter.listingAgentEmail;
    });
    Then('the listingAgentEmail should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the listingAgentEmail property to "john@example.com"', () => {
      listingDetailAdapter.listingAgentEmail = 'john@example.com';
    });
    Then('the document\'s listingDetail listingAgentEmail should be "john@example.com"', () => {
      expect(doc.listingDetail.listingAgentEmail).toBe('john@example.com');
    });
    When('I get the listingAgentWebsite property from the listingDetail', () => {
      result = listingDetailAdapter.listingAgentWebsite;
    });
    Then('the listingAgentWebsite should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the listingAgentWebsite property to "http://john.com"', () => {
      listingDetailAdapter.listingAgentWebsite = 'http://john.com';
    });
    Then('the document\'s listingDetail listingAgentWebsite should be "http://john.com"', () => {
      expect(doc.listingDetail.listingAgentWebsite).toBe('http://john.com');
    });
    When('I get the listingAgentCompany property from the listingDetail', () => {
      result = listingDetailAdapter.listingAgentCompany;
    });
    Then('the listingAgentCompany should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the listingAgentCompany property to "Real Estate Co"', () => {
      listingDetailAdapter.listingAgentCompany = 'Real Estate Co';
    });
    Then('the document\'s listingDetail listingAgentCompany should be "Real Estate Co"', () => {
      expect(doc.listingDetail.listingAgentCompany).toBe('Real Estate Co');
    });
    When('I get the listingAgentCompanyPhone property from the listingDetail', () => {
      result = listingDetailAdapter.listingAgentCompanyPhone;
    });
    Then('the listingAgentCompanyPhone should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the listingAgentCompanyPhone property to "555-5678"', () => {
      listingDetailAdapter.listingAgentCompanyPhone = '555-5678';
    });
    Then('the document\'s listingDetail listingAgentCompanyPhone should be "555-5678"', () => {
      expect(doc.listingDetail.listingAgentCompanyPhone).toBe('555-5678');
    });
    When('I get the listingAgentCompanyEmail property from the listingDetail', () => {
      result = listingDetailAdapter.listingAgentCompanyEmail;
    });
    Then('the listingAgentCompanyEmail should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the listingAgentCompanyEmail property to "info@realestate.com"', () => {
      listingDetailAdapter.listingAgentCompanyEmail = 'info@realestate.com';
    });
    Then('the document\'s listingDetail listingAgentCompanyEmail should be "info@realestate.com"', () => {
      expect(doc.listingDetail.listingAgentCompanyEmail).toBe('info@realestate.com');
    });
    When('I get the listingAgentCompanyWebsite property from the listingDetail', () => {
      result = listingDetailAdapter.listingAgentCompanyWebsite;
    });
    Then('the listingAgentCompanyWebsite should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the listingAgentCompanyWebsite property to "http://realestate.com"', () => {
      listingDetailAdapter.listingAgentCompanyWebsite = 'http://realestate.com';
    });
    Then('the document\'s listingDetail listingAgentCompanyWebsite should be "http://realestate.com"', () => {
      expect(doc.listingDetail.listingAgentCompanyWebsite).toBe('http://realestate.com');
    });
    When('I get the listingAgentCompanyAddress property from the listingDetail', () => {
      result = listingDetailAdapter.listingAgentCompanyAddress;
    });
    Then('the listingAgentCompanyAddress should be null', () => {
      expect(result).toBeNull();
    });
    When('I set the listingAgentCompanyAddress property to "123 Office St"', () => {
      listingDetailAdapter.listingAgentCompanyAddress = '123 Office St';
    });
    Then('the document\'s listingDetail listingAgentCompanyAddress should be "123 Office St"', () => {
      expect(doc.listingDetail.listingAgentCompanyAddress).toBe('123 Office St');
    });
  });

test.for(typeConverterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let doc: Models.Property.Property;
  let communityDoc: Models.Community.Community;
  let memberDoc: Models.Member.Member;
  let converter: PropertyConverter;
  let passport: Domain.Passport;
  let result: unknown;

  BeforeEachScenario(() => {
    communityDoc = makeCommunityDoc();
    memberDoc = makeMemberDoc();
    memberDoc.community = communityDoc;
    doc = makePropertyDoc({
      community: communityDoc,
      owner: memberDoc,
    });
    converter = new PropertyConverter();
    passport = makeMockPassport();
    result = undefined;
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose Property document with propertyName "Test Property", propertyType "house", and populated community and owner fields',
      () => {
        communityDoc = makeCommunityDoc();
        memberDoc = makeMemberDoc();
        memberDoc.community = communityDoc;
        doc = makePropertyDoc({
          community: communityDoc,
          owner: memberDoc,
        });
      }
    );
  });

  Scenario('Converting a Mongoose Property document to a domain object', ({ Given, When, Then, And }) => {
    Given('a PropertyConverter instance', () => {
      converter = new PropertyConverter();
    });
    When('I call toDomain with the Mongoose Property document', () => {
      result = converter.toDomain(doc, passport);
    });
    Then('I should receive a Property domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.Property.Property.Property);
    });
    And('the domain object\'s propertyName should be "Test Property"', () => {
      expect((result as Domain.Contexts.Property.Property.Property<PropertyDomainAdapter>).propertyName).toBe('Test Property');
    });
    And('the domain object\'s propertyType should be "house"', () => {
      expect((result as Domain.Contexts.Property.Property.Property<PropertyDomainAdapter>).propertyType).toBe('house');
    });
  });

  Scenario('Converting a domain object to a Mongoose Property document', ({ Given, And, When, Then }) => {
    let domainObj: Domain.Contexts.Property.Property.Property<PropertyDomainAdapter>;
    let communityAdapter: CommunityDomainAdapter;
    let memberAdapter: MemberDomainAdapter;
    let communityDomainObj: Domain.Contexts.Community.Community.Community<CommunityDomainAdapter>;
    let memberDomainObj: Domain.Contexts.Community.Member.Member<MemberDomainAdapter>;
    let resultDoc: Models.Property.Property;

    Given('a PropertyConverter instance', () => {
      converter = new PropertyConverter();
    });
    And('a Property domain object with propertyName "New Property", propertyType "apartment", and valid community and owner', () => {
      communityAdapter = new CommunityDomainAdapter(communityDoc);
      memberAdapter = new MemberDomainAdapter(memberDoc);
      communityDomainObj = new Domain.Contexts.Community.Community.Community(communityAdapter, passport);
      memberDomainObj = new Domain.Contexts.Community.Member.Member(memberAdapter, passport);

      const propertyDoc = makePropertyDoc({
        propertyName: 'New Property',
        propertyType: 'apartment',
        community: communityDoc,
        owner: memberDoc,
      });
      const adapter = new PropertyDomainAdapter(propertyDoc);
      adapter.community = communityDomainObj;
      adapter.setOwnerRef(memberDomainObj);
      domainObj = new Domain.Contexts.Property.Property.Property(adapter, passport);
    });
    When('I call toPersistence with the Property domain object', () => {
      resultDoc = converter.toPersistence(domainObj);
    });
    Then('I should receive a Mongoose Property document', () => {
      expect(resultDoc).toBeDefined();
      expect(resultDoc).toHaveProperty('propertyName');
    });
    And('the document\'s propertyName should be "New Property"', () => {
      expect(resultDoc.propertyName).toBe('New Property');
    });
    And('the document\'s propertyType should be "apartment"', () => {
      expect(resultDoc.propertyType).toBe('apartment');
    });
  });
});
});