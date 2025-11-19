import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Models } from '@ocom/data-sources-mongoose-models';
// Direct imports from domain package
import type { VendorUser } from '@ocom/domain/contexts/vendor-user';
import type { Passport } from '@ocom/domain/contexts/passport';
import { VendorUser as VendorUserClass } from '@ocom/domain/contexts/vendor-user';


const test = { for: describeFeature };
import {
  VendorUserConverter,
  VendorUserDomainAdapter,
  VendorUserPersonalInformationDomainAdapter,
  VendorUserIdentityDetailsDomainAdapter,
  VendorUserContactInformationDomainAdapter,
} from './vendor-user.domain-adapter.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const domainAdapterFeature = await loadFeature(
  path.resolve(__dirname, 'features/vendor-user.domain-adapter.feature')
);

const typeConverterFeature = await loadFeature(
  path.resolve(__dirname, 'features/vendor-user.type-converter.feature')
);

function makeVendorUserDoc(overrides: Partial<Models.User.VendorUser> = {}) {
  const personalInfoMock = {
    identityDetails: {
      lastName: 'Doe',
      legalNameConsistsOfOneName: false,
      restOfName: 'John',
      set: vi.fn(),
    },
    contactInformation: {
      email: 'vendor@example.com',
      set: vi.fn(),
    },
    set: vi.fn(),
  };

  const base = {
    userType: 'vendor-user',
    externalId: '123e4567-e89b-12d3-a456-426614174001',
    email: 'vendor@example.com',
    displayName: 'Test Vendor',
    accessBlocked: false,
    tags: ['tag1', 'tag2'],
    personalInformation: personalInfoMock,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    schemaVersion: '1.0.0',
    set: vi.fn(),
    ...overrides,
  } as Models.User.VendorUser;

  // If personalInformation was overridden, ensure it has the set spy
  if (overrides.personalInformation && typeof overrides.personalInformation.set !== 'function') {
    base.personalInformation.set = vi.fn();
  }

  return vi.mocked(base);
}

