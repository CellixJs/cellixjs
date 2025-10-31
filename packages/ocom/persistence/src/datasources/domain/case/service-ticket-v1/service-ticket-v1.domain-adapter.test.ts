import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { Domain } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import {
  ServiceTicketV1Converter,
  ServiceTicketV1DomainAdapter,
  ServiceTicketV1ActivityDetailDomainAdapter,
  ServiceTicketV1MessageDomainAdapter
} from './service-ticket-v1.domain-adapter.ts';
import { CommunityDomainAdapter } from '../../community/community/community.domain-adapter.ts';
import { MemberDomainAdapter } from '../../community/member/member.domain-adapter.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/service-ticket-v1.domain-adapter.feature')
);
const typeConverterFeature = await loadFeature(
  path.resolve(__dirname, 'features/service-ticket-v1.type-converter.feature')
);

function makeServiceTicketDoc(overrides: Partial<Models.Case.ServiceTicket> = {}) {
  const base = {
    id: '507f1f77bcf86cd799439011',
    title: 'Test Ticket',
    description: 'Test Description',
    status: 'open',
    priority: 1,
    ticketType: 'maintenance',
    community: undefined,
    property: undefined,
    requestor: undefined,
    assignedTo: undefined,
    service: undefined,
    activityLog: [],
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: '1.0.0',
    hash: '',
    lastIndexed: undefined,
    updateIndexFailedDate: undefined,
    set(key: keyof Models.Case.ServiceTicket, value: unknown) {
      (this as Models.Case.ServiceTicket)[key] = value as never;
    },
    ...overrides,
  } as Models.Case.ServiceTicket;
  return vi.mocked(base);
}

function makeCommunityDoc(overrides: Partial<Models.Community.Community> = {}) {
  return { id: '507f1f77bcf86cd799439012', name: 'Test Community', ...overrides } as Models.Community.Community;
}

function makeMemberDoc(overrides: Partial<Models.Member.Member> = {}) {
  return { id: '507f1f77bcf86cd799439013', memberName: 'Test Member', ...overrides } as Models.Member.Member;
}

function makeActivityDetailDoc(overrides: Partial<Models.Case.ServiceTicketActivityDetail> = {}) {
  return {
    id: '507f1f77bcf86cd799439014',
    activityType: 'created',
    activityDescription: 'Ticket created',
    activityBy: makeMemberDoc(),
    ...overrides,
  } as Models.Case.ServiceTicketActivityDetail;
}

