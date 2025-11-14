import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { DomainSeedwork } from '@cellix/domain-seedwork';
import { ViolationTicketV1RevisionRequest, type ViolationTicketV1RevisionRequestProps } from './violation-ticket-v1-revision-request.ts';
import type { ViolationTicketV1Visa } from './violation-ticket-v1.visa.ts';
import type { MemberEntityReference } from '../../../community/member/member.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/violation-ticket-v1-revision-request.feature'),
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let revisionRequest: ViolationTicketV1RevisionRequest;
  let props: ViolationTicketV1RevisionRequestProps;
  let visa: ViolationTicketV1Visa;
  let memberRef: MemberEntityReference;

  BeforeEachScenario(() => {
    memberRef = { id: 'member-123' } as MemberEntityReference;

    visa = {
      determineIf: vi.fn(() => true)
    } as unknown as ViolationTicketV1Visa;

    props = {
      id: 'revision-123',
      requestedAt: new Date('2023-01-01'),
      requestedBy: memberRef,
      loadRequestedBy: vi.fn(() => Promise.resolve(memberRef)),
      revisionSummary: 'Test revision summary',
      requestedChanges: {
        requestUpdatedAssignment: true,
        requestUpdatedStatus: false,
        requestUpdatedProperty: true,
        requestUpdatedPaymentTransaction: false
      },
      revisionSubmittedAt: undefined
    };
  });

  Scenario('Creating a new ViolationTicketV1RevisionRequest instance', ({ When, Then, And }) => {
    When('I create a new ViolationTicketV1RevisionRequest with valid properties', () => {
      revisionRequest = new ViolationTicketV1RevisionRequest(props, visa);
    });

    Then('the instance should be created successfully', () => {
      expect(revisionRequest).toBeDefined();
      expect(revisionRequest.id).toBe('revision-123');
    });

    And('the requested at should be set correctly', () => {
      expect(revisionRequest.requestedAt).toEqual(new Date('2023-01-01'));
    });

    And('the requested by should be set correctly', () => {
      expect(revisionRequest.requestedBy).toBe(memberRef);
    });

    And('the revision summary should be set correctly', () => {
      expect(revisionRequest.revisionSummary).toBe('Test revision summary');
    });

    And('the requested changes should be set correctly', () => {
      expect(revisionRequest.requestedChanges).toEqual({
        requestUpdatedAssignment: true,
        requestUpdatedStatus: false,
        requestUpdatedProperty: true,
        requestUpdatedPaymentTransaction: false
      });
    });

    And('the revision submitted at should be undefined', () => {
      expect(revisionRequest.revisionSubmittedAt).toBeUndefined();
    });
  });

  Scenario('Setting revision submitted at with proper permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1RevisionRequest instance', () => {
      revisionRequest = new ViolationTicketV1RevisionRequest(props, visa);
    });

    And('I have proper permissions to modify', () => {
      vi.mocked(visa.determineIf).mockReturnValue(true);
    });

    And('I set the revision submitted at', () => {
      const submittedDate = new Date('2023-02-01');
      revisionRequest.revisionSubmittedAt = submittedDate;
    });

    Then('the revision submitted at should be updated', () => {
      expect(revisionRequest.revisionSubmittedAt).toEqual(new Date('2023-02-01'));
    });
  });

  Scenario('Setting revision submitted at without permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1RevisionRequest instance', () => {
      revisionRequest = new ViolationTicketV1RevisionRequest(props, visa);
    });

    And('I do not have proper permissions to modify', () => {
      vi.mocked(visa.determineIf).mockReturnValue(false);
    });

    And('I set the revision submitted at', () => {
      expect(() => {
        revisionRequest.revisionSubmittedAt = new Date('2023-02-01');
      }).toThrow(DomainSeedwork.PermissionError);
    });

    Then('a PermissionError should be thrown', () => {
      // Already checked
    });
  });

  Scenario('Loading requested by reference', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1RevisionRequest instance', () => {
      revisionRequest = new ViolationTicketV1RevisionRequest(props, visa);
    });

    And('I call loadRequestedBy', async () => {
      const result = await revisionRequest.loadRequestedBy();
      expect(result).toBe(memberRef);
    });

    Then('it should return the member entity reference', () => {
      // Already checked
    });
  });
});