import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { Domain } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { CommunityConverter, CommunityDomainAdapter } from './community.domain-adapter.ts';
import { EndUserDomainAdapter } from '../../user/end-user/end-user.domain-adapter.ts';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const domainAdapterFeature = await loadFeature(
  path.resolve(__dirname, 'features/community.domain-adapter.feature')
);
const typeConverterFeature = await loadFeature(
  path.resolve(__dirname, 'features/community.type-converter.feature')
);

function makeCommunityDoc(overrides: Partial<Models.Community.Community> = {}) {
  const base = {
    name: 'Test Community',
    domain: 'test.com',
    whiteLabelDomain: 'white.test.com',
    handle: 'test-handle',
    createdBy: undefined,
    set(key: keyof Models.Community.Community, value: unknown) {
      // Type-safe property assignment
      (this as Models.Community.Community)[key] = value as never;
    },
    ...overrides,
  } as Models.Community.Community;
  return vi.mocked(base);
}


function makeUserDoc(overrides: Partial<Models.User.EndUser> = {}) {
  return { id: '6898b0c34b4a2fbc01e9c697', displayName: 'Test User', ...overrides } as Models.User.EndUser;
}

function makeMockPassport() {
    return {
        community: {
            forCommunity: vi.fn(() => ({
                determineIf: vi.fn(() => true),
            })),
        },
        user: {
            forEndUser: vi.fn(() => ({
                determineIf: vi.fn(() => true),
            })),
        },
    } as unknown as Domain.Passport;
}