function makeMockPassport() {
  return {
    user: {
      forVendorUser: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Passport;
}

test.for(domainAdapterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let doc: Models.User.VendorUser;
  let adapter: VendorUserDomainAdapter;
  let result: unknown;

  BeforeEachScenario(() => {
    doc = makeVendorUserDoc();
    adapter = new VendorUserDomainAdapter(doc);
    result = undefined;
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose VendorUser document with userType "vendor-user", externalId "123e4567-e89b-12d3-a456-426614174001", email "vendor@example.com", displayName "Test Vendor", accessBlocked false, and tags ["tag1", "tag2"]',
      () => {
        doc = makeVendorUserDoc();
        adapter = new VendorUserDomainAdapter(doc);
      }
    );
  });

  Scenario('Getting the userType property', ({ Given, When, Then }) => {
    Given('a VendorUserDomainAdapter for the document', () => {
      adapter = new VendorUserDomainAdapter(doc);
    });
    When('I get the userType property', () => {
      result = adapter.userType;
    });
    Then('it should return "vendor-user"', () => {
      expect(result).toBe('vendor-user');
    });
  });

  Scenario('Getting and setting the externalId property', ({ Given, When, Then }) => {
    Given('a VendorUserDomainAdapter for the document', () => {
      adapter = new VendorUserDomainAdapter(doc);
    });
    When('I get the externalId property', () => {
      result = adapter.externalId;
    });
    Then('it should return "123e4567-e89b-12d3-a456-426614174001"', () => {
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174001');
    });
    When('I set the externalId property to "123e4567-e89b-12d3-a456-426614174002"', () => {
      adapter.externalId = '123e4567-e89b-12d3-a456-426614174002';
    });
    Then('the document\'s externalId should be "123e4567-e89b-12d3-a456-426614174002"', () => {
      expect(doc.externalId).toBe('123e4567-e89b-12d3-a456-426614174002');
    });
  });

  Scenario('Getting and setting the email property', ({ Given, When, Then }) => {
    Given('a VendorUserDomainAdapter for the document', () => {
      adapter = new VendorUserDomainAdapter(doc);
    });
    When('I get the email property', () => {
      result = adapter.email;
    });
    Then('it should return "vendor@example.com"', () => {
      expect(result).toBe('vendor@example.com');
    });
    When('I set the email property to "new-vendor@example.com"', () => {
      adapter.email = 'new-vendor@example.com';
    });
    Then('the document\'s email should be "new-vendor@example.com"', () => {
      expect(doc.email).toBe('new-vendor@example.com');
    });
  });

  Scenario('Getting and setting the displayName property', ({ Given, When, Then }) => {
    Given('a VendorUserDomainAdapter for the document', () => {
      adapter = new VendorUserDomainAdapter(doc);
    });
    When('I get the displayName property', () => {
      result = adapter.displayName;
    });
    Then('it should return "Test Vendor"', () => {
      expect(result).toBe('Test Vendor');
    });
    When('I set the displayName property to "New Vendor Name"', () => {
      adapter.displayName = 'New Vendor Name';
    });
    Then('the document\'s displayName should be "New Vendor Name"', () => {
      expect(doc.displayName).toBe('New Vendor Name');
    });
  });

  Scenario('Getting and setting the accessBlocked property', ({ Given, When, Then }) => {
    Given('a VendorUserDomainAdapter for the document', () => {
      adapter = new VendorUserDomainAdapter(doc);
    });
    When('I get the accessBlocked property', () => {
      result = adapter.accessBlocked;
    });
    Then('it should return false', () => {
      expect(result).toBe(false);
    });
    When('I set the accessBlocked property to true', () => {
      adapter.accessBlocked = true;
    });
    Then('the document\'s accessBlocked should be true', () => {
      expect(doc.accessBlocked).toBe(true);
    });
  });

  Scenario('Getting and setting the tags property', ({ Given, When, Then }) => {
    Given('a VendorUserDomainAdapter for the document', () => {
      adapter = new VendorUserDomainAdapter(doc);
    });
    When('I get the tags property', () => {
      result = adapter.tags;
    });
    Then('it should return ["tag1", "tag2"]', () => {
      expect(result).toEqual(['tag1', 'tag2']);
    });
    When('I set the tags property to ["tag3"]', () => {
      adapter.tags = ['tag3'];
    });
    Then('the document\'s tags should be ["tag3"]', () => {
      expect(doc.tags).toEqual(['tag3']);
    });
  });

  Scenario('Getting the personalInformation property', ({ Given, When, Then }) => {
    Given('a VendorUserDomainAdapter for the document', () => {
      adapter = new VendorUserDomainAdapter(doc);
    });
    When('I get the personalInformation property', () => {
      result = adapter.personalInformation;
    });
    Then('it should return a VendorUserPersonalInformationDomainAdapter instance', () => {
      expect(result).toBeInstanceOf(VendorUserPersonalInformationDomainAdapter);
    });
  });

  Scenario('Getting the personalInformation property when not defined on the document', ({ Given, When, Then }) => {
    let docWithoutPersonalInfo: Models.User.VendorUser;
    Given('a VendorUserDomainAdapter for a document with no personalInformation', () => {
      docWithoutPersonalInfo = makeVendorUserDoc({ personalInformation: {} } as Partial<Models.User.VendorUser>);
      adapter = new VendorUserDomainAdapter(docWithoutPersonalInfo);
    });
    When('I get the personalInformation property', () => {
      result = adapter.personalInformation;
    });
    Then('it should return a VendorUserPersonalInformationDomainAdapter instance', () => {
      expect(result).toBeInstanceOf(VendorUserPersonalInformationDomainAdapter);
    });
  });

  Scenario('Getting the identityDetails property from personalInformation', ({ Given, When, And, Then }) => {
    let personalInformation: Models.User.VendorUserPersonalInformation;
    Given('a VendorUserDomainAdapter for the document', () => {
      adapter = new VendorUserDomainAdapter(doc);
    });
    When('I get the personalInformation property', () => {
      personalInformation = adapter.personalInformation as Models.User.VendorUserPersonalInformation;
    });
    And('I get the identityDetails property', () => {
      result = personalInformation.identityDetails;
    });
    Then('it should return a VendorUserIdentityDetailsDomainAdapter instance', () => {
      expect(result).toBeInstanceOf(VendorUserIdentityDetailsDomainAdapter);
    });
  });

  Scenario('Getting and setting the lastName property from identityDetails', ({ Given, When, And, Then }) => {
    let personalInformation: VendorUserPersonalInformationDomainAdapter;
    let identityDetails: VendorUserIdentityDetailsDomainAdapter;
    Given('a VendorUserDomainAdapter for the document', () => {
      adapter = new VendorUserDomainAdapter(doc);
    });
    When('I get the personalInformation property', () => {
      personalInformation = adapter.personalInformation as VendorUserPersonalInformationDomainAdapter;
    });
    And('I get the identityDetails property', () => {
      identityDetails = personalInformation.identityDetails as VendorUserIdentityDetailsDomainAdapter;
    });
    And('I get the lastName property', () => {
      result = identityDetails.lastName;
    });
    Then('it should return the correct lastName', () => {
      expect(result).toBe('Doe');
    });
    When('I set the lastName property to "Smith"', () => {
      identityDetails.lastName = 'Smith';
    });
    Then('the identityDetails\' lastName should be "Smith"', () => {
      expect(doc.personalInformation?.identityDetails?.lastName).toBe('Smith');
    });
  });

  Scenario('Getting and setting the legalNameConsistsOfOneName property from identityDetails', ({ Given, When, And, Then }) => {
    let personalInformation: VendorUserPersonalInformationDomainAdapter;
    let identityDetails: VendorUserIdentityDetailsDomainAdapter;
    Given('a VendorUserDomainAdapter for the document', () => {
      adapter = new VendorUserDomainAdapter(doc);
    });
    When('I get the personalInformation property', () => {
      personalInformation = adapter.personalInformation as VendorUserPersonalInformationDomainAdapter;
    });
    And('I get the identityDetails property', () => {
      identityDetails = personalInformation.identityDetails as VendorUserIdentityDetailsDomainAdapter;
    });
    And('I get the legalNameConsistsOfOneName property', () => {
      result = identityDetails.legalNameConsistsOfOneName;
    });
    Then('it should return the correct value', () => {
      expect(result).toBe(false);
    });
    When('I set the legalNameConsistsOfOneName property to true', () => {
      identityDetails.legalNameConsistsOfOneName = true;
    });
    Then('the identityDetails\' legalNameConsistsOfOneName should be true', () => {
      expect(doc.personalInformation?.identityDetails?.legalNameConsistsOfOneName).toBe(true);
    });
  });

  Scenario('Getting and setting the restOfName property from identityDetails', ({ Given, When, And, Then }) => {
    let personalInformation: VendorUserPersonalInformationDomainAdapter;
    let identityDetails: VendorUserIdentityDetailsDomainAdapter;
    Given('a VendorUserDomainAdapter for the document', () => {
      adapter = new VendorUserDomainAdapter(doc);
    });
    When('I get the personalInformation property', () => {
      personalInformation = adapter.personalInformation as VendorUserPersonalInformationDomainAdapter;
    });
    And('I get the identityDetails property', () => {
      identityDetails = personalInformation.identityDetails as VendorUserIdentityDetailsDomainAdapter;
    });
    And('I get the restOfName property', () => {
      result = identityDetails.restOfName;
    });
    Then('it should return the correct restOfName', () => {
      expect(result).toBe('John');
    });
    When('I set the restOfName property to "John"', () => {
      identityDetails.restOfName = 'John';
    });
    Then('the identityDetails\' restOfName should be "John"', () => {
      expect(doc.personalInformation?.identityDetails?.restOfName).toBe('John');
    });
  });

  Scenario('Getting the contactInformation property from personalInformation', ({ Given, When, And, Then }) => {
    let personalInformation: VendorUserPersonalInformationDomainAdapter;
    Given('a VendorUserDomainAdapter for the document', () => {
      adapter = new VendorUserDomainAdapter(doc);
    });
    When('I get the personalInformation property', () => {
      personalInformation = adapter.personalInformation as VendorUserPersonalInformationDomainAdapter;
    });
    And('I get the contactInformation property', () => {
      result = personalInformation.contactInformation;
    });
    Then('it should return a VendorUserContactInformationDomainAdapter instance', () => {
      expect(result).toBeInstanceOf(VendorUserContactInformationDomainAdapter);
    });
  });

  Scenario('Getting the contactInformation property when not defined on personalInformation', ({ Given, When, And, Then }) => {
    let docWithoutContactInfo: Models.User.VendorUser;
    let personalInformation: VendorUserPersonalInformationDomainAdapter;
    Given('a VendorUserDomainAdapter for a document with no contactInformation', () => {
      docWithoutContactInfo = makeVendorUserDoc({
        personalInformation: { identityDetails: { lastName: 'Doe' }, contactInformation: {} }
      } as Partial<Models.User.VendorUser>);
      adapter = new VendorUserDomainAdapter(docWithoutContactInfo);
    });
    When('I get the personalInformation property', () => {
      personalInformation = adapter.personalInformation as VendorUserPersonalInformationDomainAdapter;
    });
    And('I get the contactInformation property', () => {
      result = personalInformation.contactInformation;
    });
    Then('it should return a VendorUserContactInformationDomainAdapter instance', () => {
      expect(result).toBeInstanceOf(VendorUserContactInformationDomainAdapter);
    });
  });

  Scenario('Getting and setting the email property from contactInformation', ({ Given, When, And, Then }) => {
    let personalInformation: VendorUserPersonalInformationDomainAdapter;
    let contactInformation: VendorUserContactInformationDomainAdapter;
    Given('a VendorUserDomainAdapter for the document', () => {
      adapter = new VendorUserDomainAdapter(doc);
    });
    When('I get the personalInformation property', () => {
      personalInformation = adapter.personalInformation as VendorUserPersonalInformationDomainAdapter;
    });
    And('I get the contactInformation property', () => {
      contactInformation = personalInformation.contactInformation as VendorUserContactInformationDomainAdapter;
    });
    And('I get the email property', () => {
      result = contactInformation.email;
    });
    Then('it should return the correct email', () => {
      expect(result).toBe('vendor@example.com');
    });
    When('I set the email property to "contact@example.com"', () => {
      contactInformation.email = 'contact@example.com';
    });
    Then('the contactInformation\'s email should be "contact@example.com"', () => {
      expect(doc.personalInformation?.contactInformation?.email).toBe('contact@example.com');
    });
  });
});