function makeMessageDoc(overrides: Partial<Models.Case.ServiceTicketMessage> = {}) {
  return {
    id: '507f1f77bcf86cd799439015',
    sentBy: 'test@example.com',
    message: 'Test message',
    initiatedBy: makeMemberDoc(),
    createdAt: new Date(),
    isHiddenFromApplicant: false,
    embedding: '',
    ...overrides,
  } as Models.Case.ServiceTicketMessage;
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
    case: {
      forServiceTicketV1: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let adapter: ServiceTicketV1DomainAdapter;
  let doc: Models.Case.ServiceTicket;

  BeforeEachScenario(() => {
    doc = makeServiceTicketDoc();
    adapter = new ServiceTicketV1DomainAdapter(doc);
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose ServiceTicket document with title "Test Ticket", description "Test Description", status "open", priority 1',
      () => {
        doc = makeServiceTicketDoc({
          title: 'Test Ticket',
          description: 'Test Description',
          status: 'open',
          priority: 1,
          ticketType: 'maintenance'
        });
        adapter = new ServiceTicketV1DomainAdapter(doc);
      }
    );
  });

  Scenario('Getting and setting the title property', ({ Given, When, Then }) => {
    Given('a ServiceTicketV1DomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the title property', () => {
      // Test will check the value
    });
    Then('it should return "Test Ticket"', () => {
      expect(adapter.title).toBe('Test Ticket');
    });
    When('I set the title property to "New Title"', () => {
      adapter.title = 'New Title';
    });
    Then('the document\'s title should be "New Title"', () => {
      expect(doc.title).toBe('New Title');
    });
  });

  Scenario('Getting and setting the description property', ({ Given, When, Then }) => {
    Given('a ServiceTicketV1DomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the description property', () => {
      // Test will check the value
    });
    Then('it should return "Test Description"', () => {
      expect(adapter.description).toBe('Test Description');
    });
    When('I set the description property to "New Description"', () => {
      adapter.description = 'New Description';
    });
    Then('the document\'s description should be "New Description"', () => {
      expect(doc.description).toBe('New Description');
    });
  });

  Scenario('Getting and setting the status property', ({ Given, When, Then }) => {
    Given('a ServiceTicketV1DomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the status property', () => {
      // Test will check the value
    });
    Then('it should return "open"', () => {
      expect(adapter.status).toBe('open');
    });
    When('I set the status property to "closed"', () => {
      adapter.status = 'closed';
    });
    Then('the document\'s status should be "closed"', () => {
      expect(doc.status).toBe('closed');
    });
  });

  Scenario('Getting and setting the priority property', ({ Given, When, Then }) => {
    Given('a ServiceTicketV1DomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the priority property', () => {
      // Test will check the value
    });
    Then('it should return 1', () => {
      expect(adapter.priority).toBe(1);
    });
    When('I set the priority property to 2', () => {
      adapter.priority = 2;
    });
    Then('the document\'s priority should be 2', () => {
      expect(doc.priority).toBe(2);
    });
  });

  Scenario('Getting the ticketType property', ({ Given, When, Then }) => {
    Given('a ServiceTicketV1DomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the ticketType property', () => {
      // Test will check the value
    });
    Then('it should return "maintenance"', () => {
      expect(adapter.ticketType).toBe('maintenance');
    });
  });

  Scenario('Getting the communityId property when populated', ({ Given, When, Then }) => {
    Given('a ServiceTicketV1DomainAdapter for the document with populated community', () => {
      doc.community = makeCommunityDoc();
      adapter = new ServiceTicketV1DomainAdapter(doc);
    });
    When('I get the communityId property', () => {
      // Test will check the value
    });
    Then('it should return the community\'s id as a string', () => {
      expect(adapter.communityId).toBe('507f1f77bcf86cd799439012');
    });
  });

  Scenario('Getting the communityId property when not populated', ({ Given, When, Then }) => {
    Given('a ServiceTicketV1DomainAdapter for a document with community as an ObjectId', () => {
      doc.community = new MongooseSeedwork.ObjectId('507f1f77bcf86cd799439012');
      adapter = new ServiceTicketV1DomainAdapter(doc);
    });
    When('I get the communityId property', () => {
      // Test will check the value
    });
    Then('an error should be thrown indicating "community is not populated"', () => {
      expect(() => adapter.communityId).toThrow('community is not populated');
    });
  });

  Scenario('Setting the communityId property', ({ Given, When, Then }) => {
    Given('a ServiceTicketV1DomainAdapter for the document', () => {
      // Already set up
    });
    When('I set the communityId property to "507f1f77bcf86cd799439012"', () => {
      adapter.communityId = '507f1f77bcf86cd799439012';
    });
    Then('the document\'s community should be set to the ObjectId "507f1f77bcf86cd799439012"', () => {
      expect(doc.community).toEqual(new MongooseSeedwork.ObjectId('507f1f77bcf86cd799439012'));
    });
  });

  Scenario('Getting the requestorId property when populated', ({ Given, When, Then }) => {
    Given('a ServiceTicketV1DomainAdapter for the document with populated requestor', () => {
      doc.requestor = makeMemberDoc();
      adapter = new ServiceTicketV1DomainAdapter(doc);
    });
    When('I get the requestorId property', () => {
      // Test will check the value
    });
    Then('it should return the requestor\'s id as a string', () => {
      expect(adapter.requestorId).toBe('507f1f77bcf86cd799439013');
    });
  });

  Scenario('Getting the requestorId property when not populated', ({ Given, When, Then }) => {
    Given('a ServiceTicketV1DomainAdapter for a document with requestor as an ObjectId', () => {
      doc.requestor = new MongooseSeedwork.ObjectId('507f1f77bcf86cd799439013');
      adapter = new ServiceTicketV1DomainAdapter(doc);
    });
    When('I get the requestorId property', () => {
      // Test will check the value
    });
    Then('an error should be thrown indicating "requestor is not populated"', () => {
      expect(() => adapter.requestorId).toThrow('requestor is not populated');
    });
  });

  Scenario('Setting the requestorId property', ({ Given, When, Then }) => {
    Given('a ServiceTicketV1DomainAdapter for the document', () => {
      // Already set up
    });
    When('I set the requestorId property to "507f1f77bcf86cd799439013"', () => {
      adapter.requestorId = '507f1f77bcf86cd799439013';
    });
    Then('the document\'s requestor should be set to the ObjectId "507f1f77bcf86cd799439013"', () => {
      expect(doc.requestor).toEqual(new MongooseSeedwork.ObjectId('507f1f77bcf86cd799439013'));
    });
  });

  Scenario('Getting and setting the propertyId property', ({ Given, When, Then }) => {
    Given('a ServiceTicketV1DomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the propertyId property', () => {
      // Test will check the value
    });
    Then('it should return undefined', () => {
      expect(adapter.propertyId).toBeUndefined();
    });
    When('I set the propertyId property to "507f1f77bcf86cd799439014"', () => {
      adapter.propertyId = '507f1f77bcf86cd799439014';
    });
    Then('the document\'s property should be set to the ObjectId "507f1f77bcf86cd799439014"', () => {
      expect(doc.property).toEqual(new MongooseSeedwork.ObjectId('507f1f77bcf86cd799439014'));
    });
  });

  Scenario('Getting and setting the assignedToId property', ({ Given, When, Then }) => {
    Given('a ServiceTicketV1DomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the assignedToId property', () => {
      // Test will check the value
    });
    Then('it should return undefined', () => {
      expect(adapter.assignedToId).toBeUndefined();
    });
    When('I set the assignedToId property to "507f1f77bcf86cd799439015"', () => {
      adapter.assignedToId = '507f1f77bcf86cd799439015';
    });
    Then('the document\'s assignedTo should be set to the ObjectId "507f1f77bcf86cd799439015"', () => {
      expect(doc.assignedTo).toEqual(new MongooseSeedwork.ObjectId('507f1f77bcf86cd799439015'));
    });
  });

  Scenario('Getting and setting the serviceId property', ({ Given, When, Then }) => {
    Given('a ServiceTicketV1DomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the serviceId property', () => {
      // Test will check the value
    });
    Then('it should return undefined', () => {
      expect(adapter.serviceId).toBeUndefined();
    });
    When('I set the serviceId property to "507f1f77bcf86cd799439016"', () => {
      adapter.serviceId = '507f1f77bcf86cd799439016';
    });
    Then('the document\'s service should be set to the ObjectId "507f1f77bcf86cd799439016"', () => {
      expect(doc.service).toEqual(new MongooseSeedwork.ObjectId('507f1f77bcf86cd799439016'));
    });
  });

  Scenario('Getting the activityLog property', ({ Given, When, Then }) => {
    Given('a ServiceTicketV1DomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the activityLog property', () => {
      // Test will check the value
    });
    Then('it should return a MongoosePropArray of ServiceTicketV1ActivityDetail', () => {
      expect(adapter.activityLog).toBeDefined();
      expect(adapter.activityLog).toBeInstanceOf(MongooseSeedwork.MongoosePropArray);
    });
  });

  Scenario('Getting the messages property', ({ Given, When, Then }) => {
    Given('a ServiceTicketV1DomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the messages property', () => {
      // Test will check the value
    });
    Then('it should return a MongoosePropArray of ServiceTicketV1Message', () => {
      expect(adapter.messages).toBeDefined();
      expect(adapter.messages).toBeInstanceOf(MongooseSeedwork.MongoosePropArray);
    });
  });

  Scenario('Getting readonly properties', ({ Given, When, Then }) => {
    Given('a ServiceTicketV1DomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the createdAt property', () => {
      // Test will check the value
    });
    Then('it should return a Date for createdAt', () => {
      expect(adapter.createdAt).toBeInstanceOf(Date);
    });
    When('I get the updatedAt property', () => {
      // Test will check the value
    });
    Then('it should return a Date for updatedAt', () => {
      expect(adapter.updatedAt).toBeInstanceOf(Date);
    });
    When('I get the schemaVersion property', () => {
      // Test will check the value
    });
    Then('it should return "1.0.0" for schemaVersion', () => {
      expect(adapter.schemaVersion).toBe('1.0.0');
    });
  });

  Scenario('Getting and setting the hash property', ({ Given, When, Then }) => {
    Given('a ServiceTicketV1DomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the hash property', () => {
      // Test will check the value
    });
    Then('it should return ""', () => {
      expect(adapter.hash).toBe('');
    });
    When('I set the hash property to "new-hash"', () => {
      adapter.hash = 'new-hash';
    });
    Then('the document\'s hash should be "new-hash"', () => {
      expect(doc.hash).toBe('new-hash');
    });
  });

  Scenario('Getting and setting the lastIndexed property', ({ Given, When, Then }) => {
    let testDate: Date;
    Given('a ServiceTicketV1DomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the lastIndexed property', () => {
      // Test will check the value
    });
    Then('it should return undefined', () => {
      expect(adapter.lastIndexed).toBeUndefined();
    });
    When('I set the lastIndexed property to a Date', () => {
      testDate = new Date();
      adapter.lastIndexed = testDate;
    });
    Then('the document\'s lastIndexed should be set to that Date', () => {
      expect(doc.lastIndexed).toBe(testDate);
    });
  });

  Scenario('Getting and setting the updateIndexFailedDate property', ({ Given, When, Then }) => {
    let testDate: Date;
    Given('a ServiceTicketV1DomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the updateIndexFailedDate property', () => {
      // Test will check the value
    });
    Then('it should return undefined', () => {
      expect(adapter.updateIndexFailedDate).toBeUndefined();
    });
    When('I set the updateIndexFailedDate property to a Date', () => {
      testDate = new Date();
      adapter.updateIndexFailedDate = testDate;
    });
    Then('the document\'s updateIndexFailedDate should be set to that Date', () => {
      expect(doc.updateIndexFailedDate).toBe(testDate);
    });
  });

  Scenario('Getting activity detail properties', ({ Given, When, Then, And }) => {
    let activityDetail: Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1ActivityDetailProps;

    Given('a ServiceTicketV1ActivityDetailDomainAdapter for a document', () => {
      const activityDoc = makeActivityDetailDoc();
      const adapter = new ServiceTicketV1ActivityDetailDomainAdapter(activityDoc);
      activityDetail = adapter;
    });

    When('I get the activity detail properties', () => {
      // Already have it
    });

    Then('it should have activityType "created"', () => {
      expect(activityDetail.activityType).toBe('created');
    });

    And('activityDescription "Ticket created"', () => {
      expect(activityDetail.activityDescription).toBe('Ticket created');
    });

    And('activityBy should be a member reference', () => {
      expect(activityDetail.activityBy).toBeDefined();
      expect(activityDetail.activityBy.id).toBe('507f1f77bcf86cd799439013');
    });
  });

  Scenario('Setting activity detail properties', ({ Given, When, Then }) => {
    let activityDoc: Models.Case.ServiceTicketActivityDetail;

    Given('a ServiceTicketV1ActivityDetailDomainAdapter for a document', () => {
      activityDoc = makeActivityDetailDoc();
      new ServiceTicketV1ActivityDetailDomainAdapter(activityDoc);
    });

    When('I set the activityType to "updated"', () => {
      const adapter = new ServiceTicketV1ActivityDetailDomainAdapter(activityDoc);
      adapter.activityType = 'updated';
    });

    Then('the document\'s activityType should be "updated"', () => {
      expect(activityDoc.activityType).toBe('updated');
    });
  });

  Scenario('Getting message properties', ({ Given, When, Then, And }) => {
    let message: Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1MessageProps;

    Given('a ServiceTicketV1MessageDomainAdapter for a document', () => {
      const messageDoc = makeMessageDoc();
      const adapter = new ServiceTicketV1MessageDomainAdapter(messageDoc);
      message = adapter;
    });

    When('I get the message properties', () => {
      // Already have it
    });

    Then('it should have sentBy "test@example.com"', () => {
      expect(message.sentBy).toBe('test@example.com');
    });

    And('message "Test message"', () => {
      expect(message.message).toBe('Test message');
    });

    And('initiatedBy should be a member reference', () => {
      expect(message.initiatedBy).toBeDefined();
      expect(message.initiatedBy.id).toBe('507f1f77bcf86cd799439013');
    });
  });

  Scenario('Setting message properties', ({ Given, When, Then }) => {
    let messageDoc: Models.Case.ServiceTicketMessage;

    Given('a ServiceTicketV1MessageDomainAdapter for a document', () => {
      messageDoc = makeMessageDoc();
      new ServiceTicketV1MessageDomainAdapter(messageDoc);
    });

    When('I set the message to "Updated message"', () => {
      const adapter = new ServiceTicketV1MessageDomainAdapter(messageDoc);
      adapter.message = 'Updated message';
    });

    Then('the document\'s message should be "Updated message"', () => {
      expect(messageDoc.message).toBe('Updated message');
    });
  });
});

