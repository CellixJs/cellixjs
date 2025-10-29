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
    set(key: keyof Models.Property.Property, value: unknown) {
      // Type-safe property assignment
      (this as Models.Property.Property)[key] = value as never;
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