describeFeature(domainAdapterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let doc: Models.Community.Community;
  let adapter: CommunityDomainAdapter;
  let userDoc: Models.User.EndUser;
  let userAdapter: EndUserDomainAdapter;
  let result: unknown;

  BeforeEachScenario(() => {
    userDoc = makeUserDoc();
    doc = makeCommunityDoc({ createdBy: userDoc });
    adapter = new CommunityDomainAdapter(doc);
    result = undefined;
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose Community document with name "Test Community", domain "test.com", whiteLabelDomain "white.test.com", handle "test-handle", and a populated createdBy field',
      () => {
        userDoc = makeUserDoc();
        doc = makeCommunityDoc({ createdBy: userDoc });
        adapter = new CommunityDomainAdapter(doc);
      }
    );
  });

  Scenario('Getting and setting the name property', ({ Given, When, Then }) => {
    Given('a CommunityDomainAdapter for the document', () => {
      adapter = new CommunityDomainAdapter(doc);
    });
    When('I get the name property', () => {
      result = adapter.name;
    });
    Then('it should return "Test Community"', () => {
      expect(result).toBe('Test Community');
    });
    When('I set the name property to "New Name"', () => {
      adapter.name = 'New Name';
    });
    Then('the document\'s name should be "New Name"', () => {
      expect(doc.name).toBe('New Name');
    });
  });

  Scenario('Getting and setting the domain property', ({ Given, When, Then }) => {
    Given('a CommunityDomainAdapter for the document', () => {
      adapter = new CommunityDomainAdapter(doc);
    });
    When('I get the domain property', () => {
      result = adapter.domain;
    });
    Then('it should return "test.com"', () => {
      expect(result).toBe('test.com');
    });
    When('I set the domain property to "new.com"', () => {
      adapter.domain = 'new.com';
    });
    Then('the document\'s domain should be "new.com"', () => {
      expect(doc.domain).toBe('new.com');
    });
  });

  Scenario('Getting and setting the whiteLabelDomain property', ({ Given, When, Then }) => {
    Given('a CommunityDomainAdapter for the document', () => {
      adapter = new CommunityDomainAdapter(doc);
    });
    When('I get the whiteLabelDomain property', () => {
      result = adapter.whiteLabelDomain;
    });
    Then('it should return "white.test.com"', () => {
      expect(result).toBe('white.test.com');
    });
    When('I set the whiteLabelDomain property to "newwhite.com"', () => {
      adapter.whiteLabelDomain = 'newwhite.com';
    });
    Then('the document\'s whiteLabelDomain should be "newwhite.com"', () => {
      expect(doc.whiteLabelDomain).toBe('newwhite.com');
    });
  });

  Scenario('Getting and setting the handle property', ({ Given, When, Then }) => {
    Given('a CommunityDomainAdapter for the document', () => {
      adapter = new CommunityDomainAdapter(doc);
    });
    When('I get the handle property', () => {
      result = adapter.handle;
    });
    Then('it should return "test-handle"', () => {
      expect(result).toBe('test-handle');
    });
    When('I set the handle property to "new-handle"', () => {
      adapter.handle = 'new-handle';
    });
    Then('the document\'s handle should be "new-handle"', () => {
      expect(doc.handle).toBe('new-handle');
    });
  });

  Scenario('Getting the createdBy property when populated', ({ Given, When, Then }) => {
    Given('a CommunityDomainAdapter for the document', () => {
      adapter = new CommunityDomainAdapter(doc);
    });
    When('I get the createdBy property', () => {
      result = adapter.createdBy;
    });
    Then('it should return an EndUserDomainAdapter instance with the correct user data', () => {
      expect(result).toBeInstanceOf(EndUserDomainAdapter);
      expect((result as EndUserDomainAdapter).doc).toBe(userDoc);
    });
  });

  Scenario('Getting the createdBy property when not populated', ({ Given, When, Then }) => {
    let gettingCreatingByWhenNotPopulated: () => void;
    Given('a CommunityDomainAdapter for a document with no createdBy', () => {
      doc = makeCommunityDoc({ createdBy: undefined });
      adapter = new CommunityDomainAdapter(doc);
    });
    When('I get the createdBy property', () => {
      gettingCreatingByWhenNotPopulated = () => {
        result = adapter.createdBy;
      };
    });
    Then('an error should be thrown indicating "createdBy is not populated"', () => {
      expect(gettingCreatingByWhenNotPopulated).toThrow();
      expect(gettingCreatingByWhenNotPopulated).throws(/createdBy is not populated/);
    });
  });

  Scenario('Getting the createdBy property when it is an ObjectId', ({ Given, When, Then }) => {
    let gettingCreatedByWhenObjectId: () => void;
    Given('a CommunityDomainAdapter for a document with createdBy as an ObjectId', () => {
      doc = makeCommunityDoc({ createdBy: new MongooseSeedwork.ObjectId() });
      adapter = new CommunityDomainAdapter(doc);
    });
    When('I get the createdBy property', () => {
      gettingCreatedByWhenObjectId = () => {
        result = adapter.createdBy;
      };
    });
    Then('an error should be thrown indicating "createdBy is not populated or is not of the correct type"', () => {
      expect(gettingCreatedByWhenObjectId).toThrow();
      expect(gettingCreatedByWhenObjectId).throws(/createdBy is not populated or is not of the correct type/);
    });
  });

  Scenario('Setting the createdBy property with a valid EndUserDomainAdapter', ({ Given, And, When, Then }) => {
    Given('a CommunityDomainAdapter for the document', () => {
      adapter = new CommunityDomainAdapter(doc);
    });
    And('a valid EndUserDomainAdapter instance', () => {
      userAdapter = new EndUserDomainAdapter(userDoc);
    });
    When('I set the createdBy property to the EndUserDomainAdapter', () => {
      adapter.createdBy = userAdapter;
    });
    Then('the document\'s createdBy should be set to the user\'s doc', () => {
      expect(doc.createdBy?.toString()).toBe(userAdapter.doc.id);
    });
  });

  Scenario('Setting the createdBy property with an invalid value', ({ Given, And, When, Then }) => {
    let settingCreatedByWithInvalidValue: () => void;
    Given('a CommunityDomainAdapter for the document', () => {
      adapter = new CommunityDomainAdapter(doc);
    });
    And('an object that is not an EndUserDomainAdapter', () => {
      userAdapter = {} as EndUserDomainAdapter;
    });
    When('I try to set the createdBy property to the invalid object', () => {
      settingCreatedByWithInvalidValue = () => {
        adapter.createdBy = userAdapter;
      };
    });
    Then('an error should be thrown indicating "user is not an instance of EndUserDomainAdapter"', () => {
      expect(settingCreatedByWithInvalidValue).toThrow();
      expect(settingCreatedByWithInvalidValue).throws(/user reference is missing id/);
    });
  });
});

