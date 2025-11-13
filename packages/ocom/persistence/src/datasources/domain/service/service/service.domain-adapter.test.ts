import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { Passport } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import {
  ServiceConverter,
  ServiceDomainAdapter,
} from './service.domain-adapter.ts';
import { CommunityDomainAdapter } from '../../community/community/community.domain-adapter.ts';

import { Community } from '@ocom/domain/contexts/community/community';
import { Service } from '@ocom/domain/contexts/service/service';
const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const domainAdapterFeature = await loadFeature(
  path.resolve(__dirname, 'features/service.domain-adapter.feature')
);
const typeConverterFeature = await loadFeature(
  path.resolve(__dirname, 'features/service.type-converter.feature')
);

function makeServiceDoc(overrides: Partial<Models.Service.Service> = {}) {
  return {
    serviceName: 'Test Service',
    description: 'Test service description',
    isActive: true,
    community: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    set(key: keyof Models.Service.Service, value: unknown) {
      // Type-safe property assignment
      (this as Models.Service.Service)[key] = value as never;
    },
    populate(path: string) {
      // Mock populate method for testing
      if (path === 'community' && this.community instanceof MongooseSeedwork.ObjectId) {
        this.community = makeCommunityDoc();
      }
      return this;
    },
    ...overrides,
  } as Models.Service.Service;
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

function makeMockPassport() {
  return {
    community: {
      forCommunity: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
    service: {
      forService: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Passport;
}

test.for(domainAdapterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let doc: Models.Service.Service;
  let adapter: ServiceDomainAdapter;
  let communityAdapter: CommunityDomainAdapter;
  let communityDoc: Models.Community.Community;
  let result: unknown;

  BeforeEachScenario(() => {
    communityDoc = makeCommunityDoc();
    doc = makeServiceDoc({
      community: communityDoc,
    });
    adapter = new ServiceDomainAdapter(doc);
    communityAdapter = new CommunityDomainAdapter(communityDoc);
    result = undefined;
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose Service document with serviceName "Test Service", description "Test service description", and populated community field',
      () => {
        communityDoc = makeCommunityDoc();
        doc = makeServiceDoc({
          community: communityDoc,
        });
        adapter = new ServiceDomainAdapter(doc);
      }
    );
  });

  Scenario('Getting and setting the serviceName property', ({ Given, When, Then }) => {
    Given('a ServiceDomainAdapter for the document', () => {
      adapter = new ServiceDomainAdapter(doc);
    });
    When('I get the serviceName property', () => {
      result = adapter.serviceName;
    });
    Then('it should return "Test Service"', () => {
      expect(result).toBe('Test Service');
    });
    When('I set the serviceName property to "Updated Service"', () => {
      adapter.serviceName = 'Updated Service';
    });
    Then('the document\'s serviceName should be "Updated Service"', () => {
      expect(doc.serviceName).toBe('Updated Service');
    });
  });

  Scenario('Getting and setting the description property', ({ Given, When, Then }) => {
    Given('a ServiceDomainAdapter for the document', () => {
      adapter = new ServiceDomainAdapter(doc);
    });
    When('I get the description property', () => {
      result = adapter.description;
    });
    Then('it should return "Test service description"', () => {
      expect(result).toBe('Test service description');
    });
    When('I set the description property to "Updated description"', () => {
      adapter.description = 'Updated description';
    });
    Then('the document\'s description should be "Updated description"', () => {
      expect(doc.description).toBe('Updated description');
    });
  });

  Scenario('Getting and setting the isActive property', ({ Given, When, Then }) => {
    Given('a ServiceDomainAdapter for the document', () => {
      adapter = new ServiceDomainAdapter(doc);
    });
    When('I get the isActive property', () => {
      result = adapter.isActive;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the isActive property to false', () => {
      adapter.isActive = false;
    });
    Then('the document\'s isActive should be false', () => {
      expect(doc.isActive).toBe(false);
    });
  });

  Scenario('Getting the community property when populated', ({ Given, When, Then }) => {
    Given('a ServiceDomainAdapter for the document', () => {
      adapter = new ServiceDomainAdapter(doc);
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
    Given('a ServiceDomainAdapter for a document with community as an ObjectId', () => {
      doc = makeServiceDoc({ community: new MongooseSeedwork.ObjectId() });
      adapter = new ServiceDomainAdapter(doc);
    });
    When('I get the community property', () => {
      gettingCommunityWhenNotPopulated = () => {
        result = adapter.community;
      };
    });
    Then('an error should be thrown indicating "community is not populated"', () => {
      expect(gettingCommunityWhenNotPopulated).toThrow();
      expect(gettingCommunityWhenNotPopulated).throws(/community is not populated/);
    });
  });

  Scenario('Loading the community', ({ Given, When, Then }) => {
    Given('a ServiceDomainAdapter for a document with community as an ObjectId', () => {
      doc = makeServiceDoc({ community: new MongooseSeedwork.ObjectId() });
      adapter = new ServiceDomainAdapter(doc);
    });
    When('I load the community', async () => {
      result = await adapter.loadCommunity();
    });
    Then('it should populate and return the community', () => {
      expect(result).toBeDefined();
    });
  });

  Scenario('Setting the community property with a valid Community domain object', ({ Given, And, When, Then }) => {
    let communityDomainObj: Community<CommunityDomainAdapter>;
    Given('a ServiceDomainAdapter for the document', () => {
      adapter = new ServiceDomainAdapter(doc);
    });
    And('a valid Community domain object', () => {
      communityAdapter = new CommunityDomainAdapter(communityDoc);
      communityDomainObj = new Community(communityAdapter, makeMockPassport());
    });
    When('I set the community property to the Community domain object', () => {
      adapter.setCommunityRef(communityDomainObj);
    });
    Then('the document\'s community should be set to the community\'s id as ObjectId', () => {
      expect(doc.community).toBeInstanceOf(MongooseSeedwork.ObjectId);
      expect((doc.community as MongooseSeedwork.ObjectId).toString()).toBe(communityDomainObj.id);
    });
  });

  Scenario('Setting the community property with an invalid value', ({ Given, And, When, Then }) => {
    let settingCommunityWithInvalidValue: () => void;
    Given('a ServiceDomainAdapter for the document', () => {
      adapter = new ServiceDomainAdapter(doc);
    });
    And('an object that is not a Community domain object', () => {
      communityAdapter = {} as CommunityDomainAdapter;
    });
    When('I try to set the community property to the invalid object', () => {
      settingCommunityWithInvalidValue = () => {
        adapter.setCommunityRef(communityAdapter);
      };
    });
    Then('an error should be thrown indicating "community reference is missing id"', () => {
      expect(settingCommunityWithInvalidValue).toThrow();
      expect(settingCommunityWithInvalidValue).throws(/community reference is missing id/);
    });
  });

  Scenario('Getting the createdAt property', ({ Given, When, Then }) => {
    Given('a ServiceDomainAdapter for the document', () => {
      adapter = new ServiceDomainAdapter(doc);
    });
    When('I get the createdAt property', () => {
      result = adapter.createdAt;
    });
    Then('it should return the createdAt date', () => {
      expect(result).toBeInstanceOf(Date);
    });
  });

  Scenario('Getting the updatedAt property', ({ Given, When, Then }) => {
    Given('a ServiceDomainAdapter for the document', () => {
      adapter = new ServiceDomainAdapter(doc);
    });
    When('I get the updatedAt property', () => {
      result = adapter.updatedAt;
    });
    Then('it should return the updatedAt date', () => {
      expect(result).toBeInstanceOf(Date);
    });
  });
});

test.for(typeConverterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let doc: Models.Service.Service;
  let communityDoc: Models.Community.Community;
  let converter: ServiceConverter;
  let passport: Passport;
  let result: unknown;

  BeforeEachScenario(() => {
    communityDoc = makeCommunityDoc();
    doc = makeServiceDoc({
      community: communityDoc,
    });
    converter = new ServiceConverter();
    passport = makeMockPassport();
    result = undefined;
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose Service document with serviceName "Test Service", description "Test service description", and populated community field',
      () => {
        communityDoc = makeCommunityDoc();
        doc = makeServiceDoc({
          community: communityDoc,
        });
      }
    );
  });

  Scenario('Converting a Mongoose Service document to a domain object', ({ Given, When, Then, And }) => {
    Given('a ServiceConverter instance', () => {
      converter = new ServiceConverter();
    });
    When('I call toDomain with the Mongoose Service document', () => {
      result = converter.toDomain(doc, passport);
    });
    Then('I should receive a Service domain object', () => {
      expect(result).toBeInstanceOf(Service);
    });
    And('the domain object\'s serviceName should be "Test Service"', () => {
      expect((result as Service<ServiceDomainAdapter>).serviceName).toBe('Test Service');
    });
    And('the domain object\'s description should be "Test service description"', () => {
      expect((result as Service<ServiceDomainAdapter>).description).toBe('Test service description');
    });
  });

  Scenario('Converting a domain object to a Mongoose Service document', ({ Given, And, When, Then }) => {
    let domainObj: Service<ServiceDomainAdapter>;
    let communityAdapter: CommunityDomainAdapter;
    let communityDomainObj: Community<CommunityDomainAdapter>;
    let resultDoc: Models.Service.Service;

    Given('a ServiceConverter instance', () => {
      converter = new ServiceConverter();
    });
    And('a Service domain object with serviceName "New Service", description "New description", and valid community', () => {
      communityAdapter = new CommunityDomainAdapter(communityDoc);
      communityDomainObj = new Community(communityAdapter, passport);

      const serviceDoc = makeServiceDoc({
        serviceName: 'New Service',
        description: 'New description',
        community: communityDoc,
      });
      const adapter = new ServiceDomainAdapter(serviceDoc);
      adapter.setCommunityRef(communityDomainObj);
      domainObj = new Service(adapter, passport);
    });
    When('I call toPersistence with the Service domain object', () => {
      resultDoc = converter.toPersistence(domainObj);
    });
    Then('I should receive a Mongoose Service document', () => {
      expect(resultDoc).toBeDefined();
      expect(resultDoc).toHaveProperty('serviceName');
    });
    And('the document\'s serviceName should be "New Service"', () => {
      expect(resultDoc.serviceName).toBe('New Service');
    });
    And('the document\'s description should be "New description"', () => {
      expect(resultDoc.description).toBe('New description');
    });
  });
});