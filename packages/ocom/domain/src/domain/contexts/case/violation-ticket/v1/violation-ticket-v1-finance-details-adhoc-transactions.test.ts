import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import { ViolationTicketV1FinanceDetailsAdhocTransactions, type ViolationTicketV1FinanceDetailsAdhocTransactionsProps } from './violation-ticket-v1-finance-details-adhoc-transactions.ts';
import type { ViolationTicketV1FinanceDetailsAdhocTransactionsApprovalEntityReference } from './violation-ticket-v1-finance-details-adhoc-transactions-approval.ts';
import type { ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReferenceEntityReference } from './violation-ticket-v1-finance-details-adhoc-transactions-finance-reference.ts';
import type { ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceEntityReference } from './violation-ticket-v1-finance-details-adhoc-transactions-transaction-reference.ts';
import type { ViolationTicketV1Visa } from './violation-ticket-v1.visa.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/violation-ticket-v1-finance-details-adhoc-transactions.feature'),
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let adhocTransaction: ViolationTicketV1FinanceDetailsAdhocTransactions;
  let props: ViolationTicketV1FinanceDetailsAdhocTransactionsProps;
  let visa: ViolationTicketV1Visa;
  let approval: ViolationTicketV1FinanceDetailsAdhocTransactionsApprovalEntityReference;
  let transactionReference: ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceEntityReference;
  let financeReference: ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReferenceEntityReference;

  BeforeEachScenario(() => {
    approval = { id: 'approval-123' } as unknown as ViolationTicketV1FinanceDetailsAdhocTransactionsApprovalEntityReference;
    transactionReference = { id: 'transaction-ref-123' } as unknown as ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceEntityReference;
    financeReference = { id: 'finance-ref-123' } as unknown as ViolationTicketV1FinanceDetailsAdhocTransactionsFinanceReferenceEntityReference;

    visa = {
      determineIf: vi.fn(() => true)
    } as unknown as ViolationTicketV1Visa;

    props = {
      id: 'adhoc-transaction-123',
      amount: 100.50,
      requestedBy: 'member-123',
      requestedOn: new Date('2023-01-01'),
      reason: 'Test reason',
      approval: approval,
      transactionReference: transactionReference,
      financeReference: financeReference,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    };
  });

  Scenario('Creating a new ViolationTicketV1FinanceDetailsAdhocTransactions instance', ({ When, Then, And }) => {
    When('I create a new ViolationTicketV1FinanceDetailsAdhocTransactions with valid properties', () => {
      adhocTransaction = new ViolationTicketV1FinanceDetailsAdhocTransactions(props, visa);
    });

    Then('the instance should be created successfully', () => {
      expect(adhocTransaction).toBeDefined();
      expect(adhocTransaction.id).toBe('adhoc-transaction-123');
    });

    And('the amount should be set correctly', () => {
      expect(adhocTransaction.amount).toBe(100.50);
    });

    And('the requested by should be set correctly', () => {
      expect(adhocTransaction.requestedBy).toBe('member-123');
    });

    And('the requested on should be set correctly', () => {
      expect(adhocTransaction.requestedOn).toEqual(new Date('2023-01-01'));
    });

    And('the reason should be set correctly', () => {
      expect(adhocTransaction.reason).toBe('Test reason');
    });

    And('the approval should be set correctly', () => {
      expect(adhocTransaction.approval).toBe(approval);
    });

    And('the transaction reference should be set correctly', () => {
      expect(adhocTransaction.transactionReference).toBe(transactionReference);
    });

    And('the finance reference should be set correctly', () => {
      expect(adhocTransaction.financeReference).toBe(financeReference);
    });

    And('the created at should be set correctly', () => {
      expect(adhocTransaction.createdAt).toEqual(new Date('2023-01-01'));
    });

    And('the updated at should be set correctly', () => {
      expect(adhocTransaction.updatedAt).toEqual(new Date('2023-01-01'));
    });
  });

  Scenario('Setting amount with proper permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1FinanceDetailsAdhocTransactions instance', () => {
      adhocTransaction = new ViolationTicketV1FinanceDetailsAdhocTransactions(props, visa);
    });

    And('I have proper permissions to modify', () => {
      vi.mocked(visa.determineIf).mockReturnValue(true);
    });

    And('I set the amount', () => {
      adhocTransaction.amount = 200.75;
    });

    Then('the amount should be updated', () => {
      expect(adhocTransaction.amount).toBe(200.75);
    });
  });

  Scenario('Setting amount without permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1FinanceDetailsAdhocTransactions instance', () => {
      adhocTransaction = new ViolationTicketV1FinanceDetailsAdhocTransactions(props, visa);
    });

    And('I do not have proper permissions to modify', () => {
      vi.mocked(visa.determineIf).mockReturnValue(false);
    });

    And('I set the amount', () => {
      expect(() => {
        adhocTransaction.amount = 200.75;
      }).toThrow(DomainSeedwork.PermissionError);
    });

    Then('a PermissionError should be thrown', () => {
      // Already checked
    });
  });

  Scenario('Setting requested by with proper permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1FinanceDetailsAdhocTransactions instance', () => {
      adhocTransaction = new ViolationTicketV1FinanceDetailsAdhocTransactions(props, visa);
    });

    And('I have proper permissions to modify', () => {
      vi.mocked(visa.determineIf).mockReturnValue(true);
    });

    And('I set the requested by', () => {
      adhocTransaction.requestedBy = 'member-456';
    });

    Then('the requested by should be updated', () => {
      expect(adhocTransaction.requestedBy).toBe('member-456');
    });
  });

  Scenario('Setting requested on with proper permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1FinanceDetailsAdhocTransactions instance', () => {
      adhocTransaction = new ViolationTicketV1FinanceDetailsAdhocTransactions(props, visa);
    });

    And('I have proper permissions to modify', () => {
      vi.mocked(visa.determineIf).mockReturnValue(true);
    });

    And('I set the requested on', () => {
      const newDate = new Date('2023-02-01');
      adhocTransaction.requestedOn = newDate;
    });

    Then('the requested on should be updated', () => {
      expect(adhocTransaction.requestedOn).toEqual(new Date('2023-02-01'));
    });
  });

  Scenario('Setting reason with proper permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1FinanceDetailsAdhocTransactions instance', () => {
      adhocTransaction = new ViolationTicketV1FinanceDetailsAdhocTransactions(props, visa);
    });

    And('I have proper permissions to modify', () => {
      vi.mocked(visa.determineIf).mockReturnValue(true);
    });

    And('I set the reason', () => {
      adhocTransaction.reason = 'Updated reason';
    });

    Then('the reason should be updated', () => {
      expect(adhocTransaction.reason).toBe('Updated reason');
    });
  });
});