test.for(typeConverterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let converter: ServiceTicketV1Converter;
  let doc: Models.Case.ServiceTicket;
  let passport: Domain.Passport;
  let result: Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1<ServiceTicketV1DomainAdapter>;

  BeforeEachScenario(() => {
    converter = new ServiceTicketV1Converter();
    doc = makeServiceTicketDoc();
    passport = makeMockPassport();
    result = {} as Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1<ServiceTicketV1DomainAdapter>;
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose ServiceTicket document with title "Test Ticket", description "Test Description", status "open", priority 1, populated community and requestor fields',
      () => {
        const communityDoc = makeCommunityDoc();
        const memberDoc = makeMemberDoc();
        doc = makeServiceTicketDoc({
          title: 'Test Ticket',
          description: 'Test Description',
          status: 'open',
          priority: 1,
          community: communityDoc,
          requestor: memberDoc
        });
      }
    );
  });

  Scenario('Converting a Mongoose ServiceTicket document to a domain object', ({ Given, When, Then, And }) => {
    Given('a ServiceTicketV1Converter instance', () => {
      // Already set up
    });
    When('I call toDomain with the Mongoose ServiceTicket document', () => {
      result = converter.toDomain(doc, passport);
    });
    Then('I should receive a ServiceTicketV1 domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1);
    });
    And('the domain object\'s title should be "Test Ticket"', () => {
      expect((result as Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1<ServiceTicketV1DomainAdapter>).title).toBe('Test Ticket');
    });
    And('the domain object\'s description should be "Test Description"', () => {
      expect((result as Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1<ServiceTicketV1DomainAdapter>).description).toBe('Test Description');
    });
    And('the domain object\'s status should be "open"', () => {
      expect((result as Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1<ServiceTicketV1DomainAdapter>).status).toBe('open');
    });
    And('the domain object\'s priority should be 1', () => {
      expect((result as Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1<ServiceTicketV1DomainAdapter>).priority).toBe(1);
    });
  });

  Scenario('Converting a domain object to a Mongoose ServiceTicket document', ({ Given, And, When, Then }) => {
    let domainObj: Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1<ServiceTicketV1DomainAdapter>;
    let communityAdapter: CommunityDomainAdapter;
    let memberAdapter: MemberDomainAdapter;
    let resultDoc: Models.Case.ServiceTicket;

    Given('a ServiceTicketV1Converter instance', () => {
      // Already set up
    });
    And('a ServiceTicketV1 domain object with title "New Ticket", description "New Description", status "closed", priority 2, and valid community and requestor', () => {
      const communityDoc = makeCommunityDoc();
      const memberDoc = makeMemberDoc({ community: communityDoc });
      communityAdapter = new CommunityDomainAdapter(communityDoc);
      memberAdapter = new MemberDomainAdapter(memberDoc);

      const ticketDoc = makeServiceTicketDoc({
        title: 'New Ticket',
        description: 'New Description',
        status: 'closed',
        priority: 2,
        community: communityDoc,
        requestor: memberDoc,
      });
      const adapter = new ServiceTicketV1DomainAdapter(ticketDoc);
      domainObj = new Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1(adapter, passport);
    });
    When('I call toPersistence with the ServiceTicketV1 domain object', () => {
      resultDoc = converter.toPersistence(domainObj);
    });
    Then('I should receive a Mongoose ServiceTicket document', () => {
      expect(resultDoc).toBeDefined();
      expect(resultDoc).toHaveProperty('title');
    });
    And('the document\'s title should be "New Ticket"', () => {
      expect(resultDoc.title).toBe('New Ticket');
    });
    And('the document\'s description should be "New Description"', () => {
      expect(resultDoc.description).toBe('New Description');
    });
    And('the document\'s status should be "closed"', () => {
      expect(resultDoc.status).toBe('closed');
    });
    And('the document\'s priority should be 2', () => {
      expect(resultDoc.priority).toBe(2);
    });
    And('the document\'s community should be set to the correct community document', () => {
      expect(resultDoc.community).toBe(communityAdapter.doc);
    });
    And('the document\'s requestor should be set to the correct requestor document', () => {
      expect(resultDoc.requestor).toBe(memberAdapter.doc);
    });
  });
});