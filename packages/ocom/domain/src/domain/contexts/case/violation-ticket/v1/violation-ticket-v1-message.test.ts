import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { DomainSeedwork } from '@cellix/domain-seedwork';
import { ViolationTicketV1Message, type ViolationTicketV1MessageProps } from './violation-ticket-v1-message.ts';
import * as ValueObjects from './violation-ticket-v1-message.value-objects.ts';
import type { ViolationTicketV1Visa } from './violation-ticket-v1.visa.ts';
import type { MemberEntityReference } from '../../../community/member/index.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/violation-ticket-v1-message.feature'),
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let message: ViolationTicketV1Message;
  let visa: ViolationTicketV1Visa;
  let props: ViolationTicketV1MessageProps;
  let memberRef: MemberEntityReference;

  BeforeEachScenario(() => {
    memberRef = { id: 'member-123' } as MemberEntityReference;

    visa = {
      determineIf: vi.fn(() => true)
    } as unknown as ViolationTicketV1Visa;

    props = {
      id: 'message-123',
      sentBy: ValueObjects.SentByCodes.Internal,
      initiatedBy: memberRef,
      loadInitiatedBy: vi.fn(() => Promise.resolve(memberRef)),
      message: 'Test message',
      embedding: 'test-embedding',
      createdAt: new Date(),
      isHiddenFromApplicant: false
    };
  });

  Scenario('Creating a new ViolationTicketV1Message instance', ({ When, Then, And }) => {
    When('I create a new ViolationTicketV1Message with valid properties', () => {
      message = new ViolationTicketV1Message(props, visa);
    });

    Then('the instance should be created successfully', () => {
      expect(message).toBeDefined();
      expect(message.id).toBe('message-123');
    });

    And('the sent by should be set correctly', () => {
      expect(message.sentBy).toBe(ValueObjects.SentByCodes.Internal);
    });

    And('the message should be set correctly', () => {
      expect(message.message).toBe('Test message');
    });

    And('the embedding should be set correctly', () => {
      expect(message.embedding).toBe('test-embedding');
    });

    And('the created at should be set to current date', () => {
      expect(message.createdAt).toBeInstanceOf(Date);
    });

    And('is hidden from applicant should be false', () => {
      expect(message.isHiddenFromApplicant).toBe(false);
    });
  });

  Scenario('Setting sent by with proper permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1Message instance', () => {
      message = new ViolationTicketV1Message(props, visa);
    });

    And('I have proper permissions to modify', () => {
      vi.mocked(visa.determineIf).mockReturnValue(true);
    });

    And('I set the sent by', () => {
      message.sentBy = new ValueObjects.SentBy(ValueObjects.SentByCodes.External);
    });

    Then('the sent by should be updated', () => {
      expect(message.sentBy).toBe(ValueObjects.SentByCodes.External);
    });
  });

  Scenario('Setting sent by without permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1Message instance', () => {
      message = new ViolationTicketV1Message(props, visa);
    });

    And('I do not have proper permissions to modify', () => {
      vi.mocked(visa.determineIf).mockReturnValue(false);
    });

    And('I set the sent by', () => {
      expect(() => {
        message.sentBy = new ValueObjects.SentBy(ValueObjects.SentByCodes.External);
      }).toThrow(DomainSeedwork.PermissionError);
    });

    Then('a PermissionError should be thrown', () => {
      // Already checked
    });
  });

  Scenario('Setting message with proper permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1Message instance', () => {
      message = new ViolationTicketV1Message(props, visa);
    });

    And('I have proper permissions to modify', () => {
      vi.mocked(visa.determineIf).mockReturnValue(true);
    });

    And('I set the message', () => {
      message.message = new ValueObjects.Message('Updated message');
    });

    Then('the message should be updated', () => {
      expect(message.message).toBe('Updated message');
    });
  });

  Scenario('Setting message without permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1Message instance', () => {
      message = new ViolationTicketV1Message(props, visa);
    });

    And('I do not have proper permissions to modify', () => {
      vi.mocked(visa.determineIf).mockReturnValue(false);
    });

    And('I set the message', () => {
      expect(() => {
        message.message = new ValueObjects.Message('Updated message');
      }).toThrow(DomainSeedwork.PermissionError);
    });

    Then('a PermissionError should be thrown', () => {
      // Already checked
    });
  });

  Scenario('Setting embedding with proper permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1Message instance', () => {
      message = new ViolationTicketV1Message(props, visa);
    });

    And('I have proper permissions to modify', () => {
      vi.mocked(visa.determineIf).mockReturnValue(true);
    });

    And('I set the embedding', () => {
      message.embedding = new ValueObjects.Embedding('updated-embedding');
    });

    Then('the embedding should be updated', () => {
      expect(message.embedding).toBe('updated-embedding');
    });
  });

  Scenario('Setting is hidden from applicant with proper permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1Message instance', () => {
      message = new ViolationTicketV1Message(props, visa);
    });

    And('I have proper permissions to modify', () => {
      vi.mocked(visa.determineIf).mockReturnValue(true);
    });

    And('I set is hidden from applicant', () => {
      message.isHiddenFromApplicant = true;
    });

    Then('the visibility should be updated', () => {
      expect(message.isHiddenFromApplicant).toBe(true);
    });
  });

  Scenario('Loading initiated by reference', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1Message instance', () => {
      message = new ViolationTicketV1Message(props, visa);
    });

    And('I call loadInitiatedBy', async () => {
      const result = await message.loadInitiatedBy();
      expect(result).toBe(memberRef);
    });

    Then('it should return the member entity reference', () => {
      // Already checked
    });
  });
});