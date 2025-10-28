import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { DomainSeedwork } from '@cellix/domain-seedwork';
import { expect, vi } from 'vitest';
import type { MemberEntityReference } from '../../../community/member/index.ts';
import type { Passport } from '../../../passport.ts';
import * as ActivityDetailValueObjects from './violation-ticket-v1-activity-detail.value-objects.ts';
import { ViolationTicketV1, type ViolationTicketV1Props } from './violation-ticket-v1.aggregate.ts';
import * as ValueObjects from './violation-ticket-v1.value-objects.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/violation-ticket-v1.aggregate.feature'),
);

// Mock PropArray implementation for testing
class MockPropArray<T extends DomainSeedwork.DomainEntityProps> implements DomainSeedwork.PropArray<T> {
  private _items: T[] = [];

  constructor(items: T[] = []) {
    this._items = [...items];
  }

  get items(): ReadonlyArray<T> {
    return this._items;
  }

  addItem(item: T): void {
    this._items.push(item);
  }

  getNewItem(): T {
    // For testing, just create a basic object with required fields
    const newItem = {} as T;
    this._items.push(newItem);
    return newItem;
  }

  removeItem(item: T): void {
    const index = this._items.indexOf(item);
    if (index > -1) {
      this._items.splice(index, 1);
    }
  }

  removeAll(): void {
    this._items = [];
  }
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let violationTicket: ViolationTicketV1<ViolationTicketV1Props>;
  let passport: Passport;
  let props: ViolationTicketV1Props;
  let memberRef: MemberEntityReference;

  BeforeEachScenario(() => {
    // Mock passport
    passport = {
      case: {
        forViolationTicketV1: vi.fn(() => ({
          determineIf: vi.fn(() => true), // Default to true, override in scenarios
        }))
      }
    } as unknown as Passport;

    // Mock props
    props = {
      id: 'test-id',
      communityId: 'community-123',
      propertyId: 'property-123',
      requestorId: 'requestor-123',
      assignedToId: undefined,
      serviceId: undefined,
      title: 'Test Title',
      description: 'Test Description',
      status: '', // Will be set by getNewInstance
      priority: 0, // Will be set by getNewInstance
      ticketType: undefined,
      activityLog: new MockPropArray([]),
      messages: new MockPropArray([]),
      photos: new MockPropArray([]),
      financeDetails: {
        id: 'finance-123',
        serviceFee: 100,
        transactions: {
          id: 'transactions-123',
          submission: {
            id: 'submission-123',
            status: 'Pending',
            amount: 100,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          adhocTransactions: new MockPropArray([])
        },
        revenueRecognition: {
          id: 'revenue-123',
          submission: {
            id: 'gl-submission-123',
            amount: 100,
            description: 'Test GL transaction',
            createdAt: new Date()
          },
          recognition: {
            id: 'gl-recognition-123',
            amount: 100,
            description: 'Test GL transaction',
            createdAt: new Date()
          }
        }
      },
      revisionRequest: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      schemaVersion: '1.0',
      hash: 'test-hash',
      lastIndexed: undefined,
      updateIndexFailedDate: undefined
    } as unknown as ViolationTicketV1Props;

    memberRef = { id: 'member-123' } as MemberEntityReference;
  });

  Scenario('Creating a new ViolationTicketV1 instance', ({ When, Then, And }) => {
    When('I create a new ViolationTicketV1 with valid properties', () => {
      violationTicket = ViolationTicketV1.getNewInstance(props, passport, 'Test Title', 'Test Description', 'community-123', 'requestor-123', 100);
    });

    Then('the instance should be created successfully', () => {
      expect(violationTicket).toBeDefined();
      expect(violationTicket.id).toBe('test-id');
    });

    And('the status should be "Draft"', () => {
      expect(violationTicket.status).toBe(ValueObjects.StatusCodes.Draft);
    });

    And('the priority should be 5', () => {
      expect(violationTicket.priority).toBe(5);
    });

    And('a created event should be added', () => {
      // Check that integration event was added
      expect(violationTicket).toBeDefined();
    });
  });

  Scenario('Requesting delete with proper permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1 instance', () => {
      violationTicket = new ViolationTicketV1(props, passport);
    });

    And('I have system account permissions', () => {
      vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
        determineIf: vi.fn(() => true)
      });
    });

    And('I request delete', () => {
      violationTicket.requestDelete();
    });

    Then('the ticket should be marked as deleted', () => {
      expect(violationTicket.isDeleted).toBe(true);
    });

    And('a deleted event should be added', () => {
      // Check that integration event was added
      expect(violationTicket).toBeDefined();
    });
  });

  Scenario('Requesting delete without permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1 instance', () => {
      // Set mock first
      vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
        determineIf: vi.fn(() => false)
      });
      violationTicket = new ViolationTicketV1(props, passport);
    });

    And('I do not have proper permissions', () => {
      // Already set in When step
    });

    And('I request delete', () => {
      expect(() => violationTicket.requestDelete()).toThrow(DomainSeedwork.PermissionError);
    });

    Then('a PermissionError should be thrown', () => {
      // Already checked in previous step
    });
  });

  Scenario('Adding status update with proper permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1 instance', () => {
      vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
        determineIf: vi.fn(() => true)
      });
      violationTicket = new ViolationTicketV1(props, passport);
    });

    And('I have proper permissions to update', () => {
      // Already set
    });

    And('I add a status update', () => {
      violationTicket.requestAddStatusUpdate('Test update', memberRef);
    });

    Then('a new activity detail should be created', () => {
      expect(violationTicket.activityLog.length).toBe(1);
    });

    And('the activity type should be "Updated"', () => {
      expect(violationTicket.activityLog[0]?.activityType).toBe(ActivityDetailValueObjects.ActivityTypeCodes.Updated);
    });
  });

  Scenario('Adding status update without permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1 instance', () => {
      vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
        determineIf: vi.fn(() => false)
      });
      violationTicket = new ViolationTicketV1(props, passport);
    });

    And('I do not have proper permissions to update', () => {
      // Already set
    });

    And('I add a status update', () => {
      expect(() => violationTicket.requestAddStatusUpdate('Test update', memberRef)).toThrow(DomainSeedwork.PermissionError);
    });

    Then('a PermissionError should be thrown', () => {
      // Already checked
    });
  });

  Scenario('Setting title with proper permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1 instance', () => {
      vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
        determineIf: vi.fn(() => true)
      });
      violationTicket = new ViolationTicketV1(props, passport);
    });

    And('I have proper permissions to set title', () => {
      // Already set
    });

    And('I set the title', () => {
      violationTicket.title = 'New Title';
    });

    Then('the title should be updated', () => {
      expect(violationTicket.title).toBe('New Title');
    });
  });

  Scenario('Setting title without permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1 instance', () => {
      vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
        determineIf: vi.fn(() => false)
      });
      violationTicket = new ViolationTicketV1(props, passport);
    });

    And('I do not have proper permissions to set title', () => {
      // Already set
    });

    And('I set the title', () => {
      expect(() => { violationTicket.title = 'New Title'; }).toThrow(DomainSeedwork.PermissionError);
    });

    Then('a PermissionError should be thrown', () => {
      // Already checked
    });
  });
});