test.for(typeConverterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let converter: VendorUserConverter;
  let doc: Models.User.VendorUser;
  let domainObject: VendorUser<VendorUserDomainAdapter>;
  let result: VendorUser<VendorUserDomainAdapter> | Models.User.VendorUser | undefined;

  BeforeEachScenario(() => {
    converter = new VendorUserConverter();
    doc = makeVendorUserDoc();
    domainObject = {} as VendorUser<VendorUserDomainAdapter>;
    result = undefined;
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose VendorUser document with userType "vendor-user", externalId "123e4567-e89b-12d3-a456-426614174001", email "vendor@example.com", displayName "Test Vendor", accessBlocked false, and tags ["tag1", "tag2"]',
      () => {
        doc = makeVendorUserDoc();
      }
    );
  });

  Scenario('Converting a Mongoose VendorUser document to a domain object', ({ Given, When, Then, And }) => {
    Given('a VendorUserConverter instance', () => {
      converter = new VendorUserConverter();
    });
    When('I call toDomain with the Mongoose VendorUser document', () => {
      result = converter.toDomain(doc, makeMockPassport()) as VendorUser<VendorUserDomainAdapter>;
    });
    Then('I should receive a VendorUser domain object', () => {
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(VendorUserClass);
    });
    And('the domain object\'s userType should be "vendor-user"', () => {
      expect(result?.userType).toBe('vendor-user');
    });
    And('the domain object\'s externalId should be "123e4567-e89b-12d3-a456-426614174001"', () => {
      expect(result?.externalId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });
    And('the domain object\'s email should be "vendor@example.com"', () => {
      expect(result?.email).toBe('vendor@example.com');
    });
    And('the domain object\'s displayName should be "Test Vendor"', () => {
      expect(result?.displayName).toBe('Test Vendor');
    });
    And('the domain object\'s accessBlocked should be false', () => {
      expect(result?.accessBlocked).toBe(false);
    });
    And('the domain object\'s tags should be ["tag1", "tag2"]', () => {
      expect(result?.tags).toEqual(['tag1', 'tag2']);
    });
  });

  Scenario('Converting a domain object to a Mongoose VendorUser document', ({ Given, When, Then, And }) => {
    Given('a VendorUserConverter instance', () => {
      converter = new VendorUserConverter();
    });
    And('a VendorUser domain object with userType "vendor-user", externalId "123e4567-e89b-12d3-a456-426614174002", email "new-vendor@example.com", displayName "New Vendor", accessBlocked true, and tags ["tag3"]', () => {
      // Create a mock domain object
      const mockAdapter = new VendorUserDomainAdapter(makeVendorUserDoc({
        externalId: '123e4567-e89b-12d3-a456-426614174002',
        email: 'new-vendor@example.com',
        displayName: 'New Vendor',
        accessBlocked: true,
        tags: ['tag3'],
      }));
      domainObject = new VendorUserClass(mockAdapter, makeMockPassport());
    });
    When('I call toPersistence with the VendorUser domain object', () => {
      result = converter.toPersistence(domainObject) as Models.User.VendorUser;
    });
    Then('I should receive a Mongoose VendorUser document', () => {
      expect(result).toBeDefined();
      expect(result).toHaveProperty('userType');
      expect(result).toHaveProperty('externalId');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('displayName');
      expect(result).toHaveProperty('accessBlocked');
      expect(result).toHaveProperty('tags');
    });
    And('the document\'s userType should be "vendor-user"', () => {
      expect(result?.userType).toBe('vendor-user');
    });
    And('the document\'s externalId should be "123e4567-e89b-12d3-a456-426614174002"', () => {
      expect(result?.externalId).toBe('123e4567-e89b-12d3-a456-426614174002');
    });
    And('the document\'s email should be "new-vendor@example.com"', () => {
      expect(result?.email).toBe('new-vendor@example.com');
    });
    And('the document\'s displayName should be "New Vendor"', () => {
      expect(result?.displayName).toBe('New Vendor');
    });
    And('the document\'s accessBlocked should be true', () => {
      expect(result?.accessBlocked).toBe(true);
    });
    And('the document\'s tags should be ["tag3"]', () => {
      expect(result?.tags).toEqual(['tag3']);
    });
  });
});