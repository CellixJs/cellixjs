import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { Passport } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';

const test = { for: describeFeature };
import {
  EndUserConverter,
  EndUserDomainAdapter,
  EndUserPersonalInformationDomainAdapter,
  EndUserIdentityDetailsDomainAdapter,
  EndUserContactInformationDomainAdapter,
} from './end-user.domain-adapter.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const domainAdapterFeature = await loadFeature(
  path.resolve(__dirname, 'features/end-user.domain-adapter.feature')
);
const typeConverterFeature = await loadFeature(
  path.resolve(__dirname, 'features/end-user.type-converter.feature')
);

function makeEndUserDoc(overrides: Partial<Models.User.EndUser> = {}) {
  const base = {
    userType: 'end-user',
    externalId: '123e4567-e89b-12d3-a456-426614174001',
    email: 'user@example.com',
    displayName: 'Test User',
    accessBlocked: false,
    tags: ['tag1', 'tag2'],
    personalInformation: {
      identityDetails: {
        lastName: 'Doe',
        legalNameConsistsOfOneName: false,
        restOfName: 'John',
      },
      contactInformation: {
        email: 'user@example.com',
      },
    },
    ...overrides,
  } as Models.User.EndUser;
  return vi.mocked(base);
}

function makeMockPassport() {
  return {
    user: {
      forEndUser: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Domain.Passport;
}

test.for(domainAdapterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let doc: Models.User.EndUser;
  let adapter: EndUserDomainAdapter;
  let result: unknown;

  BeforeEachScenario(() => {
    doc = makeEndUserDoc();
    adapter = new EndUserDomainAdapter(doc);
    result = undefined;
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose EndUser document with userType "end-user", externalId "123e4567-e89b-12d3-a456-426614174001", email "user@example.com", displayName "Test User", accessBlocked false, and tags ["tag1", "tag2"]',
      () => {
        doc = makeEndUserDoc();
        adapter = new EndUserDomainAdapter(doc);
      }
    );
  });

  Scenario('Getting the userType property', ({ Given, When, Then }) => {
    Given('an EndUserDomainAdapter for the document', () => {
      adapter = new EndUserDomainAdapter(doc);
    });
    When('I get the userType property', () => {
      result = adapter.userType;
    });
    Then('it should return "end-user"', () => {
      expect(result).toBe('end-user');
    });
  });

  Scenario('Getting and setting the externalId property', ({ Given, When, Then }) => {
    Given('an EndUserDomainAdapter for the document', () => {
      adapter = new EndUserDomainAdapter(doc);
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
    Given('an EndUserDomainAdapter for the document', () => {
      adapter = new EndUserDomainAdapter(doc);
    });
    When('I get the email property', () => {
      result = adapter.email;
    });
    Then('it should return "user@example.com"', () => {
      expect(result).toBe('user@example.com');
    });
    When('I set the email property to "new@example.com"', () => {
      adapter.email = 'new@example.com';
    });
    Then('the document\'s email should be "new@example.com"', () => {
      expect(doc.email).toBe('new@example.com');
    });
  });

  Scenario('Getting and setting the displayName property', ({ Given, When, Then }) => {
    Given('an EndUserDomainAdapter for the document', () => {
      adapter = new EndUserDomainAdapter(doc);
    });
    When('I get the displayName property', () => {
      result = adapter.displayName;
    });
    Then('it should return "Test User"', () => {
      expect(result).toBe('Test User');
    });
    When('I set the displayName property to "New Name"', () => {
      adapter.displayName = 'New Name';
    });
    Then('the document\'s displayName should be "New Name"', () => {
      expect(doc.displayName).toBe('New Name');
    });
  });

  Scenario('Getting and setting the accessBlocked property', ({ Given, When, Then }) => {
    Given('an EndUserDomainAdapter for the document', () => {
      adapter = new EndUserDomainAdapter(doc);
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
    Given('an EndUserDomainAdapter for the document', () => {
      adapter = new EndUserDomainAdapter(doc);
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
    Given('an EndUserDomainAdapter for the document', () => {
      adapter = new EndUserDomainAdapter(doc);
    });
    When('I get the personalInformation property', () => {
      result = adapter.personalInformation;
    });
    Then('it should return an EndUserPersonalInformationDomainAdapter instance with the correct data', () => {
      expect(result).toBeInstanceOf(EndUserPersonalInformationDomainAdapter);
      expect((result as EndUserPersonalInformationDomainAdapter).identityDetails.lastName).toBe('Doe');
    });
  });

    Scenario('Getting the personalInformation property when not defined on the document', ({ Given, When, Then, And }) => {
    let docWithNoPersonalInfo: Models.User.EndUser;
    let adapterWithNoPersonalInfo: EndUserDomainAdapter;
    let setCalled = false;
    Given('an EndUserDomainAdapter for a document with no personalInformation', () => {
      docWithNoPersonalInfo = {
        ...makeEndUserDoc(),
        personalInformation: undefined,
        set: (key: keyof Models.User.EndUser, value: unknown) => {
          if (key === 'personalInformation') { setCalled = true };
          (docWithNoPersonalInfo as Models.User.EndUser)[key] = value as never;
        },
      } as unknown as Models.User.EndUser;
      adapterWithNoPersonalInfo = new EndUserDomainAdapter(docWithNoPersonalInfo);
    });
    When('I get the personalInformation property', () => {
      result = adapterWithNoPersonalInfo.personalInformation;
    });
    Then('it should return an EndUserPersonalInformationDomainAdapter instance with the correct data', () => {
      expect(result).toBeInstanceOf(EndUserPersonalInformationDomainAdapter);
    });
    And('the set method should be called for "personalInformation"', () => {
      expect(setCalled).toBe(true);
    });
  });

  Scenario('Getting the identityDetails property from personalInformation', ({ Given, When, Then, And }) => {
    let personalInfo: EndUserPersonalInformationDomainAdapter;
    Given('an EndUserDomainAdapter for the document', () => {
      adapter = new EndUserDomainAdapter(doc);
    });
    When('I get the personalInformation property', () => {
      personalInfo = adapter.personalInformation;
    });
    And('I get the identityDetails property', () => {
      result = personalInfo.identityDetails;
    });
    Then('it should return an EndUserIdentityDetailsDomainAdapter instance with the correct data', () => {
      expect(result).toBeInstanceOf(EndUserIdentityDetailsDomainAdapter);
      expect((result as EndUserIdentityDetailsDomainAdapter).lastName).toBe('Doe');
    });
  });

    Scenario('Getting the identityDetails property when not defined on personalInformation', ({ Given, When, And, Then }) => {
    let docWithNoIdentityDetails: Models.User.EndUser;
    let adapterWithNoIdentityDetails: EndUserDomainAdapter;
    let setCalled = false;
    let personalInfo: EndUserPersonalInformationDomainAdapter;
    Given('an EndUserDomainAdapter for a document with no identityDetails', () => {
      docWithNoIdentityDetails = makeEndUserDoc({
        personalInformation: {
          identityDetails: undefined,
          contactInformation: { email: 'user@example.com' },
          set: (key: keyof Models.User.EndUserPersonalInformation, value: unknown) => {
            if (key === 'identityDetails') { setCalled = true; }
            (docWithNoIdentityDetails.personalInformation as Models.User.EndUserPersonalInformation)[key] = value as never;
          },
        },
      } as unknown as Models.User.EndUser);
      adapterWithNoIdentityDetails = new EndUserDomainAdapter(docWithNoIdentityDetails);
    });
    When('I get the personalInformation property', () => {
      personalInfo = adapterWithNoIdentityDetails.personalInformation;
    });
    And('I get the identityDetails property', () => {
      result = personalInfo.identityDetails;
    });
    Then('it should return an EndUserIdentityDetailsDomainAdapter instance with the correct data', () => {
      expect(result).toBeInstanceOf(EndUserIdentityDetailsDomainAdapter);
    });
    And('the set method should be called for "identityDetails"', () => {
      expect(setCalled).toBe(true);
    });
  });

  Scenario('Getting and setting the lastName property from identityDetails', ({ Given, When, And, Then }) => {
    let identityDetails: EndUserIdentityDetailsDomainAdapter;
    Given('an EndUserDomainAdapter for the document', () => {
      adapter = new EndUserDomainAdapter(doc);
    });
    When('I get the personalInformation property', () => {
      result = adapter.personalInformation;
    });
    And('I get the identityDetails property', () => {
      identityDetails = (result as EndUserPersonalInformationDomainAdapter).identityDetails;
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
      expect(identityDetails.lastName).toBe('Smith');
      expect(doc.personalInformation.identityDetails.lastName).toBe('Smith');
    });
  });

  Scenario('Getting and setting the legalNameConsistsOfOneName property from identityDetails', ({ Given, When, And, Then }) => {
    let identityDetails: EndUserIdentityDetailsDomainAdapter;
    Given('an EndUserDomainAdapter for the document', () => {
      adapter = new EndUserDomainAdapter(doc);
    });
    When('I get the personalInformation property', () => {
      result = adapter.personalInformation;
    });
    And('I get the identityDetails property', () => {
      identityDetails = (result as EndUserPersonalInformationDomainAdapter).identityDetails;
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
      expect(identityDetails.legalNameConsistsOfOneName).toBe(true);
      expect(doc.personalInformation.identityDetails.legalNameConsistsOfOneName).toBe(true);
    });
  });

  Scenario('Getting and setting the restOfName property from identityDetails', ({ Given, When, And, Then }) => {
    let identityDetails: EndUserIdentityDetailsDomainAdapter;
    Given('an EndUserDomainAdapter for the document', () => {
      adapter = new EndUserDomainAdapter(doc);
    });
    When('I get the personalInformation property', () => {
      result = adapter.personalInformation;
    });
    And('I get the identityDetails property', () => {
      identityDetails = (result as EndUserPersonalInformationDomainAdapter).identityDetails;
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
      expect(identityDetails.restOfName).toBe('John');
      expect(doc.personalInformation.identityDetails.restOfName).toBe('John');
    });
  });

  Scenario('Getting the contactInformation property from personalInformation', ({ Given, When, And, Then }) => {
    let personalInfo: EndUserPersonalInformationDomainAdapter;
    Given('an EndUserDomainAdapter for the document', () => {
      adapter = new EndUserDomainAdapter(doc);
    });
    When('I get the personalInformation property', () => {
      personalInfo = adapter.personalInformation;
    });
    And('I get the contactInformation property', () => {
      result = personalInfo.contactInformation;
    });
    Then('it should return an EndUserContactInformationDomainAdapter instance with the correct data', () => {
      expect(result).toBeInstanceOf(EndUserContactInformationDomainAdapter);
      expect((result as EndUserContactInformationDomainAdapter).email).toBe('user@example.com');
    });
  });

    Scenario('Getting the contactInformation property when not defined on personalInformation', ({ Given, When, And, Then }) => {
    let docWithNoContactInfo: Models.User.EndUser;
    let adapterWithNoContactInfo: EndUserDomainAdapter;
    let setCalled = false;
    let personalInfo: EndUserPersonalInformationDomainAdapter;
    Given('an EndUserDomainAdapter for a document with no contactInformation', () => {
      docWithNoContactInfo = makeEndUserDoc({
        personalInformation: {
          identityDetails: { lastName: 'Doe', legalNameConsistsOfOneName: false, restOfName: 'John' },
          contactInformation: undefined,
          set: (key: keyof Models.User.EndUserPersonalInformation, value: unknown) => {
            if (key === 'contactInformation') { setCalled = true; }
            (docWithNoContactInfo.personalInformation as Models.User.EndUserPersonalInformation)[key] = value as never;
          },
        },
      } as unknown as Models.User.EndUser);
      adapterWithNoContactInfo = new EndUserDomainAdapter(docWithNoContactInfo);
    });
    When('I get the personalInformation property', () => {
      personalInfo = adapterWithNoContactInfo.personalInformation;
    });
    And('I get the contactInformation property', () => {
      result = personalInfo.contactInformation;
    });
    Then('it should return an EndUserContactInformationDomainAdapter instance with the correct data', () => {
      expect(result).toBeInstanceOf(EndUserContactInformationDomainAdapter);
    });
    And('the set method should be called for "contactInformation"', () => {
      expect(setCalled).toBe(true);
    });
  });

  Scenario('Getting and setting the email property from contactInformation', ({ Given, When, And, Then }) => {
    let contactInfo: EndUserContactInformationDomainAdapter;
    Given('an EndUserDomainAdapter for the document', () => {
      adapter = new EndUserDomainAdapter(doc);
    });
    When('I get the personalInformation property', () => {
      result = adapter.personalInformation;
    });
    And('I get the contactInformation property', () => {
      contactInfo = (result as EndUserPersonalInformationDomainAdapter).contactInformation;
    });
    And('I get the email property', () => {
      result = contactInfo.email;
    });
    Then('it should return the correct email', () => {
      expect(result).toBe('user@example.com');
    });
    When('I set the email property to "contact@example.com"', () => {
      contactInfo.email = 'contact@example.com';
    });
    Then('the contactInformation\'s email should be "contact@example.com"', () => {
      expect(contactInfo.email).toBe('contact@example.com');
      expect(doc.personalInformation.contactInformation.email).toBe('contact@example.com');
    });
  });
});

test.for(typeConverterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let doc: Models.User.EndUser;
  let converter: EndUserConverter;
  let passport: Passport;
  let result: unknown;

  BeforeEachScenario(() => {
    doc = makeEndUserDoc();
    converter = new EndUserConverter();
    passport = makeMockPassport();
    result = undefined;
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose EndUser document with userType "end-user", externalId "123e4567-e89b-12d3-a456-426614174001", email "user@example.com", displayName "Test User", accessBlocked false, and tags ["tag1", "tag2"]',
      () => {
        doc = makeEndUserDoc();
      }
    );
  });

  Scenario('Converting a Mongoose EndUser document to a domain object', ({ Given, When, Then, And }) => {
    Given('an EndUserConverter instance', () => {
      converter = new EndUserConverter();
    });
    When('I call toDomain with the Mongoose EndUser document', () => {
      result = converter.toDomain(doc, passport);
    });
    Then('I should receive an EndUser domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.User.EndUser.EndUser);
    });
    And('the domain object\'s userType should be "end-user"', () => {
      expect((result as Domain.Contexts.User.EndUser.EndUser<EndUserDomainAdapter>).userType).toBe('end-user');
    });
    And('the domain object\'s externalId should be "123e4567-e89b-12d3-a456-426614174001"', () => {
      expect((result as Domain.Contexts.User.EndUser.EndUser<EndUserDomainAdapter>).externalId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });
    And('the domain object\'s email should be "user@example.com"', () => {
      expect((result as Domain.Contexts.User.EndUser.EndUser<EndUserDomainAdapter>).email).toBe('user@example.com');
    });
    And('the domain object\'s displayName should be "Test User"', () => {
      expect((result as Domain.Contexts.User.EndUser.EndUser<EndUserDomainAdapter>).displayName).toBe('Test User');
    });
    And('the domain object\'s accessBlocked should be false', () => {
      expect((result as Domain.Contexts.User.EndUser.EndUser<EndUserDomainAdapter>).accessBlocked).toBe(false);
    });
    And('the domain object\'s tags should be ["tag1", "tag2"]', () => {
      expect((result as Domain.Contexts.User.EndUser.EndUser<EndUserDomainAdapter>).tags).toEqual(['tag1', 'tag2']);
    });
  });

  Scenario('Converting a domain object to a Mongoose EndUser document', ({ Given, And, When, Then }) => {
    let domainObj: Domain.Contexts.User.EndUser.EndUser<EndUserDomainAdapter>;
    let resultDoc: Models.User.EndUser;
    Given('an EndUserConverter instance', () => {
      converter = new EndUserConverter();
    });
    And('an EndUser domain object with userType "admin", externalId "123e4567-e89b-12d3-a456-426614174002", email "admin@example.com", displayName "Admin User", accessBlocked true, and tags ["admin"]', () => {
      const adapter = new EndUserDomainAdapter(makeEndUserDoc({
        userType: 'admin',
        externalId: '123e4567-e89b-12d3-a456-426614174002',
        email: 'admin@example.com',
        displayName: 'Admin User',
        accessBlocked: true,
        tags: ['admin'],
      }));
      domainObj = new Domain.Contexts.User.EndUser.EndUser(adapter, passport);
    });
    When('I call toPersistence with the EndUser domain object', () => {
      resultDoc = converter.toPersistence(domainObj);
    });
    Then('I should receive a Mongoose EndUser document', () => {
      expect(resultDoc).toBeDefined();
      expect(resultDoc).toHaveProperty('userType');
    });
    And('the document\'s userType should be "admin"', () => {
      expect(resultDoc.userType).toBe('admin');
    });
    And('the document\'s externalId should be "123e4567-e89b-12d3-a456-426614174002"', () => {
      expect(resultDoc.externalId).toBe('123e4567-e89b-12d3-a456-426614174002');
    });
    And('the document\'s email should be "admin@example.com"', () => {
      expect(resultDoc.email).toBe('admin@example.com');
    });
    And('the document\'s displayName should be "Admin User"', () => {
      expect(resultDoc.displayName).toBe('Admin User');
    });
    And('the document\'s accessBlocked should be true', () => {
      expect(resultDoc.accessBlocked).toBe(true);
    });
    And('the document\'s tags should be ["admin"]', () => {
      expect(resultDoc.tags).toEqual(['admin']);
    });
  });
});