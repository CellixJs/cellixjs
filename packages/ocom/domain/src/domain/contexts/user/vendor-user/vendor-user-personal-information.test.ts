import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { VendorUserContactInformationProps } from './vendor-user-contact-information.ts';
import type { VendorUserIdentityDetailsProps } from './vendor-user-identity-details.ts';
import { VendorUserPersonalInformation } from './vendor-user-personal-information.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/vendor-user-personal-information.feature'),
);

function makeVisa() {
  return vi.mocked({
    determineIf: vi.fn(() => true),
  });
}

function makeIdentityDetailsProps(overrides = {}) {
  return {
    lastName: 'Smith',
    legalNameConsistsOfOneName: false,
    restOfName: 'Alice',
    ...overrides,
  };
}

function makeContactInformationProps(overrides = {}) {
  return {
    email: 'alice@cellix.com',
    ...overrides,
  };
}

function makePersonalInformationProps(overrides = {}) {
  return {
    identityDetails: makeIdentityDetailsProps(),
    contactInformation: makeContactInformationProps(),
    ...overrides,
  };
}

describeFeature(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let visa: ReturnType<typeof makeVisa>;
  let identityDetailsProps: ReturnType<typeof makeIdentityDetailsProps>;
  let contactInformationProps: ReturnType<typeof makeContactInformationProps>;
  let personalInformationProps: ReturnType<typeof makePersonalInformationProps>;
  let entity: VendorUserPersonalInformation;

  BeforeEachScenario(() => {
    visa = makeVisa();
    identityDetailsProps = makeIdentityDetailsProps();
    contactInformationProps = makeContactInformationProps();
    personalInformationProps = makePersonalInformationProps();
    entity = new VendorUserPersonalInformation(personalInformationProps, visa);
  });

  Background(({ Given, And }) => {
    Given('valid VendorUserIdentityDetailsProps and VendorUserContactInformationProps', () => {
      identityDetailsProps = makeIdentityDetailsProps();
      contactInformationProps = makeContactInformationProps();
      personalInformationProps = makePersonalInformationProps();
    });
    And('a valid UserVisa', () => {
        // Mock or create a UserVisa instance as needed
        visa = makeVisa();
    });
  });

  Scenario('Creating a new VendorUserPersonalInformation instance', ({ When, Then, And }) => {
    let newEntity: VendorUserPersonalInformation;
    When('I create a new VendorUserPersonalInformation using getNewInstance with the identity details and contact information', () => {
      // The class does not have getNewInstance, so we use the constructor directly
      newEntity = new VendorUserPersonalInformation({
        identityDetails: identityDetailsProps,
        contactInformation: contactInformationProps,
      }, visa);
    });
    Then("the entity's identity details should be set to the provided identity details", () => {
      expect(newEntity.identityDetails).toBeDefined();
      expect(newEntity.identityDetails.lastName).toBe(identityDetailsProps.lastName);
      expect(newEntity.identityDetails.legalNameConsistsOfOneName).toBe(
        identityDetailsProps.legalNameConsistsOfOneName
      );
      expect(newEntity.identityDetails.restOfName).toBe(identityDetailsProps.restOfName);
    });
    And("the entity's contact information should be set to the provided contact information", () => {
      expect(newEntity.contactInformation).toBeDefined();
      expect(newEntity.contactInformation.email).toBe(contactInformationProps.email);
    });
  });

  Scenario('Setting identity details after creation', ({ Given, When, Then }) => {
    let changingIdentityDetailsAfterCreation: () => void;
    Given('an existing VendorUserPersonalInformation instance', () => {
      entity = new VendorUserPersonalInformation(personalInformationProps, visa);
    });
    When('I try to set the identity details', () => {
      changingIdentityDetailsAfterCreation = () => {
        // @ts-expect-error
        entity.identityDetails = makeIdentityDetailsProps({ lastName: 'NewLast' });
      };
    });
    Then('an error should be thrown indicating identity details cannot be set', () => {
      expect(changingIdentityDetailsAfterCreation).toThrow();
    });
  });

  Scenario('Setting contact information after creation', ({ Given, When, Then }) => {
    let changingContactInformationAfterCreation: () => void;
    Given('an existing VendorUserPersonalInformation instance', () => {
      entity = new VendorUserPersonalInformation(personalInformationProps, visa);
    });
    When('I try to set the contact information', () => {
      changingContactInformationAfterCreation = () => {
        // @ts-expect-error
        entity.contactInformation = makeContactInformationProps({ email: 'bob@cellix.com' });
      };
    });
    Then('an error should be thrown indicating contact information cannot be set', () => {
      expect(changingContactInformationAfterCreation).toThrow();
    });
  });

  Scenario('Getting identity details and contact information', ({ Given, When, Then }) => {
    let identityDetails: VendorUserIdentityDetailsProps;
    let contactInformation: VendorUserContactInformationProps;
    Given('a VendorUserPersonalInformation instance', () => {
      entity = new VendorUserPersonalInformation(personalInformationProps, visa);
    });
    When('I access identity details and contact information', () => {
      identityDetails = entity.identityDetails;
      contactInformation = entity.contactInformation;
    });
    Then('I should receive VendorUserIdentityDetails and VendorUserContactInformation entity instances', () => {
      expect(identityDetails).toBeDefined();
      expect(identityDetails.lastName).toBe(personalInformationProps.identityDetails.lastName);
      expect(identityDetails.legalNameConsistsOfOneName).toBe(personalInformationProps.identityDetails.legalNameConsistsOfOneName);
      expect(identityDetails.restOfName).toBe(personalInformationProps.identityDetails.restOfName);
      expect(contactInformation).toBeDefined();
      expect(contactInformation.email).toBe(personalInformationProps.contactInformation.email);
    });
  });
});
