import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReference, type ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceProps } from './violation-ticket-v1-finance-details-adhoc-transactions-transaction-reference.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/violation-ticket-v1-finance-details-adhoc-transactions-transaction-reference.feature'),
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let transactionReference: ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReference;
  let props: ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReferenceProps;

  BeforeEachScenario(() => {
    props = {
      referenceId: 'ref-123',
      completedOn: new Date('2023-01-01'),
      vendor: 'Test Vendor'
    };
  });

  Scenario('Creating a new ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReference instance', ({ When, Then, And }) => {
    When('I create a new ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReference with valid properties', () => {
      transactionReference = new ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReference(props);
    });

    Then('the reference ID should be accessible', () => {
      expect(transactionReference.referenceId).toBe('ref-123');
    });

    And('the completed on date should be accessible', () => {
      expect(transactionReference.completedOn).toEqual(new Date('2023-01-01'));
    });

    And('the vendor should be accessible', () => {
      expect(transactionReference.vendor).toBe('Test Vendor');
    });
  });
});