describeFeature(typeConverterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let doc: Models.Community.Community;
  let userDoc: Models.User.EndUser;
  let converter: CommunityConverter;
  let passport: Domain.Passport;
  let result: unknown;

  BeforeEachScenario(() => {
    userDoc = makeUserDoc();
    doc = makeCommunityDoc({ createdBy: userDoc });
    converter = new CommunityConverter();
    passport = makeMockPassport();
    result = undefined;
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose Community document with name "Test Community", domain "test.com", whiteLabelDomain "white.test.com", handle "test-handle", and a populated createdBy field',
      () => {
        userDoc = makeUserDoc();
        doc = makeCommunityDoc({ createdBy: userDoc });
      }
    );
  });

  Scenario('Converting a Mongoose Community document to a domain object', ({ Given, When, Then, And }) => {
    Given('a CommunityConverter instance', () => {
      converter = new CommunityConverter();
    });
    When('I call toDomain with the Mongoose Community document', () => {
      result = converter.toDomain(doc, passport);
    });
    Then('I should receive a Community domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.Community.Community.Community);
    });
    And('the domain object\'s name should be "Test Community"', () => {
      expect((result as Domain.Contexts.Community.Community.Community<CommunityDomainAdapter>).name).toBe('Test Community');
    });
    And('the domain object\'s domain should be "test.com"', () => {
      expect((result as Domain.Contexts.Community.Community.Community<CommunityDomainAdapter>).domain).toBe('test.com');
    });
    And('the domain object\'s whiteLabelDomain should be "white.test.com"', () => {
      expect((result as Domain.Contexts.Community.Community.Community<CommunityDomainAdapter>).whiteLabelDomain).toBe('white.test.com');
    });
    And('the domain object\'s handle should be "test-handle"', () => {
      expect((result as Domain.Contexts.Community.Community.Community<CommunityDomainAdapter>).handle).toBe('test-handle');
    });
    And('the domain object\'s createdBy should be an EndUser domain object with the correct user data', () => {
      const { createdBy } = result as Domain.Contexts.Community.Community.Community<CommunityDomainAdapter>;
      expect(createdBy).toBeInstanceOf(Domain.Contexts.User.EndUser.EndUser);
      expect(createdBy.id).toBe(userDoc.id);
      expect(createdBy.displayName).toBe(userDoc.displayName);
    });
  });

  Scenario('Converting a domain object to a Mongoose Community document', ({ Given, And, When, Then }) => {
    let domainObj: Domain.Contexts.Community.Community.Community<CommunityDomainAdapter>;
    let userAdapter: EndUserDomainAdapter;
    let userDomainObj: Domain.Contexts.User.EndUser.EndUser<EndUserDomainAdapter>;
    let userDoc: Models.User.EndUser;
    let resultDoc: Models.Community.Community;
    Given('a CommunityConverter instance', () => {
      converter = new CommunityConverter();
    });
    And('a Community domain object with name "New Community", domain "new.com", whiteLabelDomain "newwhite.com", handle "new-handle", and a valid createdBy', () => {
      userDoc = makeUserDoc();
      userAdapter = new EndUserDomainAdapter(userDoc);
      userDomainObj = new Domain.Contexts.User.EndUser.EndUser(userAdapter, passport);
      const doc = makeCommunityDoc({
        name: 'New Community',
        domain: 'new.com',
        whiteLabelDomain: 'newwhite.com',
        handle: 'new-handle',
        createdBy: userDoc,
      });
      const adapter = new CommunityDomainAdapter(doc);
      adapter.createdBy = userDomainObj;
      domainObj = new Domain.Contexts.Community.Community.Community(adapter, passport);
    });
    When('I call toPersistence with the Community domain object', () => {
      resultDoc = converter.toPersistence(domainObj);
    });
    Then('I should receive a Mongoose Community document', () => {
      expect(resultDoc).toBeDefined();
      expect(resultDoc).toHaveProperty('name');
    });
    And('the document\'s name should be "New Community"', () => {
      expect(resultDoc.name).toBe('New Community');
    });
    And('the document\'s domain should be "new.com"', () => {
      expect(resultDoc.domain).toBe('new.com');
    });
    And('the document\'s whiteLabelDomain should be "newwhite.com"', () => {
      expect(resultDoc.whiteLabelDomain).toBe('newwhite.com');
    });
    And('the document\'s handle should be "new-handle"', () => {
      expect(resultDoc.handle).toBe('new-handle');
    });
    And('the document\'s createdBy should be set to the correct user document', () => {
      expect(resultDoc.createdBy).toBe(userDoc);
    });
  });
});
