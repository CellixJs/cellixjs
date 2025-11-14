import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { DomainSeedwork } from '@cellix/domain-seedwork';
import { expect, vi } from 'vitest';
import type { MemberEntityReference } from '../../../community/member/member.ts';
import type { ServiceTicketV1Visa } from './service-ticket-v1.visa.ts';
import { ServiceTicketV1Message, type ServiceTicketV1MessageProps } from './service-ticket-v1-message.entity.ts';
import * as ValueObjects from './service-ticket-v1-message.value-objects.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/service-ticket-v1-message.entity.feature'),
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let message: ServiceTicketV1Message;
  let visa: ServiceTicketV1Visa;
  let props: ServiceTicketV1MessageProps;
  let memberRef: MemberEntityReference;

  BeforeEachScenario(() => {
    // Mock visa
    visa = {
      determineIf: vi.fn(() => true), // Default to true, override in scenarios
    };

    // Mock member reference
    memberRef = { id: 'member-123' } as MemberEntityReference;

    // Mock props
    props = {
      id: 'message-123',
      sentBy: 'internal',
      initiatedBy: memberRef,
      loadInitiatedBy: vi.fn(() => Promise.resolve(memberRef)),
      message: 'Test message',
      embedding: 'test-embedding',
      createdAt: new Date(),
      isHiddenFromApplicant: false,
    } as ServiceTicketV1MessageProps;
  });

  Scenario('Creating a new ServiceTicketV1Message instance', ({ When, Then, And }) => {
    When('I create a new ServiceTicketV1Message with valid properties', () => {
      message = new ServiceTicketV1Message(props, visa);
    });

    Then('the instance should be created successfully', () => {
      expect(message).toBeDefined();
      expect(message.id).toBe('message-123');
    });

    And('the sentBy should be "internal"', () => {
      expect(message.sentBy).toBe('internal');
    });

    And('the message should be "Test message"', () => {
      expect(message.message).toBe('Test message');
    });

    And('the embedding should be "test-embedding"', () => {
      expect(message.embedding).toBe('test-embedding');
    });

    And('the isHiddenFromApplicant should be false', () => {
      expect(message.isHiddenFromApplicant).toBe(false);
    });
  });

  Scenario('Setting sentBy with proper permissions', ({ When, Then, And }) => {
    When('I have a ServiceTicketV1Message instance', () => {
      message = new ServiceTicketV1Message(props, visa);
    });

    And('I have proper permissions to modify messages', () => {
      vi.mocked(visa.determineIf).mockReturnValue(true);
    });

    And('I set the sentBy to "external"', () => {
      message.sentBy = new ValueObjects.SentBy('external');
    });

    Then('the sentBy should be updated to "external"', () => {
      expect(message.sentBy).toBe('external');
    });
  });

  Scenario('Setting sentBy without permissions', ({ When, Then, And }) => {
    When('I have a ServiceTicketV1Message instance', () => {
      message = new ServiceTicketV1Message(props, visa);
    });

    And('I do not have proper permissions to modify messages', () => {
      vi.mocked(visa.determineIf).mockReturnValue(false);
    });

    And('I set the sentBy to "external"', () => {
      expect(() => { message.sentBy = new ValueObjects.SentBy('external'); }).toThrow(DomainSeedwork.PermissionError);
    });

    Then('a PermissionError should be thrown', () => {
      // Already checked
    });
  });

  Scenario('Setting message with proper permissions', ({ When, Then, And }) => {
    When('I have a ServiceTicketV1Message instance', () => {
      message = new ServiceTicketV1Message(props, visa);
    });

    And('I have proper permissions to modify messages', () => {
      vi.mocked(visa.determineIf).mockReturnValue(true);
    });

    And('I set the message to "Updated message"', () => {
      message.message = new ValueObjects.Message('Updated message');
    });

    Then('the message should be updated to "Updated message"', () => {
      expect(message.message).toBe('Updated message');
    });
  });

  Scenario('Setting message without permissions', ({ When, Then, And }) => {
    When('I have a ServiceTicketV1Message instance', () => {
      message = new ServiceTicketV1Message(props, visa);
    });

    And('I do not have proper permissions to modify messages', () => {
      vi.mocked(visa.determineIf).mockReturnValue(false);
    });

    And('I set the message to "Updated message"', () => {
      expect(() => { message.message = new ValueObjects.Message('Updated message'); }).toThrow(DomainSeedwork.PermissionError);
    });

    Then('a PermissionError should be thrown', () => {
      // Already checked
    });
  });

  Scenario('Setting embedding with proper permissions', ({ When, Then, And }) => {
    When('I have a ServiceTicketV1Message instance', () => {
      message = new ServiceTicketV1Message(props, visa);
    });

    And('I have proper permissions to modify messages', () => {
      vi.mocked(visa.determineIf).mockReturnValue(true);
    });

    And('I set the embedding to "updated-embedding"', () => {
      message.embedding = new ValueObjects.Embedding('updated-embedding');
    });

    Then('the embedding should be updated to "updated-embedding"', () => {
      expect(message.embedding).toBe('updated-embedding');
    });
  });

  Scenario('Setting embedding without permissions', ({ When, Then, And }) => {
    When('I have a ServiceTicketV1Message instance', () => {
      message = new ServiceTicketV1Message(props, visa);
    });

    And('I do not have proper permissions to modify messages', () => {
      vi.mocked(visa.determineIf).mockReturnValue(false);
    });

    And('I set the embedding to "updated-embedding"', () => {
      expect(() => { message.embedding = new ValueObjects.Embedding('updated-embedding'); }).toThrow(DomainSeedwork.PermissionError);
    });

    Then('a PermissionError should be thrown', () => {
      // Already checked
    });
  });

  Scenario('Setting createdAt with system account permissions', ({ When, Then, And }) => {
    When('I have a ServiceTicketV1Message instance', () => {
      message = new ServiceTicketV1Message(props, visa);
    });

    And('I have system account permissions', () => {
      vi.mocked(visa.determineIf).mockReturnValue(true);
    });

    And('I set the createdAt to a new date', () => {
      const newDate = new Date('2024-01-01');
      message.createdAt = newDate;
    });

    Then('the createdAt should be updated', () => {
      expect(message.createdAt).toEqual(new Date('2024-01-01'));
    });
  });

  Scenario('Setting createdAt without system account permissions', ({ When, Then, And }) => {
    When('I have a ServiceTicketV1Message instance', () => {
      message = new ServiceTicketV1Message(props, visa);
    });

    And('I do not have system account permissions', () => {
      vi.mocked(visa.determineIf).mockReturnValue(false);
    });

    And('I set the createdAt to a new date', () => {
      const newDate = new Date('2024-01-01');
      expect(() => { message.createdAt = newDate; }).toThrow(DomainSeedwork.PermissionError);
    });

    Then('a PermissionError should be thrown', () => {
      // Already checked
    });
  });

  Scenario('Setting isHiddenFromApplicant with proper permissions', ({ When, Then, And }) => {
    When('I have a ServiceTicketV1Message instance', () => {
      message = new ServiceTicketV1Message(props, visa);
    });

    And('I have proper permissions to modify messages', () => {
      vi.mocked(visa.determineIf).mockReturnValue(true);
    });

    And('I set the isHiddenFromApplicant to true', () => {
      message.isHiddenFromApplicant = true;
    });

    Then('the isHiddenFromApplicant should be true', () => {
      expect(message.isHiddenFromApplicant).toBe(true);
    });
  });

  Scenario('Setting isHiddenFromApplicant without permissions', ({ When, Then, And }) => {
    When('I have a ServiceTicketV1Message instance', () => {
      message = new ServiceTicketV1Message(props, visa);
    });

    And('I do not have proper permissions to modify messages', () => {
      vi.mocked(visa.determineIf).mockReturnValue(false);
    });

    And('I set the isHiddenFromApplicant to true', () => {
      expect(() => { message.isHiddenFromApplicant = true; }).toThrow(DomainSeedwork.PermissionError);
    });

    Then('a PermissionError should be thrown', () => {
      // Already checked
    });
  });
});