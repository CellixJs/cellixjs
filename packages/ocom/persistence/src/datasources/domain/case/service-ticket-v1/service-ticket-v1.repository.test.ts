import type { EventBus } from '@cellix/domain-seedwork/event-bus';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { Domain } from '@ocom/domain';

import { ServiceTicketV1Repository } from './service-ticket-v1.repository.ts';
import { ServiceTicketV1Converter, type ServiceTicketV1DomainAdapter } from './service-ticket-v1.domain-adapter.ts';
import type { ClientSession } from 'mongoose';
import type { ServiceTicket, ServiceTicketModelType } from '@ocom/data-sources-mongoose-models/case/service-ticket';
import type { Community } from '@ocom/data-sources-mongoose-models/community';
import type { Member } from '@ocom/data-sources-mongoose-models/member';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/service-ticket-v1.repository.feature')
);

function makeServiceTicketDoc(overrides: Partial<ServiceTicket> = {}) {
  const base = {
    id: '507f1f77bcf86cd799439011', // Valid ObjectId string
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
    set(key: keyof ServiceTicket, value: unknown) {
      (this as ServiceTicket)[key] = value as never;
    },
    ...overrides,
  } as ServiceTicket;
  return vi.mocked(base);
}

function makeCommunityDoc(overrides: Partial<Community> = {}) {
  return { id: '507f1f77bcf86cd799439012', name: 'Test Community', ...overrides } as Community;
}

function makeMemberDoc(overrides: Partial<Member> = {}) {
  return { id: '507f1f77bcf86cd799439013', memberName: 'Test Member', ...overrides } as Member;
}

function makeMockPassport() {
  return {
    case: {
        forServiceTicketV1: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
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

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let repo: ServiceTicketV1Repository;
  let converter: ServiceTicketV1Converter;
  let passport: Domain.Passport;
  let serviceTicketDoc: ServiceTicket;
  let communityDoc: Community;
  let memberDoc: Member;
  let result: Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1<ServiceTicketV1DomainAdapter>;

  BeforeEachScenario(() => {
    communityDoc = makeCommunityDoc();
    memberDoc = makeMemberDoc({
        community: communityDoc,
    });
    serviceTicketDoc = makeServiceTicketDoc({
        community: communityDoc,
        requestor: memberDoc,
    });
    converter = new ServiceTicketV1Converter();
    passport = makeMockPassport();
    result = {} as Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1<ServiceTicketV1DomainAdapter>;

    // Mock the Mongoose model as a constructor function with static methods
    const ModelMock = function (this: ServiceTicket) {
      Object.assign(this, makeServiceTicketDoc());
    }
    // Attach static methods to the constructor
    Object.assign(ModelMock, {
      findById: vi.fn((id: string) => ({
        exec: vi.fn(async () => (id === '507f1f77bcf86cd799439011' ? serviceTicketDoc : null)),
      })),
    });

    // Provide minimal eventBus and session mocks (not used in constructor)
    const eventBus = { publish: vi.fn() } as unknown as EventBus;
    const session = { startTransaction: vi.fn(), endSession: vi.fn() } as unknown as ClientSession;

    // Create repository with correct constructor parameters
    repo = new ServiceTicketV1Repository(
      passport,
      ModelMock as unknown as ServiceTicketModelType,
      converter,
      eventBus,
      session
    );
  });

  Background(({ Given, And }) => {
    Given(
      'a ServiceTicketV1Repository instance with a working Mongoose model, type converter, and passport',
      () => {
        // This is set up in BeforeEachScenario
      }
    );
    And(
      'a valid Mongoose ServiceTicket document with id "507f1f77bcf86cd799439011", title "Test Ticket", description "Test Description"',
      () => {
        serviceTicketDoc = makeServiceTicketDoc({
          _id: '507f1f77bcf86cd799439011',
          title: 'Test Ticket',
          description: 'Test Description'
        });
      }
    );
  });

  Scenario('Getting a service ticket by id', ({ When, Then, And }) => {
    When('I call getById with "507f1f77bcf86cd799439011"', async () => {
      result = await repo.getById('507f1f77bcf86cd799439011');
    });
    Then('I should receive a ServiceTicketV1 domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1);
    });
    And('the domain object\'s title should be "Test Ticket"', () => {
      expect(result.title).toBe('Test Ticket');
    });
    And('the domain object\'s description should be "Test Description"', () => {
      expect(result.description).toBe('Test Description');
    });
  });

  Scenario('Getting a service ticket by id that does not exist', ({ When, Then }) => {
    let gettingServiceTicketThatDoesNotExist: () => Promise<Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1<ServiceTicketV1DomainAdapter>>;
    When('I call getById with "nonexistent-id"', () => {
      gettingServiceTicketThatDoesNotExist = async () => await repo.getById('nonexistent-id');
    });
    Then('an error should be thrown indicating "ServiceTicket with id nonexistent-id not found"', async () => {
      await expect(gettingServiceTicketThatDoesNotExist).rejects.toThrow();
      await expect(gettingServiceTicketThatDoesNotExist).rejects.toThrow(/ServiceTicket with id nonexistent-id not found/);
    });
  });

  Scenario('Creating a new service ticket instance', ({ Given, When, Then, And }) => {
    let communityDomainObject: Domain.Contexts.Community.Community.CommunityEntityReference;
    let requestorDomainObject: Domain.Contexts.Community.Member.MemberEntityReference;
    Given('a valid Community domain object as the community', () => {
      communityDomainObject = { id: '507f1f77bcf86cd799439012', name: 'Test Community' } as Domain.Contexts.Community.Community.CommunityEntityReference;
    });
    And('a valid Member domain object as the requestor', () => {
      requestorDomainObject = { id: '507f1f77bcf86cd799439013', memberName: 'Test Member' } as Domain.Contexts.Community.Member.MemberEntityReference;
    });
    When('I call getNewInstance with title "New Ticket", description "New Description", community, and requestor', async () => {
      result = await repo.getNewInstance(
        new Domain.Contexts.Case.ServiceTicket.V1.ValueObjects.Title('New Ticket'),
        new Domain.Contexts.Case.ServiceTicket.V1.ValueObjects.Description('New Description'),
        communityDomainObject,
        requestorDomainObject
      );
    });
    Then('I should receive a new ServiceTicketV1 domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1);
    });
    And('the domain object\'s title should be "New Ticket"', () => {
      expect(result.title).toBe('New Ticket');
    });
    And('the domain object\'s description should be "New Description"', () => {
      expect(result.description).toBe('New Description');
    });
  });
});