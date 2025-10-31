import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReference, type ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceProps } from './violation-ticket-v1-finance-details-transactions-submission-transaction-reference.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/violation-ticket-v1-finance-details-transactions-submission-transaction-reference.feature'),
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let transactionReference: ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReference;
  let props: ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReferenceProps;

  BeforeEachScenario(() => {
    props = {
      referenceId: 'ref-456',
      completedOn: new Date('2023-01-02'),
      vendor: 'Another Vendor'
    };
  });

  Scenario('Creating a new ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReference instance', ({ When, Then, And }) => {
    When('I create a new ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReference with valid properties', () => {
      transactionReference = new ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReference(props);
    });

    Then('the reference ID should be accessible', () => {
      expect(transactionReference.referenceId).toBe('ref-456');
    });

    And('the completed on date should be accessible', () => {
      expect(transactionReference.completedOn).toEqual(new Date('2023-01-02'));
    });

    And('the vendor should be accessible', () => {
      expect(transactionReference.vendor).toBe('Another Vendor');
    });
  });
});